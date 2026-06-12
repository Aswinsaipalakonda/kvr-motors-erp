from rest_framework import serializers
from .models import StockTransfer
from vehicles.models import VehicleUnit
import datetime
import random

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

    def validate(self, data):
        vehicle_unit = data.get('vehicle_unit')
        from_location = data.get('from_location')
        
        # 1. On creation, validate from_location matches vehicle unit current location
        if not self.instance:
            if vehicle_unit and from_location and vehicle_unit.location != from_location:
                raise serializers.ValidationError({
                    "from_location": f"Selected vehicle unit is located at '{vehicle_unit.location.name}', not '{from_location.name}'."
                })
            
            if vehicle_unit and vehicle_unit.stock_status != 'available':
                raise serializers.ValidationError({
                    "vehicle_unit": f"Vehicle unit is not available for transfer (current status: {vehicle_unit.get_stock_status_display()})."
                })
        return data

    def create(self, validated_data):
        if not validated_data.get('transfer_id'):
            validated_data['transfer_id'] = f"TRF-{datetime.date.today().strftime('%Y')}-{random.randint(10000, 99999)}"
            
        instance = super().create(validated_data)
        return instance

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Save modifications
        instance = super().update(instance, validated_data)
        
        # Synchronize vehicle unit status and location fields
        if old_status != new_status:
            vu = instance.vehicle_unit
            
            if new_status in ['approved', 'in_transit']:
                vu.stock_status = 'in_transit'
                vu.save()
            elif new_status == 'received':
                # Complete the transfer
                vu.location = instance.to_location
                vu.branch = instance.to_location.branch
                if instance.to_location.showroom:
                    vu.showroom = instance.to_location.showroom
                vu.stock_status = 'available'
                vu.save()
            elif new_status in ['rejected', 'cancelled']:
                vu.stock_status = 'available'
                vu.save()
                
        return instance
