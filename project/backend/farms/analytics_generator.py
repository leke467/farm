import random
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.db import models

from farms.models import Farm
from inventory.models import InventoryItem, InventoryTransaction, InventoryAudit, AuditLineItem, DemandForecast, SupplierPerformance
from animals.models import Animal, AnimalProductionMetrics, ProductionRecord, BreedingCalendar, BreedingRecord
from expenses.models import Expense, Revenue, FinancialAnalysis, DebtManagement
from crops.models import Crop, CropYieldAnalysis, FertilizerRecommendation, WeatherImpactRecord, Harvest


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


def ensure_analytics_data_for_farm(farm):
    """
    Deprecated: Production safety guard.
    Never auto-generates or injects fake animals, crops, inventory, or financial data into any farm.
    """
    return
