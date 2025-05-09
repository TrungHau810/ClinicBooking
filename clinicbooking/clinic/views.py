from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import action, permission_classes
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed, ValidationError
from rest_framework.views import APIView

from clinic import serializers, paginators
from rest_framework import viewsets, generics, status, parsers, permissions
from clinic.models import (User, Doctor, Patient, Payment, Appointment, Review,
                           Schedule, Notification, HealthRecord, Message, TestResult,
                           Hospital, Specialization, UserType)
from django.db.models import Q, Count, Sum
from rest_framework.response import Response

from clinic.serializers import AppointmentSerializer, PaymentSerializer


class HospitalViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Hospital.objects.filter(active=True)
    serializer_class = serializers.HospitalSerializer


class SpecializationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Specialization.objects.filter(active=True)
    serializer_class = serializers.SpecializationSerializer

    def get_queryset(self):
        queryset = self.queryset
        specialization_name = self.request.query_params.get('specialization')
        # Lấy các chuyên khoa theo tên chuyên khoa

        if specialization_name:
            queryset = queryset.filter(name__icontains=specialization_name)

        return queryset


class UserViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    # Chứng thực user để xem thông tin user và chỉnh sửa 1 phần thông tin user
    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        u = request.user
        if request.method.__eq__('PATCH'):
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(u, k, v)
                elif k.__eq__('password'):
                    u.set_password(v)
            u.save()

        return Response(serializers.UserSerializer(u).data)


class DoctorViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView,
                    generics.RetrieveAPIView):
    queryset = Doctor.objects.filter(is_verified=True)
    serializer_class = serializers.DoctorSerializer
    parser_classes = [parsers.MultiPartParser]

    # Chứng thực bác sĩ để xem thông tin bác sĩ và chỉnh sửa 1 phần thông tin bác sĩ
    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        doctor = Doctor.objects.get(user_ptr=request.user)
        if request.method.__eq__('PATCH'):
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(doctor, k, v)
                elif k.__eq__('password'):
                    doctor.set_password(v)
            doctor.save()

        return Response(serializers.DoctorSerializer(doctor).data)

    def get_queryset(self):
        queryset = self.queryset
        name = self.request.query_params.get('name')
        hospital_name = self.request.query_params.get('hospital_name')
        specialization_name = self.request.query_params.get('specialization-name')

        if name:
            queryset = queryset.filter(Q(first_name__icontains=name) |
                                       Q(last_name__icontains=name))

        if hospital_name:
            queryset = queryset.filter(hospital__name__icontains=hospital_name)

        if specialization_name:
            queryset = queryset.filter(specialization__name__icontains=specialization_name)

        return queryset

    # Lấy lịch khám của bác sĩ
    @action(methods=['get'], detail=True, url_path='schedules')
    def get_schedules(self, request, pk=None):
        schedules = Schedule.objects.filter(doctor_id=pk)
        if schedules:
            return Response(serializers.ScheduleSerializer(schedules, many=True).data, status=status.HTTP_200_OK)

        return Response({'error': "No schedules found for this doctor."}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['post'], detail=True, url_path='schedules', serializer_class=serializers.ScheduleSerializer)
    def create_schedule(self, request, pk):
        doctor = get_object_or_404(Doctor, pk=pk)
        data = request.data.copy()
        data['doctor'] = doctor.id

        schedule = ScheduleViewSet(data=data)
        if schedule.is_valid():
            schedule.save()
            return Response(schedule.data, status=status.HTTP_201_CREATED)

        return Response(schedule.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView,
                     generics.RetrieveAPIView):
    queryset = Patient.objects.filter(is_active=True)
    serializer_class = serializers.PatientSerializer
    parser_classes = [parsers.MultiPartParser]

    # Chứng thực bệnh nhân để xem thông tin bệnh nhân và chỉnh sửa 1 phần thông tin bệnh nhân
    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        patient = Patient.objects.get(user_ptr=request.user)
        if request.method.__eq__('PATCH'):
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(patient, k, v)
                elif k.__eq__('password'):
                    patient.set_password(v)
            patient.save()

        return Response(serializers.PatientSerializer(patient).data)

    def get_queryset(self):
        queryset = self.queryset
        q = self.request.query_params.get('q')

        if q:
            queryset = queryset.filter(Q(first_name__icontains=q) |
                                       Q(last_name__icontains=q))

        return queryset

    @action(methods=['get'], detail=True, url_path="appointments/history",
            permission_classes=[permissions.IsAuthenticated])
    def get_appointment(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        if patient:
            appointments = patient.appointment_set.all().order_by('-created_date')
            return Response(serializers.AppointmentSerializer(appointments, many=True).data,
                            status=status.HTTP_200_OK)

        return Response({'error': "Patient not found"}, status=status.HTTP_404_NOT_FOUND)


class HealthRecordViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = HealthRecord.objects.filter(active=True).prefetch_related('testresult_set')
    serializer_class = serializers.HealthRecordSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return HealthRecord.objects.none()

        user = self.request.user
        if not user or not user.is_authenticated:
            raise PermissionDenied(detail="Cần phải đăng nhập để xem hồ sơ sức khoẻ")

        if user.user_type == UserType.DOCTOR or user.user_type == UserType.ADMIN:
            return HealthRecord.objects.filter(active=True).select_related('patient')
        elif user.user_type == UserType.PATIENT:
            return HealthRecord.objects.filter(patient__pk=user.pk, active=True)

        return HealthRecord.objects.none()

    # Cho phép bệnh nhân tự tạo hồ sơ sức khoẻ của chính mình
    @action(methods=['post'], detail=False, url_path='me', permission_classes=[permissions.IsAuthenticated])
    def create_healthrecord(self, request):
        user = request.user

        # Kiểm tra đúng kiểu người dùng
        if user.user_type != UserType.PATIENT:
            return Response({"detail": "Chỉ bệnh nhân mới được tạo hồ sơ."}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = Patient.objects.get(pk=user.pk)

        except Patient.DoesNotExist:
            return Response({"detail": "Không tìm thấy thông tin bệnh nhân."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra trùng hồ sơ
        if HealthRecord.objects.filter(patient=patient).exists():
            return Response({"detail": "Hồ sơ đã tồn tại."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(patient=patient)  # Gán đúng đối tượng
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Bác sĩ update hồ sơ bệnh án của của bệnh nhân
    def partial_update(self, request, pk=None):
        user = request.user

        if user.user_type != UserType.DOCTOR:
            return Response({"detail": "Chỉ bác sĩ được quyền chỉnh sửa hồ sơ."}, status=status.HTTP_403_FORBIDDEN)

        try:
            record = HealthRecord.objects.get(pk=pk)
        except HealthRecord.DoesNotExist:
            return Response({"detail": "Hồ sơ không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra xem bác sĩ này đã từng khám bệnh nhân này chưa
        has_examined = Appointment.objects.filter(
            doctor__pk=user.pk,
            patient=record.patient,
            status=Appointment.Status.COMPLETED  # chỉ tính nếu đã hoàn thành
        ).exists()

        if not has_examined:
            return Response({"detail": "Bạn không có quyền chỉnh sửa hồ sơ của bệnh nhân này."},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()  # không thay đổi patient!
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestResultViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = TestResult.objects.filter(active=True)
    serializer_class = serializers.TestResultSerializer


class AppointmentViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView,
                         generics.UpdateAPIView):
    queryset = Appointment.objects.filter().all()
    serializer_class = serializers.AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        # Lấy đối tượng hẹn của bệnh nhân
        old_appointment = self.get_object()

        if old_appointment.status.__contains__('canceled'):
            return Response({'detail': 'Lịch này đã bị huỷ'}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra chứng thực: Chỉ bệnh nhân đã đặt lịch mới có thể hủy lịch của mình
        if old_appointment.patient != request.user.patient:
            return Response({"detail": "Bạn không có quyền hủy lịch này."}, status=403)

        if not old_appointment.can_cancel_or_reschedule:
            return Response({"detail": "Không thể hủy lịch trong vòng 24 giờ."}, status=400)

        # Hủy lịch
        old_appointment.status = Appointment.Status.CANCELED
        old_appointment.cancel_reason = request.data.get("cancel_reason", "Không có lý do")
        old_appointment.save()

        # Cập nhật lại trạng thái lịch trống
        old_appointment.schedule.is_available = True
        old_appointment.schedule.save()

        return Response({"detail": "Lịch hẹn đã được hủy thành công."}, status=200)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def reschedule(self, request, pk=None):
        old_appointment = self.get_object()

        # Kiểm tra chứng thực: Chỉ bệnh nhân đã đặt lịch mới có thể đổi lịch của mình
        if old_appointment.patient != request.user.patient:
            return Response({"detail": "Bạn không có quyền đổi lịch này."}, status=403)

        # Kiểm tra xem có thể đổi lịch hay không (có thời gian còn hơn 24h không)
        if not old_appointment.can_cancel_or_reschedule:
            return Response({"detail": "Không thể đổi lịch trong vòng 24 giờ."}, status=400)

        # Kiểm tra lịch mới
        new_schedule_id = request.data.get("new_schedule")
        try:
            new_schedule = Schedule.objects.get(pk=new_schedule_id, is_available=True)
        except Schedule.DoesNotExist:
            return Response({"detail": "Lịch mới không hợp lệ."}, status=400)

        # Hủy lịch cũ
        old_appointment.status = Appointment.Status.CANCELED
        old_appointment.cancel_reason = "Người dùng đổi lịch hẹn"
        old_appointment.save()

        # Tạo lịch mới
        new_appointment = Appointment.objects.create(
            patient=old_appointment.patient,
            doctor=old_appointment.doctor,
            schedule=new_schedule,
            disease_type=old_appointment.disease_type,
            symptoms=old_appointment.symptoms,
            status=Appointment.Status.PENDING,
            rescheduled_from=old_appointment,
        )

        # Đánh dấu lịch mới đã được đặt
        new_schedule.is_available = False
        new_schedule.save()

        # Trả về thông tin lịch mới
        return Response(serializers.AppointmentSerializer(new_appointment).data, status=201)

    @action(methods=['get'], detail=True, url_path="payment")
    def get_payment(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        if appointment:
            payment = appointment.payment
            if payment:
                # Nếu đã thanh toán và appointment chưa được đánh dấu là hoàn thành
                if payment.status == Payment.PaymentStatus.PAID and appointment.status != Appointment.Status.COMPLETED:
                    appointment.status = Appointment.Status.COMPLETED
                    appointment.save()

                return Response(serializers.PaymentSerializer(payment).data, status=status.HTTP_200_OK)
            else:
                return Response({'error': f'Payment not found for this appointment.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({"error": "Appointment not found"}, status=status.HTTP_404_NOT_FOUND)


class ScheduleViewSet(viewsets.ViewSet, generics.ListAPIView,
                      generics.CreateAPIView, generics.UpdateAPIView):
    queryset = Schedule.objects.filter(active=True)
    serializer_class = serializers.ScheduleSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_queryset(self):
        queryset = self.queryset
        doctor_id = self.request.query_params.get('doctor_id')
        print(doctor_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        return queryset


class MessageViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView, generics.UpdateAPIView):
    queryset = Message.objects.all().order_by('created_date')
    serializer_class = serializers.MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        appointment_id = self.request.query_params.get('appointment')
        if appointment_id:
            return queryset.filter(test_result__appointment__patient=user) | queryset.filter(
                test_result__appointment__doctor=user)

        sender_id = self.request.query_params.get('sender')
        receiver_id = self.request.query_params.get('receiver')
        if sender_id and receiver_id:
            if str(user.id) != sender_id and str(user.id) != receiver_id:
                raise PermissionDenied("Bạn không có quyền xem tin nhắn này.")
            return queryset.filter(
                Q(sender_id=sender_id, receiver_id=receiver_id) |
                Q(sender_id=receiver_id, receiver_id=sender_id)
            ).order_by('created_date')

        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        receiver = serializer.validated_data.get('receiver')

        if not receiver:
            raise PermissionDenied("Bạn phải chọn người nhận tin nhắn.")

        if not hasattr(user, 'user_type') or user.user_type not in [UserType.PATIENT, UserType.DOCTOR]:
            raise PermissionDenied("Bạn không có quyền gửi tin nhắn.")

        if not hasattr(receiver, 'user_type') or receiver.user_type not in [UserType.PATIENT, UserType.DOCTOR]:
            raise PermissionDenied("Người nhận phải là bệnh nhân hoặc bác sĩ.")

        # Bệnh nhân chỉ được phép nhắn với bác sĩ
        if user.user_type == UserType.PATIENT and receiver.user_type != UserType.DOCTOR:
            raise PermissionDenied("Bệnh nhân chỉ được phép nhắn tin cho bác sĩ.")

        # Bác sĩ chỉ được phép nhắn với bệnh nhân
        if user.user_type == UserType.DOCTOR and receiver.user_type != UserType.PATIENT:
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
        if not (user.user_type == UserType.DOCTOR and review.doctor_id == user.id):
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

    def send_payment_success_email(self, payment):
        patient = payment.appointment.patient
        subject = "Xác nhận thanh toán thành công"
        message = (
            f"Chào {patient.first_name},\n\n"
            f"Bạn đã thanh toán thành công cho cuộc hẹn khám bệnh (Mã: #{payment.appointment.id}).\n"
            f"- Phương thức: {payment.method}\n"
            f"- Số tiền: {payment.amount} VND\n"
            f"- Mã giao dịch: {payment.transaction_id or 'Không có'}\n\n"
            f"Trân trọng,\nPhòng khám"
        )
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [patient.email])

    @action(detail=False, methods=['get'], url_path='test-send-email')
    def test_send_email(self, request):
        send_mail(
            'Test Email',  # Tiêu đề email
            'This is a test email sent from Django using Gmail.',  # Nội dung email
            'clinic@gmail.com',  # Địa chỉ email gửi
            ['haopc1404@gmail.com'],  # Địa chỉ email nhận
            fail_silently=False,  # Không bỏ qua lỗi
        )
        return HttpResponse("Test email sent successfully!")


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
            queryset = queryset.filter(schedule__date__year=year, schedule__date__month__range=(start_month, end_month))

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
