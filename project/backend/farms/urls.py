from django.urls import path
from . import views

urlpatterns = [
    path('', views.FarmListCreateView.as_view(), name='farm-list-create'),
    path('<int:pk>/', views.FarmDetailView.as_view(), name='farm-detail'),
    path('<int:farm_id>/members/', views.farm_members_view, name='farm-members'),
    path('user/', views.user_farms_view, name='user-farms'),
]