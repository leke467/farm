from django.contrib import admin
from .models import (InventoryItem, InventoryTransaction, StockMovement, 
                     InventoryAudit, AuditLineItem, InventoryCostTracking,
                     DemandForecast, SupplierPerformance)

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
    list_display = ['item', 'transaction_type', 'quantity', 'transaction_date', 'status', 'reason']
    list_filter = ['transaction_type', 'status', 'transaction_date']
    search_fields = ['item__name', 'reason', 'reference']

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['item', 'movement_type', 'quantity', 'batch_number', 'movement_date']
    list_filter = ['movement_type', 'movement_date']
    search_fields = ['item__name', 'batch_number', 'source_location', 'destination_location']

@admin.register(InventoryAudit)
class InventoryAuditAdmin(admin.ModelAdmin):
    list_display = ['farm', 'audit_date', 'status', 'created_by']
    list_filter = ['status', 'audit_date', 'farm']
    search_fields = ['farm__name', 'created_by']

@admin.register(AuditLineItem)
class AuditLineItemAdmin(admin.ModelAdmin):
    list_display = ['audit', 'item', 'expected_quantity', 'counted_quantity', 'variance']
    list_filter = ['audit__audit_date']
    search_fields = ['item__name', 'audit__farm__name']

@admin.register(InventoryCostTracking)
class InventoryCostTrackingAdmin(admin.ModelAdmin):
    list_display = ['item', 'cost_method', 'total_units_purchased', 'weighted_avg_cost']
    list_filter = ['cost_method']
    search_fields = ['item__name']
    readonly_fields = ['updated_at']

@admin.register(DemandForecast)
class DemandForecastAdmin(admin.ModelAdmin):
    list_display = ['item', 'farm', 'avg_monthly_usage', 'forecasted_monthly_demand', 'usage_trend', 'forecast_accuracy']
    list_filter = ['farm', 'usage_trend', 'last_updated']
    search_fields = ['item__name', 'farm__name']
    readonly_fields = ['last_updated']
    fieldsets = (
        ('Item Information', {'fields': ('item', 'farm')}),
        ('Historical Metrics', {'fields': ('avg_monthly_usage', 'max_monthly_usage', 'min_monthly_usage', 'usage_trend', 'seasonality_factor')}),
        ('Forecasts', {'fields': ('forecasted_monthly_demand', 'optimal_reorder_point', 'optimal_order_quantity', 'safety_stock')}),
        ('Performance', {'fields': ('forecast_accuracy', 'data_points', 'last_updated')}),
    )

@admin.register(SupplierPerformance)
class SupplierPerformanceAdmin(admin.ModelAdmin):
    list_display = ['supplier_name', 'item', 'farm', 'avg_unit_price', 'on_time_delivery_rate', 'quality_rating', 'reliability_grade']
    list_filter = ['farm', 'reliability_grade', 'last_purchase_date']
    search_fields = ['supplier_name', 'item__name', 'farm__name', 'email']
    fieldsets = (
        ('Supplier Information', {'fields': ('farm', 'supplier_name', 'item', 'contact_person', 'phone', 'email')}),
        ('Pricing', {'fields': ('avg_unit_price', 'lowest_unit_price', 'highest_unit_price', 'last_purchase_price', 'last_purchase_date')}),
        ('Reliability', {'fields': ('on_time_delivery_rate', 'quality_rating', 'reliability_grade', 'total_orders')}),
        ('Notes', {'fields': ('notes',)}),
    )