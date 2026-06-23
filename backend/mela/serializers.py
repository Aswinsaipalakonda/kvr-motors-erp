from rest_framework import serializers
from django.db import transaction
from django.db.models import F, Max
from .models import MelaInventory, MelaBooking, MelaSettings
from vehicles.models import VehicleModel

class MelaInventorySerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='vehicle_model.model_name', read_only=True)
    brand_name = serializers.CharField(source='vehicle_model.brand.name', read_only=True)
    color_options = serializers.ListField(source='vehicle_model.color_variants', read_only=True)

    class Meta:
        model = MelaInventory
        fields = '__all__'

    def validate(self, data):
        vehicle_model = data.get('vehicle_model')
        color = data.get('color')
        if vehicle_model and color:
            color_variants = vehicle_model.color_variants
            if not any(c.lower() == color.lower() for c in color_variants):
                raise serializers.ValidationError({
                    "color": f"Color '{color}' is not available for model '{vehicle_model.model_name}'. Available colors are: {', '.join(color_variants)}."
                })
        return data


class MelaBookingSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(required=False, read_only=True)
    executive_serial_number = serializers.IntegerField(required=False, read_only=True)
    model_name = serializers.CharField(source='vehicle_model.model_name', read_only=True)
    brand_name = serializers.CharField(source='vehicle_model.brand.name', read_only=True)
    executive_name = serializers.CharField(source='sales_executive.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MelaBooking
        fields = '__all__'
        read_only_fields = ('sales_executive', 'price')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['sales_executive'] = request.user
        else:
            # Fallback for seeds/tests
            from django.contrib.auth import get_user_model
            User = get_user_model()
            validated_data['sales_executive'] = User.objects.filter(role__in=['sales_executive', 'sales']).first() or User.objects.first()

        executive = validated_data['sales_executive']
        vehicle_model = validated_data['vehicle_model']
        color = validated_data['color']
        battery_type = validated_data['battery_type']

        with transaction.atomic():
            # Concurrency row-locking for MelaInventory
            inventory = MelaInventory.objects.select_for_update().filter(
                vehicle_model=vehicle_model,
                color__iexact=color,
                battery_type=battery_type,
                is_active=True
            ).first()

            if not inventory:
                raise serializers.ValidationError({
                    "non_field_errors": f"No active Mela campaign stock found for model '{vehicle_model.model_name}' ({color}, {battery_type})."
                })

            if inventory.remaining_quantity <= 0:
                raise serializers.ValidationError({
                    "non_field_errors": f"Mela campaign stock for model '{vehicle_model.model_name}' ({color}, {battery_type}) is sold out."
                })

            # Safely decrement stock
            inventory.remaining_quantity -= 1
            inventory.save()

            # Freeze price from campaign inventory
            validated_data['price'] = inventory.price

            # Calculate sequential running serial number for this sales executive
            max_serial = MelaBooking.objects.filter(
                sales_executive=executive
            ).aggregate(Max('executive_serial_number'))['executive_serial_number__max']
            
            validated_data['executive_serial_number'] = (max_serial or 0) + 1

            # Save booking
            booking = super().create(validated_data)
            return booking

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)

        with transaction.atomic():
            # If changing from completed/unconfirmed to cancelled, restore stock
            if old_status != 'cancelled' and new_status == 'cancelled':
                MelaInventory.objects.filter(
                    vehicle_model=instance.vehicle_model,
                    color__iexact=instance.color,
                    battery_type=instance.battery_type
                ).update(remaining_quantity=F('remaining_quantity') + 1)

            # If changing from cancelled back to active, decrement stock
            elif old_status == 'cancelled' and new_status != 'cancelled':
                inventory = MelaInventory.objects.select_for_update().filter(
                    vehicle_model=instance.vehicle_model,
                    color__iexact=instance.color,
                    battery_type=instance.battery_type
                ).first()
                if inventory and inventory.remaining_quantity > 0:
                    inventory.remaining_quantity -= 1
                    inventory.save()
                else:
                    raise serializers.ValidationError({
                        "status": "Cannot restore booking. Mela campaign stock is sold out."
                    })

            return super().update(instance, validated_data)


class MelaSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MelaSettings
        fields = '__all__'

    def to_internal_value(self, data):
        # Convert empty strings to None/null for date fields to prevent validation errors
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'start_date' in data and data['start_date'] == '':
            data['start_date'] = None
        if 'end_date' in data and data['end_date'] == '':
            data['end_date'] = None
        return super().to_internal_value(data)
