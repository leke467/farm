"""
Serializers for AI Agent API responses
"""
from rest_framework import serializers


class RecommendationSerializer(serializers.Serializer):
    """Serialize individual recommendations"""
    priority = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    action = serializers.CharField()
    savings = serializers.CharField(required=False, allow_blank=True)
    impact = serializers.CharField(required=False, allow_blank=True)


class AlertSerializer(serializers.Serializer):
    """Serialize alerts"""
    type = serializers.CharField()
    emoji = serializers.CharField()
    message = serializers.CharField()


class MetricsSerializer(serializers.Serializer):
    """Serialize metrics data"""
    total_expenses = serializers.FloatField()
    total_revenue = serializers.FloatField()
    profit = serializers.FloatField()
    profit_margin_percent = serializers.FloatField()
    high_cost_categories = serializers.ListField()
    total_animals = serializers.IntegerField()
    high_performers = serializers.ListField(required=False)
    low_performers = serializers.ListField(required=False)
    crop_analysis = serializers.ListField(required=False)


class ForecastSerializer(serializers.Serializer):
    """Serialize forecast data"""
    revenue = serializers.FloatField()
    expenses = serializers.FloatField()
    profit = serializers.FloatField()


class ForecastPeriodSerializer(serializers.Serializer):
    """Serialize all forecast periods"""
    next_month = ForecastSerializer()
    next_quarter = ForecastSerializer()
    next_year = ForecastSerializer()


class AIInsightsSerializer(serializers.Serializer):
    """Main AI Insights response serializer"""
    recommendations = RecommendationSerializer(many=True)
    alerts = AlertSerializer(many=True)
    metrics = MetricsSerializer()
    forecast = ForecastPeriodSerializer()
