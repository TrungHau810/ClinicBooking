from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from clinic.models import (User, Doctor, Patient, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification, Hospital, Specialization, UserType)


class HospitalSerializer(ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'


class SpecializationSerializer(ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'active', 'created_date', 'updated_date', 'name', 'description']


class UserSerializer(ModelSerializer):

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data['avatar'] = f"{instance.avatar.url}"
        else:
            data['avatar'] = None
        return data

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'avatar']


class DoctorSerializer(UserSerializer):

    def create(self, validated_data):
        data = validated_data.copy()
        dr = Doctor(**data)
        dr.set_password(dr.password)
        dr.user_type = 'Dr'
        dr.save()
        return dr

    class Meta:
        model = Doctor
        fields = UserSerializer.Meta.fields + ['id', 'license_number', 'license_image', 'is_verified', 'hospital',
                                               'specialty']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.license_image:
            data['license_image'] = f"{instance.license_image.url}"
        else:
            data['license_image'] = None
        return data


class PatientSerializer(UserSerializer):

    def create(self, validated_data):
        data = validated_data.copy()
        patient = Patient(**data)
        patient.set_password(patient.password)
        patient.user_type = 'Pa'
        patient.save()
        return patient

    class Meta:
        model = Patient
        fields = UserSerializer.Meta.fields + ['gender', 'day_of_birth', 'address', 'email', 'number_phone']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }


class TestResultSerializer(ModelSerializer):
    class Meta:
        model = TestResult
        fields = ['id', 'test_name', 'description', 'image', 'health_record_id']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            data['image'] = f"{instance.image.url}"
        else:
            data['image'] = None
        return data


class HealthRecordSerializer(ModelSerializer):
    test_results = TestResultSerializer(source='testresult_set', many=True, read_only=True)

    class Meta:
        model = HealthRecord
        fields = ['id', 'medical_history', 'test_results', 'patient_id']


class AppointmentSerializer(ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'doctor_id', 'patient_id', 'disease_type', 'symptoms', 'status', 'created_date', 'updated_date']


class ScheduleSerializer(ModelSerializer):

    def create(self, validated_data):
        data = validated_data.copy()
        schedule = Schedule(**data)
        schedule.save()
        return schedule

    class Meta:
        model = Schedule
        fields = ['id', 'date', 'start_time', 'end_time', 'doctor_id', 'capacity']
#
#
# class ReviewSerializer(ModelSerializer):
#     class Meta:
#         model = Review
#         fields = ['id', 'rating', 'comment', 'reply', 'doctor_id', 'patient_id']
#
#
# class PaymentSerializer(ModelSerializer):
#     class Meta:
#         model = Payment
#         fields = ['id','amount', 'method', 'status', 'created_date', 'updated_date', 'appointment_id']
