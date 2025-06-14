from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'farm', 'generated_at']
    list_filter = ['report_type', 'generated_at', 'farm']
    search_fields = ['name', 'farm__name']