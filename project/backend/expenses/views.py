from rest_framework import generics, permissions, status
from farms.permissions import FarmMenuPermission
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
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'expenses'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'payment_method']
    search_fields = ['description', 'vendor']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        queryset = Expense.objects.filter(farm__in=user_farms)
        farm_param = self.request.query_params.get('farm') or self.request.query_params.get('farm_id')
        if farm_param:
            try:
                queryset = queryset.filter(farm_id=farm_param)
            except ValueError:
                pass
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("=== EXPENSE VALIDATION ERROR ===", serializer.errors, "payload:", request.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        farm_id = self.request.data.get('farm') or self.request.query_params.get('farm')
        farm = None
        if farm_id:
            try:
                farm = Farm.objects.get(pk=farm_id)
            except (Farm.DoesNotExist, ValueError):
                pass
        if not farm:
            farm = Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            ).first()
        serializer.save(farm=farm)

class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'expenses'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Expense.objects.none()
        return Expense.objects.filter(farm__in=user_farms)

class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'expenses'
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return Budget.objects.filter(farm__in=user_farms)

class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, FarmMenuPermission]
    farm_menu_key = 'expenses'
    
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
        farm_param = self.request.query_params.get('farm') or self.request.query_params.get('farm_id')
        if farm_param:
            try:
                user_farms = user_farms.filter(pk=farm_param)
            except ValueError:
                pass
        for f in user_farms:
            from farms.analytics_generator import ensure_analytics_data_for_farm
            ensure_analytics_data_for_farm(f)
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
        farm_param = self.request.query_params.get('farm') or self.request.query_params.get('farm_id')
        if farm_param:
            try:
                user_farms = user_farms.filter(pk=farm_param)
            except ValueError:
                pass
        for f in user_farms:
            from farms.analytics_generator import ensure_analytics_data_for_farm
            ensure_analytics_data_for_farm(f)
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
        farm_param = self.request.query_params.get('farm') or self.request.query_params.get('farm_id')
        if farm_param:
            try:
                user_farms = user_farms.filter(pk=farm_param)
            except ValueError:
                pass
        for f in user_farms:
            from farms.analytics_generator import ensure_analytics_data_for_farm
            ensure_analytics_data_for_farm(f)
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