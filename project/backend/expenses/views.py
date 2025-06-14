from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum
from datetime import datetime
from .models import Expense, Budget
from .serializers import ExpenseSerializer, BudgetSerializer

class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'payment_method']
    search_fields = ['description', 'vendor']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']
    
    def get_queryset(self):
        return Expense.objects.filter(farm__owner=self.request.user)

class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Expense.objects.filter(farm__owner=self.request.user)

class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Budget.objects.filter(farm__owner=self.request.user)

class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Budget.objects.filter(farm__owner=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expense_summary_view(request):
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    # Total expenses this year
    year_total = Expense.objects.filter(
        farm__owner=request.user,
        date__year=current_year
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Total expenses this month
    month_total = Expense.objects.filter(
        farm__owner=request.user,
        date__year=current_year,
        date__month=current_month
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Expenses by category this year
    category_breakdown = Expense.objects.filter(
        farm__owner=request.user,
        date__year=current_year
    ).values('category').annotate(total=Sum('amount')).order_by('-total')
    
    return Response({
        'year_total': year_total,
        'month_total': month_total,
        'category_breakdown': category_breakdown
    })