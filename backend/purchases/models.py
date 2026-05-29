from django.db import models
from vehicles.models import VehicleModel

class PurchaseOrder(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    )

    po_number = models.CharField(max_length=50, unique=True)
    supplier_name = models.CharField(max_length=150)
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name="purchase_orders")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True)
    order_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_terms = models.CharField(max_length=100)
    estimated_delivery = models.DateField(null=True, blank=True)
    actual_delivery = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.po_number} - {self.supplier_name} ({self.get_status_display()})"
