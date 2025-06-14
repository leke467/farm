from rest_framework import serializers
from .models import InventoryItem, InventoryTransaction

class InventoryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ['date']

class InventoryItemSerializer(serializers.ModelSerializer):
    transactions = InventoryTransactionSerializer(many=True, read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    total_value = serializers.ReadOnlyField()
    
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']