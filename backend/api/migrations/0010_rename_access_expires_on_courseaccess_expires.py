# Generated by Django 5.1.1 on 2024-10-09 10:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_rename_subscription_courseaccess'),
    ]

    operations = [
        migrations.RenameField(
            model_name='courseaccess',
            old_name='access_expires_on',
            new_name='expires',
        ),
    ]
