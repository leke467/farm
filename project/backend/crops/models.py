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
    quality_grade = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']