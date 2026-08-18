import datetime
from django.utils import timezone
from .models import SubscriptionPlan, Subscription, SubscriptionPayment
from .gateway import MonnifyGateway

def create_subscription_payment(user, plan_id, idempotency_key, redirect_url=''):
    plan = SubscriptionPlan.objects.get(id=plan_id)
    
    # The free trial is strictly available once per account
    if plan.price == 0 or plan.slug == 'free-trial':
        has_existing = Subscription.objects.filter(user=user).exists()
        if has_existing:
            raise Exception("The 14-day free trial is only available once per account. Please select a paid plan.")

    payment_reference = f"sub_{user.id}_{idempotency_key}"
    
    payment = SubscriptionPayment.objects.create(
        user=user,
        plan=plan,
        amount=plan.price,
        idempotency_key=idempotency_key,
        payment_reference=payment_reference
    )
    
    if not redirect_url:
        redirect_url = f"http://localhost:5173/subscription?reference={payment_reference}"

    gateway = MonnifyGateway()
    result = gateway.initialize_transaction(
        amount=plan.price,
        customer_name=user.get_full_name() or user.username,
        customer_email=user.email,
        payment_reference=payment_reference,
        payment_description=f"Subscription to {plan.name}",
        redirect_url=redirect_url,
    )
    
    if result.get('success'):
        payment.provider_reference = result.get('transaction_reference', '')
        payment.status = SubscriptionPayment.Status.INITIATED
        payment.save(update_fields=['provider_reference', 'status'])
        return {
            "payment_reference": payment_reference,
            "checkout_url": result.get("checkout_url")
        }
    else:
        payment.status = SubscriptionPayment.Status.FAILED
        payment.save(update_fields=['status'])
        raise Exception(result.get("error_message", "Payment initialization failed"))

def confirm_payment(payment_reference):
    payment = SubscriptionPayment.objects.filter(payment_reference=payment_reference).first()
    if not payment:
        raise Exception("Payment not found")
        
    if payment.status == SubscriptionPayment.Status.PAID:
        return payment

    gateway = MonnifyGateway()
    result = gateway.verify_transaction(payment_reference)
    
    if result.get("success") and result.get("payment_status") in ("PAID", "SUCCESS", "OVERPAID"):
        payment.status = SubscriptionPayment.Status.PAID
        payment.captured_at = timezone.now()
        
        # Determine start and end dates
        start_date = timezone.now().date()
        end_date = start_date + datetime.timedelta(days=payment.plan.duration_days)
        
        # Create or update subscription
        subscription = Subscription.objects.create(
            user=payment.user,
            plan=payment.plan,
            status=Subscription.Status.ACTIVE,
            start_date=start_date,
            end_date=end_date,
            is_auto_renew=True
        )
        
        payment.subscription = subscription
        payment.save(update_fields=['status', 'captured_at', 'subscription'])
        return payment
    else:
        payment.status = SubscriptionPayment.Status.FAILED
        payment.save(update_fields=['status'])
        raise Exception("Payment verification failed or payment not successful")

def get_user_subscription(user, farm_id=None):
    today = timezone.now().date()

    if not user or not hasattr(user, 'id'):
        return None

    try:
        from farms.models import Farm, FarmMember
        from django.db.models import Q

        farm_ids = list(FarmMember.objects.filter(user=user).values_list('farm_id', flat=True))
        if farm_id:
            try:
                farm_ids.append(int(farm_id))
            except (ValueError, TypeError):
                clean_slug = str(farm_id).strip().replace('-', ' ')
                farm_obj = Farm.objects.filter(
                    Q(name__iexact=clean_slug) | Q(name__icontains=clean_slug) | Q(owner=user)
                ).first()
                if farm_obj:
                    farm_ids.append(farm_obj.id)

        farms = Farm.objects.filter(Q(id__in=farm_ids) | Q(owner=user))
        owner_ids = list(farms.values_list('owner_id', flat=True))
        if user.id not in owner_ids:
            owner_ids.append(user.id)

        # Fetch latest subscription for farm owner
        latest_sub = Subscription.objects.filter(
            user_id__in=owner_ids
        ).order_by('-created_at').first()

        if latest_sub:
            if latest_sub.end_date < today and latest_sub.status in (Subscription.Status.ACTIVE, Subscription.Status.TRIAL):
                latest_sub.status = Subscription.Status.EXPIRED
                latest_sub.save(update_fields=['status', 'updated_at'])
            return latest_sub
    except Exception as e:
        pass

    # Direct user subscription check
    sub = Subscription.objects.filter(user=user).order_by('-created_at').first()
    if sub:
        if sub.end_date < today and sub.status in (Subscription.Status.ACTIVE, Subscription.Status.TRIAL):
            sub.status = Subscription.Status.EXPIRED
            sub.save(update_fields=['status', 'updated_at'])
        return sub

    # Auto-create 14-Day Free Trial ONLY if no subscription record exists at all
    trial_plan = SubscriptionPlan.objects.filter(slug='free-trial').first() or SubscriptionPlan.objects.filter(is_active=True).order_by('price').first()
    if trial_plan:
        start_date = user.date_joined.date() if hasattr(user, 'date_joined') and user.date_joined else timezone.now().date()
        end_date = start_date + datetime.timedelta(days=trial_plan.trial_days or 14)
        status_val = Subscription.Status.TRIAL if end_date >= timezone.now().date() else Subscription.Status.EXPIRED
        
        sub = Subscription.objects.create(
            user=user,
            plan=trial_plan,
            status=status_val,
            start_date=start_date,
            end_date=end_date,
            is_auto_renew=False
        )
        return sub

    return None


def cancel_subscription(user):
    sub = get_user_subscription(user)
    if sub:
        sub.status = Subscription.Status.CANCELLED
        sub.is_auto_renew = False
        sub.save(update_fields=['status', 'is_auto_renew', 'updated_at'])
        return sub
    return None
