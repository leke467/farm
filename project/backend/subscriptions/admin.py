from django.contrib import admin
from .models import SubscriptionPlan, Subscription, SubscriptionPayment, WebhookEvent

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration_days', 'is_active']
    prepopulated_fields = {'slug': ('name',)}

import datetime
from django.utils import timezone

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'end_date', 'is_auto_renew']
    list_filter = ['status', 'is_auto_renew']

    def save_model(self, request, obj, form, change):
        today = timezone.now().date()
        # If admin manually marks status as Active/Trial but end_date is in the past, automatically set end_date into the future
        if obj.status in (Subscription.Status.ACTIVE, Subscription.Status.TRIAL) and obj.end_date <= today:
            duration = obj.plan.duration_days if obj.plan else 30
            obj.end_date = today + datetime.timedelta(days=duration)
        super().save_model(request, obj, form, change)

@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_reference', 'user', 'amount', 'status', 'created_at']
    list_filter = ['status']

@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ['event_id', 'event_type', 'status', 'created_at']
    list_filter = ['status', 'event_type']
