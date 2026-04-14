import pytest
from django.contrib.auth.models import User

from crm.models import Deal
from linkedin.enums import ProfileState
from linkedin.models import Campaign, LinkedInProfile, SiteConfig
from marketing.models import CreatorProfile, LeadContext, LinkedInPost
from marketing.services import _ensure_publish_profile_credentials


@pytest.mark.django_db
def test_auth_signup_login_logout_session_flow(client):
    signup_response = client.post(
        "/api/app/auth/signup/",
        data={
            "username": "maya",
            "password": "secret123",
            "email": "maya@example.com",
            "first_name": "Maya",
            "last_name": "Stone",
        },
        content_type="application/json",
    )

    assert signup_response.status_code == 201
    assert signup_response.json()["authenticated"] is True

    session_response = client.get("/api/app/auth/session/")
    assert session_response.status_code == 200
    assert session_response.json()["authenticated"] is True

    logout_response = client.post("/api/app/auth/logout/", content_type="application/json")
    assert logout_response.status_code == 200
    assert logout_response.json()["authenticated"] is False

    login_response = client.post(
        "/api/app/auth/login/",
        data={"username": "maya", "password": "secret123"},
        content_type="application/json",
    )
    assert login_response.status_code == 200
    assert login_response.json()["authenticated"] is True


