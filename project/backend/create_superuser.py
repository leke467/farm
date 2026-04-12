import os
import django
from django.core.management import BaseCommand

def create_superuser():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')
    django.setup()

    from django.contrib.auth import get_user_model
    User = get_user_model()

    username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
    email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@terra-track.com')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'admin123')

    if not User.objects.filter(username=username).exists():
        print(f"Creating superuser: {username}")
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name="Default",
            last_name="Admin"
        )
        print("Superuser created successfully.")
    else:
        print(f"Superuser '{username}' already exists. Skipping creation.")

if __name__ == "__main__":
    create_superuser()
