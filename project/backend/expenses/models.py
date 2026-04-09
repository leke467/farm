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

class Revenue(models.Model):
    """Track all farm income sources"""
    REVENUE_SOURCE_CHOICES = [
        ('animal_products', 'Animal Products'),
        ('crop_sales', 'Crop Sales'),
        ('equipment_rental', 'Equipment Rental'),
        ('services', 'Services'),
        ('government_subsidy', 'Government Subsidy'),
        ('grants', 'Grants'),
        ('other', 'Other'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='revenues')
    date = models.DateField()
    source = models.CharField(max_length=30, choices=REVENUE_SOURCE_CHOICES)
    item_sold = models.CharField(max_length=200, help_text="e.g., Milk, Corn, Eggs")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    buyer = models.CharField(max_length=200, blank=True)
    
    # Quality & grading
    quality_grade = models.CharField(max_length=10, blank=True, choices=[('A', 'Grade A'), ('B', 'Grade B'), ('C', 'Grade C')])
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.item_sold} - ${self.total_amount} ({self.date})"
    
    class Meta:
        ordering = ['-date']
        verbose_name_plural = "Revenues"

class FinancialAnalysis(models.Model):
    """Monthly/Yearly financial summary and analysis"""
    PERIOD_CHOICES = [
        ('month', 'Monthly'),
        ('year', 'Yearly'),
        ('quarter', 'Quarterly'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='financial_analysis')
    period_type = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    year = models.IntegerField()
    month = models.IntegerField(null=True, blank=True)  # 1-12 for monthly
    quarter = models.IntegerField(null=True, blank=True)  # 1-4 for quarterly
    
    # Revenue
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    animal_product_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    crop_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Expenses
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    feed_costs = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    labor_costs = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    equipment_costs = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_costs = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Profitability
    gross_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    profit_margin = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Percentage")
    roi = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Return on Investment %")
    
    # Trend analysis
    profit_trend = models.CharField(max_length=20, choices=[
        ('increasing', 'Increasing'),
        ('stable', 'Stable'),
        ('decreasing', 'Decreasing'),
    ], null=True, blank=True)
    expense_trend = models.CharField(max_length=20, choices=[
        ('increasing', 'Increasing'),
        ('stable', 'Stable'),
        ('decreasing', 'Decreasing'),
    ], null=True, blank=True)
    
    # Variance analysis
    budgeted_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_variance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_variance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        period = f"{self.year}"
        if self.month:
            period = f"{self.month}/{self.year}"
        elif self.quarter:
            period = f"Q{self.quarter}/{self.year}"
        return f"Financial Analysis - {self.farm.name} ({period})"
    
    class Meta:
        verbose_name_plural = "Financial Analysis"
        unique_together = ('farm', 'period_type', 'year', 'month', 'quarter')

class DebtManagement(models.Model):
    """Track farm loans and debt"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paid_off', 'Paid Off'),
        ('defaulted', 'Defaulted'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='debts')
    lender = models.CharField(max_length=200)
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2)
    disbursement_date = models.DateField()
    due_date = models.DateField()
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Payments
    total_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2)
    next_payment_date = models.DateField(null=True, blank=True)
    next_payment_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Terms
    payment_frequency = models.CharField(max_length=20, choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('semi_annual', 'Semi-Annual'),
        ('annual', 'Annual'),
    ])
    number_of_payments = models.IntegerField(null=True, blank=True)
    payments_completed = models.IntegerField(default=0)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Loan from {self.lender} - ${self.remaining_balance} remaining"
    
    class Meta:
        ordering = ['due_date']