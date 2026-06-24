from rest_framework import serializers
from .models import AdvanceBooking
from vehicles.models import VehicleUnit
from ledger.models import LedgerEntry
from branches.models import Branch
import datetime
import random

class AdvanceBookingSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(required=False, allow_blank=True)
    vehicle_model_name = serializers.CharField(source='vehicle_model.model_name', read_only=True)
    vin_number = serializers.CharField(source='vehicle_unit.vin_number', read_only=True)
    executive_name = serializers.CharField(source='assigned_executive.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pdi_display = serializers.CharField(source='get_pdi_verified_display', read_only=True)

    class Meta:
        model = AdvanceBooking
        fields = '__all__'

    def validate_contact_number(self, value):
        import re
        if value:
            cleaned = re.sub(r'\D', '', value)
            if len(cleaned) != 10:
                raise serializers.ValidationError("Contact number must contain exactly 10 digits.")
            return cleaned
        return value


    def validate(self, data):
        vehicle_unit = data.get('vehicle_unit')
        
        # Validate vehicle unit status
        if vehicle_unit:
            # If updating, allow same unit
            if self.instance and self.instance.vehicle_unit == vehicle_unit:
                pass
            elif vehicle_unit.stock_status != 'available':
                raise serializers.ValidationError({
                    "vehicle_unit": f"Vehicle unit is already reserved or sold (current status: {vehicle_unit.get_stock_status_display()})."
                })
        return data

    def create(self, validated_data):
        instance = super().create(validated_data)
        
        # 1. Update vehicle unit status to booked
        if instance.vehicle_unit:
            vu = instance.vehicle_unit
            vu.stock_status = 'booked'
            vu.booking_status = True
            vu.save()
            
        # 2. Identify target branch for ledger logs
        branch_obj = None
        if instance.vehicle_unit:
            branch_obj = instance.vehicle_unit.branch
        elif instance.assigned_executive and instance.assigned_executive.branch:
            branch_obj = Branch.objects.filter(name__iexact=instance.assigned_executive.branch).first()
        if not branch_obj:
            branch_obj = Branch.objects.first()
            
        # 3. Write Ledger Entry
        if branch_obj:
            LedgerEntry.objects.create(
                transaction_id=f"TXN-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(10000, 99999)}",
                ledger_type='booking_amount',
                branch=branch_obj,
                detail=f"Automated entry for Advance Booking {instance.booking_id} (Customer: {instance.customer_name})",
                income=instance.advance_amount,
                expense=0.00,
                payment_mode=instance.payment_mode or 'Cash',
                approved_by=instance.assigned_executive
            )
        return instance

    def update(self, instance, validated_data):
        old_status = instance.status
        old_unit = instance.vehicle_unit
        
        new_status = validated_data.get('status', old_status)
        new_unit = validated_data.get('vehicle_unit', old_unit)
        
        # Save updates
        instance = super().update(instance, validated_data)
        
        # Case A: Vehicle unit changed
        if old_unit != new_unit:
            if old_unit:
                old_unit.stock_status = 'available'
                old_unit.booking_status = False
                old_unit.save()
            if new_unit:
                new_unit.stock_status = 'booked'
                new_unit.booking_status = True
                new_unit.save()
                
        # Case B: Status changed to Cancelled/Expired
        if old_status != new_status and new_status in ['cancelled', 'expired']:
            if instance.vehicle_unit:
                vu = instance.vehicle_unit
                vu.stock_status = 'available'
                vu.booking_status = False
                vu.save()
                
            # Create refund ledger entry
            branch_obj = None
            if instance.vehicle_unit:
                branch_obj = instance.vehicle_unit.branch
            elif instance.assigned_executive and instance.assigned_executive.branch:
                branch_obj = Branch.objects.filter(name__iexact=instance.assigned_executive.branch).first()
            if not branch_obj:
                branch_obj = Branch.objects.first()
                
            if branch_obj and new_status == 'cancelled':
                LedgerEntry.objects.create(
                    transaction_id=f"TXN-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(10000, 99999)}",
                    ledger_type='refund',
                    branch=branch_obj,
                    detail=f"Automated refund entry for Booking Cancellation {instance.booking_id}",
                    income=0.00,
                    expense=instance.advance_amount,
                    payment_mode=instance.payment_mode or 'Cash',
                    approved_by=instance.assigned_executive
                )
        return instance
