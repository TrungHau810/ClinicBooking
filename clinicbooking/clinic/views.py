import hashlib
import hmac
import urllib
from datetime import datetime, timedelta

from cloudinary.provisioning import users
from django.contrib.auth.tokens import default_token_generator
import random

from django.dispatch import receiver
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from oauthlib.uri_validate import query
from pyexpat.errors import messages
from requests_toolbelt.multipart.encoder import total_len
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed, ValidationError
from rest_framework.views import APIView
from clinic import serializers, paginators
from rest_framework import viewsets, generics, status, parsers, permissions
from clinic.models import (User, Doctor, Payment, Appointment, Review,
                           Schedule, Notification, HealthRecord, Message, TestResult,
                           Hospital, Specialization, PasswordResetOTP)
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from decimal import Decimal
from django.db.models import Q, Count, Sum, F, DecimalField
from django.db.models.functions import Coalesce
from rest_framework.response import Response
from clinic.permissions import IsDoctorOrSelf
from clinic.serializers import AppointmentSerializer, PaymentSerializer, NotificationSerializer, UserSerializer, \
    OTPRequestSerializer, OTPConfirmResetSerializer, MessageSerializer, DoctorSerializer


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

    @action(methods=['get'], detail=False, url_path='doctors', permission_classes=[permissions.IsAuthenticated])
    def get_doctors(self, request):
        user = request.user
        if user.role != 'patient':
            return Response({"detail": "Chỉ bệnh nhân có quyền."}, status=status.HTTP_403_FORBIDDEN)
        doctor_ids = Appointment.objects.filter(healthrecord__user=user) \
            .values_list('schedule__doctor', flat=True).distinct()
        doctors = User.objects.filter(id__in=doctor_ids, role='doctor')
        serializer = UserSerializer(doctors, many=True)
        return Response(serializer.data)

    @action(methods=['get'], detail=False, url_path='patients', permission_classes=[permissions.IsAuthenticated])
    def get_patients(self, request):
        user = request.user
        if user.role != 'doctor':
            return Response({"detail": "Chỉ bác sĩ có quyền."}, status=status.HTTP_403_FORBIDDEN)
        patient_ids = Appointment.objects.filter(schedule__doctor=user) \
            .values_list('healthrecord__user', flat=True).distinct()
        patients = User.objects.filter(id__in=patient_ids, role='patient')
        serializer = UserSerializer(patients, many=True)
        return Response(serializer.data)

    @action(methods=['get'], detail=False, url_path='admin')
    def get_admin(self, request):
        admin = User.objects.filter(role='admin')
        serializer = self.get_serializer(admin, many=True)
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

    @action(methods=['get'], detail=False, url_path='by-user')
    def get_doctor_by_user(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'Missing user_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            doctor = Doctor.objects.select_related('user').get(user__id=user_id)
            serializer = self.get_serializer(doctor)
            return Response(serializer.data)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)

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


class TestResultViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.TestResultSerializer

    def get_queryset(self):
        queryset = TestResult.objects.filter(active=True)
        health_record_id = self.request.query_params.get("health_record")
        if health_record_id:
            queryset = queryset.filter(health_record_id=health_record_id)
        return queryset


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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        return Response(self.get_serializer(appointment).data, status=status.HTTP_201_CREATED)

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
            return Response({'error': 'Bạn chỉ được đổi lịch trước 24 tiếng'}, status=status.HTTP_400_BAD_REQUEST)

        # Lấy id của lịch mới
        new_schedule_id = request.data.get('new_schedule_id')
        if not new_schedule_id:
            return Response("Thiếu thông tin của lịch hẹn mới", status=status.HTTP_400_BAD_REQUEST)
        new_schedule = Schedule.objects.get(pk=new_schedule_id)
        print(new_schedule)
        # Kiểm tra lịch mới còn chỗ không
        if new_schedule.sum_booking >= new_schedule.capacity:
            return Response({"error": 'Lịch khám mới đã đầy.'}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra trùng lịch (bệnh nhân đã có lịch với new_schedule chưa)
        if Appointment.objects.filter(healthrecord=appointment.healthrecord, schedule=new_schedule,
                                      cancel=False).exists():
            return Response({'error': 'Bạn đã có lịch khám trong khoảng thời gian này.'},
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
    parser_classes = [MultiPartParser, FormParser]

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

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

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


@api_view(['POST'])
def create_payment_url(request):
    # Lấy thông tin từ request
    appointment_id = request.data.get('appointment_id')
    appointment = Appointment.objects.get(pk=appointment_id)
    doctor_user = appointment.schedule.doctor
    doctor = Doctor.objects.get(user=doctor_user)
    amount = doctor.consultation_fee
    print(amount)
    order_info = request.data.get('order_info', 'Thanh toan lich kham')

    if not appointment_id or not amount:
        return JsonResponse({'error': 'Thiếu appointment_id hoặc amount'}, status=400)

    try:
        appointment = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Lịch hẹn không tồn tại'}, status=404)

    # Tạo payment object
    payment = Payment.objects.create(
        appointment=appointment,
        method='vnpay',
        amount=amount,
        status='pending'
    )

    # Tạo các tham số cho VNPay
    vnpay_params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': settings.VNPAY_TMN_CODE,
        'vnp_Amount': int(float(amount) * 100),  # VNPay yêu cầu số tiền * 100
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': str(payment.id),  # Mã giao dịch, dùng payment.id làm duy nhất
        'vnp_OrderInfo': order_info,
        'vnp_OrderType': '250000',  # Mã loại hàng hóa
        'vnp_Locale': 'vn',
        'vnp_ReturnUrl': settings.VNPAY_RETURN_URL,
        'vnp_IpAddr': request.META.get('REMOTE_ADDR', '127.0.0.1'),
        'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S'),
    }

    # Sắp xếp các tham số theo thứ tự alphabet
    sorted_params = sorted(vnpay_params.items())
    query_string = urllib.parse.urlencode(sorted_params)

    # Tạo chữ ký (secure hash)
    secret_key = settings.VNPAY_HASH_SECRET_KEY.encode('utf-8')
    query_string_bytes = query_string.encode('utf-8')
    secure_hash = hmac.new(secret_key, query_string_bytes, hashlib.sha512).hexdigest()
    vnpay_params['vnp_SecureHash'] = secure_hash

    # Tạo URL thanh toán
    vnpay_url = f"{settings.VNPAY_PAYMENT_URL}?{urllib.parse.urlencode(vnpay_params)}"

    return JsonResponse({'payment_url': vnpay_url, 'payment_id': payment.id})


@api_view(['GET'])
def vnpay_return(request):
    # Lấy tất cả tham số từ VNPay
    vnpay_params = request.GET.dict()
    secure_hash = vnpay_params.pop('vnp_SecureHash', None)

    if not secure_hash:
        return JsonResponse({'error': 'Thiếu chữ ký bảo mật'}, status=400)

    # Tạo chuỗi để kiểm tra chữ ký
    sorted_params = sorted(vnpay_params.items())
    query_string = urllib.parse.urlencode(sorted_params)
    query_string_bytes = query_string.encode('utf-8')
    secret_key = settings.VNPAY_HASH_SECRET_KEY.encode('utf-8')
    calculated_hash = hmac.new(secret_key, query_string_bytes, hashlib.sha512).hexdigest()

    if calculated_hash != secure_hash:
        return JsonResponse({'error': 'Chữ ký không hợp lệ'}, status=400)

    # Lấy thông tin giao dịch
    payment_id = vnpay_params.get('vnp_TxnRef')
    response_code = vnpay_params.get('vnp_ResponseCode')

    try:
        payment = Payment.objects.get(id=payment_id)
    except Payment.DoesNotExist:
        return JsonResponse({'error': 'Giao dịch không tồn tại'}, status=404)

    # Cập nhật trạng thái thanh toán
    if response_code == '00':
        payment.status = Payment.PaymentStatus.PAID
        payment.transaction_id = vnpay_params.get('vnp_TransactionNo')
        payment.appointment.status = 'paid'
        payment.appointment.save()
        payment.save()

        # Gửi email xác nhận
        send_payment_success_email(payment)
        return JsonResponse({'message': 'Thanh toán thành công'}, status=200)
    else:
        payment.status = Payment.PaymentStatus.FAILED
        payment.save()
        return JsonResponse({'error': 'Thanh toán thất bại', 'response_code': response_code}, status=400)


