from rest_framework import viewsets
from .models import AdvanceBooking
from .serializers import AdvanceBookingSerializer

class AdvanceBookingViewSet(viewsets.ModelViewSet):
    queryset = AdvanceBooking.objects.all().order_by('-booking_date')
    serializer_class = AdvanceBookingSerializer
    filterset_fields = ['status', 'assigned_executive', 'pdi_verified']
