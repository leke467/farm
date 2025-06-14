from django.contrib import admin
from .models import Farm, FarmMember

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'farm_type', 'size', 'location', 'created_at']
    list_filter = ['farm_type', 'size', 'created_at']
    search_fields = ['name', 'owner__username', 'location']

@admin.register(FarmMember)
class FarmMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'farm', 'role', 'joined_at']
    list_filter = ['role', 'joined_at']
    search_fields = ['user__username', 'farm__name']