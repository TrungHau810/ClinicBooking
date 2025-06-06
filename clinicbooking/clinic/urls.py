from django.urls import path, include
from . import views
from rest_framework.routers import BaseRouter, DefaultRouter
from .views import PasswordResetSendOTPViewSet, PasswordResetConfirmOTPViewSet, DoctorReportViewSet, AdminReportViewSet, \
    UploadLicenseViewSet, PendingDoctorsViewSet, ApproveDoctorView

# from .views import AdminReportViewSet, DoctorReportView

# from .views import DoctorReportView, AdminReportView, NotificationView

router = DefaultRouter()
router.register('hospitals', views.HospitalViewSet, basename='hospital')
router.register('specializations', views.SpecializationViewSet, basename='specialization')
router.register('users', views.UserViewSet, basename='user')
router.register('patients', views.PatientViewSet, basename='patient')
router.register('doctors', views.DoctorViewSet, basename='doctor-info')
# router.register('patients', views.PatientViewSet, basename='patient')
router.register('appointments', views.AppointmentViewSet, basename='appointment')
router.register('schedules', views.ScheduleViewSet, basename='schedule')
router.register('messages', views.MessageViewSet, basename='message')
router.register('healthrecords', views.HealthRecordViewSet, basename='healthrecord')
router.register('testresults', views.TestResultViewSet, basename='testresult')
router.register('reviews', views.ReviewViewSet, basename='review')
router.register('payments', views.PaymentViewSet, basename='payment')
# # router.register('admin-report', views.AdminReportViewSet, basename='adminreport')
router.register('notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('api/password-reset/otp/', PasswordResetSendOTPViewSet.as_view(), name='send_otp'),
    path('api/password-reset/otp/confirm/', PasswordResetConfirmOTPViewSet.as_view(), name='confirm_otp'),
    path('reportsdoctor/', DoctorReportViewSet.as_view(), name='doctorreport'),
    path('reportsadmin/', AdminReportViewSet.as_view(), name='adminreport'),
    # Tạo url cho upload license, duyệt bác sĩ
    path('doctor/upload-license/', UploadLicenseViewSet.as_view(), name='upload_license'),
    path('admin/doctors/pending/', PendingDoctorsViewSet.as_view(), name='pending_doctors'),
    path('admin/doctors/<int:doctor_id>/approve/', ApproveDoctorView.as_view(), name='approve_doctor'),
    # Tạo url cho create-payment-url
    path('create-payment-url/', views.create_payment_url, name='create_payment_url'),
    path('api/vnpay_return/', views.vnpay_return, name='vnpay_return'),
]
