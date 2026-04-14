from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class CreatorProfile(models.Model):
    """Workspace profile used by the SaaS frontend and OpenOutreach sync."""

    class Tone(models.TextChoices):
        THOUGHT_LEADER = "thought_leader", "Thought leader"
        STORYTELLER = "storyteller", "Storyteller"
        EDUCATOR = "educator", "Educator"
        DIRECT = "direct", "Direct"

    class Goal(models.TextChoices):
        AWARENESS = "awareness", "Notoriété"
        LEADS = "leads", "Génération de leads"
        SALES = "sales", "Ventes directes"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="creator_profile",
    )
    professional_title = models.CharField(max_length=200, blank=True, default="")
    personal_description = models.TextField(blank=True, default="")
    company_name = models.CharField(max_length=200, blank=True, default="")
    company_sector = models.CharField(max_length=120, blank=True, default="")
    company_description = models.TextField(blank=True, default="")
    product_name = models.CharField(max_length=200, blank=True, default="")
    product_description = models.TextField(blank=True, default="")
    product_benefits = models.TextField(blank=True, default="")
    product_price = models.CharField(max_length=120, blank=True, default="")
    icp_job_title = models.CharField(max_length=200, blank=True, default="")
    icp_sector = models.CharField(max_length=120, blank=True, default="")
    icp_company_size = models.CharField(max_length=80, blank=True, default="")
    icp_country = models.CharField(max_length=120, blank=True, default="")
    preferred_tone = models.CharField(
        max_length=40,
        choices=Tone.choices,
        default=Tone.THOUGHT_LEADER,
    )
    primary_goal = models.CharField(
        max_length=40,
        choices=Goal.choices,
        default=Goal.LEADS,
    )
    linkedin_email = models.EmailField(blank=True, default="")
    linkedin_password = models.CharField(max_length=200, blank=True, default="")
    facebook_page_id = models.CharField(max_length=100, blank=True, default="")
    facebook_page_name = models.CharField(max_length=200, blank=True, default="")
    facebook_page_access_token = models.TextField(blank=True, default="")
    qwen_api_key = models.CharField(max_length=300, blank=True, default="")
    qwen_api_base = models.CharField(max_length=300, blank=True, default="")
    qwen_model = models.CharField(max_length=120, blank=True, default="")
    auto_publish = models.BooleanField(default=False)
    auto_connect = models.BooleanField(default=True)
    auto_follow_up = models.BooleanField(default=True)
    openoutreach_campaign = models.ForeignKey(
        "linkedin.Campaign",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="marketing_profiles",
    )
    openoutreach_profile = models.ForeignKey(
        "linkedin.LinkedInProfile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="marketing_profiles",
    )
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.display_name or self.user.username

    @property
    def display_name(self) -> str:
        """Return the best available user-facing name."""
        full_name = f"{self.user.first_name} {self.user.last_name}".strip()
        return full_name or self.user.username


class LinkedInPost(models.Model):
    """Generated or published LinkedIn post tracked by the SaaS app."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        FAILED = "failed", "Failed"

    profile = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    subject = models.CharField(max_length=300, blank=True, default="")
    source_content = models.TextField(blank=True, default="")
    suggested_topic = models.CharField(max_length=300, blank=True, default="")
    body = models.TextField(blank=True, default="")
    hashtags = models.JSONField(default=list, blank=True)
    selected_hashtags = models.JSONField(default=list, blank=True)
    readability_score = models.PositiveIntegerField(default=0)
    word_count = models.PositiveIntegerField(default=0)
    char_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    linkedin_post_id = models.CharField(max_length=300, blank=True, default="")
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.subject or self.suggested_topic or f"Post {self.pk}"


class PostGenerationJob(models.Model):
    """Asynchronous content generation request handled in the background."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    profile = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name="generation_jobs",
    )
    post = models.ForeignKey(
        LinkedInPost,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="generation_jobs",
    )
    subject = models.CharField(max_length=300, blank=True, default="")
    source_content = models.TextField(blank=True, default="")
    tone_override = models.CharField(max_length=40, blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    result_payload = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Generation job {self.pk} ({self.status})"


class LeadContext(models.Model):
    """Marketing metadata attached to OpenOutreach leads."""

    lead = models.OneToOneField(
        "crm.Lead",
        on_delete=models.CASCADE,
        related_name="marketing_context",
    )
    profile = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name="lead_contexts",
    )
    source_post = models.ForeignKey(
        LinkedInPost,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="engaged_leads",
    )
    source = models.CharField(max_length=80, default="post_engagement")
    comment_text = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.lead.public_identifier} from {self.source}"
