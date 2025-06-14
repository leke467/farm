from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskCommentSerializer

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'category', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at']
    ordering = ['due_date']
    
    def get_queryset(self):
        return Task.objects.filter(farm__owner=self.request.user)

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Task.objects.filter(farm__owner=self.request.user)
    
    def perform_update(self, serializer):
        if serializer.validated_data.get('status') == 'completed' and not serializer.instance.completed_at:
            serializer.save(completed_at=timezone.now())
        else:
            serializer.save()

class TaskCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return TaskComment.objects.filter(
            task_id=task_id,
            task__farm__owner=self.request.user
        )
    
    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        serializer.save(user=self.request.user, task_id=task_id)