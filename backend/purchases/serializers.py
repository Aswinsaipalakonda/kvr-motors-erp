from rest_framework import serializers
from .models import PurchaseOrder
from branches.models import Branch, Showroom, InventoryLocation
from vehicles.models import VehicleUnit
from battery.models import Battery
from ledger.models import LedgerEntry
import datetime
import random

class PurchaseOrderSerializer(serializers.ModelSerializer):
    po_number = serializers.CharField(required=False, allow_blank=True)
    vehicle_model_name = serializers.CharField(source='vehicle_model.model_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Save modifications
        instance = super().update(instance, validated_data)
        
        # Generate stock units and ledger entries if transition to received occurs
        if old_status != new_status and new_status == 'received':
            branch = Branch.objects.first()
            if not branch:
                raise serializers.ValidationError("Cannot receive Purchase Order because no Branch exists in the system.")
                
            showroom = Showroom.objects.filter(branch=branch).first()
            if not showroom:
                showroom = Showroom.objects.create(branch=branch, name="Default Showroom")
                
            location = InventoryLocation.objects.filter(branch=branch).first()
            if not location:
                location = InventoryLocation.objects.create(branch=branch, showroom=showroom, name="Default warehouse")
                
            color = "Default"
            if instance.vehicle_model.color_variants and len(instance.vehicle_model.color_variants) > 0:
                color = instance.vehicle_model.color_variants[0]
                
            for i in range(instance.quantity):
                vin = f"PO-VIN-{datetime.date.today().strftime('%y%m')}-{random.randint(10000, 99999)}"
                motor = f"PO-MOT-{datetime.date.today().strftime('%y%m')}-{random.randint(10000, 99999)}"
                chassis = f"PO-CHA-{datetime.date.today().strftime('%y%m')}-{random.randint(10000, 99999)}"
                
                # Auto-generate battery
                bat_serial = f"BAT-PO-{datetime.date.today().strftime('%y%m')}-{random.randint(10000, 99999)}"
                bat = Battery.objects.create(
                    serial_number=bat_serial,
                    battery_code="BAT-LFP-GEN",
                    capacity=instance.vehicle_model.battery_compatibility or "1.2 kWh",
                    purchase_date=datetime.date.today(),
                    status='available',
                    location=location,
                    supplier=instance.supplier_name,
                    warranty_years=3
                )
                
                # Auto-generate vehicle unit
                VehicleUnit.objects.create(
                    model=instance.vehicle_model,
                    branch=branch,
                    showroom=showroom,
                    location=location,
                    vin_number=vin,
                    motor_number=motor,
                    chassis_number=chassis,
                    color=color,
                    purchase_date=datetime.date.today(),
                    stock_status='available',
                    assigned_battery=bat.serial_number
                )
                
            # Create automated ledger entry
            LedgerEntry.objects.create(
                transaction_id=f"TXN-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(10000, 99999)}",
                ledger_type='purchase_expense',
                branch=branch,
                detail=f"Automated entry for PO Receipt {instance.po_number} (Supplier: {instance.supplier_name})",
                income=0.00,
                expense=instance.total_price,
                payment_mode=instance.payment_terms or 'Net 30',
                created_at=datetime.date.today()
            )
            
        return instance
