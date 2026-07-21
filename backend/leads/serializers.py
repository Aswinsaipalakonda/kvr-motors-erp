from rest_framework import serializers
from .models import Lead

class LeadSerializer(serializers.ModelSerializer):
    interested_vehicle_name = serializers.CharField(source='interested_vehicle.model_name', read_only=True)
    executive_name = serializers.CharField(source='assigned_executive.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_lead_source_display', read_only=True)

    def validate(self, attrs):
        if 'interested_vehicle' not in attrs or not attrs.get('interested_vehicle'):
            from vehicles.models import VehicleModel
            first_vm = VehicleModel.objects.first()
            if not first_vm:
                first_vm = VehicleModel.objects.create(model_name="KVR Standard EV", code="KVR-STD-EV", base_price=75000)
            attrs['interested_vehicle'] = first_vm
        return super().validate(attrs)

    class Meta:
        model = Lead
        fields = '__all__'


    def validate_contact_number(self, value):
        import re
        if value:
            cleaned = re.sub(r'\D', '', value)
            if len(cleaned) != 10:
                raise serializers.ValidationError("Contact number must contain exactly 10 digits.")
            return cleaned
        return value

