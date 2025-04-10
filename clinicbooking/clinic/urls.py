from django.urls import path, include
from . import views
from rest_framework.routers import BaseRouter, DefaultRouter


router = DefaultRouter()
router.register('doctors', views.DoctorViewSet, basename='doctor')


urlpatterns = [
    path('', include(router.urls)),
]