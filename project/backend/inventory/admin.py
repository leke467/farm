from django.contrib import admin
from .models import InventoryItem, InventoryTransaction

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'quantity', 'unit', 'min_quantity', 'is_low_stock', 'farm']
    list_filter = ['category', 'farm', 'purchase_date']
    search_fields = ['name', 'supplier', 'farm__name']
    
    def is_low_stock(self, obj):
        return obj.is_low_stock
    is_low_stock.boolean = True

@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ['item', 'transaction_type', 'quantity', 'date', 'reason']
    list_filter = ['transaction_type', 'date']
    search_fields = ['item__name', 'reason', 'reference']