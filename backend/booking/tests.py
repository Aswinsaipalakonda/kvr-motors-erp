from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from branches.models import Branch, Showroom, InventoryLocation
from vehicles.models import VehicleBrand, VehicleModel, VehicleUnit
from ledger.models import LedgerEntry
from booking.models import AdvanceBooking
import datetime

User = get_user_model()

class BookingIntegrationTests(APITestCase):
    def setUp(self):
        # Create users
        self.sales_exec = User.objects.create_user(
            username='sales_exec_bk', password='password123', role='sales_executive', branch='Vizag'
        )

        # Create registers
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

        # Create vehicle units
        self.vehicle_unit = VehicleUnit.objects.create(
            model=self.vehicle_model,
            branch=self.branch,
            showroom=self.showroom,
            location=self.location,
            vin_number='VIN98765432101234',
            motor_number='MOT98765',
            chassis_number='CHA98765',
            color='Green',
            purchase_date=datetime.date.today(),
            stock_status='available'
        )

    def test_booking_creation_reserves_vehicle_unit(self):
        self.client.force_authenticate(user=self.sales_exec)
        url = reverse('booking-list')
        data = {
            'customer_name': 'Sai Charan',
            'contact_number': '8888888888',
            'vehicle_model': self.vehicle_model.id,
            'color': 'Green',
            'advance_amount': '15000.00',
            'expiry_date': str(datetime.date.today() + datetime.timedelta(days=14)),
            'vehicle_unit': self.vehicle_unit.id,
            'payment_mode': 'UPI',
            'assigned_executive': self.sales_exec.id,
            'status': 'pending'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify unit is booked
        self.vehicle_unit.refresh_from_db()
        self.assertEqual(self.vehicle_unit.stock_status, 'booked')
        self.assertTrue(self.vehicle_unit.booking_status)

        # Verify Ledger entry is logged
        ledger_count = LedgerEntry.objects.filter(
            ledger_type='booking_amount',
            branch=self.branch,
            income=15000.00
        ).count()
        self.assertEqual(ledger_count, 1)

    def test_booking_cancellation_releases_unit_and_creates_refund(self):
        self.client.force_authenticate(user=self.sales_exec)
        
        # Pre-create a booking
        booking = AdvanceBooking.objects.create(
            customer_name='Sai Charan',
            contact_number='8888888888',
            vehicle_model=self.vehicle_model,
            color='Green',
            advance_amount=15000.00,
            expiry_date=datetime.date.today() + datetime.timedelta(days=14),
            vehicle_unit=self.vehicle_unit,
            payment_mode='UPI',
            assigned_executive=self.sales_exec,
            status='confirmed'
        )
        self.vehicle_unit.stock_status = 'booked'
        self.vehicle_unit.booking_status = True
        self.vehicle_unit.save()

        # Update status to cancelled
        url = reverse('booking-detail', kwargs={'pk': booking.id})
        response = self.client.patch(url, {'status': 'cancelled'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify vehicle unit status reverted to available
        self.vehicle_unit.refresh_from_db()
        self.assertEqual(self.vehicle_unit.stock_status, 'available')
        self.assertFalse(self.vehicle_unit.booking_status)

        # Verify refund entry is created in Ledger
        refund_count = LedgerEntry.objects.filter(
            ledger_type='refund',
            expense=15000.00
        ).count()
        self.assertEqual(refund_count, 1)
