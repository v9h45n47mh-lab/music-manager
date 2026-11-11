"""Optional Music Assistant access; radio does not require its client library."""

from .access import AccessError


def music_assistant_client(hass, entry_id):
    """Import the official helper only after a MA connection was selected."""
    if not entry_id:
        raise AccessError(
            "music_assistant_missing",
            "Verbinde Music Assistant unter Geräte & Dienste → Music Manager → Konfigurieren → Music-Assistant-Verbindung.",
        )
    from homeassistant.components.music_assistant.helpers import get_music_assistant_client

    return get_music_assistant_client(hass, entry_id)