@pytest.mark.django_db
def test_profile_api_creates_and_updates_workspace_profile(client):
    user = User.objects.create_user(username="ada", password="secret123", is_staff=True, is_active=True)
    client.force_login(user)
    response = client.post(
        "/api/app/profile/",
        data={
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "title": "Founder",
            "company": "Analytical Engines",
            "tone": "educator",
            "objective": "leads",
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    payload = response.json()["profile"]
    assert payload["first_name"] == "Ada"
    assert payload["company"] == "Analytical Engines"
    assert CreatorProfile.objects.count() == 1


@pytest.mark.django_db
def test_generate_post_api_completes_inline_with_stubbed_qwen(client, monkeypatch):
    user = User.objects.create_user(username="ada", password="secret123", is_staff=True, is_active=True)
    client.force_login(user)
    monkeypatch.setenv("MARKETING_RUN_JOBS_INLINE", "1")

    def fake_generate(*_args, **_kwargs):
        return {
            "topic": "Pourquoi les commentaires LinkedIn valent plus qu’un like",
            "body": "Hook.\n\nCorps.\n\nCTA.",
            "hashtags": ["#LinkedIn", "#B2B"],
            "selected_hashtags": ["#LinkedIn"],
            "readability_score": 81,
            "word_count": 4,
            "char_count": 20,
        }

    monkeypatch.setattr("marketing.services.generate_post_content", fake_generate)

    response = client.post(
        "/api/app/posts/generate/",
        data={"subject": "Engagement LinkedIn"},
        content_type="application/json",
    )

    assert response.status_code == 202
    job_id = response.json()["job"]["id"]

    job_response = client.get(f"/api/app/posts/jobs/{job_id}/")
    assert job_response.status_code == 200
    job_payload = job_response.json()["job"]
    assert job_payload["status"] == "completed"
    assert job_payload["post"]["topic"] == "Pourquoi les commentaires LinkedIn valent plus qu’un like"


@pytest.mark.django_db
def test_sync_openoutreach_api_creates_campaign_profile_and_site_config(client):
    user = User.objects.create_user(username="maya", password="secret123", is_staff=True, is_active=True)
    client.force_login(user)
    client.post(
        "/api/app/profile/",
        data={
            "first_name": "Maya",
            "last_name": "Stone",
            "title": "Growth Consultant",
            "description": "J’aide les indépendants à générer des leads B2B.",
            "company": "Growth Lab",
            "sector": "Marketing",
            "company_description": "Cabinet de growth marketing.",
            "product_name": "Lead Sprint",
            "product_description": "Accompagnement LinkedIn.",
            "product_benefits": "Plus de RDV qualifiés.",
            "target_title": "Founder",
            "target_sector": "SaaS",
            "target_company_size": "11-50",
            "target_country": "France",
            "tone": "direct",
            "objective": "leads",
            "linkedin_email": "maya@example.com",
            "linkedin_password": "secret123",
            "qwen_api_key": "qwen-key",
            "qwen_api_base": "https://example.test/v1",
            "qwen_model": "qwen-plus",
        },
        content_type="application/json",
    )

    response = client.post("/api/app/profile/sync-openoutreach/")

    assert response.status_code == 200
    assert Campaign.objects.count() == 1
    assert LinkedInProfile.objects.count() == 1
    site = SiteConfig.load()
    assert site.llm_api_key == "qwen-key"
    assert site.ai_model == "qwen-plus"


@pytest.mark.django_db
def test_profile_update_pushes_settings_credentials_to_synced_openoutreach_account(client):
    user = User.objects.create(username="maya")
    client.force_login(user)
    openoutreach_user = User.objects.create(username="maya-workspace")
    linkedin_profile = LinkedInProfile.objects.create(
        user=openoutreach_user,
        linkedin_username="old@example.com",
        linkedin_password="old-secret",
        cookie_data={"cookies": [{"name": "li_at", "value": "old"}]},
    )
    profile = CreatorProfile.objects.create(
        user=user,
        linkedin_email="old@example.com",
        linkedin_password="old-secret",
        openoutreach_profile=linkedin_profile,
    )

    response = client.post(
        "/api/app/profile/",
        data={
            "linkedin_email": "new@example.com",
            "linkedin_password": "new-secret",
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    linkedin_profile.refresh_from_db()
    assert linkedin_profile.linkedin_username == "new@example.com"
    assert linkedin_profile.linkedin_password == "new-secret"
    assert linkedin_profile.cookie_data is None


@pytest.mark.django_db
def test_publish_profile_uses_latest_settings_credentials():
    user = User.objects.create(username="owner")
    openoutreach_user = User.objects.create(username="owner-workspace")
    campaign = Campaign.objects.create(name="Owner Outreach")
    linkedin_profile = LinkedInProfile.objects.create(
        user=openoutreach_user,
        linkedin_username="old@example.com",
        linkedin_password="old-secret",
        cookie_data={"cookies": [{"name": "li_at", "value": "old"}]},
    )
    campaign.users.add(openoutreach_user)
    profile = CreatorProfile.objects.create(
        user=user,
        linkedin_email="new@example.com",
        linkedin_password="new-secret",
        openoutreach_campaign=campaign,
        openoutreach_profile=linkedin_profile,
    )
    synced_profile = _ensure_publish_profile_credentials(profile)

    linkedin_profile.refresh_from_db()
    assert synced_profile.pk == linkedin_profile.pk
    assert linkedin_profile.linkedin_username == "new@example.com"
    assert linkedin_profile.linkedin_password == "new-secret"
    assert linkedin_profile.cookie_data is None


@pytest.mark.django_db
def test_ingest_engagement_api_creates_lead_context_and_pipeline_deal(client):
    user = User.objects.create_user(username="owner", password="secret123", is_staff=True, is_active=True)
    client.force_login(user)
    profile = CreatorProfile.objects.create(user=user)
    campaign = Campaign.objects.create(name="Owner Outreach")
    profile.openoutreach_campaign = campaign
    profile.save(update_fields=["openoutreach_campaign"])

    post = LinkedInPost.objects.create(
        profile=profile,
        suggested_topic="Le vrai ROI des commentaires LinkedIn",
        body="Post body",
    )

    response = client.post(
        "/api/app/engagements/ingest/",
        data={
            "post_id": post.id,
            "linkedin_url": "https://www.linkedin.com/in/jane-doe/",
            "first_name": "Jane",
            "last_name": "Doe",
            "comment_text": "Très bon angle sur les commentaires.",
        },
        content_type="application/json",
    )

    assert response.status_code == 201
    assert Deal.objects.filter(campaign=campaign, state=ProfileState.QUALIFIED.value).count() == 1
    assert LeadContext.objects.count() == 1
