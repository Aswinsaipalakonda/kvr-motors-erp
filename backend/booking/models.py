from django.db import models
from django.conf import settings
from vehicles.models import VehicleModel, VehicleUnit

class AdvanceBooking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('confirmed', 'Confirmed'),
        ('converted', 'Converted to Sale'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    )

    booking_id = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15)
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE)
    color = models.CharField(max_length=50, blank=True, null=True)
    payment_mode = models.CharField(max_length=50, blank=True, null=True)
    payment_split_details = models.JSONField(blank=True, null=True, help_text="Split payment breakdown: cash, card, upi, bajaj_finance")
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    vehicle_unit = models.ForeignKey(
        VehicleUnit, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="bookings"
    )
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2)
    booking_date = models.DateField(auto_now_add=True)
    expiry_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_executive = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="assigned_bookings"
    )
    pdi_verified = models.CharField(
        max_length=20, 
        choices=(('yes', 'Yes'), ('pending', 'Pending'), ('no', 'No')), 
        default='pending'
    )

    def save(self, *args, **kwargs):
        if not self.booking_id:
            import datetime, random
            self.booking_id = f"BK-{datetime.date.today().strftime('%Y')}-{random.randint(1000, 9999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_id} - {self.customer_name} ({self.get_status_display()})"

