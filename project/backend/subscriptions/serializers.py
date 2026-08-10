from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, SubscriptionPayment

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.BooleanField(source='is_active_subscription', read_only=True)
    
    class Meta:
        model = Subscription
        fields = '__all__'

class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = '__all__'
