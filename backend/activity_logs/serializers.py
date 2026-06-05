from rest_framework import serializers
from .models import ActivityLog
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'role')

class ActivityLogSerializer(serializers.ModelSerializer):
    user_detail = UserMiniSerializer(source='user', read_only=True)

    class Meta:
        model = ActivityLog
        fields = (
            'id', 'user', 'user_detail', 'action', 'model_name',
            'app_label', 'object_id', 'object_repr', 'changes',
            'ip_address', 'timestamp'
        )
