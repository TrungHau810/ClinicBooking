from ckeditor.fields import RichTextField
from django.db.models.fields import TextField
from django.utils import timezone
from datetime import datetime, timedelta
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from rest_framework.exceptions import ValidationError


# ---------- BaseModel ---------- #
class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ---------- User ---------- #
class User(AbstractUser):
    """
    Model User: Lưu trữ thông tin tài khoản người dùng như:
     username, password, fullname, email và role
    """
    ROLE_CHOICES = (
        ('admin', 'Quản trị viên'),
        ('patient', 'Bệnh nhân'),
        ('doctor', 'Bác sĩ'),
    )
    number_phone = models.CharField(max_length=11, null=False, unique=True)
    avatar = CloudinaryField(null=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=False, null=False)

    def __str__(self):
        return self.username


class Hospital(BaseModel):
    name = models.CharField(max_length=255)
    address = models.TextField(max_length=200)
    logo = CloudinaryField(null=False)
    description = RichTextField()
    phone = models.CharField(max_length=10)

    def __str__(self):
        return self.name


class Specialization(BaseModel):
    name = models.CharField(max_length=50, null=False, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Doctor(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    license_number = models.CharField(max_length=20, unique=True, null=False)
    license_image = CloudinaryField(null=False)
    biography = models.CharField(max_length=255, null=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT)
    specialization = models.ForeignKey(Specialization, on_delete=models.PROTECT)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=100000,
                                           help_text="Giá khám bệnh (VND)"
                                           )

    def __str__(self):
        return (f"BS {self.user.full_name} - BV {self.hospital.name} - {self.specialization.name}")


class HealthRecord(BaseModel):
    OCCUPATION_CHOICES = [
        ('doctor', 'Bác sĩ'),
        ('nurse', 'Y tá'),
        ('teacher', 'Giáo viên'),
        ('engineer', 'Kỹ sư'),
        ('student', 'Học sinh/Sinh viên'),
        ('worker', 'Công nhân'),
        ('freelancer', 'Làm tự do'),
        ('office_staff', 'Nhân viên văn phòng'),
        ('business', 'Kinh doanh'),
        ('driver', 'Tài xế'),
        ('farmer', 'Nông dân'),
        ('police', 'Công an'),
        ('other', 'Khác'),
    ]
    GENDER_CHOICES = [
        ('male', 'Nam'),
        ('female', 'Nữ')
    ]

    full_name = models.CharField(max_length=100, null=False)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    number_phone = models.CharField(max_length=10, blank=False, null=False)
    email = models.EmailField(blank=False, null=False)
    CCCD = models.CharField(max_length=12, unique=True, null=False)
    BHYT = models.CharField(max_length=10, null=False, unique=True)
    day_of_birth = models.DateField()
    occupation = models.CharField(max_length=50, choices=OCCUPATION_CHOICES, null=False)
    address = models.CharField(max_length=255, null=False)
    medical_history = RichTextField()
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='health_records')

    def __str__(self):
        return (f'BN. {self.full_name} - TK {self.user}')


class Notification(BaseModel):
    class NotifyType(models.TextChoices):
        UU_DAI = 'uu_dai', 'Ưu đãi'
        KHAM_SK = 'kham_sk', 'Khám sức khoẻ định kỳ'

    title = models.CharField(max_length=255, blank=False, null=False)
    content = RichTextField()
    type = models.CharField(max_length=20, choices=NotifyType, default=NotifyType.UU_DAI)
    send_at = models.DateTimeField(null=False)
    is_read = models.BooleanField(default=False)
    users = models.ManyToManyField('User')


class TestResult(BaseModel):
    test_name = models.CharField(max_length=255, null=False)
    description = models.CharField(max_length=255, null=True)
    image = CloudinaryField(null=False)
    health_record = models.ForeignKey(HealthRecord, on_delete=models.PROTECT, null=False)

    def __str__(self):
        return (f'{self.health_record.full_name} - {self.test_name}')


class Message(BaseModel):
    content = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='sent_messages', null=True)
    receiver = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='received_messages', null=True)
    test_result = models.OneToOneField(TestResult, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return (f"{self.sender} - {self.receiver}")

    def clean(self):
        if self.sender == self.receiver:
            raise ValidationError("Người gửi và người nhận không được giống nhau.")


class Review(BaseModel):
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    reply = models.TextField(blank=True, null=True)
    patient = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='reviews', null=True)
    doctor = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='reviews_received', null=True)

    def __str__(self):
        return f"Review by {self.patient} for {self.doctor}: {self.rating}⭐ - {self.comment} - {self.reply if self.reply else 'None'}"


class Schedule(BaseModel):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.IntegerField(default=1)
    sum_booking = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        """
        Cập nhật trạng thái active của schedule (Tức là lịch đó còn khả dụng/trống không)
        :param args:
        :param kwargs:
        :return:
        """
        self.active = self.sum_booking < self.capacity
        super().save(*args, **kwargs)

    class Meta:
        # Tránh bác sĩ bị trùng ngày và giờ bắt đầu
        unique_together = ('doctor', 'date', 'start_time')

    def __str__(self):
        return (f"ID {self.pk} - {self.doctor.username} - ngày {self.date.strftime('%d/%m/%Y')}: "
                f"{self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}")


class Appointment(BaseModel):
    STATUS_CHOICES = [
        ('unpaid', 'Chưa thanh toán'),
        ('paid', 'Đã thanh toán'),
        ('completed', 'Đã khám'),
        ('cancelled', 'Đã hủy'),
    ]

    DISEASE_TYPE_CHOICES =[
        ('HoHap','Đường hô hấp'),
        ('TieuHoa','Đường tiêu hoá'),
        ('TK_TT', 'Thần kinh - Tâm thần'),
        ('Mat', 'Bệnh về Mắt'),
        ('ChanThuong', 'Chấn thương - chỉnh hình'),
        ('DaLieu', 'Da liễu'),
        ('TaiMuiHong', 'Tai - Mũi - Họng'),
        ('Khac', 'Khác'),

    ]

    healthrecord = models.ForeignKey(HealthRecord, on_delete=models.PROTECT)
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE)
    disease_type = models.TextField(max_length=20, choices=DISEASE_TYPE_CHOICES)
    symptoms = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    reason = models.CharField(max_length=150, blank=True, null=True)
    cancel = models.BooleanField(default=False)

    class Meta:
        ordering = ['-id']
        unique_together = ('healthrecord', 'schedule')

    def __str__(self):
        return f"{self.healthrecord} - {self.schedule}"


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

    def __str__(self):
        return (f'Payment_id {self.pk} - {self.appointment} - {self.status}')


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return(f"username: {self.user} - OTP Code:{self.otp_code}")