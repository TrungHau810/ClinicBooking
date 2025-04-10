from rest_framework.serializers import ModelSerializer
from clinic.models import (User, Doctor, Patient, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification)


class DoctorSerializer(ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'username']
