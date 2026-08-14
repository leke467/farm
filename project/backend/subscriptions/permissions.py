from rest_framework import permissions
from .services import get_user_subscription

class IsSubscriptionActive(permissions.BasePermission):
    """
    Strict server-side permission check enforcing subscription payments:
    - Platform Superusers and Staff members are exempt.
    - If a user's subscription has expired or been cancelled, write operations (POST, PUT, PATCH, DELETE)
      are hard-blocked on the Django server with HTTP 403 / HTTP 402 Payment Required.
    """
    message = "Your farm subscription has expired. Please select a plan and renew your subscription to perform operational actions."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Superusers and staff members are exempt from subscription fees
        if user.is_superuser or user.is_staff:
            return True

        # SAFE_METHODS (GET, HEAD, OPTIONS) allow viewing, but all mutation operations (POST, PUT, PATCH, DELETE)
        # require an active or valid trial subscription on the server.
        if request.method in permissions.SAFE_METHODS:
            return True

        sub = get_user_subscription(user)
        if not sub or not sub.is_active_subscription():
            return False

        return True
