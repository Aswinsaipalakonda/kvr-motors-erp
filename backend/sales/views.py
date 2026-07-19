from rest_framework import viewsets
from .models import SalesInvoice
from .serializers import SalesInvoiceSerializer
from config.cache import CacheResponseMixin

class SalesInvoiceViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = SalesInvoiceSerializer
    filterset_fields = ['delivery_status', 'sales_executive', 'branch']

    def get_queryset(self):
        user = self.request.user
        queryset = SalesInvoice.objects.all().order_by('-sale_date')
        if user.is_authenticated and user.role not in ['admin', 'owner']:
            if hasattr(user, 'branch') and user.branch:
                queryset = queryset.filter(branch__name=user.branch)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        extra = {}
        if user.is_authenticated:
            if not serializer.validated_data.get('sales_executive'):
                extra['sales_executive'] = user
        serializer.save(**extra)
        self.clear_cache()

