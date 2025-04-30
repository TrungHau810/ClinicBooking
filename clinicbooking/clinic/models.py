from django.utils import timezone
from datetime import datetime, timedelta
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField


# Create your models here.
class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# Loại user dạng Enum
class UserType(models.TextChoices):
    ADMIN = 'Ad', 'Admin'
    DOCTOR = 'Dr', 'Doctor'
    PATIENT = 'Pa', 'Patient'


# Giới tính dang enum
class Gender(models.TextChoices):
    MALE = 'Male', 'Nam'
    FEMALE = 'Female', 'Nữ'


class User(AbstractUser):
    avatar = CloudinaryField(null=False)
    number_phone = models.CharField(max_length=10, unique=True, blank=False, null=False)
    gender = models.CharField(max_length=10, choices=Gender, default=Gender.MALE)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    user_type = models.CharField(max_length=10, choices=UserType, default=UserType.PATIENT)

    # Ghi đè lại các field của AbstractUser để bắt buộc nhập
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)
    email = models.EmailField(unique=True, blank=False, null=False)

    class Meta:
        abstract: True

    def __str__(self):
        return self.username


class Patient(User):
    user_type = UserType.PATIENT
    day_of_birth = models.DateField()
    address = models.CharField(max_length=255, null=True)

    class Meta:
        verbose_name = "Patient"


class Hospital(BaseModel):
    name = models.CharField(max_length=255)
    address = models.TextField(max_length=200)
    phone = models.CharField(max_length=10)

    def __str__(self):
        return self.name


class Specialization(BaseModel):
    name = models.CharField(max_length=50, null=False, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Doctor(User):
    license_number = models.CharField(max_length=20, unique=True, null=False)
    license_image = CloudinaryField(null=False)
    biography = models.CharField(max_length=255, null=True)
    is_verified = models.BooleanField(default=False)
    hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT)
    specialization = models.ForeignKey(Specialization, on_delete=models.PROTECT)
    user_type = UserType.DOCTOR

    class Meta:
        verbose_name = "Doctor"


class HealthRecord(BaseModel):
    medical_history = models.CharField(max_length=255, null=True)
    patient = models.OneToOneField(Patient, on_delete=models.PROTECT)

    def __str__(self):
        return self.patient.username


class Notification(BaseModel):
    class NotifyType(models.TextChoices):
        NHAC_NHO = 'nhac_nho', 'Nhắc nhở'
        UU_DAI = 'uu_dai', 'Ưu đãi'
        HE_THONG = 'he_thong', 'Hệ thống'

    class NotifyForm(models.TextChoices):
        EMAIL = 'email', 'Email'
        PUSH = 'push', 'Push Notification'

    content = models.CharField(max_length=255, null=False)
    send_at = models.DateTimeField(null=False)
    type = models.CharField(max_length=20, choices=NotifyType, default=NotifyType.NHAC_NHO)
    form = models.CharField(max_length=20, choices=NotifyForm, default=NotifyForm.EMAIL)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)


class TestResult(BaseModel):
    test_name = models.CharField(max_length=255, null=False)
    description = models.CharField(max_length=255, null=True)
    image = CloudinaryField(null=False)
    health_record = models.ForeignKey(HealthRecord, on_delete=models.PROTECT, null=False)

    def __str__(self):
        return self.test_name


class Message(BaseModel):
    content = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='sent_messages', null=True)
    receiver = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='received_messages', null=True)
    test_result = models.OneToOneField(TestResult, on_delete=models.SET_NULL, null=True)
    parent_message = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')

    def __str__(self):
        return (f"{self.sender} - {self.receiver}")


class Review(BaseModel):
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    reply = models.TextField(blank=True, null=True)
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, related_name='reviews', null=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, related_name='reviews_received', null=True)

    def __str__(self):
        return (f"{self.rating - self.comment}")


class Schedule(BaseModel):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    capacity = models.IntegerField(default=1)

    def __str__(self):
        return (f"Ngày {self.date.strftime('%d/%m/%Y')}: "
                f"{self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}")


class Appointment(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Đang chờ xác nhận'
        CONFIRMED = 'confirmed', 'Đã xác nhận'
        COMPLETED = 'completed', 'Đã hoàn thành'
        CANCELED = 'canceled', 'Đã hủy'

    patient = models.ForeignKey(Patient, on_delete=models.PROTECT)
    doctor = models.ForeignKey(Doctor, on_delete=models.PROTECT)
    schedule = models.OneToOneField(Schedule, on_delete=models.CASCADE)
    disease_type = models.CharField(max_length=255, null=False)
    symptoms = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status, default=Status.PENDING)
    booked_at = models.DateTimeField(auto_now_add=True)
    cancel_reason = models.TextField(blank=True, null=True)
    rescheduled_from = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.patient} - {self.schedule}"

    @property
    def can_cancel_or_reschedule(self):
        appointment_datetime = datetime.combine(self.schedule.date, self.schedule.start_time)
        appointment_datetime = timezone.make_aware(appointment_datetime)  # 👈 make it timezone-aware
        return appointment_datetime - timezone.now() >= timedelta(hours=24)


class Payment(BaseModel):
    class PaymentMethod(models.TextChoices):
        MOMO = 'momo', 'MoMo'
        VNPAY = "vnpay", "VNPay"

    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', 'Đang xử lý'
        PAID = 'paid', 'Đã thanh toán'
        FAILED = 'failed', 'Thất bại'

    method = models.CharField(max_length=20, choices=PaymentMethod)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PaymentStatus, default=PaymentStatus.PENDING)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    appointment = models.OneToOneField(Appointment, on_delete=models.PROTECT, related_name='payment')
