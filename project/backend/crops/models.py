from django.db import models
from farms.models import Farm

class Crop(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('growing', 'Growing'),
        ('harvesting', 'Harvesting'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    STAGE_CHOICES = [
        ('planning', 'Planning'),
        ('planting', 'Planting'),
        ('emergence', 'Emergence'),
        ('vegetative', 'Vegetative'),
        ('flowering', 'Flowering'),
        ('fruiting', 'Fruiting'),
        ('maturation', 'Maturation'),
        ('harvest', 'Harvest'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='crops')
    name = models.CharField(max_length=100)
    field = models.CharField(max_length=100)
    area = models.DecimalField(max_digits=10, decimal_places=2, help_text="Area in acres")
    planted_date = models.DateField()
    expected_harvest_date = models.DateField()
    actual_harvest_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='planning')
    variety = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.field}"

class GrowthStage(models.Model):
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='growth_stages')
    stage = models.CharField(max_length=20, choices=Crop.STAGE_CHOICES)
    date = models.DateField()
    completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['date']
        unique_together = ['crop', 'stage']

class CropActivity(models.Model):
    ACTIVITY_TYPE_CHOICES = [
        ('planting', 'Planting'),
        ('watering', 'Watering'),
        ('fertilizing', 'Fertilizing'),
        ('pesticide', 'Pesticide Application'),
        ('weeding', 'Weeding'),
        ('pruning', 'Pruning'),
        ('harvesting', 'Harvesting'),
        ('other', 'Other'),
    ]
    
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES)
    date = models.DateField()
    description = models.TextField()
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']

class Harvest(models.Model):
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='harvests')
    date = models.DateField()
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default='lbs')
    quality_grade = models.CharField(max_length=10, blank=True, choices=[('A', 'Grade A'), ('B', 'Grade B'), ('C', 'Grade C')])
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.crop.name} Harvest - {self.quantity} {self.unit}"

class CropYieldAnalysis(models.Model):
    """Track and analyze crop yield patterns"""
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='yield_analysis')
    
    # Historical yield data
    previous_yield = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expected_yield = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actual_yield = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    yield_unit = models.CharField(max_length=50, default='lbs/acre')
    
    # Factors affecting yield
    water_provided = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Inches or mm")
    fertilizer_applied = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="lbs or kg")
    disease_severity = models.IntegerField(default=0, help_text="0-100 scale")
    pest_damage = models.IntegerField(default=0, help_text="0-100 scale")
    
    # Performance metrics
    yield_per_dollar_invested = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    roi_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    yield_efficiency = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage of expected")
    
    # Recommendations
    optimization_recommendations = models.TextField(blank=True, help_text="AI generated recommendations")
    
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Yield Analysis - {self.crop.name}"
    
    class Meta:
        verbose_name_plural = "Crop Yield Analysis"

class FertilizerRecommendation(models.Model):
    """AI-powered fertilizer recommendations based on crop type and soil"""
    RECOMMENDATION_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('applied', 'Applied'),
        ('rejected', 'Rejected'),
    ]
    
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='fertilizer_recommendations')
    
    # Recommendation details
    recommended_type = models.CharField(max_length=100, help_text="e.g., NPK 10-10-10")
    recommended_quantity = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=50, default='lbs')
    application_timing = models.CharField(max_length=200, help_text="When to apply")
    expected_yield_increase = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage")
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=RECOMMENDATION_STATUS, default='pending')
    applied_date = models.DateField(null=True, blank=True)
    actual_quantity_applied = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Cost and ROI
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expected_additional_revenue = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Fertilizer Recommendation - {self.crop.name}"
    
    class Meta:
        verbose_name_plural = "Fertilizer Recommendations"
        ordering = ['-created_at']

class WeatherImpactRecord(models.Model):
    """Track weather impacts on crops"""
    IMPACT_TYPE = [
        ('drought', 'Drought'),
        ('flood', 'Flood'),
        ('frost', 'Frost'),
        ('excessive_heat', 'Excessive Heat'),
        ('wind_damage', 'Wind Damage'),
        ('hail', 'Hail'),
        ('pest_outbreak', 'Pest Outbreak'),
        ('disease', 'Disease'),
        ('other', 'Other'),
    ]
    
    SEVERITY_LEVEL = [
        ('minor', 'Minor (1-10% loss)'),
        ('moderate', 'Moderate (10-25% loss)'),
        ('severe', 'Severe (25-50% loss)'),
        ('critical', 'Critical (50%+ loss)'),
    ]
    
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='weather_impacts')
    
    impact_date = models.DateField()
    impact_type = models.CharField(max_length=30, choices=IMPACT_TYPE)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVEL)
    estimated_yield_loss = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage")
    estimated_financial_loss = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Recovery
    recovery_actions = models.TextField(blank=True)
    recovery_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expected_recovery_yield = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage of original")
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.impact_type} - {self.crop.name} ({self.impact_date})"
    
    class Meta:
        ordering = ['-created_at']