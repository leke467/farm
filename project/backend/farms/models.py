from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Farm(models.Model):
    FARM_TYPE_CHOICES = [
        ('mixed', 'Mixed'),
        ('livestock', 'Livestock'),
        ('crop', 'Crop'),
        ('dairy', 'Dairy'),
        ('poultry', 'Poultry'),
        ('aquaculture', 'Aquaculture'),
        ('orchard', 'Orchard'),
        ('vineyard', 'Vineyard'),
        ('apiary', 'Apiary'),
        ('greenhouse', 'Greenhouse'),
        ('hydroponics', 'Hydroponics'),
        ('nursery', 'Nursery'),
        ('forestry', 'Forestry'),
        ('horticulture', 'Horticulture'),
        ('pastoral', 'Pastoral'),
        ('agroforestry', 'Agroforestry'),
        ('other', 'Other')
    ]
    
    FARM_SIZE_CHOICES = [
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
    ]
    
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_farms')
    farm_type = models.CharField(max_length=30, choices=FARM_TYPE_CHOICES, default='mixed')
    size = models.CharField(max_length=20, choices=FARM_SIZE_CHOICES, default='medium')
    location = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    total_area = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total farm area")
    established_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    unit_system = models.CharField(max_length=10, choices=[('imperial', 'Imperial'), ('metric', 'Metric')], default='metric')
    currency = models.CharField(max_length=10, default='NGN')
    currency_symbol = models.CharField(max_length=10, default='₦')
    logo = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class FarmMember(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('worker', 'Worker'),
        ('viewer', 'Viewer'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farm_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='worker')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['farm', 'user']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.farm.name} ({self.role})"


class FarmCategory(models.Model):
    """User-defined categories for any farm type.
    Each farm can define its own animal types, crop types, production types, etc."""
    CATEGORY_TYPES = [
        ('animal_type', 'Animal Type'),
        ('production_type', 'Production Type'),
        ('crop_type', 'Crop Type'),
        ('crop_stage', 'Crop Growth Stage'),
        ('task_category', 'Task Category'),
        ('inventory_category', 'Inventory Category'),
        ('expense_category', 'Expense Category'),
        ('revenue_source', 'Revenue Source'),
        ('unit', 'Unit of Measurement'),
    ]
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='categories')
    category_type = models.CharField(max_length=30, choices=CATEGORY_TYPES)
    value = models.CharField(max_length=100)
    label = models.CharField(max_length=100)
    icon = models.CharField(max_length=10, blank=True)
    is_default = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ['farm', 'category_type', 'value']
        ordering = ['sort_order', 'label']
    def __str__(self):
        return f"{self.farm.name} - {self.category_type}: {self.label}"


MENU_CHOICES = [
    ('dashboard', 'Dashboard'),
    ('animals', 'Animals (Main Menu)'),
    ('animals-overview', '↳ Animals: Overview'),
    ('animals-feed', '↳ Animals: Feed Logs'),
    ('animals-breeding', '↳ Animals: Breeding Logs'),
    ('crops', 'Crops (Main Menu)'),
    ('crops-overview', '↳ Crops: Overview'),
    ('crops-harvest', '↳ Crops: Harvest & Yield Logs'),
    ('crops-fertilizer', '↳ Crops: Fertilizer Records'),
    ('crops-weather', '↳ Crops: Weather Impact Logs'),
    ('tasks', 'Tasks'),
    ('inventory', 'Inventory (Main Menu)'),
    ('inventory-overview', '↳ Inventory: Overview'),
    ('inventory-audits', '↳ Inventory: Audits'),
    ('inventory-costs', '↳ Inventory: Cost Analysis'),
    ('expenses', 'Expenses'),
    ('sales', 'Sales & Income'),
    ('reports', 'Reports'),
    ('health', 'Health Alerts'),
    ('analytics', 'Analytics (Main Menu)'),
    ('analytics-forecasting', '↳ Analytics: Demand Forecasting'),
    ('analytics-animals', '↳ Analytics: Animal Productivity'),
    ('analytics-financial', '↳ Analytics: Financial Overview'),
    ('analytics-crops', '↳ Analytics: Crop Analytics'),
    ('settings', 'Settings'),
    ('subscription', 'Subscription'),
]


class RoleMenuPermission(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='role_menu_permissions')
    role = models.CharField(max_length=20, choices=FarmMember.ROLE_CHOICES)
    menu_key = models.CharField(max_length=30, choices=MENU_CHOICES)
    can_view = models.BooleanField(default=True)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['farm', 'role', 'menu_key']

    def __str__(self):
        return f"{self.farm.name} - {self.role} - {self.menu_key}"


class UserMenuPermission(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='user_menu_permissions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='menu_permission_overrides')
    menu_key = models.CharField(max_length=30, choices=MENU_CHOICES)
    can_view = models.BooleanField(null=True, blank=True)
    can_create = models.BooleanField(null=True, blank=True)
    can_edit = models.BooleanField(null=True, blank=True)
    can_delete = models.BooleanField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['farm', 'user', 'menu_key']

    def __str__(self):
        return f"{self.farm.name} - {self.user.username} - {self.menu_key}"