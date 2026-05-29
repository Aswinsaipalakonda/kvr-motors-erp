from django.contrib import admin
from .models import PurchaseOrder

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('po_number', 'supplier_name', 'vehicle_model', 'quantity', 'unit_price', 'total_price', 'status', 'order_date')
    list_filter = ('status', 'order_date')
    search_fields = ('po_number', 'supplier_name')
