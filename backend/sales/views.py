from rest_framework import viewsets
from .models import SalesInvoice
from .serializers import SalesInvoiceSerializer

class SalesInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SalesInvoice.objects.all().order_by('-sale_date')
    serializer_class = SalesInvoiceSerializer
    filterset_fields = ['delivery_status', 'sales_executive', 'branch']
