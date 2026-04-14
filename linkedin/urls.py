# linkedin/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

from linkedin import api_views
from linkedin import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("api/app/auth/session/", api_views.auth_session_api, name="auth_session_api"),
    path("api/app/auth/login/", api_views.auth_login_api, name="auth_login_api"),
    path("api/app/auth/signup/", api_views.auth_signup_api, name="auth_signup_api"),
    path("api/app/auth/logout/", api_views.auth_logout_api, name="auth_logout_api"),
    path("api/app/profile/", api_views.creator_profile_api, name="creator_profile_api"),
    path("api/app/profile/sync-openoutreach/", api_views.sync_openoutreach_api, name="sync_openoutreach_api"),
    path("api/app/facebook/connect/", api_views.facebook_connect_api, name="facebook_connect_api"),
    path("api/app/facebook/callback/", api_views.facebook_callback_api, name="facebook_callback_api"),
    path("api/app/posts/generate/", api_views.generate_post_api, name="generate_post_api"),
    path("api/app/posts/jobs/<int:job_id>/", api_views.generation_job_api, name="generation_job_api"),
    path("api/app/posts/<int:post_id>/publish/", api_views.publish_post_api, name="publish_post_api"),
    path("api/app/dashboard/", api_views.dashboard_api, name="dashboard_api"),
    path("api/app/pipeline/", api_views.pipeline_api, name="pipeline_api"),
    path("api/app/engagements/ingest/", api_views.ingest_engagement_api, name="ingest_engagement_api"),
    path("api/health/", views.api_health, name="api_health"),
    path("api/campaigns/", views.api_campaigns, name="api_campaigns"),
    path("api/prospects/", views.api_prospects, name="api_prospects"),
    path("campaigns/", views.campaigns_page, name="campaigns_page"),
    path("campaigns/create/", views.create_campaign, name="create_campaign"),
    path("campaigns/<int:campaign_id>/", views.campaign_detail, name="campaign_detail"),
    path("prospects/", views.prospects_page, name="prospects_page"),
    path("pipeline/", views.pipeline_page, name="pipeline_page"),
    path("settings/", views.settings_page, name="settings_page"),
    path("settings/save/", views.save_settings, name="save_settings"),
    path("admin/", admin.site.urls),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
