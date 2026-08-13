import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')
django.setup()

from farms.models import Farm
from animals.models import (
    Animal, FeedMix, FeedRecord, BreedingRecord, ProductionRecord, Vaccination, BreedingCalendar, HealthAlert, AnimalProductionMetrics
)
from crops.models import Crop, Harvest, CropYieldAnalysis, FertilizerRecommendation, WeatherImpactRecord
from tasks.models import Task
from inventory.models import InventoryItem, InventoryTransaction, InventoryAudit, AuditLineItem, DemandForecast, SupplierPerformance
from expenses.models import Expense, Revenue, FinancialAnalysis, DebtManagement

def is_demo_farm(farm):
    if not farm:
        return False
    owner = getattr(farm, 'owner', None)
    if owner:
        if owner.username in ['demo', 'demo1234'] or getattr(owner, 'is_demo', False):
            return True
    if 'demo' in farm.name.lower():
        return True
    return False

def cleanup_real_user_farms():
    print("=== CLEANING AUTO-GENERATED DEMO DATA FROM REAL USER FARMS ===")
    real_farms = [f for f in Farm.objects.all() if not is_demo_farm(f)]
    
    for farm in real_farms:
        print(f"Cleaning farm: '{farm.name}' (ID: {farm.id}, Owner: {farm.owner.username if farm.owner else 'None'})")
        
        # 1. Animals & related
        AnimalProductionMetrics.objects.filter(animal__farm=farm).delete()
        ProductionRecord.objects.filter(animal__farm=farm).delete()
        BreedingRecord.objects.filter(breeding__animal__farm=farm).delete()
        BreedingCalendar.objects.filter(animal__farm=farm).delete()
        Vaccination.objects.filter(animal__farm=farm).delete()
        HealthAlert.objects.filter(animal__farm=farm).delete()
        FeedRecord.objects.filter(animal__farm=farm).delete()
        FeedMix.objects.filter(farm=farm).delete()
        Animal.objects.filter(farm=farm).delete()
        
        # 2. Crops & related
        Harvest.objects.filter(crop__farm=farm).delete()
        CropYieldAnalysis.objects.filter(crop__farm=farm).delete()
        FertilizerRecommendation.objects.filter(crop__farm=farm).delete()
        WeatherImpactRecord.objects.filter(crop__farm=farm).delete()
        Crop.objects.filter(farm=farm).delete()
        
        # 3. Inventory & related
        AuditLineItem.objects.filter(audit__farm=farm).delete()
        InventoryAudit.objects.filter(farm=farm).delete()
        InventoryTransaction.objects.filter(item__farm=farm).delete()
        DemandForecast.objects.filter(farm=farm).delete()
        SupplierPerformance.objects.filter(farm=farm).delete()
        InventoryItem.objects.filter(farm=farm).delete()
        
        # 4. Expenses, Revenues, Financials, Debt
        Expense.objects.filter(farm=farm).delete()
        Revenue.objects.filter(farm=farm).delete()
        FinancialAnalysis.objects.filter(farm=farm).delete()
        DebtManagement.objects.filter(farm=farm).delete()
        
        # 5. Tasks
        Task.objects.filter(farm=farm).delete()

    print("=== REAL USER FARMS CLEANED SUCCESSFULLY ===")

if __name__ == '__main__':
    cleanup_real_user_farms()
