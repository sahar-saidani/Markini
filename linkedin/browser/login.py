# linkedin/browser/login.py
import logging

from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
from termcolor import colored

from linkedin.browser.nav import goto_page, human_type
from linkedin.conf import (
    BROWSER_DEFAULT_TIMEOUT_MS,
    BROWSER_LOGIN_TIMEOUT_MS,
    BROWSER_SLOW_MO,
)

logger = logging.getLogger(__name__)

LINKEDIN_LOGIN_URL = "https://www.linkedin.com/login"
LINKEDIN_FEED_URL = "https://www.linkedin.com/feed/"

SELECTORS = {
    "email": [
        'input#username',
        'input[name="session_key"]',
        'input[autocomplete="username"]',
    ],
    "password": [
        'input#password',
        'input[name="session_password"]',
        'input[autocomplete="current-password"]',
        'input[type="password"]',
    ],
    "submit": [
        'button[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("S\'identifier")',
        'button:has-text("Se connecter")',
    ],
}


def _first_visible(page, selectors: list[str], field_name: str):
    for selector in selectors:
        locator = page.locator(selector)
        try:
            locator.first.wait_for(state="attached", timeout=5_000)
        except Exception:
            continue
        count = locator.count()
        for index in range(count):
            candidate = locator.nth(index)
            try:
                if candidate.is_visible():
                    return candidate
            except Exception:
                continue
    raise RuntimeError(f"Could not find visible login field: {field_name}")


def playwright_login(session: "AccountSession"):
    page = session.page
    lp = session.linkedin_profile
    logger.info(colored("Fresh login sequence starting", "cyan") + f" for {session}")

    goto_page(
        session,
        action=lambda: page.goto(LINKEDIN_LOGIN_URL),
        expected_url_pattern="/login",
        error_message="Failed to load login page",
    )

    email_input = _first_visible(page, SELECTORS["email"], "email")
    password_input = _first_visible(page, SELECTORS["password"], "password")
    submit_button = _first_visible(page, SELECTORS["submit"], "submit")

    email_input.fill("")
    human_type(email_input, lp.linkedin_username)
    session.wait()
    password_input.fill("")
    human_type(password_input, lp.linkedin_password)
    session.wait()

    submit_button.click()
    page.wait_for_load_state("load", timeout=BROWSER_LOGIN_TIMEOUT_MS)
    session.wait()

    current_url = page.url
    if "/checkpoint/challenge" in current_url or "/checkpoint/" in current_url:
        raise RuntimeError(
            "LinkedIn a demande une verification de securite (checkpoint/challenge). "
            "Les identifiants ont ete soumis, mais la connexion automatique ne peut pas continuer sans validation manuelle."
        )

    if "/feed" not in current_url:
        raise RuntimeError(f"Login failed - no redirect to feed -> expected '/feed' | got '{current_url}'")


def launch_browser(storage_state=None):
    logger.debug("Launching Playwright")
    playwright = sync_playwright().start()
    browser = playwright.chromium.launch(headless=False, slow_mo=BROWSER_SLOW_MO)
    context = browser.new_context(storage_state=storage_state)
    context.set_default_timeout(BROWSER_DEFAULT_TIMEOUT_MS)
    Stealth().apply_stealth_sync(context)
    page = context.new_page()
    return page, context, browser, playwright


def start_browser_session(session: "AccountSession"):
    logger.debug("Configuring browser for %s", session)

    session.linkedin_profile.refresh_from_db(fields=["cookie_data"])
    cookie_data = session.linkedin_profile.cookie_data

    storage_state = cookie_data if cookie_data else None
    if storage_state:
        logger.info("Loading saved session for %s", session)

    session.page, session.context, session.browser, session.playwright = launch_browser(storage_state=storage_state)

    if not storage_state:
        playwright_login(session)
        session.persist_storage_state()
        logger.info(colored("Login successful - session saved", "green", attrs=["bold"]))
    else:
        goto_page(
            session,
            action=lambda: session.page.goto(LINKEDIN_FEED_URL),
            expected_url_pattern="/feed",
            timeout=BROWSER_DEFAULT_TIMEOUT_MS,
            error_message="Saved session invalid",
        )
        session.persist_storage_state()

    session.page.wait_for_load_state("load")
    logger.info(colored("Browser ready", "green", attrs=["bold"]))


if __name__ == "__main__":
    from linkedin.browser.registry import cli_parser, cli_session

    parser = cli_parser("Start a LinkedIn browser session")
    args = parser.parse_args()
    session = cli_session(args)
    session.ensure_browser()

    start_browser_session(session=session)
    print("Logged in! Close browser manually.")
    session.page.pause()
