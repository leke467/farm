from rest_framework.permissions import BasePermission, SAFE_METHODS
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
        'animals-overview': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'animals-feed': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'animals-breeding': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'crops-overview': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'crops-harvest': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'crops-fertilizer': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
        'crops-weather': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True},
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
        'animals-overview': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'animals-feed': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'animals-breeding': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops-overview': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops-harvest': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops-fertilizer': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops-weather': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
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
        'animals-overview': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'animals-feed': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'animals-breeding': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops-overview': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops-harvest': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops-fertilizer': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'crops-weather': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'tasks': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'inventory': {'can_view': True, 'can_create': True, 'can_edit': False, 'can_delete': False},
        'expenses': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'sales': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'reports': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'settings': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'health': {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': False},
        'analytics': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'subscription': {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False},
    },
    'viewer': {
        'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals-overview': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals-feed': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'animals-breeding': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'crops': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'crops-overview': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'crops-harvest': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'crops-fertilizer': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        'crops-weather': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
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


def get_user_farms_queryset(user):
    """
    Returns a queryset of Farm objects accessible by the user.
    Superusers, staff, and admins have access to all farms.
    Standard users have access to farms they own or are members of.
    """
    if not user or not user.is_authenticated:
        return Farm.objects.none()
    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_admin', False):
        return Farm.objects.all()
    return Farm.objects.filter(
        Q(owner=user) | Q(members__user=user)
    ).distinct()


def user_has_farm_access(farm, user):
    """
    Checks if a user has access to a specific farm.
    Superusers, staff, and admin have access to all farms.
    Standard users must own the farm or be in FarmMember.
    """
    if not user or not user.is_authenticated or not farm:
        return False
    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_admin', False):
        return True
    return farm.owner_id == user.id or FarmMember.objects.filter(farm=farm, user=user).exists()


def get_user_farm_role(farm, user):
    if not user or not user.is_authenticated:
        return None
    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_admin', False):
        return 'owner'
    if farm.owner_id == user.id:
        return 'owner'
    membership = FarmMember.objects.filter(farm=farm, user=user).first()
    return membership.role if membership else None


def get_effective_permission(farm, user, menu_key):
    if not user or not user.is_authenticated:
        return {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False}
    if farm.owner_id == user.id or getattr(user, 'is_superuser', False) or getattr(user, 'is_admin', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_demo', False) or user.username in ['demo', 'demo1234']:
        return {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True}

    user_farms = get_user_farms_queryset(user)

    if user_farms.exists():
        role = get_user_farm_role(farm, user)
        if role is None:
            return {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True}

        role_defaults = DEFAULT_ROLE_PERMISSIONS.get(role, DEFAULT_ROLE_PERMISSIONS.get('owner', {}))
        defaults = role_defaults.get(menu_key, {'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True})
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

    return {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False}


class FarmMenuPermission(BasePermission):
    message = "Your farm subscription has expired. Please select a plan and renew your subscription to perform operational actions."

    def has_permission(self, request, view):
        farm = self._get_farm(request, view)

        # Subscription payment enforcement for write operations (POST, PUT, PATCH, DELETE)
        if request.method not in SAFE_METHODS and not (request.user.is_superuser or request.user.is_staff):
            from subscriptions.services import get_user_subscription
            sub = get_user_subscription(request.user, farm_id=farm.id if farm else None)
            if not sub or not sub.is_active_subscription():
                return False

        menu_key = getattr(view, 'farm_menu_key', None)
        if not menu_key:
            return True
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
        farm_id = view.kwargs.get('farm_id') or request.query_params.get('farm') or request.query_params.get('farm_id')
        if not farm_id and hasattr(request, 'data') and isinstance(request.data, dict):
            farm_id = request.data.get('farm') or request.data.get('farm_id')
            if not farm_id and ('animal' in request.data or 'animal_id' in request.data):
                animal_id = request.data.get('animal') or request.data.get('animal_id')
                try:
                    from animals.models import Animal
                    animal = Animal.objects.filter(pk=animal_id).first()
                    if animal:
                        return animal.farm
                except Exception:
                    pass

        if farm_id:
            try:
                return Farm.objects.get(pk=farm_id)
            except (Farm.DoesNotExist, ValueError):
                pass
        user_farms = get_user_farms_queryset(request.user)
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
