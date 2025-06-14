from django.contrib import admin
from .models import Animal, WeightRecord, MedicalRecord, FeedRecord, SampleWeight, WaterQuality

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