from django.db import models

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
