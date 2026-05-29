import os
import django
from datetime import date

# Set up Django context
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from branches.models import Branch, Showroom, InventoryLocation
from vehicles.models import VehicleBrand, VehicleModel, VehicleUnit
from battery.models import Battery
from users.models import User

def seed_erp_data():
    print("--- Seeding Branches & Locations ---")
    branch, _ = Branch.objects.get_or_create(
        name="KVR Motors - Vizag",
        defaults={
            "address": "Vizag City High Road",
            "phone_number": "9876543210",
            "is_active": True
        }
    )
    
    showroom_vizag, _ = Showroom.objects.get_or_create(
        branch=branch,
        name="KVR Showroom - Vizag",
        defaults={"is_active": True}
    )
    
    showroom_future, _ = Showroom.objects.get_or_create(
        branch=branch,
        name="Future Ride - Vizag",
        defaults={"is_active": True}
    )
    
    location_pendurthi, _ = InventoryLocation.objects.get_or_create(
        branch=branch,
        name="Pendurthi Godown",
        defaults={
            "showroom": showroom_vizag,
            "is_active": True
        }
    )
    
    location_pineapple, _ = InventoryLocation.objects.get_or_create(
        branch=branch,
        name="Pineapple Colony Godown",
        defaults={
            "showroom": showroom_future,
            "is_active": True
        }
    )

    print("--- Seeding Vehicle Brands & Models ---")
    brand_kinetic, _ = VehicleBrand.objects.get_or_create(name="Kinetic Green", defaults={"is_active": True})
    brand_dynamo, _ = VehicleBrand.objects.get_or_create(name="Dynamo", defaults={"is_active": True})
    brand_watts, _ = VehicleBrand.objects.get_or_create(name="Watts", defaults={"is_active": True})
    
    model_luna, _ = VehicleModel.objects.get_or_create(
        brand=brand_kinetic,
        model_name="Kinetic Green E-Luna",
        defaults={
            "base_price": 74999.00,
            "color_variants": ["Green", "Red", "Black"],
            "battery_compatibility": "1.2 kWh Li-ion",
            "status": "active"
        }
    )
    
    model_dynamo, _ = VehicleModel.objects.get_or_create(
        brand=brand_dynamo,
        model_name="Dynamo Pro",
        defaults={
            "base_price": 98500.00,
            "color_variants": ["Blue", "White", "Gray"],
            "battery_compatibility": "2.0 kWh Swappable",
            "status": "active"
        }
    )
    
    model_watts, _ = VehicleModel.objects.get_or_create(
        brand=brand_watts,
        model_name="Watts 100",
        defaults={
            "base_price": 145000.00,
            "color_variants": ["Matte Black", "Red"],
            "battery_compatibility": "3.2 kWh Fixed",
            "status": "active"
        }
    )

    print("--- Seeding Physical Vehicle Units ---")
    VehicleUnit.objects.get_or_create(
        vin_number="KVRVIN2026X101",
        defaults={
            "model": model_luna,
            "branch": branch,
            "showroom": showroom_vizag,
            "location": location_pendurthi,
            "motor_number": "MTR-90802",
            "chassis_number": "CHS-88902",
            "color": "Green",
            "purchase_date": date(2024, 5, 12),
            "stock_status": "available",
            "assigned_battery": "BATT-00982"
        }
    )
    
    VehicleUnit.objects.get_or_create(
        vin_number="KVRVIN2026X102",
        defaults={
            "model": model_dynamo,
            "branch": branch,
            "showroom": showroom_vizag,
            "location": location_pendurthi,
            "motor_number": "MTR-90805",
            "chassis_number": "CHS-88904",
            "color": "Blue",
            "purchase_date": date(2024, 5, 10),
            "stock_status": "booked",
            "assigned_battery": "BATT-00874"
        }
    )
    
    VehicleUnit.objects.get_or_create(
        vin_number="KVRVIN2026X104",
        defaults={
            "model": model_watts,
            "branch": branch,
            "showroom": showroom_vizag,
            "location": location_pendurthi,
            "motor_number": "MTR-90812",
            "chassis_number": "CHS-88915",
            "color": "Red",
            "purchase_date": date(2024, 5, 2),
            "stock_status": "available",
            "assigned_battery": "BATT-00511"
        }
    )

    print("--- Seeding Battery Storage Packs (FIFO Order Dates) ---")
    # BATT-00874 [Oldest]
    Battery.objects.get_or_create(
        serial_number="BATT-00874",
        defaults={
            "capacity": "2.0 kWh",
            "purchase_date": date(2024, 1, 10),
            "status": "available",
            "location": location_pendurthi,
            "supplier": "Future Batteries Ltd",
            "warranty_years": 3
        }
    )
    
    # BATT-00982 [Middle]
    Battery.objects.get_or_create(
        serial_number="BATT-00982",
        defaults={
            "capacity": "1.2 kWh",
            "purchase_date": date(2024, 3, 2),
            "status": "available",
            "location": location_pendurthi,
            "supplier": "Ampere Cells",
            "warranty_years": 3
        }
    )
    
    # BATT-00890 [Newest]
    Battery.objects.get_or_create(
        serial_number="BATT-00890",
        defaults={
            "capacity": "2.0 kWh",
            "purchase_date": date(2026, 5, 12),
            "status": "available",
            "location": location_pendurthi,
            "supplier": "Future Batteries Ltd",
            "warranty_years": 3
        }
    )

    print("--- Seeding System Privilege Users ---")
    demo_users = [
        {
            "username": "owner",
            "password": "owner123",
            "email": "owner@kvrmotors.com",
            "full_name": "Ravi Varma",
            "role": "owner",
            "branch": "KVR Motors - Vizag",
            "showroom": "KVR Showroom - Vizag",
            "phone_number": "9876543210"
        },
        {
            "username": "supervisor",
            "password": "super123",
            "email": "supervisor@kvrmotors.com",
            "full_name": "Suresh Babu",
            "role": "supervisor",
            "branch": "KVR Motors - Vizag",
            "showroom": "KVR Showroom - Vizag",
            "phone_number": "9876543211"
        },
        {
            "username": "sales",
            "password": "sales123",
            "email": "sales@kvrmotors.com",
            "full_name": "Anil Kumar",
            "role": "sales_executive",
            "branch": "KVR Motors - Vizag",
            "showroom": "KVR Showroom - Vizag",
            "phone_number": "9876543212"
        }
    ]

    for user_data in demo_users:
        user, created = User.objects.get_or_create(
            username=user_data["username"],
            defaults={
                "email": user_data["email"],
                "full_name": user_data["full_name"],
                "role": user_data["role"],
                "branch": user_data["branch"],
                "showroom": user_data["showroom"],
                "phone_number": user_data["phone_number"],
                "is_active": True
            }
        )
        user.set_password(user_data["password"])
        user.role = user_data["role"]
        user.full_name = user_data["full_name"]
        user.branch = user_data["branch"]
        user.showroom = user_data["showroom"]
        user.phone_number = user_data["phone_number"]
        user.is_active = True
        user.save()

    print("=== All ERP Inventory Seeding Complete! ===")

if __name__ == "__main__":
    seed_erp_data()
