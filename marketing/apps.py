from django.apps import AppConfig


class MarketingConfig(AppConfig):
    """App for the SaaS-facing profile, content, and pipeline layer."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "marketing"

