from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from clinic.models import (User, Doctor, HealthRecord, Schedule,
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
        fields = '__all__'


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
        fields = ['id', 'username', 'full_name', 'number_phone', 'avatar', 'email', 'role']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def create(self, validated_data):
        data = validated_data.copy()
        u = User(**data)
        u.set_password(u.password)
        u.save()
        return u


class PatientSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


# class DoctorSerializer(ModelSerializer):
#     class Meta:
#         model = User
#         fields = '__all__'


class DoctorSerializer(ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    doctor = serializers.CharField(source='user.full_name', read_only=True)
    avatar = serializers.CharField(source='user.avatar.url', read_only=True)
    consultation_fee = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = ['id', 'user_id', 'doctor', 'avatar', 'biography', 'license_number', 'license_image', 'active',
                  'hospital_id', 'hospital_name',
                  'specialization', 'specialization_name', 'consultation_fee']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.license_image:
            data['license_image'] = f"{instance.license_image.url}"
        else:
            data['license_image'] = None
        return data

    def get_consultation_fee(self, obj):
        # Format tiền: ví dụ 200000 → "200,000 VNĐ"
        return "{:,.0f} VNĐ".format(obj.consultation_fee)

    def create(self, validated_data):
        request = self.context['request']
        user = request.user  # Người dùng hiện tại (đăng nhập)

        # Gán user cho doctor (vì client không truyền user_id)
        validated_data['user'] = user

        doctor = Doctor.objects.create(**validated_data)
        return doctor


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
    # test_results = TestResultSerializer(source='testresult_set', many=True, read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = HealthRecord
        fields = '__all__'


class AppointmentSerializer(ModelSerializer):
    schedule_date = serializers.DateField(source='schedule.date', read_only=True)
    schedule_start = serializers.TimeField(source='schedule.start_time', read_only=True)
    schedule_end = serializers.TimeField(source='schedule.end_time', read_only=True)
    schedule_id = serializers.PrimaryKeyRelatedField(queryset=Schedule.objects.all(),source='schedule',write_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'healthrecord_id', 'created_date', 'updated_date',
                  'disease_type', 'symptoms', 'status', 'created_date',
                  'schedule_date', 'schedule_start', 'schedule_end', 'active', 'schedule_id']


class ScheduleSerializer(ModelSerializer):
    is_full = serializers.SerializerMethodField()

    def get_is_full(self, schedule):
        booked_count = Appointment.objects.filter(schedule=schedule).count()
        return booked_count >= schedule.capacity

    def create(self, validated_data):
        data = validated_data.copy()
        schedule = Schedule(**data)
        schedule.save()
        return schedule

    class Meta:
        model = Schedule
        fields = ['id', 'date', 'start_time', 'end_time', 'doctor_id', 'capacity', 'is_available', 'is_full']


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
