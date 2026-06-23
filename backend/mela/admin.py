from django.contrib import admin
from .models import MelaInventory, MelaBooking

@admin.register(MelaInventory)
class MelaInventoryAdmin(admin.ModelAdmin):
    list_display = ('vehicle_model', 'color', 'battery_type', 'initial_quantity', 'remaining_quantity', 'price', 'is_active')
    list_filter = ('battery_type', 'is_active', 'vehicle_model')
    search_fields = ('vehicle_model__model_name', 'color')

@admin.register(MelaBooking)
class MelaBookingAdmin(admin.ModelAdmin):
    list_display = ('booking_id', 'customer_name', 'customer_phone', 'sales_executive', 'executive_serial_number', 'vehicle_model', 'color', 'battery_type', 'price', 'status', 'created_at')
    list_filter = ('status', 'battery_type', 'sales_executive')
    search_fields = ('booking_id', 'customer_name', 'customer_phone')
