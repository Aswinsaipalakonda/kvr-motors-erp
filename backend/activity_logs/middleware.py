import contextvars
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

_current_user = contextvars.ContextVar("current_user", default=None)
_current_ip = contextvars.ContextVar("current_ip", default=None)

class ActivityLogMiddleware(MiddlewareMixin):
    def __call__(self, request):
        user = None
        # Try JWT Authentication for REST API requests
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(auth_header.split(" ")[1])
                user = jwt_auth.get_user(validated_token)
            except Exception:
                pass

        # Fallback to session user (e.g. Django Admin Panel)
        if not user and request.user and request.user.is_authenticated:
            user = request.user

        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')

        # Store in context variables
        token_user = _current_user.set(user)
        token_ip = _current_ip.set(ip)

        try:
            response = self.get_response(request)
            return response
        finally:
            _current_user.reset(token_user)
            _current_ip.reset(token_ip)
