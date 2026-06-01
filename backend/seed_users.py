import os
import django

# Load Django settings context
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from users.models import User

def seed_users():
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
            "username": "staff",
            "password": "staff123",
            "email": "staff@kvrmotors.com",
            "full_name": "Ramesh Kumar",
            "role": "staff",
            "branch": "KVR Motors - Visakhapatnam",
            "showroom": "KVR Showroom - Visakhapatnam",
            "phone_number": "9876543213"
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
        if created:
            user.set_password(user_data["password"])
            user.save()
            print(f"Created sandbox demo user: {user_data['username']} (role: {user_data['role']})")
        else:
            # Overwrite password and parameters to guarantee synchronization with front-end autoloaders
            user.set_password(user_data["password"])
            user.role = user_data["role"]
            user.full_name = user_data["full_name"]
            user.branch = user_data["branch"]
            user.showroom = user_data["showroom"]
            user.phone_number = user_data["phone_number"]
            user.is_active = True
            user.save()
            print(f"Synchronized sandbox demo user: {user_data['username']} (role: {user_data['role']})")

if __name__ == "__main__":
    print("Starting database sandbox user seeding...")
    seed_users()
    print("Database seeding completed successfully!")
