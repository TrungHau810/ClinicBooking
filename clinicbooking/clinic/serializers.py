from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from clinic.models import (User, Doctor, Patient, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification, Hospital, Specialization, UserType)


class HospitalSerializer(ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            data['image'] = f"{instance.image.url}"
        else:
            data['image'] = None
        return data


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
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar', 'number_phone', 'email', 'gender']


class DoctorSerializer(UserSerializer):

    def create(self, validated_data):
        data = validated_data.copy()
        dr = Doctor(**data)
        dr.set_password(dr.password)
        dr.user_type = 'Dr'
        dr.save()
        return dr

    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)

    class Meta:
        model = Doctor
        fields = UserSerializer.Meta.fields + ['id', 'biography', 'license_number', 'license_image', 'is_verified',
                                               'hospital_name',
                                               'specialization', 'specialization_name']
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
    schedule_date = serializers.DateField(source='schedule.date', read_only=True)
    schedule_start = serializers.TimeField(source='schedule.start_time', read_only=True)
    schedule_end = serializers.TimeField(source='schedule.end_time', read_only=True)
    class Meta:
        model = Appointment
        fields = ['id', 'active', 'created_date', 'updated_date',
                  'disease_type', 'symptoms', 'status', 'booked_at',
                  'schedule_date','schedule_start','schedule_end', 'patient_id', 'cancel_reason',
                  'rescheduled_from_id']


class ScheduleSerializer(ModelSerializer):

    def create(self, validated_data):
        data = validated_data.copy()
        schedule = Schedule(**data)
        schedule.save()
        return schedule

    class Meta:
        model = Schedule
        fields = ['id', 'date', 'start_time', 'end_time', 'doctor_id', 'capacity']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Message
        fields = ['id', 'content', 'is_read', 'sender', 'receiver', 'test_result', 'created_date', 'parent_message']


class ReviewSerializer(ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'reply', 'doctor', 'patient']


class PaymentSerializer(ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'method', 'status', 'created_date', 'updated_date', 'appointment_id']
