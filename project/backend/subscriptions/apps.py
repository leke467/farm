from django.apps import AppConfig

class SubscriptionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'subscriptions'

    def ready(self):
        try:
            from django.core.management import call_command
            from .models import SubscriptionPlan
            if not SubscriptionPlan.objects.filter(is_active=True).exists():
                call_command('seed_subscription_plans')
        except Exception:
            pass
