from django.contrib import admin
from .models import Farm, FarmMember, RoleMenuPermission, UserMenuPermission

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'farm_type', 'size', 'location', 'created_at']
    list_filter = ['farm_type', 'size', 'created_at']
    search_fields = ['name', 'owner__username', 'location']

@admin.register(FarmMember)
class FarmMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'farm', 'role', 'joined_at']
    list_filter = ['farm__name', 'role', 'joined_at']
    search_fields = ['user__username', 'farm__name']


@admin.register(RoleMenuPermission)
class RoleMenuPermissionAdmin(admin.ModelAdmin):
    list_display = ['farm', 'role', 'menu_key', 'can_view', 'can_create', 'can_edit', 'can_delete']
    list_filter = ['farm__name', 'role', 'menu_key']
    search_fields = ['farm__name']


@admin.register(UserMenuPermission)
class UserMenuPermissionAdmin(admin.ModelAdmin):
    list_display = ['farm', 'user', 'menu_key', 'can_view', 'can_create', 'can_edit', 'can_delete']
    list_filter = ['farm__name', 'menu_key']
    search_fields = ['farm__name', 'user__username', 'user__email']