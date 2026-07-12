from django.db import models
from django.core.exceptions import ValidationError
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

    # Physical identifiers. A unit may arrive with only some of these stamped on it,
    # so each is optional — but at least one is required (enforced in clean()).
    # Uniqueness is enforced only when a value is actually provided (see Meta).
    vin_number = models.CharField(max_length=50, null=True, blank=True)
    motor_number = models.CharField(max_length=50, null=True, blank=True)
    chassis_number = models.CharField(max_length=50, null=True, blank=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    purchase_date = models.DateField(blank=True, null=True)
    purchase_invoice_number = models.CharField(max_length=100, blank=True, null=True)
    payment_status = models.CharField(
        max_length=20, 
        choices=(('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed')), 
        default='success'
    )
    
    stock_status = models.CharField(max_length=20, choices=STOCK_STATUS_CHOICES, default='available')
    booking_status = models.BooleanField(default=False)
    assigned_battery = models.CharField(max_length=100, blank=True, null=True, help_text="Serial number of assigned battery")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["vin_number"], name="unique_vin_when_present",
                condition=models.Q(vin_number__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["motor_number"], name="unique_motor_when_present",
                condition=models.Q(motor_number__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["chassis_number"], name="unique_chassis_when_present",
                condition=models.Q(chassis_number__isnull=False),
            ),
        ]

    def clean(self):
        pass

    def save(self, *args, **kwargs):
        # Normalise empty strings to NULL so the partial-unique constraints don't
        # treat multiple blank entries as duplicates.
        for field in ("vin_number", "motor_number", "chassis_number"):
            value = getattr(self, field)
            if value is not None and value.strip() == "":
                setattr(self, field, None)
        super().save(*args, **kwargs)

    def __str__(self):
        ident = self.vin_number or self.motor_number or self.chassis_number or f"Unit #{self.pk}"
        return f"{self.model} ({ident})"
