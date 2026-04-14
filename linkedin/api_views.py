from __future__ import annotations

import json
import secrets
from urllib.parse import quote

from django.contrib.auth import authenticate, get_user_model, login as auth_login, logout as auth_logout
from django.http import HttpRequest, HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.db.models import Q

from marketing.models import LinkedInPost, PostGenerationJob
from marketing.services import (
    _compose_generation_context,
    build_facebook_login_url,
    connect_facebook_page,
    creator_profile_to_dict,
    enqueue_generation_job,
    get_dashboard_snapshot,
    get_marketing_frontend_url,
    get_or_create_creator_profile,
    get_pipeline_snapshot,
    ingest_post_engagement_lead,
    publish_post,
    serialize_generation_job,
    sync_user_to_openoutreach,
    update_creator_profile,
)

User = get_user_model()


def _read_json(request: HttpRequest) -> dict:
    """Parse a JSON request body and return an empty payload on blank input."""
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


def _resolve_authenticated_user(request: HttpRequest):
    """Return the logged-in app user, or None when no session exists."""
    user = getattr(request, "user", None)
    if user and user.is_authenticated:
        return user
    return None


def _unauthorized_response() -> JsonResponse:
    return JsonResponse({"detail": "Authentication required."}, status=401)


def _redirect_frontend(path: str) -> HttpResponseRedirect:
    frontend = get_marketing_frontend_url()
    target = path if path.startswith("/") else f"/{path}"
    return HttpResponseRedirect(f"{frontend}{target}")


def _session_payload(request: HttpRequest) -> dict:
    user = _resolve_authenticated_user(request)
    if not user:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "user": {
            "id": user.pk,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
    }


def _authenticate_from_payload(payload: dict):
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not username or not password:
        return None

    user = authenticate(username=username, password=password)
    if user:
        return user

    candidate = User.objects.filter(Q(email__iexact=username) | Q(username__iexact=username)).first()
    if candidate:
        return authenticate(username=candidate.username, password=password)
    return None


@ensure_csrf_cookie
@require_http_methods(["GET"])
def auth_session_api(request: HttpRequest) -> JsonResponse:
    """Return the current authenticated marketing app session."""
    return JsonResponse(_session_payload(request))


@ensure_csrf_cookie
@csrf_protect
@require_http_methods(["POST"])
def auth_login_api(request: HttpRequest) -> JsonResponse:
    """Authenticate a workspace user and start a Django session."""
    payload = _read_json(request)
    user = _authenticate_from_payload(payload)
    if not user:
        return JsonResponse({"detail": "Invalid username or password."}, status=400)
    if not user.is_active:
        return JsonResponse({"detail": "This account is inactive."}, status=403)
    auth_login(request, user)
    get_or_create_creator_profile(user.pk)
    return JsonResponse(_session_payload(request))


@ensure_csrf_cookie
@csrf_protect
@require_http_methods(["POST"])
def auth_signup_api(request: HttpRequest) -> JsonResponse:
    """Create a dedicated workspace user and sign them in immediately."""
    payload = _read_json(request)
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    email = str(payload.get("email", "")).strip()
    first_name = str(payload.get("first_name", "")).strip()
    last_name = str(payload.get("last_name", "")).strip()

    if not username or not password:
        return JsonResponse({"detail": "Username and password are required."}, status=400)
    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({"detail": "This username is already taken."}, status=400)
    if email and User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"detail": "This email is already in use."}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_active=True,
        is_staff=True,
    )
    auth_login(request, user)
    get_or_create_creator_profile(user.pk)
    return JsonResponse(_session_payload(request), status=201)


@csrf_protect
@require_http_methods(["POST"])
def auth_logout_api(request: HttpRequest) -> JsonResponse:
    """End the current app session."""
    auth_logout(request)
    return JsonResponse({"authenticated": False})


@ensure_csrf_cookie
@require_http_methods(["GET", "POST"])
def creator_profile_api(request: HttpRequest) -> JsonResponse:
    """Create or update the SaaS workspace profile used by the frontend."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _unauthorized_response()
    profile = get_or_create_creator_profile(user.pk)
    if request.method == "POST":
        payload = _read_json(request)
        profile = update_creator_profile(profile, payload)
    return JsonResponse({"profile": creator_profile_to_dict(profile)})


@require_http_methods(["POST"])
def sync_openoutreach_api(request: HttpRequest) -> JsonResponse:
    """Sync the creator profile into OpenOutreach's native campaign records."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _unauthorized_response()
    profile = get_or_create_creator_profile(user.pk)
    try:
        result = sync_user_to_openoutreach(profile.user_id)
    except ValueError as exc:
        return JsonResponse({"detail": str(exc)}, status=400)
    return JsonResponse({"sync": result, "profile": creator_profile_to_dict(profile)})


