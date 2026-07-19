import os
import django

# Set Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from branches.models import Branch, Showroom, InventoryLocation, BranchCashDeposit, BranchExpense, IssueReport
from vehicles.models import VehicleBrand, VehicleModel, VehicleUnit
from sales.models import SalesInvoice
from booking.models import AdvanceBooking
from leads.models import Lead
from battery.models import Battery, FifoOverride
from users.models import User
from seed_users import seed_users

def reset_vps_data():
    print("=========================================")
    print("Starting VPS Application Data Reset...")
    print("=========================================")

    # Delete transactional data
    print("Clearing transactional records (invoices, bookings, deposits, expenses, leads, issue reports, units, batteries)...")
    SalesInvoice.objects.all().delete()
    AdvanceBooking.objects.all().delete()
    BranchCashDeposit.objects.all().delete()
    BranchExpense.objects.all().delete()
    IssueReport.objects.all().delete()
    Lead.objects.all().delete()
    FifoOverride.objects.all().delete()
    VehicleUnit.objects.all().delete()
    Battery.objects.all().delete()

    print("Ensuring default enterprise branches exist...")
    b1, _ = Branch.objects.get_or_create(
        name="KVR Motors - Visakhapatnam",
        defaults={"address": "Visakhapatnam Main Showroom Rd", "manager_name": "Suresh Babu", "is_active": True}
    )
    b2, _ = Branch.objects.get_or_create(
        name="KVR Motors - Srikakulam",
        defaults={"address": "Srikakulam Highway Junction", "manager_name": "Ramana Murthy", "is_active": True}
    )

    s1, _ = Showroom.objects.get_or_create(branch=b1, name="KVR Showroom - Visakhapatnam", defaults={"is_active": True})
    s2, _ = Showroom.objects.get_or_create(branch=b2, name="KVR Showroom - Srikakulam", defaults={"is_active": True})

    InventoryLocation.objects.get_or_create(branch=b1, showroom=s1, name="Vizag Godown Main", defaults={"is_active": True})
    InventoryLocation.objects.get_or_create(branch=b2, showroom=s2, name="Srikakulam Depot", defaults={"is_active": True})

    print("Ensuring standard vehicle models exist in catalog...")
    vb, _ = VehicleBrand.objects.get_or_create(name="Kinetic Green", defaults={"is_active": True})
    VehicleModel.objects.get_or_create(
        brand=vb,
        model_name="Kinetic Green E-Luna",
        defaults={"base_price": 74999, "color_variants": ["Green", "Black", "Red"], "status": "active"}
    )
    VehicleModel.objects.get_or_create(
        brand=vb,
        model_name="Kinetic Green Flex",
        defaults={"base_price": 98500, "color_variants": ["Blue", "Matte Black"], "status": "active"}
    )

    print("Seeding/synchronizing essential user logins...")
    seed_users()

    print("=========================================")
    print("VPS Application Data Reset Completed Successfully!")
    print("=========================================")

if __name__ == "__main__":
    reset_vps_data()
