from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .models import (Animal, WeightRecord, MedicalRecord, FeedRecord, 
                     Vaccination, BreedingCalendar, HealthAlert, BreedingRecord,
                     ProductionRecord, AnimalProductionMetrics)
from .serializers import (AnimalSerializer, WeightRecordSerializer, MedicalRecordSerializer, 
                          FeedRecordSerializer, VaccinationSerializer, BreedingCalendarSerializer,
                          HealthAlertSerializer, BreedingRecordSerializer,
                          ProductionRecordSerializer, AnimalProductionMetricsSerializer)
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

class VaccinationListCreateView(generics.ListCreateAPIView):
    serializer_class = VaccinationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'vaccine_type']
    search_fields = ['animal__name', 'vaccine_type']
    ordering_fields = ['scheduled_date', 'status']
    ordering = ['scheduled_date']
    
    def get_queryset(self):
        return Vaccination.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class VaccinationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VaccinationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Vaccination.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class BreedingCalendarListCreateView(generics.ListCreateAPIView):
    serializer_class = BreedingCalendarSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['animal__name', 'partner_animal_name']
    ordering_fields = ['breeding_date', 'expected_delivery_date']
    ordering = ['breeding_date']
    
    def get_queryset(self):
        return BreedingCalendar.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class BreedingCalendarDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BreedingCalendarSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return BreedingCalendar.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class HealthAlertListCreateView(generics.ListCreateAPIView):
    serializer_class = HealthAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'alert_type']
    search_fields = ['animal__name', 'title', 'description']
    ordering_fields = ['priority', 'due_date', 'created_at']
    ordering = ['-priority', 'due_date']
    
    def get_queryset(self):
        return HealthAlert.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class BreedingRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = BreedingRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['breeding__animal__name', 'sire_animal__name', 'dam_animal__name']
    ordering_fields = ['delivery_date', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return BreedingRecord.objects.filter(
            breeding__animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class BreedingRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BreedingRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BreedingRecord.objects.filter(
            breeding__animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class ProductionRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductionRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['production_type', 'quality_grade']
    search_fields = ['animal__name', 'notes']
    ordering_fields = ['recorded_date', 'quantity', 'total_market_value']
    ordering = ['-recorded_date']

    def get_queryset(self):
        return ProductionRecord.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class ProductionRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductionRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProductionRecord.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class AnimalProductionMetricsListView(generics.ListAPIView):
    serializer_class = AnimalProductionMetricsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['animal__name']
    ordering_fields = ['annual_revenue', 'annual_profit', 'production_efficiency']
    ordering = ['-annual_revenue']

    def get_queryset(self):
        return AnimalProductionMetrics.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class AnimalProductionMetricsDetailView(generics.RetrieveAPIView):
    serializer_class = AnimalProductionMetricsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AnimalProductionMetrics.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class HealthAlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HealthAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return HealthAlert.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )