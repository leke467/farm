from django.urls import path
from . import views

urlpatterns = [
    path('', views.FarmListCreateView.as_view(), name='farm-list-create'),
    path('<int:pk>/', views.FarmDetailView.as_view(), name='farm-detail'),
    path('<int:farm_id>/members/', views.farm_members_view, name='farm-members'),
    path('<int:farm_id>/permissions/catalog/', views.farm_permissions_catalog_view, name='farm-permissions-catalog'),
    path('<int:farm_id>/permissions/roles/<str:role>/', views.farm_role_permissions_view, name='farm-role-permissions'),
    path('<int:farm_id>/permissions/users/<int:user_id>/', views.farm_user_permissions_view, name='farm-user-permissions'),
    path('<int:farm_id>/permissions/me/', views.my_farm_permissions_view, name='my-farm-permissions'),
    path('user/', views.user_farms_view, name='user-farms'),
]