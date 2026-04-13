#!/bin/sh
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Creating superuser (if not exists)..."
python create_superuser.py

echo "Starting Gunicorn..."
exec gunicorn terra_track.wsgi --bind 0.0.0.0:$PORT
