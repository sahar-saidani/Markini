# linkedin/admin.py
from django.contrib import admin
from django import forms

from crm.models import Deal, Lead

from chat.models import ChatMessage

from linkedin.models import (
    ActionLog,
    BusinessProfile,
    Campaign,
    LinkedInProfile,
    SearchKeyword,
    SiteConfig,
    Task,
)

admin.site.site_header = "LeadFlow AI Admin"
admin.site.site_title = "LeadFlow AI"
admin.site.index_title = "Entrepreneur and company workspace"


class SiteConfigAdminForm(forms.ModelForm):
    class Meta:
        model = SiteConfig
        fields = "__all__"
        widgets = {
            "llm_api_key": forms.PasswordInput(render_value=True),
        }


class LinkedInProfileAdminForm(forms.ModelForm):
    class Meta:
        model = LinkedInProfile
        fields = "__all__"
        widgets = {
            "linkedin_password": forms.PasswordInput(render_value=True),
        }


@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Company Identity", {
            "fields": ("company_name", "industry", "website"),
        }),
        ("Primary Contact", {
            "fields": ("contact_name", "contact_email", "contact_phone"),
        }),
        ("Location", {
            "fields": ("city", "country"),
        }),
        ("Business Positioning", {
            "fields": ("offer_summary", "target_audience"),
        }),
    )
    list_display = ("company_name", "industry", "contact_name", "contact_email", "country")

    def has_add_permission(self, request):
        return not BusinessProfile.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    form = SiteConfigAdminForm
    list_display = ("__str__", "ai_model", "llm_api_base")
    fieldsets = (
        ("AI Provider", {
            "fields": ("llm_api_key", "ai_model", "llm_api_base"),
            "description": "Configure the model used for prospect qualification and outreach generation.",
        }),
    )

    def has_add_permission(self, request):
        return not SiteConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("name", "booking_link", "prospect_count", "is_freemium", "action_fraction")
    search_fields = ("name", "product_docs", "campaign_objective")
    filter_horizontal = ("users",)
    fieldsets = (
        ("Campaign", {
            "fields": ("name", "users"),
        }),
        ("Offer and Audience", {
            "fields": ("product_docs", "campaign_objective", "booking_link"),
        }),
        ("Automation Options", {
            "fields": ("is_freemium", "action_fraction", "seed_public_ids"),
            "classes": ("collapse",),
        }),
    )

    def prospect_count(self, obj):
        return obj.deals.count()
    prospect_count.short_description = "Prospects"


@admin.register(LinkedInProfile)
class LinkedInProfileAdmin(admin.ModelAdmin):
    form = LinkedInProfileAdminForm
    list_display = ("user", "linkedin_username", "active", "legal_accepted")
    list_filter = ("active",)
    search_fields = ("user__username", "linkedin_username")
    raw_id_fields = ("user", "self_lead")
    fieldsets = (
        ("Account", {
            "fields": ("user", "linkedin_username", "linkedin_password", "active"),
        }),
        ("Compliance", {
            "fields": ("legal_accepted", "subscribe_newsletter", "newsletter_processed"),
        }),
        ("Usage Limits", {
            "fields": ("connect_daily_limit", "connect_weekly_limit", "follow_up_daily_limit"),
        }),
        ("Advanced", {
            "fields": ("self_lead", "cookie_data"),
            "classes": ("collapse",),
        }),
    )


@admin.register(SearchKeyword)
class SearchKeywordAdmin(admin.ModelAdmin):
    list_display = ("keyword", "campaign", "used", "used_at")
    list_filter = ("used", "campaign")
    raw_id_fields = ("campaign",)


@admin.register(ActionLog)
class ActionLogAdmin(admin.ModelAdmin):
    list_display = ("action_type", "linkedin_profile", "campaign", "created_at")
    list_filter = ("action_type", "campaign")
    raw_id_fields = ("linkedin_profile", "campaign")
    date_hierarchy = "created_at"
    readonly_fields = ("linkedin_profile", "campaign", "action_type", "created_at")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("task_type", "status", "scheduled_at", "payload", "created_at")
    list_filter = ("task_type", "status")
    readonly_fields = (
        "task_type", "status", "scheduled_at", "payload", "error",
        "created_at", "started_at", "completed_at",
    )
    date_hierarchy = "scheduled_at"


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("full_name", "company_name", "public_identifier", "disqualified", "update_date")
    list_filter = ("disqualified",)
    search_fields = ("first_name", "last_name", "company_name", "public_identifier", "linkedin_url")
    readonly_fields = ("creation_date", "update_date", "embedding")
    fieldsets = (
        ("Lead Identity", {
            "fields": ("first_name", "last_name", "company_name", "linkedin_url", "public_identifier"),
        }),
        ("Qualification Context", {
            "fields": ("disqualified", "profile_data"),
        }),
        ("System Data", {
            "fields": ("embedding", "creation_date", "update_date"),
            "classes": ("collapse",),
        }),
    )


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ("lead", "campaign", "state", "closing_reason", "update_date")
    list_filter = ("state", "closing_reason", "campaign")
    search_fields = ("lead__first_name", "lead__last_name", "lead__company_name", "campaign__name", "reason")
    raw_id_fields = ("lead", "campaign")
    readonly_fields = ("creation_date", "update_date")
    fieldsets = (
        ("Pipeline", {
            "fields": ("lead", "campaign", "state", "closing_reason"),
        }),
        ("Qualification Rationale", {
            "fields": ("reason",),
        }),
        ("Follow-up Tracking", {
            "fields": ("connect_attempts", "backoff_hours"),
        }),
        ("System Data", {
            "fields": ("creation_date", "update_date"),
            "classes": ("collapse",),
        }),
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("content_type", "object_id", "owner", "creation_date")
    list_filter = ("content_type", "owner")
    raw_id_fields = ("owner", "answer_to", "topic")
    date_hierarchy = "creation_date"
    readonly_fields = ("content_type", "object_id", "content", "owner", "creation_date")
