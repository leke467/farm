from rest_framework import serializers
from .models import Crop, GrowthStage, CropActivity, Harvest

class GrowthStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthStage
        fields = '__all__'
        read_only_fields = ['created_at']

class CropActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CropActivity
        fields = '__all__'
        read_only_fields = ['created_at']

class HarvestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Harvest
        fields = '__all__'
        read_only_fields = ['created_at']

class CropSerializer(serializers.ModelSerializer):
    growth_stages = GrowthStageSerializer(many=True, read_only=True)
    activities = CropActivitySerializer(many=True, read_only=True)
    harvests = HarvestSerializer(many=True, read_only=True)
    
    class Meta:
        model = Crop
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']