from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("crm", "0003_public_identifier_unique"),
        ("linkedin", "0004_businessprofile"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CreatorProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("professional_title", models.CharField(blank=True, default="", max_length=200)),
                ("personal_description", models.TextField(blank=True, default="")),
                ("company_name", models.CharField(blank=True, default="", max_length=200)),
                ("company_sector", models.CharField(blank=True, default="", max_length=120)),
                ("company_description", models.TextField(blank=True, default="")),
                ("product_name", models.CharField(blank=True, default="", max_length=200)),
                ("product_description", models.TextField(blank=True, default="")),
                ("product_benefits", models.TextField(blank=True, default="")),
                ("product_price", models.CharField(blank=True, default="", max_length=120)),
                ("icp_job_title", models.CharField(blank=True, default="", max_length=200)),
                ("icp_sector", models.CharField(blank=True, default="", max_length=120)),
                ("icp_company_size", models.CharField(blank=True, default="", max_length=80)),
                ("icp_country", models.CharField(blank=True, default="", max_length=120)),
                ("preferred_tone", models.CharField(choices=[("thought_leader", "Thought leader"), ("storyteller", "Storyteller"), ("educator", "Educator"), ("direct", "Direct")], default="thought_leader", max_length=40)),
                ("primary_goal", models.CharField(choices=[("awareness", "Notoriété"), ("leads", "Génération de leads"), ("sales", "Ventes directes")], default="leads", max_length=40)),
                ("linkedin_email", models.EmailField(blank=True, default="", max_length=254)),
                ("linkedin_password", models.CharField(blank=True, default="", max_length=200)),
                ("qwen_api_key", models.CharField(blank=True, default="", max_length=300)),
                ("qwen_api_base", models.CharField(blank=True, default="", max_length=300)),
                ("qwen_model", models.CharField(blank=True, default="", max_length=120)),
                ("auto_publish", models.BooleanField(default=False)),
                ("auto_connect", models.BooleanField(default=True)),
                ("auto_follow_up", models.BooleanField(default=True)),
                ("last_synced_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("openoutreach_campaign", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="marketing_profiles", to="linkedin.campaign")),
                ("openoutreach_profile", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="marketing_profiles", to="linkedin.linkedinprofile")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="creator_profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="LinkedInPost",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("subject", models.CharField(blank=True, default="", max_length=300)),
                ("source_content", models.TextField(blank=True, default="")),
                ("suggested_topic", models.CharField(blank=True, default="", max_length=300)),
                ("body", models.TextField(blank=True, default="")),
                ("hashtags", models.JSONField(blank=True, default=list)),
                ("selected_hashtags", models.JSONField(blank=True, default=list)),
                ("readability_score", models.PositiveIntegerField(default=0)),
                ("word_count", models.PositiveIntegerField(default=0)),
                ("char_count", models.PositiveIntegerField(default=0)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("published", "Published"), ("failed", "Failed")], default="draft", max_length=20)),
                ("linkedin_post_id", models.CharField(blank=True, default="", max_length=300)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="posts", to="marketing.creatorprofile")),
            ],
        ),
        migrations.CreateModel(
            name="PostGenerationJob",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("subject", models.CharField(blank=True, default="", max_length=300)),
                ("source_content", models.TextField(blank=True, default="")),
                ("tone_override", models.CharField(blank=True, default="", max_length=40)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("running", "Running"), ("completed", "Completed"), ("failed", "Failed")], default="pending", max_length=20)),
                ("result_payload", models.JSONField(blank=True, default=dict)),
                ("error_message", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("post", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="generation_jobs", to="marketing.linkedinpost")),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="generation_jobs", to="marketing.creatorprofile")),
            ],
        ),
        migrations.CreateModel(
            name="LeadContext",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source", models.CharField(default="post_engagement", max_length=80)),
                ("comment_text", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("lead", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="marketing_context", to="crm.lead")),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lead_contexts", to="marketing.creatorprofile")),
                ("source_post", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="engaged_leads", to="marketing.linkedinpost")),
            ],
        ),
    ]
