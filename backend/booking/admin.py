from django.contrib import admin
from .models import AdvanceBooking

@admin.register(AdvanceBooking)
class AdvanceBookingAdmin(admin.ModelAdmin):
    list_display = ('booking_id', 'customer_name', 'contact_number', 'vehicle_model', 'advance_amount', 'expiry_date', 'status', 'pdi_verified')
    list_filter = ('status', 'pdi_verified', 'assigned_executive')
    search_fields = ('booking_id', 'customer_name', 'contact_number')
