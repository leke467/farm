from rest_framework import serializers
from .models import (Animal, WeightRecord, MedicalRecord, FeedRecord, SampleWeight, 
                     WaterQuality, Vaccination, BreedingCalendar, HealthAlert)
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
    class Meta:
        model = FeedRecord
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
        """Group count must be at least 2 for groups"""
        if value is not None and int(value) < 1:
            raise serializers.ValidationError("Count must be at least 1")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # If is_group, count must be >= 2
        if data.get('is_group') and data.get('count', 1) < 2:
            raise serializers.ValidationError({
                "count": "Group must have at least 2 animals"
            })
        
        return data