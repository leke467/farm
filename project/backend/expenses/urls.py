from django.urls import path
from . import views

urlpatterns = [
    path('', views.ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('<int:pk>/', views.ExpenseDetailView.as_view(), name='expense-detail'),
    path('budgets/', views.BudgetListCreateView.as_view(), name='budget-list-create'),
    path('budgets/<int:pk>/', views.BudgetDetailView.as_view(), name='budget-detail'),
    path('revenues/', views.RevenueListCreateView.as_view(), name='revenue-list-create'),
    path('revenues/<int:pk>/', views.RevenueDetailView.as_view(), name='revenue-detail'),
    path('financial-analysis/', views.FinancialAnalysisListCreateView.as_view(), name='financial-analysis-list-create'),
    path('financial-analysis/<int:pk>/', views.FinancialAnalysisDetailView.as_view(), name='financial-analysis-detail'),
    path('debts/', views.DebtManagementListCreateView.as_view(), name='debt-list-create'),
    path('debts/<int:pk>/', views.DebtManagementDetailView.as_view(), name='debt-detail'),
    path('summary/', views.expense_summary_view, name='expense-summary'),
]