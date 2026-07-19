from django.test import SimpleTestCase
from django.conf import settings


class SecuritySettingsTests(SimpleTestCase):
    def test_security_flags_are_enabled_for_production(self):
        self.assertTrue(settings.SECURE_BROWSER_XSS_FILTER)
        self.assertTrue(settings.SECURE_CONTENT_TYPE_NOSNIFFING)
        self.assertTrue(settings.SESSION_COOKIE_SECURE)
        self.assertTrue(settings.CSRF_COOKIE_SECURE)
