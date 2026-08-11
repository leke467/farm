from rest_framework.permissions import BasePermission
from .models import Farm, FarmMember, RoleMenuPermission, UserMenuPermission
from django.db.models import Q


METHOD_PERMISSION_MAP = {
    'GET': 'can_view',
    'HEAD': 'can_view',
    'OPTIONS': 'can_view',
    'POST': 'can_create',
    'PUT': 'can_edit',
    'PATCH': 'can_edit',
    'DELETE': 'can_delete',
}

DEFAULT_ROLE_PERMISSIONS = {
    'owner': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'tasks': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'inventory': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'expenses': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'sales': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'reports': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'settings': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'health': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'analytics': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'subscription': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
    },
    'manager': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'tasks': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'inventory': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'expenses': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'sales': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'reports': {'can_view': True, 'can_create': True, 'can_edit': False, 'can_delete': False},
        'settings': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'health': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'analytics': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'subscription': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
    },
    'worker': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'tasks': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'inventory': {'can_view': True, 'can_create': True, 'can_edit': False, 'can_delete': False},
        'expenses': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'sales': {'can_view': True, 'can_create': True, 'can_edit': False, 'can_delete': False},
        'reports': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'settings': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'health': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'analytics': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'subscription': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
    },
    'viewer': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'tasks': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'inventory': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'expenses': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'sales': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'reports': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'settings': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'health': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'analytics': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'subscription': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
    },
}


def get_user_farm_role(farm, user):
    if farm.owner_id == user.id:
        return 'owner'
    membership = FarmMember.objects.filter(farm=farm, user=user).first()
    return membership.role if membership else None


def get_effective_permission(farm, user, menu_key):
    if farm.owner_id == user.id or getattr(user, 'is_superuser', False):
        return {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True}
    role = get_user_farm_role(farm, user)
    if role is None:
        return {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False}
    role_defaults = DEFAULT_ROLE_PERMISSIONS.get(role, DEFAULT_ROLE_PERMISSIONS['viewer'])
    defaults = role_defaults.get(menu_key, {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False})
    role_perm = RoleMenuPermission.objects.filter(farm=farm, role=role, menu_key=menu_key).first()
    if role_perm:
        permissions = {
            'can_view': role_perm.can_view,
            'can_create': role_perm.can_create,
            'can_edit': role_perm.can_edit,
            'can_delete': role_perm.can_delete,
        }
    else:
        permissions = defaults.copy()
    user_perm = UserMenuPermission.objects.filter(farm=farm, user=user, menu_key=menu_key).first()
    if user_perm:
        for field in ['can_view', 'can_create', 'can_edit', 'can_delete']:
            override = getattr(user_perm, field)
            if override is not None:
                permissions[field] = override
    return permissions


class FarmMenuPermission(BasePermission):
    def has_permission(self, request, view):
        menu_key = getattr(view, 'farm_menu_key', None)
        if not menu_key:
            return True
        farm = self._get_farm(request, view)
        if not farm:
            return True
        required_perm = METHOD_PERMISSION_MAP.get(request.method, 'can_view')
        permissions = get_effective_permission(farm, request.user, menu_key)
        return permissions.get(required_perm, False)

    def has_object_permission(self, request, view, obj):
        menu_key = getattr(view, 'farm_menu_key', None)
        if not menu_key:
            return True
        farm = self._get_farm_from_object(obj)
        if not farm:
            return True
        required_perm = METHOD_PERMISSION_MAP.get(request.method, 'can_view')
        permissions = get_effective_permission(farm, request.user, menu_key)
        return permissions.get(required_perm, False)

    def _get_farm(self, request, view):
        farm_id = view.kwargs.get('farm_id') or request.data.get('farm') or request.query_params.get('farm') or request.query_params.get('farm_id')
        if farm_id:
            try:
                return Farm.objects.get(pk=farm_id)
            except (Farm.DoesNotExist, ValueError):
                pass
        user_farms = Farm.objects.filter(
            Q(owner=request.user) | Q(members__user=request.user)
        ).distinct()
        return user_farms.first()

    def _get_farm_from_object(self, obj):
        if hasattr(obj, 'farm'):
            return obj.farm
        if hasattr(obj, 'animal') and hasattr(obj.animal, 'farm'):
            return obj.animal.farm
        if hasattr(obj, 'crop') and hasattr(obj.crop, 'farm'):
            return obj.crop.farm
        if hasattr(obj, 'item') and hasattr(obj.item, 'farm'):
            return obj.item.farm
        if hasattr(obj, 'breeding') and hasattr(obj.breeding, 'animal'):
            return obj.breeding.animal.farm
        if isinstance(obj, Farm):
            return obj
        return None
