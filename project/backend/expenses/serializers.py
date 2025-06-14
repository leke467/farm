from rest_framework import serializers
from .models import Expense, Budget

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class BudgetSerializer(serializers.ModelSerializer):
    actual_amount = serializers.ReadOnlyField()
    variance = serializers.ReadOnlyField()
    variance_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']