from rest_framework import serializers
from .models import Battery, FifoOverride

class BatterySerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Battery
        fields = '__all__'

class FifoOverrideSerializer(serializers.ModelSerializer):
    battery_serial = serializers.CharField(source='battery.serial_number', read_only=True)
    battery_capacity = serializers.CharField(source='battery.capacity', read_only=True)
    
    class Meta:
        model = FifoOverride
        fields = '__all__'
