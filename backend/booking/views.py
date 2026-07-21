from rest_framework import viewsets
from .models import AdvanceBooking
from .serializers import AdvanceBookingSerializer
from config.cache import CacheResponseMixin

class AdvanceBookingViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = AdvanceBookingSerializer
    filterset_fields = ['status', 'assigned_executive', 'pdi_verified']

    def get_queryset(self):
        user = self.request.user
        queryset = AdvanceBooking.objects.all().order_by('-booking_date')
        if user.is_authenticated and user.role not in ['admin', 'owner']:
            if hasattr(user, 'branch') and user.branch:
                queryset = queryset.filter(assigned_executive__branch=user.branch)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated:
            serializer.save(assigned_executive=user)
        else:
            serializer.save()
        self.clear_cache()

    def perform_update(self, serializer):
        serializer.save()
        self.clear_cache()

    def perform_destroy(self, instance):
        instance.delete()
        self.clear_cache()
