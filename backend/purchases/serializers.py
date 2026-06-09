from rest_framework import serializers
from .models import PurchaseOrder

class PurchaseOrderSerializer(serializers.ModelSerializer):
    po_number = serializers.CharField(required=False, allow_blank=True)
    vehicle_model_name = serializers.CharField(source='vehicle_model.model_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'

