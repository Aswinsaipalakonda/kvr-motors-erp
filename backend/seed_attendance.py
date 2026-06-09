import os
import django
from datetime import datetime, date, timedelta
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from users.models import User
from attendance.models import Attendance

def seed_attendance():
    # Make sure we have the users first
    try:
        owner = User.objects.get(username='owner')
        supervisor = User.objects.get(username='supervisor')
        sales = User.objects.get(username='sales')
        staff = User.objects.get(username='staff')
        telecaller = User.objects.get(username='telecaller')
    except User.DoesNotExist:
        print("Demo users not found. Running seed_users first...")
        from seed_users import seed_users
        seed_users()
        owner = User.objects.get(username='owner')
        supervisor = User.objects.get(username='supervisor')
        sales = User.objects.get(username='sales')
        staff = User.objects.get(username='staff')
        telecaller = User.objects.get(username='telecaller')

    # Ensure media directory exists
    media_dir = os.path.join('media', 'attendance_photos')
    os.makedirs(media_dir, exist_ok=True)
    
    # Write a tiny dummy JPEG file
    dummy_image_path = os.path.join(media_dir, 'demo_face.jpg')
    if not os.path.exists(dummy_image_path):
        with open(dummy_image_path, 'wb') as f:
            f.write(b'\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xFF\xC0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xFF\xC4\x00\x15\x00\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xFF\xDA\x00\x08\x01\x01\x00\x00?\x00\x37\xFF\xD9')

    # Delete existing logs to have clean test state
    Attendance.objects.all().delete()
    print("Cleared existing attendance records.")

    today = date.today()
    yesterday = today - timedelta(days=1)

    # Attendance data setup
    records = [
        # Yesterday (Verified)
        {
            'user': sales,
            'date': yesterday,
            'check_in': timezone.make_aware(datetime.combine(yesterday, datetime.strptime("09:02:15", "%H:%M:%S").time())),
            'latitude': 17.686812,
            'longitude': 83.218524,
            'location_name': 'KVR Showroom, Vizag',
            'status': 'verified',
            'verified_by': supervisor,
            'verified_at': timezone.make_aware(datetime.combine(yesterday, datetime.strptime("10:15:00", "%H:%M:%S").time())),
            'remarks': 'Reporting on time. Location verified.'
        },
        {
            'user': staff,
            'date': yesterday,
            'check_in': timezone.make_aware(datetime.combine(yesterday, datetime.strptime("09:10:45", "%H:%M:%S").time())),
            'latitude': 17.686915,
            'longitude': 83.218630,
            'location_name': 'KVR Showroom, Vizag',
            'status': 'verified',
            'verified_by': supervisor,
            'verified_at': timezone.make_aware(datetime.combine(yesterday, datetime.strptime("10:16:30", "%H:%M:%S").time())),
            'remarks': 'Location matches showroom geofence.'
        },
        {
            'user': supervisor,
            'date': yesterday,
            'check_in': timezone.make_aware(datetime.combine(yesterday, datetime.strptime("08:42:00", "%H:%M:%S").time())),
            'latitude': 17.686810,
            'longitude': 83.218520,
            'location_name': 'KVR Showroom, Vizag',
            'status': 'verified',
            'verified_by': owner,
            'verified_at': timezone.make_aware(datetime.combine(yesterday, datetime.strptime("09:30:00", "%H:%M:%S").time())),
            'remarks': 'Supervisor verified by Owner Ravi Varma.'
        },

        # Today (Pending verification)
        {
            'user': sales,
            'date': today,
            'check_in': timezone.make_aware(datetime.combine(today, datetime.strptime("09:15:30", "%H:%M:%S").time())),
            'latitude': 17.686820,
            'longitude': 83.218530,
            'location_name': 'KVR Showroom, Vizag',
            'status': 'pending',
            'verified_by': None,
            'verified_at': None,
            'remarks': ''
        },
        {
            'user': staff,
            'date': today,
            'check_in': timezone.make_aware(datetime.combine(today, datetime.strptime("09:32:10", "%H:%M:%S").time())),
            'latitude': 17.686790,
            'longitude': 83.218490,
            'location_name': 'KVR Showroom, Vizag',
            'status': 'pending',
            'verified_by': None,
            'verified_at': None,
            'remarks': ''
        },
        {
            'user': telecaller,
            'date': today,
            'check_in': timezone.make_aware(datetime.combine(today, datetime.strptime("08:55:00", "%H:%M:%S").time())),
            'latitude': 17.686815,
            'longitude': 83.218525,
            'location_name': 'KVR Showroom, Vizag',
            'status': 'pending',
            'verified_by': None,
            'verified_at': None,
            'remarks': ''
        },
        {
            'user': supervisor,
            'date': today,
            'check_in': timezone.make_aware(datetime.combine(today, datetime.strptime("08:45:00", "%H:%M:%S").time())),
            'latitude': 17.686812,
            'longitude': 83.218524,
            'location_name': 'KVR Showroom, Vizag',
            'status': 'pending',
            'verified_by': None,
            'verified_at': None,
            'remarks': ''
        },
    ]

    for data in records:
        # Create Attendance record
        att = Attendance.objects.create(
            user=data['user'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            location_name=data['location_name'],
            photo='attendance_photos/demo_face.jpg',
            status=data['status'],
            verified_by=data['verified_by'],
            verified_at=data['verified_at'],
            remarks=data['remarks']
        )
        # Bypassing auto_now_add for Date and DateTime fields by doing a direct DB update
        Attendance.objects.filter(id=att.id).update(
            date=data['date'],
            check_in=data['check_in']
        )
        print(f"Seeded attendance for {data['user'].username} on {data['date']} (status: {data['status']})")

if __name__ == '__main__':
    print("Starting database attendance seeding...")
    seed_attendance()
    print("Attendance seeding completed successfully!")
