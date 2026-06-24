from rest_framework import serializers
from django.db import transaction
from django.db.models import F, Max
from .models import MelaVehicleStock, MelaBatteryStock, MelaVehicleBatteryCompatibility, MelaBooking, MelaSettings, MelaInventory
from vehicles.models import VehicleModel


class MelaVehicleStockSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='vehicle_model.model_name', read_only=True)
    brand_name = serializers.CharField(source='vehicle_model.brand.name', read_only=True)
    color_options = serializers.ListField(source='vehicle_model.color_variants', read_only=True)

    class Meta:
        model = MelaVehicleStock
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


class MelaBatteryStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = MelaBatteryStock
        fields = '__all__'


class MelaVehicleBatteryCompatibilitySerializer(serializers.ModelSerializer):
    vehicle_model_name = serializers.CharField(source='vehicle_stock.vehicle_model.model_name', read_only=True)
    vehicle_color = serializers.CharField(source='vehicle_stock.color', read_only=True)
    battery_name = serializers.CharField(source='battery_stock.battery_name', read_only=True)

    class Meta:
        model = MelaVehicleBatteryCompatibility
        fields = '__all__'


class MelaBookingSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(required=False, read_only=True)
    executive_serial_number = serializers.IntegerField(required=False, read_only=True)
    
    # Custom details for display
    vehicle_model_name = serializers.CharField(source='mela_vehicle.vehicle_model.model_name', read_only=True)
    vehicle_color = serializers.CharField(source='mela_vehicle.color', read_only=True)
    battery_name = serializers.CharField(source='mela_battery.battery_name', read_only=True)
    
    executive_name = serializers.CharField(source='sales_executive.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MelaBooking
        fields = '__all__'
        read_only_fields = ('sales_executive', 'price', 'vehicle_model', 'color', 'battery_type')

    def validate(self, data):
        mela_vehicle = data.get('mela_vehicle')
        mela_battery = data.get('mela_battery')

        if mela_vehicle and mela_battery:
            # Check compatibility
            is_compatible = MelaVehicleBatteryCompatibility.objects.filter(
                vehicle_stock=mela_vehicle,
                battery_stock=mela_battery
            ).exists()
            if not is_compatible:
                raise serializers.ValidationError(
                    f"The selected battery '{mela_battery.battery_name}' is not supported by the vehicle model '{mela_vehicle.vehicle_model.model_name}' ({mela_vehicle.color})."
                )
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['sales_executive'] = request.user
        else:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            validated_data['sales_executive'] = User.objects.filter(role__in=['sales_executive', 'sales']).first() or User.objects.first()

        executive = validated_data['sales_executive']
        mela_vehicle = validated_data['mela_vehicle']
        mela_battery = validated_data['mela_battery']

        with transaction.atomic():
            # Concurrency row-locking
            vehicle_stock = MelaVehicleStock.objects.select_for_update().get(id=mela_vehicle.id)
            battery_stock = MelaBatteryStock.objects.select_for_update().get(id=mela_battery.id)

            if vehicle_stock.remaining_quantity <= 0:
                raise serializers.ValidationError({
                    "mela_vehicle": f"Mela campaign stock for vehicle '{vehicle_stock.vehicle_model.model_name}' ({vehicle_stock.color}) is sold out."
                })
            if battery_stock.remaining_quantity <= 0:
                raise serializers.ValidationError({
                    "mela_battery": f"Mela campaign stock for battery '{battery_stock.battery_name}' is sold out."
                })

            # Safely decrement campaign stocks
            vehicle_stock.remaining_quantity -= 1
            vehicle_stock.save()

            battery_stock.remaining_quantity -= 1
            battery_stock.save()

            # Dynamic price sum calculation
            validated_data['price'] = vehicle_stock.price + battery_stock.price

            # Legacy fallback fields sync
            validated_data['vehicle_model'] = vehicle_stock.vehicle_model
            validated_data['color'] = vehicle_stock.color
            validated_data['battery_type'] = battery_stock.battery_name

            # Calculate sequential running serial number for this sales executive
            max_serial = MelaBooking.objects.filter(
                sales_executive=executive
            ).aggregate(Max('executive_serial_number'))['executive_serial_number__max']
            
            validated_data['executive_serial_number'] = (max_serial or 0) + 1

            booking = super().create(validated_data)
            return booking

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)

        with transaction.atomic():
            # If changing from completed/unconfirmed to cancelled, restore stock
            if old_status != 'cancelled' and new_status == 'cancelled':
                if instance.mela_vehicle:
                    MelaVehicleStock.objects.filter(id=instance.mela_vehicle.id).update(remaining_quantity=F('remaining_quantity') + 1)
                if instance.mela_battery:
                    MelaBatteryStock.objects.filter(id=instance.mela_battery.id).update(remaining_quantity=F('remaining_quantity') + 1)

            # If changing from cancelled back to active, decrement stock
            elif old_status == 'cancelled' and new_status != 'cancelled':
                if instance.mela_vehicle:
                    v_stock = MelaVehicleStock.objects.select_for_update().filter(id=instance.mela_vehicle.id).first()
                    if v_stock and v_stock.remaining_quantity > 0:
                        v_stock.remaining_quantity -= 1
                        v_stock.save()
                    else:
                        raise serializers.ValidationError({"status": "Cannot restore booking. Vehicle stock is sold out."})

                if instance.mela_battery:
                    b_stock = MelaBatteryStock.objects.select_for_update().filter(id=instance.mela_battery.id).first()
                    if b_stock and b_stock.remaining_quantity > 0:
                        b_stock.remaining_quantity -= 1
                        b_stock.save()
                    else:
                        raise serializers.ValidationError({"status": "Cannot restore booking. Battery stock is sold out."})

            return super().update(instance, validated_data)


class MelaSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MelaSettings
        fields = '__all__'

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'start_date' in data and data['start_date'] == '':
            data['start_date'] = None
        if 'end_date' in data and data['end_date'] == '':
            data['end_date'] = None
        return super().to_internal_value(data)


class MelaInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MelaInventory
        fields = '__all__'
