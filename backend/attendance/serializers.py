from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    verified_by_details = UserSerializer(source='verified_by', read_only=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_details', 'date', 'check_in', 'check_out',
            'latitude', 'longitude', 'location_name', 'photo', 'status',
            'verified_by', 'verified_by_details', 'verified_at', 'remarks'
        ]
        read_only_fields = ['id', 'user', 'date', 'check_in', 'status', 'verified_by', 'verified_at']
