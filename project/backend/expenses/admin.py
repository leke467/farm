from django.contrib import admin
from .models import Expense, Budget, Revenue, FinancialAnalysis, DebtManagement

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'category', 'amount', 'vendor', 'date', 'farm']
    list_filter = ['category', 'payment_method', 'date', 'farm']
    search_fields = ['description', 'vendor', 'farm__name']

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['farm', 'category', 'year', 'month', 'budgeted_amount', 'actual_amount', 'variance']
    list_filter = ['category', 'year', 'month', 'farm']
    search_fields = ['farm__name']

@admin.register(Revenue)
class RevenueAdmin(admin.ModelAdmin):
    list_display = ['item_sold', 'source', 'quantity', 'unit_price', 'total_amount', 'date', 'farm']
    list_filter = ['source', 'quality_grade', 'date', 'farm']
    search_fields = ['item_sold', 'buyer', 'farm__name']
    fieldsets = (
        ('Farm & Date', {'fields': ('farm', 'date')}),
        ('Revenue Source', {'fields': ('source', 'item_sold', 'buyer')}),
        ('Quantity & Pricing', {'fields': ('quantity', 'unit', 'unit_price', 'total_amount')}),
        ('Quality', {'fields': ('quality_grade',)}),
        ('Notes', {'fields': ('notes',)}),
    )

@admin.register(FinancialAnalysis)
class FinancialAnalysisAdmin(admin.ModelAdmin):
    list_display = ['farm', 'year', 'month', 'total_revenue', 'total_expenses', 'net_profit', 'profit_margin']
    list_filter = ['farm', 'year', 'month', 'period_type']
    search_fields = ['farm__name']
    readonly_fields = ['last_updated']
    fieldsets = (
        ('Period Information', {'fields': ('farm', 'period_type', 'year', 'month', 'quarter')}),
        ('Revenue Breakdown', {'fields': ('total_revenue', 'animal_product_revenue', 'crop_revenue', 'other_revenue')}),
        ('Expense Breakdown', {'fields': ('total_expenses', 'feed_costs', 'labor_costs', 'equipment_costs', 'other_costs')}),
        ('Profitability', {'fields': ('gross_profit', 'net_profit', 'profit_margin', 'roi')}),
        ('Trends', {'fields': ('profit_trend', 'expense_trend')}),
        ('Budget Analysis', {'fields': ('budgeted_total', 'budget_variance', 'budget_variance_percentage')}),
        ('Summary', {'fields': ('notes', 'last_updated')}),
    )

@admin.register(DebtManagement)
class DebtManagementAdmin(admin.ModelAdmin):
    list_display = ['farm', 'lender', 'loan_amount', 'remaining_balance', 'status', 'due_date', 'interest_rate']
    list_filter = ['farm', 'status', 'due_date', 'payment_frequency']
    search_fields = ['farm__name', 'lender']
    fieldsets = (
        ('Loan Information', {'fields': ('farm', 'lender', 'loan_amount', 'disbursement_date', 'due_date', 'interest_rate')}),
        ('Payment Details', {'fields': ('payment_frequency', 'number_of_payments', 'payments_completed', 'total_paid', 'remaining_balance')}),
        ('Next Payment', {'fields': ('next_payment_date', 'next_payment_amount')}),
        ('Status', {'fields': ('status',)}),
        ('Notes', {'fields': ('notes',)}),
    )