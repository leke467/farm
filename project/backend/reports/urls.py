from django.urls import path
from . import views, views_superadmin

urlpatterns = [
    path('', views.ReportListCreateView.as_view(), name='report-list-create'),
    path('<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    path('analytics/', views.dashboard_analytics_view, name='dashboard-analytics'),
    path('analytics/dashboard/', views.dashboard_analytics_view, name='dashboard-analytics-slash'),
    path('analytics/animals/', views.animals_analytics_view, name='animals-analytics'),
    path('analytics/crops/', views.crops_analytics_view, name='crops-analytics'),
    path('analytics/expenses/', views.expenses_analytics_view, name='expenses-analytics'),
    path('analytics/inventory/', views.inventory_analytics_view, name='inventory-analytics'),
    path('production/', views.production_report_view, name='production-report'),
    
    # Public Contact Endpoint
    path('contact/', views_superadmin.public_contact_view, name='public-contact'),
    
    # Superadmin Management Endpoints
    path('superadmin/stats/', views_superadmin.superadmin_stats_view, name='superadmin-stats'),
    path('superadmin/users/', views_superadmin.SuperadminUserListAPIView.as_view(), name='superadmin-user-list'),
    path('superadmin/users/<int:pk>/', views_superadmin.SuperadminUserDetailAPIView.as_view(), name='superadmin-user-detail'),
    path('superadmin/farms/', views_superadmin.SuperadminFarmListAPIView.as_view(), name='superadmin-farm-list'),
    path('superadmin/disputes/', views_superadmin.SuperadminDisputeListCreateAPIView.as_view(), name='superadmin-dispute-list-create'),
    path('superadmin/disputes/<int:pk>/', views_superadmin.SuperadminDisputeDetailAPIView.as_view(), name='superadmin-dispute-detail'),
    path('superadmin/contact-messages/', views_superadmin.SuperadminContactListAPIView.as_view(), name='superadmin-contact-list'),
    path('superadmin/contact-messages/<int:pk>/', views_superadmin.SuperadminContactDetailAPIView.as_view(), name='superadmin-contact-detail'),
    path('superadmin/subscriptions/', views_superadmin.SuperadminSubscriptionListView.as_view(), name='superadmin-subscription-list'),
    path('superadmin/payments/', views_superadmin.SuperadminPaymentListView.as_view(), name='superadmin-payment-list'),
    path('superadmin/subscriptions/manage/', views_superadmin.superadmin_manage_subscription, name='superadmin-manage-subscription'),
]