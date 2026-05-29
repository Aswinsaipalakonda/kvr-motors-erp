from django.contrib import admin
from .models import Battery

@admin.register(Battery)
class BatteryAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'capacity', 'purchase_date', 'status', 'location', 'supplier')
    list_filter = ('status', 'capacity', 'location')
    search_fields = ('serial_number', 'supplier')
    ordering = ('purchase_date',)
