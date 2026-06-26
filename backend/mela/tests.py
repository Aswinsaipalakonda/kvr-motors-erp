from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from vehicles.models import VehicleBrand, VehicleModel
from mela.models import MelaVehicleStock, MelaBatteryStock

User = get_user_model()

class MelaStockAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.owner = User.objects.create_user(
            username='owner_user', password='password123', role='owner', branch='Vizag'
        )
        self.sales_exec = User.objects.create_user(
            username='sales_exec', password='password123', role='sales_executive', branch='Vizag'
        )
        
        # Create brand & model
        self.brand = VehicleBrand.objects.create(name='Franklin')
        self.vehicle_model = VehicleModel.objects.create(
            brand=self.brand,
            model_name='Rapid (SL)',
            base_price=89000.00,
            color_variants=['Black', 'Blue', 'White'],
            battery_compatibility='Graphene'
        )

    def test_create_mela_vehicle_stock_split_colors(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('melavehiclestock-list')
        
        # Scenario 1: Multi-color with commas
        data = {
            'model_name': 'Rapid (SL)',
            'color': 'Black, Blue, White',
            'price': '89000.00',
            'initial_quantity': 15,
            'remaining_quantity': 15
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that 3 separate objects are created
        self.assertEqual(MelaVehicleStock.objects.filter(model_name='Rapid (SL)').count(), 3)
        self.assertTrue(MelaVehicleStock.objects.filter(model_name='Rapid (SL)', color='Black').exists())
        self.assertTrue(MelaVehicleStock.objects.filter(model_name='Rapid (SL)', color='Blue').exists())
        self.assertTrue(MelaVehicleStock.objects.filter(model_name='Rapid (SL)', color='White').exists())
        
        # Check that vehicle_model was looked up and set automatically
        v1 = MelaVehicleStock.objects.get(model_name='Rapid (SL)', color='Black')
        self.assertEqual(v1.vehicle_model, self.vehicle_model)

    def test_create_mela_vehicle_stock_single_color(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('melavehiclestock-list')
        
        data = {
            'model_name': 'Rapid (SL)',
            'color': 'Blue',
            'price': '89000.00',
            'initial_quantity': 5,
            'remaining_quantity': 5
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MelaVehicleStock.objects.filter(model_name='Rapid (SL)').count(), 1)

    def test_patch_restock_date_vehicle(self):
        self.client.force_authenticate(user=self.owner)
        
        # Create vehicle stock
        v_stock = MelaVehicleStock.objects.create(
            vehicle_model=self.vehicle_model,
            model_name='Rapid (SL)',
            color='Blue',
            price=89000.00,
            initial_quantity=5,
            remaining_quantity=5
        )
        
        url = reverse('melavehiclestock-detail', kwargs={'pk': v_stock.id})
        data = {
            'restock_date': '2026-07-15'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        v_stock.refresh_from_db()
        self.assertEqual(str(v_stock.restock_date), '2026-07-15')

    def test_patch_restock_date_battery(self):
        self.client.force_authenticate(user=self.owner)
        
        # Create battery stock
        b_stock = MelaBatteryStock.objects.create(
            battery_name='Graphene 5-Battery',
            price=35000.00,
            initial_quantity=10,
            remaining_quantity=10
        )
        
        url = reverse('melabatterystock-detail', kwargs={'pk': b_stock.id})
        data = {
            'restock_date': '2026-07-20'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        b_stock.refresh_from_db()
        self.assertEqual(str(b_stock.restock_date), '2026-07-20')
