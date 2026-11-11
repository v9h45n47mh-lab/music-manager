"""Read-only administrator overview. Writes use Home Assistant's options flows."""

import asyncio

import probatio as vol

from homeassistant.components import websocket_api
from homeassistant.components.frontend.storage import async_user_store

from .access import AccessError, value
from .alarms import selection_from
from .const import CONF_ACCOUNTS, CONF_ALARMS, CONF_MASS_ENTRY, DOMAIN, VERSION
from .helpers import music_assistant_client


async def configuration_snapshot(hass, entry):
    """Expose labels and configured IDs, never MA credentials or favorite URIs."""
    users = {u.id: u for u in await hass.auth.async_get_users()}
    entry_id = entry.data.get(CONF_MASS_ENTRY, "")
    connection = next((e.title for e in hass.config_entries.async_entries("music_assistant")
                       if e.entry_id == entry_id), entry_id)
    ma_users, providers = {}, {}
    reachable = not entry_id
    if entry_id:
        try:
            mass = music_assistant_client(hass, entry_id)
            providers = {value(p, "instance_id"): p for p in mass.providers
                         if value(p, "domain") == "apple_music"}
            async with asyncio.timeout(5):
                ma_users = {value(u, "user_id"): u for u in await mass.auth.list_users()}
            reachable = True
        except Exception:
            pass
    accounts = []
    for record in entry.options.get(CONF_ACCOUNTS, []):
        ha_id, ma_id, provider_id = (record.get(k, "") for k in ("ha_user_id", "ma_user_id", "provider_id"))
        user, ma_user, provider = users.get(ha_id), ma_users.get(ma_id), providers.get(provider_id)
        accounts.append({"ha_user_id": ha_id, "ma_user_id": ma_id, "provider_id": provider_id,
                         "ha_name": (user.name or user.id) if user else ha_id,
                         "ma_name": value(ma_user, "display_name") or value(ma_user, "username") or ma_id,
                         "provider_name": value(provider, "name") or provider_id})
    alarms, stores = [], {}
    for record in entry.options.get(CONF_ALARMS, []):
        alarm_id, owner_id, source = (record.get(k, "") for k in ("alarm_id", "ha_user_id", "source_entity"))
        owner, state = users.get(owner_id), hass.states.get(source)
        selected, readable = None, owner is not None
        if owner:
            try:
                if owner_id not in stores:
                    stores[owner_id] = await async_user_store(hass, owner_id)
                selected = selection_from(stores[owner_id], alarm_id)
            except Exception:
                readable = False
        alarms.append({"alarm_id": alarm_id, "ha_user_id": owner_id, "source_entity": source,
                       "owner_name": (owner.name or owner.id) if owner else owner_id,
                       "source_name": state.attributes.get("friendly_name", source) if state else source,
                       "music_title": selected.get("title") if selected else None,
                       "music_readable": readable})
    return {"entry_id": entry.entry_id, "version": VERSION,
            "connection": {"id": entry_id, "name": connection, "reachable": reachable},
            "accounts": accounts, "alarms": alarms}


@websocket_api.websocket_command({vol.Required("type"): "music_manager/configuration"})
@websocket_api.async_response
async def websocket_configuration(hass, connection, msg):
    try:
        user = connection.user
        if not user or not user.is_admin or not user.is_active or user.system_generated:
            raise AccessError("unauthorized", "Die Music-Manager-Konfiguration ist nur für Administratoren verfügbar.")
        entries = list(hass.data.get(DOMAIN, {}).values())
        if len(entries) != 1:
            raise AccessError("not_configured", "Bitte Music Manager zuerst unter Geräte & Dienste einrichten.")
        async with asyncio.timeout(20):
            result = await configuration_snapshot(hass, entries[0])
        connection.send_result(msg["id"], result)
    except AccessError as err:
        connection.send_error(msg["id"], err.code, str(err))
    except Exception:
        connection.send_error(msg["id"], "configuration_error", "Die Konfiguration konnte nicht geladen werden. Bitte erneut versuchen.")
