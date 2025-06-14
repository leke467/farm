from django.db import models
from farms.models import Farm

class Animal(models.Model):
    ANIMAL_TYPE_CHOICES = [
        ('cow', 'Cow'),
        ('goat', 'Goat'),
        ('sheep', 'Sheep'),
        ('pig', 'Pig'),
        ('chicken', 'Chicken'),
        ('duck', 'Duck'),
        ('turkey', 'Turkey'),
        ('fish', 'Fish'),
        ('horse', 'Horse'),
        ('other', 'Other'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('mixed', 'Mixed'),
    ]
    
    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('sick', 'Sick'),
        ('injured', 'Injured'),
        ('pregnant', 'Pregnant'),
        ('nursing', 'Nursing'),
        ('quarantined', 'Quarantined'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='animals')
    name = models.CharField(max_length=100)
    animal_type = models.CharField(max_length=20, choices=ANIMAL_TYPE_CHOICES)
    breed = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='female')
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='healthy')
    notes = models.TextField(blank=True)
    
    # Group tracking fields
    is_group = models.BooleanField(default=False)
    count = models.PositiveIntegerField(default=1)
    avg_weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    established_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.is_group:
            return f"{self.name} ({self.count} {self.animal_type}s)"
        return f"{self.name} ({self.animal_type})"

class WeightRecord(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='weight_history')
    weight = models.DecimalField(max_digits=8, decimal_places=2)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']

class MedicalRecord(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='medical_history')
    treatment = models.CharField(max_length=200)
    date = models.DateField()
    notes = models.TextField(blank=True)
    veterinarian = models.CharField(max_length=100, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']

class FeedRecord(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='food_consumption')
    date = models.DateField()
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    feed_type = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']

class SampleWeight(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='sample_weights')
    date = models.DateField()
    samples = models.JSONField(default=list)  # List of weight samples
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']

class WaterQuality(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='water_quality')
    date = models.DateField()
    ph = models.DecimalField(max_digits=4, decimal_places=2)
    temperature = models.DecimalField(max_digits=5, decimal_places=2)
    oxygen = models.DecimalField(max_digits=5, decimal_places=2)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']