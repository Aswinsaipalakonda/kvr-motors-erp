from rest_framework import viewsets, permissions
from django.db.models import Q
from .models import ActivityLog
from .serializers import ActivityLogSerializer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return ActivityLog.objects.none()

        # 1. Owner & Admin see all activity logs
        if user.role in ('owner', 'admin') or user.is_staff or user.is_superuser:
            return ActivityLog.objects.all().select_related('user')

        # 2. Branch-scoped activity logs for supervisor, staff, sales, telecaller
        if getattr(user, 'branch', None):
            return ActivityLog.objects.filter(
                Q(user__branch=user.branch) | Q(user=user)
            ).select_related('user')

        # 3. Fallback to user's own activity logs
        return ActivityLog.objects.filter(user=user).select_related('user')
