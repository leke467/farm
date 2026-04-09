from rest_framework import serializers
from django.utils import timezone
from .models import Task, TaskComment, TaskAttachment
from accounts.serializers import UserSerializer
from terra_track.validators import TaskValidator
from farms.models import FarmMember

class TaskCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = '__all__'
        read_only_fields = ['created_at', 'user']

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = '__all__'
        read_only_fields = ['uploaded_at', 'uploaded_by']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'completed_at']
    
    def validate_priority(self, value):
        """Priority must be valid"""
        valid_priorities = ['low', 'medium', 'high']
        if value not in valid_priorities:
            raise serializers.ValidationError(f"Priority must be one of: {', '.join(valid_priorities)}")
        return value
    
    def validate_status(self, value):
        """Status must be valid"""
        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value
    
    def validate_category(self, value):
        """Category must be valid"""
        valid_categories = ['daily_care', 'maintenance', 'health', 'crop_care', 'administrative', 'other']
        if value not in valid_categories:
            raise serializers.ValidationError(f"Category must be one of: {', '.join(valid_categories)}")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        farm = self.context.get('farm')
        assigned_to = data.get('assigned_to')
        
        # Validate assigned user is farm member
        if assigned_to and farm:
            if not FarmMember.objects.filter(
                farm=farm,
                user=assigned_to
            ).exists() and farm.owner != assigned_to:
                raise serializers.ValidationError({
                    "assigned_to": "Assigned user is not a member of this farm"
                })
        
        return data
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)