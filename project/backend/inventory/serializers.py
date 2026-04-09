from rest_framework import serializers
from django.utils import timezone
from .models import (InventoryItem, InventoryTransaction, StockMovement, 
                     InventoryAudit, AuditLineItem, InventoryCostTracking,
                     DemandForecast, SupplierPerformance)
from terra_track.validators import InventoryValidator, NumberValidator

class InventoryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ['date']
    
    def validate_quantity(self, value):
        """Quantity must be positive"""
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value

class InventoryItemSerializer(serializers.ModelSerializer):
    transactions = InventoryTransactionSerializer(many=True, read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    total_value = serializers.ReadOnlyField()
    
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_quantity(self, value):
        """Quantity must be non-negative"""
        InventoryValidator.validate_inventory_quantity(value)
        return value
    
    def validate_min_quantity(self, value):
        """Min quantity must be non-negative"""
        if value is not None and float(value) < 0:
            raise serializers.ValidationError("Minimum quantity cannot be negative")
        return value
    
    def validate_cost_per_unit(self, value):
        """Cost per unit must be non-negative"""
        InventoryValidator.validate_cost_per_unit(value)
        return value
    
    def validate_expiry_date(self, value):
        """Expiry date must be valid"""
        if value and value <= timezone.now().date():
            raise serializers.ValidationError("Expiry date must be in the future")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        quantity = data.get('quantity')
        min_quantity = data.get('min_quantity')
        expiry_date = data.get('expiry_date')
        purchase_date = data.get('purchase_date')
        
        # Check min quantity <= current quantity
        if min_quantity is not None and quantity is not None:
            if float(min_quantity) > float(quantity):
                raise serializers.ValidationError({
                    "min_quantity": "Minimum quantity cannot be greater than current quantity"
                })
        
        # Check expiry > purchase date
        if expiry_date and purchase_date:
            InventoryValidator.validate_expiry_date(expiry_date, purchase_date)
        
        return data

class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_quantity(self, value):
        """Quantity must be positive"""
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value

class InventoryCostTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryCostTracking
        fields = '__all__'
        read_only_fields = ['updated_at']

class AuditLineItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    
    class Meta:
        model = AuditLineItem
        fields = '__all__'
    
    def validate(self, data):
        """Cross-field validation"""
        expected = data.get('expected_quantity')
        counted = data.get('counted_quantity')
        
        if expected is not None and counted is not None:
            data['variance'] = float(counted) - float(expected)
        
        return data

class InventoryAuditSerializer(serializers.ModelSerializer):
    line_items = AuditLineItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = InventoryAudit
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class InventoryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ['date', 'created_at']
    
    def validate_quantity(self, value):
        """Quantity must be positive"""
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value
    
    def validate_cost_per_unit(self, value):
        """Cost per unit must be non-negative"""
        if value is not None and float(value) < 0:
            raise serializers.ValidationError("Cost cannot be negative")
        return value
    
    def validate(self, data):
        """Cross-field validation and cost calculation"""
        quantity = data.get('quantity')
        cost_per_unit = data.get('cost_per_unit')
        
        # Calculate total cost if both are provided
        if quantity and cost_per_unit:
            data['total_cost'] = float(quantity) * float(cost_per_unit)
        
        return data

class InventoryItemDetailedSerializer(serializers.ModelSerializer):
    """Detailed inventory item with all related data"""
    transactions = InventoryTransactionSerializer(many=True, read_only=True)
    movements = StockMovementSerializer(many=True, read_only=True)
    cost_tracking = InventoryCostTrackingSerializer(read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    total_value = serializers.ReadOnlyField()
    
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_quantity(self, value):
        """Quantity must be non-negative"""
        InventoryValidator.validate_inventory_quantity(value)
        return value
    
    def validate_min_quantity(self, value):
        """Min quantity must be non-negative"""
        if value is not None and float(value) < 0:
            raise serializers.ValidationError("Minimum quantity cannot be negative")
        return value
    
    def validate_cost_per_unit(self, value):
        """Cost per unit must be non-negative"""
        InventoryValidator.validate_cost_per_unit(value)
        return value
    
    def validate_expiry_date(self, value):
        """Expiry date must be valid"""
        if value and value <= timezone.now().date():
            raise serializers.ValidationError("Expiry date must be in the future")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        quantity = data.get('quantity')
        min_quantity = data.get('min_quantity')
        expiry_date = data.get('expiry_date')
        purchase_date = data.get('purchase_date')
        
        # Check min quantity <= current quantity
        if min_quantity is not None and quantity is not None:
            if float(min_quantity) > float(quantity):
                raise serializers.ValidationError({
                    "min_quantity": "Minimum quantity cannot be greater than current quantity"
                })
        
        # Check expiry > purchase date
        if expiry_date and purchase_date:
            InventoryValidator.validate_expiry_date(expiry_date, purchase_date)
        
        return data


class DemandForecastSerializer(serializers.ModelSerializer):
    """Serializer for demand forecasting data"""
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_category = serializers.CharField(source='item.category', read_only=True)
    
    class Meta:
        model = DemandForecast
        fields = [
            'id', 'item', 'item_name', 'item_category', 'farm',
            'avg_monthly_usage', 'max_monthly_usage', 'min_monthly_usage',
            'usage_trend', 'seasonality_factor',
            'forecasted_monthly_demand', 'optimal_reorder_point', 
            'optimal_order_quantity', 'safety_stock',
            'forecast_accuracy', 'data_points', 'last_updated'
        ]
        read_only_fields = ['last_updated', 'item_name', 'item_category']


class SupplierPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for supplier performance tracking"""
    supplier_performance_summary = serializers.SerializerMethodField()
    item_name = serializers.CharField(source='item.name', read_only=True)
    
    class Meta:
        model = SupplierPerformance
        fields = [
            'id', 'farm', 'supplier_name', 'item', 'item_name',
            'avg_unit_price', 'lowest_unit_price', 'highest_unit_price',
            'last_purchase_price', 'last_purchase_date',
            'on_time_delivery_rate', 'quality_rating', 'reliability_grade',
            'total_orders', 'contact_person', 'phone', 'email', 'notes',
            'supplier_performance_summary', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'item_name', 'supplier_performance_summary']
    
    def get_supplier_performance_summary(self, obj):
        """Generate performance summary"""
        return {
            'reliability': obj.reliability_grade,
            'quality': f"{obj.quality_rating}/10",
            'on_time_rate': f"{obj.on_time_delivery_rate}%",
            'price_trend': 'stable' if obj.avg_unit_price == obj.last_purchase_price else 'increasing' if obj.last_purchase_price > obj.avg_unit_price else 'decreasing',
            'recommendation': 'excellent' if obj.reliability_grade == 'excellent' and obj.quality_rating >= 8 else 'good' if obj.reliability_grade in ['good', 'excellent'] else 'needs_review'
        }