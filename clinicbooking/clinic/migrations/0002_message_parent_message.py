# Generated by Django 5.1.7 on 2025-04-26 14:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clinic', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='parent_message',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='replies', to='clinic.message'),
        ),
    ]
