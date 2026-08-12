"""
seed_demo_data.py
-----------------
Clears all bookings, leads, sales invoices and seeds:
  - 5 vehicle units already paired with a battery (assigned)
  - 5 vehicle units available to pair
  - 5 batteries assigned (to the 5 paired vehicles)
  - 5 batteries available

Run from the backend/ directory:
    python seed_demo_data.py
"""

import os
import django
from datetime import date

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from branches.models import Branch, Showroom, InventoryLocation
from vehicles.models import VehicleBrand, VehicleModel, VehicleUnit
from battery.models import Battery
from booking.models import AdvanceBooking
from sales.models import SalesInvoice
from leads.models import Lead


from seed_users import seed_users


def seed_demo_data():
    print("=" * 55)
    print("  KVR Motors Demo Data Seeder")
    print("=" * 55)

    print("\n[0/5] Seeding login credentials...")
    try:
        seed_users()
    except Exception as e:
        print(f"User seed note: {e}")

    print("\n[1/5] Clearing all old database records...")
    from ledger.models import LedgerEntry
    from purchases.models import PurchaseOrder
    from branches.models import BranchExpense, BranchCashDeposit, IssueReport
    from attendance.models import Attendance
    from activity_logs.models import ActivityLog

    ActivityLog.objects.all().delete()
    Attendance.objects.all().delete()
    LedgerEntry.objects.all().delete()
    AdvanceBooking.objects.all().delete()
    SalesInvoice.objects.all().delete()
    PurchaseOrder.objects.all().delete()
    BranchExpense.objects.all().delete()
    BranchCashDeposit.objects.all().delete()
    Lead.objects.all().delete()
    IssueReport.objects.all().delete()
    VehicleUnit.objects.all().delete()
    Battery.objects.all().delete()
    print("      All cleared.")

    # ------------------------------------------------------------------
    # 2. Ensure branch / showroom / location exist & reset metrics
    # ------------------------------------------------------------------
    print("\n[2/5] Ensuring branch, showroom & location exist ...")
    
    # Reset all existing branches total_stock and sales_volume to zero first
    for b in Branch.objects.all():
        b.total_stock = 0
        b.sales_volume = 0.00
        b.target_achieved_pct = 0
        b.save()

    branch, _ = Branch.objects.get_or_create(
        name="KVR Motors - Visakhapatnam",
        defaults={
            "address": "Visakhapatnam City High Road",
            "phone_number": "9876543210",
            "is_active": True,
            "manager_name": "Suresh Babu",
            "total_stock": 10,
            "sales_volume": 0.00,
            "monthly_target": 1000000.00,
            "target_achieved_pct": 0,
        },
    )
    branch.total_stock = 10
    branch.sales_volume = 0.00
    branch.target_achieved_pct = 0
    branch.save()
    showroom, _ = Showroom.objects.get_or_create(
        branch=branch,
        name="KVR Showroom - Visakhapatnam",
        defaults={"is_active": True},
    )
    location, _ = InventoryLocation.objects.get_or_create(
        branch=branch,
        name="Vizag Central Godown",
        defaults={"showroom": showroom, "is_active": True},
    )
    print(f"      âœ“ Branch: {branch.name}  |  Location: {location.name}")

    # ------------------------------------------------------------------
    # 3. Ensure vehicle brand & models exist
    # ------------------------------------------------------------------
    print("\n[3/5] Ensuring vehicle brand & models exist ...")
    brand, _ = VehicleBrand.objects.get_or_create(
        name="KVR Electric",
        defaults={"is_active": True},
    )

    models_data = [
        {
            "model_name": "KVR Spark 60",
            "base_price": 68000,
            "color_variants": ["Red", "Blue", "White", "Black"],
            "battery_compatibility": "LFP-60V20Ah",
        },
        {
            "model_name": "KVR Bolt 72",
            "base_price": 79000,
            "color_variants": ["Silver", "Black", "Green"],
            "battery_compatibility": "LFP-72V24Ah",
        },
        {
            "model_name": "KVR Thunder Pro",
            "base_price": 95000,
            "color_variants": ["Matte Black", "Pearl White", "Red"],
            "battery_compatibility": "LFP-72V30Ah",
        },
        {
            "model_name": "KVR Glide 48",
            "base_price": 55000,
            "color_variants": ["Blue", "Grey", "White"],
            "battery_compatibility": "LFP-48V20Ah",
        },
        {
            "model_name": "KVR Storm X",
            "base_price": 105000,
            "color_variants": ["Midnight Blue", "Racing Red", "Graphite"],
            "battery_compatibility": "LFP-72V36Ah",
        },
    ]

    vehicle_models = []
    for m in models_data:
        vm, _ = VehicleModel.objects.get_or_create(
            brand=brand,
            model_name=m["model_name"],
            defaults={
                "base_price": m["base_price"],
                "color_variants": m["color_variants"],
                "battery_compatibility": m["battery_compatibility"],
                "status": "active",
            },
        )
        vehicle_models.append(vm)
        print(f"      âœ“ Model: {vm}")

    # ------------------------------------------------------------------
    # 4. Create 10 standalone available batteries
    # ------------------------------------------------------------------
    print("\n[4/5] Creating 10 available batteries in stock ...")

    batteries_data = [
        {"serial_number": "BAT-LFP-A001", "battery_code": "LFP-60V20Ah", "capacity": "1.2 kWh"},
        {"serial_number": "BAT-LFP-A002", "battery_code": "LFP-72V24Ah", "capacity": "1.7 kWh"},
        {"serial_number": "BAT-LFP-A003", "battery_code": "LFP-72V30Ah", "capacity": "2.2 kWh"},
        {"serial_number": "BAT-LFP-A004", "battery_code": "LFP-48V20Ah", "capacity": "1.0 kWh"},
        {"serial_number": "BAT-LFP-A005", "battery_code": "LFP-72V36Ah", "capacity": "2.6 kWh"},
        {"serial_number": "BAT-LFP-B001", "battery_code": "LFP-60V20Ah", "capacity": "1.2 kWh"},
        {"serial_number": "BAT-LFP-B002", "battery_code": "LFP-72V24Ah", "capacity": "1.7 kWh"},
        {"serial_number": "BAT-LFP-B003", "battery_code": "LFP-72V30Ah", "capacity": "2.2 kWh"},
        {"serial_number": "BAT-LFP-B004", "battery_code": "LFP-48V20Ah", "capacity": "1.0 kWh"},
        {"serial_number": "BAT-LFP-B005", "battery_code": "LFP-72V36Ah", "capacity": "2.6 kWh"},
    ]

    for b in batteries_data:
        bat = Battery.objects.create(
            serial_number=b["serial_number"],
            battery_code=b["battery_code"],
            capacity=b["capacity"],
            purchase_date=date(2025, 6, 1),
            status="available",
            location=location,
            supplier="LFP Power India Ltd.",
            warranty_years=3,
        )
        print(f"      [OK] Battery (available): {bat.serial_number}")

    # ------------------------------------------------------------------
    # 5. Create 10 standalone vehicle units (stock_status=available)
    # ------------------------------------------------------------------
    print("\n[5/5] Creating 10 vehicle units in available stock ...")

    all_units_data = [
        {"model": vehicle_models[0], "vin_number": "KVR-VIN-2025-001", "chassis_number": "CHS-KVR-001", "motor_number": "MOT-KVR-001", "color": "Red"},
        {"model": vehicle_models[1], "vin_number": "KVR-VIN-2025-002", "chassis_number": "CHS-KVR-002", "motor_number": "MOT-KVR-002", "color": "Black"},
        {"model": vehicle_models[2], "vin_number": "KVR-VIN-2025-003", "chassis_number": "CHS-KVR-003", "motor_number": "MOT-KVR-003", "color": "Matte Black"},
        {"model": vehicle_models[3], "vin_number": "KVR-VIN-2025-004", "chassis_number": "CHS-KVR-004", "motor_number": "MOT-KVR-004", "color": "Blue"},
        {"model": vehicle_models[4], "vin_number": "KVR-VIN-2025-005", "chassis_number": "CHS-KVR-005", "motor_number": "MOT-KVR-005", "color": "Midnight Blue"},
        {"model": vehicle_models[0], "vin_number": "KVR-VIN-2025-006", "chassis_number": "CHS-KVR-006", "motor_number": "MOT-KVR-006", "color": "Blue"},
        {"model": vehicle_models[1], "vin_number": "KVR-VIN-2025-007", "chassis_number": "CHS-KVR-007", "motor_number": "MOT-KVR-007", "color": "Silver"},
        {"model": vehicle_models[2], "vin_number": "KVR-VIN-2025-008", "chassis_number": "CHS-KVR-008", "motor_number": "MOT-KVR-008", "color": "Pearl White"},
        {"model": vehicle_models[3], "vin_number": "KVR-VIN-2025-009", "chassis_number": "CHS-KVR-009", "motor_number": "MOT-KVR-009", "color": "Grey"},
        {"model": vehicle_models[4], "vin_number": "KVR-VIN-2025-010", "chassis_number": "CHS-KVR-010", "motor_number": "MOT-KVR-010", "color": "Racing Red"},
    ]

    for u in all_units_data:
        unit = VehicleUnit.objects.create(
            model=u["model"],
            branch=branch,
            showroom=showroom,
            location=location,
            vin_number=u["vin_number"],
            chassis_number=u["chassis_number"],
            motor_number=u["motor_number"],
            color=u["color"],
            purchase_date=date(2025, 8, 1),
            purchase_invoice_number=f"PO-2025-{u['vin_number'][-3:]}",
            payment_status="success",
            stock_status="available",
            assigned_battery=None,
        )
        print(f"      [OK] [AVAILABLE] {unit.model.model_name} | VIN: {unit.vin_number} (Color: {unit.color})")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    total_units = VehicleUnit.objects.count()
    total_bats = Battery.objects.count()
    available_bats = Battery.objects.filter(status="available").count()
    assigned_bats = Battery.objects.filter(status="assigned").count()

    print("\n" + "=" * 55)
    print("  SEEDING COMPLETE")
    print("=" * 55)
    print(f"  Vehicle Units : {total_units}  (5 paired, 5 unpaired)")
    print(f"  Batteries     : {total_bats}  ({assigned_bats} assigned, {available_bats} available)")
    print(f"  Bookings      : {AdvanceBooking.objects.count()}")
    print(f"  Leads         : {Lead.objects.count()}")
    print(f"  Sales         : {SalesInvoice.objects.count()}")
    print("=" * 55)


if __name__ == "__main__":
    seed_demo_data()

