from django.db import models
from farms.models import Farm

class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('feed', 'Feed'),
        ('fertilizer', 'Fertilizer'),
        ('medical', 'Medical'),
        ('infrastructure', 'Infrastructure'),
        ('fuel', 'Fuel'),
        ('tools', 'Tools'),
        ('seeds', 'Seeds'),
        ('other', 'Other'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='inventory')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    min_quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Minimum stock level")
    location = models.CharField(max_length=200, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    supplier = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.min_quantity
    
    @property
    def total_value(self):
        if self.cost_per_unit:
            return self.quantity * self.cost_per_unit
        return 0

class InventoryTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
    ]
    
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    reference = models.CharField(max_length=100, blank=True, help_text="Invoice/Receipt number")
    
    def __str__(self):
        return f"{self.item.name} - {self.transaction_type} ({self.quantity})"
    
    class Meta:
        ordering = ['-date']