from rest_framework import serializers
from django.db.models import Q
from django.utils import timezone
from .models import (Animal, WeightRecord, MedicalRecord, FeedRecord, SampleWeight, 
                     WaterQuality, Vaccination, BreedingCalendar, HealthAlert,
                     BreedingRecord, ProductionRecord, AnimalProductionMetrics,
                     FeedMix, FeedMixItem, RecurringFeedSchedule)
from farms.models import Farm
from terra_track.validators import AnimalValidator, NumberValidator

class WeightRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightRecord
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def validate_weight(self, value):
        """Validate weight is positive"""
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError("Weight must be greater than 0")
        return value
    
    def validate_date(self, value):
        """Validate date is not in future"""
        from django.utils import timezone
        if value > timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the future")
        return value

class FeedMixItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedMixItem
        fields = '__all__'

class FeedMixSerializer(serializers.ModelSerializer):
    ingredients = FeedMixItemSerializer(many=True, required=False)

    class Meta:
        model = FeedMix
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients', [])
        feed_mix = FeedMix.objects.create(**validated_data)
        for item_data in ingredients_data:
            FeedMixItem.objects.create(feed_mix=feed_mix, **item_data)
        return feed_mix

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients', None)
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        if ingredients_data is not None:
            instance.ingredients.all().delete()
            for item_data in ingredients_data:
                FeedMixItem.objects.create(feed_mix=instance, **item_data)
        return instance

class RecurringFeedScheduleSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    feed_mix_name = serializers.CharField(source='feed_mix.name', read_only=True)

    class Meta:
        model = RecurringFeedSchedule
        fields = '__all__'
        read_only_fields = ['created_at', 'last_run_date']

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def validate_date(self, value):
        """Validate date is not in future"""
        from django.utils import timezone
        if value > timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the future")
        return value
    
    def validate_cost(self, value):
        """Validate cost is non-negative"""
        if value is not None and float(value) < 0:
            raise serializers.ValidationError("Cost cannot be negative")
        return value

class FeedRecordSerializer(serializers.ModelSerializer):
    animal = serializers.PrimaryKeyRelatedField(queryset=Animal.objects.all(), required=False, allow_null=True)
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FeedRecord
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_recorded_by_name(self, obj):
        user = getattr(obj, 'recorded_by', None) or getattr(obj, 'created_by', None) or getattr(obj, 'user', None)
        if user:
            full_name = f"{user.first_name} {user.last_name}".strip()
            return full_name if full_name else (user.username or user.email)
        farm = getattr(obj.animal, 'farm', None) if getattr(obj, 'animal', None) else None
        if farm and farm.owner:
            owner = farm.owner
            full_name = f"{owner.first_name} {owner.last_name}".strip()
            return full_name if full_name else (owner.username or owner.email)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            u = request.user
            full_name = f"{u.first_name} {u.last_name}".strip()
            return full_name if full_name else (u.username or u.email)
        return "Farm Manager"
    
    def validate_date(self, value):
        """Validate date is not in future"""
        from django.utils import timezone
        if value > timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the future")
        return value
    
    def validate_cost(self, value):
        """Validate cost is non-negative"""
        if value is not None and float(value) < 0:
            raise serializers.ValidationError("Cost cannot be negative")
        return value

class SampleWeightSerializer(serializers.ModelSerializer):
    class Meta:
        model = SampleWeight
        fields = '__all__'
        read_only_fields = ['created_at']

class WaterQualitySerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterQuality
        fields = '__all__'
        read_only_fields = ['created_at']

class VaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccination
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_scheduled_date(self, value):
        """Validate scheduled date"""
        from django.utils import timezone
        # Scheduled date can be in future
        return value
    
    def validate_completed_date(self, value):
        """Completed date cannot be in future"""
        if value:
            from django.utils import timezone
            if value > timezone.now().date():
                raise serializers.ValidationError("Completed date cannot be in the future")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # If completed, status must be 'completed'
        if data.get('completed_date') and data.get('status') != 'completed':
            raise serializers.ValidationError({
                "status": "Status must be 'completed' if completed_date is set"
            })
        
        # If status is completed, completed_date is required
        if data.get('status') == 'completed' and not data.get('completed_date'):
            raise serializers.ValidationError({
                "completed_date": "This field is required when status is 'completed'"
            })
        
        return data

class BreedingCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreedingCalendar
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Cross-field validation"""
        breeding_date = data.get('breeding_date')
        expected_delivery = data.get('expected_delivery_date')
        
        # Expected delivery should be after breeding date
        if breeding_date and expected_delivery and expected_delivery <= breeding_date:
            raise serializers.ValidationError({
                "expected_delivery_date": "Expected delivery must be after breeding date"
            })
        
        return data

class HealthAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthAlert
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_due_date(self, value):
        """Due date can be in future or past"""
        return value

class AnimalSerializer(serializers.ModelSerializer):
    farm = serializers.PrimaryKeyRelatedField(queryset=Farm.objects.all(), required=False, allow_null=True)
    weight_history = WeightRecordSerializer(many=True, read_only=True)
    medical_history = MedicalRecordSerializer(many=True, read_only=True)
    food_consumption = FeedRecordSerializer(many=True, read_only=True)
    sample_weights = SampleWeightSerializer(many=True, read_only=True)
    water_quality = WaterQualitySerializer(many=True, read_only=True)
    vaccinations = VaccinationSerializer(many=True, read_only=True)
    breeding_calendars = BreedingCalendarSerializer(many=True, read_only=True)
    health_alerts = HealthAlertSerializer(many=True, read_only=True)
    
    class Meta:
        model = Animal
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_birth_date(self, value):
        """Birth date cannot be in future"""
        AnimalValidator.validate_animal_birth_date(value)
        return value
    
    def validate_weight(self, value):
        """Weight must be positive and reasonable"""
        AnimalValidator.validate_animal_weight(value)
        return value
    
    def validate_count(self, value):
        """Group count cannot be negative"""
        if value is not None and int(value) < 0:
            raise serializers.ValidationError("Count cannot be negative")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Allow count = 0 if sold, otherwise count must be >= 1
        status = data.get('status', getattr(self.instance, 'status', 'healthy'))
        count = data.get('count', getattr(self.instance, 'count', 1))
        is_group = data.get('is_group', getattr(self.instance, 'is_group', False))

        if is_group and status != 'sold' and count < 1:
            raise serializers.ValidationError({
                "count": "Group count must be at least 1 unless marked as sold"
            })
        
        return data


from django.utils import timezone

class BreedingRecordSerializer(serializers.ModelSerializer):
    breeding = serializers.PrimaryKeyRelatedField(queryset=BreedingCalendar.objects.all(), required=False, allow_null=True)
    animal_name = serializers.SerializerMethodField()
    father_name_id = serializers.SerializerMethodField()
    breeding_date = serializers.SerializerMethodField()
    breeding_status = serializers.SerializerMethodField()
    recorded_by_name = serializers.SerializerMethodField()

    sire = serializers.CharField(write_only=True, required=False, allow_blank=True)
    dam = serializers.CharField(write_only=True, required=False, allow_blank=True)
    expected_delivery_date = serializers.DateField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = BreedingRecord
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_recorded_by_name(self, obj):
        user = getattr(obj, 'recorded_by', None) or getattr(obj, 'created_by', None) or getattr(obj, 'user', None)
        if user:
            full_name = f"{user.first_name} {user.last_name}".strip()
            return full_name if full_name else (user.username or user.email)
        farm = None
        if hasattr(obj, 'dam_animal') and obj.dam_animal:
            farm = getattr(obj.dam_animal, 'farm', None)
        elif hasattr(obj, 'sire_animal') and obj.sire_animal:
            farm = getattr(obj.sire_animal, 'farm', None)
        elif hasattr(obj, 'breeding') and obj.breeding and getattr(obj.breeding, 'animal', None):
            farm = getattr(obj.breeding.animal, 'farm', None)
        if farm and farm.owner:
            owner = farm.owner
            full_name = f"{owner.first_name} {owner.last_name}".strip()
            return full_name if full_name else (owner.username or owner.email)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            u = request.user
            full_name = f"{u.first_name} {u.last_name}".strip()
            return full_name if full_name else (u.username or u.email)
        return "Farm Manager"

    def get_animal_name(self, obj):
        if obj.dam_animal:
            return obj.dam_animal.name
        return obj.breeding.animal.name if obj.breeding and obj.breeding.animal else "Animal"

    def get_father_name_id(self, obj):
        if obj.sire_animal:
            return obj.sire_animal.name
        return obj.breeding.partner_animal_name if obj.breeding else "Sire"

    def get_breeding_date(self, obj):
        return obj.breeding.breeding_date if obj.breeding else (obj.created_at.date() if obj.created_at else None)

    def get_breeding_status(self, obj):
        if obj.status:
            return obj.status
        return "successful" if obj.breeding and obj.breeding.status in ['confirmed', 'completed', 'active'] else getattr(obj.breeding, 'status', 'successful')

    def validate(self, data):
        if data.get('healthy_offspring', 0) + data.get('stillborn', 0) > data.get('number_of_offspring', 0):
            raise serializers.ValidationError(
                "Healthy offspring plus stillborn cannot exceed total number of offspring"
            )
        if data.get('delivery_date') and data.get('breeding') and data.get('delivery_date') < data.get('breeding').breeding_date:
            raise serializers.ValidationError({
                'delivery_date': 'Delivery date cannot be before breeding date.'
            })
        return data

    def create(self, validated_data):
        raw_data = self.initial_data
        sire_id = validated_data.pop('sire', None) or raw_data.get('sire')
        dam_id = validated_data.pop('dam', None) or raw_data.get('dam')
        b_date = raw_data.get('breeding_date')
        exp_date = validated_data.pop('expected_delivery_date', None) or raw_data.get('expected_delivery_date')
        b_status = raw_data.get('breeding_status') or raw_data.get('status') or 'planned'
        notes = raw_data.get('notes') or raw_data.get('genetics_notes') or ''

        # Resolve sire and dam animal models
        sire_obj = None
        if sire_id:
            try:
                sire_obj = Animal.objects.filter(id=sire_id).first()
            except Exception:
                pass

        dam_obj = None
        if dam_id:
            try:
                dam_obj = Animal.objects.filter(id=dam_id).first()
            except Exception:
                pass

        if sire_obj and not validated_data.get('sire_animal'):
            validated_data['sire_animal'] = sire_obj
        if dam_obj and not validated_data.get('dam_animal'):
            validated_data['dam_animal'] = dam_obj

        # If breeding calendar object is not passed, create one automatically
        if not validated_data.get('breeding'):
            target_animal = dam_obj or sire_obj
            if not target_animal:
                request = self.context.get('request')
                if request and request.user:
                    target_animal = Animal.objects.filter(
                        Q(farm__owner=request.user) | Q(farm__members__user=request.user)
                    ).first()

            if target_animal:
                b_date_val = b_date if b_date else timezone.now().date()
                b_cal = BreedingCalendar.objects.create(
                    animal=target_animal,
                    partner_animal_name=sire_obj.name if sire_obj else "Sire",
                    breeding_date=b_date_val,
                    expected_delivery_date=exp_date if exp_date else None,
                    status=b_status if b_status in ['planning', 'in_progress', 'confirmed', 'completed', 'cancelled'] else 'planning',
                    notes=notes
                )
                validated_data['breeding'] = b_cal

        if not validated_data.get('status'):
            validated_data['status'] = b_status if b_status in ['planned', 'mated', 'pregnant', 'delivered', 'failed'] else 'planned'

        return super().create(validated_data)


class ProductionRecordSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    date = serializers.DateField(source='recorded_date', read_only=True)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductionRecord
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_recorded_by_name(self, obj):
        user = getattr(obj, 'recorded_by', None) or getattr(obj, 'created_by', None) or getattr(obj, 'user', None)
        if user:
            full_name = f"{user.first_name} {user.last_name}".strip()
            return full_name if full_name else (user.username or user.email)
        farm = getattr(obj.animal, 'farm', None) if getattr(obj, 'animal', None) else None
        if farm and farm.owner:
            owner = farm.owner
            full_name = f"{owner.first_name} {owner.last_name}".strip()
            return full_name if full_name else (owner.username or owner.email)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            u = request.user
            full_name = f"{u.first_name} {u.last_name}".strip()
            return full_name if full_name else (u.username or u.email)
        return "Farm Manager"

    def validate_quantity(self, value):
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError('Quantity must be greater than 0')
        return value

    def validate_market_price_per_unit(self, value):
        if value is not None and float(value) < 0:
            raise serializers.ValidationError('Market price must be non-negative')
        return value

    def validate(self, data):
        if data.get('market_price_per_unit') is not None and data.get('quantity') is not None:
            data['total_market_value'] = float(data.get('quantity')) * float(data.get('market_price_per_unit'))
        return data


class AnimalProductionMetricsSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    total_revenue = serializers.DecimalField(source='annual_revenue', max_digits=12, decimal_places=2, read_only=True)
    total_costs = serializers.DecimalField(source='annual_feed_cost', max_digits=12, decimal_places=2, read_only=True)
    efficiency_ratio = serializers.DecimalField(source='production_efficiency', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = AnimalProductionMetrics
        fields = '__all__'
        read_only_fields = ['last_updated']

    def validate_feed_conversion_ratio(self, value):
        if value is not None and float(value) < 0:
            raise serializers.ValidationError('Feed conversion ratio must be non-negative')
        return value

    def validate_production_efficiency(self, value):
        if value is not None and float(value) < 0:
            raise serializers.ValidationError('Production efficiency must be non-negative')
        return value
