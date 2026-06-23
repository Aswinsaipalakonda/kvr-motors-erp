from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from branches.views import BranchViewSet, ShowroomViewSet, InventoryLocationViewSet
from vehicles.views import VehicleBrandViewSet, VehicleModelViewSet, VehicleUnitViewSet
from battery.views import BatteryViewSet, FifoOverrideViewSet
from leads.views import LeadViewSet
from booking.views import AdvanceBookingViewSet
from sales.views import SalesInvoiceViewSet
from purchases.views import PurchaseOrderViewSet
from ledger.views import LedgerEntryViewSet
from inventory.views import StockTransferViewSet
from users.views import UserViewSet, CurrentUserView
from activity_logs.views import ActivityLogViewSet
from attendance.views import AttendanceViewSet
from mela.views import MelaInventoryViewSet, MelaBookingViewSet, MelaReportsView, MelaSettingsViewSet

from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'showrooms', ShowroomViewSet, basename='showroom')
router.register(r'inventory-locations', InventoryLocationViewSet, basename='inventorylocation')
router.register(r'vehicle-brands', VehicleBrandViewSet, basename='vehiclebrand')
router.register(r'vehicle-models', VehicleModelViewSet, basename='vehiclemodel')
router.register(r'vehicle-units', VehicleUnitViewSet, basename='vehicleunit')
router.register(r'batteries', BatteryViewSet, basename='battery')
router.register(r'fifo-overrides', FifoOverrideViewSet, basename='fifooverride')
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'bookings', AdvanceBookingViewSet, basename='booking')
router.register(r'sales-invoices', SalesInvoiceViewSet, basename='salesinvoice')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchaseorder')
router.register(r'ledger-entries', LedgerEntryViewSet, basename='ledgerentry')
router.register(r'stock-transfers', StockTransferViewSet, basename='stocktransfer')
router.register(r'users', UserViewSet, basename='user')
router.register(r'activity-logs', ActivityLogViewSet, basename='activitylog')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'mela-inventory', MelaInventoryViewSet, basename='melainventory')
router.register(r'mela-bookings', MelaBookingViewSet, basename='melabooking')
router.register(r'mela-settings', MelaSettingsViewSet, basename='melasettings')


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Custom API endpoints
    path('api/auth/', include('users.urls')),
    path('api/v1/auth/me/', CurrentUserView.as_view(), name='current_user_v1'),
    path('api/v1/mela-reports/', MelaReportsView.as_view(), name='mela_reports'),
    path('api/v1/', include(router.urls)),
    
    # OpenAPI Schema & API Documentation views
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

