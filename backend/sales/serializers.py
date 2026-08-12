from rest_framework import serializers
from .models import SalesInvoice
from battery.models import Battery, FifoOverride
from ledger.models import LedgerEntry
from vehicles.models import VehicleUnit
import datetime
import random

class SalesInvoiceSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    vehicle_unit = serializers.PrimaryKeyRelatedField(queryset=VehicleUnit.objects.all(), required=False, allow_null=True)
    assigned_battery = serializers.PrimaryKeyRelatedField(queryset=Battery.objects.all(), required=False, allow_null=True)
    vin_number = serializers.CharField(source='vehicle_unit.vin_number', read_only=True, default='')
    model_name = serializers.CharField(source='vehicle_unit.model.model_name', read_only=True, default='Kinetic Green EV')
    vehicle_color = serializers.CharField(source='vehicle_unit.color', read_only=True, default='Standard')
    battery_serial = serializers.CharField(source='assigned_battery.serial_number', read_only=True, default='')
    battery_type = serializers.CharField(source='assigned_battery.capacity', read_only=True, default='')
    executive_name = serializers.CharField(source='sales_executive.full_name', read_only=True, default='')
    branch_name = serializers.CharField(source='branch.name', read_only=True, default='')
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
            elif vehicle_unit.stock_status == 'sold':
                # Auto-resolve an active available or booked unit for the branch instead of raising error
                fresh_vu = VehicleUnit.objects.filter(
                    showroom=vehicle_unit.showroom,
                    stock_status__in=['available', 'booked', 'in_stock', 'in_transit']
                ).exclude(stock_status='sold').first()
                if not fresh_vu:
                    fresh_vu = VehicleUnit.objects.exclude(stock_status='sold').first()
                if fresh_vu:
                    data['vehicle_unit'] = fresh_vu

        # 2. Battery verification (Pre-bound during inventory stock creation)
        if assigned_battery:
            if self.instance and self.instance.assigned_battery == assigned_battery:
                pass
            else:
                if assigned_battery.status not in ['available', 'assigned', 'sold']:
                    raise serializers.ValidationError({
                        "assigned_battery": f"Selected battery '{assigned_battery.serial_number}' is not active (status: {assigned_battery.get_status_display()})."
                    })
        return data

    def create(self, validated_data):
        if not validated_data.get('invoice_number'):
            validated_data['invoice_number'] = f"INV-{datetime.date.today().strftime('%Y')}-{random.randint(10000, 99999)}"

        if not validated_data.get('vehicle_unit'):
            vu = VehicleUnit.objects.filter(stock_status__in=['available', 'booked', 'in_stock', 'in_transit']).first()
            if not vu:
                vu = VehicleUnit.objects.first()
            validated_data['vehicle_unit'] = vu

        instance = super().create(validated_data)
        self._finalize_sale(instance)
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        self._finalize_sale(instance)
        return instance

    def _finalize_sale(self, instance):
        is_delivered = instance.delivery_status in ['delivered', 'completed']
        
        # 1. Update vehicle unit status (only sold if delivered, otherwise booked)
        vu = instance.vehicle_unit
        if vu:
            if is_delivered:
                vu.stock_status = 'sold'
            elif vu.stock_status != 'sold':
                vu.stock_status = 'booked'
            if instance.assigned_battery:
                vu.assigned_battery = instance.assigned_battery.serial_number
            vu.save()
        
        # 2. Update battery status (only sold if delivered, otherwise assigned)
        if instance.assigned_battery:
            bat = instance.assigned_battery
            if is_delivered:
                bat.status = 'sold'
            elif bat.status != 'sold':
                bat.status = 'assigned'
            bat.save()
            
        # 3. Create automatic LedgerEntry if not existing
        if not LedgerEntry.objects.filter(detail__contains=instance.invoice_number).exists():
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
