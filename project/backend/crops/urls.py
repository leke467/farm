from django.urls import path
from . import views

urlpatterns = [
    path('', views.CropListCreateView.as_view(), name='crop-list-create'),
    path('<int:pk>/', views.CropDetailView.as_view(), name='crop-detail'),
    path('<int:crop_id>/stages/', views.GrowthStageListCreateView.as_view(), name='growth-stages'),
    path('<int:crop_id>/activities/', views.CropActivityListCreateView.as_view(), name='crop-activities'),
    path('<int:crop_id>/harvests/', views.HarvestListCreateView.as_view(), name='harvests'),
]