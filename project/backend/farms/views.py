from rest_framework import generics, permissions, status
from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Farm, FarmMember
from .serializers import FarmSerializer, FarmMemberSerializer, FarmMemberCreateSerializer

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


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def farm_members_view(request, farm_id):
    farm = get_object_or_404(Farm, pk=farm_id)

    has_farm_access = (
        farm.owner_id == request.user.id
        or FarmMember.objects.filter(farm=farm, user=request.user).exists()
    )
    if not has_farm_access:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        members = FarmMember.objects.filter(farm=farm).select_related('user', 'farm').order_by('-joined_at')
        serializer = FarmMemberSerializer(members, many=True)
        return Response(serializer.data)

    if not request.user.is_admin:
        return Response(
            {'detail': 'Only admin users can create farm members.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = FarmMemberCreateSerializer(data=request.data, context={'farm': farm})
    if serializer.is_valid():
        member = serializer.save()
        return Response(FarmMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)