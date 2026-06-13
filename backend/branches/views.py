from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import ProtectedError
from .models import Branch, Showroom, InventoryLocation
from .serializers import BranchSerializer, ShowroomSerializer, InventoryLocationSerializer
from config.cache import CacheResponseMixin

class BranchViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # 1. Fast pre-checks to avoid database locking during collection
        if hasattr(instance, 'sales_invoices') and instance.sales_invoices.exists():
            return Response(
                {"detail": "Cannot delete branch because it is referenced by active Sales Invoices."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if hasattr(instance, 'ledger_entries') and instance.ledger_entries.exists():
            return Response(
                {"detail": "Cannot delete branch because it contains ledger transactions."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if hasattr(instance, 'vehicle_units') and instance.vehicle_units.exists():
            return Response(
                {"detail": "Cannot delete branch because it has active vehicle units in stock."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete branch because it is referenced by other protected database records."},
                status=status.HTTP_400_BAD_REQUEST
            )

class ShowroomViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = Showroom.objects.all()
    serializer_class = ShowroomSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Pre-checks
        if hasattr(instance, 'vehicle_units') and instance.vehicle_units.exists():
            return Response(
                {"detail": "Cannot delete showroom because it has active vehicle units in stock."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete showroom because it is referenced by other protected records."},
                status=status.HTTP_400_BAD_REQUEST
            )

class InventoryLocationViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = InventoryLocation.objects.all()
    serializer_class = InventoryLocationSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Pre-checks
        if hasattr(instance, 'vehicle_units') and instance.vehicle_units.exists():
            return Response(
                {"detail": "Cannot delete inventory location because it has active vehicle units in stock."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if hasattr(instance, 'transfers_out') and instance.transfers_out.exists():
            return Response(
                {"detail": "Cannot delete inventory location because it is the source of active stock transfers."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if hasattr(instance, 'transfers_in') and instance.transfers_in.exists():
            return Response(
                {"detail": "Cannot delete inventory location because it is the destination of active stock transfers."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete inventory location because it is referenced by other protected records."},
                status=status.HTTP_400_BAD_REQUEST
            )
