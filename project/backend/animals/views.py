from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .models import Animal, WeightRecord, MedicalRecord, FeedRecord
from .serializers import AnimalSerializer, WeightRecordSerializer, MedicalRecordSerializer, FeedRecordSerializer
from farms.models import Farm

class AnimalListCreateView(generics.ListCreateAPIView):
    serializer_class = AnimalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['animal_type', 'status', 'is_group']
    search_fields = ['name', 'breed', 'animal_type']
    ordering_fields = ['name', 'created_at', 'birth_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Animal.objects.none()
        return Animal.objects.filter(farm__in=user_farms)

class AnimalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnimalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Animal.objects.none()
        return Animal.objects.filter(farm__in=user_farms)

class WeightRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = WeightRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        animal_id = self.kwargs.get('animal_id')
        return WeightRecord.objects.filter(
            animal_id=animal_id,
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class MedicalRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        animal_id = self.kwargs.get('animal_id')
        return MedicalRecord.objects.filter(
            animal_id=animal_id,
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class FeedRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        animal_id = self.kwargs.get('animal_id')
        return FeedRecord.objects.filter(
            animal_id=animal_id,
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )