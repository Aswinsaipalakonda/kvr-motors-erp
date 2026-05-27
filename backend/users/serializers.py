from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to the JWT payload
        token['username'] = user.username
        token['email'] = user.email
        token['full_name'] = user.full_name
        token['role'] = user.role
        token['branch'] = user.branch
        token['showroom'] = user.showroom

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Include extra info directly in the JSON response as well
        data['user'] = UserSerializer(self.user).data
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'role', 'branch', 'showroom', 'phone_number', 'is_active')
        read_only_fields = ('id', 'username', 'is_active')
