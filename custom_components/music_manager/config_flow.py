"""Admin-managed personal accounts and alarms, with a saved configuration overview."""

import asyncio
import html
import re

import probatio as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers import selector

from .access import AccessError, checked_account, is_supported_user, value
from .const import CONF_ACCOUNTS, CONF_ALARMS, CONF_MASS_ENTRY, DOMAIN
from .helpers import music_assistant_client


def select(options):
    return selector.SelectSelector(selector.SelectSelectorConfig(options=options, mode=selector.SelectSelectorMode.DROPDOWN))


def markdown_text(text):
    """Treat names from users, providers and favorites as text in HA Markdown."""
    return re.sub(r"([\\`*_{}\[\]()#+.!|~\-])", r"\\\1",
                  html.escape(" ".join(str(text).split()), quote=False))


def with_saved_choice(options, saved):
    """Keep a removed choice visible until the administrator replaces it."""
    if saved and saved not in {o["value"] for o in options}:
        return [*options, {"value": saved, "label": f"{saved} ⚠"}]
    return options


def required_with_default(key, defaults):
    return vol.Required(key, default=defaults[key]) if defaults.get(key) else vol.Required(key)


def connection_options(hass):
    return [{"value": "", "label": "Nur Radio – Apple Music später einrichten"}] + [
        {"value": e.entry_id, "label": e.title}
        for e in hass.config_entries.async_entries("music_assistant")
    ]


async def validate_connection(hass, entry_id):
    if entry_id:
        mass = music_assistant_client(hass, entry_id)
        await mass.auth.list_users()


class MusicManagerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        options = connection_options(self.hass)
        errors = {}
        if user_input is not None:
            try:
                if user_input.get(CONF_MASS_ENTRY, "") not in {o["value"] for o in options}:
                    raise ValueError("Unknown Music Assistant entry")
                await validate_connection(self.hass, user_input.get(CONF_MASS_ENTRY))
            except Exception:
                errors["base"] = "cannot_connect"
            else:
                return self.async_create_entry(title="Music Manager", data={CONF_MASS_ENTRY: user_input.get(CONF_MASS_ENTRY, "")})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({vol.Required(CONF_MASS_ENTRY, default=""): select(options)}), errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return MusicManagerOptionsFlow()


