from django.contrib import admin
from clinic.models import (User, DoctorInfo, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification, Hospital, Specialization)
from oauth2_provider.models import Application, AccessToken
from django.utils.html import mark_safe
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django import forms


class MyAppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'schedule', 'disease_type', 'status']


class MyDoctorInfoAdmin(admin.ModelAdmin):
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


class MyHealthRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_name', 'gender', 'day_of_birth', 'address', 'CCCD', 'email', 'user', 'medical_history',
                    'created_date', 'active']
    search_fields = ['id', 'full_name', 'CCCD']

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
    list_display = ['id', 'username', 'full_name', 'email', 'number_phone', 'is_active']
    search_fields = ['username', 'full_name']
    list_filter = ['id']
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


class MyDoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ['id', 'doctor_id', 'doctor_name', 'date', 'start_time', 'end_time', 'capacity', 'is_available']

    def doctor_name(self, doctor):
        return doctor.doctor.full_name


class MyPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'formatted_amount', 'method', 'status', 'created_date', 'updated_date', 'appointment_id']

    def formatted_amount(self, obj):
        return f"{obj.amount:,.0f} ₫"


class MyTestResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'test_name', 'created_date', 'updated_date']


class MySpecializationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'active']


class ClinicAdminSite(admin.AdminSite):
    site_header = 'Hệ thống quản trị đặt lịch khám sức khoẻ trực tuyến'
    site_title = "Clinic Admin"
    index_title = 'Trang quản trị'


admin_site = ClinicAdminSite(name='myadmin')

admin_site.register(User, MyUserAdmin)
admin_site.register(DoctorInfo, MyDoctorInfoAdmin)
admin_site.register(HealthRecord, MyHealthRecordAdmin)
admin_site.register(Schedule, MyDoctorScheduleAdmin)
admin_site.register(TestResult, MyTestResultAdmin)
admin_site.register(Message)
admin_site.register(Appointment, MyAppointmentAdmin)
admin_site.register(Review)
admin_site.register(Payment, MyPaymentAdmin)
admin_site.register(Notification)
admin_site.register(Hospital, MyHospitalAdmin)
admin_site.register(Specialization, MySpecializationAdmin)

admin_site.register(Application)
admin_site.register(AccessToken)
