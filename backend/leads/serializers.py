from rest_framework import serializers
from .models import Lead

class LeadSerializer(serializers.ModelSerializer):
    interested_vehicle_name = serializers.CharField(source='interested_vehicle.model_name', read_only=True)
    executive_name = serializers.CharField(source='assigned_executive.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_lead_source_display', read_only=True)

    class Meta:
        model = Lead
        fields = '__all__'
