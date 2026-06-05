from django.contrib import admin
from .models import ActivityLog

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'model_name', 'object_repr', 'ip_address')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('user__username', 'user__full_name', 'object_repr', 'object_id')
    readonly_fields = ('user', 'action', 'model_name', 'app_label', 'object_id', 'object_repr', 'changes', 'ip_address', 'timestamp')
