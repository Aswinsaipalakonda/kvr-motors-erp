from django.contrib import admin
from .models import SalesInvoice

@admin.register(SalesInvoice)
class SalesInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer_name', 'customer_contact', 'vehicle_unit', 'sale_price', 'payment_mode', 'delivery_status', 'sale_date')
    list_filter = ('delivery_status', 'payment_mode', 'branch')
    search_fields = ('invoice_number', 'customer_name', 'customer_contact')
