from rest_framework import viewsets
from .models import StockTransfer
from .serializers import StockTransferSerializer
from config.cache import CacheResponseMixin

class StockTransferViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = StockTransferSerializer
    filterset_fields = ['status', 'requested_by']

    def get_queryset(self):
        user = self.request.user
        queryset = StockTransfer.objects.all().order_by('-created_at')
        if user.is_authenticated and user.role not in ['admin', 'owner']:
            if hasattr(user, 'branch') and user.branch:
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(from_location__branch__name=user.branch) | 
                    Q(to_location__branch__name=user.branch)
                )
        return queryset

