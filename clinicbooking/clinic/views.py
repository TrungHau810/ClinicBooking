
from django.shortcuts import get_object_or_404
from oauthlib.uri_validate import query
from rest_framework.decorators import action
from rest_framework.response import Response
from clinic import serializers, paginators
from rest_framework import viewsets, generics, status, parsers, permissions
from clinic.models import (User, Doctor, Patient, Payment, Appointment, Review,
                           Schedule, Notification, HealthRecord, Message, TestResult)
from django.db.models import Q



class UserViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView, generics.UpdateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

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
                    generics.RetrieveAPIView, generics.UpdateAPIView):
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


class PatientViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView,
                     generics.RetrieveAPIView, generics.UpdateAPIView):
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


class HealthRecordViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView, generics.CreateAPIView):
    queryset = HealthRecord.objects.filter(active=True).prefetch_related('testresult_set')
    serializer_class = serializers.HealthRecordSerializer

    def create(self, request, *args, **kwargs):
        pass


class TestResultViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = TestResult.objects.filter(active=True)
    serializer_class = serializers.TestResultSerializer


class AppointmentViewSet(viewsets.ViewSet, generics.ListAPIView,
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


class MessageViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView, generics.UpdateAPIView):
    queryset = Message.objects.all().order_by('created_date')
    serializer_class = serializers.MessageSerializer

    def get_queryset(self):
        queryset = self.queryset
        appointment_id = self.request.query_params.get('appointment')
        if appointment_id:
            return queryset.filter(test_result__appointment_id=appointment_id)

        sender_id = self.request.query_params.get('sender')
        receiver_id = self.request.query_params.get('receiver')
        if sender_id and receiver_id:
            return queryset.filter(
                Q(sender_id=sender_id, receiver_id=receiver_id) |
                Q(sender_id=receiver_id, receiver_id=sender_id)
            ).order_by('created_date')

        return queryset


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
        if reply_text:
            review.reply = reply_text
            review.save()
            return Response(self.get_serializer(review).data, status=status.HTTP_200_OK)
        return Response({"detail": "Thiếu nội dung phản hồi"}, status=status.HTTP_400_BAD_REQUEST)


# class PaymentViewSet(viewsets.ViewSet):
#     queryset = Payment.objects.all()
#     serializer_class = PaymentSerializer
#
#     @action(detail=True, methods=['post'])
#     def process_payment(self, request, pk=None):
#         payment = get_object_or_404(Payment, pk=pk)
#         payment.status = Payment.PaymentStatus.PAID
#         payment.transaction_id = request.data.get('transaction_id', '')
#         payment.save()
#
#         self.send_payment_success_email(payment)
#
#         return Response({'message': 'Thanh toán thành công'}, status=status.HTTP_200_OK)
#
#     def send_payment_success_email(self, payment):
#         subject = "Thanh toán thành công"
#         message = f"Chào {payment.appointment.patient.first_name},\n\n" \
#                   f"Thanh toán cho dịch vụ khám bệnh của bạn đã được hoàn tất.\n" \
#                   f"Chi tiết:\n" \
#                   f"Phương thức thanh toán: {payment.method}\n" \
#                   f"Số tiền: {payment.amount} VND\n" \
#                   f"Hoá đơn số: {payment.invoice_number}\n\n" \
#                   f"Chúc bạn sức khỏe!"
#         recipient_email = payment.appointment.patient.email
#         send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient_email])