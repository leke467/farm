from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
import random

from farms.models import Farm, FarmMember
from animals.models import (
    Animal, WeightRecord, MedicalRecord, FeedMix, FeedMixItem, FeedRecord, Vaccination, ProductionRecord
)
from crops.models import Crop, CropActivity, Harvest, CropYieldAnalysis
from inventory.models import InventoryItem, InventoryTransaction, InventoryCostTracking
from expenses.models import Expense
from tasks.models import Task

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the farm database with rich, realistic commercial farm sample data.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting farm database seeding process..."))

        user = User.objects.first()
        if not user:
            user = User.objects.create_superuser(
                username='admin',
                email='admin@terratrack.com',
                password='adminpassword123'
            )
            self.stdout.write(self.style.SUCCESS("Created admin user: admin@terratrack.com"))

        farm, created = Farm.objects.get_or_create(
            owner=user,
            defaults={
                'name': 'GreenPastures Integrated Farm',
                'farm_type': 'mixed',
                'size': 'medium',
                'location': 'Ibadan, Oyo State, Nigeria',
                'address': 'Kilometer 15, Ibadan-Ilorin Expressway, Ibadan',
                'total_area': Decimal('150.00'),
                'established_date': date(2021, 3, 15),
                'description': 'A premier modern commercial mixed farm specializing in livestock rearing, crop cultivation, poultry, and aquaculture.',
                'unit_system': 'metric',
                'currency': 'NGN',
                'currency_symbol': '₦',
            }
        )
        if not created:
            farm.name = 'GreenPastures Integrated Farm'
            farm.currency = 'NGN'
            farm.currency_symbol = '₦'
            farm.save()

        FarmMember.objects.get_or_create(farm=farm, user=user, defaults={'role': 'owner'})

        self.stdout.write(self.style.SUCCESS(f"Active Farm: '{farm.name}' (NGN)"))

        # ----------------------------------------------------
        # 1. SEED INVENTORY ITEMS & TRANSACTIONS
        # ----------------------------------------------------
        self.stdout.write("Seeding Inventory Items & Stock Purchases...")
        items_data = [
            # (name, category, qty, unit, min_qty, cost_per_unit, location, supplier)
            ('Yellow Maize Grain', 'feed', 2500, 'kg', 500, 450.00, 'Store Warehouse A', 'Grand Cereals Ltd'),
            ('Soybean Meal (48% Protein)', 'feed', 1200, 'kg', 300, 750.00, 'Store Warehouse A', 'Olam Agri Nigeria'),
            ('Concentrate Layer Mash', 'feed', 1800, 'kg', 400, 680.00, 'Feed Mill Depot', 'Premier Feeds'),
            ('Wheat Offal', 'feed', 1500, 'kg', 300, 350.00, 'Store Warehouse B', 'Flour Mills of Nigeria'),
            ('Catfish Floating Pellets 4mm', 'feed', 800, 'kg', 200, 1100.00, 'Aquaculture Shed', 'Skretting Feeds'),
            ('NPK 15-15-15 Fertilizer', 'fertilizer', 40, 'bags', 10, 32000.00, 'Fertilizer Store', 'Indorama Eleme'),
            ('Urea Granular Fertilizer (46% N)', 'fertilizer', 25, 'bags', 5, 28000.00, 'Fertilizer Store', 'Dangote Fertilizer'),
            ('Ivermectin Dewormer Injectable', 'medical', 15, 'vials', 5, 4500.00, 'Vet Clinic Cabinet', 'VetCare Agro'),
            ('Multivitamin Soluble Powder', 'medical', 30, 'packs', 10, 2200.00, 'Vet Clinic Cabinet', 'Animal Care Ltd'),
            ('Newcastle Disease Vaccine (Lasota)', 'medical', 20, 'vials', 5, 3800.00, 'Vet Fridge B', 'NVRI Vom'),
            ('Low-Sulfur Diesel Fuel', 'fuel', 650, 'liters', 150, 1250.00, 'Fuel Tank Depot', 'NNPC Retail'),
            ('Hybrid White Maize Seeds (SC719)', 'seeds', 60, 'kg', 15, 3500.00, 'Seed Bank Vault', 'SeedCo Nigeria'),
            ('Roma Tomato Seeds (F1 Hybrid)', 'seeds', 10, 'tin', 2, 14500.00, 'Seed Bank Vault', 'East-West Seed'),
            ('Irrigation Water Pump 5HP', 'equipment', 2, 'units', 1, 185000.00, 'Equipment Shed', 'AgroTech Machinery'),
        ]

        inventory_map = {}
        for name, cat, qty, unit, min_q, cost_unit, loc, supp in items_data:
            item, _ = InventoryItem.objects.update_or_create(
                farm=farm,
                name=name,
                defaults={
                    'category': cat,
                    'quantity': Decimal(str(qty)),
                    'unit': unit,
                    'min_quantity': Decimal(str(min_q)),
                    'cost_per_unit': Decimal(str(cost_unit)),
                    'location': loc,
                    'supplier': supp,
                    'purchase_date': timezone.now().date() - timedelta(days=random.randint(10, 60)),
                    'expiry_date': timezone.now().date() + timedelta(days=random.randint(90, 365)),
                    'notes': f"Commercial quality {name} stocked for farm operations.",
                }
            )
            inventory_map[name] = item

            InventoryTransaction.objects.get_or_create(
                item=item,
                transaction_type='in',
                quantity=Decimal(str(qty)),
                defaults={
                    'cost_per_unit': Decimal(str(cost_unit)),
                    'total_cost': Decimal(str(qty)) * Decimal(str(cost_unit)),
                    'reason': 'Initial Stock Purchase Log',
                    'reference': f"PO-{random.randint(10000, 99999)}",
                    'status': 'completed',
                    'transaction_date': timezone.now().date() - timedelta(days=15),
                    'notes': 'Stock delivered and verified by warehouse manager.',
                }
            )

            InventoryCostTracking.objects.get_or_create(
                item=item,
                defaults={
                    'cost_method': 'weighted_avg',
                    'total_units_purchased': Decimal(str(qty)),
                    'total_purchase_cost': Decimal(str(qty)) * Decimal(str(cost_unit)),
                    'weighted_avg_cost': Decimal(str(cost_unit)),
                }
            )

        # ----------------------------------------------------
        # 2. SEED CUSTOM FEED MIXES & FORMULATIONS
        # ----------------------------------------------------
        self.stdout.write("Seeding Custom Proportional Feed Mixes...")
        layer_mix, _ = FeedMix.objects.get_or_create(
            farm=farm,
            name="High-Yield Layer Mash Blend",
            defaults={
                'description': "Balanced high-protein formulation for egg-laying ISA Brown flock.",
            }
        )
        if 'Yellow Maize Grain' in inventory_map and 'Concentrate Layer Mash' in inventory_map and 'Soybean Meal (48% Protein)' in inventory_map:
            FeedMixItem.objects.get_or_create(feed_mix=layer_mix, inventory_item=inventory_map['Yellow Maize Grain'], defaults={'ingredient_name': 'Yellow Maize Grain', 'percentage': Decimal('50.00')})
            FeedMixItem.objects.get_or_create(feed_mix=layer_mix, inventory_item=inventory_map['Concentrate Layer Mash'], defaults={'ingredient_name': 'Concentrate Layer Mash', 'percentage': Decimal('30.00')})
            FeedMixItem.objects.get_or_create(feed_mix=layer_mix, inventory_item=inventory_map['Soybean Meal (48% Protein)'], defaults={'ingredient_name': 'Soybean Meal (48% Protein)', 'percentage': Decimal('20.00')})

        cattle_mix, _ = FeedMix.objects.get_or_create(
            farm=farm,
            name="Ruminant Dairy Cattle Ration",
            defaults={
                'description': "High-fiber energy ration for lactating dairy cows.",
            }
        )
        if 'Yellow Maize Grain' in inventory_map and 'Wheat Offal' in inventory_map:
            FeedMixItem.objects.get_or_create(feed_mix=cattle_mix, inventory_item=inventory_map['Yellow Maize Grain'], defaults={'ingredient_name': 'Yellow Maize Grain', 'percentage': Decimal('60.00')})
            FeedMixItem.objects.get_or_create(feed_mix=cattle_mix, inventory_item=inventory_map['Wheat Offal'], defaults={'ingredient_name': 'Wheat Offal', 'percentage': Decimal('40.00')})

        # ----------------------------------------------------
        # 3. SEED LIVESTOCK ANIMALS
        # ----------------------------------------------------
        self.stdout.write("Seeding Livestock Animals (Cattle, Broilers, Layers, Goats, Pigs, Fish)...")
        animals_data = [
            ('White Fulani Cow #001', 'cow', 'White Fulani', date(2021, 4, 10), 'female', 460.00, 'healthy', False, 1),
            ('Holstein Friesian Cow #002', 'cow', 'Holstein', date(2020, 9, 22), 'female', 540.00, 'healthy', False, 1),
            ('Red Bororo Bull #003', 'cow', 'Red Bororo', date(2019, 11, 5), 'male', 620.00, 'healthy', False, 1),
            ('Flock A - ISA Brown Layers', 'chicken', 'ISA Brown', date(2025, 8, 1), 'female', 1.85, 'healthy', True, 500),
            ('Flock B - Cobb 500 Broilers', 'chicken', 'Cobb 500', date(2025, 12, 10), 'mixed', 2.40, 'healthy', True, 350),
            ('Kano Brown Goat Group', 'goat', 'Kano Brown', date(2024, 2, 14), 'mixed', 35.00, 'healthy', True, 25),
            ('Large White Sow #P01', 'pig', 'Large White', date(2023, 5, 18), 'female', 145.00, 'healthy', False, 1),
            ('Catfish Pond 1 - Fingerlings', 'fish', 'Clarias Gariepinus', date(2025, 11, 1), 'mixed', 0.45, 'healthy', True, 2000),
        ]

        animal_objs = []
        for name, a_type, breed, b_date, sex, weight, h_status, is_grp, count in animals_data:
            animal, _ = Animal.objects.update_or_create(
                farm=farm,
                name=name,
                defaults={
                    'animal_type': a_type,
                    'breed': breed,
                    'birth_date': b_date,
                    'gender': sex,
                    'weight': Decimal(str(weight)),
                    'status': h_status,
                    'is_group': is_grp,
                    'count': count,
                    'notes': f"Commercial {a_type} record in {name}.",
                }
            )
            animal_objs.append(animal)

        # ----------------------------------------------------
        # 4. SEED FEED RECORDS & PRODUCTION LOGS
        # ----------------------------------------------------
        self.stdout.write("Seeding Feed Intake, Milk & Egg Production Logs...")

        if animal_objs:
            layer_flock = animal_objs[3] # Layers
            cow1, cow2 = animal_objs[0], animal_objs[1]

            # Feed intake
            FeedRecord.objects.get_or_create(
                animal=layer_flock,
                date=timezone.now().date(),
                defaults={
                    'group_name': 'Flock A Layers',
                    'amount': Decimal('60.00'),
                    'unit': 'kg',
                    'feed_type': 'High-Yield Layer Mash Blend',
                    'feed_mix': layer_mix,
                    'cost': Decimal('40800.00'),
                    'deduct_from_inventory': True,
                    'notes': 'Daily morning flock feeding (60kg layer mash formulation).',
                }
            )

            # Daily Milk Production Logs (ProductionRecord with production_type='milk')
            for i in range(14):
                log_date = timezone.now().date() - timedelta(days=i)
                ProductionRecord.objects.get_or_create(
                    animal=cow1,
                    recorded_date=log_date,
                    production_type='milk',
                    defaults={
                        'quantity': Decimal(str(round(random.uniform(12.5, 15.0), 2))),
                        'unit': 'liters',
                        'quality_grade': 'A',
                        'market_price_per_unit': Decimal('600.00'),
                        'total_market_value': Decimal(str(round(random.uniform(12.5, 15.0) * 600, 2))),
                        'notes': 'Clean morning milking log.',
                    }
                )
                ProductionRecord.objects.get_or_create(
                    animal=cow2,
                    recorded_date=log_date,
                    production_type='milk',
                    defaults={
                        'quantity': Decimal(str(round(random.uniform(15.0, 18.5), 2))),
                        'unit': 'liters',
                        'quality_grade': 'A',
                        'market_price_per_unit': Decimal('600.00'),
                        'total_market_value': Decimal(str(round(random.uniform(15.0, 18.5) * 600, 2))),
                        'notes': 'High yield morning milking log.',
                    }
                )

            # Daily Egg Production Logs (ProductionRecord with production_type='eggs')
            for i in range(14):
                log_date = timezone.now().date() - timedelta(days=i)
                egg_qty = random.randint(450, 485)
                ProductionRecord.objects.get_or_create(
                    animal=layer_flock,
                    recorded_date=log_date,
                    production_type='eggs',
                    defaults={
                        'quantity': Decimal(str(egg_qty)),
                        'unit': 'pieces',
                        'quality_grade': 'A',
                        'market_price_per_unit': Decimal('90.00'), # ₦90 per egg (₦2,700/crate)
                        'total_market_value': Decimal(str(egg_qty * 90)),
                        'notes': f"Daily layer egg collection: {egg_qty} pieces.",
                    }
                )

            # Weight Records
            for animal in [cow1, cow2]:
                for month_back in range(4, 0, -1):
                    w_date = timezone.now().date() - timedelta(days=month_back * 30)
                    w_val = animal.weight - Decimal(str(month_back * 8))
                    WeightRecord.objects.get_or_create(
                        animal=animal,
                        date=w_date,
                        defaults={'weight': w_val, 'notes': 'Monthly routine weigh-in.'}
                    )

            # Medical Records
            MedicalRecord.objects.get_or_create(
                animal=cow1,
                date=timezone.now().date() - timedelta(days=20),
                defaults={
                    'treatment': 'Deworming & Multivitamin Administration',
                    'veterinarian': 'Dr. Adeleke (Lead Vet)',
                    'cost': Decimal('6500.00'),
                    'notes': 'Routine deworming with Ivermectin injection.',
                }
            )

            # Vaccination Logs
            Vaccination.objects.get_or_create(
                animal=cow1,
                scheduled_date=timezone.now().date() - timedelta(days=10),
                defaults={
                    'vaccine_type': 'Foot and Mouth Disease (FMD)',
                    'completed_date': timezone.now().date() - timedelta(days=10),
                    'status': 'completed',
                    'veterinarian': 'Dr. Adeleke',
                    'notes': 'Booster dose administered successfully.',
                }
            )

        # ----------------------------------------------------
        # 5. SEED CROPS, HARVESTS & YIELD ANALYSIS
        # ----------------------------------------------------
        self.stdout.write("Seeding Crop Fields, Plantings & Harvest Yields...")

        crop1, _ = Crop.objects.update_or_create(
            farm=farm,
            name="Hybrid White Maize (Commercial)",
            defaults={
                'field': 'Plot A1 - North Field (5.0 Ha)',
                'area': Decimal('12.50'), # acres
                'planted_date': timezone.now().date() - timedelta(days=75),
                'expected_harvest_date': timezone.now().date() + timedelta(days=35),
                'status': 'growing',
                'stage': 'vegetative',
                'variety': 'SC719 Hybrid',
                'crop_lifecycle': 'annual',
                'notes': 'High yield maize crop under center-pivot fertigation.',
            }
        )

        crop2, _ = Crop.objects.update_or_create(
            farm=farm,
            name="Roma Tomato (Greenhouse F1)",
            defaults={
                'field': 'Plot B2 - Greenhouse Complex 1',
                'area': Decimal('3.00'),
                'planted_date': timezone.now().date() - timedelta(days=90),
                'expected_harvest_date': timezone.now().date() + timedelta(days=15),
                'status': 'harvesting',
                'stage': 'harvest',
                'variety': 'East-West F1 Hybrid',
                'crop_lifecycle': 'annual',
                'notes': 'Premium grade greenhouse tomatoes.',
            }
        )

        # Crop Activities
        CropActivity.objects.get_or_create(
            crop=crop1,
            activity_type='fertilizing',
            date=timezone.now().date() - timedelta(days=30),
            defaults={
                'description': 'Top-dressing with NPK 15-15-15 fertilizer at 150kg/ha rate.',
                'cost': Decimal('128000.00'),
                'notes': 'Applied ahead of expected rain showers.',
            }
        )

        # Harvest Logs
        Harvest.objects.get_or_create(
            crop=crop2,
            date=timezone.now().date() - timedelta(days=5),
            defaults={
                'quantity': Decimal('120.00'),
                'unit': 'crates',
                'quality_grade': 'A',
            }
        )

        CropYieldAnalysis.objects.get_or_create(
            crop=crop1,
            defaults={
                'previous_yield': Decimal('4.20'),
                'expected_yield': Decimal('5.50'),
                'actual_yield': Decimal('5.20'),
                'yield_unit': 'tonnes/ha',
                'water_provided': Decimal('450.00'),
                'fertilizer_applied': Decimal('250.00'),
                'yield_per_dollar_invested': Decimal('3.45'),
                'roi_percentage': Decimal('42.50'),
                'yield_efficiency': Decimal('94.50'),
                'optimization_recommendations': 'Maintain regular fertigation schedule and inspect lower leaves for rust.',
            }
        )

        # ----------------------------------------------------
        # 6. SEED FARM OPERATIONAL EXPENSES
        # ----------------------------------------------------
        self.stdout.write("Seeding Operational Expenses...")
        expenses_data = [
            ('feed', 'Bulk Feed Grains Purchase (Maize & Soy)', 1250000.00, 'Grand Cereals Ltd', 'bank_transfer'),
            ('labor', 'Monthly Farm Hand & Casual Worker Payroll', 450000.00, 'Staff Payroll Account', 'bank_transfer'),
            ('fuel', 'Diesel Supply 500L for Generator & Tractor', 625000.00, 'NNPC Retail Station', 'bank_transfer'),
            ('veterinary', 'Quarterly Flock Vaccination & Routine Vet Checkup', 85000.00, 'Animal Health Consult', 'cash'),
            ('maintenance', 'Tractor Engine Servicing & Hydraulic Oil Replacement', 140000.00, 'AgroMech Technical Services', 'bank_transfer'),
            ('utilities', 'Borehole Water Pump Electricity Bill', 75000.00, 'IBEDC Distribution Co', 'bank_transfer'),
            ('seeds', 'Hybrid Maize & Tomato Seed Purchase', 160000.00, 'SeedCo Nigeria', 'credit_card'),
        ]

        for cat, desc, amt, vend, p_method in expenses_data:
            Expense.objects.get_or_create(
                farm=farm,
                description=desc,
                defaults={
                    'date': timezone.now().date() - timedelta(days=random.randint(3, 45)),
                    'category': cat,
                    'amount': Decimal(str(amt)),
                    'vendor': vend,
                    'payment_method': p_method,
                    'notes': f"Approved operational expense for {desc}.",
                }
            )

        # ----------------------------------------------------
        # 7. SEED SCHEDULER TASKS
        # ----------------------------------------------------
        self.stdout.write("Seeding Farm Tasks & Schedules...")
        tasks_data = [
            ('Morning Broiler Flock Feeding & Water Inspection', 'Inspect water nipple lines and top-up layer mash blend in Poultry House 1.', 'daily_care', 'high', 'completed', 0),
            ('Dairy Cow Milking & Yield Logging', 'Morning milking for White Fulani #001 and Holstein #002. Store in milk chiller.', 'daily_care', 'high', 'completed', 0),
            ('Egg Collection & Grading (Layer Flock A)', 'Collect morning eggs, sort cracked eggs, pack into 30-egg crates.', 'daily_care', 'high', 'in_progress', 1),
            ('Plot A1 Maize Fertigation & Irrigation Check', 'Run drip fertigation system for 2 hours with NPK soluble fertilizer.', 'crop_care', 'medium', 'pending', 2),
            ('Catfish Pond 1 Feed Top-Up & Water Quality Check', 'Measure pH and dissolved oxygen in Eaten Pond 1. Feed 4mm pellets.', 'daily_care', 'medium', 'completed', 0),
            ('Routine Generator Oil & Filter Change', 'Service 40kVA diesel generator engine oil and fuel filters.', 'maintenance', 'medium', 'pending', 3),
        ]

        for title, desc, cat, prio, stat, due_days_ahead in tasks_data:
            Task.objects.get_or_create(
                farm=farm,
                title=title,
                defaults={
                    'description': desc,
                    'category': cat,
                    'priority': prio,
                    'status': stat,
                    'due_date': timezone.now() + timedelta(days=due_days_ahead),
                    'assigned_to': user,
                    'created_by': user,
                    'notes': 'Assigned to farm operations team.',
                }
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded farm database with comprehensive real-world commercial data!"))
