from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from branches.models import Branch, Showroom, InventoryLocation
from battery.models import Battery

User = get_user_model()

class BatteryViewSetBranchScopingTests(APITestCase):
    def setUp(self):
        # Create Branches & Locations
        self.branch_vizag = Branch.objects.create(name="KVR Motors - Visakhapatnam")
        self.branch_kakinada = Branch.objects.create(name="KVR Motors - Kakinada")

        self.showroom_vizag = Showroom.objects.create(branch=self.branch_vizag, name="Vizag Main Showroom")
        self.showroom_kakinada = Showroom.objects.create(branch=self.branch_kakinada, name="Kakinada Main Showroom")

        self.loc_vizag = InventoryLocation.objects.create(branch=self.branch_vizag, showroom=self.showroom_vizag, name="Vizag Godown Main")
        self.loc_kakinada = InventoryLocation.objects.create(branch=self.branch_kakinada, showroom=self.showroom_kakinada, name="Kakinada Godown")

        # Create Batteries
        self.battery_vizag = Battery.objects.create(
            serial_number="BAT-VSKP-001",
            battery_code="BAT-60V-30AH",
            capacity="60V 30Ah",
            purchase_date="2026-01-01",
            location=self.loc_vizag,
            supplier="KVR Supplier",
            status="available"
        )
        self.battery_kakinada = Battery.objects.create(
            serial_number="BAT-KKD-001",
            battery_code="BAT-60V-30AH",
            capacity="60V 30Ah",
            purchase_date="2026-01-02",
            location=self.loc_kakinada,
            supplier="KVR Supplier",
            status="available"
        )

        # Users
        self.staff_vizag = User.objects.create_user(
            username="staff_vskp",
            password="Password123!",
            role="staff",
            branch="KVR Motors - Visakhapatnam"
        )
        self.owner = User.objects.create_user(
            username="owner_user",
            password="Password123!",
            role="owner",
            branch="KVR Motors - Visakhapatnam"
        )

    def test_staff_only_sees_own_branch_batteries(self):
        self.client.force_authenticate(user=self.staff_vizag)
        response = self.client.get(reverse('battery-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') if isinstance(response.data, dict) else response.data
        serials = [b['serial_number'] for b in results]
        self.assertIn("BAT-VSKP-001", serials)
        self.assertNotIn("BAT-KKD-001", serials)

    def test_owner_sees_all_batteries(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(reverse('battery-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') if isinstance(response.data, dict) else response.data
        serials = [b['serial_number'] for b in results]
        self.assertIn("BAT-VSKP-001", serials)
        self.assertIn("BAT-KKD-001", serials)
