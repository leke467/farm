import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')
django.setup()

from farms.models import Farm
from animals.models import (
    Animal, FeedMix, FeedRecord, BreedingRecord, ProductionRecord,
    Vaccination, BreedingCalendar, HealthAlert, AnimalProductionMetrics
)
from crops.models import Crop, Harvest, CropYieldAnalysis, FertilizerRecommendation, WeatherImpactRecord
from tasks.models import Task
from inventory.models import InventoryItem, InventoryTransaction, InventoryAudit, AuditLineItem, DemandForecast, SupplierPerformance
from expenses.models import Expense, Revenue, FinancialAnalysis, DebtManagement

def is_strictly_demo_farm(farm):
    if not farm:
        return False
    # Only Livestead Demo Farm owned by demo / demo1234
    if farm.name.strip().lower() == 'livestead demo farm':
        owner = getattr(farm, 'owner', None)
        if owner and owner.username in ['demo', 'demo1234']:
            return True
    return False

def cleanup_fake_production_data():
    """
    Safely removes ONLY the auto-generated fake sample records from real farms.
    Does NOT touch any real customer data (e.g. real animals, real inventory items like 'Casava', 'Creep', 'Fish meal', etc.)
    """
    print("=== STARTING SAFE PRODUCTION DATA CLEANUP ===")
    
    # Real user farms are all farms that are not the official demo farm
    real_farms = [f for f in Farm.objects.all() if not is_strictly_demo_farm(f)]
    
    fake_inventory_names = [
        'Layers Poultry Concentrate',
        'Dairy Cattle Feed Mix',
        'NPK 15-15-15 Fertilizer',
        'NDV Poultry Vaccine',
    ]
    
    fake_animal_names = [
        'Holstein Dairy Cows',
        'Broiler Chicken Flock A',
        'Boer Goat Herd',
        'Tilapia Fish Pond #1',
        'Angus Breeding Bulls',
        'Layer Hens Batch 1',
        'Landrace Swine Herd',
    ]
    
    fake_crop_names = [
        'Maize Field Alpha',
        'Cassava Plot Beta',
        'Greenhouse Tomatoes',
    ]
    
    fake_task_titles = [
        'Morning Cattle Feeding & Milking',
        'Poultry NDV Vaccination Check',
        'Maize Field Irrigation Run',
        'Weekly Feed Inventory Audit',
    ]
    
    fake_expense_descriptions = [
        'Bulk Layers Poultry Feed Purchase',
        'Veterinary Inspection & Medications',
        'Monthly Farm Helpers Wage Payment',
        'Tractor Diesel Fuel Top-up',
    ]
    
    fake_revenue_items = [
        '4 Bull Calves',
        '60 Crates Fresh Layer Eggs',
        'Fresh Greenhouse Tomatoes (3.5 Tons)',
    ]

    for farm in real_farms:
        print(f"\nScanning farm: '{farm.name}' (ID: {farm.id})")
        
        # 1. Fake Inventory Items
        fake_items = InventoryItem.objects.filter(farm=farm, name__in=fake_inventory_names)
        count_items = fake_items.count()
        if count_items > 0:
            print(f"  Removing {count_items} fake inventory items...")
            # Cascading deletes transactions, demand forecasts, etc.
            fake_items.delete()
            
        # Clean fake audits
        fake_audits = InventoryAudit.objects.filter(farm=farm, notes__icontains='Q3 Comprehensive Physical Stock Reconciliation')
        count_audits = fake_audits.count()
        if count_audits > 0:
            print(f"  Removing {count_audits} fake audits...")
            fake_audits.delete()

        # Clean fake suppliers
        fake_suppliers = SupplierPerformance.objects.filter(farm=farm, supplier_name__in=[
            "AgriPro Feeds & Supplies", "VetCare International", "Premier Seed & Fertilizer Co", "Grand Cereals Ltd"
        ])
        count_supp = fake_suppliers.count()
        if count_supp > 0:
            print(f"  Removing {count_supp} fake supplier performance records...")
            fake_suppliers.delete()

        # 2. Fake Animals
        fake_animals = Animal.objects.filter(farm=farm, name__in=fake_animal_names)
        count_anim = fake_animals.count()
        if count_anim > 0:
            print(f"  Removing {count_anim} fake animals...")
            # Delete related fake records first
            AnimalProductionMetrics.objects.filter(animal__in=fake_animals).delete()
            ProductionRecord.objects.filter(animal__in=fake_animals).delete()
            BreedingRecord.objects.filter(dam_animal__in=fake_animals).delete()
            BreedingRecord.objects.filter(breeding__animal__in=fake_animals).delete()
            BreedingCalendar.objects.filter(animal__in=fake_animals).delete()
            Vaccination.objects.filter(animal__in=fake_animals).delete()
            HealthAlert.objects.filter(animal__in=fake_animals).delete()
            FeedRecord.objects.filter(animal__in=fake_animals).delete()
            fake_animals.delete()

        # Fake FeedMix
        fake_feed_mixes = FeedMix.objects.filter(farm=farm, name='High-Protein Dairy Ration')
        if fake_feed_mixes.exists():
            print("  Removing fake feed mix...")
            fake_feed_mixes.delete()

        # 3. Fake Crops
        fake_crops = Crop.objects.filter(farm=farm, name__in=fake_crop_names)
        count_crops = fake_crops.count()
        if count_crops > 0:
            print(f"  Removing {count_crops} fake crops...")
            Harvest.objects.filter(crop__in=fake_crops).delete()
            CropYieldAnalysis.objects.filter(crop__in=fake_crops).delete()
            FertilizerRecommendation.objects.filter(crop__in=fake_crops).delete()
            WeatherImpactRecord.objects.filter(crop__in=fake_crops).delete()
            fake_crops.delete()

        # 4. Fake Tasks
        fake_tasks = Task.objects.filter(farm=farm, title__in=fake_task_titles)
        count_tasks = fake_tasks.count()
        if count_tasks > 0:
            print(f"  Removing {count_tasks} fake tasks...")
            fake_tasks.delete()

        # 5. Fake Expenses
        fake_expenses = Expense.objects.filter(farm=farm, description__in=fake_expense_descriptions)
        count_exp = fake_expenses.count()
        if count_exp > 0:
            print(f"  Removing {count_exp} fake expenses...")
            fake_expenses.delete()

        # 6. Fake Revenues
        fake_revenues = Revenue.objects.filter(farm=farm, item_sold__in=fake_revenue_items)
        count_rev = fake_revenues.count()
        if count_rev > 0:
            print(f"  Removing {count_rev} fake revenues...")
            fake_revenues.delete()

        # 7. Fake Debts
        fake_debts = DebtManagement.objects.filter(farm=farm, lender='AgriBank Development Fund')
        if fake_debts.exists():
            print("  Removing fake debt records...")
            fake_debts.delete()

        # 8. Fake Financial Analysis
        fake_fa = FinancialAnalysis.objects.filter(farm=farm, notes__icontains='AI metrics')
        if fake_fa.exists():
            print("  Removing fake AI financial analysis...")
            fake_fa.delete()

    print("\n=== SAFE CLEANUP COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    cleanup_fake_production_data()
