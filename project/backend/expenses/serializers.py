from rest_framework import serializers
from django.utils import timezone
from .models import Expense, Budget, Revenue, FinancialAnalysis, DebtManagement
from terra_track.validators import ExpenseValidator, NumberValidator

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_amount(self, value):
        """Amount must be positive"""
        ExpenseValidator.validate_expense_amount(value)
        return value
    
    def validate_date(self, value):
        """Date cannot be in future"""
        ExpenseValidator.validate_expense_date(value)
        return value
    
    def validate_payment_method(self, value):
        """Payment method must be valid"""
        valid_methods = ['cash', 'credit_card', 'bank_transfer', 'check']
        if value not in valid_methods:
            raise serializers.ValidationError(f"Payment method must be one of: {', '.join(valid_methods)}")
        return value

class BudgetSerializer(serializers.ModelSerializer):
    actual_amount = serializers.ReadOnlyField()
    variance = serializers.ReadOnlyField()
    variance_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_budgeted_amount(self, value):
        """Budgeted amount must be positive"""
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError("Budgeted amount must be greater than 0")
        return value
    
    def validate_year(self, value):
        """Year must be valid"""
        current_year = timezone.now().year
        if value < 1900 or value > current_year + 10:
            raise serializers.ValidationError(f"Year must be between 1900 and {current_year + 10}")
        return value
    
    def validate_month(self, value):
        """Month must be 1-12 or null for yearly"""
        if value is not None and (value < 1 or value > 12):
            raise serializers.ValidationError("Month must be between 1 and 12 or null for yearly budget")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        if data.get('month') and not data.get('year'):
            raise serializers.ValidationError({
                "year": "Year is required when specifying a month"
            })
        return data


class RevenueSerializer(serializers.ModelSerializer):
    """Serializer for farm revenue tracking"""
    class Meta:
        model = Revenue
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_total_amount(self, value):
        """Total amount must be positive"""
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError("Total amount must be greater than 0")
        return value
    
    def validate_unit_price(self, value):
        """Unit price must be positive"""
        if value is not None and float(value) <= 0:
            raise serializers.ValidationError("Unit price must be greater than 0")
        return value


class FinancialAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for financial analysis and summaries"""
    class Meta:
        model = FinancialAnalysis
        fields = '__all__'
        read_only_fields = ['last_updated']
    
    def validate(self, data):
        """Validate period information is complete"""
        if data.get('period_type') == 'month' and not data.get('month'):
            raise serializers.ValidationError({'month': 'Month is required for monthly period'})
        if data.get('period_type') == 'quarter' and not data.get('quarter'):
            raise serializers.ValidationError({'quarter': 'Quarter is required for quarterly period'})
        return data


class DebtManagementSerializer(serializers.ModelSerializer):
    """Serializer for debt and loan tracking"""
    months_remaining = serializers.SerializerMethodField()
    payment_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = DebtManagement
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_months_remaining(self, obj):
        """Calculate months remaining until due date"""
        from datetime import datetime
        months = (obj.due_date.year - datetime.now().year) * 12 + (obj.due_date.month - datetime.now().month)
        return max(0, months)
    
    def get_payment_progress(self, obj):
        """Calculate payment progress percentage"""
        if obj.number_of_payments and obj.number_of_payments > 0:
            return round((obj.payments_completed / obj.number_of_payments) * 100, 2)
        return 0