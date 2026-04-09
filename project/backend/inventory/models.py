from django.db import models
from django.utils import timezone
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
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    date = models.DateTimeField(auto_now_add=True)
    transaction_date = models.DateField(default=timezone.now)
    reason = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    reference = models.CharField(max_length=100, blank=True, help_text="Invoice/Receipt number")
    created_by = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"{self.item.name} - {self.transaction_type} ({self.quantity})"
    
    class Meta:
        ordering = ['-transaction_date']

class StockMovement(models.Model):
    """Detailed batch tracking for inventory"""
    MOVEMENT_TYPE_CHOICES = [
        ('receipt', 'Receipt'),
        ('issue', 'Issue'),
        ('transfer', 'Transfer'),
        ('return', 'Return'),
        ('adjustment', 'Adjustment'),
    ]
    
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='movements')
    transaction = models.ForeignKey(InventoryTransaction, on_delete=models.SET_NULL, null=True, blank=True)
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    batch_number = models.CharField(max_length=100, blank=True)
    source_location = models.CharField(max_length=200, blank=True)
    destination_location = models.CharField(max_length=200, blank=True)
    movement_date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.item.name} - {self.movement_type} ({self.quantity} to {self.destination_location})"
    
    class Meta:
        ordering = ['-movement_date']

class InventoryAudit(models.Model):
    """Inventory reconciliation and audits"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='inventory_audits')
    audit_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    created_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Inventory Audit - {self.farm.name} ({self.audit_date})"
    
    class Meta:
        ordering = ['-audit_date']

class AuditLineItem(models.Model):
    """Individual items in an inventory audit"""
    audit = models.ForeignKey(InventoryAudit, on_delete=models.CASCADE, related_name='line_items')
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    expected_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    counted_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    variance = models.DecimalField(max_digits=10, decimal_places=2)  # counted - expected
    notes = models.TextField(blank=True)
    
    @property
    def variance_percentage(self):
        if self.expected_quantity == 0:
            return 0
        return (self.variance / self.expected_quantity) * 100
    
    def __str__(self):
        return f"{self.item.name} - {self.counted_quantity} counted (expected {self.expected_quantity})"
    
    class Meta:
        ordering = ['item__name']

class InventoryCostTracking(models.Model):
    """FIFO/LIFO cost method tracking"""
    COST_METHOD_CHOICES = [
        ('fifo', 'FIFO - First In First Out'),
        ('lifo', 'LIFO - Last In First Out'),
        ('weighted_avg', 'Weighted Average'),
    ]
    
    item = models.OneToOneField(InventoryItem, on_delete=models.CASCADE, related_name='cost_tracking')
    cost_method = models.CharField(max_length=20, choices=COST_METHOD_CHOICES, default='fifo')
    total_units_purchased = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_units_issued = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_purchase_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    weighted_avg_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.item.name} - {self.cost_method}"
    
    class Meta:
        verbose_name_plural = "Inventory Cost Tracking"

class DemandForecast(models.Model):
    """AI-powered demand forecasting based on historical usage"""
    TREND_CHOICES = [
        ('stable', 'Stable'),
        ('increasing', 'Increasing'),
        ('decreasing', 'Decreasing'),
        ('seasonal', 'Seasonal'),
    ]
    
    item = models.OneToOneField(InventoryItem, on_delete=models.CASCADE, related_name='demand_forecast')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='demand_forecasts')
    
    # Historical metrics
    avg_monthly_usage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_monthly_usage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_monthly_usage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    usage_trend = models.CharField(max_length=20, choices=TREND_CHOICES, default='stable')
    seasonality_factor = models.DecimalField(max_digits=5, decimal_places=2, default=1.0, help_text="Seasonality multiplier")
    
    # Forecasts
    forecasted_monthly_demand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    optimal_reorder_point = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    optimal_order_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    safety_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Performance
    forecast_accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Accuracy percentage")
    last_updated = models.DateTimeField(auto_now=True)
    data_points = models.IntegerField(default=0, help_text="Number of historical data points used")
    
    def __str__(self):
        return f"Forecast for {self.item.name}"
    
    class Meta:
        verbose_name_plural = "Demand Forecasts"

class SupplierPerformance(models.Model):
    """Track supplier metrics for better purchasing decisions"""
    RELIABILITY_CHOICES = [
        ('excellent', 'Excellent (95%+)'),
        ('good', 'Good (85-95%)'),
        ('fair', 'Fair (70-85%)'),
        ('poor', 'Poor (<70%)'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='supplier_performance')
    supplier_name = models.CharField(max_length=200)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='supplier_metrics')
    
    # Price tracking
    avg_unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lowest_unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    highest_unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_purchase_date = models.DateField(null=True, blank=True)
    
    # Reliability
    on_time_delivery_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage")
    quality_rating = models.DecimalField(max_digits=3, decimal_places=1, default=5.0, help_text="1-10 scale")
    reliability_grade = models.CharField(max_length=20, choices=RELIABILITY_CHOICES, default='good')
    total_orders = models.IntegerField(default=0)
    
    # Contact
    contact_person = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.supplier_name} ({self.item.name})"
    
    class Meta:
        verbose_name_plural = "Supplier Performance"
        unique_together = ('farm', 'supplier_name', 'item')