@require_http_methods(["GET"])
def facebook_connect_api(request: HttpRequest):
    """Redirect the user to the official Meta Login flow for Facebook publishing."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _redirect_frontend("/login")
    state = secrets.token_urlsafe(24)
    return_to = str(request.GET.get("return_to") or "/publish").strip() or "/publish"
    if not return_to.startswith("/"):
        return_to = "/publish"
    request.session["facebook_oauth_state"] = state
    request.session["facebook_oauth_return_to"] = return_to
    redirect_uri = request.build_absolute_uri("/api/app/facebook/callback/")
    try:
        login_url = build_facebook_login_url(redirect_uri=redirect_uri, state=state)
    except ValueError as exc:
        return _redirect_frontend(f"{return_to}?facebook=error&message={quote(str(exc))}")
    return HttpResponseRedirect(login_url)


@require_http_methods(["GET"])
def facebook_callback_api(request: HttpRequest):
    """Complete Meta Login, store the Page token, and return to the publish screen."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _redirect_frontend("/login")
    profile = get_or_create_creator_profile(user.pk)
    expected_state = request.session.pop("facebook_oauth_state", "")
    return_to = request.session.pop("facebook_oauth_return_to", "/publish")
    if not isinstance(return_to, str) or not return_to.startswith("/"):
        return_to = "/publish"

    error_reason = str(request.GET.get("error_description") or request.GET.get("error") or "").strip()
    if error_reason:
        return _redirect_frontend(f"{return_to}?facebook=error&message={quote(error_reason)}")

    state = str(request.GET.get("state") or "").strip()
    code = str(request.GET.get("code") or "").strip()
    if not expected_state or state != expected_state:
        return _redirect_frontend(f"{return_to}?facebook=error&message={quote('Etat OAuth Facebook invalide.')}")
    if not code:
        return _redirect_frontend(f"{return_to}?facebook=error&message={quote('Code OAuth Facebook manquant.')}")

    redirect_uri = request.build_absolute_uri("/api/app/facebook/callback/")
    try:
        connect_facebook_page(profile, code=code, redirect_uri=redirect_uri)
    except ValueError as exc:
        return _redirect_frontend(f"{return_to}?facebook=error&message={quote(str(exc))}")
    return _redirect_frontend(f"{return_to}?facebook=connected")


@require_http_methods(["POST"])
def generate_post_api(request: HttpRequest) -> JsonResponse:
    """Create an asynchronous Qwen generation job for the workspace."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _unauthorized_response()
    profile = get_or_create_creator_profile(user.pk)
    payload = _read_json(request)
    try:
        subject, source_content = _compose_generation_context(payload)
        job = enqueue_generation_job(
            profile,
            subject=subject,
            source_content=source_content,
            tone_override=payload.get("tone_override", ""),
        )
    except ValueError as exc:
        return JsonResponse({"detail": str(exc)}, status=400)
    return JsonResponse({"job": serialize_generation_job(job)}, status=202)


@require_http_methods(["GET"])
def generation_job_api(request: HttpRequest, job_id: int) -> JsonResponse:
    """Return the current status and result of a generation job."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _unauthorized_response()
    job = PostGenerationJob.objects.select_related("post", "profile").get(pk=job_id, profile__user=user)
    return JsonResponse({"job": serialize_generation_job(job)})


@require_http_methods(["POST"])
def publish_post_api(request: HttpRequest, post_id: int) -> JsonResponse:
    """Persist publish intent and mark the post as published for the UI."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _unauthorized_response()
    payload = _read_json(request)
    post = LinkedInPost.objects.select_related("profile").get(pk=post_id, profile__user=user)
    selected_hashtags = payload.get("selected_hashtags") or post.selected_hashtags
    if not isinstance(selected_hashtags, list):
        selected_hashtags = []
    try:
        post = publish_post(
            post,
            body=payload.get("body"),
            selected_hashtags=[str(tag) for tag in selected_hashtags],
            image_url=str(payload.get("image_url", "")).strip(),
            image_data_url=str(payload.get("image_data_url", "")).strip(),
            platform=str(payload.get("platform", "linkedin")).strip().lower() or "linkedin",
        )
    except ValueError as exc:
        return JsonResponse({"detail": str(exc)}, status=400)
    return JsonResponse({"post": {
        "id": post.id,
        "status": post.status,
        "body": post.body,
        "selected_hashtags": post.selected_hashtags,
        "linkedin_post_id": post.linkedin_post_id,
        "published_at": post.published_at.isoformat() if post.published_at else None,
    }})


@require_http_methods(["GET"])
def dashboard_api(request: HttpRequest) -> JsonResponse:
    """Return summary metrics for the existing dashboard page."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _unauthorized_response()
    profile = get_or_create_creator_profile(user.pk)
    return JsonResponse(get_dashboard_snapshot(profile))


@require_http_methods(["GET"])
def pipeline_api(request: HttpRequest) -> JsonResponse:
    """Return pipeline counts, recent leads, and recent messages."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _unauthorized_response()
    profile = get_or_create_creator_profile(user.pk)
    return JsonResponse(get_pipeline_snapshot(profile))


@require_http_methods(["POST"])
def ingest_engagement_api(request: HttpRequest) -> JsonResponse:
    """Insert a post-engagement lead into the OpenOutreach pipeline."""
    user = _resolve_authenticated_user(request)
    if not user:
        return _unauthorized_response()
    profile = get_or_create_creator_profile(user.pk)
    payload = _read_json(request)
    try:
        source_post = None
        post_id = payload.get("post_id")
        if post_id:
            source_post = LinkedInPost.objects.get(pk=post_id, profile__user=user)
        lead = ingest_post_engagement_lead(
            profile,
            linkedin_url=payload.get("linkedin_url", ""),
            first_name=payload.get("first_name", ""),
            last_name=payload.get("last_name", ""),
            comment_text=payload.get("comment_text", ""),
            source_post=source_post,
        )
    except (ValueError, LinkedInPost.DoesNotExist) as exc:
        return JsonResponse({"detail": str(exc)}, status=400)
    return JsonResponse({"lead_id": lead.pk, "public_identifier": lead.public_identifier}, status=201)
