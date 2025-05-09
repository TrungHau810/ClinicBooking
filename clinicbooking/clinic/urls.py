from django.urls import path, include
from . import views
from rest_framework.routers import BaseRouter, DefaultRouter

from .views import AdminReportViewSet, DoctorReportView

# from .views import DoctorReportView, AdminReportView, NotificationView

router = DefaultRouter()
router.register('hospitals', views.HospitalViewSet, basename='hospital')
router.register('specializations', views.SpecializationViewSet, basename='specialization')
router.register('users', views.UserViewSet, basename='user')
router.register('doctors', views.DoctorViewSet, basename='doctor')
router.register('patients', views.PatientViewSet, basename='patient')
router.register('appointments', views.AppointmentViewSet, basename='appointment')
router.register('schedules', views.ScheduleViewSet, basename='schedule')
router.register('messages', views.MessageViewSet, basename='message')
router.register('healthrecords', views.HealthRecordViewSet, basename='healthrecord')
router.register('testresults', views.TestResultViewSet, basename='testresult')
router.register('reviews', views.ReviewViewSet, basename='review')
router.register('payments', views.PaymentViewSet, basename='payment')
# router.register('admin-report', views.AdminReportViewSet, basename='adminreport')


urlpatterns = [
    path('', include(router.urls)),
    path('reportsdoctor/', DoctorReportView.as_view(), name='doctorreport'),
    path('reportsadmin/', AdminReportViewSet.as_view(), name='adminreport'),
]