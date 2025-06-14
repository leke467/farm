from django.db import models
from farms.models import Farm

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('feed', 'Feed'),
        ('labor', 'Labor'),
        ('equipment', 'Equipment'),
        ('utilities', 'Utilities'),
        ('seeds', 'Seeds'),
        ('veterinary', 'Veterinary'),
        ('fuel', 'Fuel'),
        ('maintenance', 'Maintenance'),
        ('insurance', 'Insurance'),
        ('taxes', 'Taxes'),
        ('other', 'Other'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('credit_card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='expenses')
    date = models.DateField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    vendor = models.CharField(max_length=200)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    receipt = models.FileField(upload_to='receipts/', blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.description} - ${self.amount}"
    
    class Meta:
        ordering = ['-date']

class Budget(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=20, choices=Expense.CATEGORY_CHOICES)
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField(null=True, blank=True)  # If null, it's yearly budget
    budgeted_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['farm', 'category', 'year', 'month']
    
    def __str__(self):
        period = f"{self.year}"
        if self.month:
            period = f"{self.month}/{self.year}"
        return f"{self.farm.name} - {self.category} - {period}"
    
    @property
    def actual_amount(self):
        expenses = Expense.objects.filter(
            farm=self.farm,
            category=self.category,
            date__year=self.year
        )
        if self.month:
            expenses = expenses.filter(date__month=self.month)
        return expenses.aggregate(total=models.Sum('amount'))['total'] or 0
    
    @property
    def variance(self):
        return self.actual_amount - self.budgeted_amount
    
    @property
    def variance_percentage(self):
        if self.budgeted_amount == 0:
            return 0
        return (self.variance / self.budgeted_amount) * 100