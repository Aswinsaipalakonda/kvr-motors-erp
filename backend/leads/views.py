from rest_framework import viewsets
from .models import Lead
from .serializers import LeadSerializer
from config.cache import CacheResponseMixin

class LeadViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    filterset_fields = ['status', 'lead_source', 'assigned_executive']

    def get_queryset(self):
        user = self.request.user
        queryset = Lead.objects.all().order_by('-created_at')
        if user.is_authenticated and user.role not in ['admin', 'owner']:
            if hasattr(user, 'branch') and user.branch:
                queryset = queryset.filter(branch=user.branch)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        branch = None
        if user.is_authenticated:
            assigned_exec = serializer.validated_data.get('assigned_executive')
            if assigned_exec and hasattr(assigned_exec, 'branch') and assigned_exec.branch:
                branch = assigned_exec.branch
            elif hasattr(user, 'branch') and user.branch:
                branch = user.branch
        serializer.save(branch=branch)
        self.clear_cache()

