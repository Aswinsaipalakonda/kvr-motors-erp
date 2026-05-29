from django.db import models
from django.conf import settings
from branches.models import Branch
from vehicles.models import VehicleUnit
from battery.models import Battery

class SalesInvoice(models.Model):
    DELIVERY_CHOICES = (
        ('processing', 'Processing'),
        ('ready', 'Ready for Delivery'),
        ('delivered', 'Delivered'),
    )

    invoice_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=255)
    customer_contact = models.CharField(max_length=15)
    vehicle_unit = models.ForeignKey(VehicleUnit, on_delete=models.PROTECT, related_name="sales_invoices")
    assigned_battery = models.ForeignKey(Battery, on_delete=models.PROTECT, null=True, blank=True, related_name="sales_invoices")
    sale_price = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=50)  # SBI Finance, HDFC Loan, UPI, Cash, etc.
    insurance_partner = models.CharField(max_length=100, blank=True, null=True)
    sale_date = models.DateField(auto_now_add=True)
    delivery_status = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='processing')
    sales_executive = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="sales_invoices"
    )
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="sales_invoices")

    def __str__(self):
        return f"{self.invoice_number} - {self.customer_name}"
