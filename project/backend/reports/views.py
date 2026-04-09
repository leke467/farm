from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q, F
from datetime import datetime, timedelta
from animals.models import Animal
from crops.models import Crop
from expenses.models import Expense
from inventory.models import InventoryItem
from farms.models import Farm
from .models import Report
from .serializers import ReportSerializer

class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return Report.objects.filter(farm__in=user_farms)

class ReportDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return Report.objects.filter(farm__in=user_farms)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_analytics_view(request):
    user = request.user
    
    # Get user's farms (owned or member of)
    user_farms = Farm.objects.filter(
        Q(owner=user) | Q(members__user=user)
    ).distinct()
    
    # Animal statistics
    total_animals = Animal.objects.filter(farm__in=user_farms).aggregate(
        total=Sum('count')
    )['total'] or 0
    
    animal_types = Animal.objects.filter(farm__in=user_farms).values('animal_type').annotate(
        count=Sum('count')
    )
    
    healthy_animals = Animal.objects.filter(
        farm__in=user_farms, 
        status='healthy'
    ).aggregate(total=Sum('count'))['total'] or 0
    
    # Crop statistics
    total_crops = Crop.objects.filter(farm__in=user_farms).count()
    total_acreage = Crop.objects.filter(farm__in=user_farms).aggregate(
        total=Sum('area')
    )['total'] or 0
    
    crops_by_status = Crop.objects.filter(farm__in=user_farms).values('status').annotate(
        count=Count('id')
    )
    
    # Financial statistics
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    monthly_expenses = Expense.objects.filter(
        farm__in=user_farms,
        date__year=current_year,
        date__month=current_month
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    yearly_expenses = Expense.objects.filter(
        farm__in=user_farms,
        date__year=current_year
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    expenses_by_category = Expense.objects.filter(
        farm__in=user_farms,
        date__year=current_year
    ).values('category').annotate(total=Sum('amount')).order_by('-total')
    
    # Inventory statistics
    low_stock_items = InventoryItem.objects.filter(
        farm__in=user_farms,
        quantity__lte=F('min_quantity')
    ).count()
    
    total_inventory_value = InventoryItem.objects.filter(
        farm__in=user_farms
    ).aggregate(
        total=Sum(F('quantity') * F('cost_per_unit'))
    )['total'] or 0
    
    # Monthly expense trend (last 6 months)
    expense_trend = []
    for i in range(6):
        month_date = datetime.now() - timedelta(days=30*i)
        month_total = Expense.objects.filter(
            farm__in=user_farms,
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
    
    # Get user's farms (owned or member of)
    user_farms = Farm.objects.filter(
        Q(owner=user) | Q(members__user=user)
    ).distinct()
    
    # Crop production data
    crops = Crop.objects.filter(
        farm__in=user_farms,
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
    animals = Animal.objects.filter(farm__in=user_farms)
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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def animals_analytics_view(request):
    """Detailed animal analytics"""
    user = request.user
    
    user_farms = Farm.objects.filter(
        Q(owner=user) | Q(members__user=user)
    ).distinct()
    
    animals = Animal.objects.filter(farm__in=user_farms)
    
    # By type breakdown
    by_type = animals.values('animal_type').annotate(
        count=Sum('count'),
        healthy=Sum('count', filter=Q(status='healthy')),
        sick=Sum('count', filter=Q(status='sick')),
        injured=Sum('count', filter=Q(status='injured')),
        avg_weight=Avg('weight')
    ).order_by('-count')
    
    # By status breakdown
    by_status = animals.values('status').annotate(
        count=Sum('count')
    ).order_by('-count')
    
    # Health metrics
    total_animals = animals.aggregate(total=Sum('count'))['total'] or 0
    healthy_count = animals.filter(status='healthy').aggregate(total=Sum('count'))['total'] or 0
    sick_count = animals.filter(status='sick').aggregate(total=Sum('count'))['total'] or 0
    injured_count = animals.filter(status='injured').aggregate(total=Sum('count'))['total'] or 0
    
    return Response({
        'summary': {
            'total_animals': total_animals,
            'healthy': healthy_count,
            'sick': sick_count,
            'injured': injured_count,
            'health_percentage': round((healthy_count / total_animals * 100), 2) if total_animals > 0 else 0
        },
        'by_type': list(by_type),
        'by_status': list(by_status)
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def crops_analytics_view(request):
    """Detailed crop analytics"""
    user = request.user
    
    user_farms = Farm.objects.filter(
        Q(owner=user) | Q(members__user=user)
    ).distinct()
    
    crops = Crop.objects.filter(farm__in=user_farms)
    
    # By status breakdown
    by_status = crops.values('status').annotate(
        count=Count('id'),
        total_area=Sum('area')
    ).order_by('-count')
    
    # By stage breakdown
    by_stage = crops.values('stage').annotate(
        count=Count('id'),
        total_area=Sum('area')
    ).order_by('-count')
    
    # Area metrics
    total_crops = crops.count()
    total_area = crops.aggregate(total=Sum('area'))['total'] or 0
    avg_area = crops.aggregate(avg=Avg('area'))['avg'] or 0
    
    # Upcoming harvests
    upcoming_harvests = crops.filter(
        status__in=['growing', 'harvesting'],
        expected_harvest_date__gte=datetime.now().date()
    ).order_by('expected_harvest_date')[:5].values(
        'name', 'expected_harvest_date', 'area', 'stage'
    )
    
    return Response({
        'summary': {
            'total_crops': total_crops,
            'total_area': float(total_area),
            'average_area': float(avg_area)
        },
        'by_status': list(by_status),
        'by_stage': list(by_stage),
        'upcoming_harvests': list(upcoming_harvests)
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expenses_analytics_view(request):
    """Detailed expense analytics"""
    user = request.user
    year = request.GET.get('year', datetime.now().year)
    month = request.GET.get('month')
    
    user_farms = Farm.objects.filter(
        Q(owner=user) | Q(members__user=user)
    ).distinct()
    
    expenses_qs = Expense.objects.filter(
        farm__in=user_farms,
        date__year=year
    )
    
    if month:
        expenses_qs = expenses_qs.filter(date__month=month)
    
    # By category breakdown
    by_category = expenses_qs.values('category').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')
    
    # By payment method
    by_method = expenses_qs.values('payment_method').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')
    
    # Monthly breakdown for the year
    monthly_data = []
    for m in range(1, 13):
        month_total = Expense.objects.filter(
            farm__in=user_farms,
            date__year=year,
            date__month=m
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        monthly_data.append({
            'month': m,
            'total': float(month_total)
        })
    
    # Totals
    total_expenses = expenses_qs.aggregate(total=Sum('amount'))['total'] or 0
    
    return Response({
        'summary': {
            'total_expenses': float(total_expenses),
            'expense_count': expenses_qs.count(),
            'average_expense': float(total_expenses / expenses_qs.count()) if expenses_qs.count() > 0 else 0,
            'year': year,
            'month': month
        },
        'by_category': list(by_category),
        'by_payment_method': list(by_method),
        'monthly_trend': monthly_data
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def inventory_analytics_view(request):
    """Detailed inventory analytics"""
    user = request.user
    
    user_farms = Farm.objects.filter(
        Q(owner=user) | Q(members__user=user)
    ).distinct()
    
    inventory_items = InventoryItem.objects.filter(farm__in=user_farms)
    
    # By category
    by_category = inventory_items.values('category').annotate(
        count=Count('id'),
        total_quantity=Sum('quantity'),
        total_value=Sum(F('quantity') * F('cost_per_unit'))
    ).order_by('-total_value')
    
    # Low stock items
    low_stock = inventory_items.filter(
        quantity__lte=F('min_quantity')
    ).values(
        'name', 'quantity', 'min_quantity', 'unit', 'category'
    ).order_by('quantity')
    
    # Expiring soon (30 days)
    expiry_threshold = datetime.now().date() + timedelta(days=30)
    expiring_soon = inventory_items.filter(
        expiry_date__lte=expiry_threshold,
        expiry_date__isnull=False
    ).values(
        'name', 'expiry_date', 'quantity', 'unit'
    ).order_by('expiry_date')
    
    # Totals
    total_items = inventory_items.count()
    total_value = inventory_items.aggregate(
        total=Sum(F('quantity') * F('cost_per_unit'))
    )['total'] or 0
    low_stock_count = inventory_items.filter(
        quantity__lte=F('min_quantity')
    ).count()
    
    return Response({
        'summary': {
            'total_items': total_items,
            'total_value': float(total_value),
            'low_stock_items': low_stock_count,
            'expiring_soon': expiring_soon.count()
        },
        'by_category': list(by_category),
        'low_stock': list(low_stock),
        'expiring_soon': list(expiring_soon)
    })