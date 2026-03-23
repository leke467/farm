from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .models import Crop, GrowthStage, CropActivity, Harvest
from .serializers import CropSerializer, GrowthStageSerializer, CropActivitySerializer, HarvestSerializer
from farms.models import Farm

class CropListCreateView(generics.ListCreateAPIView):
    serializer_class = CropSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'stage']
    search_fields = ['name', 'field', 'variety']
    ordering_fields = ['name', 'planted_date', 'expected_harvest_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Crop.objects.none()
        return Crop.objects.filter(farm__in=user_farms)

class CropDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CropSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Crop.objects.none()
        return Crop.objects.filter(farm__in=user_farms)

class GrowthStageListCreateView(generics.ListCreateAPIView):
    serializer_class = GrowthStageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        crop_id = self.kwargs.get('crop_id')
        return GrowthStage.objects.filter(
            crop_id=crop_id,
            crop__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class CropActivityListCreateView(generics.ListCreateAPIView):
    serializer_class = CropActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        crop_id = self.kwargs.get('crop_id')
        return CropActivity.objects.filter(
            crop_id=crop_id,
            crop__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class HarvestListCreateView(generics.ListCreateAPIView):
    serializer_class = HarvestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        crop_id = self.kwargs.get('crop_id')
        return Harvest.objects.filter(
            crop_id=crop_id,
            crop__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )