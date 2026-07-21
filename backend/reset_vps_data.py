import os
import django

# Set Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from seed_users import seed_users
from seed_erp_data import seed_erp_data
from seed_mela_data import seed_mela_data
from seed_attendance import seed_attendance

def reset_vps_data():
    print("=========================================")
    print("Starting VPS Application Data Reset & Seeding...")
    print("=========================================")

    print("1. Seeding/synchronizing essential user logins...")
    try:
        seed_users()
    except Exception as e:
        print(f"Error seeding users: {e}")

    print("2. Seeding rich enterprise ERP data (branches, vehicles, sales, bookings, leads, ledger)...")
    try:
        seed_erp_data()
    except Exception as e:
        print(f"Error seeding ERP data: {e}")

    print("3. Seeding Mela Campaign Inventory...")
    try:
        seed_mela_data()
    except Exception as e:
        print(f"Error seeding Mela data: {e}")

    print("4. Seeding staff attendance logs...")
    try:
        seed_attendance()
    except Exception as e:
        print(f"Error seeding attendance: {e}")

    print("=========================================")
    print("VPS Application Data Reset Completed Successfully!")
    print("=========================================")

if __name__ == "__main__":
    reset_vps_data()
