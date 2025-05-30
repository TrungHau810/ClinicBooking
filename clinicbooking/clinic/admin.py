from django.utils import timezone
from django.contrib import admin
from django.db.models import Count, Sum
from django.template.response import TemplateResponse
from django.urls import path
from django.utils.timezone import now, localtime

from clinic.models import (User, Doctor, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification, Hospital, Specialization, PasswordResetOTP)
from oauth2_provider.models import Application, AccessToken
from django.utils.html import mark_safe
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django import forms


class MyAppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'healthrecord', 'schedule', 'disease_type', 'amount', 'status', 'cancel']

    def amount(self, appointment):
        amount = appointment.schedule.doctor.doctor.consultation_fee
        return f"{amount:,.0f} ₫"


class AppointmentInline(admin.StackedInline):
    model = Appointment
    fk_name = 'schedule'


class MyDoctorAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'doctor_fullname', 'license_number', 'hospital_name', 'specialization', 'active']
    search_fields = ['id', 'doctor_fullname', 'license_number']
    list_filter = ['hospital', 'specialization']
    readonly_fields = ['license_image_view']

    # Lọc user có role là doctor
    def formfield_for_dbfield(self, db_field, **kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(role="doctor")
        return super().formfield_for_dbfield(db_field, **kwargs)

    def doctor_fullname(self, user):
        return user.user.full_name

    def hospital_name(self, hospital):
        return hospital.hospital.name

    def license_image_view(self, doctorinfo):
        if doctorinfo.license_image:
            return mark_safe(f"<img src='{doctorinfo.license_image.url}' width=250 />")
        return "Không có ảnh đại diện"

    # avatar_view.short_description = "Ảnh đại diện"


class TestResultInline(admin.StackedInline):
    model = TestResult
    fk_name = 'health_record'


class MyHealthRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_name', 'gender', 'day_of_birth', 'address', 'BHYT', 'CCCD', 'email', 'user',
                    'medical_history',
                    'created_date', 'active']
    search_fields = ['id', 'full_name', 'CCCD']
    inlines = [TestResultInline, ]

    # Lọc user có role là patient (BN)
    def formfield_for_dbfield(self, db_field, **kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(role="patient")
        return super().formfield_for_dbfield(db_field, **kwargs)


class HospitalForm(forms.ModelForm):
    description = forms.CharField(widget=CKEditorUploadingWidget)

    class Meta:
        model = Hospital
        fields = '__all__'


class MyHospitalAdmin(admin.ModelAdmin):
    forms = HospitalForm

    list_display = ['id', 'name', 'address', 'phone', 'active']


class MyMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender_id', 'receiver_id']


class MyUserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'full_name', 'email', 'number_phone', 'role', 'is_active']
    search_fields = ['username', 'full_name']
    list_filter = ['id', 'role']
    readonly_fields = ['avatar_view']

    def avatar_view(self, user):
        if user.avatar:
            return mark_safe(f"<img src='{user.avatar.url}' width=200 />")
        return "Không có ảnh đại diện"

    avatar_view.short_description = "Ảnh đại diện"

    def save_model(self, request, user, form, change):
        if form.cleaned_data.get('password'):
            raw_password = form.cleaned_data['password']
            if not raw_password.startswith('pbkdf2_'):  # chỉ set nếu là mật khẩu mới
                user.set_password(raw_password)

            super().save_model(request, user, form, change)


class MyScheduleAdmin(admin.ModelAdmin):
    list_display = ['id', 'doctor_id', 'doctor_name', 'date', 'start_time', 'end_time', 'capacity', 'sum_booking',
                    'active']
    inlines = [AppointmentInline, ]

    # Lọc user có role là doctor
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "doctor":
            kwargs["queryset"] = User.objects.filter(role="doctor", doctor__isnull=False)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def doctor_name(self, doctor):
        return doctor.doctor.full_name


class MyPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'appointment_id', 'schedule', 'health_record', 'amount', 'method', 'status', 'created_date',
                    'updated_date']

    def amount(self, obj):
        return f"{obj.amount:,.0f} ₫"

    def health_record(self, appointment):
        return appointment.appointment.healthrecord

    def schedule(self, appointment):
        return appointment.appointment.schedule


class MyTestResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'test_name', 'created_date', 'updated_date', 'health_record']
    readonly_fields = ['image_view']

    def image_view(self, test_result):
        if test_result.image:
            return mark_safe(f"<img src='{test_result.image.url}' width=200 />")
        return "Không có ảnh đại diện"

    image_view.short_description = "Ảnh đại diện"


class MySpecializationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'active']


class MyNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'content', 'created_date', 'updated_date']


class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient_id', 'patient_name', 'doctor_id', 'doctor_name', 'rating', 'comment', 'reply',
                    'created_date']

    def patient_name(self, patient):
        return patient.patient.username

    def doctor_name(self, doctor):
        return doctor.doctor.full_name


class MonthYearForm(forms.Form):
    year = forms.IntegerField(
        label='Năm',
        initial=2025,  # Hoặc dùng datetime.now().year để lấy năm hiện tại
        widget=forms.NumberInput(attrs={'min': 2000, 'max': 9999})
    )
    month = forms.IntegerField(
        label='Tháng',
        initial=5,  # Hoặc dùng datetime.now().month để lấy tháng hiện tại
        widget=forms.NumberInput(attrs={'min': 1, 'max': 12})
    )


class MyAccessTokenAdmin(admin.ModelAdmin):
    list_display = ['id', 'token', 'user']


class MyPasswordResetOTPAdmin(admin.ModelAdmin):
    pass


class ClinicAdminSite(admin.AdminSite):
    site_header = 'Hệ thống quản trị đặt lịch khám sức khoẻ trực tuyến'
    site_title = "Clinic Admin"
    index_title = 'Trang quản trị đặt lịch khám sức khoẻ'

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['server_time'] = timezone.now().isoformat()
        return super().index(request, extra_context=extra_context)

    def get_urls(self):
        return [path('clinics-stats/', self.clinic_stats_view)] + super().get_urls()

    def clinic_stats_view(self, request):
        stats = Appointment.objects.values('disease_type').annotate(appointment_count=Count('id'))

        # Tổng số lượt khám
        total_appointments = Appointment.objects.count()

        # Doanh thu: trong Payment
        total_revenue = Payment.objects.aggregate(total=Sum('amount'))['total'] or 0
        total_revenue = f"{total_revenue:,.0f}"

        return TemplateResponse(request, 'admin/stats.html', {
            'stats': stats,
            'total_appointments': total_appointments,
            'total_revenue': total_revenue,
        })


admin_site = ClinicAdminSite(name='myadmin')

admin_site.register(User, MyUserAdmin)
admin_site.register(Doctor, MyDoctorAdmin)
admin_site.register(HealthRecord, MyHealthRecordAdmin)
admin_site.register(Schedule, MyScheduleAdmin)
admin_site.register(TestResult, MyTestResultAdmin)
admin_site.register(Message)
admin_site.register(Appointment, MyAppointmentAdmin)
admin_site.register(Review, ReviewAdmin)
admin_site.register(Payment, MyPaymentAdmin)
admin_site.register(Notification, MyNotificationAdmin)
admin_site.register(Hospital, MyHospitalAdmin)
admin_site.register(Specialization, MySpecializationAdmin)

admin_site.register(Application)
admin_site.register(AccessToken, MyAccessTokenAdmin)
admin_site.register(PasswordResetOTP, MyPasswordResetOTPAdmin)
