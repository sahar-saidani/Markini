from __future__ import annotations

import json
import logging
import mimetypes
import os
import secrets
import subprocess
import tempfile
import threading
import base64
import uuid
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from urllib import error, request
from urllib.parse import urlencode

from django.contrib.auth.models import User
from django.db import close_old_connections, transaction
from django.template.defaultfilters import slugify
from django.utils import timezone
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from crm.models import Deal, Lead
from linkedin.enums import ProfileState
from linkedin.models import Campaign, LinkedInProfile, SiteConfig
from linkedin.tasks.connect import enqueue_connect
from marketing.models import CreatorProfile, LeadContext, LinkedInPost, PostGenerationJob

logger = logging.getLogger(__name__)

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"
TEMPLATES_DIR = ASSETS_DIR / "templates"
CAMPAIGN_DIR = ASSETS_DIR / "campaign"
DEFAULT_QWEN_BASE = "https://openrouter.ai/api/v1"
DEFAULT_QWEN_MODEL = "openai/gpt-oss-120b"


@dataclass
class QwenConfig:
    """Resolved Qwen API configuration for a workspace."""

    api_key: str
    base_url: str
    model: str


@dataclass
class FacebookConfig:
    """Resolved Meta Graph API configuration for Facebook Page publishing."""

    access_token: str
    page_id: str
    base_url: str


@dataclass
class FacebookOAuthConfig:
    """Resolved Meta application credentials used for Facebook Login."""

    app_id: str
    app_secret: str
    base_url: str


def sanitize_text(value: str | None, *, max_length: int | None = None) -> str:
    """Normalize user input before saving or sending it to services."""
    cleaned = (value or "").replace("\x00", " ").strip()
    if max_length is not None:
        return cleaned[:max_length]
    return cleaned


def get_workspace_user(user_id: int | None = None) -> User:
    """Resolve the current SaaS workspace owner for local development."""
    if user_id:
        return User.objects.get(pk=user_id)

    user = User.objects.order_by("id").first()
    if user:
        return user

    user = User.objects.create_user(
        username="workspace-owner",
        first_name="Workspace",
        last_name="Owner",
        is_staff=True,
        is_active=True,
    )
    user.set_unusable_password()
    user.save(update_fields=["password"])
    return user


def get_or_create_creator_profile(user_id: int | None = None) -> CreatorProfile:
    """Return the workspace profile bound to the resolved user."""
    user = get_workspace_user(user_id)
    profile, _ = CreatorProfile.objects.get_or_create(user=user)
    return profile


def update_creator_profile(profile: CreatorProfile, payload: dict) -> CreatorProfile:
    """Persist sanitized onboarding/settings data onto the creator profile."""
    user = profile.user
    user.first_name = sanitize_text(payload.get("first_name"), max_length=150)
    user.last_name = sanitize_text(payload.get("last_name"), max_length=150)
    user.email = sanitize_text(payload.get("email"), max_length=254)
    user.save(update_fields=["first_name", "last_name", "email"])

    profile.professional_title = sanitize_text(payload.get("title"), max_length=200)
    profile.personal_description = sanitize_text(payload.get("description"))
    profile.company_name = sanitize_text(payload.get("company"), max_length=200)
    profile.company_sector = sanitize_text(payload.get("sector"), max_length=120)
    profile.company_description = sanitize_text(payload.get("company_description"))
    profile.product_name = sanitize_text(payload.get("product_name"), max_length=200)
    profile.product_description = sanitize_text(payload.get("product_description"))
    profile.product_benefits = sanitize_text(payload.get("product_benefits"))
    profile.product_price = sanitize_text(payload.get("product_price"), max_length=120)
    profile.icp_job_title = sanitize_text(payload.get("target_title"), max_length=200)
    profile.icp_sector = sanitize_text(payload.get("target_sector"), max_length=120)
    profile.icp_company_size = sanitize_text(payload.get("target_company_size"), max_length=80)
    profile.icp_country = sanitize_text(payload.get("target_country"), max_length=120)
    profile.preferred_tone = sanitize_text(payload.get("tone"), max_length=40) or profile.preferred_tone
    profile.primary_goal = sanitize_text(payload.get("objective"), max_length=40) or profile.primary_goal
    previous_linkedin_email = profile.linkedin_email
    previous_linkedin_password = profile.linkedin_password
    profile.linkedin_email = sanitize_text(payload.get("linkedin_email"), max_length=254)
    if "linkedin_password" in payload:
        linkedin_password = sanitize_text(payload.get("linkedin_password"), max_length=200)
        if linkedin_password:
            profile.linkedin_password = linkedin_password
    if "qwen_api_key" in payload:
        qwen_api_key = sanitize_text(payload.get("qwen_api_key"), max_length=300)
        if qwen_api_key:
            profile.qwen_api_key = qwen_api_key
    if "qwen_api_base" in payload:
        profile.qwen_api_base = sanitize_text(payload.get("qwen_api_base"), max_length=300)
    if "qwen_model" in payload:
        profile.qwen_model = sanitize_text(payload.get("qwen_model"), max_length=120)
    if "auto_publish" in payload:
        profile.auto_publish = bool(payload.get("auto_publish"))
    if "auto_connect" in payload:
        profile.auto_connect = bool(payload.get("auto_connect"))
    if "auto_follow_up" in payload:
        profile.auto_follow_up = bool(payload.get("auto_follow_up"))

    profile.save()

    credentials_changed = (
        profile.linkedin_email != previous_linkedin_email
        or profile.linkedin_password != previous_linkedin_password
    )
    if profile.openoutreach_profile_id and credentials_changed:
        linkedin_profile = profile.openoutreach_profile
        linkedin_profile.linkedin_username = profile.linkedin_email
        linkedin_profile.linkedin_password = profile.linkedin_password
        linkedin_profile.cookie_data = None
        linkedin_profile.save(update_fields=["linkedin_username", "linkedin_password", "cookie_data"])

    return profile


def _ensure_publish_profile_credentials(profile: CreatorProfile) -> LinkedInProfile:
    """Make the OpenOutreach publish account follow the current Settings credentials."""
    linkedin_profile = profile.openoutreach_profile
    if not linkedin_profile:
        raise ValueError("Sync the workspace to OpenOutreach before publishing to LinkedIn.")

    desired_username = profile.linkedin_email
    desired_password = profile.linkedin_password
    if not desired_username or not desired_password:
        raise ValueError("LinkedIn credentials are required in Settings before publishing.")

    update_fields: list[str] = []
    if linkedin_profile.linkedin_username != desired_username:
        linkedin_profile.linkedin_username = desired_username
        linkedin_profile.cookie_data = None
        update_fields.extend(["linkedin_username", "cookie_data"])
    if linkedin_profile.linkedin_password != desired_password:
        linkedin_profile.linkedin_password = desired_password
        if "cookie_data" not in update_fields:
            linkedin_profile.cookie_data = None
            update_fields.append("cookie_data")
        update_fields.append("linkedin_password")
    if update_fields:
        linkedin_profile.save(update_fields=update_fields)
    return linkedin_profile


