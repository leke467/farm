from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from farms.models import Farm, FarmMember

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'is_admin', 'created_at']
        read_only_fields = ['id', 'created_at']

class FarmRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False, default='owner')
    # Add farm fields
    farm_name = serializers.CharField(write_only=True, required=True)
    farm_location = serializers.CharField(write_only=False, required=False, allow_blank=True)
    farm_size = serializers.CharField(write_only=False, required=False, allow_blank=True)
    farm_type = serializers.CharField(write_only=False, required=False, allow_blank=True)
    farm_address = serializers.CharField(write_only=False, required=False, allow_blank=True)
    farm_total_area = serializers.CharField(write_only=False, required=False, allow_blank=True)
    farm_description = serializers.CharField(write_only=False, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password', 'confirm_password', 'role', 'phone',
            'farm_name', 'farm_location', 'farm_size', 'farm_type', 'farm_address', 'farm_total_area', 'farm_description'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        farm_fields = ['farm_name', 'farm_location', 'farm_size', 'farm_type', 'farm_address', 'farm_total_area', 'farm_description']
        farm_data = {k: validated_data.pop(k, None) for k in farm_fields}
        validated_data.pop('confirm_password')
        
        # Extract role for user (should be 'owner' from frontend)
        user_role = validated_data.pop('role', 'owner')

        validated_data['is_admin'] = True if user_role == 'admin' else False
        
        user = User.objects.create_user(**validated_data)
        # Create farm with provided details
        farm = Farm.objects.create(
            name=farm_data['farm_name'],
            owner=user,
            farm_type=farm_data.get('farm_type') or 'mixed',
            size=farm_data.get('farm_size') or 'medium',
            location=farm_data.get('farm_location') or '',
            address=farm_data.get('farm_address') or '',
            total_area=farm_data.get('farm_total_area') or 1.0,
            description=farm_data.get('farm_description') or ''
        )

        # Create FarmMember with 'owner' role (farm creator is always owner)
        FarmMember.objects.create(
            farm=farm,
            user=user,
            role=user_role
        )
        
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return attrs