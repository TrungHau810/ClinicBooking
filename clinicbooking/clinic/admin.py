from django.contrib import admin
from clinic.models import (User, Doctor, Patient, HealthRecord, Schedule,
                           Appointment, Review, Message,
                           Payment, TestResult, Notification, Hospital, Specialization)
from django.utils.html import mark_safe
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django import forms


class MyUserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'first_name', 'last_name', 'gender', 'email', 'number_phone', 'is_active']
    search_fields = ['username', 'first_name', 'last_name']
    list_filter = ['id']
    readonly_fields = ['avatar_view']

    # Gỡ bỏ các field không mong muốn, chỉ hiển thị các fied cần thiết
    fieldsets = (
        ("Thông tin tài khoản", {'fields': ('username', 'password')}),
        ('Thông tin cá nhân', {'fields': ('first_name', 'last_name', 'gender', 'number_phone', 'email')}),
        ('Thông tin khác', {'fields': ('avatar', 'avatar_view', 'user_type')}),
    )

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


class MyDoctorAdmin(MyUserAdmin):
    list_display = MyUserAdmin.list_display + ['license_number', 'is_verified']
    readonly_fields = ['avatar_view', 'license_view']
    fieldsets = MyUserAdmin.fieldsets + (
        ("Giấy phép hành nghề", {'fields': ('license_number', 'license_image', 'license_view', 'is_verified')}),
        ("Nơi làm việc", {'fields': ('hospital', 'specialization')}),
    )

    def get_changeform_initial_data(self, request):
        return {'user_type': 'Dr'}

    def license_view(self, doctor):
        if doctor.license_image:
            return mark_safe(f"<img src='{doctor.license_image.url}' width=500 />")
        return "Không có giấy phép hành nghề"


class MyPatientAdmin(MyUserAdmin):
    fieldsets = (
        ("Thông tin tài khoản", {'fields': ('username', 'password')}),
        ('Thông tin cá nhân', {
            'fields': ('first_name', 'last_name', 'gender', 'day_of_birth', 'number_phone', 'address', 'email')
            # thêm ở đây
        }),
        ('Thông tin khác', {
            'fields': ('avatar', 'avatar_view', 'user_type')
        }),
    )


class MyAppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'disease_type', 'booked_at']


class MyDoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ['id', 'date', 'start_time', 'end_time', 'capacity', 'is_available', 'doctor_id']


class MyPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'formatted_amount', 'method', 'status', 'created_date', 'updated_date', 'appointment_id']

    def formatted_amount(self, obj):
        return f"{obj.amount:,.0f} ₫"


class MyHealthRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'id_patient', 'patient_username', 'medical_history', 'active', 'created_date', 'updated_date']

    def id_patient(self, patient):
        return patient.patient_id

    def patient_username(self, patient):
        first_name = patient.patient.first_name
        last_name = patient.patient.last_name
        return (f"{last_name} {first_name}")

    id_patient.short_description = 'ID bệnh nhân'
    patient_username.short_description = 'Tên tài khoản bệnh nhân'


class MyTestResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'test_name', 'created_date', 'updated_date']


class MyMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender_id', 'receiver_id']


class MySpecializationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'active']


class HospitalForm(forms.ModelForm):
    description = forms.CharField(widget=CKEditorUploadingWidget)

    class Meta:
        model = Hospital
        fields = '__all__'


class MyHospitalAdmin(admin.ModelAdmin):
    forms= HospitalForm

    list_display = ['id', 'name', 'address', 'active', 'phone']


class ClinicAdminSite(admin.AdminSite):
    site_header = 'Hệ thống quản trị đặt lịch khám sức khoẻ trực tuyến'
    site_title = "Clinic Admin"
    index_title = 'Trang quản trị'


admin_site = ClinicAdminSite(name='myadmin')

admin_site.register(User, MyUserAdmin)
admin_site.register(Doctor, MyDoctorAdmin)
admin_site.register(Patient, MyPatientAdmin)
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
