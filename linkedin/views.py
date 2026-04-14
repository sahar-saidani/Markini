from __future__ import annotations

from collections import OrderedDict
from functools import wraps

from django.contrib import messages
from django.db.models import Count, Q
from django.http import HttpRequest, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.crypto import constant_time_compare
from django.views.decorators.http import require_http_methods

from crm.models import Deal, Lead
from linkedin.conf import (
    DEFAULT_GROQ_API_BASE,
    DEFAULT_GROQ_MODEL,
    get_integration_api_token,
)
from linkedin.enums import ProfileState
from linkedin.forms import CampaignForm, SiteConfigForm
from linkedin.models import Campaign, LinkedInProfile, SiteConfig


PIPELINE_STATES = [
    ProfileState.QUALIFIED.value,
    ProfileState.READY_TO_CONNECT.value,
    ProfileState.PENDING.value,
    ProfileState.CONNECTED.value,
    ProfileState.COMPLETED.value,
    ProfileState.FAILED.value,
]


API_STATE_ALIASES = {
    "QUALIFIED": ProfileState.QUALIFIED.value,
    "READY_TO_CONNECT": ProfileState.READY_TO_CONNECT.value,
    "READY TO CONNECT": ProfileState.READY_TO_CONNECT.value,
    "PENDING": ProfileState.PENDING.value,
    "CONNECTED": ProfileState.CONNECTED.value,
    "COMPLETED": ProfileState.COMPLETED.value,
    "FAILED": ProfileState.FAILED.value,
}


def _campaign_summary(campaign: Campaign) -> dict:
    deal_counts = {
        row["state"]: row["count"]
        for row in campaign.deals.values("state").annotate(count=Count("id"))
    }
    total_deals = sum(deal_counts.values())
    qualified = deal_counts.get(ProfileState.QUALIFIED.value, 0)
    ready = deal_counts.get(ProfileState.READY_TO_CONNECT.value, 0)
    connected = deal_counts.get(ProfileState.CONNECTED.value, 0)
    completed = deal_counts.get(ProfileState.COMPLETED.value, 0)
    response_rate = round((connected + completed) * 100 / total_deals, 1) if total_deals else 0
    return {
        "campaign": campaign,
        "total_deals": total_deals,
        "qualified": qualified,
        "ready": ready,
        "connected": connected,
        "completed": completed,
        "response_rate": response_rate,
    }


def _prospect_cards(limit: int = 8) -> list[dict]:
    deals = (
        Deal.objects.select_related("lead", "campaign")
        .exclude(lead__isnull=True)
        .order_by("-update_date")[:limit]
    )
    cards: list[dict] = []
    for deal in deals:
        lead = deal.lead
        profile = lead.profile_data or {}
        headline = (
            profile.get("headline")
            or profile.get("title")
            or profile.get("summary")
            or "Profile ready for enrichment"
        )
        company = (
            lead.company_name
            or profile.get("current_company")
            or profile.get("company_name")
            or "Company not yet captured"
        )
        cards.append(
            {
                "deal": deal,
                "lead": lead,
                "headline": str(headline)[:150],
                "company": company,
                "city": profile.get("location", ""),
                "score_label": _score_label(deal.state),
                "reason": deal.reason or "Awaiting AI rationale",
            }
        )
    return cards


def _score_label(state: str) -> str:
    mapping = {
        ProfileState.QUALIFIED.value: "Strong fit",
        ProfileState.READY_TO_CONNECT.value: "Outreach ready",
        ProfileState.PENDING.value: "Pending reply",
        ProfileState.CONNECTED.value: "Connected",
        ProfileState.COMPLETED.value: "Won",
        ProfileState.FAILED.value: "Rejected",
    }
    return mapping.get(state, "Review")


def _normalize_state_filter(raw_state: str) -> str:
    state = raw_state.strip()
    if not state:
        return ""
    return API_STATE_ALIASES.get(state.upper(), state)


def _pipeline_columns() -> OrderedDict[str, list[Deal]]:
    deals = (
        Deal.objects.select_related("lead", "campaign")
        .exclude(lead__isnull=True)
        .order_by("-update_date")
    )
    columns: OrderedDict[str, list[Deal]] = OrderedDict((state, []) for state in PIPELINE_STATES)
    for deal in deals:
        columns.setdefault(deal.state, []).append(deal)
    return columns


