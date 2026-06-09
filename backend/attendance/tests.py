from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from attendance.models import Attendance

User = get_user_model()

class AttendanceTests(APITestCase):
    def setUp(self):
        # Create users
        self.owner = User.objects.create_user(
            username='owner_user', password='password123', role='owner', branch='Main'
        )
        self.supervisor_a = User.objects.create_user(
            username='supervisor_a', password='password123', role='supervisor', branch='Vizag'
        )
        self.supervisor_b = User.objects.create_user(
            username='supervisor_b', password='password123', role='supervisor', branch='Vijayawada'
        )
        self.staff_a = User.objects.create_user(
            username='staff_a', password='password123', role='staff', branch='Vizag'
        )
        self.staff_b = User.objects.create_user(
            username='staff_b', password='password123', role='staff', branch='Vijayawada'
        )
        self.sales_a = User.objects.create_user(
            username='sales_a', password='password123', role='sales', branch='Vizag'
        )

        # Create dummy image for upload
        self.dummy_photo = SimpleUploadedFile(
            name='test_photo.jpg',
            content=b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x05\x04\x04\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b',
            content_type='image/jpeg'
        )

    def test_check_in_creates_attendance(self):
        self.client.force_authenticate(user=self.staff_a)
        url = reverse('attendance-list')
        data = {
            'latitude': '17.6868',
            'longitude': '83.2185',
            'location_name': 'Vizag Showroom',
            'photo': self.dummy_photo
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Attendance.objects.filter(user=self.staff_a).count(), 1)
        
        # Test double check-in fails
        response_dup = self.client.post(url, data, format='multipart')
        self.assertEqual(response_dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_queryset_visibility(self):
        # Create check-ins
        att_staff_a = Attendance.objects.create(
            user=self.staff_a, latitude='17.6868', longitude='83.2185', location_name='Vizag', status='pending'
        )
        att_staff_b = Attendance.objects.create(
            user=self.staff_b, latitude='16.5062', longitude='80.6480', location_name='Vijayawada', status='pending'
        )
        att_sup_a = Attendance.objects.create(
            user=self.supervisor_a, latitude='17.6868', longitude='83.2185', location_name='Vizag', status='pending'
        )

        # Staff A should only see Staff A
        self.client.force_authenticate(user=self.staff_a)
        url = reverse('attendance-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], att_staff_a.id)

        # Supervisor A should see their own + Vizag branch staff (staff_a, sales_a)
        self.client.force_authenticate(user=self.supervisor_a)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain att_staff_a and att_sup_a (att_staff_b is different branch)
        ids = [item['id'] for item in response.data]
        self.assertIn(att_staff_a.id, ids)
        self.assertIn(att_sup_a.id, ids)
        self.assertNotIn(att_staff_b.id, ids)

        # Owner should see all logs
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_verification_permissions(self):
        att_staff_a = Attendance.objects.create(
            user=self.staff_a, latitude='17.6868', longitude='83.2185', location_name='Vizag', status='pending'
        )
        att_sup_a = Attendance.objects.create(
            user=self.supervisor_a, latitude='17.6868', longitude='83.2185', location_name='Vizag', status='pending'
        )

        # Supervisor A verifying staff_a (same branch) - Allowed
        self.client.force_authenticate(user=self.supervisor_a)
        url = reverse('attendance-verify-attendance', kwargs={'pk': att_staff_a.id})
        response = self.client.patch(url, {'status': 'verified', 'remarks': 'Great'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        att_staff_a.refresh_from_db()
        self.assertEqual(att_staff_a.status, 'verified')
        self.assertEqual(att_staff_a.verified_by, self.supervisor_a)

        # Supervisor B verifying staff_a (different branch) - Forbidden
        att_staff_a.status = 'pending'
        att_staff_a.save()
        self.client.force_authenticate(user=self.supervisor_b)
        response = self.client.patch(url, {'status': 'verified'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Supervisor A verifying supervisor_a (self) - Forbidden (must be verified by Owner)
        url_sup = reverse('attendance-verify-attendance', kwargs={'pk': att_sup_a.id})
        self.client.force_authenticate(user=self.supervisor_a)
        response = self.client.patch(url_sup, {'status': 'verified'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Owner verifying supervisor_a - Allowed
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(url_sup, {'status': 'verified', 'remarks': 'Approved by RV'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        att_sup_a.refresh_from_db()
        self.assertEqual(att_sup_a.status, 'verified')
