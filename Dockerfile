FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY project/backend /app

EXPOSE 8000

CMD ["sh", "-c", "(python fix_migration_history.py || true) && python manage.py migrate --noinput && (python create_superuser.py || true) && (python seed_demo_account.py || true) && (python cleanup_real_user_farms.py || true) && gunicorn terra_track.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 4 --timeout 120"]
