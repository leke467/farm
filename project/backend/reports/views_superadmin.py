import uuid
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count, Q

from farms.models import Farm
from animals.models import Animal
from crops.models import Crop
from expenses.models import Revenue, Expense, DebtManagement
from .models import ContactMessage, Dispute
from subscriptions.models import Subscription, SubscriptionPlan, SubscriptionPayment
from .serializers import (
    ContactMessageSerializer,
    DisputeSerializer,
    SuperadminUserSerializer,
    SuperadminFarmSerializer,
    SuperadminSubscriptionSerializer,
    SuperadminPaymentSerializer,
)

User = get_user_model()


class IsSuperUserOrStaff(permissions.BasePermission):
    """Permission check strictly for platform superusers or staff members"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.is_staff)
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def public_contact_view(request):
    """Public endpoint for submitting contact form messages"""
    serializer = ContactMessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'message': 'Thank you! Your message has been received. Our team will contact you shortly.'
        }, status=status.HTTP_201_CREATED)
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsSuperUserOrStaff])
def superadmin_stats_view(request):
    """System-wide analytics and statistics for site administrators"""
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    staff_users = User.objects.filter(Q(is_staff=True) | Q(is_superuser=True)).count()
    
    total_farms = Farm.objects.count()
    active_farms = Farm.objects.filter(is_active=True).count() if hasattr(Farm, 'is_active') else total_farms
    
    total_animals = Animal.objects.count()
    total_crops = Crop.objects.count()
    
    unread_messages = ContactMessage.objects.filter(status='unread').count()
    total_messages = ContactMessage.objects.count()
    
    open_disputes = Dispute.objects.filter(status__in=['open', 'in_review']).count()
    total_disputes = Dispute.objects.count()
    
    total_revenue = Revenue.objects.aggregate(total=Sum('total_amount'))['total'] or 0
    total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
    total_debt = DebtManagement.objects.aggregate(total=Sum('remaining_balance'))['total'] or 0

    sub_revenue = SubscriptionPayment.objects.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
    active_subscriptions = Subscription.objects.filter(status='active').count()
    trial_subscriptions = Subscription.objects.filter(status='trial').count()
    cancelled_subscriptions = Subscription.objects.filter(status='cancelled').count()

    return Response({
        'users': {
            'total': total_users,
            'active': active_users,
            'staff': staff_users,
        },
        'farms': {
            'total': total_farms,
            'active': active_farms,
        },
        'agriculture': {
            'animals': total_animals,
            'crops': total_crops,
        },
        'communications': {
            'unread_messages': unread_messages,
            'total_messages': total_messages,
            'open_disputes': open_disputes,
            'total_disputes': total_disputes,
        },
        'finances': {
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'total_debt': float(total_debt),
        },
        'subscriptions': {
            'total_revenue': float(sub_revenue),
            'active': active_subscriptions,
            'trial': trial_subscriptions,
            'cancelled': cancelled_subscriptions,
        }
    })


class SuperadminUserListAPIView(generics.ListAPIView):
    """List all registered users for site administrators"""
    serializer_class = SuperadminUserSerializer
    permission_classes = [IsSuperUserOrStaff]

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return queryset


class SuperadminUserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update (toggle active/staff/superuser), or delete users"""
    serializer_class = SuperadminUserSerializer
    permission_classes = [IsSuperUserOrStaff]
    queryset = User.objects.all()

    def update(self, request, *args, **kwargs):
        user_obj = self.get_object()
        data = request.data.copy()

        # Only Superusers can grant or revoke Staff and Superuser roles
        if ('is_staff' in data or 'is_superuser' in data) and not request.user.is_superuser:
            return Response(
                {'detail': 'Only Superusers can grant or revoke Staff and Superuser roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update status flags if passed
        if 'is_active' in data:
            user_obj.is_active = bool(data['is_active'])
        if 'is_staff' in data and request.user.is_superuser:
            user_obj.is_staff = bool(data['is_staff'])
        if 'is_superuser' in data and request.user.is_superuser:
            user_obj.is_superuser = bool(data['is_superuser'])
            if user_obj.is_superuser:
                user_obj.is_staff = True
        if 'is_admin' in data:
            user_obj.is_admin = bool(data['is_admin'])
            
        # Password reset if provided
        if data.get('new_password'):
            user_obj.set_password(data['new_password'])

        user_obj.save()
        serializer = self.get_serializer(user_obj)
        return Response(serializer.data)


class SuperadminFarmListAPIView(generics.ListAPIView):
    """List all registered farms for site administrators"""
    serializer_class = SuperadminFarmSerializer
    permission_classes = [IsSuperUserOrStaff]

    def get_queryset(self):
        queryset = Farm.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(location__icontains=search) |
                Q(owner__email__icontains=search)
            )
        return queryset


class SuperadminDisputeListCreateAPIView(generics.ListCreateAPIView):
    """List all disputes (Superadmin/Authenticated) or Create a new Dispute (Any User)"""
    serializer_class = DisputeSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [IsSuperUserOrStaff()]

    def get_queryset(self):
        if self.request.user.is_superuser or self.request.user.is_staff:
            queryset = Dispute.objects.all()
        else:
            queryset = Dispute.objects.filter(reporter=self.request.user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        ticket_no = f"TICK-{uuid.uuid4().hex[:6].upper()}"
        serializer.save(
            reporter=self.request.user,
            ticket_number=ticket_no
        )


class SuperadminDisputeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve or update dispute status, resolution notes, or settle dispute"""
    serializer_class = DisputeSerializer
    permission_classes = [IsSuperUserOrStaff]
    queryset = Dispute.objects.all()

    def update(self, request, *args, **kwargs):
        dispute = self.get_object()
        data = request.data

        if 'status' in data:
            dispute.status = data['status']
            if data['status'] in ['resolved', 'closed'] and not dispute.resolved_at:
                dispute.resolved_at = timezone.now()
        if 'resolution_notes' in data:
            dispute.resolution_notes = data['resolution_notes']
        if 'priority' in data:
            dispute.priority = data['priority']

        dispute.save()
        serializer = self.get_serializer(dispute)
        return Response(serializer.data)


class SuperadminContactListAPIView(generics.ListAPIView):
    """List contact messages for superadmin inbox"""
    serializer_class = ContactMessageSerializer
    permission_classes = [IsSuperUserOrStaff]

    def get_queryset(self):
        queryset = ContactMessage.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-created_at')


class SuperadminContactDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Update contact message status or notes"""
    serializer_class = ContactMessageSerializer
    permission_classes = [IsSuperUserOrStaff]
    queryset = ContactMessage.objects.all()

    def update(self, request, *args, **kwargs):
        msg = self.get_object()
        data = request.data
        if 'status' in data:
            msg.status = data['status']
        if 'admin_notes' in data:
            msg.admin_notes = data['admin_notes']
        msg.save()
        serializer = self.get_serializer(msg)
        return Response(serializer.data)


class SuperadminSubscriptionListView(generics.ListAPIView):
    """List all platform subscriptions for superadmins"""
    serializer_class = SuperadminSubscriptionSerializer
    permission_classes = [IsSuperUserOrStaff]

    def get_queryset(self):
        queryset = Subscription.objects.all().order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class SuperadminPaymentListView(generics.ListAPIView):
    """List all subscription payments for superadmins"""
    serializer_class = SuperadminPaymentSerializer
    permission_classes = [IsSuperUserOrStaff]

    def get_queryset(self):
        queryset = SubscriptionPayment.objects.all().order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


@api_view(['POST'])
@permission_classes([IsSuperUserOrStaff])
def superadmin_manage_subscription(request):
    """
    Superadmin action endpoint to grant, upgrade, extend, or cancel a subscription for any user or farm.
    Payload:
    - user_id or farm_id (required)
    - action: 'grant' | 'cancel' | 'extend' (required)
    - plan_id: ID of SubscriptionPlan (optional for grant, defaults to Pro)
    - duration_days: default 30
    """
    data = request.data
    user_id = data.get('user_id')
    farm_id = data.get('farm_id')
    action = data.get('action', 'grant')
    duration_days = int(data.get('duration_days', 30))

    target_user = None
    if user_id:
        target_user = User.objects.filter(id=user_id).first()
    elif farm_id:
        farm = Farm.objects.filter(id=farm_id).first()
        if farm:
            target_user = farm.owner

    if not target_user:
        return Response({'detail': 'User or Farm not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Get plan
    plan_id = data.get('plan_id')
    plan = None
    if plan_id:
        plan = SubscriptionPlan.objects.filter(id=plan_id).first()
    if not plan:
        plan = SubscriptionPlan.objects.filter(name__icontains='Pro').first() or SubscriptionPlan.objects.first()

    today = timezone.now().date()
    sub, created = Subscription.objects.get_or_create(
        user=target_user,
        defaults={
            'plan': plan,
            'status': Subscription.Status.ACTIVE,
            'start_date': today,
            'end_date': today + timezone.timedelta(days=duration_days),
        }
    )

    if action == 'grant':
        sub.plan = plan
        sub.status = Subscription.Status.ACTIVE
        sub.start_date = today
        sub.end_date = today + timezone.timedelta(days=duration_days)
        sub.is_auto_renew = True
        sub.save()
        msg = f"Successfully granted {plan.name} plan to {target_user.username} for {duration_days} days."

    elif action == 'extend':
        if sub.end_date < today:
            sub.end_date = today + timezone.timedelta(days=duration_days)
        else:
            sub.end_date = sub.end_date + timezone.timedelta(days=duration_days)
        sub.status = Subscription.Status.ACTIVE
        sub.save()
        msg = f"Successfully extended subscription for {target_user.username} to {sub.end_date}."

    elif action == 'cancel':
        sub.status = Subscription.Status.CANCELLED
        sub.is_auto_renew = False
        sub.save()
        msg = f"Subscription for {target_user.username} has been cancelled."

    else:
        return Response({'detail': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'success': True,
        'message': msg,
        'subscription': SuperadminSubscriptionSerializer(sub).data
    })
