from datetime import datetime, timedelta
from django.contrib.auth.tokens import default_token_generator
import random

from django.dispatch import receiver
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from oauthlib.uri_validate import query
from pyexpat.errors import messages
from requests_toolbelt.multipart.encoder import total_len
from rest_framework.decorators import action, permission_classes
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed, ValidationError
from rest_framework.views import APIView
from clinic import serializers, paginators
from rest_framework import viewsets, generics, status, parsers, permissions
from clinic.models import (User, Doctor, Payment, Appointment, Review,
                           Schedule, Notification, HealthRecord, Message, TestResult,
                           Hospital, Specialization, PasswordResetOTP)
from django.db.models import Q, Count, Sum
from rest_framework.response import Response
from clinic.permissions import IsDoctorOrSelf
from clinic.serializers import AppointmentSerializer, PaymentSerializer, NotificationSerializer, UserSerializer, \
    OTPRequestSerializer, OTPConfirmResetSerializer, MessageSerializer


class HospitalViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Hospital.objects.filter(active=True)
    serializer_class = serializers.HospitalSerializer


class SpecializationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Specialization.objects.filter(active=True)
    serializer_class = serializers.SpecializationSerializer

    def get_queryset(self):
        queryset = self.queryset
        # Lấy các chuyên khoa theo tên chuyên khoa
        specialization_name = self.request.query_params.get('name')
        if specialization_name:
            queryset = queryset.filter(name__icontains=specialization_name)
        return queryset


class UserViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    # Chứng thực user để xem thông tin user và chỉnh sửa thông tin user
    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        u = request.user
        if request.method.__eq__('PATCH'):
            for k, v in request.data.items():
                if k.__eq__('password'):
                    u.set_password(v)
                else:
                    setattr(u, k, v)
            u.save()
        return Response(serializers.UserSerializer(u).data)

    @action(methods=['get'], detail=False, url_path='doctors')
    def get_doctors(self, request):
        doctors = User.objects.filter(role='doctor')
        serializer = self.get_serializer(doctors, many=True)
        return Response(serializer.data)

    @action(methods=['get'], detail=False, url_path='patients')
    def get_patients(self, request):
        patients = User.objects.filter(role='patient')
        serializer = self.get_serializer(patients, many=True)
        return Response(serializer.data)


class PasswordResetSendOTPViewSet(APIView):
    permission_classes = []

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            otp = serializer.create_otp(serializer.validated_data['email'])
            return Response({"message": "Đã gửi mã OTP về email."}, status=200)
        return Response(serializer.errors, status=400)


class PasswordResetConfirmOTPViewSet(APIView):
    permission_classes = []

    def post(self, request):
        serializer = OTPConfirmResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Đã đặt lại mật khẩu thành công."}, status=200)
        return Response(serializer.errors, status=400)


class PatientViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = User.objects.filter(role='patient')
    serializer_class = serializers.UserSerializer


class DoctorViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView,
                    generics.UpdateAPIView, generics.RetrieveAPIView):
    queryset = Doctor.objects.select_related('user', 'hospital', 'specialization').all()
    serializer_class = serializers.DoctorSerializer
    parser_classes = [parsers.MultiPartParser]
    filterset_fields = ['hospital', 'specialization']

    def get_queryset(self):
        queryset = super().get_queryset()
        return self.filter_doctors(queryset)

    # Tìm kiếm bác sĩ theo tên, bệnh viện, chuyên khoa
    def filter_doctors(self, queryset):
        params = self.request.query_params

        if (hospital_id := params.get('hospital')):
            queryset = queryset.filter(hospital_id=hospital_id)

        if (specialization_id := params.get('specialization')):
            queryset = queryset.filter(specialization_id=specialization_id)

        if (doctor_name := params.get('name')):
            queryset = queryset.filter(user__full_name__icontains=doctor_name)

        return queryset


class HealthRecordViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = HealthRecord.objects.filter(active=True)
    serializer_class = serializers.HealthRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return HealthRecord.objects.none()  # Hoặc trả về queryset trống
        user = self.request.user
        if user.role == 'patient':
            return HealthRecord.objects.filter(user=user)
        elif user.role == 'doctor':
            return HealthRecord.objects.filter(appointment__schedule__doctor=self.request.user).distinct()
        return HealthRecord.objects.none()

    # Cho phép bệnh nhân tự tạo hồ sơ sức khoẻ
    @action(methods=['post'], detail=False, url_path='me', permission_classes=[permissions.IsAuthenticated])
    def create_healthrecord(self, request):
        user = request.user

        try:
            # Kiểm tra đúng kiểu người dùng
            if user.role != 'patient':
                return Response({"detail": "Chỉ bệnh nhân mới được tạo hồ sơ."}, status=status.HTTP_403_FORBIDDEN)

        except User.DoesNotExist:
            return Response({"detail": "Không tìm thấy thông tin bệnh nhân."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save(user=user)  # Gán đúng đối tượng
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except InterruptedError as error:
                return Response(error, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Bác sĩ update hồ sơ bệnh án của của bệnh nhân
    # Method: PATCH, URL: /healthrecords/{id}/
    def partial_update(self, request, pk=None):
        user = request.user
        # Kiểm tra phân quyền. Chỉ có bác sĩ mới được quyền chỉnh sửa hồ sơ
        if user.role == 'admin':
            return Response({"detail": "Bạn không có quyền chỉnh sửa hồ sơ được quyền chỉnh sửa hồ sơ."},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            record = HealthRecord.objects.get(pk=pk)
        except HealthRecord.DoesNotExist:
            return Response({"detail": "Hồ sơ không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

        is_doctor_examined = Appointment.objects.filter(
            healthrecord=record,
            schedule__doctor=user,
            status='completed'  # chỉ bác sĩ đã từng khám mới có quyền
        ).exists()

        # Nếu không phải chủ hồ sơ hoặc bác sĩ đặt khám
        if not (user == record.user or is_doctor_examined):
            return Response({'detail': "Bạn không có quyền chỉnh sửa hồ sơ"}, status=status.HTTP_403_FORBIDDEN)

        serializer = serializers.HealthRecordSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestResultViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView):
    queryset = TestResult.objects.filter(active=True)
    serializer_class = serializers.TestResultSerializer


def is_more_than_24_hours_ahead(schedule_date, schedule_time):
    """
    Kiểm tra lịch có cách thời điểm hiện tại hơn 24 tiếng không
    :param schedule_date: Ngày của lịch
    :param schedule_time: Thời gian bắt đầu
    :return: True/False
    """
    schedule_datetime = datetime.combine(schedule_date, schedule_time)
    schedule_datetime = timezone.make_aware(schedule_datetime)  # đảm bảo có timezone
    now = timezone.now()

    return schedule_datetime - now >= timedelta(hours=24)


class AppointmentViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.ListAPIView, generics.UpdateAPIView):
    queryset = Appointment.objects.filter().all()
    serializer_class = serializers.AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Appointment.objects.none()  # Hoặc trả về queryset trống
        user = self.request.user
        # Lấy các lịch hẹn của user đăng nhập
        # user là bệnh nhân: Lấy lịch khám do user đó đặt
        if user.role == 'patient':
            return Appointment.objects.filter(healthrecord__user=user)
        # user là bác sĩ: Lấy các lịch khám các user đặt bác sĩ đó
        if user.role == 'doctor':
            return Appointment.objects.filter(schedule__doctor=user)

    @action(detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        appointment = Appointment.objects.get(pk=pk)
        schedule_date = appointment.schedule.date
        schedule_time = appointment.schedule.start_time
        reason_cancel = request.data.get('reason')
        if not appointment:
            return Response({'detail': 'Không tìm thấy lịch khám!'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.cancel:
            return Response({'detail': 'Lịch khám này đã bị huỷ'}, status=status.HTTP_400_BAD_REQUEST)
        if not is_more_than_24_hours_ahead(schedule_date, schedule_time):
            return Response({'error': 'Bạn chỉ được huỷ lịch trước 24 tiếng'}, status=status.HTTP_400_BAD_REQUEST)

        # Huỷ lịch
        appointment.cancel = True
        appointment.status = "cancelled"
        appointment.reason = reason_cancel
        appointment.save()

        # Giảm số lượng đặt lịch khám của bác sĩ
        schedule = appointment.schedule
        if schedule.sum_booking > 0:
            schedule.sum_booking -= 1
        else:
            schedule.sum_booking = 0
        schedule.save()

        return Response('Huỷ lịch khám thành công', status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated])
    def reschedule(self, request, pk=None):
        appointment = Appointment.objects.get(pk=pk)
        schedule_date = appointment.schedule.date
        schedule_time = appointment.schedule.start_time

        if not appointment:
            return Response("Không tìm thấy lịch khám", status=status.HTTP_404_NOT_FOUND)
        if appointment.cancel:
            return Response("Lịch khám đã bị huỷ", status=status.HTTP_404_NOT_FOUND)

        if not is_more_than_24_hours_ahead(schedule_date, schedule_time):
            return Response({'erorr': 'Bạn chỉ được đổi lịch trước 24 tiếng'}, status=status.HTTP_400_BAD_REQUEST)

        # Lấy id của lịch mới
        new_schedule_id = request.data.get('new_schedule_id')
        if not new_schedule_id:
            return Response("Thiếu thông tin của lịch hẹn mới", status=status.HTTP_400_BAD_REQUEST)
        new_schedule = Schedule.objects.get(pk=new_schedule_id)
        print(new_schedule)
        # Kiểm tra lịch mới còn chỗ không
        if new_schedule.sum_booking >= new_schedule.capacity:
            return Response({'Lịch khám mới đã đầy.'}, status=status.HTTP_400_BAD_REQUEST)
            # Kiểm tra trùng lịch (bệnh nhân đã có lịch với new_schedule chưa)
        print(Appointment.objects.filter(healthrecord=appointment.healthrecord, schedule=new_schedule,
                                         cancel=False))
        if Appointment.objects.filter(healthrecord=appointment.healthrecord, schedule=new_schedule,
                                      cancel=False).exists():
            return Response({'detail': 'Bạn đã có lịch khám trong khoảng thời gian này.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Giảm số lượng booking của lịch cũ
        old_schedule = appointment.schedule
        if old_schedule.sum_booking > 0:
            old_schedule.sum_booking -= 1
            old_schedule.save()

        # Cập nhật lịch mới và tăng sum_booking
        appointment.schedule = new_schedule
        appointment.save()

        new_schedule.sum_booking += 1
        new_schedule.save()

        return Response({'detail': 'Đổi lịch khám thành công.'}, status=status.HTTP_200_OK)


@action(methods=['get'], detail=True, url_path="payment")
def get_payment(self, request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    if appointment:
        payment = appointment.payment
        return Response(serializers.PaymentSerializer(payment).data, status=status.HTTP_200_OK)
    else:
        return Response({'error': f'Không tim tìm thấy hoá đơn thanh toán cho lịch khám này'},
                        status=status.HTTP_404_NOT_FOUND)

    return Response({"error": "Không tìm thấy lịch khám!"}, status=status.HTTP_404_NOT_FOUND)


class ScheduleViewSet(viewsets.ViewSet, generics.ListAPIView,
                      generics.CreateAPIView, generics.UpdateAPIView, generics.RetrieveAPIView):
    queryset = Schedule.objects.all()
    serializer_class = serializers.ScheduleSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_queryset(self):
        queryset = self.queryset
        params = self.request.query_params

        # Lọc theo bác sĩ (user_id)
        if (doctor_id := params.get('doctor_id')):
            queryset = queryset.filter(doctor_id=int(doctor_id))
            print(queryset)
            print(doctor_id)

        # Lọc theo ngày cụ thể
        if (date := params.get('date')):
            queryset = queryset.filter(date=date)

        # Lọc theo trạng thái còn trống
        if (active := params.get('active')) is not None:
            queryset = queryset.filter(active=active.lower() in ['true', '1'])

        return queryset


class MessageViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView, generics.UpdateAPIView):
    queryset = Message.objects.all().order_by('created_date')
    serializer_class = serializers.MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        participant_id = self.request.query_params.get('participant_id')
        print(participant_id)
        if not participant_id:
            return Message.objects.none()
            raise ValidationError("participant_id is required")

        try:
            participant = User.objects.get(pk=participant_id)

        except User.DoesNotExist:
            raise ValidationError("Người dùng không tồn tại")
        messages = Message.objects.filter(
            Q(sender=user, receiver=participant) | Q(sender=participant, receiver=user)).order_by('created_date')

        return messages

    def create(self, request, *args, **kwargs):
        sender = request.user
        receiver_id = request.data.get('receiver')

        if not receiver_id:
            raise ValidationError("Trường 'receiver' là bắt buộc.")

        try:
            receiver = User.objects.get(pk=receiver_id)
        except User.DoesNotExist:
            raise ValidationError("Người nhận không tồn tại.")

        if sender == receiver:
            raise ValidationError("Người gửi và người nhận không được giống nhau.")

        # Tạo serializer không có sender/receiver
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Lưu thủ công với sender và receiver
        serializer.save(sender=sender, receiver=receiver)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('created_date')
    serializer_class = serializers.ReviewSerializer

    def get_queryset(self):
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            return self.queryset.filter(doctor_id=doctor_id)
        return self.queryset

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def reply(self, request, pk=None):
        review = self.get_object()
        reply_text = request.data.get('reply')

        # Kiểm tra quyền bác sĩ phản hồi
        user = request.user
        if not (user.role == 'doctor' and review.doctor_id == user.id):
            raise PermissionDenied("Bạn không có quyền phản hồi đánh giá này.")

        if not reply_text:
            return Response({"detail": "Thiếu nội dung phản hồi"}, status=status.HTTP_400_BAD_REQUEST)

        review.reply = reply_text
        review.save()
        return Response(self.get_serializer(review).data, status=status.HTTP_200_OK)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    @action(detail=True, methods=['post'], url_path='process')
    def process_payment(self, request, pk=None):
        payment = get_object_or_404(Payment, pk=pk)

        if payment.status == Payment.PaymentStatus.PAID:
            return Response({'message': 'Hóa đơn đã được thanh toán trước đó.'}, status=status.HTTP_400_BAD_REQUEST)

        payment.status = Payment.PaymentStatus.PAID
        payment.transaction_id = request.data.get('transaction_id', '')
        payment.save()

        self.send_payment_success_email(payment)

        return Response({'message': 'Thanh toán thành công.'}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        # serializers = serializers.PaymentSerializer
        pass


class DoctorReportViewSet(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        print(user)
        doctor = getattr(user, 'doctor', None)
        print(doctor)
        if not doctor:
            return Response({'detail': 'Không phải bác sĩ.'}, status=403)

        month = request.query_params.get('month')
        year = request.query_params.get('year')
        quarter = request.query_params.get('quarter')

        total_appointment = Appointment.objects.filter(schedule__doctor=doctor.user).count()
        queryset = Appointment.objects.filter(schedule__doctor=doctor.user, status='completed')

        if month and year:
            queryset = queryset.filter(schedule__date__year=year, schedule__date__month=month)
        elif quarter and year:
            start_month = (int(quarter) - 1) * 3 + 1
            end_month = start_month + 2
            queryset = queryset.filter(schedule__date__year=year,
                                       schedule__date__month__range=(start_month, end_month))

        examined = queryset.count()
        top_diseases = queryset.values('disease_type').annotate(count=Count('disease_type')).order_by('-count')[:5]
        unexamined = Appointment.objects.filter(status='paid').count()
        print(f'Đã khám: {examined}')

        return Response({
            'total_appoitment': total_appointment,
            'examined_count': examined,
            'unexamined_count': unexamined,
            'top_disease': top_diseases,
        })


class AdminReportViewSet(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Không phải quản trị viên.'}, status=403)

        # Lấy params và ép kiểu
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        quarter = request.query_params.get('quarter')

        try:
            month = int(month) if month else None
            year = int(year) if year else None
            quarter = int(quarter) if quarter else None
        except ValueError:
            return Response({'detail': 'Tham số month, year, quarter phải là số.'}, status=400)

        if month and (month < 1 or month > 12):
            return Response({'detail': 'Tháng không hợp lệ (1-12).'}, status=400)

        if quarter and (quarter < 1 or quarter > 4):
            return Response({'detail': 'Quý không hợp lệ (1-4).'}, status=400)

        appt_queryset = Appointment.objects.filter(status='completed')
        payment_queryset = Payment.objects.filter(status='paid')

        if month and year:
            appt_queryset = appt_queryset.filter(schedule__date__year=year, schedule__date__month=month)
            payment_queryset = payment_queryset.filter(
                appointment__schedule__date__year=year,
                appointment__schedule__date__month=month
            )

        elif quarter and year:
            start_month = (quarter - 1) * 3 + 1
            end_month = start_month + 2
            appt_queryset = appt_queryset.filter(
                schedule__date__year=year,
                schedule__date__month__range=(start_month, end_month)
            )
            payment_queryset = payment_queryset.filter(
                appointment__schedule__date__year=year,
                appointment__schedule__date__month__range=(start_month, end_month)
            )

        elif year:
            appt_queryset = appt_queryset.filter(schedule__date__year=year)
            payment_queryset = payment_queryset.filter(appointment__schedule__date__year=year)

        return Response({
            'appointment_count': appt_queryset.count(),
            'revenue': payment_queryset.aggregate(total=Sum('amount'))['total'] or 0
        })


class ScheduleAvailableDatesView(APIView):
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')

        if not doctor_id:
            return Response({"error": "Missing doctor_id"}, status=status.HTTP_400_BAD_REQUEST)

        dates = (
            Schedule.objects.filter(doctor_id=doctor_id, is_available=True)
            .values_list('date', flat=True)
            .distinct()
            .order_by('date')
        )

        return Response(dates)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
