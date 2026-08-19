from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User
from farms.models import Farm, FarmMember
from terra_track.validators import StringValidator

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
            'is_admin',
            'is_staff',
            'is_superuser',
            'is_active',
            'must_change_password',
            'created_at',
        ]
        read_only_fields = ['id', 'is_admin', 'must_change_password', 'created_at']

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
    
    def validate_username(self, value):
        """Username must not be empty and not already exist"""
        if not value or not value.strip():
            raise serializers.ValidationError("Username cannot be empty")
        if User.objects.filter(username__iexact=value.strip()).exists():
            raise serializers.ValidationError("Username already exists")
        return value.strip()
    
    def validate_email(self, value):
        """Email must be unique"""
        if value and User.objects.filter(email__iexact=value.strip()).exists():
            raise serializers.ValidationError("Email already exists")
        return value.strip()
    
    def validate_password(self, value):
        """Password must be at least 6 characters"""
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters")
        return value
    
    def validate_farm_name(self, value):
        """Farm name cannot be empty"""
        StringValidator.validate_not_empty(value)
        return value
    
    def validate_farm_type(self, value):
        """Farm type must be valid"""
        from farms.models import Farm
        valid_types = [t[0] for t in Farm.FARM_TYPE_CHOICES]
        if value and value not in valid_types:
            raise serializers.ValidationError(f"Farm type must be one of: {', '.join(valid_types)}")
        return value
    
    def validate_farm_size(self, value):
        """Farm size must be valid"""
        valid_sizes = ['small', 'medium', 'large']
        if value and value not in valid_sizes:
            raise serializers.ValidationError(f"Farm size must be one of: {', '.join(valid_sizes)}")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        
        if not attrs.get('first_name') or not attrs.get('first_name').strip():
            raise serializers.ValidationError({"first_name": "First name is required"})
        
        if not attrs.get('last_name') or not attrs.get('last_name').strip():
            raise serializers.ValidationError({"last_name": "Last name is required"})
        
        return attrs


    def create(self, validated_data):
        farm_fields = ['farm_name', 'farm_location', 'farm_size', 'farm_type', 'farm_address', 'farm_total_area', 'farm_description']
        farm_data = {k: validated_data.pop(k, None) for k in farm_fields}
        validated_data.pop('confirm_password')
        
        # Registration always creates an owner
        validated_data.pop('role', None)
        validated_data['is_admin'] = True
        
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
            role='owner'
        )
        
        # Seed default categories for the new farm
        from farms.management.commands.seed_default_categories import seed_farm_categories
        seed_farm_categories(farm)

        # Dispatch Brevo welcome email to new farm owner
        try:
            from terra_track.email_service import send_welcome_email
            send_welcome_email(user, farm.name)
        except Exception:
            pass

        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        identifier = (attrs.get('username') or attrs.get('email') or '').strip()
        password = attrs.get('password')
        
        if not identifier:
            raise serializers.ValidationError({"non_field_errors": "Must include username or email"})
        if not password:
            raise serializers.ValidationError({"non_field_errors": "Must include password"})
        
        user = authenticate(username=identifier, password=password)
        
        if not user:
            # Fallback 1: Lookup by email (case-insensitive)
            user_obj = User.objects.filter(email__iexact=identifier).first()
            if not user_obj:
                # Fallback 2: Lookup by username (case-insensitive)
                user_obj = User.objects.filter(username__iexact=identifier).first()
            
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)
                if not user and user_obj.check_password(password):
                    user = user_obj

        if not user:
            raise serializers.ValidationError({"non_field_errors": "Invalid username/email or password"})
        if not user.is_active:
            raise serializers.ValidationError({"non_field_errors": "User account is disabled"})
        
        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate_new_password(self, value):
        """New password must be strong"""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters")
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be only numbers")
        if value.isalpha():
            raise serializers.ValidationError("Password must contain both letters and numbers")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()
        db_user = UserModel.objects.filter(pk=user.pk).first() or user

        current_password = attrs.get('current_password')

        if db_user.must_change_password:
            if current_password and not db_user.check_password(current_password):
                raise serializers.ValidationError({'current_password': 'Current password is incorrect'})
        else:
            if not current_password:
                raise serializers.ValidationError({'current_password': 'Current password is required'})
            if not db_user.check_password(current_password):
                raise serializers.ValidationError({'current_password': 'Current password is incorrect'})

        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "Passwords don't match"})

        validate_password(attrs['new_password'], db_user)
        return attrs