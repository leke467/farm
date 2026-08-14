from django.db import models
from farms.models import Farm

class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('financial', 'Financial Report'),
        ('production', 'Production Report'),
        ('inventory', 'Inventory Report'),
        ('animal_health', 'Animal Health Report'),
        ('crop_yield', 'Crop Yield Report'),
        ('custom', 'Custom Report'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='reports')
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    description = models.TextField(blank=True)
    parameters = models.JSONField(default=dict)  # Store report parameters
    generated_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='reports/', blank=True)
    
    def __str__(self):
        return f"{self.name} - {self.farm.name}"
    
    class Meta:
        ordering = ['-generated_at']


from django.conf import settings

class ContactMessage(models.Model):
    """Store contact form submissions from site visitors"""
    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('archived', 'Archived'),
    ]

    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unread')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Contact Message from {self.name} - {self.subject} ({self.status})"

    class Meta:
        ordering = ['-created_at']


class Dispute(models.Model):
    """Track and settle platform disputes and support tickets"""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_review', 'In Review'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    CATEGORY_CHOICES = [
        ('billing', 'Billing & Subscription'),
        ('access', 'Account & Access'),
        ('data_mismatch', 'Data Discrepancy'),
        ('member_conflict', 'Farm Member Conflict'),
        ('other', 'Other Issue'),
    ]

    ticket_number = models.CharField(max_length=50, unique=True)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reported_disputes')
    farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, blank=True, related_name='disputes')
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=15, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_disputes')
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dispute #{self.ticket_number} - {self.subject} ({self.status})"

    class Meta:
        ordering = ['-created_at']