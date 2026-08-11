from rest_framework import generics, permissions
from farms.permissions import FarmMenuPermission
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .models import (Animal, WeightRecord, MedicalRecord, FeedRecord, 
                     Vaccination, BreedingCalendar, HealthAlert, BreedingRecord,
                     ProductionRecord, AnimalProductionMetrics, FeedMix, FeedMixItem, RecurringFeedSchedule)
from .serializers import (AnimalSerializer, WeightRecordSerializer, MedicalRecordSerializer, 
                          FeedRecordSerializer, VaccinationSerializer, BreedingCalendarSerializer,
                          HealthAlertSerializer, BreedingRecordSerializer,
                          ProductionRecordSerializer, AnimalProductionMetricsSerializer,
                          FeedMixSerializer, FeedMixItemSerializer, RecurringFeedScheduleSerializer)
from farms.models import Farm

class AnimalListCreateView(generics.ListCreateAPIView):
    serializer_class = AnimalSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
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

    def perform_create(self, serializer):
        farm_id = self.request.data.get('farm') or self.request.query_params.get('farm')
        farm = None
        if farm_id:
            try:
                farm = Farm.objects.get(pk=farm_id)
            except (Farm.DoesNotExist, ValueError):
                pass
        if not farm:
            farm = Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            ).first()
        serializer.save(farm=farm)

class AnimalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnimalSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Animal.objects.none()
        return Animal.objects.filter(farm__in=user_farms)

    def update(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        logger.warning("=== ANIMAL PATCH/PUT ===")
        logger.warning(f"Method: {request.method}")
        logger.warning(f"Data: {request.data}")
        logger.warning(f"Animal ID: {kwargs.get('pk')}")
        instance = self.get_object()
        logger.warning(f"Current DB state: count={instance.count}, weight={instance.weight}, status={instance.status}")
        response = super().update(request, *args, **kwargs)
        logger.warning(f"Response status: {response.status_code}")
        if response.status_code >= 400:
            logger.warning(f"Response data: {response.data}")
        instance.refresh_from_db()
        logger.warning(f"After save DB state: count={instance.count}, weight={instance.weight}, status={instance.status}")
        return response

class WeightRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = WeightRecordSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
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
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        )
        animal_id = self.kwargs.get('animal_id') or self.request.query_params.get('animal') or self.request.query_params.get('animal_id')
        if animal_id:
            return MedicalRecord.objects.filter(animal_id=animal_id, animal__farm__in=user_farms)
        farm_id = self.request.query_params.get('farm')
        if farm_id:
            return MedicalRecord.objects.filter(animal__farm_id=farm_id, animal__farm__in=user_farms)
        return MedicalRecord.objects.filter(animal__farm__in=user_farms)

class FeedMixListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedMixSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        )
        farm_id = self.request.query_params.get('farm')
        if farm_id:
            return FeedMix.objects.filter(farm_id=farm_id, farm__in=user_farms)
        return FeedMix.objects.filter(farm__in=user_farms)

    def perform_create(self, serializer):
        farm_id = self.request.data.get('farm') or self.request.query_params.get('farm')
        farm = None
        if farm_id:
            try:
                farm = Farm.objects.get(pk=farm_id)
            except (Farm.DoesNotExist, ValueError):
                pass
        if not farm:
            farm = Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            ).first()
        serializer.save(farm=farm)

class FeedMixDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeedMixSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        )
        return FeedMix.objects.filter(farm__in=user_farms)

class RecurringFeedScheduleListCreateView(generics.ListCreateAPIView):
    serializer_class = RecurringFeedScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        )
        farm_id = self.request.query_params.get('farm')
        if farm_id:
            return RecurringFeedSchedule.objects.filter(farm_id=farm_id, farm__in=user_farms)
        return RecurringFeedSchedule.objects.filter(farm__in=user_farms)

    def perform_create(self, serializer):
        farm_id = self.request.data.get('farm') or self.request.query_params.get('farm')
        farm = None
        if farm_id:
            try:
                farm = Farm.objects.get(pk=farm_id)
            except (Farm.DoesNotExist, ValueError):
                pass
        if not farm:
            farm = Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            ).first()
        serializer.save(farm=farm)

class RecurringFeedScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecurringFeedScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        )
        return RecurringFeedSchedule.objects.filter(farm__in=user_farms)

class FeedRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedRecordSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        )
        animal_id = self.kwargs.get('animal_id') or self.request.query_params.get('animal') or self.request.query_params.get('animal_id')
        if animal_id:
            return FeedRecord.objects.filter(animal_id=animal_id, animal__farm__in=user_farms)
        farm_id = self.request.query_params.get('farm')
        if farm_id:
            return FeedRecord.objects.filter(animal__farm_id=farm_id, animal__farm__in=user_farms)
        return FeedRecord.objects.filter(animal__farm__in=user_farms)

    def perform_create(self, serializer):
        animal_id = self.kwargs.get('animal_id') or self.request.data.get('animal') or self.request.data.get('animal_id')
        animal = None
        if animal_id:
            try:
                animal = Animal.objects.get(pk=animal_id)
            except (Animal.DoesNotExist, ValueError):
                pass
        feed_record = serializer.save(animal=animal)

        # 1. Handle Recurring Feed Schedule Creation
        if feed_record.is_recurring and feed_record.end_date:
            farm = animal.farm if animal else Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            ).first()
            if farm:
                RecurringFeedSchedule.objects.create(
                    farm=farm,
                    animal=animal,
                    group_name=feed_record.group_name or '',
                    feed_type=feed_record.feed_type or '',
                    feed_mix=feed_record.feed_mix,
                    daily_amount=feed_record.amount,
                    unit=feed_record.unit,
                    start_date=feed_record.date,
                    end_date=feed_record.end_date,
                    deduct_from_inventory=feed_record.deduct_from_inventory,
                    last_run_date=feed_record.date,
                )

        # 2. Skip inventory deduction if toggle is OFF
        if not feed_record.deduct_from_inventory:
            return

        try:
            from inventory.models import InventoryItem, InventoryTransaction
            farm = animal.farm if animal else None
            if not farm:
                farm_id = self.request.data.get('farm') or self.request.query_params.get('farm')
                if farm_id:
                    farm = Farm.objects.filter(pk=farm_id).first()
                if not farm:
                    farm = Farm.objects.filter(
                        Q(owner=self.request.user) | Q(members__user=self.request.user)
                    ).first()

            if not farm:
                return

            animal_desc = animal.name if animal else (feed_record.group_name or 'Animals')

            # Option A: Custom Feed Mix Proportional Multi-Ingredient Deduction
            if feed_record.feed_mix and feed_record.feed_mix.ingredients.exists():
                feed_mix = feed_record.feed_mix
                for ingredient in feed_mix.ingredients.all():
                    ratio = float(ingredient.percentage) / 100.0
                    component_qty = float(feed_record.amount) * ratio
                    item = ingredient.inventory_item or InventoryItem.objects.filter(
                        farm=farm,
                        name__iexact=ingredient.ingredient_name
                    ).first()
                    if item and component_qty > 0:
                        item.quantity = max(0, float(item.quantity) - component_qty)
                        item.save()
                        InventoryTransaction.objects.create(
                            item=item,
                            transaction_type='out',
                            quantity=component_qty,
                            reason=f"Feed Mix Deduction: {feed_mix.name} ({ingredient.ingredient_name})",
                            notes=f"Auto-deducted {ingredient.percentage}% ratio ({component_qty:.2f} {feed_record.unit}) for {animal_desc}",
                            created_by=self.request.user.username or 'System'
                        )
            # Option B: Standard Single Feed Item Deduction
            elif feed_record.feed_type:
                feed_name = feed_record.feed_type
                item = InventoryItem.objects.filter(
                    farm=farm,
                    name__iexact=feed_name
                ).first() or InventoryItem.objects.filter(
                    farm=farm,
                    category='feed'
                ).first()
                if item and feed_record.amount > 0:
                    item.quantity = max(0, float(item.quantity) - float(feed_record.amount))
                    item.save()
                    InventoryTransaction.objects.create(
                        item=item,
                        transaction_type='out',
                        quantity=feed_record.amount,
                        reason=f"Animal Feed: {animal_desc}",
                        notes=f"Auto-deducted daily feed entry for {animal_desc}",
                        created_by=self.request.user.username or 'System'
                    )
                    # Auto-calculate cost on feed record if zero/null
                    if (not feed_record.cost or float(feed_record.cost) == 0) and item.cost_per_unit:
                        feed_record.cost = float(feed_record.amount) * float(item.cost_per_unit)
                        feed_record.save(update_fields=['cost'])
        except Exception as e:
            pass

class FeedRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeedRecordSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        )
        return FeedRecord.objects.filter(animal__farm__in=user_farms)

class VaccinationListCreateView(generics.ListCreateAPIView):
    serializer_class = VaccinationSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
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
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        return Vaccination.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class BreedingCalendarListCreateView(generics.ListCreateAPIView):
    serializer_class = BreedingCalendarSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
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
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    
    def get_queryset(self):
        return BreedingCalendar.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class HealthAlertListCreateView(generics.ListCreateAPIView):
    serializer_class = HealthAlertSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'health'
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
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
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
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'

    def get_queryset(self):
        return BreedingRecord.objects.filter(
            breeding__animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class ProductionRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductionRecordSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
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

    def perform_create(self, serializer):
        instance = serializer.save()
        add_to_inventory = self.request.data.get('add_to_inventory', True)
        
        if add_to_inventory and instance.animal:
            try:
                from inventory.models import InventoryItem, InventoryTransaction
                p_type = instance.production_type.capitalize()
                a_type = instance.animal.animal_type.capitalize() if instance.animal.animal_type else "Animal"
                item_name = f"{a_type} {p_type}" if p_type.lower() not in a_type.lower() else p_type
                
                inv_item = InventoryItem.objects.filter(
                    farm=instance.animal.farm,
                    name__iexact=item_name
                ).first()
                
                if inv_item:
                    inv_item.quantity += instance.quantity
                    if instance.market_price_per_unit:
                        inv_item.cost_per_unit = instance.market_price_per_unit
                    inv_item.save()
                else:
                    inv_item = InventoryItem.objects.create(
                        farm=instance.animal.farm,
                        name=item_name,
                        category='production',
                        quantity=instance.quantity,
                        unit=instance.unit or 'units',
                        min_quantity=0,
                        cost_per_unit=instance.market_price_per_unit or 0,
                        notes=f"Auto-created from Animal Production Record ({instance.animal.name})"
                    )
                
                InventoryTransaction.objects.create(
                    item=inv_item,
                    transaction_type='in',
                    quantity=instance.quantity,
                    cost_per_unit=instance.market_price_per_unit or 0,
                    total_cost=instance.total_market_value or 0,
                    status='completed',
                    reason=f"Animal Production Log - {instance.animal.name} ({p_type})",
                    created_by=self.request.user.get_full_name() or self.request.user.username
                )
            except Exception as e:
                print(f"Inventory production sync error: {e}")

class ProductionRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductionRecordSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'

    def get_queryset(self):
        return ProductionRecord.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class AnimalProductionMetricsListView(generics.ListAPIView):
    serializer_class = AnimalProductionMetricsSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['animal__name']
    ordering_fields = ['annual_revenue', 'annual_profit', 'production_efficiency']
    ordering = ['-annual_revenue']

    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        for f in user_farms:
            from farms.analytics_generator import ensure_analytics_data_for_farm
            ensure_analytics_data_for_farm(f)
        return AnimalProductionMetrics.objects.filter(animal__farm__in=user_farms)

class AnimalProductionMetricsDetailView(generics.RetrieveAPIView):
    serializer_class = AnimalProductionMetricsSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'animals'

    def get_queryset(self):
        return AnimalProductionMetrics.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class HealthAlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HealthAlertSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'health'
    
    def get_queryset(self):
        return HealthAlert.objects.filter(
            animal__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )