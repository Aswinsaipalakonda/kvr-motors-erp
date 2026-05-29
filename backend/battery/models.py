from django.db import models
from branches.models import InventoryLocation

class Battery(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('assigned', 'Assigned'),
        ('sold', 'Sold'),
        ('damaged', 'Damaged'),
        ('returned', 'Returned'),
    )

    serial_number = models.CharField(max_length=100, unique=True)
    capacity = models.CharField(max_length=50, help_text="e.g. 1.2 kWh, 2.0 kWh")
    purchase_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    location = models.ForeignKey(InventoryLocation, on_delete=models.CASCADE, related_name="batteries")
    supplier = models.CharField(max_length=150)
    warranty_years = models.IntegerField(default=3)

    class Meta:
        verbose_name_plural = "Batteries"
        ordering = ['purchase_date']  # Enforces FIFO checking order by default

    def __str__(self):
        return f"{self.serial_number} ({self.capacity}) - {self.get_status_display()}"
