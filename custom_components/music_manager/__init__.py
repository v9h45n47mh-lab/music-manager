"""Authenticated Apple Music gateway through the official MA integration."""

import asyncio

import probatio as vol

from homeassistant.auth.permissions.const import POLICY_CONTROL, POLICY_READ
from homeassistant.components import websocket_api
from homeassistant.components.music_assistant.helpers import get_music_assistant_client
from homeassistant.helpers import entity_registry as er

from .access import AccessError, account_for, checked_account, library, search, sonos_uid, validate_uri, value
from .const import CONF_ACCOUNTS, CONF_MASS_ENTRY, DOMAIN


async def async_setup(hass, config):
    websocket_api.async_register_command(hass, websocket_apple_music)
    return True


async def async_setup_entry(hass, entry):
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = entry
    return True


async def async_unload_entry(hass, entry):
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True


@websocket_api.websocket_command({
    vol.Required("type"): "music_manager/apple_music",
    vol.Required("action"): vol.In(["status", "library", "search", "play"]),
    vol.Required("entity_id"): str,
    vol.Required("source_entity"): str,
    vol.Optional("query", default=""): vol.All(str, vol.Length(max=200)),
    vol.Optional("media_type", default="playlist"): vol.In(["track", "album", "playlist"]),
    vol.Optional("offset", default=0): vol.All(int, vol.Range(min=0, max=100000)),
    vol.Optional("uri", default=""): vol.All(str, vol.Length(max=1024)),
})
@websocket_api.async_response
async def websocket_apple_music(hass, connection, msg):
    """Resolve the caller on the server; no caller-provided user/account IDs."""
    try:
        entries = list(hass.data.get(DOMAIN, {}).values())
        if len(entries) != 1:
            raise AccessError("not_configured", "Bitte Music Manager unter Einstellungen → Geräte & Dienste einrichten.")
        entry = entries[0]
        account = account_for(entry.options.get(CONF_ACCOUNTS, []), connection.user.id)
        mass = get_music_assistant_client(hass, entry.data[CONF_MASS_ENTRY])
        async with asyncio.timeout(30):
            user, provider = await checked_account(mass, account)
            registry = er.async_get(hass)
            target = registry.async_get(msg["entity_id"])
            source = registry.async_get(msg["source_entity"])
            if (not target or target.platform != "music_assistant"
                or target.config_entry_id != entry.data[CONF_MASS_ENTRY]
                or not target.entity_id.startswith("media_player.") or target.disabled_by
                or not source or source.platform != "sonos" or source.disabled_by
                or not source.entity_id.startswith("media_player.")
                or not sonos_uid(source.unique_id)
                or sonos_uid(source.unique_id) != sonos_uid(target.unique_id)):
                raise AccessError("wrong_player", "Wähle im Karteneditor die Music-Assistant-Entität derselben Sonos-Box aus.")
            for entity in (source, target):
                if not connection.user.permissions.check_entity(entity.entity_id, POLICY_READ):
                    raise AccessError("unauthorized", "Du hast keinen Zugriff auf diese Box.")
                if msg["action"] == "play" and not connection.user.permissions.check_entity(entity.entity_id, POLICY_CONTROL):
                    raise AccessError("unauthorized", "Du darfst diese Box nicht steuern.")
            player_id = target.unique_id
            player_filter = value(user, "player_filter", []) or []
            if player_filter and player_id not in player_filter:
                raise AccessError("unauthorized", "Diese Box ist für deinen Music-Assistant-Benutzer nicht freigegeben.")
            if msg["action"] == "status":
                result = {"account": value(user, "display_name") or value(user, "username"),
                          "provider": value(provider, "name", "Apple Music")}
            elif msg["action"] == "library":
                result = await library(mass, account, msg["media_type"], msg["offset"])
            elif msg["action"] == "search":
                if not msg["query"].strip():
                    raise AccessError("empty_query", "Bitte einen Suchbegriff eingeben.")
                result = await search(mass, account, msg["query"].strip())
            else:
                uri = validate_uri(msg["uri"], account["provider_id"])
                player = mass.players.get(player_id)
                if not player or not value(player, "available", False):
                    raise AccessError("player_unavailable", "Die Sonos-Box ist in Music Assistant nicht erreichbar.")
                await mass.player_queues.play_media(queue_id=player_id, media=uri, option="replace", user=account["ma_user_id"])
                result = {"started": True}
        connection.send_result(msg["id"], result)
    except AccessError as err:
        connection.send_error(msg["id"], err.code, str(err))
    except TimeoutError:
        connection.send_error(msg["id"], "timeout", "Music Assistant antwortet nicht. Bitte erneut versuchen.")
    except Exception:
        # Do not send upstream responses or authentication material to a browser.
        connection.send_error(msg["id"], "music_assistant_error", "Music Assistant meldet einen Fehler. Bitte Verbindung, Benutzerrechte und Apple-Music-Anmeldung dort prüfen.")
