#!/usr/bin/env python3
"""
Setup script for Terra Track Django Backend
"""

import os
import sys
import subprocess

def run_command(command):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {command}")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"✗ {command}")
        print(f"Error: {e.stderr}")
        return None

def main():
    print("Setting up Terra Track Django Backend...")
    
    # Check if we're in a virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("Warning: You're not in a virtual environment. It's recommended to use one.")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Install requirements
    print("\n1. Installing Python dependencies...")
    run_command("pip install -r requirements.txt")
    
    # Create .env file if it doesn't exist
    if not os.path.exists('.env'):
        print("\n2. Creating .env file...")
        run_command("cp .env.example .env")
        print("Please edit .env file with your configuration")
    
    # Run migrations
    print("\n3. Running database migrations...")
    run_command("python manage.py makemigrations")
    run_command("python manage.py migrate")
    
    # Create superuser
    print("\n4. Creating superuser...")
    print("You'll be prompted to create an admin user:")
    run_command("python manage.py createsuperuser")
    
    # Collect static files
    print("\n5. Collecting static files...")
    run_command("python manage.py collectstatic --noinput")
    
    print("\n✓ Setup complete!")
    print("\nTo start the development server, run:")
    print("python manage.py runserver")
    print("\nAdmin interface will be available at: http://127.0.0.1:8000/admin/")
    print("API endpoints will be available at: http://127.0.0.1:8000/api/")

if __name__ == "__main__":
    main()