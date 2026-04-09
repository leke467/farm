from django.contrib import admin
from .models import (Animal, WeightRecord, MedicalRecord, FeedRecord, SampleWeight, 
                     WaterQuality, Vaccination, BreedingCalendar, HealthAlert,
                     BreedingRecord, ProductionRecord, AnimalProductionMetrics)

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ['name', 'animal_type', 'breed', 'status', 'farm', 'is_group', 'count']
    list_filter = ['animal_type', 'status', 'is_group', 'farm']
    search_fields = ['name', 'breed', 'farm__name']

@admin.register(WeightRecord)
class WeightRecordAdmin(admin.ModelAdmin):
    list_display = ['animal', 'weight', 'date']
    list_filter = ['date', 'animal__animal_type']

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['animal', 'treatment', 'date', 'veterinarian']
    list_filter = ['date', 'animal__animal_type']

@admin.register(FeedRecord)
class FeedRecordAdmin(admin.ModelAdmin):
    list_display = ['animal', 'amount', 'date', 'feed_type']
    list_filter = ['date', 'animal__animal_type']

admin.site.register(SampleWeight)
admin.site.register(WaterQuality)

@admin.register(Vaccination)
class VaccinationAdmin(admin.ModelAdmin):
    list_display = ['animal', 'vaccine_type', 'scheduled_date', 'status']
    list_filter = ['status', 'vaccine_type', 'scheduled_date']
    search_fields = ['animal__name', 'vaccine_type']

@admin.register(BreedingCalendar)
class BreedingCalendarAdmin(admin.ModelAdmin):
    list_display = ['animal', 'breeding_date', 'expected_delivery_date', 'status']
    list_filter = ['status', 'breeding_date']
    search_fields = ['animal__name', 'partner_animal_name']

@admin.register(HealthAlert)
class HealthAlertAdmin(admin.ModelAdmin):
    list_display = ['animal', 'alert_type', 'priority', 'status', 'due_date']
    list_filter = ['status', 'priority', 'alert_type']
    search_fields = ['animal__name', 'title', 'description']

@admin.register(BreedingRecord)
class BreedingRecordAdmin(admin.ModelAdmin):
    list_display = ['breeding', 'status', 'delivery_date', 'number_of_offspring', 'healthy_offspring']
    list_filter = ['status', 'delivery_date']
    search_fields = ['breeding__animal__name', 'dam_animal__name', 'sire_animal__name']
    fieldsets = (
        ('Breeding Information', {'fields': ('breeding', 'sire_animal', 'dam_animal', 'status', 'delivery_date')}),
        ('Offspring Details', {'fields': ('number_of_offspring', 'healthy_offspring', 'stillborn', 'birth_weights')}),
        ('Genetics & Care', {'fields': ('genetics_notes', 'veterinary_complications', 'post_delivery_care')}),
    )

@admin.register(ProductionRecord)
class ProductionRecordAdmin(admin.ModelAdmin):
    list_display = ['animal', 'production_type', 'quantity', 'unit', 'recorded_date', 'quality_grade', 'total_market_value']
    list_filter = ['production_type', 'quality_grade', 'recorded_date']
    search_fields = ['animal__name']

@admin.register(AnimalProductionMetrics)
class AnimalProductionMetricsAdmin(admin.ModelAdmin):
    list_display = ['animal', 'current_month_production', 'avg_monthly_production', 'annual_profit', 'production_efficiency']
    list_filter = ['animal__animal_type', 'last_updated']
    search_fields = ['animal__name']
    readonly_fields = ['last_updated']
    fieldsets = (
        ('Animal', {'fields': ('animal',)}),
        ('Monthly Metrics', {'fields': ('current_month_production', 'avg_monthly_production', 'highest_monthly_production')}),
        ('Annual Metrics', {'fields': ('year_to_date_production', 'annual_revenue', 'annual_feed_cost', 'annual_profit')}),
        ('Efficiency', {'fields': ('feed_conversion_ratio', 'production_efficiency', 'breeding_success_rate', 'health_score')}),
    )