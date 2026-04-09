from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q, F
from .models import (InventoryItem, InventoryTransaction, StockMovement, 
                     InventoryAudit, AuditLineItem, InventoryCostTracking,
                     DemandForecast, SupplierPerformance)
from .serializers import (InventoryItemDetailedSerializer, InventoryTransactionSerializer, 
                          StockMovementSerializer, InventoryAuditSerializer, 
                          AuditLineItemSerializer, InventoryCostTrackingSerializer,
                          DemandForecastSerializer, SupplierPerformanceSerializer)
from farms.models import Farm

class InventoryItemListCreateView(generics.ListCreateAPIView):
    serializer_class = InventoryItemDetailedSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'supplier', 'location']
    ordering_fields = ['name', 'quantity', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return InventoryItem.objects.none()
        return InventoryItem.objects.filter(farm__in=user_farms)

class InventoryItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InventoryItemDetailedSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return InventoryItem.objects.none()
        return InventoryItem.objects.filter(farm__in=user_farms)

class InventoryTransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['transaction_type', 'status']
    search_fields = ['item__name', 'reference']
    ordering_fields = ['transaction_date', 'created_at']
    ordering = ['-transaction_date']
    
    def get_queryset(self):
        return InventoryTransaction.objects.filter(
            item__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class InventoryTransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return InventoryTransaction.objects.filter(
            item__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class StockMovementListCreateView(generics.ListCreateAPIView):
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['movement_type']
    search_fields = ['item__name', 'batch_number']
    ordering_fields = ['movement_date', 'created_at']
    ordering = ['-movement_date']
    
    def get_queryset(self):
        return StockMovement.objects.filter(
            item__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )

class InventoryAuditListCreateView(generics.ListCreateAPIView):
    serializer_class = InventoryAuditSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['audit_date', 'created_at']
    ordering = ['-audit_date']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return InventoryAudit.objects.none()
        return InventoryAudit.objects.filter(farm__in=user_farms)
    
    def perform_create(self, serializer):
        """Associate audit with active farm"""
        # Get farm from request context
        farm_id = self.request.data.get('farm')
        if farm_id:
            serializer.save(farm_id=farm_id)

class InventoryAuditDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InventoryAuditSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return InventoryAudit.objects.none()
        return InventoryAudit.objects.filter(farm__in=user_farms)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def low_stock_items_view(request):
    """Get all low stock items for user's farms"""
    user_farms = Farm.objects.filter(
        Q(owner=request.user) | Q(members__user=request.user)
    ).distinct()
    items = InventoryItem.objects.filter(
        farm__in=user_farms,
        quantity__lte=F('min_quantity')
    )
    serializer = InventoryItemDetailedSerializer(items, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def inventory_dashboard_view(request):
    """Get inventory dashboard summary"""
    user_farms = Farm.objects.filter(
        Q(owner=request.user) | Q(members__user=request.user)
    ).distinct()
    
    all_items = InventoryItem.objects.filter(farm__in=user_farms)
    
    return Response({
        'total_items': all_items.count(),
        'low_stock_count': all_items.filter(quantity__lte=F('min_quantity')).count(),
        'expiring_soon': all_items.filter(expiry_date__isnull=False, expiry_date__lte=timezone.now().date()).count(),
        'total_inventory_value': sum([item.total_value for item in all_items]),
        'categories': list(set([item.category for item in all_items])),
    })


class DemandForecastListView(generics.ListAPIView):
    """List demand forecasts with filtering and search"""
    serializer_class = DemandForecastSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['farm', 'usage_trend']
    search_fields = ['item__name', 'item__category']
    ordering_fields = ['avg_monthly_usage', 'forecast_accuracy', 'last_updated']
    ordering = ['-forecast_accuracy']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return DemandForecast.objects.filter(farm__in=user_farms)


class DemandForecastDetailView(generics.RetrieveUpdateAPIView):
    """Get or update demand forecast details"""
    serializer_class = DemandForecastSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return DemandForecast.objects.filter(farm__in=user_farms)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def forecast_optimization_view(request):
    """Get optimization recommendations based on forecasts"""
    user_farms = Farm.objects.filter(
        Q(owner=request.user) | Q(members__user=request.user)
    ).distinct()
    
    forecasts = DemandForecast.objects.filter(farm__in=user_farms)
    
    recommendations = []
    for forecast in forecasts:
        item = forecast.item
        
        # Check if current quantity is below reorder point
        if item.quantity <= forecast.optimal_reorder_point:
            recommendations.append({
                'item': item.name,
                'action': 'URGENT: Reorder',
                'reorder_quantity': str(forecast.optimal_order_quantity),
                'urgency': 'critical',
                'reason': f'Current stock ({item.quantity}) <= Reorder point ({forecast.optimal_reorder_point})'
            })
        
        # Check if trend is increasing but safety stock is low
        if forecast.usage_trend == 'increasing' and item.quantity <= forecast.safety_stock * 1.5:
            recommendations.append({
                'item': item.name,
                'action': 'Increase safety stock',
                'new_safety_stock': str(forecast.safety_stock * 1.2),
                'urgency': 'high',
                'reason': f'Increasing demand trend detected'
            })
        
        # Check forecast accuracy
        if forecast.forecast_accuracy < 70:
            recommendations.append({
                'item': item.name,
                'action': 'Review forecast data',
                'forecast_accuracy': f"{forecast.forecast_accuracy}%",
                'urgency': 'medium',
                'reason': f'Forecast accuracy is low ({forecast.forecast_accuracy}%)'
            })
    
    return Response({
        'total_forecasts': forecasts.count(),
        'recommendations': recommendations,
        'high_priority_count': len([r for r in recommendations if r['urgency'] in ['critical', 'high']])
    })


class SupplierPerformanceListCreateView(generics.ListCreateAPIView):
    """List or create supplier performance records"""
    serializer_class = SupplierPerformanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['farm', 'reliability_grade']
    search_fields = ['supplier_name', 'item__name']
    ordering_fields = ['quality_rating', 'on_time_delivery_rate', 'avg_unit_price']
    ordering = ['-quality_rating']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return SupplierPerformance.objects.filter(farm__in=user_farms)


class SupplierPerformanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete supplier performance record"""
    serializer_class = SupplierPerformanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        return SupplierPerformance.objects.filter(farm__in=user_farms)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def supplier_comparison_view(request):
    """Compare suppliers for a specific item"""
    item_id = request.query_params.get('item')
    if not item_id:
        return Response({'error': 'item parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user_farms = Farm.objects.filter(
        Q(owner=request.user) | Q(members__user=request.user)
    ).distinct()
    
    suppliers = SupplierPerformance.objects.filter(
        farm__in=user_farms,
        item_id=item_id
    ).order_by('-quality_rating')
    
    comparison = []
    for supplier in suppliers:
        comparison.append({
            'supplier_name': supplier.supplier_name,
            'avg_price': str(supplier.avg_unit_price),
            'quality': supplier.quality_rating,
            'reliability': supplier.reliability_grade,
            'on_time_rate': supplier.on_time_delivery_rate,
            'recommendation': supplier.supplier_performance_summary()['recommendation']
        })
    
    return Response({
        'item': item_id if suppliers.exists() else None,
        'supplier_count': suppliers.count(),
        'best_supplier': comparison[0] if comparison else None,
        'all_suppliers': comparison
    })