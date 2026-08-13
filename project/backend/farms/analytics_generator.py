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
    Auto-generates and synchronizes rich data across ALL tabs for DEMO farms only:
    1. Baseline Animals, Crops, Inventory, Sales, Expenses, & Audits
    2. Demand Forecasting & Supplier Performance
    3. Animal Productivity & Breeding Records
    4. Financial Overview, Profit & Loss, & Debt Management
    5. Crop Yield Analytics, Fertilizer Recommendations & Weather Impacts
    """
    if not farm or not is_demo_farm(farm):
        return

    today = timezone.now().date()

    # =======================================================
    # BASELINE DATA ENSURER: Ensure farm has base entities
    # =======================================================

    # 1. Base Animals
    if not Animal.objects.filter(farm=farm).exists():
        Animal.objects.create(farm=farm, name='Holstein Dairy Cows', animal_type='cow', breed='Holstein', count=35, weight=650.0, gender='female', status='healthy', notes='High yield milk producers', is_group=True)
        Animal.objects.create(farm=farm, name='Broiler Chicken Flock A', animal_type='chicken', breed='Cobb 500', count=650, weight=2.4, gender='mixed', status='healthy', notes='Market weight flock', is_group=True)
        Animal.objects.create(farm=farm, name='Boer Goat Herd', animal_type='goat', breed='Boer', count=50, weight=48.0, gender='female', status='healthy', notes='Meat production group', is_group=True)
        Animal.objects.create(farm=farm, name='Tilapia Fish Pond #1', animal_type='fish', breed='Nile Tilapia', count=1500, weight=0.45, gender='mixed', status='healthy', notes='Main aquaculture pond', is_group=True)

    # 2. Base Crops
    if not Crop.objects.filter(farm=farm).exists():
        Crop.objects.create(farm=farm, name='Maize Field Alpha', variety='Hybrid Grain', field='Field A', area=50.0, stage='vegetative', status='growing', planted_date=today - timedelta(days=45), expected_harvest_date=today + timedelta(days=75))
        Crop.objects.create(farm=farm, name='Cassava Plot Beta', variety='TMS 30572', field='Field B', area=30.0, stage='planting', status='planning', planted_date=today - timedelta(days=20), expected_harvest_date=today + timedelta(days=240))
        Crop.objects.create(farm=farm, name='Greenhouse Tomatoes', variety='Roma VF', field='Greenhouse 1', area=10.0, stage='harvest', status='harvesting', planted_date=today - timedelta(days=90), expected_harvest_date=today + timedelta(days=15))

    # 3. Base Inventory Items
    if not InventoryItem.objects.filter(farm=farm).exists():
        inv1 = InventoryItem.objects.create(farm=farm, name='Layers Poultry Concentrate', category='feed', quantity=85.0, unit='bags', min_quantity=20.0, cost_per_unit=14500.0, supplier='AgroFeeds Ltd', location='Store A')
        inv2 = InventoryItem.objects.create(farm=farm, name='Dairy Cattle Feed Mix', category='feed', quantity=120.0, unit='bags', min_quantity=30.0, cost_per_unit=12000.0, supplier='GrainMasters', location='Store B')
        inv3 = InventoryItem.objects.create(farm=farm, name='NPK 15-15-15 Fertilizer', category='fertilizer', quantity=45.0, unit='bags', min_quantity=15.0, cost_per_unit=18500.0, supplier='FertilizerCo', location='Shed 1')
        inv4 = InventoryItem.objects.create(farm=farm, name='NDV Poultry Vaccine', category='medical', quantity=18.0, unit='vials', min_quantity=5.0, cost_per_unit=3500.0, supplier='VetCare Pharma', location='Fridge')
        
        for inv in [inv1, inv2, inv3, inv4]:
            InventoryTransaction.objects.create(item=inv, transaction_type='in', quantity=inv.quantity, cost_per_unit=inv.cost_per_unit, transaction_date=today - timedelta(days=30), reason='Initial stock purchase')

    # 4. Base Inventory Audit
    if not InventoryAudit.objects.filter(farm=farm).exists():
        aud = InventoryAudit.objects.create(
            farm=farm, audit_date=today - timedelta(days=7), end_date=today - timedelta(days=6),
            status='completed', notes='Q3 Comprehensive Physical Stock Reconciliation', created_by='Store Manager'
        )
        inv_item = InventoryItem.objects.filter(farm=farm).first()
        if inv_item:
            AuditLineItem.objects.create(
                audit=aud, item=inv_item, expected_quantity=90.0, counted_quantity=85.0, variance=-5.0, notes='Minor usage discrepancy resolved.'
            )

    # 5. Base Revenues / Sales
    if not Revenue.objects.filter(farm=farm).exists():
        Revenue.objects.create(farm=farm, item_sold='4 Bull Calves', source='animal_sales', quantity=4, unit='head', unit_price=237500.0, total_amount=950000.0, buyer='Livestock Mart Ltd', date=today - timedelta(days=15))
        Revenue.objects.create(farm=farm, item_sold='60 Crates Fresh Layer Eggs', source='animal_products', quantity=60, unit='crates', unit_price=3500.0, total_amount=210000.0, buyer='City Supermarket', date=today - timedelta(days=7))
        Revenue.objects.create(farm=farm, item_sold='Fresh Greenhouse Tomatoes (3.5 Tons)', source='crop_sales', quantity=3.5, unit='ton', unit_price=148500.0, total_amount=520000.0, buyer='Wholesale Veggie Distributor', date=today - timedelta(days=3))

    # 6. Base Expenses
    if not Expense.objects.filter(farm=farm).exists():
        Expense.objects.create(farm=farm, description='Bulk Layers Poultry Feed Purchase', amount=185000.0, category='feed', vendor='AgroFeeds Ltd', date=today - timedelta(days=12), payment_method='bank_transfer')
        Expense.objects.create(farm=farm, description='Veterinary Inspection & Medications', amount=42000.0, category='veterinary', vendor='Dr. Smith Vet Services', date=today - timedelta(days=8), payment_method='cash')
        Expense.objects.create(farm=farm, description='Monthly Farm Helpers Wage Payment', amount=250000.0, category='labor', vendor='Farm Labor Force', date=today - timedelta(days=5), payment_method='bank_transfer')
        Expense.objects.create(farm=farm, description='Tractor Diesel Fuel Top-up', amount=65000.0, category='fuel', vendor='TotalEnergies Station', date=today - timedelta(days=2), payment_method='credit_card')

    # =======================================================
    # 1. DEMAND FORECASTING & SUPPLIER PERFORMANCE
    # =======================================================
    inventory_items = InventoryItem.objects.filter(farm=farm)
    for item in inventory_items:
        min_thresh = item.min_quantity or Decimal('10.00')
        monthly_usage = max(Decimal('5.00'), item.quantity * Decimal('0.30'))
        forecast_demand = max(Decimal('8.00'), item.quantity * Decimal('0.35'))
        reorder_point = min_thresh if min_thresh > 0 else Decimal('15.00')
        order_qty = reorder_point * Decimal('3.00')
        safety = reorder_point / Decimal('2.00')

        DemandForecast.objects.update_or_create(
            item=item,
            defaults={
                'farm': farm,
                'avg_monthly_usage': monthly_usage,
                'forecasted_monthly_demand': forecast_demand,
                'optimal_reorder_point': reorder_point,
                'optimal_order_quantity': order_qty,
                'safety_stock': safety,
                'usage_trend': 'increasing',
                'forecast_accuracy': Decimal('94.50'),
                'data_points': 12,
            }
        )

    first_item = inventory_items.first()
    if first_item:
        suppliers_list = [
            ("AgriPro Feeds & Supplies", Decimal('4.8'), Decimal('97.50'), 'excellent'),
            ("VetCare International", Decimal('4.9'), Decimal('99.00'), 'excellent'),
            ("Premier Seed & Fertilizer Co", Decimal('4.5'), Decimal('94.00'), 'good'),
            ("Grand Cereals Ltd", Decimal('4.7'), Decimal('96.00'), 'good'),
        ]
        for supp_name, q_rating, on_time, rel_grade in suppliers_list:
            SupplierPerformance.objects.update_or_create(
                farm=farm,
                supplier_name=supp_name,
                item=first_item,
                defaults={
                    'quality_rating': q_rating,
                    'on_time_delivery_rate': on_time,
                    'reliability_grade': rel_grade,
                    'avg_unit_price': Decimal('1500.00'),
                    'last_purchase_price': Decimal('1500.00'),
                    'total_orders': 18,
                    'notes': 'Preferred primary supplier.',
                }
            )

    # =======================================================
    # 2. ANIMAL PRODUCTIVITY & BREEDING RECORDS
    # =======================================================
    farm_animals = Animal.objects.filter(farm=farm)
    for animal in farm_animals:
        mult = Decimal(str(animal.count if animal.is_group and animal.count > 0 else 1))
        rev = Decimal('120000.00') * mult
        profit = Decimal('75000.00') * mult

        AnimalProductionMetrics.objects.update_or_create(
            animal=animal,
            defaults={
                'current_month_production': Decimal('450.00') * mult,
                'avg_monthly_production': Decimal('420.00') * mult,
                'highest_monthly_production': Decimal('510.00') * mult,
                'year_to_date_production': Decimal('3200.00') * mult,
                'annual_revenue': rev,
                'annual_feed_cost': Decimal('45000.00') * mult,
                'annual_profit': profit,
                'feed_conversion_ratio': Decimal('1.85'),
                'production_efficiency': Decimal('93.20'),
                'breeding_success_rate': Decimal('95.00'),
                'health_score': Decimal('9.2'),
            }
        )

        prod_type = 'eggs' if 'layer' in animal.name.lower() or 'chicken' in animal.name.lower() else ('milk' if 'cow' in animal.name.lower() or 'cattle' in animal.name.lower() else 'meat')
        unit = 'crates' if prod_type == 'eggs' else ('liters' if prod_type == 'milk' else 'kg')
        qty = Decimal('15.00') if prod_type == 'eggs' else (Decimal('45.00') if prod_type == 'milk' else Decimal('5.00'))

        ProductionRecord.objects.get_or_create(
            animal=animal,
            recorded_date=today - timedelta(days=1),
            defaults={
                'production_type': prod_type,
                'quantity': qty,
                'unit': unit,
                'quality_grade': 'A',
                'notes': f'Daily harvest for {animal.name}',
            }
        )

        if animal.gender in ['female', 'Female', 'F', 'mixed']:
            cal, _ = BreedingCalendar.objects.get_or_create(
                animal=animal,
                defaults={
                    'breeding_date': today - timedelta(days=60),
                    'expected_delivery_date': today + timedelta(days=30),
                    'partner_animal_name': 'Sire #102',
                    'status': 'confirmed',
                    'notes': 'Healthy gestation confirmed by vet examination.',
                }
            )
            BreedingRecord.objects.get_or_create(
                breeding=cal,
                defaults={
                    'number_of_offspring': 4,
                    'healthy_offspring': 4,
                    'stillborn': 0,
                    'genetics_notes': 'High vigor and strong growth traits.',
                }
            )

    # =======================================================
    # 3. FINANCIAL OVERVIEW & ANALYSIS
    # =======================================================
    cur_year = today.year
    cur_month = today.month

    total_exp = Expense.objects.filter(farm=farm).aggregate(tot=models.Sum('amount'))['tot'] or Decimal('542000.00')
    total_rev = Revenue.objects.filter(farm=farm).aggregate(tot=models.Sum('total_amount'))['tot'] or Decimal('1680000.00')
    if total_rev == 0:
        total_rev = Decimal('1680000.00')

    net_prof = total_rev - total_exp
    raw_margin = (net_prof / total_rev * Decimal('100.00')) if total_rev > 0 else Decimal('0.00')
    raw_roi = (net_prof / total_exp * Decimal('100.00')) if total_exp > 0 else Decimal('0.00')

    margin = min(max(raw_margin, Decimal('-999.99')), Decimal('999.99'))
    roi_val = min(max(raw_roi, Decimal('-999.99')), Decimal('999.99'))

    FinancialAnalysis.objects.update_or_create(
        farm=farm,
        period_type='month',
        year=cur_year,
        month=cur_month,
        defaults={
            'total_revenue': total_rev,
            'animal_product_revenue': total_rev * Decimal('0.60'),
            'crop_revenue': total_rev * Decimal('0.40'),
            'total_expenses': total_exp,
            'feed_costs': total_exp * Decimal('0.55'),
            'labor_costs': total_exp * Decimal('0.25'),
            'equipment_costs': total_exp * Decimal('0.15'),
            'gross_profit': total_rev - (total_exp * Decimal('0.55')),
            'net_profit': net_prof,
            'profit_margin': margin,
            'roi': roi_val,
            'profit_trend': 'increasing',
            'expense_trend': 'stable',
            'notes': 'Monthly financial summary generated with AI metrics.',
        }
    )

    DebtManagement.objects.get_or_create(
        farm=farm,
        lender='AgriBank Development Fund',
        defaults={
            'loan_amount': Decimal('5000000.00'),
            'disbursement_date': date(cur_year - 1, 1, 15),
            'due_date': date(cur_year + 2, 1, 15),
            'interest_rate': Decimal('9.50'),
            'status': 'active',
            'total_paid': Decimal('1500000.00'),
            'remaining_balance': Decimal('3500000.00'),
            'next_payment_date': today + timedelta(days=25),
            'next_payment_amount': Decimal('125000.00'),
            'payment_frequency': 'monthly',
            'number_of_payments': 36,
            'payments_completed': 12,
            'notes': 'Commercial farm expansion loan.',
        }
    )

    # =======================================================
    # 4. CROP ANALYTICS, FERTILIZER & WEATHER IMPACTS
    # =======================================================
    farm_crops = Crop.objects.filter(farm=farm)
    for crop in farm_crops:
        exp_yield = Decimal('6500.00')
        act_yield = Decimal('6200.00')
        harvest_eff = (act_yield / exp_yield * Decimal('100.00'))

        Harvest.objects.get_or_create(
            crop=crop, date=today - timedelta(days=5),
            defaults={
                'quantity': Decimal('4.50'),
                'unit': 'tons',
                'quality_grade': 'A',
            }
        )

        CropYieldAnalysis.objects.update_or_create(
            crop=crop,
            defaults={
                'previous_yield': Decimal('5800.00'),
                'expected_yield': exp_yield,
                'actual_yield': act_yield,
                'yield_unit': 'kg',
                'water_provided': Decimal('14.50'),
                'fertilizer_applied': Decimal('250.00'),
                'disease_severity': 5,
                'pest_damage': 8,
                'yield_per_dollar_invested': Decimal('3.04'),
                'roi_percentage': Decimal('204.00'),
                'yield_efficiency': harvest_eff,
                'optimization_recommendations': f'Optimal yield analysis recorded for {crop.name}. Maintain nitrogen fertilization and drip irrigation schedules.',
            }
        )

        FertilizerRecommendation.objects.get_or_create(
            crop=crop,
            defaults={
                'recommended_type': 'NPK 15-15-15',
                'recommended_quantity': Decimal('150.00'),
                'unit': 'kg',
                'application_timing': 'Apply at early vegetative stage (Weeks 3-4)',
                'expected_yield_increase': Decimal('18.50'),
                'status': 'applied',
                'estimated_cost': Decimal('65000.00'),
                'expected_additional_revenue': Decimal('180000.00'),
                'notes': f'Recommended NPK 15:15:15 application for {crop.name}.',
            }
        )

        WeatherImpactRecord.objects.get_or_create(
            crop=crop,
            impact_date=today - timedelta(days=5),
            defaults={
                'impact_type': 'excessive_heat',
                'severity': 'minor',
                'estimated_yield_loss': Decimal('3.50'),
                'estimated_financial_loss': Decimal('25000.00'),
                'recovery_actions': 'Increased evening irrigation frequency by 20%',
                'recovery_cost': Decimal('8000.00'),
                'expected_recovery_yield': Decimal('98.00'),
                'notes': 'Favorable recovery following evening irrigation adjustment.',
            }
        )
