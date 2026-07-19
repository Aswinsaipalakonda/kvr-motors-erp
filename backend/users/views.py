from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenObtainPairSerializer, UserSerializer
from .models import User

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from config.cache import CacheResponseMixin

class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_staff or 
            request.user.role in ['owner', 'admin', 'supervisor']
        )

class UserViewSet(CacheResponseMixin, viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()
        if user.role in ['owner', 'admin'] or user.is_staff:
            return User.objects.all().order_by('-id')
        elif user.role == 'supervisor' and user.branch:
            return User.objects.filter(branch=user.branch).order_by('-id')
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'supervisor':
            # Force supervisor's branch and prevent escalation to owner/admin
            role = serializer.validated_data.get('role', 'sales')
            if role in ['owner', 'admin']:
                role = 'sales'
            serializer.save(branch=user.branch, role=role)
        else:
            serializer.save()
        self.clear_cache()

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'supervisor':
            # Force supervisor's branch and prevent escalation to owner/admin
            role = serializer.validated_data.get('role', 'sales')
            if role in ['owner', 'admin']:
                role = 'sales'
            serializer.save(branch=user.branch, role=role)
        else:
            serializer.save()
        self.clear_cache()

