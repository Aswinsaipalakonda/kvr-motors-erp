from django.contrib import admin
from .models import Branch, Showroom, InventoryLocation

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)

@admin.register(Showroom)
class ShowroomAdmin(admin.ModelAdmin):
    list_display = ('name', 'branch', 'is_active')
    search_fields = ('name', 'branch__name')
    list_filter = ('branch', 'is_active')

@admin.register(InventoryLocation)
class InventoryLocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'branch', 'showroom', 'is_active')
    search_fields = ('name', 'branch__name', 'showroom__name')
    list_filter = ('branch', 'showroom', 'is_active')
