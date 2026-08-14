from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, SubscriptionPayment

from django.utils import timezone

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.BooleanField(source='is_active_subscription', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = '__all__'

    def get_days_remaining(self, obj):
        if not obj or not obj.end_date:
            return 0
        today = timezone.now().date()
        delta = (obj.end_date - today).days
        return max(0, delta)

class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = '__all__'
