from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from branches.models import Branch, Showroom, InventoryLocation
from vehicles.models import VehicleBrand, VehicleModel, VehicleUnit
from battery.models import Battery, FifoOverride
from ledger.models import LedgerEntry
from sales.models import SalesInvoice
import datetime

User = get_user_model()

class SalesIntegrationTests(APITestCase):
    def setUp(self):
        # Create user
        self.sales_exec = User.objects.create_user(
            username='sales_exec', password='password123', role='sales_executive', branch='Vizag'
        )
        self.supervisor = User.objects.create_user(
            username='supervisor_user', password='password123', role='supervisor', branch='Vizag'
        )

        # Create branch, showroom, location registers
        self.branch = Branch.objects.create(name='Vizag', address='Visakhapatnam', phone_number='1234567890')
        self.showroom = Showroom.objects.create(branch=self.branch, name='KVR Showroom')
        self.location = InventoryLocation.objects.create(branch=self.branch, showroom=self.showroom, name='Warehouse A')

        # Create vehicle catalog
        self.brand = VehicleBrand.objects.create(name='Kinetic Green')
        self.vehicle_model = VehicleModel.objects.create(
            brand=self.brand,
            model_name='Zoom LFP',
            base_price=112000.00,
            color_variants=['Green', 'Blue'],
            battery_compatibility='1.2 kWh'
        )

        # Create two batteries for FIFO testing
        # Battery A is older (purchased 10 days ago)
        self.battery_a = Battery.objects.create(
            serial_number='BAT-FIFO-A',
            battery_code='BAT-LFP-GEN',
            capacity='1.2 kWh',
            purchase_date=datetime.date.today() - datetime.timedelta(days=10),
            status='available',
            location=self.location,
            supplier='Kinetic Supplier'
        )
        # Battery B is newer (purchased today)
        self.battery_b = Battery.objects.create(
            serial_number='BAT-FIFO-B',
            battery_code='BAT-LFP-GEN',
            capacity='1.2 kWh',
            purchase_date=datetime.date.today(),
            status='available',
            location=self.location,
            supplier='Kinetic Supplier'
        )

        # Create vehicle units
        self.vehicle_unit = VehicleUnit.objects.create(
            model=self.vehicle_model,
            branch=self.branch,
            showroom=self.showroom,
            location=self.location,
            vin_number='VIN12345678901234',
            motor_number='MOT12345',
            chassis_number='CHA12345',
            color='Green',
            purchase_date=datetime.date.today(),
            stock_status='available'
        )

    def test_sales_invoice_creation_success_with_fifo(self):
        self.client.force_authenticate(user=self.sales_exec)
        url = reverse('salesinvoice-list')
        data = {
            'customer_name': 'Aswin Kumar',
            'customer_contact': '9999999999',
            'vehicle_unit': self.vehicle_unit.id,
            'assigned_battery': self.battery_a.id,  # Oldest battery -> FIFO satisfies!
            'sale_price': '115000.00',
            'payment_mode': 'Cash',
            'sales_executive': self.sales_exec.id,
            'branch': self.branch.id,
            'delivery_status': 'processing'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify unit status updated to sold
        self.vehicle_unit.refresh_from_db()
        self.assertEqual(self.vehicle_unit.stock_status, 'sold')
        self.assertEqual(self.vehicle_unit.assigned_battery, self.battery_a.serial_number)

        # Verify battery status updated to sold
        self.battery_a.refresh_from_db()
        self.assertEqual(self.battery_a.status, 'sold')

        # Verify LedgerEntry is created
        ledger_count = LedgerEntry.objects.filter(
            ledger_type='sales_income',
            branch=self.branch,
            income=115000.00
        ).count()
        self.assertEqual(ledger_count, 1)

    def test_sales_invoice_fifo_violation_error(self):
        self.client.force_authenticate(user=self.sales_exec)
        url = reverse('salesinvoice-list')
        data = {
            'customer_name': 'Aswin Kumar',
            'customer_contact': '9999999999',
            'vehicle_unit': self.vehicle_unit.id,
            'assigned_battery': self.battery_b.id,  # Newer battery -> FIFO violated!
            'sale_price': '115000.00',
            'payment_mode': 'Cash',
            'sales_executive': self.sales_exec.id,
            'branch': self.branch.id,
            'delivery_status': 'processing'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('FIFO Violation', str(response.data))

    def test_sales_invoice_fifo_override_allowed(self):
        # Create an approved FIFO override request for Battery B
        FifoOverride.objects.create(
            battery=self.battery_b,
            sales_executive=self.sales_exec.username,
            invoice_reference='INV-TEST-OVERRIDE',
            status='approved'
        )

        self.client.force_authenticate(user=self.sales_exec)
        url = reverse('salesinvoice-list')
        data = {
            'customer_name': 'Aswin Kumar',
            'customer_contact': '9999999999',
            'vehicle_unit': self.vehicle_unit.id,
            'assigned_battery': self.battery_b.id,  # Newer battery with approved override!
            'sale_price': '115000.00',
            'payment_mode': 'Cash',
            'sales_executive': self.sales_exec.id,
            'branch': self.branch.id,
            'delivery_status': 'processing'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify battery status updated to sold
        self.battery_b.refresh_from_db()
        self.assertEqual(self.battery_b.status, 'sold')
