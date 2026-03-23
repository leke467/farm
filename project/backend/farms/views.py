from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Farm, FarmMember, RoleMenuPermission, UserMenuPermission, MENU_CHOICES
from .serializers import (
    FarmSerializer,
    FarmMemberSerializer,
    FarmMemberCreateSerializer,
    RolePermissionBulkUpdateSerializer,
    UserPermissionBulkUpdateSerializer,
)


PERMISSION_FIELDS = ['can_view', 'can_create', 'can_edit', 'can_delete']


DEFAULT_ROLE_PERMISSIONS = {
    'owner': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'tasks': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'inventory': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'expenses': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'reports': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'settings': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
    },
    'manager': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'tasks': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'inventory': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'expenses': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'reports': {'can_view': True, 'can_create': True, 'can_edit': False, 'can_delete': False},
        'settings': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
    },
    'worker': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'tasks': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'inventory': {'can_view': True, 'can_create': True, 'can_edit': False, 'can_delete': False},
        'expenses': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'reports': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'settings': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
    },
    'viewer': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'tasks': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'inventory': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'expenses': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'reports': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'settings': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
    },
}


def has_farm_access(farm, user):
    return farm.owner_id == user.id or FarmMember.objects.filter(farm=farm, user=user).exists()


def get_user_role_for_farm(farm, user):
    if farm.owner_id == user.id:
        return 'owner'
    membership = FarmMember.objects.filter(farm=farm, user=user).first()
    return membership.role if membership else 'viewer'


def get_default_permissions_for_role(role, menu_key):
    role_defaults = DEFAULT_ROLE_PERMISSIONS.get(role, DEFAULT_ROLE_PERMISSIONS['viewer'])
    return role_defaults.get(menu_key, {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False})


def get_role_permission_rows(farm, role):
    stored = {
        row.menu_key: row
        for row in RoleMenuPermission.objects.filter(farm=farm, role=role)
    }
    rows = []
    for menu_key, menu_label in MENU_CHOICES:
        defaults = get_default_permissions_for_role(role, menu_key)
        row = stored.get(menu_key)
        rows.append({
            'menu_key': menu_key,
            'menu_label': menu_label,
            'can_view': row.can_view if row else defaults['can_view'],
            'can_create': row.can_create if row else defaults['can_create'],
            'can_edit': row.can_edit if row else defaults['can_edit'],
            'can_delete': row.can_delete if row else defaults['can_delete'],
        })
    return rows


def get_effective_user_permission_rows(farm, user):
    role = get_user_role_for_farm(farm, user)
    role_rows = {row['menu_key']: row for row in get_role_permission_rows(farm, role)}
    overrides = {
        row.menu_key: row
        for row in UserMenuPermission.objects.filter(farm=farm, user=user)
    }

    rows = []
    for menu_key, menu_label in MENU_CHOICES:
        role_row = role_rows[menu_key]
        override = overrides.get(menu_key)
        row = {
            'menu_key': menu_key,
            'menu_label': menu_label,
            'role': role,
            'role_permissions': {
                'can_view': role_row['can_view'],
                'can_create': role_row['can_create'],
                'can_edit': role_row['can_edit'],
                'can_delete': role_row['can_delete'],
            },
            'user_override': {
                'can_view': override.can_view if override else None,
                'can_create': override.can_create if override else None,
                'can_edit': override.can_edit if override else None,
                'can_delete': override.can_delete if override else None,
            },
        }

        row['effective_permissions'] = {
            field: row['user_override'][field] if row['user_override'][field] is not None else row['role_permissions'][field]
            for field in PERMISSION_FIELDS
        }
        rows.append(row)
    return rows


class FarmMembersPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

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
        paginator = FarmMembersPagination()
        page = paginator.paginate_queryset(members, request)
        serializer = FarmMemberSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def farm_permissions_catalog_view(request, farm_id):
    farm = get_object_or_404(Farm, pk=farm_id)
    if not has_farm_access(farm, request.user):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    members = []
    owner = farm.owner
    members.append({
        'id': owner.id,
        'username': owner.username,
        'first_name': owner.first_name,
        'last_name': owner.last_name,
        'email': owner.email,
        'role': 'owner',
    })

    for membership in FarmMember.objects.filter(farm=farm).select_related('user').order_by('user__username'):
        members.append({
            'id': membership.user.id,
            'username': membership.user.username,
            'first_name': membership.user.first_name,
            'last_name': membership.user.last_name,
            'email': membership.user.email,
            'role': membership.role,
        })

    return Response({
        'menus': [{'key': key, 'label': label} for key, label in MENU_CHOICES],
        'roles': [{'key': key, 'label': label} for key, label in FarmMember.ROLE_CHOICES],
        'actions': ['can_view', 'can_create', 'can_edit', 'can_delete'],
        'members': members,
    })


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def farm_role_permissions_view(request, farm_id, role):
    farm = get_object_or_404(Farm, pk=farm_id)
    if not has_farm_access(farm, request.user):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not request.user.is_admin:
        return Response({'detail': 'Only admins can manage role permissions.'}, status=status.HTTP_403_FORBIDDEN)

    valid_roles = {key for key, _ in FarmMember.ROLE_CHOICES}
    if role not in valid_roles:
        return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        return Response({'role': role, 'permissions': get_role_permission_rows(farm, role)})

    serializer = RolePermissionBulkUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    existing_by_menu = {row['menu_key']: row for row in get_role_permission_rows(farm, role)}

    for item in serializer.validated_data['permissions']:
        menu_key = item['menu_key']
        merged = {
            field: item[field] if field in item and item[field] is not None else existing_by_menu[menu_key][field]
            for field in PERMISSION_FIELDS
        }
        RoleMenuPermission.objects.update_or_create(
            farm=farm,
            role=role,
            menu_key=menu_key,
            defaults=merged,
        )

    return Response({'role': role, 'permissions': get_role_permission_rows(farm, role)})


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def farm_user_permissions_view(request, farm_id, user_id):
    farm = get_object_or_404(Farm, pk=farm_id)
    if not has_farm_access(farm, request.user):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not request.user.is_admin:
        return Response({'detail': 'Only admins can manage user permissions.'}, status=status.HTTP_403_FORBIDDEN)

    target_membership = FarmMember.objects.filter(farm=farm, user_id=user_id).select_related('user').first()
    if farm.owner_id == user_id:
        target_user = farm.owner
        target_role = 'owner'
    elif target_membership:
        target_user = target_membership.user
        target_role = target_membership.role
    else:
        return Response({'detail': 'User is not a member of this farm.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'email': target_user.email,
                'first_name': target_user.first_name,
                'last_name': target_user.last_name,
            },
            'role': target_role,
            'permissions': get_effective_user_permission_rows(farm, target_user),
        })

    serializer = UserPermissionBulkUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    existing_overrides = {
        row.menu_key: row
        for row in UserMenuPermission.objects.filter(farm=farm, user=target_user)
    }

    for item in serializer.validated_data['permissions']:
        menu_key = item['menu_key']
        existing = existing_overrides.get(menu_key)

        values = {
            field: item[field] if field in item else (getattr(existing, field) if existing else None)
            for field in PERMISSION_FIELDS
        }

        if all(values[field] is None for field in PERMISSION_FIELDS):
            if existing:
                existing.delete()
            continue

        UserMenuPermission.objects.update_or_create(
            farm=farm,
            user=target_user,
            menu_key=menu_key,
            defaults=values,
        )

    return Response({
        'user': {
            'id': target_user.id,
            'username': target_user.username,
            'email': target_user.email,
            'first_name': target_user.first_name,
            'last_name': target_user.last_name,
        },
        'role': target_role,
        'permissions': get_effective_user_permission_rows(farm, target_user),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_farm_permissions_view(request, farm_id):
    farm = get_object_or_404(Farm, pk=farm_id)
    if not has_farm_access(farm, request.user):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    role = get_user_role_for_farm(farm, request.user)
    effective = get_effective_user_permission_rows(farm, request.user)

    return Response({
        'role': role,
        'permissions': effective,
        'permission_map': {
            row['menu_key']: row['effective_permissions']
            for row in effective
        },
    })