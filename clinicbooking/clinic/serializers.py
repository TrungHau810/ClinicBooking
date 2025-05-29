import random

from django.contrib.auth.tokens import default_token_generator
from django.db.models import Avg
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from clinic.models import (User, Doctor, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification, Hospital, Specialization, PasswordResetOTP)


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


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email không tồn tại.")
        return value

    def create_otp(self, email):
        user = User.objects.get(email=email)
        otp = f"{random.randint(100000, 999999)}"  # 6 chữ số
        PasswordResetOTP.objects.create(user=user, otp_code=otp)

        from django.core.mail import send_mail
        send_mail(
            subject="Mã OTP đặt lại mật khẩu",
            message=f"Mã OTP của bạn là: {otp}. Có hiệu lực trong 10 phút.",
            from_email="noreply@yourdomain.com",
            recipient_list=[email],
        )
        return otp


class OTPConfirmResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("Email không hợp lệ.")

        try:
            otp_obj = PasswordResetOTP.objects.filter(user=user, otp_code=data['otp']).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            raise serializers.ValidationError("OTP không đúng.")

        if otp_obj.is_expired():
            raise serializers.ValidationError("Mã OTP đã hết hạn.")

        data['user'] = user
        return data

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()

        # Xoá OTP sau khi dùng
        PasswordResetOTP.objects.filter(user=user).delete()


class PatientSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class DoctorSerializer(ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)
    # user = UserSerializer(read_only=True)
    doctor_id = serializers.IntegerField(source='user.id', read_only=True)
    doctor = serializers.CharField(source='user.full_name', read_only=True)
    avatar = serializers.CharField(source='user.avatar.url', read_only=True)
    # Phí khám bệnh của bác sĩ
    consultation_fee = serializers.SerializerMethodField()
    # Tổng số lượt đánh giá bác sĩ
    total_reviews = serializers.SerializerMethodField()
    # Số sao trung bình của bác sĩ
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = ['id', 'doctor_id', 'doctor', 'avatar', 'biography', 'license_number', 'license_image', 'active',
                  'hospital_id', 'hospital_name',
                  'specialization', 'specialization_name', 'consultation_fee', 'total_reviews', 'average_rating']

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

    def get_total_reviews(self, obj):
        return Review.objects.filter(doctor=obj.user).count()

    def get_average_rating(self, obj):
        avg_rating = Review.objects.filter(doctor=obj.user).aggregate(Avg('rating'))['rating__avg']
        print(avg_rating)
        return round(avg_rating, 1) if avg_rating else 0  # Trả về 0 nếu chưa có đánh giá

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
    schedule_id = serializers.PrimaryKeyRelatedField(queryset=Schedule.objects.all(), source='schedule',
                                                     write_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'healthrecord_id', 'created_date', 'updated_date',
                  'disease_type', 'symptoms', 'status', 'created_date',
                  'schedule_date', 'schedule_start', 'schedule_end', 'active', 'schedule_id']


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

    class Meta:
        model = Message
        fields = ['id', 'content', 'is_read', 'sender', 'receiver', 'test_result', 'created_date', 'parent_message']


class ReviewSerializer(ModelSerializer):
    class Meta:
        model = Review


class PaymentSerializer(ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'method', 'status', 'created_date', 'updated_date', 'appointment_id']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email không tồn tại.")
        return value

    def create_otp(self, email):
        user = User.objects.get(email=email)
        otp = f"{random.randint(100000, 999999)}"  # 6 chữ số
        PasswordResetOTP.objects.create(user=user, otp_code=otp)

        from django.core.mail import send_mail
        send_mail(
            subject="Mã OTP đặt lại mật khẩu",
            message=f"Mã OTP của bạn là: {otp}. Có hiệu lực trong 10 phút.",
            from_email="noreply@yourdomain.com",
            recipient_list=[email],
        )
        return otp


class OTPConfirmResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("Email không hợp lệ.")

        try:
            otp_obj = PasswordResetOTP.objects.filter(user=user, otp_code=data['otp']).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            raise serializers.ValidationError("OTP không đúng.")

        if otp_obj.is_expired():
            raise serializers.ValidationError("Mã OTP đã hết hạn.")

        data['user'] = user
        return data

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()

        # Xoá OTP sau khi dùng
        PasswordResetOTP.objects.filter(user=user).delete()
