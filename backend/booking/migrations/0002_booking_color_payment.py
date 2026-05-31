# Adds color, payment_mode, and payment_reference fields to AdvanceBooking
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='advancebooking',
            name='color',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='advancebooking',
            name='payment_mode',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='advancebooking',
            name='payment_reference',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
