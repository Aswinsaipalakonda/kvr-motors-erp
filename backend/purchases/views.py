from rest_framework import viewsets
from .models import PurchaseOrder
from .serializers import PurchaseOrderSerializer

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-order_date')
    serializer_class = PurchaseOrderSerializer
    filterset_fields = ['status']
