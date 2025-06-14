from rest_framework import serializers
from .models import Task, TaskComment, TaskAttachment
from accounts.serializers import UserSerializer

class TaskCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = '__all__'
        read_only_fields = ['created_at']

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = '__all__'
        read_only_fields = ['uploaded_at']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'completed_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)