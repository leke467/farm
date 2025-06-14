from rest_framework import serializers
from .models import Animal, WeightRecord, MedicalRecord, FeedRecord, SampleWeight, WaterQuality

class WeightRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightRecord
        fields = '__all__'
        read_only_fields = ['created_at']

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['created_at']

class FeedRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedRecord
        fields = '__all__'
        read_only_fields = ['created_at']

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

class AnimalSerializer(serializers.ModelSerializer):
    weight_history = WeightRecordSerializer(many=True, read_only=True)
    medical_history = MedicalRecordSerializer(many=True, read_only=True)
    food_consumption = FeedRecordSerializer(many=True, read_only=True)
    sample_weights = SampleWeightSerializer(many=True, read_only=True)
    water_quality = WaterQualitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Animal
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']