def creator_profile_to_dict(profile: CreatorProfile) -> dict:
    """Serialize the creator profile for frontend consumption."""
    return {
        "user_id": profile.user_id,
        "first_name": profile.user.first_name,
        "last_name": profile.user.last_name,
        "email": profile.user.email,
        "title": profile.professional_title,
        "description": profile.personal_description,
        "company": profile.company_name,
        "sector": profile.company_sector,
        "company_description": profile.company_description,
        "product_name": profile.product_name,
        "product_description": profile.product_description,
        "product_benefits": profile.product_benefits,
        "product_price": profile.product_price,
        "target_title": profile.icp_job_title,
        "target_sector": profile.icp_sector,
        "target_company_size": profile.icp_company_size,
        "target_country": profile.icp_country,
        "tone": profile.preferred_tone,
        "objective": profile.primary_goal,
        "linkedin_email": profile.linkedin_email,
        "linkedin_password_configured": bool(profile.linkedin_password),
        "facebook_connected": bool(profile.facebook_page_access_token and profile.facebook_page_id),
        "facebook_page_name": profile.facebook_page_name,
        "qwen_api_key_configured": bool(
            os.environ.get("LLM_API_KEY")
            or os.environ.get("QWEN_API_KEY")
            or profile.qwen_api_key
        ),
        "qwen_api_base": os.environ.get("LLM_API_BASE") or os.environ.get("QWEN_API_BASE") or profile.qwen_api_base or DEFAULT_QWEN_BASE,
        "qwen_model": os.environ.get("LLM_API_MODEL") or os.environ.get("QWEN_API_MODEL") or profile.qwen_model or DEFAULT_QWEN_MODEL,
        "auto_publish": profile.auto_publish,
        "auto_connect": profile.auto_connect,
        "auto_follow_up": profile.auto_follow_up,
        "last_synced_at": profile.last_synced_at.isoformat() if profile.last_synced_at else None,
        "openoutreach_campaign_id": profile.openoutreach_campaign_id,
    }


def get_qwen_config(profile: CreatorProfile) -> QwenConfig:
    """Resolve the configured OpenAI-compatible LLM credentials."""
    api_key = os.environ.get("LLM_API_KEY") or os.environ.get("QWEN_API_KEY") or profile.qwen_api_key or ""
    base_url = os.environ.get("LLM_API_BASE") or os.environ.get("QWEN_API_BASE") or profile.qwen_api_base or DEFAULT_QWEN_BASE
    model = os.environ.get("LLM_API_MODEL") or os.environ.get("QWEN_API_MODEL") or profile.qwen_model or DEFAULT_QWEN_MODEL
    if not api_key:
        raise ValueError("LLM API key is not configured.")
    return QwenConfig(api_key=api_key, base_url=base_url.rstrip("/"), model=model)


def get_facebook_oauth_config() -> FacebookOAuthConfig:
    """Resolve the Meta application credentials required for Facebook Login."""
    app_id = (os.environ.get("META_APP_ID") or os.environ.get("FACEBOOK_APP_ID") or "").strip()
    app_secret = (os.environ.get("META_APP_SECRET") or os.environ.get("FACEBOOK_APP_SECRET") or "").strip()
    base_url = (
        os.environ.get("META_GRAPH_API_BASE")
        or "https://graph.facebook.com/v23.0"
    ).strip().rstrip("/")
    if not app_id or not app_secret:
        raise ValueError(
            "Facebook Login is not configured. Add META_APP_ID and META_APP_SECRET in the backend .env."
        )
    return FacebookOAuthConfig(app_id=app_id, app_secret=app_secret, base_url=base_url)


def get_facebook_config(profile: CreatorProfile | None = None) -> FacebookConfig:
    """Resolve the Meta Graph API credentials required for Facebook Page publishing."""
    access_token = (
        (profile.facebook_page_access_token if profile else "")
        or os.environ.get("FACEBOOK_PAGE_ACCESS_TOKEN")
        or os.environ.get("META_PAGE_ACCESS_TOKEN")
        or ""
    ).strip()
    page_id = (
        (profile.facebook_page_id if profile else "")
        or os.environ.get("FACEBOOK_PAGE_ID")
        or os.environ.get("META_PAGE_ID")
        or ""
    ).strip()
    base_url = (
        os.environ.get("META_GRAPH_API_BASE")
        or "https://graph.facebook.com/v23.0"
    ).strip().rstrip("/")
    if not access_token or not page_id:
        raise ValueError("Facebook account not connected. Cliquez sur Facebook pour vous connecter puis republiez.")
    return FacebookConfig(access_token=access_token, page_id=page_id, base_url=base_url)


def get_marketing_frontend_url() -> str:
    """Return the frontend base URL used after third-party OAuth callbacks."""
    return (os.environ.get("MARKETING_FRONTEND_URL") or "http://localhost:5173").strip().rstrip("/")


def build_facebook_login_url(*, redirect_uri: str, state: str) -> str:
    """Build the official Meta Login URL for Page publishing permissions."""
    cfg = get_facebook_oauth_config()
    query = urlencode({
        "client_id": cfg.app_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": "pages_show_list,pages_manage_posts,pages_read_engagement",
        "response_type": "code",
    })
    return f"https://www.facebook.com/v23.0/dialog/oauth?{query}"


def _meta_json_request(url: str, *, params: dict[str, str]) -> dict:
    """Perform a simple GET request against Meta and decode JSON."""
    final_url = f"{url}?{urlencode(params)}"
    req = request.Request(
        url=final_url,
        headers={"User-Agent": "marketing-app/1.0"},
        method="GET",
    )
    try:
        with request.urlopen(req, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"Facebook API error ({exc.code}): {detail}") from exc
    except error.URLError as exc:
        raise ValueError(f"Facebook API unreachable: {exc.reason}") from exc


def connect_facebook_page(profile: CreatorProfile, *, code: str, redirect_uri: str) -> dict:
    """Exchange a Meta OAuth code for a Page token and persist it on the workspace profile."""
    cfg = get_facebook_oauth_config()
    token_payload = _meta_json_request(
        f"{cfg.base_url}/oauth/access_token",
        params={
            "client_id": cfg.app_id,
            "client_secret": cfg.app_secret,
            "redirect_uri": redirect_uri,
            "code": code,
        },
    )
    user_access_token = str(token_payload.get("access_token") or "").strip()
    if not user_access_token:
        raise ValueError("Facebook Login did not return a valid access token.")

    accounts_payload = _meta_json_request(
        f"{cfg.base_url}/me/accounts",
        params={
            "access_token": user_access_token,
            "fields": "id,name,access_token",
        },
    )
    pages = accounts_payload.get("data") or []
    if not pages:
        raise ValueError("Aucune page Facebook disponible sur ce compte. Connectez une page puis recommencez.")

    page = pages[0]
    profile.facebook_page_id = str(page.get("id") or "").strip()
    profile.facebook_page_name = sanitize_text(page.get("name"), max_length=200)
    profile.facebook_page_access_token = str(page.get("access_token") or "").strip()
    if not profile.facebook_page_id or not profile.facebook_page_access_token:
        raise ValueError("Facebook Login n'a pas retourne de token de page exploitable.")
    profile.save(update_fields=["facebook_page_id", "facebook_page_name", "facebook_page_access_token", "updated_at"])
    return {
        "page_id": profile.facebook_page_id,
        "page_name": profile.facebook_page_name,
    }


