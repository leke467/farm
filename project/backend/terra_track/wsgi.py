"""
WSGI config for terra_track project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')

print("--- [DIAGNOSTIC] WSGI APPLICATION INITIALIZING ---")
application = get_wsgi_application()
print("--- [DIAGNOSTIC] WSGI APPLICATION READY ---")