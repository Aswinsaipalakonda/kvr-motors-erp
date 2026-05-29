from rest_framework import serializers
from .models import SalesInvoice

class SalesInvoiceSerializer(serializers.ModelSerializer):
    vin_number = serializers.CharField(source='vehicle_unit.vin_number', read_only=True)
    model_name = serializers.CharField(source='vehicle_unit.model.model_name', read_only=True)
    battery_serial = serializers.CharField(source='assigned_battery.serial_number', read_only=True)
    executive_name = serializers.CharField(source='sales_executive.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    delivery_status_display = serializers.CharField(source='get_delivery_status_display', read_only=True)

    class Meta:
        model = SalesInvoice
        fields = '__all__'