def _post_generation_prompt(profile: CreatorProfile, subject: str, source_content: str, tone_override: str) -> str:
    """Build the generation prompt sent to the configured LLM."""
    tone = tone_override or profile.preferred_tone
    subject_line = subject or "Propose un sujet pertinent pour LinkedIn à partir du profil et de l'ICP."
    return f"""
Tu écris pour LinkedIn en français pour un solo-entrepreneur B2B.

Profil créateur:
- Nom: {profile.display_name}
- Titre: {profile.professional_title}
- Description: {profile.personal_description}
- Entreprise: {profile.company_name}
- Secteur: {profile.company_sector}
- Description entreprise: {profile.company_description}
- Produit/service: {profile.product_name}
- Description produit: {profile.product_description}
- Bénéfices: {profile.product_benefits}
- Prix: {profile.product_price}

ICP:
- Poste visé: {profile.icp_job_title}
- Secteur: {profile.icp_sector}
- Taille entreprise: {profile.icp_company_size}
- Pays: {profile.icp_country}

Style:
- Ton: {tone}
- Objectif principal: {profile.primary_goal}

Entrée utilisateur:
- Sujet demandé: {subject_line}
- Source éventuelle: {source_content or "Aucune source fournie"}

Consignes:
- Produit un hook fort.
- Puis 3 à 5 paragraphes courts.
- Termine par un CTA clair.
- N'insère aucun hashtag dans le corps du post.
- Le post doit rester naturel, crédible, concret, sans hype creuse.
- Retourne uniquement du JSON valide.

Format JSON attendu:
{{
  "topic": "sujet retenu",
  "post_body": "texte complet du post",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "readability_score": 0
}}
""".strip()


def _extract_json_object(raw_text: str) -> dict:
    """Parse a JSON object from an LLM response that may include code fences."""
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("LLM response did not contain valid JSON.")
    return json.loads(text[start:end + 1])


def generate_post_content(profile: CreatorProfile, *, subject: str = "", source_content: str = "", tone_override: str = "") -> dict:
    """Call the configured OpenAI-compatible LLM and normalize the generated LinkedIn post payload."""
    cfg = get_qwen_config(profile)
    prompt = _post_generation_prompt(profile, subject, source_content, tone_override)
    payload = {
        "model": cfg.model,
        "messages": [
            {"role": "system", "content": "Tu es un ghostwriter LinkedIn B2B précis et utile."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.9,
    }
    req = request.Request(
        url=f"{cfg.base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {cfg.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "marketing-app/1.0",
            "HTTP-Referer": "http://localhost",
            "X-Title": "marketing-app",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=90) as response:
            body = response.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"LLM API error ({exc.code}): {detail}") from exc
    except error.URLError as exc:
        raise ValueError(f"LLM API unreachable: {exc.reason}") from exc

    raw = json.loads(body)
    content = raw["choices"][0]["message"]["content"]
    parsed = _extract_json_object(content)

    post_body = sanitize_text(parsed.get("post_body"))
    hashtags = [tag if tag.startswith("#") else f"#{tag}" for tag in parsed.get("hashtags", [])][:12]
    words = [part for part in post_body.split() if part]
    return {
        "topic": sanitize_text(parsed.get("topic"), max_length=300) or subject,
        "body": post_body,
        "hashtags": hashtags,
        "selected_hashtags": hashtags[:8],
        "readability_score": int(parsed.get("readability_score") or _estimate_readability(post_body)),
        "word_count": len(words),
        "char_count": len(post_body),
    }


def _estimate_readability(text: str) -> int:
    """Return a simple heuristic readability score from 0 to 100."""
    if not text.strip():
        return 0
    sentences = max(text.count("." ) + text.count("!") + text.count("?"), 1)
    words = max(len([part for part in text.split() if part]), 1)
    average_sentence_length = words / sentences
    penalty = max(int((average_sentence_length - 18) * 2), 0)
    return max(35, min(92, 88 - penalty))


def _serialize_post(post: LinkedInPost) -> dict:
    """Serialize a LinkedIn post for the frontend."""
    return {
        "id": post.id,
        "subject": post.subject,
        "source_content": post.source_content,
        "topic": post.suggested_topic,
        "body": post.body,
        "hashtags": post.hashtags,
        "selected_hashtags": post.selected_hashtags,
        "status": post.status,
        "readability_score": post.readability_score,
        "word_count": post.word_count,
        "char_count": post.char_count,
        "linkedin_post_id": post.linkedin_post_id,
        "published_at": post.published_at.isoformat() if post.published_at else None,
    }


def _run_generation_job(job_id: int) -> None:
    """Execute a generation job in a background thread."""
    close_old_connections()
    job = PostGenerationJob.objects.select_related("profile").get(pk=job_id)
    job.status = PostGenerationJob.Status.RUNNING
    job.error_message = ""
    job.save(update_fields=["status", "error_message", "updated_at"])
    try:
        result = generate_post_content(
            job.profile,
            subject=job.subject,
            source_content=job.source_content,
            tone_override=job.tone_override,
        )
        with transaction.atomic():
            post = LinkedInPost.objects.create(
                profile=job.profile,
                subject=job.subject,
                source_content=job.source_content,
                suggested_topic=result["topic"],
                body=result["body"],
                hashtags=result["hashtags"],
                selected_hashtags=result["selected_hashtags"],
                readability_score=result["readability_score"],
                word_count=result["word_count"],
                char_count=result["char_count"],
            )
            job.post = post
            job.result_payload = result
            job.status = PostGenerationJob.Status.COMPLETED
            job.completed_at = timezone.now()
            job.save(update_fields=["post", "result_payload", "status", "completed_at", "updated_at"])
    except Exception as exc:
        logger.exception("Post generation job %s failed", job_id)
        job.status = PostGenerationJob.Status.FAILED
        job.error_message = str(exc)
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "error_message", "completed_at", "updated_at"])
    finally:
        close_old_connections()


def enqueue_generation_job(profile: CreatorProfile, *, subject: str = "", source_content: str = "", tone_override: str = "") -> PostGenerationJob:
    """Create and asynchronously start a post generation job."""
    job = PostGenerationJob.objects.create(
        profile=profile,
        subject=sanitize_text(subject, max_length=300),
        source_content=sanitize_text(source_content),
        tone_override=sanitize_text(tone_override, max_length=40),
    )
    if os.environ.get("MARKETING_RUN_JOBS_INLINE") == "1":
        _run_generation_job(job.pk)
    else:
        thread = threading.Thread(target=_run_generation_job, args=(job.pk,), daemon=True)
        thread.start()
    return job


