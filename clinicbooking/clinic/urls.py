from django.urls import path, include
from. import views
from rest_framework.routers import BaseRouter, DefaultRouter


router = DefaultRouter()
router.register('hospitals', views.HospitalViewSet, basename='hospital')
router.register('', views.SpecializationViewSet, basename='specialties')
router.register('users', views.UserViewSet, basename='user')
router.register('doctors', views.DoctorViewSet, basename='doctor')
router.register('patients', views.PatientViewSet, basename='patient')
router.register('appointments', views.AppointmentViewSet, basename='appointment')
router.register('schedules', views.ScheduleViewSet, basename='schedule')
router.register('healthrecords', views.HealthRecordViewSet, basename='healthrecord')
router.register('testresults', views.TestResultViewSet, basename='testresult')
# router.register('reviews', views.ReviewViewSet, basename='review')
# router.register('payments', views.PaymentViewSet, basename='payment')


urlpatterns = [
    path('', include(router.urls)),
]