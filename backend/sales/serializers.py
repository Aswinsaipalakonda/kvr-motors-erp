from rest_framework import serializers
from .models import SalesInvoice
from battery.models import Battery, FifoOverride
from ledger.models import LedgerEntry
from vehicles.models import VehicleUnit
import datetime
import random

class SalesInvoiceSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    vin_number = serializers.CharField(source='vehicle_unit.vin_number', read_only=True)
    model_name = serializers.CharField(source='vehicle_unit.model.model_name', read_only=True)
    vehicle_color = serializers.CharField(source='vehicle_unit.color', read_only=True)
    battery_serial = serializers.CharField(source='assigned_battery.serial_number', read_only=True)
    battery_type = serializers.CharField(source='assigned_battery.capacity', read_only=True)
    executive_name = serializers.CharField(source='sales_executive.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    delivery_status_display = serializers.CharField(source='get_delivery_status_display', read_only=True)

    class Meta:
        model = SalesInvoice
        fields = '__all__'

    def validate_customer_contact(self, value):
        import re
        if value:
            cleaned = re.sub(r'\D', '', value)
            if len(cleaned) != 10:
                raise serializers.ValidationError("Customer contact number must contain exactly 10 digits.")
            return cleaned
        return value



    def validate(self, data):
        assigned_battery = data.get('assigned_battery')
        vehicle_unit = data.get('vehicle_unit')
        
        # 1. Validate vehicle unit status
        if vehicle_unit:
            if self.instance and self.instance.vehicle_unit == vehicle_unit:
                pass
            elif vehicle_unit.stock_status not in ['available', 'reserved', 'booked']:
                raise serializers.ValidationError({
                    "vehicle_unit": f"Vehicle unit is not available (current status: {vehicle_unit.get_stock_status_display()})."
                })

        # 2. Validate battery FIFO guidelines
        if assigned_battery:
            if self.instance and self.instance.assigned_battery == assigned_battery:
                pass
            else:
                if assigned_battery.status != 'available':
                    raise serializers.ValidationError({
                        "assigned_battery": f"Selected battery '{assigned_battery.serial_number}' is not available (status: {assigned_battery.get_status_display()})."
                    })
                
                # Fetch oldest available battery of same capacity and location
                oldest_battery = Battery.objects.filter(
                    location=assigned_battery.location,
                    capacity=assigned_battery.capacity,
                    status='available'
                ).order_by('purchase_date').first()
                
                if oldest_battery and oldest_battery.id != assigned_battery.id:
                    # Check for approved override
                    has_override = FifoOverride.objects.filter(
                        battery=assigned_battery,
                        status='approved'
                    ).exists()
                    if not has_override:
                        raise serializers.ValidationError({
                            "assigned_battery": f"FIFO Violation: Battery '{oldest_battery.serial_number}' (purchased on {oldest_battery.purchase_date}) is older than '{assigned_battery.serial_number}' and must be dispatched first, or a supervisor FIFO override must be approved."
                        })
        return data

    def create(self, validated_data):
        if not validated_data.get('invoice_number'):
            validated_data['invoice_number'] = f"INV-{datetime.date.today().strftime('%Y')}-{random.randint(10000, 99999)}"
            
        instance = super().create(validated_data)
        
        # 1. Update vehicle unit status to sold
        vu = instance.vehicle_unit
        vu.stock_status = 'sold'
        if instance.assigned_battery:
            vu.assigned_battery = instance.assigned_battery.serial_number
        vu.save()
        
        # 2. Update battery status to sold
        if instance.assigned_battery:
            bat = instance.assigned_battery
            bat.status = 'sold'
            bat.save()
            
        # 3. Create automatic LedgerEntry
        LedgerEntry.objects.create(
            transaction_id=f"TXN-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(10000, 99999)}",
            ledger_type='sales_income',
            branch=instance.branch,
            detail=f"Automated entry for Sales Invoice {instance.invoice_number} (Customer: {instance.customer_name})",
            income=instance.sale_price,
            expense=0.00,
            payment_mode=instance.payment_mode,
            approved_by=instance.sales_executive
        )
        return instance
