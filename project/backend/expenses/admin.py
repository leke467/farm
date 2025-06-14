from django.contrib import admin
from .models import Expense, Budget

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