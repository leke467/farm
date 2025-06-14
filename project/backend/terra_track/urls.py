"""terra_track URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/farms/', include('farms.urls')),
    path('api/animals/', include('animals.urls')),
    path('api/crops/', include('crops.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/expenses/', include('expenses.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)