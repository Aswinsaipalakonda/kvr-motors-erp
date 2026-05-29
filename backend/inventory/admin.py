from django.contrib import admin
from .models import StockTransfer

@admin.register(StockTransfer)
class StockTransferAdmin(admin.ModelAdmin):
    list_display = ('transfer_id', 'vehicle_unit', 'from_location', 'to_location', 'status', 'requested_by', 'created_at')
    list_filter = ('status', 'requested_by')
    search_fields = ('transfer_id',)
