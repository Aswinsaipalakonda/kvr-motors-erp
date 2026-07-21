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
from leads.models import Lead

def seed_erp_data():
    print("--- Truncating / Clearing stale transactional data ---")
    from ledger.models import LedgerEntry
    from purchases.models import PurchaseOrder
    from branches.models import BranchExpense, BranchCashDeposit, IssueReport
    from battery.models import Battery
    from vehicles.models import VehicleUnit

    LedgerEntry.objects.all().delete()
    AdvanceBooking.objects.all().delete()
    SalesInvoice.objects.all().delete()
    PurchaseOrder.objects.all().delete()
    BranchExpense.objects.all().delete()
    BranchCashDeposit.objects.all().delete()
    Lead.objects.all().delete()
    StockTransfer.objects.all().delete()
    IssueReport.objects.all().delete()
    VehicleUnit.objects.all().delete()
    Battery.objects.all().delete()

    print("--- Seeding Branches & Locations ---")
    branch, created = Branch.objects.get_or_create(
        name="KVR Motors - Visakhapatnam",
        defaults={
            "address": "Visakhapatnam City High Road",
            "phone_number": "9876543210",
            "is_active": True,
            "manager_name": "Suresh Babu",
            "total_stock": 120,
            "sales_volume": 11200000.00,
            "monthly_target": 15000000.00,
            "target_achieved_pct": 74
        }
    )
    if not created:
        branch.manager_name = "Suresh Babu"
        branch.total_stock = 120
        branch.sales_volume = 11200000.00
        branch.monthly_target = 15000000.00
        branch.target_achieved_pct = 74
        branch.save()
    
    showroom_visakhapatnam, _ = Showroom.objects.get_or_create(
        branch=branch,
        name="KVR Showroom - Visakhapatnam",
        defaults={"is_active": True}
    )
    
    # 1 Central Godown located at Vizag / Visakhapatnam
    location_vizag_godown, _ = InventoryLocation.objects.get_or_create(
        branch=branch,
        name="Vizag Central Godown",
        defaults={
            "showroom": showroom_visakhapatnam,
            "is_active": True
        }
    )

    # Add Srikakulam branch and showroom
    branch_srikakulam, created = Branch.objects.get_or_create(
        name="KVR Motors - Srikakulam",
        defaults={
            "address": "Srikakulam Highway Junction",
            "phone_number": "9876543215",
            "is_active": True,
            "manager_name": "Satish Kumar",
            "total_stock": 85,
            "sales_volume": 7200000.00,
            "monthly_target": 10000000.00,
            "target_achieved_pct": 72
        }
    )
    if not created:
        branch_srikakulam.manager_name = "Satish Kumar"
        branch_srikakulam.total_stock = 85
        branch_srikakulam.sales_volume = 7200000.00
        branch_srikakulam.monthly_target = 10000000.00
        branch_srikakulam.target_achieved_pct = 72
        branch_srikakulam.save()

    showroom_srikakulam, _ = Showroom.objects.get_or_create(
        branch=branch_srikakulam,
        name="KVR Showroom - Srikakulam",
        defaults={"is_active": True}
    )

    # Add Kakinada branch and showroom
    branch_kakinada, created = Branch.objects.get_or_create(
        name="KVR Motors - Kakinada",
        defaults={
            "address": "Kakinada Main Road",
            "phone_number": "9876543216",
            "is_active": True,
            "manager_name": "N. Venkat",
            "total_stock": 95,
            "sales_volume": 8500000.00,
            "monthly_target": 12000000.00,
            "target_achieved_pct": 70
        }
    )
    if not created:
        branch_kakinada.manager_name = "N. Venkat"
        branch_kakinada.total_stock = 95
        branch_kakinada.sales_volume = 8500000.00
        branch_kakinada.monthly_target = 12000000.00
        branch_kakinada.target_achieved_pct = 70
        branch_kakinada.save()

    showroom_kakinada, _ = Showroom.objects.get_or_create(
        branch=branch_kakinada,
        name="KVR Showroom - Kakinada",
        defaults={"is_active": True}
    )

    # Add Vizag branch and showroom
    branch_vizag, created = Branch.objects.get_or_create(
        name="KVR Motors - Vizag",
        defaults={
            "address": "Vizag City High Road",
            "phone_number": "9876543217",
            "is_active": True,
            "manager_name": "T. Prasad",
            "total_stock": 110,
            "sales_volume": 9500000.00,
            "monthly_target": 13000000.00,
            "target_achieved_pct": 73
        }
    )
    if not created:
        branch_vizag.manager_name = "T. Prasad"
        branch_vizag.total_stock = 110
        branch_vizag.sales_volume = 9500000.00
        branch_vizag.monthly_target = 13000000.00
        branch_vizag.target_achieved_pct = 73
        branch_vizag.save()

    showroom_vizag, _ = Showroom.objects.get_or_create(
        branch=branch_vizag,
        name="KVR Showroom - Vizag",
        defaults={"is_active": True}
    )

    # Showroom Inventory Locations (4 Showrooms)
    location_visakhapatnam, _ = InventoryLocation.objects.get_or_create(
        branch=branch,
        name="KVR Showroom - Visakhapatnam",
        defaults={"showroom": showroom_visakhapatnam, "is_active": True}
    )
    location_srikakulam, _ = InventoryLocation.objects.get_or_create(
        branch=branch_srikakulam,
        name="KVR Showroom - Srikakulam",
        defaults={"showroom": showroom_srikakulam, "is_active": True}
    )
    location_kakinada, _ = InventoryLocation.objects.get_or_create(
        branch=branch_kakinada,
        name="KVR Showroom - Kakinada",
        defaults={"showroom": showroom_kakinada, "is_active": True}
    )
    location_vizag, _ = InventoryLocation.objects.get_or_create(
        branch=branch_vizag,
        name="KVR Showroom - Vizag",
        defaults={"showroom": showroom_vizag, "is_active": True}
    )

    location_pendurthi = location_vizag_godown



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
            "from_location": location_vizag_godown,
            "to_location": location_srikakulam,
            "status": "pending",
            "requested_by": sales_user
        }
    )
    StockTransfer.objects.get_or_create(
        transfer_id="TR-2026-903",
        defaults={
            "vehicle_unit": unit_dynamo,
            "from_location": location_kakinada,
            "to_location": location_vizag_godown,
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
    
    # Seed batteries for other branches first
    for s_num in ["BATT-00801", "BATT-00802", "BATT-00803"]:
        Battery.objects.get_or_create(
            serial_number=s_num,
            defaults={
                "capacity": "2.0 kWh",
                "purchase_date": date(2024, 1, 10),
                "status": "available",
                "location": location_vizag_godown,
                "supplier": "Future Batteries Ltd",
                "warranty_years": 3
            }
        )

    # Seed physical units for other branches
    unit_sri_luna, _ = VehicleUnit.objects.get_or_create(
        vin_number="KVRVIN2026X201",
        defaults={
            "model": model_luna,
            "branch": branch_srikakulam,
            "showroom": showroom_srikakulam,
            "location": location_srikakulam,
            "motor_number": "MTR-70801",
            "chassis_number": "CHS-68901",
            "color": "Green",
            "purchase_date": date(2024, 5, 12),
            "stock_status": "available",
            "assigned_battery": "BATT-00801"
        }
    )

    unit_kak_dynamo, _ = VehicleUnit.objects.get_or_create(
        vin_number="KVRVIN2026X301",
        defaults={
            "model": model_dynamo,
            "branch": branch_kakinada,
            "showroom": showroom_kakinada,
            "location": location_kakinada,
            "motor_number": "MTR-70802",
            "chassis_number": "CHS-68902",
            "color": "Blue",
            "purchase_date": date(2024, 5, 12),
            "stock_status": "available",
            "assigned_battery": "BATT-00802"
        }
    )

    unit_viz_watts, _ = VehicleUnit.objects.get_or_create(
        vin_number="KVRVIN2026X401",
        defaults={
            "model": model_watts,
            "branch": branch_vizag,
            "showroom": showroom_vizag,
            "location": location_vizag,
            "motor_number": "MTR-70803",
            "chassis_number": "CHS-68903",
            "color": "Red",
            "purchase_date": date(2024, 5, 12),
            "stock_status": "available",
            "assigned_battery": "BATT-00803"
        }
    )

    # Seed bookings for other branches
    AdvanceBooking.objects.get_or_create(
        booking_id="BK-8033",
        defaults={
            "customer_name": "K. Ramu",
            "contact_number": "9876543220",
            "vehicle_model": model_luna,
            "vehicle_unit": unit_sri_luna,
            "advance_amount": 6000.00,
            "expiry_date": date(2026, 6, 25),
            "status": "confirmed",
            "assigned_executive": sales_user,
            "pdi_verified": "yes"
        }
    )

    AdvanceBooking.objects.get_or_create(
        booking_id="BK-8044",
        defaults={
            "customer_name": "P. Kiran",
            "contact_number": "9876543221",
            "vehicle_model": model_watts,
            "vehicle_unit": unit_viz_watts,
            "advance_amount": 15000.00,
            "expiry_date": date(2026, 6, 28),
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

    SalesInvoice.objects.get_or_create(
        invoice_number="INV-2026-0801",
        defaults={
            "customer_name": "T. Apparao",
            "customer_contact": "9876543222",
            "vehicle_unit": unit_sri_luna,
            "assigned_battery": Battery.objects.get(serial_number="BATT-00801"),
            "sale_price": 74999.00,
            "payment_mode": "HDFC Finance",
            "insurance_partner": "HDFC Ergo",
            "delivery_status": "ready",
            "sales_executive": sales_user,
            "branch": branch_srikakulam
        }
    )

    SalesInvoice.objects.get_or_create(
        invoice_number="INV-2026-0802",
        defaults={
            "customer_name": "G. Vasu",
            "customer_contact": "9876543223",
            "vehicle_unit": unit_kak_dynamo,
            "assigned_battery": Battery.objects.get(serial_number="BATT-00802"),
            "sale_price": 98500.00,
            "payment_mode": "Cash",
            "insurance_partner": "Reliance General",
            "delivery_status": "ready",
            "sales_executive": sales_user,
            "branch": branch_kakinada
        }
    )

    SalesInvoice.objects.get_or_create(
        invoice_number="INV-2026-0803",
        defaults={
            "customer_name": "Y. Prakash",
            "customer_contact": "9876543224",
            "vehicle_unit": unit_viz_watts,
            "assigned_battery": Battery.objects.get(serial_number="BATT-00803"),
            "sale_price": 145000.00,
            "payment_mode": "ICICI Finance",
            "insurance_partner": "ICICI Lombard",
            "delivery_status": "ready",
            "sales_executive": sales_user,
            "branch": branch_vizag
        }
    )

    # Seed Leads for different branches
    Lead.objects.get_or_create(
        customer_name="Srikakulam Buyer",
        contact_number="9876543225",
        defaults={
            "interested_vehicle": model_luna,
            "status": "new_lead",
            "lead_source": "walk_in",
            "branch": "KVR Motors - Srikakulam"
        }
    )

    Lead.objects.get_or_create(
        customer_name="Kakinada Buyer",
        contact_number="9876543226",
        defaults={
            "interested_vehicle": model_dynamo,
            "status": "negotiation",
            "lead_source": "reference",
            "branch": "KVR Motors - Kakinada"
        }
    )

    Lead.objects.get_or_create(
        customer_name="Vizag Future Buyer",
        contact_number="9876543227",
        defaults={
            "interested_vehicle": model_watts,
            "status": "won",
            "lead_source": "social_media",
            "branch": "KVR Motors - Vizag"
        }
    )

    # Seed Ledger entries for different branches
    from ledger.models import LedgerEntry

    # Seed Ledger entries for the 4 seeded bookings
    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-BK-8012",
        defaults={
            "ledger_type": "booking_amount",
            "branch": branch,
            "detail": "Automated entry for Advance Booking BK-8012 (Customer: A. Srinivas)",
            "income": 5000.00,
            "expense": 0.00,
            "payment_mode": "Cash"
        }
    )
    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-BK-8021",
        defaults={
            "ledger_type": "booking_amount",
            "branch": branch,
            "detail": "Automated entry for Advance Booking BK-8021 (Customer: V. Prasad)",
            "income": 10000.00,
            "expense": 0.00,
            "payment_mode": "UPI"
        }
    )
    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-BK-8033",
        defaults={
            "ledger_type": "booking_amount",
            "branch": branch_srikakulam,
            "detail": "Automated entry for Advance Booking BK-8033 (Customer: K. Ramu)",
            "income": 6000.00,
            "expense": 0.00,
            "payment_mode": "Cash"
        }
    )
    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-BK-8044",
        defaults={
            "ledger_type": "booking_amount",
            "branch": branch_vizag,
            "detail": "Automated entry for Advance Booking BK-8044 (Customer: P. Kiran)",
            "income": 15000.00,
            "expense": 0.00,
            "payment_mode": "UPI"
        }
    )

    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-SRI-001",
        defaults={
            "ledger_type": "sales_income",
            "branch": branch_srikakulam,
            "detail": "Luna Sale Income - Apparao",
            "income": 74999.00,
            "expense": 0.00,
            "payment_mode": "HDFC Finance"
        }
    )
    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-SRI-002",
        defaults={
            "ledger_type": "operational_expense",
            "branch": branch_srikakulam,
            "detail": "Srikakulam Office Rent",
            "income": 0.00,
            "expense": 15000.00,
            "payment_mode": "Bank Transfer"
        }
    )

    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-KAK-001",
        defaults={
            "ledger_type": "sales_income",
            "branch": branch_kakinada,
            "detail": "Dynamo Pro Sale Income - Vasu",
            "income": 98500.00,
            "expense": 0.00,
            "payment_mode": "Cash"
        }
    )
    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-KAK-002",
        defaults={
            "ledger_type": "operational_expense",
            "branch": branch_kakinada,
            "detail": "Kakinada Office Rent",
            "income": 0.00,
            "expense": 12000.00,
            "payment_mode": "Bank Transfer"
        }
    )

    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-VIZ-001",
        defaults={
            "ledger_type": "sales_income",
            "branch": branch_vizag,
            "detail": "Watts 100 Sale Income - Prakash",
            "income": 145000.00,
            "expense": 0.00,
            "payment_mode": "ICICI Finance"
        }
    )
    LedgerEntry.objects.get_or_create(
        transaction_id="TXN-VIZ-002",
        defaults={
            "ledger_type": "operational_expense",
            "branch": branch_vizag,
            "detail": "Vizag Future Ride Rent",
            "income": 0.00,
            "expense": 25000.00,
            "payment_mode": "Bank Transfer"
        }
    )

    print("=== All ERP Inventory Seeding Complete! ===")


if __name__ == "__main__":
    seed_erp_data()
