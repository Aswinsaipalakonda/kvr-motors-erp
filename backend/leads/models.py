from django.db import models
from django.conf import settings
from vehicles.models import VehicleModel

class Lead(models.Model):
    STAGE_CHOICES = (
        ('enquiry', 'Enquiry'),
        ('new_lead', 'New Lead'),
        ('contacted', 'Contacted'),
        ('follow_up', 'Follow-up'),
        ('negotiation', 'Negotiation'),
        ('won', 'Won'),
        ('lost', 'Lost'),
    )
    
    SOURCE_CHOICES = (
        ('walk_in', 'Walk-in'),
        ('website', 'Website'),
        ('reference', 'Reference'),
        ('phone', 'Phone Call'),
        ('social', 'Social Media'),
        ('other', 'Other'),
    )

    customer_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15)
    interested_vehicle = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name="leads")
    lead_source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default='walk_in')
    assigned_executive = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="assigned_leads"
    )
    follow_up_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STAGE_CHOICES, default='new_lead')
    lost_reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer_name} - {self.interested_vehicle} ({self.get_status_display()})"