def serialize_generation_job(job: PostGenerationJob) -> dict:
    """Serialize a generation job and its generated post when available."""
    payload = {
        "id": job.id,
        "status": job.status,
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat(),
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }
    if job.post_id:
        payload["post"] = _serialize_post(job.post)
    elif job.result_payload:
        payload["result"] = job.result_payload
    return payload


_LINKEDIN_FEED_URL = "https://www.linkedin.com/feed/"
_LINKEDIN_COMPOSER_URL = "https://www.linkedin.com/post/new/"
_POST_TRIGGER_SELECTORS = [
    'button[aria-label*="Start a post"]:visible',
    'button[aria-label*="Create a post"]:visible',
    'button:has-text("Start a post"):visible',
    'button:has-text("Create a post"):visible',
    'button:has-text("Commencer un post"):visible',
    'button:has-text("Créer un post"):visible',
    'button:has-text("Demarrer un post"):visible',
    'button:has-text("Start post"):visible',
    'button[aria-label*="writing with AI" i]:visible',
    'div[role="button"]:has-text("Start a post"):visible',
    'div[role="button"]:has-text("Créer un post"):visible',
    'div[role="button"]:has-text("Commencer un post"):visible',
    'div[role="button"]:has-text("Partager une publication"):visible',
    'div[role="button"]:has-text("Partager un post"):visible',
]
_POST_EDITOR_SELECTORS = [
    'div[role="dialog"] div[contenteditable="true"]:visible',
    'div[role="dialog"] div.ql-editor[contenteditable="true"]:visible',
    'div[role="dialog"] div[role="textbox"][contenteditable="true"]:visible',
    'div[role="dialog"] [data-placeholder][contenteditable="true"]:visible',
    'div[aria-label*="Text editor"] div[contenteditable="true"]:visible',
    'div[aria-label*="éditeur"] div[contenteditable="true"]:visible',
    'div[contenteditable="true"][role="textbox"]:visible',
    'div[data-placeholder][contenteditable="true"]:visible',
]
_POST_SUBMIT_SELECTORS = [
    'div[role="dialog"] button:has-text("Post"):visible',
    'div[role="dialog"] button:has-text("Publier"):visible',
    'div[role="dialog"] button[aria-label="Post"]:visible',
    'div[role="dialog"] button[aria-label="Publier"]:visible',
    'button:has-text("Post"):visible',
    'button:has-text("Publier"):visible',
]
_POST_IMAGE_TRIGGER_SELECTORS = [
    'div[role="dialog"] button[aria-label*="Add media" i]:visible',
    'div[role="dialog"] button[aria-label*="Add a photo" i]:visible',
    'div[role="dialog"] button[aria-label*="Photo" i]:visible',
    'div[role="dialog"] button[aria-label*="Media" i]:visible',
    'div[role="dialog"] button[aria-label*="Ajouter un media" i]:visible',
    'div[role="dialog"] button[aria-label*="Ajouter une photo" i]:visible',
]
_POST_FILE_INPUT_SELECTORS = [
    'input[type="file"]:visible',
    'div[role="dialog"] input[type="file"]',
]
_POST_SUCCESS_SELECTORS = [
    'div[role="dialog"]:not(:visible)',
    'button[aria-label*="Start a post"]:visible',
    'button:has-text("Start a post"):visible',
    'button:has-text("Commencer un post"):visible',
    'text="Copy link to post"',
    'text="Embed this post"',
    'text="Copier le lien du post"',
    'text="Intégrer ce post"',
]


def _find_first_visible(page, selectors: list[str]):
    """Return the first matching visible locator from a selector chain."""
    for selector in selectors:
        locator = page.locator(selector)
        if locator.count() > 0:
            return locator.first
    return None


def _capture_publish_diagnostics(page, profile: CreatorProfile, prefix: str) -> None:
    """Persist a best-effort HTML snapshot for publish failures."""
    if not page or page.is_closed():
        return
    diagnostics_dir = Path(__file__).resolve().parent.parent / "tmp" / "linkedin-publish-diagnostics"
    diagnostics_dir.mkdir(parents=True, exist_ok=True)
    diagnostics_path = diagnostics_dir / f"{prefix}-{profile.user_id}-{int(timezone.now().timestamp())}.html"
    diagnostics_path.write_text(page.content(), encoding="utf-8")


def _wait_for_first_visible(page, selectors: list[str], timeout_ms: int = 15000):
    """Wait until one selector is visible and return its locator."""
    deadline = timezone.now().timestamp() + (timeout_ms / 1000)
    last_error: Exception | None = None
    while timezone.now().timestamp() < deadline:
        if page.is_closed():
            raise ValueError("LinkedIn browser page closed unexpectedly during publish.")
        locator = _find_first_visible(page, selectors)
        if locator is not None:
            try:
                locator.wait_for(state="visible", timeout=750)
                return locator
            except PlaywrightError as exc:
                last_error = exc
        try:
            page.wait_for_timeout(250)
        except PlaywrightError as exc:
            raise ValueError("LinkedIn browser page closed unexpectedly during publish.") from exc
    if last_error:
        raise last_error
    return None


def _fill_linkedin_editor(page, editor, outbound_text: str) -> None:
    """Fill LinkedIn's contenteditable composer reliably."""
    editor.click()
    try:
        editor.fill("")
    except Exception:
        pass

    try:
        editor.evaluate(
            """(node, value) => {
                node.focus();
                if ("innerHTML" in node) node.innerHTML = "";
                if ("textContent" in node) node.textContent = "";
                const eventOptions = { bubbles: true };
                node.dispatchEvent(new InputEvent("beforeinput", eventOptions));
                if ("innerText" in node) node.innerText = value;
                else node.textContent = value;
                node.dispatchEvent(new InputEvent("input", eventOptions));
                node.dispatchEvent(new Event("change", eventOptions));
            }""",
            outbound_text,
        )
    except Exception:
        page.keyboard.press("Control+A")
        page.keyboard.press("Backspace")
        page.keyboard.insert_text(outbound_text)


def _download_image_to_tempfile(image_url: str) -> str:
    """Download a remote image locally so Playwright can upload it."""
    parsed_suffix = Path(image_url.split("?")[0]).suffix.lower()
    suffix = parsed_suffix if parsed_suffix in {".png", ".jpg", ".jpeg", ".webp"} else ".png"
    with request.urlopen(image_url, timeout=60) as response:
        data = response.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        return tmp.name


def _data_url_to_tempfile(image_data_url: str) -> str:
    """Persist a data URL image payload to a local temp file."""
    if not image_data_url.startswith("data:"):
        raise ValueError("Invalid inline image payload.")
    header, encoded = image_data_url.split(",", 1)
    mime = header.split(";")[0].replace("data:", "").lower()
    suffix = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
    }.get(mime, ".png")
    data = base64.b64decode(encoded)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        return tmp.name


