from django.contrib import admin
from .models import VehicleBrand, VehicleModel, VehicleUnit

@admin.register(VehicleBrand)
class VehicleBrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)

@admin.register(VehicleModel)
class VehicleModelAdmin(admin.ModelAdmin):
    list_display = ('model_name', 'brand', 'base_price', 'status')
    search_fields = ('model_name', 'brand__name')
    list_filter = ('brand', 'status')

@admin.register(VehicleUnit)
class VehicleUnitAdmin(admin.ModelAdmin):
    list_display = ('vin_number', 'model', 'branch', 'showroom', 'location', 'stock_status')
    search_fields = ('vin_number', 'motor_number', 'chassis_number', 'model__model_name')
    list_filter = ('branch', 'showroom', 'location', 'stock_status')
