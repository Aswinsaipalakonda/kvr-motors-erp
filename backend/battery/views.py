from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Battery, FifoOverride
from .serializers import BatterySerializer, FifoOverrideSerializer
from config.cache import CacheResponseMixin

class BatteryViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = BatterySerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Battery.objects.all()
        if user.is_authenticated and user.role not in ['admin', 'owner']:
            if hasattr(user, 'branch') and user.branch:
                queryset = queryset.filter(location__branch__name=user.branch)
        return queryset

    @action(detail=False, methods=['get'], url_path='check-fifo')
    def check_fifo(self, request):
        """
        Validates if a given battery is the oldest available battery for its capacity and location.
        """
        serial = request.query_params.get('serial', '').strip()
        if not serial:
            return Response(
                {"error": "Please provide a battery serial query parameter 'serial'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        battery = Battery.objects.filter(serial_number__iexact=serial).first()
        if not battery:
            return Response(
                {"error": f"Battery with serial '{serial}' not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        if battery.status != 'available':
            return Response(
                {"is_oldest": False, "status": battery.status, "message": "Battery is not currently available for dispatch."},
                status=status.HTTP_200_OK
            )

        # Get the oldest available battery at the same location and capacity
        oldest_battery = Battery.objects.filter(
            location=battery.location,
            capacity=battery.capacity,
            status='available'
        ).order_by('purchase_date').first()

        if oldest_battery and oldest_battery.id != battery.id:
            return Response({
                "is_oldest": False,
                "oldest_serial_number": oldest_battery.serial_number,
                "purchase_date": oldest_battery.purchase_date,
                "warning": f"FIFO Warning: Battery '{oldest_battery.serial_number}' (purchased on {oldest_battery.purchase_date}) is older than '{battery.serial_number}' and should be dispatched first."
            }, status=status.HTTP_200_OK)

        return Response({
            "is_oldest": True,
            "message": "Perfect! This is the oldest available battery and matches FIFO guidelines."
        }, status=status.HTTP_200_OK)

class FifoOverrideViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = FifoOverrideSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = FifoOverride.objects.all().order_by('-created_at')
        if user.is_authenticated and user.role not in ['admin', 'owner']:
            if hasattr(user, 'branch') and user.branch:
                queryset = queryset.filter(battery__location__branch__name=user.branch)
        return queryset
