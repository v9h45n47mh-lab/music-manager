"""Personal beta-player navigation; changing a card never changes its configuration."""

import asyncio
import re

import probatio as vol

from homeassistant.auth.permissions.const import POLICY_CONTROL, POLICY_READ
from homeassistant.components import websocket_api
from homeassistant.components.frontend.storage import async_user_store
from homeassistant.helpers import entity_registry as er

from .access import AccessError, sonos_uid
from .const import CONF_SPEAKER_USERS, DOMAIN, VERSION

NAVIGATION_KEY = "music_manager_beta_navigation"


async def speaker_users(hass, entry):
    """Persisted IDs take precedence, including an explicitly empty selection."""
    users = [u for u in await hass.auth.async_get_users()
             if u.is_active and not u.system_generated]
    if CONF_SPEAKER_USERS in entry.options:
        allowed = set(entry.options[CONF_SPEAKER_USERS])
        return [u for u in users if u.id in allowed]
    # Safe initial defaults from trusted HA names, only when unambiguous.
    result = []
    for name in ("manuel", "vera"):
        matches = [u for u in users if (u.name or "").strip().casefold() == name]
        if len(matches) == 1:
            result.extend(matches)
    return result


def available_players(hass, user):
    registry = er.async_get(hass)
    players = []
    for entity in registry.entities.values():
        state = hass.states.get(entity.entity_id)
        if (entity.platform != "sonos" or entity.disabled_by
            or not entity.entity_id.startswith("media_player.")
            or not sonos_uid(entity.unique_id) or state is None
            or not all(user.permissions.check_entity(entity.entity_id, p)
                       for p in (POLICY_READ, POLICY_CONTROL))):
            continue
        players.append({"entity_id": entity.entity_id,
                        "name": state.attributes.get("friendly_name", entity.entity_id),
                        "available": state.state not in ("unknown", "unavailable")})
    return sorted(players, key=lambda item: (item["name"].casefold(), item["entity_id"]))


async def navigation_data(hass, user, source, navigation_id="", selected=None):
    if not user or not user.is_active or user.system_generated:
        raise AccessError("unauthorized", "Bitte mit einem persönlichen HA-Benutzer anmelden.")
    entries = list(hass.data.get(DOMAIN, {}).values())
    if len(entries) != 1:
        raise AccessError("not_configured", "Bitte Music Manager unter Geräte & Dienste einrichten.")
    if (not re.fullmatch(r"media_player\.[a-z0-9_]+", source)
        or navigation_id and not re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", navigation_id)):
        raise AccessError("invalid_navigation", "Die Box oder Navigationskennung ist ungültig.")
    people = [u for u in await hass.auth.async_get_users() if u.is_active and not u.system_generated]
    wake_names = {"maximilian", "paul"}
    caller_name = (user.name or "").strip().casefold()
    show_alarm_songs = caller_name in wake_names and sum(
        (u.name or "").strip().casefold() == caller_name for u in people) == 1
    allowed = user.id in {u.id for u in await speaker_users(hass, entries[0])}
    if not allowed:
        if selected is not None:
            raise AccessError("unauthorized", "Diese Karte verwendet für dich die konfigurierte Box.")
        return {"can_select": False, "entity_id": source, "players": [], "show_alarm_songs": show_alarm_songs, "version": VERSION}
    players = available_players(hass, user)
    ids = {p["entity_id"] for p in players}
    key = navigation_id or source
    store = await async_user_store(hass, user.id)
    locks = hass.data.setdefault(f"{DOMAIN}_navigation_locks", {})
    async with locks.setdefault(user.id, asyncio.Lock()):
        saved = store.data.get(NAVIGATION_KEY, {})
        saved = dict(saved) if isinstance(saved, dict) else {}
        if selected is not None:
            if selected not in ids:
                raise AccessError("unauthorized", "Diese Box ist nicht für dich verfügbar.")
            saved[key] = selected
            await store.async_set_item(NAVIGATION_KEY, saved)
        entity = saved.get(key)
        # A removed speaker/permission must never leave a hidden stale target.
        entity = entity if entity in ids else source
    return {"can_select": True, "entity_id": entity, "players": players, "show_alarm_songs": show_alarm_songs, "version": VERSION}


@websocket_api.websocket_command({
    vol.Required("type"): "music_manager/player_navigation",
    vol.Required("action"): vol.In(["get", "select"]),
    vol.Required("source_entity"): str,
    vol.Optional("navigation_id", default=""): vol.All(str, vol.Length(max=64)),
    vol.Optional("entity_id"): str,
})
@websocket_api.async_response
async def websocket_player_navigation(hass, connection, msg):
    try:
        if msg["action"] == "select" and not msg.get("entity_id"):
            raise AccessError("invalid_navigation", "Bitte eine Box auswählen.")
        result = await navigation_data(hass, connection.user, msg["source_entity"],
                                       msg.get("navigation_id", ""),
                                       msg.get("entity_id") if msg["action"] == "select" else None)
        connection.send_result(msg["id"], result)
    except AccessError as err:
        connection.send_error(msg["id"], err.code, str(err))
    except Exception:
        connection.send_error(msg["id"], "navigation_error", "Die persönliche Box-Auswahl konnte nicht geladen oder gespeichert werden.")
