from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VehicleBrand, VehicleModel, VehicleUnit
from .serializers import VehicleBrandSerializer, VehicleModelSerializer, VehicleUnitSerializer
from config.cache import CacheResponseMixin

class VehicleBrandViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = VehicleBrand.objects.all()
    serializer_class = VehicleBrandSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.models.exists():
            return Response(
                {"detail": f"Cannot delete brand '{instance.name}' because {instance.models.count()} vehicle model(s) belong to this brand. Please remove or reassign the models first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response(
                {"detail": f"Cannot delete brand '{instance.name}' due to linked records."},
                status=status.HTTP_400_BAD_REQUEST
            )

class VehicleModelViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = VehicleModel.objects.all()
    serializer_class = VehicleModelSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        unit_count = instance.units.count() if hasattr(instance, 'units') else 0
        if unit_count > 0:
            return Response(
                {"detail": f"Cannot delete vehicle model '{instance.model_name}' because {unit_count} physical stock unit(s) are registered with this model. Please remove the physical stock units first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response(
                {"detail": f"Cannot delete vehicle model '{instance.model_name}' because it has linked bookings, leads, or purchase orders."},
                status=status.HTTP_400_BAD_REQUEST
            )

class VehicleUnitViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = VehicleUnitSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = VehicleUnit.objects.all()
        if user.is_authenticated and user.role not in ['admin', 'owner']:
            if hasattr(user, 'branch') and user.branch:
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(branch__name=user.branch) | Q(stock_status='available')
                )
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response(
                {"detail": f"Cannot delete vehicle unit '{instance.vin_number or instance.id}' due to linked sales invoices or bookings."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup_unit(self, request):
        """
        Auto-fill search endpoint. Matches exact VIN, motor number, or chassis number.
        """
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response(
                {"error": "Please provide a VIN, Motor, or Chassis number query parameter 'q'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        unit = VehicleUnit.objects.filter(
            vin_number__iexact=q
        ) | VehicleUnit.objects.filter(
            motor_number__iexact=q
        ) | VehicleUnit.objects.filter(
            chassis_number__iexact=q
        )
        
        unit = unit.first()
        if not unit:
            return Response(
                {"error": "No matching vehicle unit found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = self.get_serializer(unit)
        return Response(serializer.data, status=status.HTTP_200_OK)
