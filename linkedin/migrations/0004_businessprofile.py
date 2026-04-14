from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("linkedin", "0003_siteconfig"),
    ]

    operations = [
        migrations.CreateModel(
            name="BusinessProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("company_name", models.CharField(blank=True, default="", max_length=200)),
                ("contact_name", models.CharField(blank=True, default="", max_length=200)),
                ("contact_email", models.EmailField(blank=True, default="", max_length=254)),
                ("contact_phone", models.CharField(blank=True, default="", max_length=50)),
                ("website", models.URLField(blank=True, default="", max_length=500)),
                ("city", models.CharField(blank=True, default="", max_length=100)),
                ("country", models.CharField(blank=True, default="", max_length=100)),
                ("industry", models.CharField(blank=True, default="", max_length=120)),
                ("offer_summary", models.TextField(blank=True, default="")),
                ("target_audience", models.TextField(blank=True, default="")),
            ],
            options={
                "verbose_name": "Business Profile",
                "verbose_name_plural": "Business Profile",
            },
        ),
    ]
