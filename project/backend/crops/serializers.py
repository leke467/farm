from rest_framework import serializers
from django.utils import timezone
from .models import Crop, GrowthStage, CropActivity, Harvest
from terra_track.validators import CropValidator, NumberValidator

class GrowthStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthStage
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def validate_date(self, value):
        """Date cannot be in future"""
        if value > timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the future")
        return value

class CropActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CropActivity
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def validate_date(self, value):
        """Date cannot be in future"""
        if value > timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the future")
        return value
    
    def validate_cost(self, value):
        """Cost must be non-negative"""
        if value is not None and float(value) < 0:
            raise serializers.ValidationError("Cost cannot be negative")
        return value

class HarvestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Harvest
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def validate_harvest_date(self, value):
        """Harvest date cannot be in future"""
        if value > timezone.now().date():
            raise serializers.ValidationError("Harvest date cannot be in the future")
        return value
    
    def validate_quantity(self, value):
        """Quantity must be positive"""
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value
    
    def validate_cost(self, value):
        """Cost must be non-negative"""
        if value is not None and float(value) < 0:
            raise serializers.ValidationError("Cost cannot be negative")
        return value

class CropSerializer(serializers.ModelSerializer):
    growth_stages = GrowthStageSerializer(many=True, read_only=True)
    activities = CropActivitySerializer(many=True, read_only=True)
    harvests = HarvestSerializer(many=True, read_only=True)
    
    class Meta:
        model = Crop
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_area(self, value):
        """Area must be positive"""
        CropValidator.validate_crop_area(value)
        return value
    
    def validate(self, data):
        """Cross-field validation for dates"""
        planted_date = data.get('planted_date')
        expected_harvest_date = data.get('expected_harvest_date')
        actual_harvest_date = data.get('actual_harvest_date')
        
        if planted_date and expected_harvest_date:
            CropValidator.validate_crop_dates(
                planted_date,
                expected_harvest_date,
                actual_harvest_date
            )
        
        return data