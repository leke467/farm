#!/usr/bin/env python
"""
Create a demo farm for testing AI features
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')
django.setup()

from django.contrib.auth import get_user_model
from farms.models import Farm
from animals.models import Animal
from crops.models import Crop
from expenses.models import Expense, Revenue
from datetime import date

User = get_user_model()
user = User.objects.get(id=1)

print(f"\n✓ User: {user.username}")
print(f"✓ Current farms: {user.owned_farms.count()}")

# Create demo farm if not exists
farm, created = Farm.objects.get_or_create(
    owner=user,
    name="Demo Farm",
    defaults={
        'farm_type': 'mixed',
        'size': 'medium',
        'location': 'Test Location',
        'total_area': 100
    }
)

if created:
    print(f"\n✓ Created farm: {farm.name} (ID: {farm.id})")
else:
    print(f"\n✓ Farm already exists: {farm.name} (ID: {farm.id})")

# Create demo animals
animal1, _ = Animal.objects.get_or_create(
    farm=farm,
    name="Bessie",
    defaults={
        'animal_type': 'cow',
        'breed': 'Holstein',
        'gender': 'female',
        'status': 'healthy'
    }
)
print(f"✓ Animal: {animal1.name}")

animal2, _ = Animal.objects.get_or_create(
    farm=farm,
    name="Buck",
    defaults={
        'animal_type': 'goat',
        'breed': 'Alpine',
        'gender': 'male',
        'status': 'healthy'
    }
)
print(f"✓ Animal: {animal2.name}")

# Create demo crops
crop1, _ = Crop.objects.get_or_create(
    farm=farm,
    name="Corn",
    field="Field A",
    defaults={
        'area': 30,
        'planted_date': date.today(),
        'expected_harvest_date': date(2026, 9, 1),
        'status': 'growing',
        'stage': 'vegetative'
    }
)
print(f"✓ Crop: {crop1.name}")

crop2, _ = Crop.objects.get_or_create(
    farm=farm,
    name="Soybeans",
    field="Field B",
    defaults={
        'area': 20,
        'planted_date': date.today(),
        'expected_harvest_date': date(2026, 10, 1),
        'status': 'growing',
        'stage': 'vegetative'
    }
)
print(f"✓ Crop: {crop2.name}")

# Create demo expenses
expense1, _ = Expense.objects.get_or_create(
    farm=farm,
    date=date.today(),
    category='feed',
    vendor='Farm Supply Co',
    defaults={
        'description': 'Animal feed',
        'amount': 500,
        'payment_method': 'check'
    }
)
print(f"✓ Expense: ${expense1.amount} ({expense1.category})")

expense2, _ = Expense.objects.get_or_create(
    farm=farm,
    date=date.today(),
    category='labor',
    vendor='Local Workers',
    defaults={
        'description': 'Weekly labor',
        'amount': 800,
        'payment_method': 'cash'
    }
)
print(f"✓ Expense: ${expense2.amount} ({expense2.category})")

# Create demo revenues
revenue1, _ = Revenue.objects.get_or_create(
    farm=farm,
    date=date.today(),
    source='animal_products',
    item_sold='Milk',
    unit_price=5,
    defaults={
        'quantity': 100,
        'unit': 'gallons',
        'total_amount': 500,
        'buyer': 'Dairy Cooperative'
    }
)
print(f"✓ Revenue: ${revenue1.total_amount} ({revenue1.source})")

revenue2, _ = Revenue.objects.get_or_create(
    farm=farm,
    date=date.today(),
    source='crop_sales',
    item_sold='Corn',
    unit_price=6,
    defaults={
        'quantity': 200,
        'unit': 'bushels',
        'total_amount': 1200,
        'buyer': 'Grain Elevator'
    }
)
print(f"✓ Revenue: ${revenue2.total_amount} ({revenue2.source})")

print(f"\n✅ Demo farm setup complete!")
print(f"   Farm: {farm.name}")
print(f"   Animals: {farm.animals.count()}")
print(f"   Crops: {farm.crops.count()}")
print(f"   Expenses: {farm.expenses.count()}")
print(f"   Revenues: {farm.revenues.count()}")
print(f"\n🚀 Now try the AI panel - it should analyze this demo data!\n")
