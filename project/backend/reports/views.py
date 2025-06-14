from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from datetime import datetime, timedelta
from animals.models import Animal
from crops.models import Crop
from expenses.models import Expense
from inventory.models import InventoryItem
from .models import Report
from .serializers import ReportSerializer

class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Report.objects.filter(farm__owner=self.request.user)

class ReportDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Report.objects.filter(farm__owner=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_analytics_view(request):
    user = request.user
    
    # Animal statistics
    total_animals = Animal.objects.filter(farm__owner=user).aggregate(
        total=Sum('count')
    )['total'] or 0
    
    animal_types = Animal.objects.filter(farm__owner=user).values('animal_type').annotate(
        count=Sum('count')
    )
    
    healthy_animals = Animal.objects.filter(
        farm__owner=user, 
        status='healthy'
    ).aggregate(total=Sum('count'))['total'] or 0
    
    # Crop statistics
    total_crops = Crop.objects.filter(farm__owner=user).count()
    total_acreage = Crop.objects.filter(farm__owner=user).aggregate(
        total=Sum('area')
    )['total'] or 0
    
    crops_by_status = Crop.objects.filter(farm__owner=user).values('status').annotate(
        count=Count('id')
    )
    
    # Financial statistics
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    monthly_expenses = Expense.objects.filter(
        farm__owner=user,
        date__year=current_year,
        date__month=current_month
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    yearly_expenses = Expense.objects.filter(
        farm__owner=user,
        date__year=current_year
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    expenses_by_category = Expense.objects.filter(
        farm__owner=user,
        date__year=current_year
    ).values('category').annotate(total=Sum('amount')).order_by('-total')
    
    # Inventory statistics
    low_stock_items = InventoryItem.objects.filter(
        farm__owner=user,
        quantity__lte=models.F('min_quantity')
    ).count()
    
    total_inventory_value = InventoryItem.objects.filter(
        farm__owner=user
    ).aggregate(
        total=Sum(models.F('quantity') * models.F('cost_per_unit'))
    )['total'] or 0
    
    # Monthly expense trend (last 6 months)
    expense_trend = []
    for i in range(6):
        month_date = datetime.now() - timedelta(days=30*i)
        month_total = Expense.objects.filter(
            farm__owner=user,
            date__year=month_date.year,
            date__month=month_date.month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        expense_trend.append({
            'month': month_date.strftime('%b %Y'),
            'total': float(month_total)
        })
    
    expense_trend.reverse()
    
    return Response({
        'animals': {
            'total': total_animals,
            'healthy': healthy_animals,
            'by_type': list(animal_types),
        },
        'crops': {
            'total': total_crops,
            'total_acreage': float(total_acreage),
            'by_status': list(crops_by_status),
        },
        'finances': {
            'monthly_expenses': float(monthly_expenses),
            'yearly_expenses': float(yearly_expenses),
            'by_category': list(expenses_by_category),
            'expense_trend': expense_trend,
        },
        'inventory': {
            'low_stock_items': low_stock_items,
            'total_value': float(total_inventory_value),
        }
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def production_report_view(request):
    user = request.user
    year = request.GET.get('year', datetime.now().year)
    
    # Crop production data
    crops = Crop.objects.filter(
        farm__owner=user,
        planted_date__year=year
    )
    
    crop_data = []
    for crop in crops:
        total_harvest = crop.harvests.aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        crop_data.append({
            'name': crop.name,
            'area': float(crop.area),
            'harvest': float(total_harvest),
            'yield_per_acre': float(total_harvest / crop.area) if crop.area > 0 else 0,
            'status': crop.status
        })
    
    # Animal production data (simplified)
    animals = Animal.objects.filter(farm__owner=user)
    animal_data = []
    
    for animal in animals:
        if animal.is_group:
            animal_data.append({
                'name': animal.name,
                'type': animal.animal_type,
                'count': animal.count,
                'avg_weight': float(animal.avg_weight or 0),
                'status': animal.status
            })
        else:
            animal_data.append({
                'name': animal.name,
                'type': animal.animal_type,
                'count': 1,
                'weight': float(animal.weight or 0),
                'status': animal.status
            })
    
    return Response({
        'crops': crop_data,
        'animals': animal_data,
        'year': year
    })