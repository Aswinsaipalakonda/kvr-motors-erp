from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.core.cache import cache
import datetime

from .models import MelaInventory, MelaBooking, MelaSettings
from .serializers import MelaInventorySerializer, MelaBookingSerializer, MelaSettingsSerializer
from branches.models import Branch
from ledger.models import LedgerEntry
from django.contrib.auth import get_user_model

User = get_user_model()

def get_cache_key(prefix, query_params=None, user_id=None):
    parts = [prefix]
    if user_id:
        parts.append(f"user_{user_id}")
    if query_params:
        # Sort query params to ensure consistent key name
        sorted_params = sorted(query_params.items())
        param_str = "&".join([f"{k}={v}" for k, v in sorted_params])
        parts.append(param_str)
    return ":".join(parts)

def clear_mela_cache(prefixes):
    try:
        real_cache = cache._connections[cache._alias]
        if hasattr(real_cache, '_cache') and hasattr(real_cache._cache, 'get_client'):
            client = real_cache._cache.get_client()
            for prefix in prefixes:
                keys = client.keys(f"*{prefix}*")
                if keys:
                    client.delete(*keys)
        else:
            cache.clear()
    except Exception as e:
        print(f"Failed to clear cache by prefix: {e}")
        try:
            cache.clear()
        except:
            pass

class MelaInventoryViewSet(viewsets.ModelViewSet):
    serializer_class = MelaInventorySerializer
    filterset_fields = ['vehicle_model', 'color', 'battery_type', 'is_active']

    def get_queryset(self):
        queryset = MelaInventory.objects.all()
        
        vehicle_model = self.request.query_params.get('vehicle_model')
        if vehicle_model:
            queryset = queryset.filter(vehicle_model_id=vehicle_model)
            
        color = self.request.query_params.get('color')
        if color:
            queryset = queryset.filter(color__iexact=color)
            
        battery_type = self.request.query_params.get('battery_type')
        if battery_type:
            queryset = queryset.filter(battery_type=battery_type)
            
        is_active = self.request.query_params.get('is_active')
        if is_active:
            is_active_bool = is_active.lower() in ['true', '1']
            queryset = queryset.filter(is_active=is_active_bool)
            
        return queryset.order_by('vehicle_model__model_name')

    def perform_create(self, serializer):
        super().perform_create(serializer)
        clear_mela_cache(["mela_inventory_list", "mela_reports"])

    def perform_update(self, serializer):
        super().perform_update(serializer)
        clear_mela_cache(["mela_inventory_list", "mela_reports"])

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        clear_mela_cache(["mela_inventory_list", "mela_reports"])


