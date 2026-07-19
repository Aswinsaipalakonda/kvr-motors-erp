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
    
    # Retrieve vehicle models (auto-create any missing ones)
    from vehicles.models import VehicleBrand
    brand_kinetic, _ = VehicleBrand.objects.get_or_create(name="Kinetic Green", defaults={"is_active": True})
    brand_dynamo, _ = VehicleBrand.objects.get_or_create(name="Dynamo", defaults={"is_active": True})
    brand_watts, _ = VehicleBrand.objects.get_or_create(name="Watts", defaults={"is_active": True})

    luna, _ = VehicleModel.objects.get_or_create(model_name="Kinetic Green E-Luna", defaults={"brand": brand_kinetic, "base_price": 74999.00, "status": "active"})
    dynamo, _ = VehicleModel.objects.get_or_create(model_name="Dynamo Pro", defaults={"brand": brand_dynamo, "base_price": 98500.00, "status": "active"})
    watts, _ = VehicleModel.objects.get_or_create(model_name="Watts 100", defaults={"brand": brand_watts, "base_price": 145000.00, "status": "active"})
    lima, _ = VehicleModel.objects.get_or_create(model_name="Lima", defaults={"brand": brand_dynamo, "base_price": 82000.00, "status": "active"})
    premium_luna, _ = VehicleModel.objects.get_or_create(model_name="Kinetic Green E-Luna Premium", defaults={"brand": brand_kinetic, "base_price": 85000.00, "status": "active"})
        
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
