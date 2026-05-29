from rest_framework import serializers
from .models import LedgerEntry

class LedgerEntrySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    approver_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    ledger_type_display = serializers.CharField(source='get_ledger_type_display', read_only=True)

    class Meta:
        model = LedgerEntry
        fields = '__all__'
