from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    path('analytics/', views.dashboard_analytics_view, name='dashboard-analytics'),
    path('analytics/animals/', views.animals_analytics_view, name='animals-analytics'),
    path('analytics/crops/', views.crops_analytics_view, name='crops-analytics'),
    path('analytics/expenses/', views.expenses_analytics_view, name='expenses-analytics'),
    path('analytics/inventory/', views.inventory_analytics_view, name='inventory-analytics'),
    path('production/', views.production_report_view, name='production-report'),
]