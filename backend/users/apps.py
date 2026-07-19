import os
from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'users'

    def ready(self):
        from django.db import connection
        from django.db.utils import OperationalError
        from django.contrib.auth import get_user_model

        try:
            should_seed_demo_users = os.getenv('CREATE_DEMO_USERS', '0').lower() in {'1', 'true', 'yes'}
            if should_seed_demo_users and connection.introspection.table_names():
                User = get_user_model()
                demo_users = [
                    {'username': 'owner', 'password': 'owner123', 'email': 'owner@kvrmotors.com', 'full_name': 'Owner User', 'role': 'owner'},
                    {'username': 'supervisor', 'password': 'super123', 'email': 'supervisor@kvrmotors.com', 'full_name': 'Supervisor User', 'role': 'supervisor'},
                    {'username': 'sales', 'password': 'sales123', 'email': 'sales@kvrmotors.com', 'full_name': 'Sales User', 'role': 'sales'},
                    {'username': 'telecaller', 'password': 'tele123', 'email': 'telecaller@kvrmotors.com', 'full_name': 'Telecaller User', 'role': 'telecaller'},
                    {'username': 'staff', 'password': 'staff123', 'email': 'staff@kvrmotors.com', 'full_name': 'Staff User', 'role': 'staff'},
                ]

                for user_data in demo_users:
                    if not User.objects.filter(username=user_data['username']).exists():
                        user = User(
                            username=user_data['username'],
                            email=user_data['email'],
                            full_name=user_data['full_name'],
                            role=user_data['role'],
                            is_active=True,
                        )
                        user.set_password(user_data['password'])
                        user.save()
        except OperationalError:
            pass
