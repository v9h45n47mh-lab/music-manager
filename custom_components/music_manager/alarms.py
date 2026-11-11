"""Persisted alarm music, bound by an administrator to an owner and speaker."""

import asyncio
import re
from types import SimpleNamespace

import probatio as vol

from homeassistant.auth.permissions.const import POLICY_CONTROL, POLICY_READ
from homeassistant.components import websocket_api
from homeassistant.components.frontend.storage import async_user_store
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er

from .access import AccessError, account_for, checked_account, sonos_uid, validate_uri, value
from .const import CONF_ACCOUNTS, CONF_ALARMS, CONF_MASS_ENTRY, DOMAIN
from .helpers import music_assistant_client

SELECTION_KEY = "music_manager_alarm_music"
FAVORITES_KEY = "music_manager_favorites"
ALARM_SONGS_KEY = "music_manager_alarm_songs"
ALARM_ID = re.compile(r"[a-z0-9][a-z0-9_]{0,63}\Z")


def configured_alarm(hass, alarm_id):
    if not isinstance(alarm_id, str) or not ALARM_ID.fullmatch(alarm_id):
        raise AccessError("invalid_alarm", "Die Weckerkennung ist ungültig.")
    entries = list(hass.data.get(DOMAIN, {}).values())
    if len(entries) != 1:
        raise AccessError("not_configured", "Bitte Music Manager einrichten.")
    entry = entries[0]
    alarms = [a for a in entry.options.get(CONF_ALARMS, []) if a.get("alarm_id") == alarm_id]
    if len(alarms) != 1:
        raise AccessError("alarm_missing", "Ordne diesen Wecker unter Geräte & Dienste → Music Manager → Konfigurieren → Wecker hinzufügen einem Benutzer und einer Box zu.")
    return entry, alarms[0]


async def alarm_owner(hass, alarm, caller):
    owner = await hass.auth.async_get_user(alarm.get("ha_user_id"))
    if not owner or not owner.is_active or owner.system_generated:
        raise AccessError("unauthorized", "Der zugeordnete HA-Benutzer ist nicht aktiv.")
    if caller is not None and (not caller.is_active or (
        caller.id != owner.id and not caller.is_admin
    )):
        raise AccessError("unauthorized", "Dieser Wecker gehört einem anderen Benutzer.")
    return owner


def checked_source(hass, alarm, owner):
    source = er.async_get(hass).async_get(alarm.get("source_entity"))
    if not source or source.platform != "sonos" or not source.entity_id.startswith("media_player.") or source.disabled_by or not sonos_uid(source.unique_id):
        raise AccessError("wrong_player", "Die zugeordnete Sonos-Box ist nicht verfügbar.")
    for policy in (POLICY_READ, POLICY_CONTROL):
        if not owner.permissions.check_entity(source.entity_id, policy):
            raise AccessError("unauthorized", "Der Wecker-Benutzer darf diese Box nicht steuern.")
    return source


def music_item(item, provider_id):
    if not isinstance(item, dict) or item.get("kind") != "apple_music":
        return None
    uri, kind = item.get("uri"), item.get("media_type")
    try:
        validate_uri(uri, provider_id)
    except (AccessError, TypeError):
        return None
    if kind not in ("track", "album", "playlist") or not uri.startswith(f"{provider_id}://{kind}/"):
        return None
    title = item.get("title")
    if not isinstance(title, str) or not title.strip():
        return None
    return {"uri": uri, "media_type": kind, "title": title[:500]}


def favorite_item(item, provider_id):
    """Only explicitly marked single songs belong in the alarm picker."""
    if not isinstance(item, dict) or item.get("media_type") != "track" or item.get("alarm_song") is not True:
        return None
    return music_item(item, provider_id)


def songs_from(store, provider_id):
    """Read the separate wake-song list, plus old markers until migrated."""
    result, seen = [], set()
    raw = store.data.get(ALARM_SONGS_KEY, [])
    legacy = store.data.get(FAVORITES_KEY, [])
    candidates = list(raw) if isinstance(raw, list) else []
    candidates += [item for item in legacy if isinstance(item, dict) and item.get("alarm_song") is True] if isinstance(legacy, list) else []
    for raw_item in candidates:
        if not isinstance(raw_item, dict) or raw_item.get("media_type") != "track":
            continue
        if (item := music_item(raw_item, provider_id)) and item["uri"] not in seen:
            result.append(item)
            seen.add(item["uri"])
    return result


def selection_from(store, alarm_id):
    data = store.data.get(SELECTION_KEY, {})
    item = data.get(alarm_id) if isinstance(data, dict) else None
    if not isinstance(item, dict):
        return None
    # Keep the saved choice after removing it from the wake-song list. The
    # account is rechecked at playback; removal must not cancel a wake-up.
    return {k: item[k] for k in ("uri", "media_type", "title") if isinstance(item.get(k), str)}


async def apple_target(hass, entry, alarm, owner):
    from . import resolve_player

    if not entry.data.get(CONF_MASS_ENTRY):
        raise AccessError("music_assistant_missing", "Bitte Music Assistant verbinden.")
    account = account_for(entry.options.get(CONF_ACCOUNTS, []), owner.id)
    mass = music_assistant_client(hass, entry.data[CONF_MASS_ENTRY])
    user, _ = await checked_account(mass, account)
    source, target = resolve_player(hass, SimpleNamespace(user=owner), entry, alarm["source_entity"])
    for entity in (source, target):
        for policy in (POLICY_READ, POLICY_CONTROL):
            if not owner.permissions.check_entity(entity.entity_id, policy):
                raise AccessError("unauthorized", "Der Wecker-Benutzer darf diese Box nicht steuern.")
    player_filter = value(user, "player_filter", []) or []
    if player_filter and target.unique_id not in player_filter:
        raise AccessError("unauthorized", "Die Box ist für dieses Music-Assistant-Konto nicht freigegeben.")
    return mass, account, target


