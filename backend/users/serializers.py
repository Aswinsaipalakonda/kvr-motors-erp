from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Invalid credentials. Please check your username and password.'
    }

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
        fields = ('id', 'username', 'email', 'full_name', 'role', 'branch', 'showroom', 'phone_number', 'is_active', 'password', 'first_name', 'last_name', 'date_of_birth', 'country', 'city', 'postal_code', 'expo_push_token')
        read_only_fields = ('id',)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'A strong password is required.'})
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def validate_phone_number(self, value):
        import re
        if value:
            cleaned = re.sub(r'\D', '', value)
            if len(cleaned) != 10:
                raise serializers.ValidationError("Phone number must contain exactly 10 digits.")
            return cleaned
        return value

    def validate_email(self, value):
        import re
        if value:
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, value):
                raise serializers.ValidationError("Enter a valid email address.")
        return value


    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
