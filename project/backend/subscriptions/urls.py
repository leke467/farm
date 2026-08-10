from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.plans_list, name='plans-list'),
    path('me/', views.my_subscription, name='my-subscription'),
    path('subscribe/', views.subscribe, name='subscribe'),
    path('verify-latest/', views.verify_latest_payment, name='verify-latest-payment'),
    path('verify/<str:reference>/', views.verify_payment, name='verify-payment'),
    path('cancel/', views.cancel_subscription_view, name='cancel-subscription'),
    path('webhook/monnify/', views.monnify_webhook, name='monnify-webhook'),
]
