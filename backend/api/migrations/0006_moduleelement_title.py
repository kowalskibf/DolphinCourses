# Generated by Django 5.1.1 on 2024-10-09 06:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_rename_title_element_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='moduleelement',
            name='title',
            field=models.CharField(default='', max_length=255),
        ),
    ]
