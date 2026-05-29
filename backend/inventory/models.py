from django.db import models
from django.conf import settings
from vehicles.models import VehicleUnit
from branches.models import InventoryLocation

class StockTransfer(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('in_transit', 'In Transit'),
        ('received', 'Received'),
        ('rejected', 'Rejected'),
    )

    transfer_id = models.CharField(max_length=50, unique=True)
    vehicle_unit = models.ForeignKey(VehicleUnit, on_delete=models.CASCADE, related_name="transfers")
    from_location = models.ForeignKey(InventoryLocation, on_delete=models.CASCADE, related_name="transfers_out")
    to_location = models.ForeignKey(InventoryLocation, on_delete=models.CASCADE, related_name="transfers_in")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="transfers_requested"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="transfers_approved"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transfer_id} - {self.vehicle_unit} ({self.get_status_display()})"
