from django.contrib import admin
from .models import LedgerEntry

@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'ledger_type', 'branch', 'income', 'expense', 'payment_mode', 'created_at')
    list_filter = ('ledger_type', 'branch', 'payment_mode')
    search_fields = ('transaction_id', 'detail')
    ordering = ('-created_at',)
