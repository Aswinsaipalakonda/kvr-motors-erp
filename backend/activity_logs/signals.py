from django.db.models.signals import pre_save, post_save, post_delete
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from .models import ActivityLog
from .middleware import _current_user, _current_ip

# Lists of app labels to exempt from auditing (system apps, migrations, logs, etc.)
EXEMPT_APPS = (
    'admin',
    'contenttypes',
    'sessions',
    'migrations',
    'activity_logs',
)

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    ip = _current_ip.get()
    if not ip and request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')

    ActivityLog.objects.create(
        user=user,
        action="LOGIN",
        model_name="user",
        app_label="users",
        object_id=str(user.pk),
        object_repr=f"User {user.username} ({user.full_name or user.role}) logged in successfully",
        changes={"login_event": {"before": None, "after": f"Logged in at {user.last_login or 'Just now'}"}},
        ip_address=ip or "127.0.0.1"
    )

@receiver(pre_save)
def track_changes_pre_save(sender, instance, **kwargs):
    if sender._meta.app_label in EXEMPT_APPS:
        return

    # If it is an update, try to pull the original object to diff changes
    if instance.pk:
        try:
            original = sender.objects.get(pk=instance.pk)
            # Store original values on the instance
            instance._original_values = {
                field.name: getattr(original, field.name)
                for field in sender._meta.fields
            }
        except sender.DoesNotExist:
            pass

@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if sender._meta.app_label in EXEMPT_APPS:
        return

    user = _current_user.get()
    ip = _current_ip.get()

    action = "CREATE" if created else "UPDATE"
    changes = {}

    if action == "UPDATE" and hasattr(instance, '_original_values'):
        original = instance._original_values
        for field in sender._meta.fields:
            field_name = field.name
            if field_name == 'password' or field_name == 'last_login':
                continue
            val_before = original.get(field_name)
            val_after = getattr(instance, field_name)
            if val_before != val_after:
                changes[field_name] = {
                    "before": str(val_before) if val_before is not None else None,
                    "after": str(val_after) if val_after is not None else None
                }
        # If it's an update and no trackable fields changed, do not log anything
        if not changes:
            return
    elif action == "CREATE":
        for field in sender._meta.fields:
            field_name = field.name
            if field_name == 'password' or field_name == 'last_login':
                continue
            val = getattr(instance, field_name)
            if val is not None:
                changes[field_name] = {
                    "before": None,
                    "after": str(val)
                }

    ActivityLog.objects.create(
        user=user,
        action=action,
        model_name=sender._meta.model_name,
        app_label=sender._meta.app_label,
        object_id=str(instance.pk),
        object_repr=str(instance),
        changes=changes,
        ip_address=ip or "127.0.0.1"
    )

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if sender._meta.app_label in EXEMPT_APPS:
        return

    user = _current_user.get()
    ip = _current_ip.get()

    ActivityLog.objects.create(
        user=user,
        action="DELETE",
        model_name=sender._meta.model_name,
        app_label=sender._meta.app_label,
        object_id=str(instance.pk),
        object_repr=str(instance),
        changes={},
        ip_address=ip or "127.0.0.1"
    )