class MelaBookingViewSet(viewsets.ModelViewSet):
    serializer_class = MelaBookingSerializer
    filterset_fields = ['status', 'sales_executive', 'booking_id']

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return MelaBooking.objects.none()
        
        # Base queryset based on role
        if user.role in ['owner', 'admin']:
            queryset = MelaBooking.objects.all()
        else:
            queryset = MelaBooking.objects.filter(sales_executive=user)

        # Manual query parameters filtering
        booking_id = self.request.query_params.get('booking_id')
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        sales_executive_filter = self.request.query_params.get('sales_executive')
        if sales_executive_filter:
            queryset = queryset.filter(sales_executive_id=sales_executive_filter)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        super().perform_create(serializer)
        clear_mela_cache(["mela_bookings_list", "mela_inventory_list", "mela_reports"])

    def perform_update(self, serializer):
        super().perform_update(serializer)
        clear_mela_cache(["mela_bookings_list", "mela_inventory_list", "mela_reports"])

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        clear_mela_cache(["mela_bookings_list", "mela_inventory_list", "mela_reports"])

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_booking(self, request, pk=None):
        booking = self.get_object()
        if booking.status != 'unconfirmed':
            return Response(
                {"error": f"Booking is already '{booking.status}' and cannot be completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            booking.status = 'completed'
            booking.cash_collected = booking.price
            booking.completed_at = timezone.now()
            booking.save()

            # Record automated entry in LedgerEntry
            branch_obj = None
            if booking.sales_executive and booking.sales_executive.branch:
                branch_obj = Branch.objects.filter(name__iexact=booking.sales_executive.branch).first()
            if not branch_obj:
                branch_obj = Branch.objects.first()

            if branch_obj:
                # Ledger entries generated here are verified for cash collection
                LedgerEntry.objects.create(
                    ledger_type='sales_income',
                    branch=branch_obj,
                    detail=f"Cash Collection for Mela Booking: {booking.booking_id} (Customer: {booking.customer_name})",
                    income=booking.price,
                    expense=0.00,
                    payment_mode='Cash',
                    approved_by=request.user
                )

        clear_mela_cache(["mela_bookings_list", "mela_inventory_list", "mela_reports"])
        serializer = self.get_serializer(booking)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MelaReportsView(APIView):
    def get(self, request):
        user = request.user
        # Allow owner, admin or supervisor to view report statistics
        if not user.is_authenticated or user.role not in ['owner', 'admin', 'supervisor']:
            return Response({"error": "Unauthorized to view Mela campaign reports."}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.localdate()

        # Summary calculations
        total_bookings = MelaBooking.objects.count()
        unconfirmed_bookings = MelaBooking.objects.filter(status='unconfirmed').count()
        completed_bookings = MelaBooking.objects.filter(status='completed').count()
        cancelled_bookings = MelaBooking.objects.filter(status='cancelled').count()

        total_sales_revenue = MelaBooking.objects.filter(status='completed').aggregate(total=Sum('price'))['total'] or 0.0
        daily_sales_revenue = MelaBooking.objects.filter(
            status='completed',
            completed_at__date=today
        ).aggregate(total=Sum('price'))['total'] or 0.0

        daily_completed_count = MelaBooking.objects.filter(
            status='completed',
            completed_at__date=today
        ).count()

        # Leaderboard calculation across sales executives (supporting 'sales', 'sales_executive', 'owner', 'admin', and 'supervisor' roles)
        executives = User.objects.filter(role__in=['sales_executive', 'sales', 'owner', 'admin', 'supervisor'])
        exec_performance = []
        for exe in executives:
            bookings_count = MelaBooking.objects.filter(sales_executive=exe).count()
            completed_count = MelaBooking.objects.filter(sales_executive=exe, status='completed').count()
            revenue = MelaBooking.objects.filter(sales_executive=exe, status='completed').aggregate(total=Sum('price'))['total'] or 0.0
            
            exec_performance.append({
                "id": exe.id,
                "full_name": exe.full_name or exe.username,
                "username": exe.username,
                "total_bookings": bookings_count,
                "completed_bookings": completed_count,
                "total_revenue": float(revenue),
            })

        # Order by completed bookings desc
        exec_performance.sort(key=lambda x: x['completed_bookings'], reverse=True)

        data = {
            "summary": {
                "total_bookings": total_bookings,
                "unconfirmed_bookings": unconfirmed_bookings,
                "completed_bookings": completed_bookings,
                "cancelled_bookings": cancelled_bookings,
                "total_sales_revenue": float(total_sales_revenue),
                "daily_sales_revenue": float(daily_sales_revenue),
                "daily_completed_count": daily_completed_count,
            },
            "executive_performance": exec_performance,
        }

        return Response(data, status=status.HTTP_200_OK)


class MelaSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = MelaSettingsSerializer
    queryset = MelaSettings.objects.all()

    def perform_create(self, serializer):
        super().perform_create(serializer)
        clear_mela_cache(["mela_settings_list", "mela_reports"])

    def perform_update(self, serializer):
        super().perform_update(serializer)
        clear_mela_cache(["mela_settings_list", "mela_reports"])

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        clear_mela_cache(["mela_settings_list", "mela_reports"])
