from rest_framework import viewsets
from .models import SalesInvoice
from .serializers import SalesInvoiceSerializer
from config.cache import CacheResponseMixin

class SalesInvoiceViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = SalesInvoice.objects.all().order_by('-sale_date')
    serializer_class = SalesInvoiceSerializer
    filterset_fields = ['delivery_status', 'sales_executive', 'branch']

