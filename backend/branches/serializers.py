from rest_framework import serializers
from .models import Branch, Showroom, InventoryLocation, BranchCashDeposit, BranchExpense, IssueReport

class ShowroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Showroom
        fields = '__all__'

class InventoryLocationSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    showroom_name = serializers.CharField(source='showroom.name', read_only=True)

    class Meta:
        model = InventoryLocation
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    showrooms = ShowroomSerializer(many=True, read_only=True)
    inventory_locations = InventoryLocationSerializer(many=True, read_only=True)

    class Meta:
        model = Branch
        fields = '__all__'

    def validate_phone_number(self, value):
        import re
        if value:
            cleaned = re.sub(r'\D', '', value)
            if len(cleaned) != 10:
                raise serializers.ValidationError("Phone number must contain exactly 10 digits.")
            return cleaned
        return value

class BranchCashDepositSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    deposited_by_name = serializers.CharField(source='deposited_by.full_name', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.full_name', read_only=True)
    deposit_date = serializers.DateField(required=False)

    class Meta:
        model = BranchCashDeposit
        fields = '__all__'
        read_only_fields = ('deposited_by', 'deposit_id')

class BranchExpenseSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    expense_date = serializers.DateField(required=False)

    class Meta:
        model = BranchExpense
        fields = '__all__'
        read_only_fields = ('submitted_by', 'expense_id')

class IssueReportSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = IssueReport
        fields = '__all__'
        read_only_fields = ('reported_by', 'resolved_by', 'issue_id')
