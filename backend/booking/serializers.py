from rest_framework import serializers
from .models import AdvanceBooking

class AdvanceBookingSerializer(serializers.ModelSerializer):
    vehicle_model_name = serializers.CharField(source='vehicle_model.model_name', read_only=True)
    vin_number = serializers.CharField(source='vehicle_unit.vin_number', read_only=True)
    executive_name = serializers.CharField(source='assigned_executive.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pdi_display = serializers.CharField(source='get_pdi_verified_display', read_only=True)

    class Meta:
        model = AdvanceBooking
        fields = '__all__'
