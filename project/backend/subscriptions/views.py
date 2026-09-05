from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt

from .models import SubscriptionPlan, Subscription, SubscriptionPayment, WebhookEvent
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer, SubscriptionPaymentSerializer
from .services import create_subscription_payment, confirm_payment, get_user_subscription, cancel_subscription
from .gateway import MonnifyGateway

@api_view(['GET'])
@permission_classes([AllowAny])
def plans_list(request):
    plans = SubscriptionPlan.objects.filter(is_active=True)
    if not plans.exists():
        try:
            from django.core.management import call_command
            call_command('seed_subscription_plans')
            plans = SubscriptionPlan.objects.filter(is_active=True)
        except Exception:
            pass
    serializer = SubscriptionPlanSerializer(plans, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_subscription(request):
    farm_id = request.query_params.get('farm')
    sub = get_user_subscription(request.user, farm_id=farm_id)
    if sub:
        serializer = SubscriptionSerializer(sub)
        return Response(serializer.data)
    return Response({
        "status": "trial",
        "plan": None,
        "start_date": None,
        "end_date": None,
        "is_auto_renew": False,
        "is_active": True
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe(request):
    plan_id = request.data.get('plan_id')
    idempotency_key = request.data.get('idempotency_key')
    redirect_url = request.data.get('redirect_url', '')
    
    if not plan_id or not idempotency_key:
        return Response({"detail": "plan_id and idempotency_key are required."}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        data = create_subscription_payment(request.user, plan_id, idempotency_key, redirect_url=redirect_url)
        return Response(data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_payment(request, reference):
    try:
        payment = confirm_payment(reference)
        serializer = SubscriptionPaymentSerializer(payment)
        return Response(serializer.data)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_latest_payment(request):
    latest_payment = SubscriptionPayment.objects.filter(
        user=request.user, 
        status=SubscriptionPayment.Status.INITIATED
    ).order_by('-created_at').first()
    
    if latest_payment:
        try:
            payment = confirm_payment(latest_payment.payment_reference)
            serializer = SubscriptionPaymentSerializer(payment)
            return Response(serializer.data)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    return Response({"detail": "No pending payments to verify."}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription_view(request):
    sub = cancel_subscription(request.user)
    if sub:
        serializer = SubscriptionSerializer(sub)
        return Response(serializer.data)
    return Response({"detail": "No active subscription to cancel."}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def monnify_webhook(request):
    payload = request.body.decode('utf-8')
    signature = request.headers.get("monnify-signature", "")

    gateway = MonnifyGateway()
    event = gateway.verify_webhook_signature(payload, signature)
    
    if event is None:
        return Response({"detail": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

    wh, created = WebhookEvent.objects.get_or_create(
        event_id=event["event_id"],
        defaults={
            "provider": "monnify",
            "event_type": event["event_type"],
            "payload": event["data"],
        },
    )
    if not created:
        return Response({"detail": "Already processed"})

    if event["event_type"] == "SUCCESSFUL_TRANSACTION":
        payment_ref = event["data"].get("paymentReference", "")
        try:
            confirm_payment(payment_ref)
        except Exception as e:
            wh.status = WebhookEvent.Status.FAILED
            wh.error_message = str(e)
            wh.save()
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    wh.status = WebhookEvent.Status.PROCESSED
    from django.utils import timezone
    wh.processed_at = timezone.now()
    wh.save()

    return Response({"detail": "ok"})
