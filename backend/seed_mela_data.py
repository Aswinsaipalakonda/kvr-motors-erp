import os
import django
from datetime import date

# Set up Django context
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from vehicles.models import VehicleModel
from mela.models import MelaInventory, MelaBooking

def seed_mela_data():
    print("=== Clearing Stale Mela Campaign Data ===")
    MelaBooking.objects.all().delete()
    MelaInventory.objects.all().delete()

    print("=== Seeding Mela Campaign Inventory ===")
    
    # Retrieve vehicle models
    luna = VehicleModel.objects.filter(model_name="Kinetic Green E-Luna").first()
    dynamo = VehicleModel.objects.filter(model_name="Dynamo Pro").first()
    watts = VehicleModel.objects.filter(model_name="Watts 100").first()
    lima = VehicleModel.objects.filter(model_name="Lima").first()
    premium_luna = VehicleModel.objects.filter(model_name="Kinetic Green E-Luna Premium").first()
    
    if not luna or not dynamo or not watts or not lima or not premium_luna:
        print("Required models are missing. Please make sure seed_erp_data.py has run first.")
        return
        
    # Register Mela Stocks (Stock Qty: 15 for each spec)
    # 1. Kinetic Green E-Luna - Red, Graphene battery, Qty: 15, Price: 62000
    MelaInventory.objects.create(
        vehicle_model=luna,
        color="Red",
        battery_type="graphene",
        initial_quantity=15,
        remaining_quantity=15,
        price=62000.00,
        is_active=True
    )
    
    # 2. Kinetic Green E-Luna - Green, Li-24 battery, Qty: 15, Price: 68000
    MelaInventory.objects.create(
        vehicle_model=luna,
        color="Green",
        battery_type="Li-24",
        initial_quantity=15,
        remaining_quantity=15,
        price=68000.00,
        is_active=True
    )

    # 3. Dynamo Pro - Blue, Li-30 battery, Qty: 15, Price: 85000
    MelaInventory.objects.create(
        vehicle_model=dynamo,
        color="Blue",
        battery_type="Li-30",
        initial_quantity=15,
        remaining_quantity=15,
        price=85000.00,
        is_active=True
    )

    # 4. Watts 100 - Matte Black, Li-40 battery, Qty: 15, Price: 125000
    MelaInventory.objects.create(
        vehicle_model=watts,
        color="Matte Black",
        battery_type="Li-40",
        initial_quantity=15,
        remaining_quantity=15,
        price=125000.00,
        is_active=True
    )

    # 5. Lima - Yellow, Graphene battery, Qty: 15, Price: 75000
    MelaInventory.objects.create(
        vehicle_model=lima,
        color="Yellow",
        battery_type="graphene",
        initial_quantity=15,
        remaining_quantity=15,
        price=75000.00,
        is_active=True
    )

    # 6. Kinetic Green E-Luna Premium - White, Li-30 battery, Qty: 15, Price: 79000
    MelaInventory.objects.create(
        vehicle_model=premium_luna,
        color="White",
        battery_type="Li-30",
        initial_quantity=15,
        remaining_quantity=15,
        price=79000.00,
        is_active=True
    )
    
    print("=== Mela Campaign Seeding Complete! (All stocks set to 15) ===")

if __name__ == "__main__":
    seed_mela_data()
