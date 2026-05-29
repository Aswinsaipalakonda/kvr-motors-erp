from rest_framework import serializers
from .models import Battery

class BatterySerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Battery
        fields = '__all__'