def _hero_stats() -> list[dict]:
    total_campaigns = Campaign.objects.count()
    total_leads = Lead.objects.count()
    qualified_count = Deal.objects.exclude(state=ProfileState.FAILED.value).count()
    outreach_ready = Deal.objects.filter(
        state__in=[ProfileState.READY_TO_CONNECT.value, ProfileState.CONNECTED.value, ProfileState.PENDING.value]
    ).count()
    return [
        {"label": "Active campaigns", "value": total_campaigns, "tone": "gold"},
        {"label": "Prospects captured", "value": total_leads, "tone": "green"},
        {"label": "Qualified leads", "value": qualified_count, "tone": "ink"},
        {"label": "Outreach ready", "value": outreach_ready, "tone": "gold"},
    ]


def _parse_api_token(request: HttpRequest) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return ""
    return auth_header[7:].strip()


def _is_api_request_authorized(request: HttpRequest) -> bool:
    expected_token = get_integration_api_token()
    supplied_token = _parse_api_token(request)
    if expected_token and supplied_token:
        return constant_time_compare(supplied_token, expected_token)
    user = getattr(request, "user", None)
    return bool(user and user.is_authenticated and user.is_staff)


def integration_api(view_func):
    @wraps(view_func)
    def wrapped(request: HttpRequest, *args, **kwargs):
        if not _is_api_request_authorized(request):
            return JsonResponse(
                {
                    "detail": (
                        "Unauthorized. Use an authenticated staff session "
                        "or set OPENOUTREACH_API_TOKEN and send Bearer auth."
                    )
                },
                status=403,
            )
        return view_func(request, *args, **kwargs)

    return wrapped


def _serialize_campaign(campaign: Campaign) -> dict:
    summary = _campaign_summary(campaign)
    return {
        "id": campaign.id,
        "name": campaign.name,
        "product_docs": campaign.product_docs,
        "campaign_objective": campaign.campaign_objective,
        "booking_link": campaign.booking_link,
        "is_freemium": campaign.is_freemium,
        "action_fraction": campaign.action_fraction,
        "stats": {
            "total_deals": summary["total_deals"],
            "qualified": summary["qualified"],
            "ready": summary["ready"],
            "connected": summary["connected"],
            "completed": summary["completed"],
            "response_rate": summary["response_rate"],
        },
    }


def _serialize_prospect(deal: Deal) -> dict:
    lead = deal.lead
    profile = lead.profile_data or {}
    return {
        "deal_id": deal.id,
        "campaign_id": deal.campaign_id,
        "campaign_name": deal.campaign.name,
        "state": deal.state,
        "closing_reason": deal.closing_reason,
        "reason": deal.reason,
        "updated_at": deal.update_date.isoformat(),
        "lead": {
            "id": lead.id,
            "full_name": lead.full_name,
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "company_name": lead.company_name,
            "linkedin_url": lead.linkedin_url,
            "public_identifier": lead.public_identifier,
            "headline": profile.get("headline", ""),
            "location": profile.get("location", ""),
            "profile_data": profile,
        },
    }


def dashboard(request):
    campaigns = Campaign.objects.order_by("name")
    site_config = SiteConfig.load()
    context = {
        "hero_stats": _hero_stats(),
        "campaign_summaries": [_campaign_summary(campaign) for campaign in campaigns[:4]],
        "prospect_cards": _prospect_cards(),
        "pipeline_columns": _pipeline_columns(),
        "site_config": site_config,
        "profile_count": LinkedInProfile.objects.filter(active=True).count(),
        "nav": "dashboard",
    }
    return render(request, "linkedin/app/dashboard.html", context)


@require_http_methods(["GET"])
@integration_api
def api_health(request):
    return JsonResponse(
        {
            "status": "ok",
            "campaign_count": Campaign.objects.count(),
            "lead_count": Lead.objects.count(),
            "active_profile_count": LinkedInProfile.objects.filter(active=True).count(),
        }
    )


@require_http_methods(["GET"])
@integration_api
def api_campaigns(request):
    campaigns = Campaign.objects.order_by("id")
    return JsonResponse(
        {
            "results": [_serialize_campaign(campaign) for campaign in campaigns],
            "count": campaigns.count(),
        }
    )


