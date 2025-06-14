from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import InventoryItem, InventoryTransaction
from .serializers import InventoryItemSerializer, InventoryTransactionSerializer

class InventoryItemListCreateView(generics.ListCreateAPIView):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'supplier', 'location']
    ordering_fields = ['name', 'quantity', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        return InventoryItem.objects.filter(farm__owner=self.request.user)

class InventoryItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return InventoryItem.objects.filter(farm__owner=self.request.user)

class InventoryTransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        item_id = self.kwargs.get('item_id')
        return InventoryTransaction.objects.filter(
            item_id=item_id,
            item__farm__owner=self.request.user
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def low_stock_items_view(request):
    items = InventoryItem.objects.filter(
        farm__owner=request.user,
        quantity__lte=models.F('min_quantity')
    )
    serializer = InventoryItemSerializer(items, many=True)
    return Response(serializer.data)