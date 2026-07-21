from django.db import models
from django.conf import settings
from branches.models import Branch

class LedgerEntry(models.Model):
    TYPE_CHOICES = (
        ('sales_income', 'Sales Income'),
        ('purchase_expense', 'Purchase Expense'),
        ('salary_expense', 'Salary Expense'),
        ('operational_expense', 'Operational Expense'),
        ('booking_amount', 'Booking Amount'),
        ('refund', 'Refund'),
        ('transfer_expense', 'Transfer Expense'),
    )

    transaction_id = models.CharField(max_length=50, unique=True)
    ledger_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="ledger_entries")
    detail = models.TextField()
    income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    expense = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    payment_mode = models.CharField(max_length=50)
    payment_split_details = models.JSONField(blank=True, null=True, help_text="Split payment breakdown e.g. {cash: 5000, upi: 3000, bajaj_emi: 2000}")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="approved_ledger_entries"
    )
    created_at = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Ledger Entries"

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            import datetime, random
            self.transaction_id = f"TXN-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(10000, 99999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_id} ({self.ledger_type}) - ₹ {self.income or self.expense}"

