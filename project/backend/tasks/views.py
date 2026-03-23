from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskCommentSerializer
from farms.models import Farm

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'category', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at']
    ordering = ['due_date']
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Task.objects.none()
        return Task.objects.filter(farm__in=user_farms)

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_farms = Farm.objects.filter(
            Q(owner=self.request.user) | Q(members__user=self.request.user)
        ).distinct()
        if not user_farms.exists():
            return Task.objects.none()
        return Task.objects.filter(farm__in=user_farms)
    
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
            task__farm__in=Farm.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)
            )
        )
    
    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        serializer.save(user=self.request.user, task_id=task_id)