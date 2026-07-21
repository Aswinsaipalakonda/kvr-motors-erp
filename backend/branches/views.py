from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django.db.models import ProtectedError, Q
from .models import Branch, Showroom, InventoryLocation, BranchCashDeposit, BranchExpense, IssueReport
from .serializers import (
    BranchSerializer,
    ShowroomSerializer,
    InventoryLocationSerializer,
    BranchCashDepositSerializer,
    BranchExpenseSerializer,
    IssueReportSerializer
)
from config.cache import CacheResponseMixin

class BranchViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
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

class BranchCashDepositViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = BranchCashDeposit.objects.all()
    serializer_class = BranchCashDepositSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return BranchCashDeposit.objects.none()
        if user.role in ('owner', 'admin') or user.is_staff or user.is_superuser:
            return BranchCashDeposit.objects.all()
        if getattr(user, 'branch', None):
            return BranchCashDeposit.objects.filter(branch__name=user.branch)
        return BranchCashDeposit.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(deposited_by=user)
        self.clear_cache()

class BranchExpenseViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = BranchExpense.objects.all()
    serializer_class = BranchExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return BranchExpense.objects.none()
        if user.role in ('owner', 'admin') or user.is_staff or user.is_superuser:
            return BranchExpense.objects.all()
        if getattr(user, 'branch', None):
            return BranchExpense.objects.filter(branch__name=user.branch)
        return BranchExpense.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(submitted_by=user)
        self.clear_cache()

class IssueReportViewSet(viewsets.ModelViewSet):
    """No caching — issue reports are real-time critical data for owner notifications."""
    queryset = IssueReport.objects.all()
    serializer_class = IssueReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return IssueReport.objects.none()
        if user.role in ('owner', 'admin') or user.is_staff or user.is_superuser:
            return IssueReport.objects.all()
        if getattr(user, 'branch', None):
            return IssueReport.objects.filter(Q(branch__name=user.branch) | Q(reported_by=user))
        return IssueReport.objects.filter(reported_by=user)

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

    def perform_update(self, serializer):
        user = self.request.user
        # Auto-set resolved_by when status is being marked resolved
        if serializer.validated_data.get('status') == 'resolved':
            serializer.save(resolved_by=user)
        else:
            serializer.save()
