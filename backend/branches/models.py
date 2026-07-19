from django.db import models
from django.conf import settings
from django.utils import timezone

class Branch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    manager_name = models.CharField(max_length=100, blank=True, null=True)
    total_stock = models.IntegerField(default=120)
    sales_volume = models.DecimalField(max_digits=15, decimal_places=2, default=11200000.00)
    monthly_target = models.DecimalField(max_digits=15, decimal_places=2, default=15000000.00)
    target_achieved_pct = models.IntegerField(default=74)

    class Meta:
        verbose_name_plural = "Branches"

    def __str__(self):
        return self.name

class Showroom(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="showrooms")
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("branch", "name")

    def __str__(self):
        return f"{self.name} - {self.branch.name}"

class InventoryLocation(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="inventory_locations")
    showroom = models.ForeignKey(Showroom, on_delete=models.SET_NULL, null=True, blank=True, related_name="inventory_locations")
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("branch", "name")

    def __str__(self):
        return f"{self.name} ({self.branch.name})"

class BranchCashDeposit(models.Model):
    deposit_id = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="cash_deposits")
    deposited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="made_cash_deposits"
    )
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_cash_deposits"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    deposit_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        import datetime, random
        if not self.deposit_id:
            self.deposit_id = f"DEP-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        if isinstance(self.deposit_date, datetime.datetime):
            self.deposit_date = self.deposit_date.date()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.deposit_id} - ₹{self.amount} ({self.branch.name})"

class BranchExpense(models.Model):
    CATEGORY_CHOICES = (
        ('electricity', 'Electricity / Utilities'),
        ('transport', 'Transport & Freight'),
        ('maintenance', 'Showroom Maintenance'),
        ('refreshments', 'Staff Refreshments'),
        ('misc', 'Miscellaneous Expense'),
    )

    expense_id = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="expenses")
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_expenses"
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='misc')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    receipt_number = models.CharField(max_length=100, blank=True, null=True)
    expense_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        import datetime, random
        if not self.expense_id:
            self.expense_id = f"EXP-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        if isinstance(self.expense_date, datetime.datetime):
            self.expense_date = self.expense_date.date()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.expense_id} - ₹{self.amount} ({self.category})"

class IssueReport(models.Model):
    CATEGORY_CHOICES = (
        ('vehicle_damage', 'Vehicle Transit Damage'),
        ('battery_malfunction', 'Battery Cell / Charger Defect'),
        ('equipment_failure', 'Showroom Equipment Failure'),
        ('logistics_delay', 'Logistics / Stock Delay'),
        ('other', 'Other Operational Problem'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    STATUS_CHOICES = (
        ('reported', 'Reported'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    )

    issue_id = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="issue_reports")
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reported_issues"
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    title = models.CharField(max_length=200)
    description = models.TextField()
    asset_reference = models.CharField(max_length=100, blank=True, null=True, help_text="VIN or Battery Serial if applicable")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reported')
    resolution_notes = models.TextField(blank=True, null=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_issues"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.issue_id:
            import datetime, random
            self.issue_id = f"ISS-{datetime.date.today().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.issue_id} - {self.title} [{self.status}]"
