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
from inventory.models import StockTransfer
from booking.models import AdvanceBooking
from sales.models import SalesInvoice

def seed_erp_data():
    print("--- Seeding Branches & Locations ---")
    branch, _ = Branch.objects.get_or_create(
        name="KVR Motors - Visakhapatnam",
        defaults={
            "address": "Visakhapatnam City High Road",
            "phone_number": "9876543210",
            "is_active": True
        }
    )
    
    showroom_visakhapatnam, _ = Showroom.objects.get_or_create(
        branch=branch,
        name="KVR Showroom - Visakhapatnam",
        defaults={"is_active": True}
    )
    
    showroom_future, _ = Showroom.objects.get_or_create(
        branch=branch,
        name="Future Ride - Visakhapatnam",
        defaults={"is_active": True}
    )
    
    location_pendurthi, _ = InventoryLocation.objects.get_or_create(
        branch=branch,
        name="Pendurthi Godown",
        defaults={
            "showroom": showroom_visakhapatnam,
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
            "showroom": showroom_visakhapatnam,
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
            "showroom": showroom_visakhapatnam,
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
            "showroom": showroom_visakhapatnam,
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
            "branch": "KVR Motors - Visakhapatnam",
            "showroom": "KVR Showroom - Visakhapatnam",
            "phone_number": "9876543210"
        },
        {
            "username": "supervisor",
            "password": "super123",
            "email": "supervisor@kvrmotors.com",
            "full_name": "Suresh Babu",
            "role": "supervisor",
            "branch": "KVR Motors - Visakhapatnam",
            "showroom": "KVR Showroom - Visakhapatnam",
            "phone_number": "9876543211"
        },
        {
            "username": "sales",
            "password": "sales123",
            "email": "sales@kvrmotors.com",
            "full_name": "Anil Kumar",
            "role": "sales_executive",
            "branch": "KVR Motors - Visakhapatnam",
            "showroom": "KVR Showroom - Visakhapatnam",
            "phone_number": "9876543212"
        },
        {
            "username": "telecaller",
            "password": "tele123",
            "email": "telecaller@kvrmotors.com",
            "full_name": "Lakshmi Narayana",
            "role": "telecaller",
            "branch": "KVR Motors - Visakhapatnam",
            "showroom": "KVR Showroom - Visakhapatnam",
            "phone_number": "9876543214"
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

    print("--- Seeding Stock Transfers, Bookings & Sales Invoices ---")
    sales_user = User.objects.get(username="sales")
    supervisor_user = User.objects.get(username="supervisor")
    
    # We need vehicle units to transfer/sell/book
    unit_luna = VehicleUnit.objects.get(vin_number="KVRVIN2026X101")
    unit_dynamo = VehicleUnit.objects.get(vin_number="KVRVIN2026X102")
    unit_watts = VehicleUnit.objects.get(vin_number="KVRVIN2026X104")
    
    # Seed transfers
    StockTransfer.objects.get_or_create(
        transfer_id="TR-2026-902",
        defaults={
            "vehicle_unit": unit_luna,
            "from_location": location_pendurthi,
            "to_location": location_pineapple,
            "status": "pending",
            "requested_by": sales_user
        }
    )
    StockTransfer.objects.get_or_create(
        transfer_id="TR-2026-903",
        defaults={
            "vehicle_unit": unit_dynamo,
            "from_location": location_pineapple,
            "to_location": location_pendurthi,
            "status": "approved",
            "requested_by": sales_user,
            "approved_by": supervisor_user
        }
    )
    
    # Seed bookings
    AdvanceBooking.objects.get_or_create(
        booking_id="BK-8012",
        defaults={
            "customer_name": "A. Srinivas",
            "contact_number": "9876543210",
            "vehicle_model": model_luna,
            "vehicle_unit": unit_luna,
            "advance_amount": 5000.00,
            "expiry_date": date(2026, 6, 15),
            "status": "pending",
            "assigned_executive": sales_user,
            "pdi_verified": "pending"
        }
    )
    AdvanceBooking.objects.get_or_create(
        booking_id="BK-8021",
        defaults={
            "customer_name": "V. Prasad",
            "contact_number": "9876543211",
            "vehicle_model": model_dynamo,
            "vehicle_unit": unit_dynamo,
            "advance_amount": 10000.00,
            "expiry_date": date(2026, 6, 20),
            "status": "confirmed",
            "assigned_executive": sales_user,
            "pdi_verified": "yes"
        }
    )
    
    # Seed sales invoices
    SalesInvoice.objects.get_or_create(
        invoice_number="INV-2026-0789",
        defaults={
            "customer_name": "M. Satish",
            "customer_contact": "9876543212",
            "vehicle_unit": unit_watts,
            "assigned_battery": Battery.objects.get(serial_number="BATT-00890"),
            "sale_price": 145000.00,
            "payment_mode": "SBI Finance",
            "insurance_partner": "ICICI Lombard",
            "delivery_status": "ready",
            "sales_executive": sales_user,
            "branch": branch
        }
    )

    print("=== All ERP Inventory Seeding Complete! ===")

if __name__ == "__main__":
    seed_erp_data()
