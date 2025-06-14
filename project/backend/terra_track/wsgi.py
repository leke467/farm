"""
WSGI config for terra_track project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')

application = get_wsgi_application()