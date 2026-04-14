from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketing", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="creatorprofile",
            name="facebook_page_access_token",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="facebook_page_id",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="creatorprofile",
            name="facebook_page_name",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
    ]
