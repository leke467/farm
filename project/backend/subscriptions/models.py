from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='NGN')
    billing_cycle = models.CharField(max_length=20, default='monthly')  # 'monthly', 'yearly'
    duration_days = models.IntegerField(default=30)
    discount_badge = models.CharField(max_length=100, blank=True, default='')
    features = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    trial_days = models.IntegerField(default=14)
    max_farms = models.IntegerField(default=999)
    max_animals = models.IntegerField(default=99999)
    max_crops = models.IntegerField(default=99999)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return self.name

class Subscription(models.Model):
    class Status(models.TextChoices):
        TRIAL = 'trial', 'Trial'
        ACTIVE = 'active', 'Active'
        PAST_DUE = 'past_due', 'Past Due'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TRIAL)
    start_date = models.DateField()
    end_date = models.DateField()
    is_auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def is_active_subscription(self):
        return self.status in (self.Status.TRIAL, self.Status.ACTIVE) and self.end_date >= timezone.now().date()

class SubscriptionPayment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        INITIATED = 'initiated', 'Initiated'
        PAID = 'paid', 'Paid'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='NGN')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_reference = models.CharField(max_length=100, unique=True)
    provider_reference = models.CharField(max_length=200, blank=True)
    provider = models.CharField(max_length=50, default='monnify')
    idempotency_key = models.CharField(max_length=100, unique=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    captured_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

class WebhookEvent(models.Model):
    class Status(models.TextChoices):
        RECEIVED = 'received', 'Received'
        PROCESSED = 'processed', 'Processed'
        FAILED = 'failed', 'Failed'

    provider = models.CharField(max_length=50)
    event_type = models.CharField(max_length=100)
    event_id = models.CharField(max_length=200, unique=True)
    payload = models.JSONField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEIVED)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'percentage', 'Percentage Discount (%)'
        FLAT = 'flat', 'Flat Amount Discount (₦)'
        TRIAL_EXTENSION = 'trial_extension', 'Trial Extension (Days)'

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # e.g. 20 for 20% or 5000 for ₦5,000
    duration_days_extension = models.IntegerField(default=0)  # e.g. 30 extra free days
    max_uses = models.IntegerField(default=999999)
    times_used = models.IntegerField(default=0)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    description = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} ({self.discount_type})"

    def is_valid_coupon(self):
        if not self.is_active:
            return False, "Coupon code is inactive or disabled."
        if self.times_used >= self.max_uses:
            return False, "Coupon usage limit has been reached."
        if self.valid_until and self.valid_until < timezone.now():
            return False, "Coupon code has expired."
        return True, "Valid coupon."

