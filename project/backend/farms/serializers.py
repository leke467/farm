from rest_framework import serializers
from .models import Farm, FarmMember
from accounts.serializers import UserSerializer

class FarmSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    
    class Meta:
        model = Farm
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

class FarmMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    farm = FarmSerializer(read_only=True)
    
    class Meta:
        model = FarmMember
        fields = '__all__'
        read_only_fields = ['joined_at']