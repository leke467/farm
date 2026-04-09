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

class Vaccination(models.Model):
    VACCINE_TYPE_CHOICES = [
        ('rabies', 'Rabies'),
        ('fmd', 'Foot and Mouth Disease'),
        ('brucellosis', 'Brucellosis'),
        ('tuberculosis', 'Tuberculosis'),
        ('lumpy_skin', 'Lumpy Skin Disease'),
        ('anthrax', 'Anthrax'),
        ('rotavirus', 'Rotavirus'),
        ('clostridium', 'Clostridium'),
        ('newcastle', 'Newcastle Disease'),
        ('coccidiosis', 'Coccidiosis'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='vaccinations')
    vaccine_type = models.CharField(max_length=50, choices=VACCINE_TYPE_CHOICES)
    scheduled_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    veterinarian = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['scheduled_date']
    
    def __str__(self):
        return f"{self.animal.name} - {self.vaccine_type} ({self.status})"

class BreedingCalendar(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('in_progress', 'In Progress'),
        ('confirmed', 'Confirmed Pregnant'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='breeding_calendars')
    partner_animal_name = models.CharField(max_length=100, blank=True)
    breeding_date = models.DateField()
    expected_delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['breeding_date']
    
    def __str__(self):
        return f"{self.animal.name} - Breeding {self.breeding_date}"

class HealthAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('vaccination_due', 'Vaccination Due'),
        ('medical_followup', 'Medical Follow-up'),
        ('breeding_due', 'Breeding Due'),
        ('weight_concern', 'Weight Concern'),
        ('feed_low', 'Feed Low'),
        ('health_status', 'Health Status Change'),
        ('quarantine_reminder', 'Quarantine Reminder'),
        ('other', 'Other'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
    ]
    
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='health_alerts')
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', 'due_date']
    
    def __str__(self):
        return f"{self.animal.name} - {self.alert_type} ({self.priority})"

class BreedingRecord(models.Model):
    """Track offspring, genetics, and breeding success metrics"""
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('mated', 'Mated'),
        ('pregnant', 'Pregnant'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    
    OFFSPRING_GENDER = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    
    breeding = models.ForeignKey(BreedingCalendar, on_delete=models.CASCADE, related_name='records')
    sire_animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True, related_name='sired_offspring')
    dam_animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True, related_name='Dam_offspring')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    delivery_date = models.DateField(null=True, blank=True)
    
    # Offspring tracking
    number_of_offspring = models.IntegerField(default=0)
    healthy_offspring = models.IntegerField(default=0)
    stillborn = models.IntegerField(default=0)
    
    # Genetics tracking
    genetics_notes = models.TextField(blank=True, help_text="Genetic traits, inheritance notes")
    birth_weights = models.JSONField(default=dict, blank=True, help_text="Map of offspring IDs to birth weights")
    
    # Veterinary monitoring
    veterinary_complications = models.TextField(blank=True)
    post_delivery_care = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Breeding Record - {self.breeding} ({self.status})"
    
    class Meta:
        verbose_name_plural = "Breeding Records"

class ProductionRecord(models.Model):
    """Track daily production metrics (milk, eggs, etc.)"""
    PRODUCTION_TYPE_CHOICES = [
        ('milk', 'Milk'),
        ('eggs', 'Eggs'),
        ('wool', 'Wool'),
        ('meat', 'Meat'),
        ('honey', 'Honey'),
        ('manure', 'Manure'),
        ('other', 'Other'),
    ]
    
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='production_records')
    production_type = models.CharField(max_length=20, choices=PRODUCTION_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, help_text="e.g. liters, pieces, kg")
    recorded_date = models.DateField()
    quality_grade = models.CharField(max_length=10, blank=True, choices=[('A', 'Grade A'), ('B', 'Grade B'), ('C', 'Grade C')], default='A')
    
    # Market value
    market_price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_market_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Production metrics
    labor_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    feed_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-recorded_date']
        verbose_name_plural = "Production Records"
    
    def __str__(self):
        return f"{self.animal.name} - {self.production_type} ({self.quantity} {self.unit}) on {self.recorded_date}"

class AnimalProductionMetrics(models.Model):
    """Aggregate production analytics per animal"""
    animal = models.OneToOneField(Animal, on_delete=models.CASCADE, related_name='production_metrics')
    
    # Monthly metrics
    current_month_production = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avg_monthly_production = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    highest_monthly_production = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Annual metrics
    year_to_date_production = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    annual_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    annual_feed_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    annual_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Efficiency
    feed_conversion_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    production_efficiency = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage")
    
    # Health & reproduction
    breeding_success_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    health_score = models.DecimalField(max_digits=3, decimal_places=1, default=5.0, help_text="1-10 scale")
    
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Production Metrics - {self.animal.name}"
    
    class Meta:
        verbose_name_plural = "Animal Production Metrics"