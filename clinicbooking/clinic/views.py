from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.response import Response
from clinic import serializers, paginators
from rest_framework import viewsets, generics, status, parsers, permissions
from clinic.models import (User, Doctor, Patient, Payment, Appointment, Review,
                           Schedule, Notification, HealthRecord, Message, TestResult)


class UserViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView, generics.UpdateAPIView,
                  generics.DestroyAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    pagination_class = paginators.UserPagination


class DoctorViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView,
                    generics.RetrieveAPIView, generics.UpdateAPIView):
    queryset = Doctor.objects.filter(is_verified=True)
    serializer_class = serializers.DoctorSerializer
    parser_classes = [parsers.MultiPartParser]

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

    @action(methods=['get'], detail=True, url_path="appointments")
    def get_appointment(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        if patient:
            appointments = patient.appointment_set.all()
            return Response(serializers.AppointmentSerializer(appointments, many=True).data,
                            status=status.HTTP_404_NOT_FOUND)

        return Response({'error': "Patient not found"}, status=status.HTTP_404_NOT_FOUND)


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


class ReviewViewSet(viewsets.ViewSet, generics.RetrieveAPIView, generics.ListAPIView,
                    generics.DestroyAPIView, generics.UpdateAPIView):
    queryset = Review.objects.filter().all()
    serializer_class = serializers.ReviewSerializer
    parser_classes = [parsers.MultiPartParser]


class PaymentViewSet(viewsets.ViewSet, generics.ListAPIView, generics.UpdateAPIView):
    queryset = Payment.objects.filter(active=True)
    serializer_class = serializers.PaymentSerializer
    parser_classes = [parsers.MultiPartParser]
