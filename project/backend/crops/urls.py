from django.urls import path
from . import views

urlpatterns = [
    path('', views.CropListCreateView.as_view(), name='crop-list-create'),
    path('<int:pk>/', views.CropDetailView.as_view(), name='crop-detail'),
    path('<int:crop_id>/stages/', views.GrowthStageListCreateView.as_view(), name='growth-stages'),
    path('<int:crop_id>/activities/', views.CropActivityListCreateView.as_view(), name='crop-activities'),
    path('<int:crop_id>/harvests/', views.HarvestListCreateView.as_view(), name='harvests'),
    path('yield-analysis/', views.CropYieldAnalysisListCreateView.as_view(), name='yield-analysis-list-create'),
    path('yield-analysis/<int:pk>/', views.CropYieldAnalysisDetailView.as_view(), name='yield-analysis-detail'),
    path('fertilizer-recommendations/', views.FertilizerRecommendationListCreateView.as_view(), name='fertilizer-recommendation-list-create'),
    path('fertilizer-recommendations/<int:pk>/', views.FertilizerRecommendationDetailView.as_view(), name='fertilizer-recommendation-detail'),
    path('weather-impacts/', views.WeatherImpactRecordListCreateView.as_view(), name='weather-impact-list-create'),
    path('weather-impacts/<int:pk>/', views.WeatherImpactRecordDetailView.as_view(), name='weather-impact-detail'),
]