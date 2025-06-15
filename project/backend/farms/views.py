from rest_framework import generics, permissions
from django.db import models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Farm, FarmMember
from .serializers import FarmSerializer, FarmMemberSerializer

class FarmListCreateView(generics.ListCreateAPIView):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Farm.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(members__user=self.request.user)
        ).distinct()

class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Farm.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(members__user=self.request.user)
        ).distinct()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_farms_view(request):
    farms = Farm.objects.filter(
        models.Q(owner=request.user) | 
        models.Q(members__user=request.user)
    ).distinct()
    serializer = FarmSerializer(farms, many=True)
    return Response(serializer.data)