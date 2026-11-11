"""Authenticated Apple Music gateway through the official MA integration."""

import asyncio

import probatio as vol

from homeassistant.auth.permissions.const import POLICY_CONTROL, POLICY_READ
from homeassistant.components import websocket_api
from homeassistant.helpers import entity_registry as er

from .access import AccessError, account_for, checked_account, container_tracks, library, search, sonos_uid, validate_uri, value
from .const import CONF_ACCOUNTS, CONF_MASS_ENTRY, DOMAIN
from .helpers import music_assistant_client


async def async_setup(hass, config):
    from .alarms import async_register_alarms
    from .configuration import websocket_configuration
    from .navigation import websocket_player_navigation

    websocket_api.async_register_command(hass, websocket_apple_music)
    websocket_api.async_register_command(hass, websocket_configuration)
    websocket_api.async_register_command(hass, websocket_player_navigation)
    async_register_alarms(hass)
    return True


async def async_setup_entry(hass, entry):
    from .frontend import async_register_frontend

    try:
        await async_register_frontend(hass)
    except Exception as err:
        from homeassistant.exceptions import ConfigEntryNotReady

        raise ConfigEntryNotReady("Music-Manager-Oberfläche konnte nicht registriert werden") from err
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = entry
    return True


async def async_unload_entry(hass, entry):
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if not hass.data.get(DOMAIN):
        from .frontend import async_unregister_frontend

        await async_unregister_frontend(hass)
    return True


def resolve_player(hass, connection, entry, source_id, target_id=None):
    """Find this Sonos device in the selected MA integration, never by name."""
    registry = er.async_get(hass)
    source = registry.async_get(source_id)
    if (not source or source.platform != "sonos" or source.disabled_by
        or not source.entity_id.startswith("media_player.") or not sonos_uid(source.unique_id)):
        raise AccessError("wrong_player", "Die gewählte Box ist keine aktive Sonos-Entität.")
    if not connection.user.permissions.check_entity(source.entity_id, POLICY_READ):
        raise AccessError("unauthorized", "Du hast keinen Zugriff auf diese Box.")

    def matches(target):
        return (target and target.platform == "music_assistant"
                and target.config_entry_id == entry.data[CONF_MASS_ENTRY]
                and target.entity_id.startswith("media_player.") and not target.disabled_by
                and sonos_uid(target.unique_id) == sonos_uid(source.unique_id))

    if target_id:
        target = registry.async_get(target_id)
        if not matches(target):
            raise AccessError("wrong_player", "Der manuell gewählte Music-Assistant-Player gehört nicht zu dieser Sonos-Box. Wähle im Karteneditor Automatisch.")
    else:
        targets = [target for target in registry.entities.values() if matches(target)]
        if not targets:
            raise AccessError("player_missing", "Diese Sonos-Box fehlt in der verbundenen Music-Assistant-Integration. Richte sie in Music Assistant über den Sonos-Player-Anbieter ein und aktiviere ihre HA-Entität. Danach wird sie automatisch zugeordnet.")
        if len(targets) != 1:
            raise AccessError("player_ambiguous", "Für diese Box gibt es mehrere Music-Assistant-Entitäten. Wähle den passenden Player einmal im Karteneditor aus.")
        target = targets[0]
    return source, target


@websocket_api.websocket_command({
    vol.Required("type"): "music_manager/apple_music",
    vol.Required("action"): vol.In(["status", "library", "search", "tracks", "play", "next"]),
    vol.Optional("entity_id"): str,
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
        if not entry.data.get(CONF_MASS_ENTRY):
            raise AccessError("music_assistant_missing", "Verbinde Music Assistant unter Geräte & Dienste → Music Manager → Konfigurieren → Music-Assistant-Verbindung.")
        account = account_for(entry.options.get(CONF_ACCOUNTS, []), connection.user.id)
        mass = music_assistant_client(hass, entry.data[CONF_MASS_ENTRY])
        async with asyncio.timeout(30):
            user, provider = await checked_account(mass, account)
            source, target = resolve_player(hass, connection, entry, msg["source_entity"], msg.get("entity_id"))
            for entity in (source, target):
                if not connection.user.permissions.check_entity(entity.entity_id, POLICY_READ):
                    raise AccessError("unauthorized", "Du hast keinen Zugriff auf diese Box.")
                if msg["action"] in {"play", "next"} and not connection.user.permissions.check_entity(entity.entity_id, POLICY_CONTROL):
                    raise AccessError("unauthorized", "Du darfst diese Box nicht steuern.")
            player_id = target.unique_id
            player_filter = value(user, "player_filter", []) or []
            if player_filter and player_id not in player_filter:
                raise AccessError("unauthorized", "Diese Box ist für deinen Music-Assistant-Benutzer nicht freigegeben.")
            if msg["action"] == "status":
                result = {"account": value(user, "display_name") or value(user, "username"),
                          "provider": value(provider, "name", "Apple Music"), "entity_id": target.entity_id}
            elif msg["action"] == "library":
                result = await library(mass, account, msg["media_type"], msg["offset"])
            elif msg["action"] == "search":
                if not msg["query"].strip():
                    raise AccessError("empty_query", "Bitte einen Suchbegriff eingeben.")
                result = await search(mass, account, msg["query"].strip())
            elif msg["action"] == "tracks":
                result = await container_tracks(mass, account, msg["uri"], msg["offset"])
            elif msg["action"] == "next":
                player = mass.players.get(player_id)
                if not player or not value(player, "available", False):
                    raise AccessError("player_unavailable", "Die Sonos-Box ist in Music Assistant nicht erreichbar.")
                queue = mass.player_queues.get(player_id)
                next_item = value(queue, "next_item")
                current_item = value(queue, "current_item")
                next_id = value(next_item, "queue_item_id")
                # A known next item in this player's own active queue can start
                # directly, avoiding MA's one-second next-button debounce.
                # Groups, repeat-one and unknown/expired queue state use MA's
                # standard routing instead; never compute shuffle order here.
                if (value(player, "active_source") == player_id and value(queue, "active", False)
                    and next_id and current_item and value(next_item, "available", False)
                    and value(next_item, "queue_id", player_id) == player_id
                    and next_id != value(current_item, "queue_item_id")):
                    await mass.player_queues.play_index(queue_id=player_id, index=next_id)
                else:
                    await mass.players.player_command_next_track(player_id)
                result = {"skipped": True}
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
