# linkedin/conf.py
from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse


# ----------------------------------------------------------------------
# Paths
# ----------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent.parent

PROMPTS_DIR = Path(__file__).parent / "templates" / "prompts"

DIAGNOSTICS_DIR = ROOT_DIR / "tmp" / "openoutreach-diagnostics"

FASTEMBED_CACHE_DIR = ROOT_DIR / ".cache" / "fastembed"

FIXTURE_DIR = ROOT_DIR / "tests" / "fixtures"
FIXTURE_PROFILES_DIR = FIXTURE_DIR / "profiles"
FIXTURE_PAGES_DIR = FIXTURE_DIR / "pages"
DUMP_PAGES = False

MIN_DELAY = 5
MAX_DELAY = 8

# ----------------------------------------------------------------------
# Browser config
# ----------------------------------------------------------------------
BROWSER_SLOW_MO = 200
BROWSER_DEFAULT_TIMEOUT_MS = 30_000
BROWSER_LOGIN_TIMEOUT_MS = 40_000
BROWSER_NAV_TIMEOUT_MS = 10_000
HUMAN_TYPE_MIN_DELAY_MS = 50
HUMAN_TYPE_MAX_DELAY_MS = 200

# ----------------------------------------------------------------------
# Onboarding defaults (shown to user during interactive setup)
# ----------------------------------------------------------------------
DEFAULT_CONNECT_DAILY_LIMIT = 50
DEFAULT_CONNECT_WEEKLY_LIMIT = 250
DEFAULT_FOLLOW_UP_DAILY_LIMIT = 100

# ----------------------------------------------------------------------
# Active-hours schedule (daemon pauses outside this window)
# Set to False to run 24/7.
# ----------------------------------------------------------------------
ENABLE_ACTIVE_HOURS = False
ACTIVE_START_HOUR = 10   # inclusive, local time
ACTIVE_END_HOUR = 20    # exclusive, local time
ACTIVE_TIMEZONE = "UTC"
REST_DAYS = (5, 6)      # 0=Mon … 6=Sun; default Sat+Sun off

# ----------------------------------------------------------------------
# Campaign config (timing + ML defaults — hardcoded, no YAML)
# ----------------------------------------------------------------------
CAMPAIGN_CONFIG = {
    "check_pending_recheck_after_hours": 24,
    "enrich_min_interval": 1,
    "min_action_interval": 120,
    "qualification_n_mc_samples": 100,
    "min_ready_to_connect_prob": 0.9,
    "min_positive_pool_prob": 0.20,
    "embedding_model": "BAAI/bge-small-en-v1.5",
    "connect_delay_seconds": 10,
    "connect_no_candidate_delay_seconds": 300,
}

# ----------------------------------------------------------------------
# Global LLM config (stored in DB via SiteConfig)
# ----------------------------------------------------------------------
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
DEFAULT_GROQ_API_BASE = "https://api.groq.com/openai/v1"


def get_integration_api_token() -> str:
    """Return the optional shared token used by JSON integration endpoints."""
    return os.environ.get("OPENOUTREACH_API_TOKEN", "").strip()


def get_llm_config():
    """Return (llm_api_key, ai_model, llm_api_base) from the DB."""
    from linkedin.models import SiteConfig
    cfg = SiteConfig.load()
    return (
        cfg.llm_api_key,
        cfg.ai_model or DEFAULT_GROQ_MODEL,
        cfg.llm_api_base or DEFAULT_GROQ_API_BASE,
    )


def is_local_llm_base(llm_api_base: str | None) -> bool:
    """Return True for local OpenAI-compatible endpoints like Ollama."""
    if not llm_api_base:
        return False

    parsed = urlparse(llm_api_base)
    host = (parsed.hostname or "").lower()
    return host in {"localhost", "127.0.0.1", "::1"}


def get_llm_client_config():
    """Return normalized config for OpenAI-compatible chat clients.

    Groq is the default remote provider. Local providers such as Ollama expose
    an OpenAI-compatible API but do not
    require a real API key. LangChain still expects a non-empty value, so a
    harmless placeholder is injected for localhost endpoints.
    """
    llm_api_key, ai_model, llm_api_base = get_llm_config()
    if not llm_api_key:
        if is_local_llm_base(llm_api_base):
            llm_api_key = "ollama"
        else:
            raise ValueError("LLM_API_KEY is not set in Site Configuration.")

    return {
        "api_key": llm_api_key,
        "model": ai_model,
        "base_url": llm_api_base,
    }


def build_chat_llm(**kwargs):
    """Instantiate the default chat model client."""
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(**get_llm_client_config(), **kwargs)

