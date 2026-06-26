import os
import django

# Set up Django context
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from branches.models import Branch, Showroom, InventoryLocation
from vehicles.models import VehicleBrand, VehicleModel, VehicleUnit
from battery.models import Battery, FifoOverride
from users.models import User
from inventory.models import StockTransfer
from booking.models import AdvanceBooking
from sales.models import SalesInvoice
from leads.models import Lead
from ledger.models import LedgerEntry
from purchases.models import PurchaseOrder
from mela.models import MelaVehicleStock, MelaBatteryStock, MelaVehicleBatteryCompatibility, MelaInventory, MelaBooking, MelaSettings
from activity_logs.models import ActivityLog
from attendance.models import Attendance

def clear_and_create_owner():
    print("--- Clearing all data from the database ---")
    
    # Delete related child records first to avoid foreign key errors
    LedgerEntry.objects.all().delete()
    PurchaseOrder.objects.all().delete()
    SalesInvoice.objects.all().delete()
    AdvanceBooking.objects.all().delete()
    StockTransfer.objects.all().delete()
    FifoOverride.objects.all().delete()
    Battery.objects.all().delete()
    VehicleUnit.objects.all().delete()
    VehicleModel.objects.all().delete()
    VehicleBrand.objects.all().delete()
    
    MelaBooking.objects.all().delete()
    MelaInventory.objects.all().delete()
    MelaVehicleBatteryCompatibility.objects.all().delete()
    MelaBatteryStock.objects.all().delete()
    MelaVehicleStock.objects.all().delete()
    MelaSettings.objects.all().delete()
    
    ActivityLog.objects.all().delete()
    Attendance.objects.all().delete()
    
    InventoryLocation.objects.all().delete()
    Showroom.objects.all().delete()
    Branch.objects.all().delete()
    
    print("Deleted all transactions, logs, inventory, vehicles, and branch data.")

    # Delete all users
    User.objects.all().delete()
    print("Deleted all existing users.")

    # Create the single owner user
    print("--- Creating owner user ---")
    owner_user = User.objects.create_user(
        username="owner",
        email="owner@kvr.in",
        password="owner@kvr123",
        role="owner",
        full_name="Owner",
        is_active=True,
        is_staff=True,
        is_superuser=True
    )
    print(f"Successfully created Owner user with username '{owner_user.username}' and email '{owner_user.email}'.")

if __name__ == "__main__":
    clear_and_create_owner()
