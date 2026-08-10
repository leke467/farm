from django.core.management.base import BaseCommand
from farms.models import Farm, FarmCategory

DEFAULT_CATEGORIES = {
    'animal_type': [
        {'value': 'cow', 'label': 'Cow', 'icon': '🐄'},
        {'value': 'goat', 'label': 'Goat', 'icon': '🐐'},
        {'value': 'sheep', 'label': 'Sheep', 'icon': '🐑'},
        {'value': 'pig', 'label': 'Pig', 'icon': '🐷'},
        {'value': 'chicken', 'label': 'Chicken', 'icon': '🐔'},
        {'value': 'duck', 'label': 'Duck', 'icon': '🦆'},
        {'value': 'turkey', 'label': 'Turkey', 'icon': '🦃'},
        {'value': 'fish', 'label': 'Fish', 'icon': '🐟'},
        {'value': 'horse', 'label': 'Horse', 'icon': '🐴'},
        {'value': 'rabbit', 'label': 'Rabbit', 'icon': '🐰'},
        {'value': 'bee', 'label': 'Bee Colony', 'icon': '🐝'},
    ],
    'production_type': [
        {'value': 'milk', 'label': 'Milk', 'icon': '🥛'},
        {'value': 'eggs', 'label': 'Eggs', 'icon': '🥚'},
        {'value': 'meat', 'label': 'Meat', 'icon': '🥩'},
        {'value': 'wool', 'label': 'Wool', 'icon': '🧶'},
        {'value': 'honey', 'label': 'Honey', 'icon': '🍯'},
        {'value': 'manure', 'label': 'Manure', 'icon': ''},
        {'value': 'hide', 'label': 'Hide/Leather', 'icon': ''},
        {'value': 'feathers', 'label': 'Feathers', 'icon': '🪶'},
    ],
    'crop_type': [
        {'value': 'grain', 'label': 'Grain', 'icon': '🌾'},
        {'value': 'vegetable', 'label': 'Vegetable', 'icon': '🥬'},
        {'value': 'fruit', 'label': 'Fruit', 'icon': '🍎'},
        {'value': 'legume', 'label': 'Legume', 'icon': ''},
        {'value': 'tuber', 'label': 'Tuber', 'icon': '🥔'},
        {'value': 'herb', 'label': 'Herb', 'icon': '🌿'},
        {'value': 'flower', 'label': 'Flower', 'icon': '🌸'},
        {'value': 'tree_crop', 'label': 'Tree Crop', 'icon': '🌳'},
        {'value': 'vine_crop', 'label': 'Vine Crop', 'icon': '🍇'},
    ],
    'crop_stage': [
        {'value': 'planning', 'label': 'Planning', 'icon': '📋'},
        {'value': 'planting', 'label': 'Planting', 'icon': '🌱'},
        {'value': 'emergence', 'label': 'Emergence', 'icon': '🌿'},
        {'value': 'vegetative', 'label': 'Vegetative', 'icon': '🌿'},
        {'value': 'flowering', 'label': 'Flowering', 'icon': '🌸'},
        {'value': 'fruiting', 'label': 'Fruiting', 'icon': '🍎'},
        {'value': 'maturation', 'label': 'Maturation', 'icon': '🌾'},
        {'value': 'harvest', 'label': 'Harvest', 'icon': '🧺'},
        {'value': 'dormancy', 'label': 'Dormancy', 'icon': '❄️'},
        {'value': 'bud_break', 'label': 'Bud Break', 'icon': '🌱'},
        {'value': 'pruning', 'label': 'Pruning', 'icon': '✂️'},
        {'value': 'post_harvest', 'label': 'Post Harvest', 'icon': '📦'},
    ],
    'task_category': [
        {'value': 'daily_care', 'label': 'Daily Care', 'icon': ''},
        {'value': 'feeding', 'label': 'Feeding', 'icon': ''},
        {'value': 'health', 'label': 'Health Check', 'icon': ''},
        {'value': 'maintenance', 'label': 'Maintenance', 'icon': '🔧'},
        {'value': 'crop_care', 'label': 'Crop Care', 'icon': '🌿'},
        {'value': 'harvesting', 'label': 'Harvesting', 'icon': '🧺'},
        {'value': 'cleaning', 'label': 'Cleaning', 'icon': '🧹'},
        {'value': 'administrative', 'label': 'Administrative', 'icon': '📝'},
        {'value': 'other', 'label': 'Other', 'icon': ''},
    ],
    'inventory_category': [
        {'value': 'feed', 'label': 'Feed', 'icon': ''},
        {'value': 'fertilizer', 'label': 'Fertilizer', 'icon': ''},
        {'value': 'medical', 'label': 'Medical', 'icon': '💊'},
        {'value': 'seeds', 'label': 'Seeds', 'icon': '🌱'},
        {'value': 'tools', 'label': 'Tools', 'icon': '🔧'},
        {'value': 'fuel', 'label': 'Fuel', 'icon': '⛽'},
        {'value': 'infrastructure', 'label': 'Infrastructure', 'icon': '🏗️'},
        {'value': 'other', 'label': 'Other', 'icon': ''},
    ],
    'expense_category': [
        {'value': 'feed', 'label': 'Feed', 'icon': ''},
        {'value': 'labor', 'label': 'Labor', 'icon': '👷'},
        {'value': 'equipment', 'label': 'Equipment', 'icon': '🔧'},
        {'value': 'utilities', 'label': 'Utilities', 'icon': '💡'},
        {'value': 'veterinary', 'label': 'Veterinary', 'icon': '🏥'},
        {'value': 'seeds', 'label': 'Seeds', 'icon': '🌱'},
        {'value': 'fuel', 'label': 'Fuel', 'icon': '⛽'},
        {'value': 'maintenance', 'label': 'Maintenance', 'icon': '🔧'},
        {'value': 'insurance', 'label': 'Insurance', 'icon': '🛡️'},
        {'value': 'taxes', 'label': 'Taxes', 'icon': ''},
        {'value': 'other', 'label': 'Other', 'icon': ''},
    ],
    'revenue_source': [
        {'value': 'animal_products', 'label': 'Animal Products', 'icon': ''},
        {'value': 'crop_sales', 'label': 'Crop Sales', 'icon': '🌾'},
        {'value': 'services', 'label': 'Services', 'icon': ''},
        {'value': 'grants', 'label': 'Grants', 'icon': ''},
        {'value': 'other', 'label': 'Other', 'icon': ''},
    ],
    'unit': [
        {'value': 'kg', 'label': 'Kilograms', 'icon': ''},
        {'value': 'g', 'label': 'Grams', 'icon': ''},
        {'value': 'lbs', 'label': 'Pounds', 'icon': ''},
        {'value': 'oz', 'label': 'Ounces', 'icon': ''},
        {'value': 'liters', 'label': 'Liters', 'icon': ''},
        {'value': 'gallons', 'label': 'Gallons', 'icon': ''},
        {'value': 'units', 'label': 'Units', 'icon': ''},
        {'value': 'bags', 'label': 'Bags', 'icon': ''},
        {'value': 'bales', 'label': 'Bales', 'icon': ''},
        {'value': 'boxes', 'label': 'Boxes', 'icon': '📦'},
        {'value': 'tons', 'label': 'Tons', 'icon': ''},
        {'value': 'acres', 'label': 'Acres', 'icon': ''},
        {'value': 'hectares', 'label': 'Hectares', 'icon': ''},
    ],
}

def seed_farm_categories(farm):
    for category_type, categories in DEFAULT_CATEGORIES.items():
        for i, category in enumerate(categories):
            FarmCategory.objects.get_or_create(
                farm=farm,
                category_type=category_type,
                value=category['value'],
                defaults={
                    'label': category['label'],
                    'icon': category['icon'],
                    'is_default': True,
                    'sort_order': i,
                }
            )

class Command(BaseCommand):
    help = "Seeds default categories for a specific farm or all farms"

    def add_arguments(self, parser):
        parser.add_argument('--farm-id', type=int, help='ID of the farm to seed categories for', required=False)

    def handle(self, *args, **options):
        farm_id = options.get('farm_id')
        
        if farm_id:
            try:
                farm = Farm.objects.get(id=farm_id)
                seed_farm_categories(farm)
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded default categories for farm: {farm.name}'))
            except Farm.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Farm with id {farm_id} does not exist.'))
        else:
            farms = Farm.objects.all()
            for farm in farms:
                seed_farm_categories(farm)
            self.stdout.write(self.style.SUCCESS(f'Successfully seeded default categories for {farms.count()} farms.'))
