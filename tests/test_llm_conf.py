import pytest


@pytest.mark.django_db
def test_get_llm_client_config_requires_key_for_remote_provider():
    from linkedin.conf import get_llm_client_config
    from linkedin.models import SiteConfig

    cfg = SiteConfig.load()
    cfg.ai_model = "llama-3.3-70b-versatile"
    cfg.llm_api_base = "https://api.groq.com/openai/v1"
    cfg.llm_api_key = ""
    cfg.save()

    with pytest.raises(ValueError, match="LLM_API_KEY"):
        get_llm_client_config()


@pytest.mark.django_db
def test_get_llm_client_config_allows_empty_key_for_local_provider():
    from linkedin.conf import get_llm_client_config
    from linkedin.models import SiteConfig

    cfg = SiteConfig.load()
    cfg.ai_model = "qwen2.5:7b-instruct"
    cfg.llm_api_base = "http://localhost:11434/v1"
    cfg.llm_api_key = ""
    cfg.save()

    llm_config = get_llm_client_config()

    assert llm_config["model"] == "qwen2.5:7b-instruct"
    assert llm_config["base_url"] == "http://localhost:11434/v1"
    assert llm_config["api_key"] == "ollama"


@pytest.mark.django_db
def test_missing_keys_skips_api_key_for_local_provider():
    from linkedin.models import SiteConfig
    from linkedin.onboarding import missing_keys

    cfg = SiteConfig.load()
    cfg.ai_model = "qwen2.5:7b-instruct"
    cfg.llm_api_base = "http://127.0.0.1:11434/v1"
    cfg.llm_api_key = ""
    cfg.save()

    assert "llm_api_key" not in missing_keys()


@pytest.mark.django_db
def test_get_llm_client_config_defaults_to_groq():
    from linkedin.conf import DEFAULT_GROQ_API_BASE, DEFAULT_GROQ_MODEL, get_llm_client_config
    from linkedin.models import SiteConfig

    cfg = SiteConfig.load()
    cfg.ai_model = ""
    cfg.llm_api_base = ""
    cfg.llm_api_key = "groq-test-key"
    cfg.save()

    llm_config = get_llm_client_config()

    assert llm_config["model"] == DEFAULT_GROQ_MODEL
    assert llm_config["base_url"] == DEFAULT_GROQ_API_BASE
    assert llm_config["api_key"] == "groq-test-key"


@pytest.mark.django_db
def test_missing_keys_does_not_require_model_or_base_with_groq_defaults():
    from linkedin.models import SiteConfig
    from linkedin.onboarding import missing_keys

    cfg = SiteConfig.load()
    cfg.ai_model = ""
    cfg.llm_api_base = ""
    cfg.llm_api_key = "groq-test-key"
    cfg.save()

    keys = missing_keys()

    assert "ai_model" not in keys
    assert "llm_api_base" not in keys
