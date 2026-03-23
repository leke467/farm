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
    ]
    
    FARM_SIZE_CHOICES = [
        ('small', 'Small (< 50 acres)'),
        ('medium', 'Medium (50-500 acres)'),
        ('large', 'Large (> 500 acres)'),
    ]
    
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_farms')
    farm_type = models.CharField(max_length=20, choices=FARM_TYPE_CHOICES, default='mixed')
    size = models.CharField(max_length=20, choices=FARM_SIZE_CHOICES, default='medium')
    location = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    total_area = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total area in acres")
    established_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
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


MENU_CHOICES = [
    ('dashboard', 'Dashboard'),
    ('animals', 'Animals'),
    ('crops', 'Crops'),
    ('tasks', 'Tasks'),
    ('inventory', 'Inventory'),
    ('expenses', 'Expenses'),
    ('reports', 'Reports'),
    ('settings', 'Settings'),
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