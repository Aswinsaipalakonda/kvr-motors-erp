from rest_framework import serializers
from .models import StockTransfer

class StockTransferSerializer(serializers.ModelSerializer):
    vin_number = serializers.CharField(source='vehicle_unit.vin_number', read_only=True)
    model_name = serializers.CharField(source='vehicle_unit.model.model_name', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)
    requester_name = serializers.CharField(source='requested_by.full_name', read_only=True)
    approver_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = StockTransfer
        fields = '__all__'
