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
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'role', 'branch', 'showroom', 'phone_number', 'is_active', 'password', 'first_name', 'last_name', 'date_of_birth', 'country', 'city', 'postal_code')
        read_only_fields = ('id', 'is_active')

    def create(self, validated_data):
        password = validated_data.pop('password', 'password123')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
