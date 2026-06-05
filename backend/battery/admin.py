from django.contrib import admin
from .models import Battery

@admin.register(Battery)
class BatteryAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'battery_code', 'capacity', 'purchase_date', 'status', 'location', 'supplier')
    list_filter = ('status', 'capacity', 'location')
    search_fields = ('serial_number', 'battery_code', 'supplier')
    ordering = ('purchase_date',)
