from rest_framework import viewsets
from .models import LedgerEntry
from .serializers import LedgerEntrySerializer

class LedgerEntryViewSet(viewsets.ModelViewSet):
    queryset = LedgerEntry.objects.all().order_by('-created_at')
    serializer_class = LedgerEntrySerializer
    filterset_fields = ['ledger_type', 'branch']
