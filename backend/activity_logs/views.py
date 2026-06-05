from rest_framework import viewsets, permissions
from .models import ActivityLog
from .serializers import ActivityLogSerializer

class IsAdminOrOwner(permissions.BasePermission):
    """
    Permission class that only allows users with role 'admin' or 'owner'
    to access the endpoint.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Request user should be admin or owner
        return request.user.role in ('admin', 'owner')

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().select_related('user')
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminOrOwner]
