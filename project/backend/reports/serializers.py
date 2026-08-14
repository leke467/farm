from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ['generated_at']


from .models import ContactMessage, Dispute
from django.contrib.auth import get_user_model
from farms.models import Farm

User = get_user_model()

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DisputeSerializer(serializers.ModelSerializer):
    reporter_name = serializers.SerializerMethodField()
    reporter_email = serializers.CharField(source='reporter.email', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)

    class Meta:
        model = Dispute
        fields = '__all__'
        read_only_fields = ['id', 'ticket_number', 'reporter', 'created_at', 'updated_at']

    def get_reporter_name(self, obj):
        if obj.reporter:
            full_name = f"{obj.reporter.first_name} {obj.reporter.last_name}".strip()
            return full_name if full_name else (obj.reporter.username or obj.reporter.email)
        return "Unknown User"


class SuperadminUserSerializer(serializers.ModelSerializer):
    farms_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'is_active', 'is_staff', 'is_superuser', 'is_admin',
            'date_joined', 'last_login', 'farms_count'
        ]

    def get_farms_count(self, obj):
        return Farm.objects.filter(owner=obj).count()


class SuperadminFarmSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    animals_count = serializers.SerializerMethodField()
    crops_count = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = '__all__'

    def get_owner_name(self, obj):
        if obj.owner:
            full_name = f"{obj.owner.first_name} {obj.owner.last_name}".strip()
            return full_name if full_name else (obj.owner.username or obj.owner.email)
        return "N/A"

    def get_animals_count(self, obj):
        return getattr(obj, 'animals', None).count() if hasattr(obj, 'animals') else 0

    def get_crops_count(self, obj):
        return getattr(obj, 'crops', None).count() if hasattr(obj, 'crops') else 0


from subscriptions.models import Subscription, SubscriptionPlan, SubscriptionPayment

class SuperadminSubscriptionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_price = serializers.CharField(source='plan.price', read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = '__all__'

    def get_user_name(self, obj):
        if obj.user:
            full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return full_name if full_name else (obj.user.username or obj.user.email)
        return "N/A"

    def get_days_remaining(self, obj):
        if not obj or not obj.end_date:
            return 0
        from django.utils import timezone
        today = timezone.now().date()
        delta = (obj.end_date - today).days
        return max(0, delta)


class SuperadminPaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = SubscriptionPayment
        fields = '__all__'

    def get_user_name(self, obj):
        if obj.user:
            full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return full_name if full_name else (obj.user.username or obj.user.email)
        return "N/A"