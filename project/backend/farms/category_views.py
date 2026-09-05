from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import FarmCategory, Farm, FarmMember
from .serializers import FarmSerializer
from rest_framework.decorators import api_view, permission_classes
from .permissions import FarmMenuPermission, user_has_farm_access

from rest_framework import serializers

class FarmCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmCategory
        fields = '__all__'


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def farm_categories_view(request, farm_id):
    farm = get_object_or_404(Farm, pk=farm_id)
    
    # Check access
    if not user_has_farm_access(farm, request.user):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        categories = FarmCategory.objects.filter(farm=farm)
        category_type = request.query_params.get('category_type')
        if category_type:
            categories = categories.filter(category_type=category_type)
        serializer = FarmCategorySerializer(categories, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        # mutations require owner/manager/admin role
        is_admin = (
            getattr(request.user, 'is_superuser', False)
            or getattr(request.user, 'is_staff', False)
            or getattr(request.user, 'is_admin', False)
            or farm.owner_id == request.user.id
        )
        if not is_admin:
            membership = FarmMember.objects.filter(farm=farm, user=request.user).first()
            if not membership or membership.role not in ['owner', 'manager']:
                return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)
                
        serializer = FarmCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(farm=farm)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def farm_category_detail_view(request, farm_id, category_id):
    farm = get_object_or_404(Farm, pk=farm_id)
    
    # Check access
    if not user_has_farm_access(farm, request.user):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    # mutations require owner/manager/admin role
    is_admin = (
        getattr(request.user, 'is_superuser', False)
        or getattr(request.user, 'is_staff', False)
        or getattr(request.user, 'is_admin', False)
        or farm.owner_id == request.user.id
    )
    if not is_admin:
        membership = FarmMember.objects.filter(farm=farm, user=request.user).first()
        if not membership or membership.role not in ['owner', 'manager']:
            return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)
            
    category = get_object_or_404(FarmCategory, pk=category_id, farm=farm)
    
    if request.method == 'PUT':
        serializer = FarmCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == 'DELETE':
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
