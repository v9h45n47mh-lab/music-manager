"""Admin-managed 1:1 HA user to Apple Music provider assignments."""

import probatio as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers import selector

from .access import AccessError, checked_account, is_supported_user, value
from .const import CONF_ACCOUNTS, CONF_MASS_ENTRY, DOMAIN
from .helpers import music_assistant_client


def select(options):
    return selector.SelectSelector(selector.SelectSelectorConfig(options=options, mode=selector.SelectSelectorMode.DROPDOWN))


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
        return self.async_show_menu(step_id="init", menu_options=["connect", "add", "remove"])

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
        errors = {}
        accounts = list(self.config_entry.options.get(CONF_ACCOUNTS, []))
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
                valid = all(user_input[k] in {o["value"] for o in opts} for k, opts in (
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
                        accounts = [a for a in accounts if a["ha_user_id"] != user_input["ha_user_id"]] + [user_input]
                        return self.async_create_entry(title="", data={CONF_ACCOUNTS: accounts})
        except Exception:
            return self.async_abort(reason="cannot_connect")
        return self.async_show_form(step_id="add", data_schema=vol.Schema({
            vol.Required("ha_user_id"): select(ha_options), vol.Required("ma_user_id"): select(ma_options),
            vol.Required("provider_id"): select(providers)}), errors=errors)

    async def async_step_remove(self, user_input=None):
        accounts = list(self.config_entry.options.get(CONF_ACCOUNTS, []))
        if not accounts:
            return self.async_abort(reason="no_accounts")
        if user_input is not None:
            return self.async_create_entry(title="", data={CONF_ACCOUNTS: [a for a in accounts if a["ha_user_id"] != user_input["ha_user_id"]]})
        names = {u.id: u.name or u.id for u in await self.hass.auth.async_get_users()}
        return self.async_show_form(step_id="remove", data_schema=vol.Schema({vol.Required("ha_user_id"): select([
            {"value": a["ha_user_id"], "label": names.get(a["ha_user_id"], a["ha_user_id"])} for a in accounts])}))
