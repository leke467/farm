from django.contrib import admin
from .models import (Crop, GrowthStage, CropActivity, Harvest, CropYieldAnalysis,
                     FertilizerRecommendation, WeatherImpactRecord)

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

@admin.register(CropYieldAnalysis)
class CropYieldAnalysisAdmin(admin.ModelAdmin):
    list_display = ['crop', 'expected_yield', 'actual_yield', 'yield_efficiency', 'roi_percentage']
    list_filter = ['crop__farm', 'last_updated']
    search_fields = ['crop__name', 'crop__farm__name']
    readonly_fields = ['last_updated']
    fieldsets = (
        ('Crop Information', {'fields': ('crop',)}),
        ('Yield Data', {'fields': ('previous_yield', 'expected_yield', 'actual_yield', 'yield_unit')}),
        ('Impact Factors', {'fields': ('water_provided', 'fertilizer_applied', 'disease_severity', 'pest_damage')}),
        ('Performance Metrics', {'fields': ('yield_per_dollar_invested', 'roi_percentage', 'yield_efficiency')}),
        ('Recommendations', {'fields': ('optimization_recommendations',)}),
    )

@admin.register(FertilizerRecommendation)
class FertilizerRecommendationAdmin(admin.ModelAdmin):
    list_display = ['crop', 'recommended_type', 'recommended_quantity', 'status', 'applied_date', 'expected_yield_increase']
    list_filter = ['status', 'created_at', 'crop__farm']
    search_fields = ['crop__name', 'recommended_type', 'crop__farm__name']
    fieldsets = (
        ('Crop Information', {'fields': ('crop',)}),
        ('Recommendation', {'fields': ('recommended_type', 'recommended_quantity', 'unit', 'application_timing', 'expected_yield_increase')}),
        ('Status & Application', {'fields': ('status', 'applied_date', 'actual_quantity_applied')}),
        ('Financial Impact', {'fields': ('estimated_cost', 'expected_additional_revenue')}),
        ('Notes', {'fields': ('notes',)}),
    )

@admin.register(WeatherImpactRecord)
class WeatherImpactRecordAdmin(admin.ModelAdmin):
    list_display = ['crop', 'impact_date', 'impact_type', 'severity', 'estimated_yield_loss', 'estimated_financial_loss']
    list_filter = ['impact_date', 'impact_type', 'severity', 'crop__farm']
    search_fields = ['crop__name', 'impact_type', 'crop__farm__name']
    fieldsets = (
        ('Crop Information', {'fields': ('crop',)}),
        ('Impact Details', {'fields': ('impact_date', 'impact_type', 'severity', 'estimated_yield_loss', 'estimated_financial_loss')}),
        ('Recovery', {'fields': ('recovery_actions', 'recovery_cost', 'expected_recovery_yield')}),
        ('Notes', {'fields': ('notes',)}),
    )