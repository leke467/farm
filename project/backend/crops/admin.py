from django.contrib import admin
from .models import Crop, GrowthStage, CropActivity, Harvest

@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ['name', 'field', 'status', 'stage', 'planted_date', 'expected_harvest_date', 'farm']
    list_filter = ['status', 'stage', 'planted_date', 'farm']
    search_fields = ['name', 'field', 'variety', 'farm__name']

@admin.register(GrowthStage)
class GrowthStageAdmin(admin.ModelAdmin):
    list_display = ['crop', 'stage', 'date', 'completed']
    list_filter = ['stage', 'completed', 'date']

@admin.register(CropActivity)
class CropActivityAdmin(admin.ModelAdmin):
    list_display = ['crop', 'activity_type', 'date', 'cost']
    list_filter = ['activity_type', 'date']

@admin.register(Harvest)
class HarvestAdmin(admin.ModelAdmin):
    list_display = ['crop', 'date', 'quantity', 'unit', 'quality_grade']
    list_filter = ['date', 'quality_grade']