from django.urls import path
from . import views

urlpatterns = [
    # Inventory Items
    path('', views.InventoryItemListCreateView.as_view(), name='inventory-list-create'),
    path('<int:pk>/', views.InventoryItemDetailView.as_view(), name='inventory-detail'),
    
    # Inventory Transactions
    path('transactions/', views.InventoryTransactionListCreateView.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', views.InventoryTransactionDetailView.as_view(), name='transaction-detail'),
    
    # Stock Movements
    path('movements/', views.StockMovementListCreateView.as_view(), name='movement-list-create'),
    
    # Inventory Audits
    path('audits/', views.InventoryAuditListCreateView.as_view(), name='audit-list-create'),
    path('audits/<int:pk>/', views.InventoryAuditDetailView.as_view(), name='audit-detail'),
    
    # Demand Forecasting (Phase 2)
    path('forecasts/', views.DemandForecastListView.as_view(), name='forecast-list'),
    path('forecasts/<int:pk>/', views.DemandForecastDetailView.as_view(), name='forecast-detail'),
    path('forecasts/optimization/', views.forecast_optimization_view, name='forecast-optimization'),
    
    # Supplier Performance (Phase 2)
    path('suppliers/', views.SupplierPerformanceListCreateView.as_view(), name='supplier-list-create'),
    path('suppliers/<int:pk>/', views.SupplierPerformanceDetailView.as_view(), name='supplier-detail'),
    path('suppliers/comparison/', views.supplier_comparison_view, name='supplier-comparison'),
    
    # Dashboard and utilities
    path('low-stock/', views.low_stock_items_view, name='low-stock-items'),
    path('dashboard/', views.inventory_dashboard_view, name='inventory-dashboard'),
]