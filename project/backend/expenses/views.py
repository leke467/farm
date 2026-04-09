from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Q
from datetime import datetime
from .models import Expense, Budget, Revenue, FinancialAnalysis, DebtManagement
from .serializers import ExpenseSerializer, BudgetSerializer, RevenueSerializer, FinancialAnalysisSerializer, DebtManagementSerializer
from farms.models import Farm

class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'payment_method']
    search_fields = ['description', 'vendor']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Expense.objects.none()
        return Expense.objects.filter(farm__in=user_farms)

class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Expense.objects.none()
        return Expense.objects.filter(farm__in=user_farms)

class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return Budget.objects.filter(farm__in=user_farms)

class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return Budget.objects.filter(farm__in=user_farms)

class RevenueListCreateView(generics.ListCreateAPIView):
    serializer_class = RevenueSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['source', 'quality_grade']
    search_fields = ['item_sold', 'buyer']
    ordering_fields = ['date', 'total_amount', 'unit_price']
    ordering = ['-date']

    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return Revenue.objects.filter(farm__in=user_farms)

class RevenueDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RevenueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return Revenue.objects.filter(farm__in=user_farms)

class FinancialAnalysisListCreateView(generics.ListCreateAPIView):
    serializer_class = FinancialAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['period_type', 'year', 'quarter']
    search_fields = ['farm__name']
    ordering_fields = ['year', 'month', 'total_revenue', 'net_profit']
    ordering = ['-year', '-month']

    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return FinancialAnalysis.objects.filter(farm__in=user_farms)

class FinancialAnalysisDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FinancialAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return FinancialAnalysis.objects.filter(farm__in=user_farms)

class DebtManagementListCreateView(generics.ListCreateAPIView):
    serializer_class = DebtManagementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_frequency']
    search_fields = ['lender']
    ordering_fields = ['due_date', 'loan_amount', 'remaining_balance']
    ordering = ['-due_date']

    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return DebtManagement.objects.filter(farm__in=user_farms)

class DebtManagementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DebtManagementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return DebtManagement.objects.filter(farm__in=user_farms)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expense_summary_view(request):
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    user_farms = Farm.objects.filter(
        Q(owner=request.user) | Q(members__user=request.user)
    ).distinct()
    
    # Total expenses this year
    year_total = Expense.objects.filter(
        farm__in=user_farms,
        date__year=current_year
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Total expenses this month
    month_total = Expense.objects.filter(
        farm__in=user_farms,
        date__year=current_year,
        date__month=current_month
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Expenses by category this year
    category_breakdown = Expense.objects.filter(
        farm__in=user_farms,
        date__year=current_year
    ).values('category').annotate(total=Sum('amount')).order_by('-total')
    
    return Response({
        'year_total': year_total,
        'month_total': month_total,
        'category_breakdown': category_breakdown
    })