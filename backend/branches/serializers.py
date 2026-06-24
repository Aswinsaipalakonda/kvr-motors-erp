from rest_framework import serializers
from .models import Branch, Showroom, InventoryLocation

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