async def alarm_data(hass, caller, alarm_id, uri=None):
    entry, alarm = configured_alarm(hass, alarm_id)
    owner = await alarm_owner(hass, alarm, caller)
    source = checked_source(hass, alarm, owner)
    account = account_for(entry.options.get(CONF_ACCOUNTS, []), owner.id)
    store = await async_user_store(hass, owner.id)
    if uri is not None:
        locks = hass.data.setdefault(f"{DOMAIN}_alarm_locks", {})
        async with locks.setdefault(owner.id, asyncio.Lock()):
            item = next((f for f in songs_from(store, account["provider_id"]) if f["uri"] == uri), None)
            if uri and not item:
                raise AccessError("invalid_favorite", "Wähle einen einzelnen Titel aus deiner persönlichen Wecklied-Liste.")
            if item:
                await apple_target(hass, entry, alarm, owner)
            saved = store.data.get(SELECTION_KEY, {})
            saved = dict(saved) if isinstance(saved, dict) else {}
            if item:
                saved[alarm_id] = item
            else:
                saved.pop(alarm_id, None)
            await store.async_set_item(SELECTION_KEY, saved)
    selection = selection_from(store, alarm_id)
    favorites = songs_from(store, account["provider_id"])
    return {"alarm_id": alarm_id, "owner": owner.name or owner.id,
            "source": hass.states.get(source.entity_id).attributes.get("friendly_name", source.entity_id)
            if hass.states.get(source.entity_id) else source.entity_id,
            "selection": selection, "songs": favorites, "favorites": favorites,
            "selection_compatible": not selection or music_item({"kind": "apple_music", **selection}, account["provider_id"]) is not None,
            "in_songs": not selection or any(f["uri"] == selection.get("uri") for f in favorites),
            "in_favorites": not selection or any(f["uri"] == selection.get("uri") for f in favorites)}


@websocket_api.websocket_command({
    vol.Required("type"): "music_manager/alarm",
    vol.Required("action"): vol.In(["get", "select"]),
    vol.Required("alarm_id"): str,
    vol.Optional("uri", default=""): vol.All(str, vol.Length(max=1024)),
})
@websocket_api.async_response
async def websocket_alarm(hass, connection, msg):
    try:
        async with asyncio.timeout(30):
            result = await alarm_data(hass, connection.user, msg["alarm_id"], msg.get("uri", "") if msg["action"] == "select" else None)
        connection.send_result(msg["id"], result)
    except AccessError as err:
        connection.send_error(msg["id"], err.code, str(err))
    except Exception:
        connection.send_error(msg["id"], "alarm_error", "Die Weckmusik konnte nicht geladen oder gespeichert werden. Bitte Verbindung und Zuordnung prüfen.")


async def play_alarm(hass, call):
    """Only a fixed, admin-configured alarm can be started without a session."""
    try:
        async with asyncio.timeout(30):
            entry, alarm = configured_alarm(hass, call.data["alarm_id"])
            caller = None
            if call.context.user_id:
                caller = await hass.auth.async_get_user(call.context.user_id)
                if caller is None:
                    raise AccessError("unauthorized", "Der aufrufende Benutzer ist nicht verfügbar.")
            owner = await alarm_owner(hass, alarm, caller)
            source = checked_source(hass, alarm, owner)
            store = await async_user_store(hass, owner.id)
            selected = selection_from(store, alarm["alarm_id"])
            if selected is None:
                await hass.services.async_call("media_player", "media_play", {"entity_id": source.entity_id}, blocking=True, context=call.context)
                return
            mass, account, target = await apple_target(hass, entry, alarm, owner)
            uri = validate_uri(selected.get("uri"), account["provider_id"])
            # Previously saved albums/playlists continue until explicitly
            # replaced; new selections can only come from marked single songs.
            if selected.get("media_type") not in ("track", "album", "playlist") or not uri.startswith(f"{account['provider_id']}://{selected['media_type']}/"):
                raise AccessError("invalid_favorite", "Die gespeicherte Weckmusik ist ungültig. Bitte neu auswählen.")
            player = mass.players.get(target.unique_id)
            if not player or not value(player, "available", False):
                raise AccessError("player_unavailable", "Die Wecker-Box ist in Music Assistant nicht erreichbar.")
            await mass.player_queues.play_media(queue_id=target.unique_id, media=uri, option="replace", user=account["ma_user_id"])
    except AccessError as err:
        raise HomeAssistantError(str(err)) from err
    except Exception as err:
        raise HomeAssistantError("Weckmusik konnte nicht gestartet werden. Bitte Music Assistant, Kontozuordnung und Box prüfen.") from err


def async_register_alarms(hass):
    websocket_api.async_register_command(hass, websocket_alarm)

    async def handle(call):
        await play_alarm(hass, call)

    hass.services.async_register(DOMAIN, "play_alarm", handle, schema=vol.Schema({vol.Required("alarm_id"): str}))
