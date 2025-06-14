from django.urls import path
from . import views

urlpatterns = [
    path('', views.AnimalListCreateView.as_view(), name='animal-list-create'),
    path('<int:pk>/', views.AnimalDetailView.as_view(), name='animal-detail'),
    path('<int:animal_id>/weights/', views.WeightRecordListCreateView.as_view(), name='weight-records'),
    path('<int:animal_id>/medical/', views.MedicalRecordListCreateView.as_view(), name='medical-records'),
    path('<int:animal_id>/feed/', views.FeedRecordListCreateView.as_view(), name='feed-records'),
]