def send_payment_success_email(payment):
    subject = 'Xác nhận thanh toán thành công'
    message = f"""
    Kính gửi {payment.appointment.healthrecord.full_name},

    Thanh toán của bạn cho lịch hẹn #{payment.appointment.id} đã được thực hiện thành công.
    - Số tiền: {payment.amount} VND
    - Mã giao dịch: {payment.transaction_id}
    - Thời gian: {payment.created_date.strftime('%d/%m/%Y %H:%M:%S')}

    Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
    """
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [payment.appointment.healthrecord.email]
    send_mail(subject, message, from_email, recipient_list)


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
        doctor = getattr(user, 'doctor', None)
        if not doctor:
            return Response({'detail': 'Không phải bác sĩ.'}, status=403)

        try:
            month = int(request.query_params.get('month')) if request.query_params.get('month') else None
            year = int(request.query_params.get('year')) if request.query_params.get('year') else None
            quarter = int(request.query_params.get('quarter')) if request.query_params.get('quarter') else None
        except ValueError:
            return Response({'detail': 'Tham số tháng/năm không hợp lệ.'}, status=400)

        total_appointment = Appointment.objects.filter(schedule__doctor=doctor.user).count()
        queryset = Appointment.objects.filter(schedule__doctor=doctor.user, status='completed')

        if month and year:
            queryset = queryset.filter(schedule__date__year=year, schedule__date__month=month)
        elif quarter and year:
            start_month = (quarter - 1) * 3 + 1
            end_month = start_month + 2
            queryset = queryset.filter(schedule__date__year=year,
                                       schedule__date__month__range=(start_month, end_month))

        examined = queryset.count()
        top_diseases = queryset.values('disease_type').annotate(count=Count('disease_type')).order_by('-count')[:5]

        unexamined = Appointment.objects.filter(schedule__doctor=doctor.user, status='paid')
        if month and year:
            unexamined = unexamined.filter(schedule__date__year=year, schedule__date__month=month)
        elif quarter and year:
            unexamined = unexamined.filter(schedule__date__year=year,
                                           schedule__date__month__range=(start_month, end_month))

        unexamined_count = unexamined.count()

        return Response({
            'total_appointment': total_appointment,
            'examined_count': examined,
            'unexamined_count': unexamined_count,
            'top_disease': top_diseases,
        })


class AdminReportViewSet(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Không phải quản trị viên.'}, status=403)

        # Parse params
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        quarter = request.query_params.get('quarter')

        try:
            month = int(month) if month else None
            year = int(year) if year else datetime.now().year
            quarter = int(quarter) if quarter else None
        except ValueError:
            return Response({'detail': 'Tham số month, year, quarter phải là số.'}, status=400)

        if month and (month < 1 or month > 12):
            return Response({'detail': 'Tháng không hợp lệ (1-12).'}, status=400)

        if quarter and (quarter < 1 or quarter > 4):
            return Response({'detail': 'Quý không hợp lệ (1-4).'}, status=400)

        # Filter các cuộc hẹn đã hoàn tất
        appt_queryset = Appointment.objects.filter(status='completed')

        if month:
            appt_queryset = appt_queryset.filter(schedule__date__year=year, schedule__date__month=month)
        elif quarter:
            start_month = (quarter - 1) * 3 + 1
            end_month = start_month + 2
            appt_queryset = appt_queryset.filter(
                schedule__date__year=year,
                schedule__date__month__range=(start_month, end_month)
            )
        else:
            appt_queryset = appt_queryset.filter(schedule__date__year=year)

        # annotate consultation_fee từ Doctor -> User -> Schedule
        appt_queryset = appt_queryset.select_related(
            'schedule__doctor__doctor'
        ).annotate(
            fee=F('schedule__doctor__doctor__consultation_fee')
        )

        # tính tổng doanh thu
        total_revenue = appt_queryset.aggregate(
            total=Coalesce(Sum('fee', output_field=DecimalField()), Decimal('0.00'))
        )['total']

        return Response({
            'appointment_count': appt_queryset.count(),
            'revenue': total_revenue
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


class UploadLicenseViewSet(viewsets.ModelViewSet, generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = serializers.UploadLicenseSerializer

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role != "doctor":
            return Response({"error": "Bạn không phải là bác sĩ."}, status=400)

        # Kiểm tra xem đã có hồ sơ Doctor chưa
        try:
            doctor = user.doctor
        except:
            # Nếu chưa có, tạo mới
            doctor = Doctor(user=user)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for field in ['license_number', 'license_image', 'hospital', 'specialization', 'biography']:
            if field in serializer.validated_data:
                setattr(doctor, field, serializer.validated_data[field])

        doctor.is_verified = False
        doctor.save()

        return Response({"message": "Đã gửi giấy phép. Vui lòng chờ xác minh."}, status=201)


class PendingDoctorsViewSet(generics.ListAPIView):
    queryset = Doctor.objects.filter(is_verified=False, license_image__isnull=False)
    serializer_class = serializers.DoctorSerializer
    permission_classes = [IsAdminUser]


class ApproveDoctorView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            doctor.is_verified = True
            doctor.save()
            return Response({"message": "Bác sĩ đã được xác minh."})
        except Doctor.DoesNotExist:
            return Response({"error": "Không tìm thấy bác sĩ."}, status=404)
