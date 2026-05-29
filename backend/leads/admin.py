from django.contrib import admin
from .models import Lead

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('customer_name', 'contact_number', 'interested_vehicle', 'lead_source', 'assigned_executive', 'status', 'follow_up_date')
    list_filter = ('status', 'lead_source', 'assigned_executive')
    search_fields = ('customer_name', 'contact_number', 'notes')
    date_hierarchy = 'created_at'
