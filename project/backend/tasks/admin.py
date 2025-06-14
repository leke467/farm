from django.contrib import admin
from .models import Task, TaskComment, TaskAttachment

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'farm', 'priority', 'status', 'assigned_to', 'due_date', 'created_by']
    list_filter = ['priority', 'status', 'category', 'due_date', 'farm']
    search_fields = ['title', 'description', 'farm__name']

@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'created_at']
    list_filter = ['created_at']

@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['task', 'filename', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at']