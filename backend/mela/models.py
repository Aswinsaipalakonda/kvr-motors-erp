from django.db import models
from django.conf import settings
from vehicles.models import VehicleModel

class MelaVehicleStock(models.Model):
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name="mela_vehicles", null=True, blank=True)
    model_name = models.CharField(max_length=100, default="", blank=True, help_text="Typed vehicle name")
    color = models.CharField(max_length=50, help_text="Selected color variant")
    price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Vehicle component mela price")
    initial_quantity = models.PositiveIntegerField(default=0)
    remaining_quantity = models.PositiveIntegerField(default=0)
    restock_date = models.DateField(null=True, blank=True, help_text="Date when stock is expected to arrive")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Mela Vehicle Stocks"
        unique_together = ("model_name", "color")

    def __str__(self):
        return f"{self.model_name} ({self.color}) - Qty: {self.remaining_quantity}"


class MelaBatteryStock(models.Model):
    battery_name = models.CharField(max_length=100, unique=True, help_text="e.g. 4 battery Graphene")
    price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Battery component mela price")
    initial_quantity = models.PositiveIntegerField(default=0)
    remaining_quantity = models.PositiveIntegerField(default=0)
    restock_date = models.DateField(null=True, blank=True, help_text="Date when stock is expected to arrive")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Mela Battery Stocks"

    def __str__(self):
        return f"{self.battery_name} - Qty: {self.remaining_quantity}"


class MelaVehicleBatteryCompatibility(models.Model):
    vehicle_stock = models.ForeignKey(MelaVehicleStock, on_delete=models.CASCADE, related_name="supported_compatibilities")
    battery_stock = models.ForeignKey(MelaBatteryStock, on_delete=models.CASCADE, related_name="supported_compatibilities")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Mela Vehicle Battery Compatibilities"
        unique_together = ("vehicle_stock", "battery_stock")

    def __str__(self):
        return f"{self.vehicle_stock.model_name} ({self.vehicle_stock.color}) <-> {self.battery_stock.battery_name}"


# Keep a shell MelaInventory model to preserve older database tables and references without breaking SQL queries
class MelaInventory(models.Model):
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE)
    color = models.CharField(max_length=50)
    battery_type = models.CharField(max_length=50)
    initial_quantity = models.PositiveIntegerField(default=0)
    remaining_quantity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)


class MelaBooking(models.Model):
    STATUS_CHOICES = (
        ('unconfirmed', 'Unconfirmed Booking'),
        ('completed', 'Completed'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    PAYMENT_CHOICES = (
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('bajaj_finance', 'Bajaj Finance'),
    )

    booking_id = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=15)
    sales_executive = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mela_bookings"
    )
    # Sequential running serial number specifically for this executive
    executive_serial_number = models.PositiveIntegerField()
    
    mela_vehicle = models.ForeignKey(MelaVehicleStock, on_delete=models.CASCADE, related_name="bookings", null=True)
    mela_battery = models.ForeignKey(MelaBatteryStock, on_delete=models.CASCADE, related_name="bookings", null=True)
    
    # Keep original fields but allow NULL to maintain backward compatibility during migration
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name="mela_bookings", null=True, blank=True)
    color = models.CharField(max_length=50, null=True, blank=True)
    battery_type = models.CharField(max_length=50, null=True, blank=True)
    
    price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unconfirmed')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cash')
    payment_proof = models.ImageField(upload_to="mela_proofs/", null=True, blank=True)
    cash_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    invoice_pdf = models.FileField(upload_to="mela_invoices/", null=True, blank=True)
    vin_no = models.CharField(max_length=100, default="", blank=True)
    motor_no = models.CharField(max_length=100, default="", blank=True)
    battery_no = models.CharField(max_length=100, default="", blank=True)
    charger_no = models.CharField(max_length=100, default="", blank=True)
    payment_details = models.JSONField(blank=True, null=True, default=dict)

    def save(self, *args, **kwargs):
        if not self.booking_id:
            import random
            while True:
                candidate = f"MELA-{random.randint(1000, 9999)}"
                if not MelaBooking.objects.filter(booking_id=candidate).exists():
                    self.booking_id = candidate
                    break
        # Automatically sync legacy fields for compatibility
        if self.mela_vehicle:
            self.vehicle_model = self.mela_vehicle.vehicle_model
            self.color = self.mela_vehicle.color
        if self.mela_battery:
            self.battery_type = self.mela_battery.battery_name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_id} - {self.customer_name} ({self.status})"


class MelaSettings(models.Model):
    mela_name = models.CharField(max_length=255, default="Grand Monsoon Mela")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, default="Main Showroom Ground")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Mela Settings"

    def __str__(self):
        return f"{self.mela_name} ({self.start_date} to {self.end_date})"
