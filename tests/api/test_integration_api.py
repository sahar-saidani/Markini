import pytest
from django.contrib.auth.models import User

from crm.models import Deal, Lead
from linkedin.enums import ProfileState
from linkedin.models import Campaign


@pytest.mark.django_db
def test_api_health_requires_auth(client):
    response = client.get("/api/health/")

    assert response.status_code == 403
    assert "Unauthorized" in response.json()["detail"]


@pytest.mark.django_db
def test_api_health_accepts_bearer_token(client, monkeypatch):
    monkeypatch.setenv("OPENOUTREACH_API_TOKEN", "secret-token")

    response = client.get("/api/health/", HTTP_AUTHORIZATION="Bearer secret-token")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "campaign_count" in payload


@pytest.mark.django_db
def test_api_campaigns_returns_stats_for_marketing_app(client, monkeypatch):
    monkeypatch.setenv("OPENOUTREACH_API_TOKEN", "secret-token")
    campaign = Campaign.objects.create(
        name="Q2 Growth",
        product_docs="AI assistant for outbound teams.",
        campaign_objective="Reach marketing directors in B2B SaaS.",
        booking_link="https://example.com/demo",
    )
    lead = Lead.objects.create(
        first_name="Ada",
        last_name="Okafor",
        company_name="Northwind",
        linkedin_url="https://www.linkedin.com/in/ada-okafor/",
        public_identifier="ada-okafor",
    )
    Deal.objects.create(
        lead=lead,
        campaign=campaign,
        state=ProfileState.READY_TO_CONNECT.value,
        reason="Strong ICP match",
    )

    response = client.get("/api/campaigns/", HTTP_AUTHORIZATION="Bearer secret-token")

    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 1
    result = payload["results"][0]
    assert result["name"] == "Q2 Growth"
    assert result["stats"]["ready"] == 1
    assert result["stats"]["response_rate"] == 0


@pytest.mark.django_db
def test_api_prospects_filters_by_state_and_query(client, monkeypatch):
    monkeypatch.setenv("OPENOUTREACH_API_TOKEN", "secret-token")
    campaign = Campaign.objects.create(name="Outbound")
    matching_lead = Lead.objects.create(
        first_name="Maya",
        last_name="Stone",
        company_name="Acme",
        linkedin_url="https://www.linkedin.com/in/maya-stone/",
        public_identifier="maya-stone",
        profile_data={"headline": "VP Marketing", "location": "Lagos"},
    )
    other_lead = Lead.objects.create(
        first_name="Jon",
        last_name="Fields",
        company_name="Beta",
        linkedin_url="https://www.linkedin.com/in/jon-fields/",
        public_identifier="jon-fields",
    )
    Deal.objects.create(
        lead=matching_lead,
        campaign=campaign,
        state=ProfileState.CONNECTED.value,
        reason="Interested in attribution tooling",
    )
    Deal.objects.create(
        lead=other_lead,
        campaign=campaign,
        state=ProfileState.FAILED.value,
        reason="Not a fit",
    )

    response = client.get(
        "/api/prospects/?state=CONNECTED&q=Maya&limit=10",
        HTTP_AUTHORIZATION="Bearer secret-token",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 1
    result = payload["results"][0]
    assert result["lead"]["full_name"] == "Maya Stone"
    assert result["lead"]["headline"] == "VP Marketing"
    assert result["state"] == ProfileState.CONNECTED.value


@pytest.mark.django_db
def test_api_endpoints_accept_staff_session(client):
    staff = User.objects.create_user(username="admin", password="secret", is_staff=True)
    campaign = Campaign.objects.create(name="Session Auth Campaign")
    lead = Lead.objects.create(
        first_name="Tobi",
        last_name="Cole",
        company_name="Gamma",
        linkedin_url="https://www.linkedin.com/in/tobi-cole/",
        public_identifier="tobi-cole",
    )
    Deal.objects.create(lead=lead, campaign=campaign, state=ProfileState.QUALIFIED.value)
    client.force_login(staff)

    response = client.get("/api/prospects/")

    assert response.status_code == 200
    assert response.json()["count"] == 1
