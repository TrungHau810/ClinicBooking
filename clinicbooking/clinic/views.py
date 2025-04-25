from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from clinic import serializers, paginators
from rest_framework import viewsets, generics, status, parsers, permissions
from clinic.models import (User, Doctor, Patient, Payment, Appointment, Review,
                           Schedule, Notification, HealthRecord, Message, TestResult,
                           Hospital, Specialization, UserType)
from django.db.models import Q
from rest_framework.response import Response


class HospitalViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Hospital.objects.filter(active=True)
    serializer_class = serializers.HospitalSerializer


class SpecializationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Specialization.objects.filter(active=True)
    serializer_class = serializers.SpecializationSerializer

    def get_queryset(self):
        queryset = self.queryset

        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(name__icontains=q)

        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)

        return queryset


# Lấy current_user để tạo api .../current-user/ dùng chung cho các User, Patient, Doctor
class CurrentUserMixin:
    @action(methods=['get', 'patch'], detail=False, url_path='current_user',
            permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        user = request.user

        if request.method == 'PATCH':
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(user, k, v)
                elif k == 'password':
                    user.set_password(v)

            user.save()

        # Gọi đúng serializer cho từng loại user
        serializer_class = self.get_serializer_class()
        return Response(serializer_class(user).data)


class UserViewSet(CurrentUserMixin, viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView,
                  generics.UpdateAPIView):
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


class DoctorViewSet(CurrentUserMixin, viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView,
                    generics.RetrieveAPIView):
    # Lấy những bác sĩ nào đã được admin xác nhận
    queryset = Doctor.objects.filter(is_verified=True)
    serializer_class = serializers.DoctorSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_queryset(self):
        queryset = self.queryset
        q = self.request.query_params.get('q')

        if q:
            queryset = queryset.filter(Q(first_name__icontains=q) |
                                       Q(last_name__icontains=q))

        return queryset

    @action(methods=['get'], detail=True, url_path='schedules')
    def get_schedules(self, request, pk):
        doctor = Doctor.objects.filter(pk=pk)

        if doctor:
            schedules = Schedule.objects.filter(doctor_id=pk)
            return Response(serializers.ScheduleSerializer(schedules, many=True).data, status=status.HTTP_200_OK)

        return Response({'error': "Doctor not found"}, status=status.HTTP_404_NOT_FOUND)

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


class PatientViewSet(CurrentUserMixin, viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView,
                     generics.RetrieveAPIView):
    queryset = Patient.objects.filter(is_active=True)
    serializer_class = serializers.PatientSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_queryset(self):
        queryset = self.queryset
        q = self.request.query_params.get('q')

        if q:
            queryset = queryset.filter(Q(first_name__icontains=q) |
                                       Q(last_name__icontains=q))

        return queryset

    @action(methods=['get'], detail=True, url_path="appointments")
    def get_appointment(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        if patient:
            appointments = patient.appointment_set.all()
            return Response(serializers.AppointmentSerializer(appointments, many=True).data,
                            status=status.HTTP_404_NOT_FOUND)

        return Response({'error': "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['post'], detail=True, url_path='appointments', permission_classes=[permissions.IsAuthenticated])
    def create_appointment(self, request, pk=None):
        patient = get_object_or_404(Patient, pk=pk)

        # Thêm thông tin patient vào request.data
        data = request.data.copy()
        data['patient'] = patient.id

        serializer = serializers.AppointmentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HealthRecordViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView, generics.CreateAPIView):
    queryset = HealthRecord.objects.filter(active=True).prefetch_related('testresult_set')
    serializer_class = serializers.HealthRecordSerializer

    def get_queryset(self):
        user = self.request.user
        # Nếu chưa đăng nhập/ chưa chứng thực thì trả về "Cần phải đăng nhập"
        if not user or not user.is_authenticated:
            raise PermissionDenied(detail="Cần phải đăng nhập để xem hồ sơ sức khoẻ")
        # User là bác sĩ/admin -> Sẽ được xem tất cả hồ sơ của bệnh nhân
        if user.user_type == UserType.DOCTOR or user.user_type == UserType.ADMIN:
            return HealthRecord.objects.filter(active=True).select_related('patient')
        # User là bệnh nhân -> Chỉ được xem hồ sơ của chính mình
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
                         generics.UpdateAPIView, generics.DestroyAPIView):
    queryset = Appointment.objects.filter().all()
    serializer_class = serializers.AppointmentSerializer

    @action(methods=['get'], detail=True, url_path="payment")
    def get_payment(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        if appointment:
            payment = appointment.payment
            if payment:
                return Response(serializers.PaymentSerializer(payment).data, status=status.HTTP_200_OK)
            else:
                return Response({'error': f'Payment not found for {payment.pk}'}, status=status.HTTP_404_NOT_FOUND)

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

#
# class ReviewViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView,
#                     generics.DestroyAPIView, generics.UpdateAPIView):
#     queryset = Review.objects.filter().all()
#     serializer_class = serializers.ReviewSerializer
#     parser_classes = [parsers.MultiPartParser]
#
#
# class PaymentViewSet(viewsets.ViewSet, generics.ListAPIView, generics.UpdateAPIView):
#     queryset = Payment.objects.filter(active=True)
#     serializer_class = serializers.PaymentSerializer
#     parser_classes = [parsers.MultiPartParser]
