from django.urls import path
from . import views

urlpatterns = [
    path('', views.ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('<int:pk>/', views.ExpenseDetailView.as_view(), name='expense-detail'),
    path('budgets/', views.BudgetListCreateView.as_view(), name='budget-list-create'),
    path('budgets/<int:pk>/', views.BudgetDetailView.as_view(), name='budget-detail'),
    path('summary/', views.expense_summary_view, name='expense-summary'),
]