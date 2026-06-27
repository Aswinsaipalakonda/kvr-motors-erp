from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.core.cache import cache
import datetime

from .models import MelaVehicleStock, MelaBatteryStock, MelaVehicleBatteryCompatibility, MelaBooking, MelaSettings, MelaInventory
from .serializers import (
    MelaVehicleStockSerializer, MelaBatteryStockSerializer,
    MelaVehicleBatteryCompatibilitySerializer, MelaBookingSerializer,
    MelaSettingsSerializer, MelaInventorySerializer
)
from branches.models import Branch
from ledger.models import LedgerEntry
from django.contrib.auth import get_user_model

User = get_user_model()

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
        print(f"Failed to clear cache: {e}")
        try:
            cache.clear()
        except:
            pass


class MelaVehicleStockViewSet(viewsets.ModelViewSet):
    serializer_class = MelaVehicleStockSerializer
    queryset = MelaVehicleStock.objects.all().order_by('vehicle_model__model_name')
    filterset_fields = ['vehicle_model', 'color', 'is_active']

    def create(self, request, *args, **kwargs):
        color_str = request.data.get('color', '').strip()
        if not color_str:
            return Response({"color": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        
        # Split color by comma
        colors = [c.strip() for c in color_str.split(',') if c.strip()]
        if not colors:
            return Response({"color": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
        model_name = request.data.get('model_name', '').strip()
        
        # Automatically lookup vehicle_model by name if not provided
        vehicle_model_id = request.data.get('vehicle_model')
        if model_name and not vehicle_model_id:
            from vehicles.models import VehicleModel
            vehicle_model = VehicleModel.objects.filter(model_name__iexact=model_name).first()
            if vehicle_model:
                vehicle_model_id = vehicle_model.id

        created_instances = []
        all_errors = []

        try:
            with transaction.atomic():
                for color in colors:
                    color_data = request.data.copy()
                    color_data['color'] = color
                    if vehicle_model_id:
                        color_data['vehicle_model'] = vehicle_model_id
                        
                    serializer = self.get_serializer(data=color_data)
                    if serializer.is_valid():
                        instance = serializer.save()
                        created_instances.append(instance)
                    else:
                        # Collect and structure the error message
                        for field, errs in serializer.errors.items():
                            all_errors.append(f"{color}: {field} - {', '.join(errs)}")
                        raise ValueError("Validation failed")
        except ValueError:
            # transaction rollback is automatic
            return Response({"error": " | ".join(all_errors)}, status=status.HTTP_400_BAD_REQUEST)

        # Clear Mela cache
        clear_mela_cache(["mela"])

        # Return serialized first created instance to preserve single-object signature
        serializer = self.get_serializer(created_instances[0])
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        super().perform_create(serializer)
        clear_mela_cache(["mela"])

    def perform_update(self, serializer):
        super().perform_update(serializer)
        clear_mela_cache(["mela"])

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        clear_mela_cache(["mela"])


class MelaBatteryStockViewSet(viewsets.ModelViewSet):
    serializer_class = MelaBatteryStockSerializer
    queryset = MelaBatteryStock.objects.all().order_by('battery_name')
    filterset_fields = ['is_active']

    def perform_create(self, serializer):
        super().perform_create(serializer)
        clear_mela_cache(["mela"])

    def perform_update(self, serializer):
        super().perform_update(serializer)
        clear_mela_cache(["mela"])

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        clear_mela_cache(["mela"])


class MelaVehicleBatteryCompatibilityViewSet(viewsets.ModelViewSet):
    serializer_class = MelaVehicleBatteryCompatibilitySerializer
    queryset = MelaVehicleBatteryCompatibility.objects.all()
    filterset_fields = ['vehicle_stock', 'battery_stock']

    def perform_create(self, serializer):
        super().perform_create(serializer)
        clear_mela_cache(["mela"])

    def perform_update(self, serializer):
        super().perform_update(serializer)
        clear_mela_cache(["mela"])

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        clear_mela_cache(["mela"])


# Keep a mock MelaInventoryViewSet to preserve routing backward compatibility
class MelaInventoryViewSet(viewsets.ModelViewSet):
    serializer_class = MelaInventorySerializer
    queryset = MelaInventory.objects.all()
    filterset_fields = ['vehicle_model', 'color', 'battery_type', 'is_active']


class MelaBookingViewSet(viewsets.ModelViewSet):
    serializer_class = MelaBookingSerializer
    filterset_fields = ['status', 'sales_executive', 'booking_id']

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return MelaBooking.objects.none()
        
        if user.role in ['owner', 'admin']:
            queryset = MelaBooking.objects.all()
        else:
            queryset = MelaBooking.objects.filter(sales_executive=user)

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
        clear_mela_cache(["mela"])

    def perform_update(self, serializer):
        super().perform_update(serializer)
        clear_mela_cache(["mela"])

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        clear_mela_cache(["mela"])

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_booking(self, request, pk=None):
        booking = self.get_object()
        if booking.status != 'unconfirmed':
            return Response(
                {"error": f"Booking is already '{booking.status}' and cannot be completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_type = request.data.get('payment_type', 'cash').lower()
        if payment_type not in ['cash', 'upi', 'card', 'bajaj_finance']:
            return Response(
                {"error": "Invalid payment type. Choose Cash, UPI, Card, or Bajaj Finance."},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_proof = request.FILES.get('payment_proof')
        if payment_type != 'cash' and not payment_proof:
            return Response(
                {"error": f"Payment proof screenshot is required for {payment_type.upper()} payments."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            booking.status = 'completed'
            booking.cash_collected = booking.price
            booking.completed_at = timezone.now()
            booking.payment_type = payment_type
            if payment_proof:
                booking.payment_proof = payment_proof
            booking.save()

            # Record automated entry in LedgerEntry
            branch_obj = None
            if booking.sales_executive and booking.sales_executive.branch:
                branch_obj = Branch.objects.filter(name__iexact=booking.sales_executive.branch).first()
            if not branch_obj:
                branch_obj = Branch.objects.first()

            payment_mode_map = {
                'cash': 'Cash',
                'upi': 'UPI',
                'card': 'Card',
                'bajaj_finance': 'Bajaj Finance'
            }
            payment_mode_lbl = payment_mode_map.get(payment_type, 'Cash')

            if branch_obj:
                LedgerEntry.objects.create(
                    ledger_type='sales_income',
                    branch=branch_obj,
                    detail=f"Mela Campaign Checkout (Booking: {booking.booking_id}, Customer: {booking.customer_name})",
                    income=booking.price,
                    expense=0.00,
                    payment_mode=payment_mode_lbl,
                    approved_by=request.user
                )

        clear_mela_cache(["mela"])
        serializer = self.get_serializer(booking)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MelaReportsView(APIView):
    def get(self, request):
        user = request.user
        if not user.is_authenticated or user.role not in ['owner', 'admin', 'supervisor']:
            return Response({"error": "Unauthorized to view Mela campaign reports."}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.localdate()

        total_bookings = MelaBooking.objects.count()
        unconfirmed_bookings = MelaBooking.objects.filter(status='unconfirmed').count()
        completed_bookings = MelaBooking.objects.filter(status__in=['completed', 'delivered']).count()
        cancelled_bookings = MelaBooking.objects.filter(status='cancelled').count()

        total_sales_revenue = MelaBooking.objects.filter(status__in=['completed', 'delivered']).aggregate(total=Sum('price'))['total'] or 0.0
        daily_sales_revenue = MelaBooking.objects.filter(
            status__in=['completed', 'delivered'],
            completed_at__date=today
        ).aggregate(total=Sum('price'))['total'] or 0.0

        daily_completed_count = MelaBooking.objects.filter(
            status__in=['completed', 'delivered'],
            completed_at__date=today
        ).count()

        executives = User.objects.filter(role__in=['sales_executive', 'sales'])
        exec_performance = []
        for exe in executives:
            bookings_count = MelaBooking.objects.filter(sales_executive=exe).count()
            completed_count = MelaBooking.objects.filter(sales_executive=exe, status__in=['completed', 'delivered']).count()
            revenue = MelaBooking.objects.filter(sales_executive=exe, status__in=['completed', 'delivered']).aggregate(total=Sum('price'))['total'] or 0.0
            
            exec_performance.append({
                "id": exe.id,
                "full_name": exe.full_name or exe.username,
                "username": exe.username,
                "total_bookings": bookings_count,
                "completed_bookings": completed_count,
                "total_revenue": float(revenue),
            })

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
        clear_mela_cache(["mela"])

    def perform_update(self, serializer):
        super().perform_update(serializer)
        clear_mela_cache(["mela"])

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        clear_mela_cache(["mela"])
