from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from clinic.models import (User, DoctorInfo, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification, Hospital, Specialization)


class HospitalSerializer(ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            data['logo'] = f"{instance.logo.url}"
        else:
            data['logo'] = None
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
        fields = ['id', 'username', 'full_name', 'number_phone', 'avatar', 'email']


class PatientSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class DoctorSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class DoctorInfoSerializer(ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)

    class Meta:
        model = DoctorInfo
        fields = ['id', 'biography', 'license_number', 'license_image', 'active',
                  'hospital_name',
                  'specialization', 'specialization_name']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.license_image:
            data['license_image'] = f"{instance.license_image.url}"
        else:
            data['license_image'] = None
        return data


class TestResultSerializer(ModelSerializer):
    class Meta:
        model = TestResult
        fields = ['id', 'test_name', 'description', 'image', 'health_record_id']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.iamge:
            data['image'] = f"{instance.iamge.url}"
        else:
            data['image'] = None
        return data


class HealthRecordSerializer(ModelSerializer):
    test_results = TestResultSerializer(source='testresult_set', many=True, read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    # day_of_birth = serializers.DateField(format='%Y-%m-%d', input_formats=['%Y-%m-%d'])

    class Meta:
        model = HealthRecord
        fields = '__all__'
        # fields = ['user', 'full_name', 'gender', 'day_of_birth', 'BHYT', 'CCCD',
        #           'email', 'number_phone', 'address', 'occupation', 'medical_history']



class AppointmentSerializer(ModelSerializer):
    schedule_date = serializers.DateField(source='schedule.date', read_only=True)
    schedule_start = serializers.TimeField(source='schedule.start_time', read_only=True)
    schedule_end = serializers.TimeField(source='schedule.end_time', read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'active', 'created_date', 'updated_date',
                  'disease_type', 'symptoms', 'status', 'created_date',
                  'schedule_date', 'schedule_start', 'schedule_end', 'user_id', 'cancel_reason',
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


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


