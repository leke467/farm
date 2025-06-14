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