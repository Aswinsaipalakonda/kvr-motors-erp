from django.db import models
from branches.models import Branch, Showroom, InventoryLocation

class VehicleBrand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class VehicleModel(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    brand = models.ForeignKey(VehicleBrand, on_delete=models.CASCADE, related_name="models")
    model_name = models.CharField(max_length=100)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    color_variants = models.JSONField(default=list, help_text="List of available color variants")
    battery_compatibility = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        unique_together = ("brand", "model_name")

    def __str__(self):
        return f"{self.brand.name} - {self.model_name}"

class VehicleUnit(models.Model):
    STOCK_STATUS_CHOICES = (
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('booked', 'Booked'),
        ('sold', 'Sold'),
        ('in_transit', 'In Transit'),
        ('service', 'Service'),
        ('damaged', 'Damaged'),
    )

    model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name="units")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="vehicle_units")
    showroom = models.ForeignKey(Showroom, on_delete=models.CASCADE, related_name="vehicle_units")
    location = models.ForeignKey(InventoryLocation, on_delete=models.CASCADE, related_name="vehicle_units")
    
    vin_number = models.CharField(max_length=50, unique=True)
    motor_number = models.CharField(max_length=50, unique=True)
    chassis_number = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=50)
    purchase_date = models.DateField(blank=True, null=True)
    
    stock_status = models.CharField(max_length=20, choices=STOCK_STATUS_CHOICES, default='available')
    booking_status = models.BooleanField(default=False)
    assigned_battery = models.CharField(max_length=100, blank=True, null=True, help_text="Serial number of assigned battery")

    def __str__(self):
        return f"{self.model} (VIN: {self.vin_number})"
