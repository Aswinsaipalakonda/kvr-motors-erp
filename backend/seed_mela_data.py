import os
import django
from datetime import date

# Set up Django context
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from vehicles.models import VehicleModel
from mela.models import MelaInventory, MelaBooking
from users.models import User

def seed_mela_data():
    print("--- Seeding Mela Campaign Inventory ---")
    
    # Retrieve vehicle models
    luna = VehicleModel.objects.filter(model_name="Kinetic Green E-Luna").first()
    dynamo = VehicleModel.objects.filter(model_name="Dynamo Pro").first()
    watts = VehicleModel.objects.filter(model_name="Watts 100").first()
    
    if not luna or not dynamo or not watts:
        print("Required models are missing. Please make sure seed_erp_data.py has run first.")
        return
        
    # Register Mela Stocks
    # 1. Kinetic Green E-Luna - Red, Graphene battery, Qty: 15, Price: 62000
    MelaInventory.objects.get_or_create(
        vehicle_model=luna,
        color="Red",
        battery_type="graphene",
        defaults={
            "initial_quantity": 15,
            "remaining_quantity": 15,
            "price": 62000.00,
            "is_active": True
        }
    )
    
    # 2. Kinetic Green E-Luna - Green, Li-24 battery, Qty: 10, Price: 68000
    MelaInventory.objects.get_or_create(
        vehicle_model=luna,
        color="Green",
        battery_type="Li-24",
        defaults={
            "initial_quantity": 10,
            "remaining_quantity": 10,
            "price": 68000.00,
            "is_active": True
        }
    )

    # 3. Dynamo Pro - Blue, Li-30 battery, Qty: 8, Price: 85000
    MelaInventory.objects.get_or_create(
        vehicle_model=dynamo,
        color="Blue",
        battery_type="Li-30",
        defaults={
            "initial_quantity": 8,
            "remaining_quantity": 8,
            "price": 85000.00,
            "is_active": True
        }
    )

    # 4. Watts 100 - Matte Black, Li-40 battery, Qty: 5, Price: 125000
    MelaInventory.objects.get_or_create(
        vehicle_model=watts,
        color="Matte Black",
        battery_type="Li-40",
        defaults={
            "initial_quantity": 5,
            "remaining_quantity": 5,
            "price": 125000.00,
            "is_active": True
        }
    )
    
    print("=== Mela Campaign Seeding Complete! ===")

if __name__ == "__main__":
    seed_mela_data()
