from django.urls import path, include
from. import views
from rest_framework.routers import BaseRouter, DefaultRouter


router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('doctors', views.DoctorViewSet, basename='doctor')
router.register('patients', views.PatientViewSet, basename='patient')
router.register('appointments', views.AppointmentViewSet, basename='appointment')
router.register('schedules', views.ScheduleViewSet, basename='schedule')
router.register('reviews', views.ReviewViewSet, basename='review')
router.register('payments', views.PaymentViewSet, basename='payment')


urlpatterns = [
    path('', include(router.urls)),
]