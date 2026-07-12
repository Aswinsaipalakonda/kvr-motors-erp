from rest_framework import serializers
from .models import VehicleBrand, VehicleModel, VehicleUnit
from branches.serializers import BranchSerializer, ShowroomSerializer, InventoryLocationSerializer

class VehicleBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleBrand
        fields = '__all__'

class VehicleModelSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)

    class Meta:
        model = VehicleModel
        fields = '__all__'

class VehicleUnitSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='model.brand.name', read_only=True)
    model_name = serializers.CharField(source='model.model_name', read_only=True)
    base_price = serializers.DecimalField(source='model.base_price', max_digits=12, decimal_places=2, read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    showroom_name = serializers.CharField(source='showroom.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = VehicleUnit
        fields = '__all__'

    def validate(self, attrs):
        return attrs
