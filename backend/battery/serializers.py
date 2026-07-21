from rest_framework import serializers
from .models import Battery, FifoOverride

class BatterySerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    def validate(self, attrs):
        if 'location' not in attrs or not attrs.get('location'):
            from branches.models import InventoryLocation, Branch, Showroom
            first_loc = InventoryLocation.objects.first()
            if not first_loc:
                branch, _ = Branch.objects.get_or_create(name="KVR Motors Main", defaults={"code": "KVR-MAIN"})
                showroom, _ = Showroom.objects.get_or_create(branch=branch, name="Main Showroom")
                first_loc = InventoryLocation.objects.create(branch=branch, showroom=showroom, name="Main Warehouse")
            attrs['location'] = first_loc
        return super().validate(attrs)

    class Meta:
        model = Battery
        fields = '__all__'


class FifoOverrideSerializer(serializers.ModelSerializer):
    battery_serial = serializers.CharField(source='battery.serial_number', read_only=True)
    battery_capacity = serializers.CharField(source='battery.capacity', read_only=True)
    
    class Meta:
        model = FifoOverride
        fields = '__all__'
