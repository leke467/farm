from django.core.management.base import BaseCommand
from subscriptions.models import SubscriptionPlan
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seeds the database with monthly, yearly, and trial subscription plans'

    def handle(self, *args, **kwargs):
        plans = [
            {
                'name': 'Free Trial',
                'slug': 'free-trial',
                'price': 0,
                'original_price': 0,
                'billing_cycle': 'monthly',
                'duration_days': 14,
                'discount_badge': '14 Days Free',
                'features': [
                    "Full Access to All Features",
                    "Up to 2 Farm Locations",
                    "Up to 50 Animals / Batches",
                    "Up to 20 Crops",
                    "14-Day Free Access",
                ],
                'is_active': True,
                'is_popular': False,
                'trial_days': 14,
                'max_farms': 2,
                'max_animals': 50,
                'max_crops': 20,
            },
            {
                'name': 'Pro Monthly',
                'slug': 'pro-monthly',
                'price': 8000,
                'original_price': 10000,
                'billing_cycle': 'monthly',
                'duration_days': 30,
                'discount_badge': '₦2,000 OFF (20% OFF)',
                'features': [
                    "Unlimited Farm Locations",
                    "Unlimited Animal & Flock Tracking",
                    "Unlimited Crop Management",
                    "Full Sales & Profit Analytics",
                    "AI Agronomist Agent Insights",
                    "Priority Customer Support",
                ],
                'is_active': True,
                'is_popular': False,
                'trial_days': 14,
                'max_farms': 999,
                'max_animals': 99999,
                'max_crops': 99999,
            },
            {
                'name': 'Pro Yearly',
                'slug': 'pro-yearly',
                'price': 90000,
                'original_price': 120000,
                'billing_cycle': 'yearly',
                'duration_days': 365,
                'discount_badge': 'SAVE ₦30,000 (25% OFF)',
                'features': [
                    "Best Value — Equals ₦7,500 / month!",
                    "2 Months Absolutely FREE",
                    "Unlimited Farm Locations",
                    "Unlimited Animal & Flock Tracking",
                    "Unlimited Crop Management",
                    "Full Sales & Profit Analytics",
                    "AI Agronomist Agent Insights",
                    "VIP Priority 24/7 Support",
                ],
                'is_active': True,
                'is_popular': True,
                'trial_days': 14,
                'max_farms': 999,
                'max_animals': 99999,
                'max_crops': 99999,
            }
        ]

        # Deactivate old outdated plans if any
        SubscriptionPlan.objects.exclude(slug__in=[p['slug'] for p in plans]).update(is_active=False)

        for plan_data in plans:
            obj, created = SubscriptionPlan.objects.update_or_create(
                slug=plan_data['slug'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created plan: {obj.name}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Updated plan: {obj.name}"))

        self.stdout.write(self.style.SUCCESS("Successfully seeded subscription plans."))
