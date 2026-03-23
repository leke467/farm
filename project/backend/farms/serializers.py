from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Farm, FarmMember, RoleMenuPermission, UserMenuPermission, MENU_CHOICES
from accounts.serializers import UserSerializer

User = get_user_model()

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


class FarmMemberCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=FarmMember.ROLE_CHOICES, default='worker')
    password = serializers.CharField(write_only=True, min_length=8)
    is_admin = serializers.BooleanField(required=False, default=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists')
        return value

    def create(self, validated_data):
        farm = self.context['farm']
        role = validated_data.pop('role', 'worker')
        raw_password = validated_data.pop('password')
        is_admin = validated_data.pop('is_admin', False)

        user = User.objects.create_user(
            password=raw_password,
            is_admin=is_admin,
            **validated_data,
        )
        user.must_change_password = True
        user.save(update_fields=['must_change_password'])

        return FarmMember.objects.create(
            farm=farm,
            user=user,
            role=role,
        )


class RoleMenuPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleMenuPermission
        fields = ['menu_key', 'can_view', 'can_create', 'can_edit', 'can_delete']


class UserMenuPermissionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserMenuPermission
        fields = ['id', 'user', 'menu_key', 'can_view', 'can_create', 'can_edit', 'can_delete', 'updated_at']


class MenuPermissionItemSerializer(serializers.Serializer):
    menu_key = serializers.ChoiceField(choices=[key for key, _ in MENU_CHOICES])
    can_view = serializers.BooleanField(required=False, allow_null=True)
    can_create = serializers.BooleanField(required=False, allow_null=True)
    can_edit = serializers.BooleanField(required=False, allow_null=True)
    can_delete = serializers.BooleanField(required=False, allow_null=True)


class RolePermissionBulkUpdateSerializer(serializers.Serializer):
    permissions = MenuPermissionItemSerializer(many=True)


class UserPermissionBulkUpdateSerializer(serializers.Serializer):
    permissions = MenuPermissionItemSerializer(many=True)