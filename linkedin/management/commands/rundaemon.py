import logging
import os
import sys
from getpass import getpass

from django.core.management import call_command
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Run the OpenOutreach daemon (onboard, validate, start task queue)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--onboard",
            metavar="CONFIG_JSON",
            help="Path to onboard config JSON (non-interactive mode).",
        )
        parser.add_argument(
            "--handle",
            metavar="DJANGO_USERNAME",
            help="Workspace username whose LinkedIn profile should be used.",
        )
        parser.add_argument(
            "--linkedin-email",
            metavar="EMAIL",
            help="Override the LinkedIn email/username before starting the daemon.",
        )
        parser.add_argument(
            "--linkedin-password",
            metavar="PASSWORD",
            help="Override the LinkedIn password before starting the daemon.",
        )
        parser.add_argument(
            "--force-login",
            action="store_true",
            help="Clear saved cookies and force a fresh LinkedIn login.",
        )

    def handle(self, *args, **options):
        self._configure_logging()
        self._print_version()
        self._ensure_db()
        self._ensure_onboarded(options["onboard"])
        session = self._create_session(options)
        self._ensure_newsletter(session)

        from linkedin.daemon import run_daemon
        run_daemon(session)

    # -- Steps ---------------------------------------------------------------

    def _print_version(self):
        sha = os.environ.get("GIT_SHA", "dev")
        logger.info("OpenOutreach %s", sha[:8])

    def _configure_logging(self):
        logging.getLogger().handlers.clear()
        logging.basicConfig(level=logging.DEBUG, format="%(message)s")
        for name in (
            "urllib3", "httpx", "langchain", "openai", "playwright",
            "httpcore", "fastembed", "huggingface_hub", "filelock", "asyncio",
        ):
            logging.getLogger(name).setLevel(logging.WARNING)

    def _ensure_db(self):
        call_command("migrate", "--no-input")

        from linkedin.management.setup_crm import setup_crm
        setup_crm()

    def _ensure_onboarded(self, onboard_file):
        from linkedin.onboarding import (
            OnboardConfig, apply, collect_from_wizard, missing_keys,
        )

        if not missing_keys():
            return

        if onboard_file:
            apply(OnboardConfig.from_json(onboard_file))
        elif sys.stdin.isatty():
            apply(collect_from_wizard())
        else:
            missing = missing_keys()
            self.stderr.write(
                f"Onboarding incomplete and no TTY available.\n"
                f"Missing: {', '.join(sorted(missing))}\n"
                f"Pass --onboard <config.json> or run with an interactive terminal."
            )
            sys.exit(1)

    def _create_session(self, options):
        from linkedin.browser.registry import get_or_create_session
        from linkedin.conf import get_llm_config
        from linkedin.models import LinkedInProfile

        llm_api_key, _, _ = get_llm_config()
        if not llm_api_key:
            logger.error("LLM_API_KEY is required. Set it in Site Configuration (Django Admin).")
            sys.exit(1)

        options = self._collect_interactive_credentials(options)
        profile = self._resolve_profile(options, LinkedInProfile)
        if profile is None:
            logger.error("No active LinkedIn profiles found.")
            sys.exit(1)

        self._configure_linkedin_credentials(profile, options)

        session = get_or_create_session(profile)

        if not session.campaigns:
            logger.error("No campaigns found for this user.")
            sys.exit(1)
        campaign = next(
            (c for c in session.campaigns if not c.is_freemium), None,
        ) or session.campaigns[0]
        session.campaign = campaign

        return session

    def _collect_interactive_credentials(self, options):
        if not sys.stdin.isatty():
            return options

        if options.get("handle"):
            return options

        email = str(options.get("linkedin_email") or "").strip()
        password = str(options.get("linkedin_password") or "")
        force_login = bool(options.get("force_login"))

        entered_email = input("LinkedIn email/username: ").strip()
        if entered_email:
            email = entered_email

        entered_password = getpass("LinkedIn password: ")
        if entered_password:
            password = entered_password

        return {
            **options,
            "linkedin_email": email,
            "linkedin_password": password,
            "force_login": True if (entered_email or entered_password) else force_login,
        }

    def _resolve_profile(self, options, linkedin_profile_model):
        handle = str(options.get("handle") or "").strip()
        if handle:
            return linkedin_profile_model.objects.select_related("user").filter(
                user__username=handle,
                active=True,
            ).first()

        email = str(options.get("linkedin_email") or "").strip()
        if email:
            profile = linkedin_profile_model.objects.select_related("user").filter(
                linkedin_username=email,
                active=True,
            ).first()
            if profile:
                logger.info("Using LinkedIn profile for %s (%s).", profile.user.username, profile.linkedin_username)
                return profile

        profiles = list(
            linkedin_profile_model.objects.filter(active=True)
            .select_related("user")
            .order_by("-pk")
        )
        if not profiles:
            return None

        if not sys.stdin.isatty():
            logger.error("Pass --handle <username> to choose the LinkedIn profile explicitly.")
            sys.exit(1)

        profile = profiles[0]
        logger.info(
            "Using LinkedIn profile for %s (%s). Pass --handle to override.",
            profile.user.username,
            profile.linkedin_username,
        )
        return profile

    def _configure_linkedin_credentials(self, profile, options):
        email = str(options.get("linkedin_email") or "").strip()
        password = str(options.get("linkedin_password") or "")
        force_login = bool(options.get("force_login"))

        update_fields: list[str] = []
        if email and email != profile.linkedin_username:
            profile.linkedin_username = email
            update_fields.append("linkedin_username")
        if password:
            profile.linkedin_password = password
            update_fields.append("linkedin_password")
        if force_login:
            profile.cookie_data = None
            update_fields.append("cookie_data")

        if update_fields:
            profile.save(update_fields=update_fields)

    def _ensure_newsletter(self, session):
        if session.linkedin_profile.newsletter_processed:
            return

        from linkedin.api.newsletter import ensure_newsletter_subscription
        from linkedin.setup.gdpr import apply_gdpr_newsletter_override
        from linkedin.url_utils import public_id_to_url

        profile = session.self_profile
        country_code = profile.get("country_code")
        apply_gdpr_newsletter_override(session, country_code)
        linkedin_url = public_id_to_url(profile["public_identifier"])
        ensure_newsletter_subscription(session, linkedin_url=linkedin_url)
        session.linkedin_profile.newsletter_processed = True
        session.linkedin_profile.save(update_fields=["newsletter_processed"])
