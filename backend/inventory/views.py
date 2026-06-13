from rest_framework import viewsets
from .models import StockTransfer
from .serializers import StockTransferSerializer
from config.cache import CacheResponseMixin

class StockTransferViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = StockTransfer.objects.all().order_by('-created_at')
    serializer_class = StockTransferSerializer
    filterset_fields = ['status', 'requested_by']