@require_http_methods(["GET"])
@integration_api
def api_prospects(request):
    query = request.GET.get("q", "").strip()
    state = _normalize_state_filter(request.GET.get("state", ""))
    campaign_id = request.GET.get("campaign_id", "").strip()
    try:
        limit = min(max(int(request.GET.get("limit", 50)), 1), 200)
    except ValueError:
        limit = 50

    prospects = Deal.objects.select_related("lead", "campaign").exclude(lead__isnull=True)
    if query:
        prospects = prospects.filter(
            Q(lead__first_name__icontains=query)
            | Q(lead__last_name__icontains=query)
            | Q(lead__company_name__icontains=query)
            | Q(campaign__name__icontains=query)
            | Q(reason__icontains=query)
        )
    if state:
        prospects = prospects.filter(state=state)
    if campaign_id.isdigit():
        prospects = prospects.filter(campaign_id=int(campaign_id))
    prospects = prospects.order_by("-update_date")
    payload = [_serialize_prospect(deal) for deal in prospects[:limit]]
    return JsonResponse({"results": payload, "count": len(payload)})


def campaigns_page(request):
    campaigns = Campaign.objects.order_by("-id")
    form = CampaignForm()
    context = {
        "campaigns": [_campaign_summary(campaign) for campaign in campaigns],
        "form": form,
        "nav": "campaigns",
    }
    return render(request, "linkedin/app/campaigns.html", context)


@require_http_methods(["POST"])
def create_campaign(request):
    form = CampaignForm(request.POST)
    if form.is_valid():
        campaign = form.save()
        messages.success(request, f"Campaign '{campaign.name}' created.")
    else:
        messages.error(request, "Campaign could not be saved. Check the required fields.")
    return redirect("campaigns_page")


def campaign_detail(request, campaign_id: int):
    campaign = get_object_or_404(Campaign, pk=campaign_id)
    deals = (
        campaign.deals.select_related("lead")
        .exclude(lead__isnull=True)
        .order_by("-update_date")
    )
    context = {
        "summary": _campaign_summary(campaign),
        "deals": deals,
        "search_keywords": campaign.search_keywords.order_by("-used_at", "keyword")[:16],
        "nav": "campaigns",
    }
    return render(request, "linkedin/app/campaign_detail.html", context)


def prospects_page(request):
    query = request.GET.get("q", "").strip()
    state = request.GET.get("state", "").strip()
    prospects = Deal.objects.select_related("lead", "campaign").exclude(lead__isnull=True)
    if query:
        prospects = prospects.filter(
            Q(lead__first_name__icontains=query)
            | Q(lead__last_name__icontains=query)
            | Q(lead__company_name__icontains=query)
            | Q(campaign__name__icontains=query)
            | Q(reason__icontains=query)
        )
    if state:
        prospects = prospects.filter(state=state)
    prospects = prospects.order_by("-update_date")
    context = {
        "prospects": prospects[:50],
        "query": query,
        "selected_state": state,
        "states": PIPELINE_STATES,
        "nav": "prospects",
    }
    return render(request, "linkedin/app/prospects.html", context)


def pipeline_page(request):
    context = {
        "pipeline_columns": _pipeline_columns(),
        "nav": "pipeline",
    }
    return render(request, "linkedin/app/pipeline.html", context)


def settings_page(request):
    config = SiteConfig.load()
    form = SiteConfigForm(instance=config)
    context = {
        "form": form,
        "active_profile_count": LinkedInProfile.objects.filter(active=True).count(),
        "ai_ready": bool(config.llm_api_key),
        "admin_url": reverse("admin:index"),
        "nav": "settings",
    }
    return render(request, "linkedin/app/settings.html", context)


@require_http_methods(["POST"])
def save_settings(request):
    config = SiteConfig.load()
    form = SiteConfigForm(request.POST, instance=config)
    if form.is_valid():
        config = form.save(commit=False)
        if not config.ai_model:
            config.ai_model = DEFAULT_GROQ_MODEL
        if not config.llm_api_base:
            config.llm_api_base = DEFAULT_GROQ_API_BASE
        config.save()
        messages.success(request, "AI configuration updated.")
    else:
        messages.error(request, "AI configuration could not be saved.")
    return redirect("settings_page")