def _encode_multipart_formdata(
    *,
    fields: dict[str, str],
    file_field: str,
    filename: str,
    file_bytes: bytes,
    content_type: str,
) -> tuple[bytes, str]:
    """Build a multipart/form-data payload for Meta media uploads."""
    boundary = f"----marketing-app-{uuid.uuid4().hex}"
    body = bytearray()
    for key, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
        body.extend(str(value).encode("utf-8"))
        body.extend(b"\r\n")
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(
        (
            f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode("utf-8")
    )
    body.extend(file_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    return bytes(body), f"multipart/form-data; boundary={boundary}"


def _facebook_graph_request(
    path: str,
    *,
    fields: dict[str, str],
    file_path: str | None = None,
    access_token_override: str = "",
) -> dict:
    """Call the Meta Graph API for Facebook Page publishing."""
    base_url = (os.environ.get("META_GRAPH_API_BASE") or "https://graph.facebook.com/v23.0").strip().rstrip("/")
    if access_token_override:
        fields = {
            **fields,
            "access_token": access_token_override,
        }
    url = f"{base_url}/{path.lstrip('/')}"
    if file_path:
        mime_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        with open(file_path, "rb") as uploaded_file:
            payload, content_type = _encode_multipart_formdata(
                fields=fields,
                file_field="source",
                filename=Path(file_path).name,
                file_bytes=uploaded_file.read(),
                content_type=mime_type,
            )
        headers = {
            "Content-Type": content_type,
            "User-Agent": "marketing-app/1.0",
        }
        req = request.Request(url=url, data=payload, headers=headers, method="POST")
    else:
        payload = urlencode(fields).encode("utf-8")
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "marketing-app/1.0",
        }
        req = request.Request(url=url, data=payload, headers=headers, method="POST")
    try:
        with request.urlopen(req, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"Facebook API error ({exc.code}): {detail}") from exc
    except error.URLError as exc:
        raise ValueError(f"Facebook API unreachable: {exc.reason}") from exc


def _publish_post_via_facebook(profile: CreatorProfile, outbound_text: str, *, image_url: str = "", image_data_url: str = "") -> str:
    """Publish directly to a Facebook Page via the Meta Graph API."""
    cfg = get_facebook_config(profile)
    fields = {
        "access_token": cfg.access_token,
        "message": outbound_text,
    }
    upload_path: str | None = None
    try:
        if image_data_url:
            upload_path = _data_url_to_tempfile(image_data_url)
        elif image_url:
            upload_path = _download_image_to_tempfile(image_url)

        if upload_path:
            fields["published"] = "true"
            response = _facebook_graph_request(
                f"{cfg.page_id}/photos",
                fields=fields,
                file_path=upload_path,
            )
        else:
            response = _facebook_graph_request(
                f"{cfg.page_id}/feed",
                fields=fields,
            )
        post_id = str(response.get("post_id") or response.get("id") or "").strip()
        if not post_id:
            raise ValueError("Facebook API did not return a post id.")
        return post_id
    finally:
        if upload_path:
            try:
                os.unlink(upload_path)
            except OSError:
                pass


def _attach_image_to_linkedin_post(page, image_url: str = "", image_data_url: str = "") -> str | None:
    """Attach an image to the current LinkedIn composer when possible."""
    if image_data_url:
        local_path = _data_url_to_tempfile(image_data_url)
    elif image_url:
        local_path = _download_image_to_tempfile(image_url)
    else:
        raise ValueError("No image payload provided for LinkedIn upload.")
    try:
        file_input = _wait_for_first_visible(page, _POST_FILE_INPUT_SELECTORS, timeout_ms=3000)
        if file_input is None:
            image_trigger = _wait_for_first_visible(page, _POST_IMAGE_TRIGGER_SELECTORS, timeout_ms=5000)
            if image_trigger is None:
                raise ValueError("LinkedIn image upload control not found.")
            image_trigger.click()
            file_input = _wait_for_first_visible(page, _POST_FILE_INPUT_SELECTORS, timeout_ms=5000)
        if file_input is None:
            raise ValueError("LinkedIn file input not found after opening media picker.")

        file_input.set_input_files(local_path)
        page.wait_for_timeout(3000)
        return local_path
    except Exception:
        try:
            os.unlink(local_path)
        except OSError:
            pass
        raise


def _load_publish_page(session, profile: CreatorProfile):
    """Open the LinkedIn feed and wait for the post trigger to appear."""
    page = session.page
    if not page or page.is_closed():
        raise ValueError("LinkedIn browser page is unavailable. Log in again and retry.")

    page.goto(_LINKEDIN_FEED_URL, wait_until="domcontentloaded")
    page.wait_for_load_state("domcontentloaded")
    session.wait()
    if page.is_closed():
        raise ValueError("LinkedIn browser page closed before the feed loaded.")

    current_url = page.url.lower()
    if "/login" in current_url or "/checkpoint/" in current_url or "/challenge/" in current_url:
        raise ValueError("LinkedIn requires a fresh login or verification before publishing.")

    trigger = _wait_for_first_visible(page, _POST_TRIGGER_SELECTORS)
    if trigger is None:
        _capture_publish_diagnostics(page, profile, "feed")
        raise ValueError("LinkedIn publish UI unavailable: start-post button not found.")
    return page, trigger


def _load_direct_composer(session, profile: CreatorProfile):
    """Open LinkedIn's dedicated post composer page and wait for the editor."""
    page = session.page
    if not page or page.is_closed():
        raise ValueError("LinkedIn browser page is unavailable. Log in again and retry.")

    page.goto(_LINKEDIN_COMPOSER_URL, wait_until="domcontentloaded")
    page.wait_for_load_state("domcontentloaded")
    session.wait()
    if page.is_closed():
        raise ValueError("LinkedIn browser page closed before the composer loaded.")

    current_url = page.url.lower()
    if "/login" in current_url or "/checkpoint/" in current_url or "/challenge/" in current_url:
        raise ValueError("LinkedIn requires a fresh login or verification before publishing.")

    editor = _wait_for_first_visible(page, _POST_EDITOR_SELECTORS, timeout_ms=20000)
    if editor is None:
        _capture_publish_diagnostics(page, profile, "composer")
        raise ValueError("LinkedIn publish UI unavailable: direct composer editor not found.")
    return page, editor


def _publish_confirmed(page) -> bool:
    """Return True when the UI shows a credible post-published signal."""
    if page.is_closed():
        return False

    current_url = page.url.lower()
    if "targeturn=urn%3ali%3ashare" in current_url or "updateurn=urn%3ali%3Aactivity".lower() in current_url:
        return True
    if "/post/new/" not in current_url and "/feed/" in current_url:
        for selector in _POST_SUCCESS_SELECTORS:
            try:
                locator = page.locator(selector).first
                if locator.count() > 0 and locator.is_visible():
                    return True
            except PlaywrightError:
                continue

    html = page.content()
    success_markers = (
        "Copy link to post",
        "Embed this post",
        "Copier le lien du post",
        "Intégrer ce post",
        "targetUrn=urn%3Ali%3Ashare",
        "urn:li:share:",
    )
    return any(marker in html for marker in success_markers)


def _publish_post_via_linkedin(
    profile: CreatorProfile,
    outbound_text: str,
    image_url: str = "",
    image_data_url: str = "",
) -> str:
    """Publish a post through the existing Playwright LinkedIn session."""
    linkedin_profile = _ensure_publish_profile_credentials(profile)

    from linkedin.browser.session import AccountSession

    session = AccountSession(linkedin_profile)
    try:
        last_error: Exception | None = None
        uploaded_temp_path: str | None = None
        for attempt in range(2):
            try:
                if attempt == 0:
                    session.ensure_browser()
                else:
                    session.reauthenticate()
                try:
                    page, trigger = _load_publish_page(session, profile)
                    trigger.click()
                    editor = _wait_for_first_visible(page, _POST_EDITOR_SELECTORS, timeout_ms=8000)
                    if editor is None:
                        raise ValueError("LinkedIn feed composer did not open.")
                except Exception:
                    page, editor = _load_direct_composer(session, profile)

                _fill_linkedin_editor(page, editor, outbound_text)
                if image_url or image_data_url:
                    uploaded_temp_path = _attach_image_to_linkedin_post(page, image_url=image_url, image_data_url=image_data_url)

                submit = _wait_for_first_visible(page, _POST_SUBMIT_SELECTORS)
                if submit is None:
                    _capture_publish_diagnostics(page, profile, "submit")
                    raise ValueError("LinkedIn publish UI unavailable: publish button not found.")
                submit.click()

                published = False
                deadline = timezone.now().timestamp() + 20
                while timezone.now().timestamp() < deadline:
                    if page.is_closed():
                        break
                    if _publish_confirmed(page):
                        published = True
                        break
                    try:
                        page.wait_for_timeout(500)
                    except PlaywrightError:
                        break
                if not published:
                    _capture_publish_diagnostics(page, profile, "confirm")
                    raise ValueError("LinkedIn publish could not be confirmed after clicking publish.")

                return f"linkedin-live-{int(timezone.now().timestamp())}"
            except (PlaywrightError, PlaywrightTimeoutError, RuntimeError, ValueError) as exc:
                last_error = exc
                if attempt == 0:
                    continue
                break
        raise ValueError(str(last_error) if last_error else "LinkedIn publish failed.")
    finally:
        try:
            if uploaded_temp_path and os.path.exists(uploaded_temp_path):
                os.unlink(uploaded_temp_path)
        except OSError:
            pass
        session.close()


def publish_post(
    post: LinkedInPost,
    *,
    body: str | None = None,
    selected_hashtags: list[str] | None = None,
    image_url: str = "",
    image_data_url: str = "",
    platform: str = "linkedin",
) -> LinkedInPost:
    """Publish a post to the selected social platform and persist the resulting state locally."""
    post.body = sanitize_text(body or post.body)
    post.selected_hashtags = selected_hashtags or post.selected_hashtags or post.hashtags
    outbound_text = post.body.strip()
    if post.selected_hashtags:
        outbound_text = f"{outbound_text}\n\n{' '.join(post.selected_hashtags)}"

    normalized_platform = (platform or "linkedin").strip().lower()
    if normalized_platform == "facebook":
        post.linkedin_post_id = f"facebook:{_publish_post_via_facebook(post.profile, outbound_text, image_url=image_url, image_data_url=image_data_url)}"
    else:
        linkedin_post_id = os.environ.get("LINKEDIN_PUBLISH_MODE", "").strip()
        if linkedin_post_id == "mock":
            post.linkedin_post_id = f"mock-{post.pk}-{int(timezone.now().timestamp())}"
        else:
            post.linkedin_post_id = _publish_post_via_linkedin(
                post.profile,
                outbound_text,
                image_url=image_url,
                image_data_url=image_data_url,
            )

    post.status = LinkedInPost.Status.PUBLISHED
    post.published_at = timezone.now()
    post.word_count = len([part for part in post.body.split() if part])
    post.char_count = len(post.body)
    post.save(
        update_fields=[
            "body",
            "selected_hashtags",
            "linkedin_post_id",
            "status",
            "published_at",
            "word_count",
            "char_count",
            "updated_at",
        ]
    )
    return post


def _build_campaign_objective(profile: CreatorProfile) -> str:
    """Compose a campaign objective from the SaaS onboarding data."""
    return (
        f"Target {profile.icp_job_title or 'decision-makers'} in {profile.icp_sector or 'B2B companies'} "
        f"with company size {profile.icp_company_size or 'not specified'} in {profile.icp_country or 'the target market'}. "
        f"Primary goal: {profile.primary_goal}. Tone: {profile.preferred_tone}. "
        f"Founder context: {profile.personal_description}"
    ).strip()


def _build_product_docs(profile: CreatorProfile) -> str:
    """Compose offer context reused by OpenOutreach qualification and follow-up."""
    return (
        f"Company: {profile.company_name}\n"
        f"Sector: {profile.company_sector}\n"
        f"Company description: {profile.company_description}\n"
        f"Product/service: {profile.product_name}\n"
        f"Offer description: {profile.product_description}\n"
        f"Benefits: {profile.product_benefits}\n"
        f"Price: {profile.product_price}\n"
        f"Founder title: {profile.professional_title}\n"
        f"Lead source rule: when a lead comes from a post engagement, personalize follow-up using the source post topic and comment text when available."
    ).strip()


def _write_sync_files(profile: CreatorProfile, campaign: Campaign) -> dict:
    """Write file-based mirrors for the embedded OpenOutreach workspace."""
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    user_slug = slugify(profile.display_name) or f"user-{profile.user_id}"
    user_campaign_dir = CAMPAIGN_DIR / user_slug
    user_campaign_dir.mkdir(parents=True, exist_ok=True)

    objective_path = user_campaign_dir / "campaign_objective.txt"
    docs_path = user_campaign_dir / "product_docs.txt"
    account_path = ASSETS_DIR / f"accounts.{user_slug}.secrets.yaml"

    objective_path.write_text(campaign.campaign_objective, encoding="utf-8")
    docs_path.write_text(campaign.product_docs, encoding="utf-8")
    account_path.write_text(
        "\n".join(
            [
                f"username: {profile.linkedin_email}",
                f"password: {profile.linkedin_password}",
                f"campaign_name: {campaign.name}",
            ]
        ),
        encoding="utf-8",
    )
    return {
        "campaign_objective_path": str(objective_path),
        "product_docs_path": str(docs_path),
        "account_secrets_path": str(account_path),
    }


def _build_unique_workspace_username(profile: CreatorProfile) -> str:
    """Return a stable, unique Django username for the synced workspace user."""
    base = slugify(profile.linkedin_email.split("@")[0]) if profile.linkedin_email else ""
    base = base or slugify(profile.display_name) or f"user-{profile.user_id}"
    user = profile.user

    if user.username == base:
        return base

    if not User.objects.exclude(pk=user.pk).filter(username=base).exists():
        return base

    suffix = profile.user_id
    candidate = f"{base}-{suffix}"
    if user.username == candidate:
        return candidate

    if not User.objects.exclude(pk=user.pk).filter(username=candidate).exists():
        return candidate

    index = 2
    while True:
        candidate = f"{base}-{suffix}-{index}"
        if user.username == candidate:
            return candidate
        if not User.objects.exclude(pk=user.pk).filter(username=candidate).exists():
            return candidate
        index += 1


def _upsert_openoutreach_account(profile: CreatorProfile, campaign: Campaign) -> LinkedInProfile:
    """Create or update the LinkedInProfile used by OpenOutreach."""
    user = profile.user
    handle = _build_unique_workspace_username(profile)
    if handle and user.username != handle:
        user.username = handle
    user.is_staff = True
    user.is_active = True
    user.save(update_fields=["username", "is_staff", "is_active"])
    campaign.users.add(user)

    linkedin_profile, _ = LinkedInProfile.objects.get_or_create(
        user=user,
        defaults={
            "linkedin_username": profile.linkedin_email,
            "linkedin_password": profile.linkedin_password,
        },
    )
    if profile.linkedin_email:
        linkedin_profile.linkedin_username = profile.linkedin_email
    if profile.linkedin_password:
        linkedin_profile.linkedin_password = profile.linkedin_password
    linkedin_profile.active = True
    linkedin_profile.legal_accepted = True
    linkedin_profile.save()
    return linkedin_profile


def _sync_site_config(profile: CreatorProfile) -> None:
    """Push the workspace LLM configuration into OpenOutreach."""
    cfg = get_qwen_config(profile)
    site = SiteConfig.load()
    site.llm_api_key = cfg.api_key
    site.ai_model = cfg.model
    site.llm_api_base = cfg.base_url
    site.save()


def _restart_openoutreach_daemon_if_configured() -> bool:
    """Restart OpenOutreach only when an explicit command is configured."""
    raw = os.environ.get("OPENOUTREACH_DAEMON_RESTART_CMD", "").strip()
    if not raw:
        return False
    try:
        subprocess.Popen(raw.split(), cwd=Path(__file__).resolve().parent.parent)
        return True
    except OSError:
        logger.exception("Failed to restart OpenOutreach daemon")
        return False


def sync_user_to_openoutreach(user_id: int) -> dict:
    """Mirror a SaaS workspace profile into OpenOutreach's native models."""
    profile = get_or_create_creator_profile(user_id)
    if not profile.linkedin_email or not profile.linkedin_password:
        raise ValueError("LinkedIn credentials are required before syncing to OpenOutreach.")

    campaign_name = f"{profile.display_name or profile.user.username} Outreach".strip()
    campaign, _ = Campaign.objects.get_or_create(name=campaign_name)
    campaign.product_docs = _build_product_docs(profile)
    campaign.campaign_objective = _build_campaign_objective(profile)
    campaign.booking_link = ""
    campaign.save()

    linkedin_profile = _upsert_openoutreach_account(profile, campaign)
    _sync_site_config(profile)
    file_payload = _write_sync_files(profile, campaign)

    profile.openoutreach_campaign = campaign
    profile.openoutreach_profile = linkedin_profile
    profile.last_synced_at = timezone.now()
    profile.save(update_fields=["openoutreach_campaign", "openoutreach_profile", "last_synced_at", "updated_at"])

    if profile.auto_connect:
        enqueue_connect(campaign.pk, delay_seconds=1)

    return {
        "campaign_id": campaign.pk,
        "campaign_name": campaign.name,
        "restarted": _restart_openoutreach_daemon_if_configured(),
        **file_payload,
    }


def ingest_post_engagement_lead(
    profile: CreatorProfile,
    *,
    linkedin_url: str,
    first_name: str = "",
    last_name: str = "",
    comment_text: str = "",
    source_post: LinkedInPost | None = None,
) -> Lead:
    """Insert an engagement-derived lead into OpenOutreach and seed the pipeline."""
    if not profile.openoutreach_campaign_id:
        raise ValueError("Sync the workspace to OpenOutreach before ingesting engagement leads.")

    public_identifier = linkedin_url.rstrip("/").split("/")[-1]
    lead, _ = Lead.objects.get_or_create(
        linkedin_url=linkedin_url,
        defaults={
            "public_identifier": public_identifier,
            "first_name": sanitize_text(first_name, max_length=100),
            "last_name": sanitize_text(last_name, max_length=100),
            "company_name": "",
            "profile_data": {
                "engagement_comment": sanitize_text(comment_text),
                "source_post_topic": source_post.suggested_topic if source_post else "",
            },
        },
    )
    if not lead.profile_data:
        lead.profile_data = {}
    lead.profile_data["engagement_comment"] = sanitize_text(comment_text)
    if source_post:
        lead.profile_data["source_post_topic"] = source_post.suggested_topic
    lead.save(update_fields=["profile_data"])

    deal, _ = Deal.objects.get_or_create(
        lead=lead,
        campaign=profile.openoutreach_campaign,
        defaults={"state": ProfileState.QUALIFIED.value},
    )
    if deal.state == ProfileState.FAILED.value:
        deal.state = ProfileState.QUALIFIED.value
        deal.closing_reason = ""
        deal.reason = ""
        deal.save(update_fields=["state", "closing_reason", "reason", "update_date"])

    LeadContext.objects.update_or_create(
        lead=lead,
        defaults={
            "profile": profile,
            "source_post": source_post,
            "source": "post_engagement",
            "comment_text": sanitize_text(comment_text),
        },
    )
    enqueue_connect(profile.openoutreach_campaign_id, delay_seconds=1)
    return lead


def get_dashboard_snapshot(profile: CreatorProfile) -> dict:
    """Return aggregated dashboard data for the frontend."""
    campaign = profile.openoutreach_campaign
    posts = profile.posts.order_by("-created_at")
    leads_qs = Deal.objects.select_related("lead").filter(campaign=campaign) if campaign else Deal.objects.none()
    total_posts = posts.count()
    total_engagement_leads = LeadContext.objects.filter(profile=profile).count()
    connected = leads_qs.filter(state=ProfileState.CONNECTED.value).count()
    pending = leads_qs.filter(state=ProfileState.PENDING.value).count()
    completed = leads_qs.filter(state=ProfileState.COMPLETED.value).count()
    recent_leads = []
    for deal in leads_qs.exclude(lead__isnull=True).order_by("-update_date")[:5]:
        recent_leads.append(
            {
                "name": deal.lead.full_name,
                "title": (deal.lead.profile_data or {}).get("headline", ""),
                "status": deal.state,
            }
        )

    weekly = []
    today = timezone.localdate()
    post_dates = [post.created_at.date() for post in posts[:200]]
    engagement_dates = [
        item.created_at.date()
        for item in LeadContext.objects.filter(profile=profile).order_by("-created_at")[:200]
    ]
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        weekly.append(
            {
                "day": day.strftime("%a")[:3],
                "leads": sum(1 for value in engagement_dates if value == day),
                "engagement": sum(1 for value in post_dates if value == day),
            }
        )

    return {
        "stats": [
            {"title": "Leads générés", "value": total_engagement_leads},
            {"title": "Taux de connexion", "value": _percentage(connected, pending or connected)},
            {"title": "Posts publiés", "value": total_posts},
            {"title": "Messages terminés", "value": completed},
        ],
        "recent_leads": recent_leads,
        "weekly": weekly,
    }


def get_pipeline_snapshot(profile: CreatorProfile) -> dict:
    """Return pipeline metrics, recent leads, and messages for the frontend."""
    campaign = profile.openoutreach_campaign
    if not campaign:
        return {"stages": [], "conversion_rates": {}, "leads": [], "messages": []}

    deals = Deal.objects.select_related("lead", "campaign").filter(campaign=campaign)
    stage_order = [
        ProfileState.QUALIFIED.value,
        ProfileState.READY_TO_CONNECT.value,
        ProfileState.PENDING.value,
        ProfileState.CONNECTED.value,
        ProfileState.COMPLETED.value,
        ProfileState.FAILED.value,
    ]
    stage_counts = {state: deals.filter(state=state).count() for state in stage_order}
    lead_items = []
    for deal in deals.exclude(lead__isnull=True).order_by("-update_date")[:20]:
        context = getattr(deal.lead, "marketing_context", None)
        lead_items.append(
            {
                "name": deal.lead.full_name,
                "title": (deal.lead.profile_data or {}).get("headline", ""),
                "status": deal.state,
                "source": context.source_post.suggested_topic if context and context.source_post else "OpenOutreach",
                "comment_text": context.comment_text if context else "",
                "last_activity": deal.update_date.isoformat(),
            }
        )

    from chat.models import ChatMessage
    from django.contrib.contenttypes.models import ContentType

    lead_ct = ContentType.objects.get_for_model(Lead)
    messages = []
    for msg in (
        ChatMessage.objects.filter(
            content_type=lead_ct,
            object_id__in=deals.values_list("lead_id", flat=True),
        )
        .order_by("-creation_date")[:10]
    ):
        messages.append(
            {
                "content": msg.content,
                "created_at": msg.creation_date.isoformat(),
                "is_outgoing": msg.is_outgoing,
            }
        )

    return {
        "stages": [{"stage": state, "count": stage_counts[state]} for state in stage_order],
        "conversion_rates": {
            "pending_to_connected": _percentage(stage_counts[ProfileState.CONNECTED.value], stage_counts[ProfileState.PENDING.value]),
            "connected_to_completed": _percentage(stage_counts[ProfileState.COMPLETED.value], stage_counts[ProfileState.CONNECTED.value]),
        },
        "leads": lead_items,
        "messages": messages,
    }


def _percentage(numerator: int, denominator: int) -> int:
    """Return a rounded percentage while guarding against division by zero."""
    if denominator <= 0:
        return 0
    return round((numerator / denominator) * 100)


def _compose_generation_context(payload: dict) -> tuple[str, str]:
    """Normalize structured post-generation input into the existing storage fields."""
    product_name = sanitize_text(payload.get("product_name"), max_length=300)
    target_audience = sanitize_text(payload.get("target_audience"), max_length=300)
    brief_description = sanitize_text(payload.get("brief_description"))
    source_url = sanitize_text(payload.get("source_url"), max_length=500)
    source_content = sanitize_text(payload.get("source_content"))
    subject = sanitize_text(payload.get("subject"), max_length=300)

    final_subject = product_name or subject
    context_parts = []
    if target_audience:
        context_parts.append(f"Cible prioritaire: {target_audience}")
    if brief_description:
        context_parts.append(f"Description courte: {brief_description}")
    if source_url:
        context_parts.append(f"Lien ou source: {source_url}")
    if source_content:
        context_parts.append(f"Contexte supplementaire: {source_content}")
    return final_subject, "\n".join(context_parts)


def _post_generation_prompt(profile: CreatorProfile, subject: str, source_content: str, tone_override: str) -> str:
    """Build the generation prompt sent to the configured LLM."""
    tone = tone_override or profile.preferred_tone
    subject_line = subject or "Produit un angle fort et pertinent pour LinkedIn a partir de l'offre et de la cible."
    return f"""
Tu es un copywriter LinkedIn B2B senior francophone.
Ta mission: produire un post LinkedIn pret a publier, tres convaincant, tres clair et tres credible.
Tu appliques les bonnes pratiques du marketing B2B, de la persuasion, du storytelling et de la lisibilite.

Profil createur:
- Nom: {profile.display_name}
- Titre: {profile.professional_title}
- Description: {profile.personal_description}
- Entreprise: {profile.company_name}
- Secteur: {profile.company_sector}
- Description entreprise: {profile.company_description}
- Produit/service: {profile.product_name}
- Description produit: {profile.product_description}
- Benefices: {profile.product_benefits}
- Prix: {profile.product_price}

ICP:
- Poste vise: {profile.icp_job_title}
- Secteur: {profile.icp_sector}
- Taille entreprise: {profile.icp_company_size}
- Pays: {profile.icp_country}

Style:
- Ton: {tone}
- Objectif principal: {profile.primary_goal}

Brief utilisateur pour ce post:
- Produit / offre / sujet principal: {subject_line}
- Contexte complementaire: {source_content or "Aucun contexte complementaire fourni"}

Consignes:
- Le post doit capter l'attention des les 2 premieres lignes.
- Structure attendue:
  1. Hook fort
  2. Probleme concret, frustration ou insight marquant
  3. Explication claire orientee cible
  4. Proposition de valeur ou angle differentiant
  5. CTA naturel et pertinent
- Utilise des paragraphes courts, fluides et faciles a lire sur LinkedIn.
- Le texte doit paraitre humain, experimente, utile et convaincant.
- Mets l'accent sur les douleurs, les benefices, le resultat attendu et la transformation.
- Evite le jargon inutile, les promesses non credibles et les phrases robotiques.
- Si un lien ou une source est fourni, integre son apport intelligemment sans rendre le texte rigide.
- Le CTA doit correspondre a LinkedIn B2B: commentaire, DM, avis, demo, echange ou retour d'experience.
- N'insere aucun hashtag dans le corps du post.
- Genere un ensemble de hashtags tres pertinent:
  - 3 a 5 hashtags coeur de sujet
  - 2 a 4 hashtags ICP / marche
  - 1 a 3 hashtags intention / croissance / conversion
  - pas de hashtags generiques inutiles
- Donne entre 6 et 10 hashtags au total, deja optimises.
- Retourne uniquement du JSON valide.

Format JSON attendu:
{{
  "topic": "sujet retenu",
  "post_body": "texte complet du post",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "readability_score": 0
}}
""".strip()
