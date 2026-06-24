from django.contrib import admin
from .models import MelaVehicleStock, MelaBatteryStock, MelaVehicleBatteryCompatibility, MelaBooking, MelaSettings

@admin.register(MelaVehicleStock)
class MelaVehicleStockAdmin(admin.ModelAdmin):
    list_display = ('vehicle_model', 'color', 'price', 'initial_quantity', 'remaining_quantity', 'restock_date', 'is_active')
    list_filter = ('is_active', 'vehicle_model')
    search_fields = ('vehicle_model__model_name', 'color')

@admin.register(MelaBatteryStock)
class MelaBatteryStockAdmin(admin.ModelAdmin):
    list_display = ('battery_name', 'price', 'initial_quantity', 'remaining_quantity', 'restock_date', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('battery_name',)

@admin.register(MelaVehicleBatteryCompatibility)
class MelaVehicleBatteryCompatibilityAdmin(admin.ModelAdmin):
    list_display = ('vehicle_stock', 'battery_stock', 'created_at')

@admin.register(MelaBooking)
class MelaBookingAdmin(admin.ModelAdmin):
    list_display = ('booking_id', 'customer_name', 'customer_phone', 'sales_executive', 'mela_vehicle', 'mela_battery', 'price', 'status', 'created_at')
    list_filter = ('status', 'sales_executive')
    search_fields = ('booking_id', 'customer_name', 'customer_phone')

@admin.register(MelaSettings)
class MelaSettingsAdmin(admin.ModelAdmin):
    list_display = ('mela_name', 'start_date', 'end_date', 'location', 'is_active')
