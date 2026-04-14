from types import SimpleNamespace

from linkedin.browser.session import AccountSession


class _FakeContext:
    def __init__(self, state):
        self._state = state
        self.closed = False

    def storage_state(self):
        return self._state

    def close(self):
        self.closed = True


class _FakeBrowser:
    def __init__(self):
        self.closed = False

    def close(self):
        self.closed = True


class _FakePlaywright:
    def __init__(self):
        self.stopped = False

    def stop(self):
        self.stopped = True


class _FakeProfile:
    def __init__(self, cookie_data=None):
        self.user = SimpleNamespace(username="workspace-user")
        self.linkedin_username = "owner@example.com"
        self.cookie_data = cookie_data
        self.saved_update_fields = []

    def save(self, update_fields=None):
        self.saved_update_fields.append(list(update_fields or []))


def test_close_persists_latest_storage_state():
    profile = _FakeProfile(cookie_data={"cookies": [{"name": "li_at", "value": "old"}]})
    session = AccountSession(profile)
    session.context = _FakeContext({"cookies": [{"name": "li_at", "value": "new"}]})
    session.browser = _FakeBrowser()
    session.playwright = _FakePlaywright()
    session.page = SimpleNamespace()

    session.close()

    assert profile.cookie_data == {"cookies": [{"name": "li_at", "value": "new"}]}
    assert ["cookie_data"] in profile.saved_update_fields
    assert session.page is None
    assert session.context is None
    assert session.browser is None
    assert session.playwright is None


def test_close_without_persist_does_not_overwrite_saved_state():
    profile = _FakeProfile(cookie_data={"cookies": [{"name": "li_at", "value": "saved"}]})
    session = AccountSession(profile)
    session.context = _FakeContext({"cookies": [{"name": "li_at", "value": "runtime"}]})
    session.browser = _FakeBrowser()
    session.playwright = _FakePlaywright()
    session.page = SimpleNamespace()

    session.close(persist_state=False)

    assert profile.cookie_data == {"cookies": [{"name": "li_at", "value": "saved"}]}
    assert profile.saved_update_fields == []
