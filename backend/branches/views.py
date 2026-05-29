from rest_framework import viewsets
from .models import Branch, Showroom, InventoryLocation
from .serializers import BranchSerializer, ShowroomSerializer, InventoryLocationSerializer

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

class ShowroomViewSet(viewsets.ModelViewSet):
    queryset = Showroom.objects.all()
    serializer_class = ShowroomSerializer

class InventoryLocationViewSet(viewsets.ModelViewSet):
    queryset = InventoryLocation.objects.all()
    serializer_class = InventoryLocationSerializer
