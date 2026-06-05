from django.db import models
from django.conf import settings

class ActivityLog(models.Model):
    ACTION_CHOICES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    app_label = models.CharField(max_length=100)
    object_id = models.CharField(max_length=255)
    object_repr = models.CharField(max_length=255)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.username if self.user else "System"
        return f"{user_str} - {self.action} {self.model_name} ({self.object_repr})"
