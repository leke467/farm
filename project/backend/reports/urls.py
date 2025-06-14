from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    path('analytics/', views.dashboard_analytics_view, name='dashboard-analytics'),
    path('production/', views.production_report_view, name='production-report'),
]