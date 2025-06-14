from django.urls import path
from . import views

urlpatterns = [
    path('', views.InventoryItemListCreateView.as_view(), name='inventory-list-create'),
    path('<int:pk>/', views.InventoryItemDetailView.as_view(), name='inventory-detail'),
    path('<int:item_id>/transactions/', views.InventoryTransactionListCreateView.as_view(), name='inventory-transactions'),
    path('low-stock/', views.low_stock_items_view, name='low-stock-items'),
]