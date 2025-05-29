from datetime import datetime, timedelta
from django.contrib.auth.tokens import default_token_generator
import random
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
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
    OTPRequestSerializer, OTPConfirmResetSerializer


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
        return HealthRecord.objects.filter(user=user)

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
        print(user)
        # Kiểm tra phân quyền. Chỉ có bác sĩ mới được quyền chỉnh sửa hồ sơ
        if user.role == 'admin':
            return Response({"detail": "Bạn không có quyền chỉnh sửa hồ sơ được quyền chỉnh sửa hồ sơ."},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            record = HealthRecord.objects.get(pk=pk)
        except HealthRecord.DoesNotExist:
            return Response({"detail": "Hồ sơ không tồn tại."}, status=status.HTTP_404_NOT_FOUND)


class TestResultViewSet(viewsets.ViewSet, generics.ListAPIView):
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


class AppointmentViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView):
    queryset = Appointment.objects.filter().all()
    serializer_class = serializers.AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def send_appointment_successfull_email(self, appointment):
        """
        Gửi email xác nhận đặt lịch khám thành công
        :param appointment: Lịch khám
        :return:
        """
        healthrecord = appointment.healthrecord
        schedule = appointment.schedule
        doctor = schedule.doctor
        infodr = doctor.doctor
        subject = "Đặt lịch khám bệnh thành công - Clinic Booking"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [healthrecord.email]

        text_content = f"""
        Chào {healthrecord.full_name},

        Bạn đã đặt lịch khám thành công (Mã: #{appointment.id}).
        Vui lòng thanh toán trong vòng 30 phút kể từ lúc đặt.
        Nếu đã thanh toán, vui lòng bỏ qua email này.

        Trân trọng,
        Clinic Booking App
        """

        html_content = f"""
        <p>Chào <strong>{healthrecord.full_name}</strong>,</p>

        <p>Bạn đã đặt lịch khám bệnh thành công tại <strong>Clinic Booking</strong>.</p>

        <p><strong>Thông tin lịch khám:</strong></p>
        <ul>
            <li><strong>Mã lịch hẹn:</strong> #{appointment.id}</li>
            <li><strong>Mã hồ sơ sức khoẻ:</strong> #{healthrecord.id}</li>
            <li><strong>Ngày khám:</strong> {schedule.date.strftime('%d/%m/%Y')}</li>
            <li><strong>Thời gian:</strong> {schedule.start_time} - {schedule.end_time}</li>
            <li><strong>Bác sĩ:</strong> {doctor.full_name}</li>
            <li><strong>Bệnh viện:</strong> {infodr.hospital}</li>
            <li><strong>Chuyên khoa:</strong> {infodr.specialization}</li>
        </ul>

        <p><em style="color:red;"><strong>Lưu ý:</strong> Vui lòng thanh toán trong vòng <strong>30 phút</strong> kể từ khi đặt lịch.<br>
        Nếu đã thanh toán, vui lòng bỏ qua email này.</em></p>

        <p style="margin-top:20px;">Trân trọng,<br><em>Đội ngũ Clinic Booking</em></p>
        """

        msg = EmailMultiAlternatives(subject, text_content, from_email, to_email)
        msg.attach_alternative(html_content, "text/html")
        msg.send()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        schedule_id = request.data.get('schedule')
        healthrecord_id = request.data.get('healthrecord')

        try:
            schedule = Schedule.objects.get(id=schedule_id)
            doctor = Doctor.objects.get(user=schedule.doctor)
            healthrecord = HealthRecord.objects.get(pk=healthrecord_id)
        except (Schedule.DoesNotExist, Doctor.DoesNotExist, HealthRecord.DoesNotExist):
            return Response({"detail": "Dữ liệu không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra xem bệnh nhân đã có lịch với lịch này chưa (nếu cần)
        if Appointment.objects.filter(healthrecord=healthrecord, schedule=schedule).exists():
            return Response({"detail": "Bạn đã có lịch khám này rồi!"}, status=status.HTTP_400_BAD_REQUEST)

        # Tạo appointment
        appointment = Appointment.objects.create(
            healthrecord=healthrecord,
            schedule=schedule,
            disease_type=serializer.validated_data['disease_type'],
            symptoms=serializer.validated_data.get('symptoms', ''),
            status='unpaid'
        )
        schedule.sum_booking += 1
        schedule.save()
        output_serializer = self.get_serializer(appointment)
        self.send_appointment_successfull_email(appointment)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

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
        if not appointment:
            return Response({'detail': 'Không tìm thấy lịch khám!'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.cancel:
            return Response({'detail': 'Lịch khám này đã bị huỷ'}, status=status.HTTP_400_BAD_REQUEST)
        if not is_more_than_24_hours_ahead(schedule_date, schedule_time):
            return Response({'erorr': 'Bạn chỉ được huỷ lịch trước 24 tiếng'}, status=status.HTTP_400_BAD_REQUEST)

        # Huỷ lịch
        appointment.cancel = True
        appointment.save()

        # Giảm số lượng đặt lịch khám của bác sĩ
        schedule = appointment.schedule
        schedule.sum_booking -= 1
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
                      generics.CreateAPIView, generics.UpdateAPIView):
    queryset = Schedule.objects.filter(active=True)
    serializer_class = serializers.ScheduleSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_queryset(self):
        queryset = self.queryset
        params = self.request.query_params

        # Lọc theo bác sĩ (user_id)
        if (doctor_id := params.get('doctor_id')):
            queryset = queryset.filter(doctor_id=int(doctor_id))

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
        queryset = self.queryset

        return queryset

        # sender_id = self.request.query_params.get('sender')
        # receiver_id = self.request.query_params.get('receiver')
        # if sender_id and receiver_id:
        #     if str(user.id) != sender_id and str(user.id) != receiver_id:
        #         raise PermissionDenied("Bạn không có quyền xem tin nhắn này.")
        #     return queryset.filter(
        #         Q(sender_id=sender_id, receiver_id=receiver_id) |
        #         Q(sender_id=receiver_id, receiver_id=sender_id)
        #     ).order_by('created_date')
        #
        # return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        receiver = serializer.validated_data.get('receiver')

        if not receiver:
            raise PermissionDenied("Bạn phải chọn người nhận tin nhắn.")

        if not hasattr(user, 'role') or user.role not in ['patient', 'doctor']:
            raise PermissionDenied("Bạn không có quyền gửi tin nhắn.")

        if not hasattr(receiver, 'role') or receiver.role not in ['patient', 'doctor']:
            raise PermissionDenied("Người nhận phải là bệnh nhân hoặc bác sĩ.")

        # Bệnh nhân chỉ được phép nhắn với bác sĩ
        if user.role == 'patient' and receiver.role != 'doctor':
            raise PermissionDenied("Bệnh nhân chỉ được phép nhắn tin cho bác sĩ.")

        # Bác sĩ chỉ được phép nhắn với bệnh nhân
        if user.role == 'doctor' and receiver.role != 'patient':
            raise PermissionDenied("Bác sĩ chỉ được phép nhắn tin cho bệnh nhân.")

        # Nếu đúng thì lưu tin nhắn
        serializer.save(sender=user)


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


class DoctorReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        doctor = getattr(user, 'doctor', None)
        if not doctor:
            return Response({'detail': 'Không phải bác sĩ.'}, status=403)

        month = request.query_params.get('month')
        year = request.query_params.get('year')
        quarter = request.query_params.get('quarter')

        queryset = Appointment.objects.filter(schedule__doctor=doctor, status='completed')

        if month and year:
            queryset = queryset.filter(schedule__date__year=year, schedule__date__month=month)
        elif quarter and year:
            start_month = (int(quarter) - 1) * 3 + 1
            end_month = start_month + 2
            queryset = queryset.filter(schedule__date__year=year,
                                       schedule__date__month__range=(start_month, end_month))

        patient_count = queryset.count()
        top_diseases = queryset.values('disease_type').annotate(count=Count('disease_type')).order_by('-count')[:5]

        return Response({
            'patient_count': patient_count,
            'top_diseases': top_diseases,
        })


class AdminReportViewSet(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Không phải quản trị viên.'}, status=403)

        month = request.query_params.get('month')
        year = request.query_params.get('year')
        quarter = request.query_params.get('quarter')

        appt_queryset = Appointment.objects.filter(status='completed')
        payment_queryset = Payment.objects.filter(status='paid')

        if month and year:
            appt_queryset = appt_queryset.filter(schedule__date__year=year, schedule__date__month=month)
            payment_queryset = payment_queryset.filter(appointment__schedule__date__year=year,
                                                       appointment__schedule__date__month=month)
        elif quarter and year:
            start_month = (int(quarter) - 1) * 3 + 1
            end_month = start_month + 2
            appt_queryset = appt_queryset.filter(schedule__date__year=year,
                                                 schedule__date__month__range=(start_month, end_month))
            payment_queryset = payment_queryset.filter(appointment__schedule__date__year=year,
                                                       appointment__schedule__date__month__range=(
                                                           start_month, end_month))

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
