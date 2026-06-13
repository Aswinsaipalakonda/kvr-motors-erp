from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VehicleBrand, VehicleModel, VehicleUnit
from .serializers import VehicleBrandSerializer, VehicleModelSerializer, VehicleUnitSerializer
from config.cache import CacheResponseMixin

class VehicleBrandViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = VehicleBrand.objects.all()
    serializer_class = VehicleBrandSerializer

class VehicleModelViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = VehicleModel.objects.all()
    serializer_class = VehicleModelSerializer

class VehicleUnitViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    queryset = VehicleUnit.objects.all()
    serializer_class = VehicleUnitSerializer

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
