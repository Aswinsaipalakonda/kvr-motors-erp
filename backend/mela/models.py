from django.db import models
from django.conf import settings
from vehicles.models import VehicleModel

class MelaInventory(models.Model):
    BATTERY_CHOICES = (
        ('graphene', 'Graphene'),
        ('Li-24', 'Li-24'),
        ('Li-30', 'Li-30'),
        ('Li-40', 'Li-40'),
    )

    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name="mela_inventories")
    color = models.CharField(max_length=50, help_text="Selected color variant")
    battery_type = models.CharField(max_length=50, help_text="Battery capacity/spec")
    initial_quantity = models.PositiveIntegerField(default=0)
    remaining_quantity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Special campaign price")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Mela Inventories"
        unique_together = ("vehicle_model", "color", "battery_type")

    def __str__(self):
        return f"{self.vehicle_model.model_name} ({self.color}, {self.battery_type}) - Qty: {self.remaining_quantity}"


class MelaBooking(models.Model):
    STATUS_CHOICES = (
        ('unconfirmed', 'Unconfirmed Booking'),
        ('completed', 'Completed & Delivered'),
        ('cancelled', 'Cancelled'),
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
    
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name="mela_bookings")
    color = models.CharField(max_length=50)
    battery_type = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unconfirmed')
    cash_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.booking_id:
            import datetime, random
            # Generate unique booking ID
            self.booking_id = f"MELA-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
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
