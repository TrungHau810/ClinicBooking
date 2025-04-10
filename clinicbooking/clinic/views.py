from rest_framework.decorators import action
from rest_framework.response import Response
from clinic import serializers
from rest_framework import viewsets, generics, status, parsers, permissions
from clinic.models import Doctor, Payment, Patient

# Create your views here.
class DoctorViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Doctor.objects.filter(is_verified=True)  # Lấy các course có active là True
    serializer_class = serializers.DoctorSerializer