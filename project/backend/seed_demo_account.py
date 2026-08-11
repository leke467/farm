import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')
django.setup()

from django.contrib.auth import get_user_model
from farms.models import Farm, FarmMember, FarmCategory, RoleMenuPermission
from animals.models import (
    Animal, FeedMix, FeedMixItem, FeedRecord, BreedingRecord,
    ProductionRecord, Vaccination, BreedingCalendar, HealthAlert
)
from crops.models import Crop, Harvest, CropYieldAnalysis, FertilizerRecommendation, WeatherImpactRecord
from tasks.models import Task
from inventory.models import InventoryItem, InventoryTransaction
from expenses.models import Expense, Revenue
from accounts.models import User

def seed_demo_account():
    print("=== SEEDING FULL DEMO ACCOUNT (demo1234) ===")

    # 1. Create or retrieve demo user demo1234
    user, created = User.objects.get_or_create(username='demo1234', defaults={
        'email': 'demo@livesteads.com',
        'first_name': 'Livestead',
        'last_name': 'Demo User',
        'is_admin': True,
        'is_active': True,
    })
    user.set_password('password1234')
    user.save()
    print(f"Demo User 'demo1234' {'created' if created else 'updated'}.")

    # 2. Create or retrieve demo farm
    farm, farm_created = Farm.objects.get_or_create(
        name='Livestead Demo Farm',
        defaults={
            'owner': user,
            'farm_type': 'mixed',
            'size': 'large',
            'location': 'Green Valley Farm, CA',
            'total_area': 250.00,
            'currency': 'NGN',
            'currency_symbol': '₦',
            'unit_system': 'metric',
            'description': 'A state-of-the-art model farm demonstrating mixed crop and livestock production.'
        }
    )
    if not farm_created and farm.owner != user:
        farm.owner = user
        farm.save()

    FarmMember.objects.get_or_create(
        farm=farm,
        user=user,
        defaults={'role': 'owner'}
    )

    print(f"Demo Farm '{farm.name}' (ID: {farm.id}) ready.")

    # 3. Seed Animals
    animals_data = [
        {'name': 'Holstein Dairy Cows', 'animal_type': 'cow', 'breed': 'Holstein', 'count': 35, 'weight': 650.0, 'gender': 'female', 'status': 'healthy', 'notes': 'High yield milk producers', 'is_group': True},
        {'name': 'Angus Breeding Bulls', 'animal_type': 'cow', 'breed': 'Black Angus', 'count': 4, 'weight': 850.0, 'gender': 'male', 'status': 'healthy', 'notes': 'Primary herd sires', 'is_group': True},
        {'name': 'Broiler Chicken Flock A', 'animal_type': 'chicken', 'breed': 'Cobb 500', 'count': 650, 'weight': 2.4, 'gender': 'mixed', 'status': 'healthy', 'notes': 'Batch nearing market weight', 'is_group': True},
        {'name': 'Layer Hens Batch 1', 'animal_type': 'chicken', 'breed': 'ISA Brown', 'count': 400, 'weight': 1.9, 'gender': 'female', 'status': 'healthy', 'notes': 'Peak egg production phase', 'is_group': True},
        {'name': 'Boer Goat Herd', 'animal_type': 'goat', 'breed': 'Boer', 'count': 50, 'weight': 48.0, 'gender': 'female', 'status': 'healthy', 'notes': 'Meat production breeding group', 'is_group': True},
        {'name': 'Landrace Swine Herd', 'animal_type': 'pig', 'breed': 'Landrace', 'count': 22, 'weight': 110.0, 'gender': 'female', 'status': 'healthy', 'notes': 'Gestating sows', 'is_group': True},
        {'name': 'Tilapia Fish Pond #1', 'animal_type': 'fish', 'breed': 'Nile Tilapia', 'count': 1500, 'weight': 0.45, 'gender': 'mixed', 'status': 'healthy', 'notes': 'Main aquaculture pond', 'is_group': True},
    ]

    created_animals = []
    for ad in animals_data:
        anim, _ = Animal.objects.get_or_create(
            farm=farm,
            name=ad['name'],
            defaults=ad
        )
        created_animals.append(anim)

    cows = created_animals[0]
    poultry = created_animals[3]
    goats = created_animals[4]

    # Seed FeedMix
    feed_mix, _ = FeedMix.objects.get_or_create(
        farm=farm,
        name='High-Protein Dairy Ration',
        defaults={'description': 'Optimized milk yield blend'}
    )

    # Seed Feed Records
    if not FeedRecord.objects.filter(animal__farm=farm).exists():
        FeedRecord.objects.create(
            animal=cows, feed_type='Dairy Pellets Mix', feed_mix=feed_mix, amount=150.0, unit='kg',
            cost=28000.0, date=date.today() - timedelta(days=1), notes='Daily morning feed distribution'
        )
        FeedRecord.objects.create(
            animal=poultry, feed_type='Layers Mash Concentrate', amount=80.0, unit='kg',
            cost=16500.0, date=date.today(), notes='Afternoon feeding'
        )

    # Seed Breeding Calendar & Records
    b_cal1, _ = BreedingCalendar.objects.get_or_create(
        animal=goats,
        partner_animal_name='GOT-M01',
        defaults={
            'breeding_date': date.today() - timedelta(days=60),
            'expected_delivery_date': date.today() + timedelta(days=90),
            'status': 'confirmed',
            'notes': 'Ultrasonic pregnancy check positive'
        }
    )
    b_cal2, _ = BreedingCalendar.objects.get_or_create(
        animal=cows,
        partner_animal_name='AI-HOL-99',
        defaults={
            'breeding_date': date.today() - timedelta(days=120),
            'expected_delivery_date': date.today() + timedelta(days=160),
            'status': 'confirmed',
            'notes': 'Artificial insemination with premium bull semen'
        }
    )

    if not BreedingRecord.objects.filter(breeding=b_cal1).exists():
        BreedingRecord.objects.create(
            breeding=b_cal1,
            dam_animal=goats,
            status='pregnant',
            number_of_offspring=2,
            healthy_offspring=2,
            genetics_notes='High fertility line',
        )

    # Seed Production Records
    if not ProductionRecord.objects.filter(animal__farm=farm).exists():
        ProductionRecord.objects.create(
            animal=cows, production_type='milk', quantity=145.0, unit='liters',
            market_price_per_unit=500.0, total_market_value=72500.0, recorded_date=date.today() - timedelta(days=1),
            notes='Morning & evening milking total'
        )
        ProductionRecord.objects.create(
            animal=poultry, production_type='eggs', quantity=18.0, unit='crates',
            market_price_per_unit=3200.0, total_market_value=57600.0, recorded_date=date.today(),
            notes='Grade A fresh egg collection'
        )

    # Seed Vaccinations & Health Alerts
    if not Vaccination.objects.filter(animal__farm=farm).exists():
        Vaccination.objects.create(
            animal=poultry, vaccine_type='Newcastle Disease (NDV)',
            scheduled_date=date.today() + timedelta(days=2), status='scheduled',
            veterinarian='Dr. Smith', notes='Routine bi-weekly booster'
        )
        Vaccination.objects.create(
            animal=cows, vaccine_type='Foot and Mouth Disease (FMD)',
            scheduled_date=date.today() - timedelta(days=15), completed_date=date.today() - timedelta(days=15),
            status='completed', veterinarian='Dr. Smith', notes='Annual mandatory vaccination'
        )

    if not HealthAlert.objects.filter(animal__farm=farm).exists():
        HealthAlert.objects.create(
            animal=poultry, alert_type='vaccination_due', priority='high',
            status='active', title='Newcastle Booster Due',
            description='Layer Hen Batch 1 requires NDV booster vaccination within 48 hours.',
            due_date=date.today() + timedelta(days=2)
        )
        HealthAlert.objects.create(
            animal=cows, alert_type='weight_concern', priority='medium',
            status='acknowledged', title='Cow #108 Weight Variance',
            description='Post-calving weight drop of 4.5% detected.',
            due_date=date.today() + timedelta(days=5)
        )

    # 4. Seed Crops
    crops_data = [
        {'name': 'Maize Field Alpha', 'variety': 'Hybrid Grain', 'field': 'Field A', 'area': 50.0, 'stage': 'vegetative', 'status': 'growing', 'planted_date': date.today() - timedelta(days=45), 'expected_harvest_date': date.today() + timedelta(days=75)},
        {'name': 'Cassava Plot Beta', 'variety': 'TMS 30572', 'field': 'Field B', 'area': 30.0, 'stage': 'planting', 'status': 'planning', 'planted_date': date.today() - timedelta(days=20), 'expected_harvest_date': date.today() + timedelta(days=240)},
        {'name': 'Greenhouse Tomatoes', 'variety': 'Roma VF', 'field': 'Greenhouse 1', 'area': 10.0, 'stage': 'harvest', 'status': 'harvesting', 'planted_date': date.today() - timedelta(days=90), 'expected_harvest_date': date.today() + timedelta(days=15)},
    ]

    created_crops = []
    for cd in crops_data:
        crp, _ = Crop.objects.get_or_create(
            farm=farm,
            name=cd['name'],
            defaults={**cd, 'notes': 'High yield hybrid variety'}
        )
        created_crops.append(crp)

    maize = created_crops[0]
    tomatoes = created_crops[2]

    # Seed Crop Logs & Harvests
    if not Harvest.objects.filter(crop__in=created_crops).exists():
        Harvest.objects.create(
            crop=tomatoes, date=date.today() - timedelta(days=5),
            quantity=4.5, unit='tons', quality_grade='A'
        )

    if not CropYieldAnalysis.objects.filter(crop__in=created_crops).exists():
        CropYieldAnalysis.objects.create(
            crop=tomatoes, previous_yield=4.0, expected_yield=5.0, actual_yield=4.5,
            yield_unit='tons', yield_efficiency=90.0,
            optimization_recommendations='Optimize soil nitrogen & potassium levels during flowering stage.'
        )

    if not FertilizerRecommendation.objects.filter(crop__in=created_crops).exists():
        FertilizerRecommendation.objects.create(
            crop=maize, recommended_type='NPK 15-15-15', recommended_quantity=150.0,
            unit='kg', application_timing='Side-dressing at 4 weeks post-emergence',
            expected_yield_increase=18.5, estimated_cost=65000.0, status='applied',
            notes='Mid-season growth booster application'
        )

    if not WeatherImpactRecord.objects.filter(crop__in=created_crops).exists():
        WeatherImpactRecord.objects.create(
            crop=maize, impact_date=date.today() - timedelta(days=10),
            impact_type='drought', severity='minor', estimated_yield_loss=2.5,
            estimated_financial_loss=15000.0, recovery_actions='Increased watering schedule by 30%',
            notes='Short 4-day dry spell managed with supplementary drip irrigation.'
        )

    # 5. Seed Inventory Items
    inv_data = [
        {'name': 'Layers Poultry Concentrate', 'category': 'feed', 'quantity': 85.0, 'unit': 'bags', 'min_quantity': 20.0, 'cost_per_unit': 14500.0, 'supplier': 'AgroFeeds Ltd', 'location': 'Store A'},
        {'name': 'Dairy Cattle Feed Mix', 'category': 'feed', 'quantity': 120.0, 'unit': 'bags', 'min_quantity': 30.0, 'cost_per_unit': 12000.0, 'supplier': 'GrainMasters', 'location': 'Store B'},
        {'name': 'NPK 15-15-15 Fertilizer', 'category': 'fertilizer', 'quantity': 45.0, 'unit': 'bags', 'min_quantity': 15.0, 'cost_per_unit': 18500.0, 'supplier': 'FertilizerCo', 'location': 'Shed 1'},
        {'name': 'NDV Poultry Vaccine', 'category': 'medical', 'quantity': 18.0, 'unit': 'vials', 'min_quantity': 5.0, 'cost_per_unit': 3500.0, 'supplier': 'VetCare Pharma', 'location': 'Fridge'},
    ]

    for idata in inv_data:
        inv, _ = InventoryItem.objects.get_or_create(
            farm=farm,
            name=idata['name'],
            defaults={**idata, 'purchase_date': date.today() - timedelta(days=30)}
        )
        if not InventoryTransaction.objects.filter(item=inv).exists():
            InventoryTransaction.objects.create(
                item=inv, transaction_type='in', quantity=idata['quantity'],
                cost_per_unit=idata['cost_per_unit'], transaction_date=date.today() - timedelta(days=30),
                reason='Initial bulk stocking purchase', reference='INV-PO-001'
            )

    # 6. Seed Tasks
    tasks_data = [
        {'title': 'Morning Cattle Feeding & Milking', 'description': 'Distribute 150kg dairy feed mix and complete morning milking.', 'due_date': date.today(), 'priority': 'high', 'category': 'Daily Care', 'status': 'pending'},
        {'title': 'Poultry NDV Vaccination Check', 'description': 'Administer NDV booster vaccine to Layer Hen Batch 1.', 'due_date': date.today() + timedelta(days=1), 'priority': 'medium', 'category': 'Daily Care', 'status': 'pending'},
        {'title': 'Maize Field Irrigation Run', 'description': 'Run secondary drip irrigation pumps for Field Alpha.', 'due_date': date.today() - timedelta(days=1), 'priority': 'low', 'category': 'Field Work', 'status': 'completed'},
        {'title': 'Weekly Feed Inventory Audit', 'description': 'Inspect store A and store B inventory balances.', 'due_date': date.today() + timedelta(days=3), 'priority': 'medium', 'category': 'Maintenance', 'status': 'pending'},
    ]

    for td in tasks_data:
        Task.objects.get_or_create(
            farm=farm,
            title=td['title'],
            defaults={**td, 'assigned_to': user, 'created_by': user}
        )

    # 7. Seed Expenses
    expenses_data = [
        {'description': 'Bulk Layers Poultry Feed Purchase', 'amount': 185000.0, 'category': 'feed', 'vendor': 'AgroFeeds Ltd', 'date': date.today() - timedelta(days=12), 'payment_method': 'bank_transfer'},
        {'description': 'Veterinary Inspection & Medications', 'amount': 42000.0, 'category': 'veterinary', 'vendor': 'Dr. Smith Vet Services', 'date': date.today() - timedelta(days=8), 'payment_method': 'cash'},
        {'description': 'Monthly Farm Helpers Wage Payment', 'amount': 250000.0, 'category': 'labor', 'vendor': 'Farm Labor Force', 'date': date.today() - timedelta(days=5), 'payment_method': 'bank_transfer'},
        {'description': 'Tractor Diesel Fuel Top-up', 'amount': 65000.0, 'category': 'fuel', 'vendor': 'TotalEnergies Station', 'date': date.today() - timedelta(days=2), 'payment_method': 'credit_card'},
    ]

    for ed in expenses_data:
        Expense.objects.get_or_create(
            farm=farm,
            description=ed['description'],
            defaults=ed
        )

    # 8. Seed Sales / Revenues
    revenues_data = [
        {'item_sold': '4 Bull Calves', 'source': 'animal_sales', 'quantity': 4, 'unit': 'head', 'unit_price': 237500.0, 'total_amount': 950000.0, 'buyer': 'Livestock Mart Ltd', 'date': date.today() - timedelta(days=15)},
        {'item_sold': '60 Crates Fresh Layer Eggs', 'source': 'animal_products', 'quantity': 60, 'unit': 'crates', 'unit_price': 3500.0, 'total_amount': 210000.0, 'buyer': 'City Supermarket', 'date': date.today() - timedelta(days=7)},
        {'item_sold': 'Fresh Greenhouse Tomatoes (3.5 Tons)', 'source': 'crop_sales', 'quantity': 3.5, 'unit': 'ton', 'unit_price': 148500.0, 'total_amount': 520000.0, 'buyer': 'Wholesale Veggie Distributor', 'date': date.today() - timedelta(days=3)},
    ]

    for rd in revenues_data:
        Revenue.objects.get_or_create(
            farm=farm,
            item_sold=rd['item_sold'],
            defaults=rd
        )

    print("=== FULL DEMO DATA SEEDED SUCCESSFULLY ===")

if __name__ == "__main__":
    seed_demo_account()
