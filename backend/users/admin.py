from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'full_name', 'role', 'branch', 'is_active', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Info', {'fields': ('full_name', 'role', 'branch', 'showroom', 'phone_number')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Info', {'fields': ('full_name', 'role', 'branch', 'showroom', 'phone_number', 'is_active')}),
    )

admin.site.register(User, CustomUserAdmin)