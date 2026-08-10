from django.contrib import admin
from .models import SubscriptionPlan, Subscription, SubscriptionPayment, WebhookEvent

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration_days', 'is_active']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'end_date', 'is_auto_renew']
    list_filter = ['status', 'is_auto_renew']

@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_reference', 'user', 'amount', 'status', 'created_at']
    list_filter = ['status']

@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ['event_id', 'event_type', 'status', 'created_at']
    list_filter = ['status', 'event_type']