class MusicManagerOptionsFlow(config_entries.OptionsFlow):
    async def async_step_init(self, user_input=None):
        self._editing_account_id = None
        self._editing_alarm_id = None
        accounts = self.config_entry.options.get(CONF_ACCOUNTS, [])
        alarms = self.config_entry.options.get(CONF_ALARMS, [])
        users = {u.id: u.name or u.id for u in await self.hass.auth.async_get_users()}
        entry_id = self.config_entry.data.get(CONF_MASS_ENTRY, "")
        entries = self.hass.config_entries.async_entries("music_assistant")
        connection = next((e.title for e in entries if e.entry_id == entry_id), entry_id or "—")
        ma_names, provider_names = {}, {}
        if entry_id:
            try:
                mass = music_assistant_client(self.hass, entry_id)
                provider_names = {value(p, "instance_id"): value(p, "name") or value(p, "instance_id")
                                  for p in mass.providers if value(p, "domain") == "apple_music"}
                async with asyncio.timeout(5):
                    ma_users = await mass.auth.list_users()
                ma_names = {value(u, "user_id"): value(u, "display_name") or value(u, "username") or value(u, "user_id")
                            for u in ma_users}
            except Exception:
                # Saved assignments remain visible even while MA is offline.
                pass
        account_rows = ["- " + " → ".join(markdown_text(names.get(a.get(key), a.get(key) or "—"))
                        for key, names in (("ha_user_id", users), ("ma_user_id", ma_names), ("provider_id", provider_names)))
                        for a in accounts]
        from .alarms import selection_from
        from homeassistant.components.frontend.storage import async_user_store

        stores = {}
        alarm_rows = []
        for alarm in alarms:
            owner = alarm.get("ha_user_id", "")
            music = "—"
            if owner in users:
                try:
                    if owner not in stores:
                        stores[owner] = await async_user_store(self.hass, owner)
                    music = (selection_from(stores[owner], alarm.get("alarm_id")) or {}).get("title") or "—"
                except Exception:
                    music = "⚠"
            source = alarm.get("source_entity", "")
            state = self.hass.states.get(source)
            speaker = state.attributes.get("friendly_name", source) if state else source
            alarm_rows.append("- **" + markdown_text(alarm.get("alarm_id", "—")) + "** · "
                              + markdown_text(users.get(owner, owner or "—")) + " → "
                              + markdown_text(speaker or "—") + " · " + markdown_text(music))
        menu = ["connect", "add"]
        if accounts:
            menu += ["edit", "remove"]
        menu += ["alarm"]
        if alarms:
            menu += ["alarm_edit", "alarm_remove"]
        return self.async_show_menu(step_id="init", menu_options=menu, description_placeholders={
            "connection": markdown_text(connection), "account_count": str(len(accounts)),
            "accounts": "\n".join(account_rows) or "—", "alarm_count": str(len(alarms)),
            "alarms": "\n".join(alarm_rows) or "—"})

    async def async_step_edit(self, user_input=None):
        accounts = self.config_entry.options.get(CONF_ACCOUNTS, [])
        if not accounts:
            return self.async_abort(reason="no_accounts")
        if user_input is not None:
            selected = user_input.get("ha_user_id")
            if selected not in {a["ha_user_id"] for a in accounts}:
                return self.async_abort(reason="invalid_account")
            self._editing_account_id = selected
            return await self.async_step_account_edit()
        names = {u.id: u.name or u.id for u in await self.hass.auth.async_get_users()}
        return self.async_show_form(step_id="edit", data_schema=vol.Schema({vol.Required("ha_user_id"): select([
            {"value": a["ha_user_id"], "label": names.get(a["ha_user_id"], a["ha_user_id"])} for a in accounts])}))

    async def async_step_connect(self, user_input=None):
        options = connection_options(self.hass)
        errors = {}
        if user_input is not None:
            try:
                selected = user_input.get(CONF_MASS_ENTRY, "")
                if selected not in {o["value"] for o in options}:
                    raise ValueError("Unknown Music Assistant entry")
                await validate_connection(self.hass, selected)
            except Exception:
                errors["base"] = "cannot_connect"
            else:
                saved_options = dict(self.config_entry.options)
                if selected != self.config_entry.data.get(CONF_MASS_ENTRY, ""):
                    saved_options[CONF_ACCOUNTS] = []
                self.hass.config_entries.async_update_entry(self.config_entry, data={**self.config_entry.data, CONF_MASS_ENTRY: selected})
                return self.async_create_entry(title="", data=saved_options)
        return self.async_show_form(step_id="connect", data_schema=vol.Schema({vol.Required(CONF_MASS_ENTRY, default=self.config_entry.data.get(CONF_MASS_ENTRY, "")): select(options)}), errors=errors)

    async def async_step_add(self, user_input=None):
        return await self._async_account_form(user_input)

    async def async_step_account_edit(self, user_input=None):
        editing = getattr(self, "_editing_account_id", None)
        if not editing:
            return self.async_abort(reason="invalid_account")
        return await self._async_account_form(user_input, editing)

    async def _async_account_form(self, user_input, editing=None):
        errors = {}
        accounts = list(self.config_entry.options.get(CONF_ACCOUNTS, []))
        saved = next((a for a in accounts if a["ha_user_id"] == editing), {})
        if editing and not saved:
            return self.async_abort(reason="invalid_account")
        defaults = {**saved, **(user_input or {})}
        if editing:
            defaults["ha_user_id"] = editing
        if not self.config_entry.data.get(CONF_MASS_ENTRY):
            return self.async_abort(reason="music_assistant_missing")
        try:
            mass = music_assistant_client(self.hass, self.config_entry.data[CONF_MASS_ENTRY])
            users = await self.hass.auth.async_get_users()
            ha_options = [{"value": u.id, "label": u.name or u.id} for u in users if u.is_active and not u.system_generated]
            ma_users = await mass.auth.list_users()
            ma_options = [{"value": value(u, "user_id"), "label": value(u, "display_name") or value(u, "username")}
                          for u in ma_users if is_supported_user(u)]
            providers = [{"value": value(p, "instance_id"), "label": value(p, "name")}
                         for p in mass.providers if value(p, "domain") == "apple_music" and value(p, "available", False)]
            if not ma_options or not providers:
                return self.async_abort(reason="accounts_missing")
            if user_input is not None:
                valid = (not editing or user_input.get("ha_user_id") == editing) and all(user_input[k] in {o["value"] for o in opts} for k, opts in (
                    ("ha_user_id", ha_options), ("ma_user_id", ma_options), ("provider_id", providers)))
                if not valid:
                    errors["base"] = "invalid_account"
                elif any(a["ha_user_id"] != user_input["ha_user_id"] and (
                    a["ma_user_id"] == user_input["ma_user_id"] or a["provider_id"] == user_input["provider_id"]) for a in accounts):
                    errors["base"] = "duplicate_account"
                else:
                    try:
                        await checked_account(mass, user_input)
                    except AccessError as err:
                        errors["base"] = err.code
                    else:
                        accounts = [dict(user_input) if a["ha_user_id"] == user_input["ha_user_id"] else a for a in accounts]
                        if not any(a["ha_user_id"] == user_input["ha_user_id"] for a in accounts):
                            accounts.append(dict(user_input))
                        return self.async_create_entry(title="", data={**self.config_entry.options, CONF_ACCOUNTS: accounts})
        except Exception:
            return self.async_abort(reason="cannot_connect")
        return self.async_show_form(step_id="account_edit" if editing else "add", data_schema=vol.Schema({
            required_with_default("ha_user_id", defaults): select(
                with_saved_choice([o for o in ha_options if not editing or o["value"] == editing], defaults.get("ha_user_id"))),
            required_with_default("ma_user_id", defaults): select(with_saved_choice(ma_options, defaults.get("ma_user_id"))),
            required_with_default("provider_id", defaults): select(with_saved_choice(providers, defaults.get("provider_id")))}), errors=errors)

    async def async_step_remove(self, user_input=None):
        accounts = list(self.config_entry.options.get(CONF_ACCOUNTS, []))
        if not accounts:
            return self.async_abort(reason="no_accounts")
        if user_input is not None:
            return self.async_create_entry(title="", data={**self.config_entry.options, CONF_ACCOUNTS: [a for a in accounts if a["ha_user_id"] != user_input["ha_user_id"]]})
        names = {u.id: u.name or u.id for u in await self.hass.auth.async_get_users()}
        return self.async_show_form(step_id="remove", data_schema=vol.Schema({vol.Required("ha_user_id"): select([
            {"value": a["ha_user_id"], "label": names.get(a["ha_user_id"], a["ha_user_id"])} for a in accounts])}))


    async def async_step_alarm_edit(self, user_input=None):
        alarms = self.config_entry.options.get(CONF_ALARMS, [])
        if not alarms:
            return self.async_abort(reason="no_alarms")
        if user_input is not None:
            selected = user_input.get("alarm_id")
            if selected not in {a["alarm_id"] for a in alarms}:
                return self.async_abort(reason="invalid_alarm")
            self._editing_alarm_id = selected
            return await self.async_step_alarm_update()
        names = {u.id: u.name or u.id for u in await self.hass.auth.async_get_users()}
        return self.async_show_form(step_id="alarm_edit", data_schema=vol.Schema({vol.Required("alarm_id"): select([
            {"value": a["alarm_id"], "label": a["alarm_id"] + " · " + names.get(a["ha_user_id"], a["ha_user_id"])} for a in alarms])}))

    async def async_step_alarm(self, user_input=None):
        return await self._async_alarm_form(user_input)

    async def async_step_alarm_update(self, user_input=None):
        editing = getattr(self, "_editing_alarm_id", None)
        if not editing:
            return self.async_abort(reason="invalid_alarm")
        return await self._async_alarm_form(user_input, editing)

    async def _async_alarm_form(self, user_input, editing=None):
        from .alarms import ALARM_ID, apple_target, checked_source
        from homeassistant.helpers import entity_registry as er

        accounts = self.config_entry.options.get(CONF_ACCOUNTS, [])
        saved = next((a for a in self.config_entry.options.get(CONF_ALARMS, []) if a["alarm_id"] == editing), {})
        if editing and not saved:
            return self.async_abort(reason="invalid_alarm")
        defaults = {"alarm_id": "school_alarm", **saved, **(user_input or {})}
        if editing:
            defaults["alarm_id"] = editing
        users = {u.id: u for u in await self.hass.auth.async_get_users()
                 if u.is_active and not u.system_generated}
        owners = [{"value": a["ha_user_id"], "label": users[a["ha_user_id"]].name or a["ha_user_id"]}
                  for a in accounts if a.get("ha_user_id") in users]
        if not owners:
            return self.async_abort(reason="no_accounts")
        sources = [{"value": e.entity_id, "label": self.hass.states.get(e.entity_id).attributes.get("friendly_name", e.entity_id)
                    if self.hass.states.get(e.entity_id) else e.entity_id}
                   for e in er.async_get(self.hass).entities.values()
                   if e.platform == "sonos" and not e.disabled_by and e.entity_id.startswith("media_player.")]
        errors = {}
        if user_input is not None:
            try:
                if (not ALARM_ID.fullmatch(user_input.get("alarm_id", ""))
                    or (editing and user_input.get("alarm_id") != editing)
                    or user_input.get("ha_user_id") not in {o["value"] for o in owners}
                    or user_input.get("source_entity") not in {s["value"] for s in sources}):
                    raise ValueError("Invalid alarm")
                owner = users[user_input["ha_user_id"]]
                checked_source(self.hass, user_input, owner)
                await apple_target(self.hass, self.config_entry, user_input, owner)
            except Exception:
                errors["base"] = "invalid_alarm"
            else:
                alarms = [dict(user_input) if a["alarm_id"] == user_input["alarm_id"] else a
                          for a in self.config_entry.options.get(CONF_ALARMS, [])]
                if not any(a["alarm_id"] == user_input["alarm_id"] for a in alarms):
                    alarms.append(dict(user_input))
                return self.async_create_entry(title="", data={**self.config_entry.options, CONF_ALARMS: alarms})
        return self.async_show_form(step_id="alarm_update" if editing else "alarm", data_schema=vol.Schema({
            vol.Required("alarm_id", default=defaults["alarm_id"]): select([{"value": editing, "label": editing}]) if editing else str,
            required_with_default("ha_user_id", defaults): select(with_saved_choice(owners, defaults.get("ha_user_id"))),
            required_with_default("source_entity", defaults): select(with_saved_choice(sources, defaults.get("source_entity"))),
        }), errors=errors)

    async def async_step_alarm_remove(self, user_input=None):
        alarms = self.config_entry.options.get(CONF_ALARMS, [])
        if not alarms:
            return self.async_abort(reason="no_alarms")
        if user_input is not None:
            if user_input.get("alarm_id") not in {a["alarm_id"] for a in alarms}:
                return self.async_abort(reason="invalid_alarm")
            return self.async_create_entry(title="", data={**self.config_entry.options, CONF_ALARMS: [
                a for a in alarms if a["alarm_id"] != user_input["alarm_id"]]})
        names = {u.id: u.name or u.id for u in await self.hass.auth.async_get_users()}
        return self.async_show_form(step_id="alarm_remove", data_schema=vol.Schema({
            vol.Required("alarm_id"): select([{"value": a["alarm_id"],
                "label": a["alarm_id"] + " · " + names.get(a["ha_user_id"], a["ha_user_id"])} for a in alarms])}))
