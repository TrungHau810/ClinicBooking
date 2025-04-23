from rest_framework.serializers import ModelSerializer
from clinic.models import (User, Doctor, Patient, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification)


class UserSerializer(ModelSerializer):

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data['avatar'] = f"https://res.cloudinary.com/tthau2004/{instance.avatar}"
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


class MessageSerializer(ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'is_read', 'sender', 'receiver', 'test_result', 'created_date']


class PaymentSerializer(ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'method', 'amount', 'status', 'transaction_id', 'appointment']