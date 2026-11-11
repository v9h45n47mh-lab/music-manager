"""Installation, frontend migration and optional Music Assistant regression tests."""
import asyncio
import importlib.util
import json
from pathlib import Path
import sys
import types
from types import SimpleNamespace as NS
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock, Mock

ROOT = Path(__file__).parents[1]
COMPONENT = ROOT / 'custom_components/music_manager'


class Resources:
    def __init__(self, items=()):
        self.items = [dict(item) for item in items]
        self.loaded = False
        self.writes = []

    async def async_get_info(self):
        self.loaded = True
        return {'resources': len(self.items)}

    def async_items(self):
        assert self.loaded, 'collection must be loaded before reading'
        return self.items

    async def async_create_item(self, data):
        self.writes.append(('create', dict(data)))
        item = {'id': 'created', 'url': data['url'], 'type': data['res_type']}
        self.items.append(item)
        return item

    async def async_update_item(self, item_id, data):
        self.writes.append(('update', item_id, dict(data)))
        item = next(item for item in self.items if item['id'] == item_id)
        item.update(url=data['url'], type=data['res_type'])
        return item

    async def async_delete_item(self, item_id):
        self.writes.append(('delete', item_id))
        self.items = [item for item in self.items if item['id'] != item_id]


class YAMLResources:
    def __init__(self, data):
        self.data = data

    def async_items(self):
        return self.data


def load_installation():
    def module(name):
        obj = types.ModuleType(name)
        sys.modules[name] = obj
        return obj

    for name in ('homeassistant', 'homeassistant.components', 'homeassistant.helpers',
                 'homeassistant.auth', 'homeassistant.auth.permissions'):
        module(name)
    const = module('homeassistant.auth.permissions.const')
    const.POLICY_CONTROL, const.POLICY_READ = 'control', 'read'
    ws = module('homeassistant.components.websocket_api')
    ws.websocket_command = lambda schema: lambda fn: fn
    ws.async_response = lambda fn: fn
    ws.async_register_command = lambda *args: None
    module('homeassistant.helpers.entity_registry')
    frontend = module('homeassistant.components.frontend')
    frontend.add_extra_js_url = lambda hass, url: hass.extra.add(url)
    frontend.remove_extra_js_url = lambda hass, url: hass.extra.remove(url)
    frontend.async_remove_panel = lambda hass, path: hass.panels.pop(path, None)
    async def register_panel(hass, **kwargs):
        hass.panels[kwargs['frontend_url_path']] = kwargs
    module('homeassistant.components.panel_custom').async_register_panel = AsyncMock(side_effect=register_panel)
    module('homeassistant.components.frontend.storage').async_user_store = AsyncMock()
    http = module('homeassistant.components.http')
    http.StaticPathConfig = lambda url, path, cache_headers: NS(url=url, path=path, cache_headers=cache_headers)
    module('homeassistant.components.lovelace').LOVELACE_DATA = 'lovelace'
    module('homeassistant.components.lovelace.resources').ResourceStorageCollection = Resources
    module('homeassistant.core').callback = lambda fn: fn
    selectors = module('homeassistant.helpers.selector')
    selectors.SelectSelector = selectors.SelectSelectorConfig = lambda *args, **kw: kw or args[0]
    selectors.SelectSelectorMode = NS(DROPDOWN='dropdown')
    exceptions = module('homeassistant.exceptions')
    exceptions.ConfigEntryNotReady = type('ConfigEntryNotReady', (Exception,), {})
    exceptions.HomeAssistantError = type('HomeAssistantError', (Exception,), {})
    vol = module('probatio')
    class Marker(str):
        def __new__(cls, key, **kwargs):
            result = str.__new__(cls, key)
            result.default = lambda: kwargs.get('default')
            return result
    vol.Required = vol.Optional = Marker
    vol.Schema = lambda value: value
    vol.In = vol.Length = vol.Range = lambda *args, **kwargs: None
    vol.All = lambda *args: None
    entries = module('homeassistant.config_entries')
    class Flow:
        def __init_subclass__(cls, **kwargs):
            pass
        def _async_current_entries(self):
            return []
        def async_show_form(self, **kwargs):
            return {'type': 'form', **kwargs}
        def async_abort(self, **kwargs):
            return {'type': 'abort', **kwargs}
        def async_create_entry(self, **kwargs):
            return {'type': 'create_entry', **kwargs}
        def async_show_menu(self, **kwargs):
            return {'type': 'menu', **kwargs}
    entries.ConfigFlow = entries.OptionsFlow = Flow
    # Import must work without MA or its external client library installed.
    for name in list(sys.modules):
        if name.startswith('homeassistant.components.music_assistant'):
            del sys.modules[name]
    name = 'installation_test'
    spec = importlib.util.spec_from_file_location(name, COMPONENT / '__init__.py', submodule_search_locations=[str(COMPONENT)])
    package = importlib.util.module_from_spec(spec)
    sys.modules[name] = package
    spec.loader.exec_module(package)
    frontend = importlib.import_module(name + '.frontend')
    flow = importlib.import_module(name + '.config_flow')
    return package, frontend, flow


class PackageTests(TestCase):
    def test_integration_contains_its_identical_self_contained_frontend_and_versions(self):
        version = json.loads((ROOT / 'package.json').read_text())['version']
        manifest = json.loads((COMPONENT / 'manifest.json').read_text())
        self.assertEqual(manifest['version'], version)
        self.assertNotIn('music_assistant', manifest['dependencies'])
        self.assertIn('music_assistant', manifest['after_dependencies'])
        self.assertEqual([p.name for p in (ROOT / 'custom_components').iterdir() if p.is_dir()], ['music_manager'])
        for name in ('music-manager-card.js', 'manifest.json', 'LICENSES.txt'):
            self.assertEqual((ROOT / 'dist' / name).read_bytes(), (COMPONENT / 'frontend' / name).read_bytes())
        card = (COMPONENT / 'frontend/music-manager-card.js').read_text()
        self.assertNotIn("from './core.js'", card)
        self.assertNotIn("from './family-ui/", card)
        self.assertIn("MUSIC_VERSION = '" + version + "'", card)


class InstallationTests(IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        cls.package, cls.frontend, cls.flow = load_installation()

    def make_hass(self, collection=None):
        return NS(data={'lovelace': NS(resources=collection if collection is not None else Resources())},
                  http=NS(async_register_static_paths=AsyncMock()), extra=set(), panels={})

    async def test_new_install_registers_bundled_card_without_music_assistant(self):
        hass = self.make_hass()
        entry = NS(entry_id='manager', data={'music_assistant_entry': ''}, options={'accounts': []})
        self.assertTrue(await self.package.async_setup_entry(hass, entry))
        self.assertEqual(hass.extra, {self.frontend.CARD_URL})
        self.assertEqual(hass.data['lovelace'].resources.items[0]['url'], self.frontend.CARD_URL)
        path = hass.http.async_register_static_paths.call_args.args[0][0]
        self.assertEqual(Path(path.path), COMPONENT / 'frontend')
        self.assertTrue((Path(path.path) / 'music-manager-card.js').is_file())
        self.assertEqual(hass.data['music_manager']['manager'], entry)
        self.assertNotIn('homeassistant.components.music_assistant.helpers', sys.modules)
        panel = hass.panels['music-manager']
        self.assertTrue(panel['require_admin'])
        self.assertEqual(panel['config_panel_domain'], 'music_manager')
        self.assertEqual(panel['module_url'], self.frontend.CARD_URL)
        self.assertEqual(panel['webcomponent_name'], 'music-manager-panel')

    async def test_legacy_resource_migration_preserves_unrelated_cards_and_user_data(self):
        other = {'id': 'other', 'url': '/hacsfiles/other-card/other-card.js', 'type': 'module'}
        foreign = {'id': 'foreign', 'url': 'https://example.org/local/music-manager/music-manager-card.js', 'type': 'module'}
        resources = Resources([other, foreign,
            {'id': 'old-a', 'url': '/hacsfiles/music-manager/music-manager-card.js?hacstag=120', 'type': 'module'},
            {'id': 'old-b', 'url': '/local/music-manager/music-manager-card.js?v=1.1.2', 'type': 'module'}])
        hass = self.make_hass(resources)
        favorites = {'manuel': ['SWR3', 'bigFM']}
        hass.data['favorite_user_data'] = favorites
        hass.data['dashboard_config'] = {'cards': [{'type': 'custom:music-manager-card', 'entity': 'media_player.office'}]}
        await self.frontend.async_register_frontend(hass)
        self.assertEqual(resources.items, [other, foreign, {'id': 'old-a', 'url': self.frontend.CARD_URL, 'type': 'module'}])
        self.assertIs(hass.data['favorite_user_data'], favorites)
        self.assertEqual(hass.data['dashboard_config']['cards'][0]['entity'], 'media_player.office')

    async def test_registration_and_reload_are_idempotent_and_keep_account_assignments(self):
        hass = self.make_hass()
        entry = NS(entry_id='manager', data={'music_assistant_entry': 'mass'}, options={'accounts': [{'ha_user_id': 'manuel'}]})
        await asyncio.gather(self.package.async_setup_entry(hass, entry), self.frontend.async_register_frontend(hass))
        self.assertEqual(hass.http.async_register_static_paths.await_count, 1)
        self.assertEqual(len(hass.data['lovelace'].resources.items), 1)
        self.assertEqual(len(hass.extra), 1)
        await self.package.async_unload_entry(hass, entry)
        self.assertFalse(hass.extra)
        self.assertNotIn('music-manager', hass.panels)
        self.assertEqual(hass.data['lovelace'].resources.items, [])
        await self.package.async_setup_entry(hass, entry)
        self.assertEqual(hass.http.async_register_static_paths.await_count, 1)
        self.assertEqual(entry.options['accounts'], [{'ha_user_id': 'manuel'}])
        self.assertEqual(entry.data['music_assistant_entry'], 'mass')

    async def test_yaml_resources_are_normalized_without_rewriting_user_configuration(self):
        original = [{'url': '/local/community/music-manager/music-manager-card.js', 'type': 'module'},
                    {'url': '/local/other.js', 'type': 'module'}]
        collection = YAMLResources(original)
        hass = self.make_hass(collection)
        await self.frontend.async_register_frontend(hass)
        self.assertEqual(original[0]['url'], '/local/community/music-manager/music-manager-card.js')
        self.assertEqual(collection.data[0]['url'], self.frontend.CARD_URL)
        self.assertEqual(collection.data[1], original[1])
        await self.frontend.async_unregister_frontend(hass)
        self.assertIs(collection.data, original)
        self.assertFalse(hass.extra)

    async def test_new_installation_can_start_radio_only_and_offer_later_ma_connection(self):
        flow = self.flow.MusicManagerConfigFlow()
        flow.hass = NS(config_entries=NS(async_entries=lambda domain: []))
        self.assertEqual((await flow.async_step_user())['type'], 'form')
        result = await flow.async_step_user({'music_assistant_entry': ''})
        self.assertEqual(result['type'], 'create_entry')
        self.assertEqual(result['data'], {'music_assistant_entry': ''})
        options = self.flow.MusicManagerOptionsFlow()
        options.config_entry = NS(data=result['data'], options={})
        options.hass = NS(auth=NS(async_get_users=AsyncMock(return_value=[])),
                          config_entries=flow.hass.config_entries)
        self.assertIn('connect', (await options.async_step_init())['menu_options'])
        self.assertEqual((await options.async_step_add())['reason'], 'music_assistant_missing')

    async def test_connection_changes_clear_only_account_assignments_for_a_different_server(self):
        mass = NS(auth=NS(list_users=AsyncMock(return_value=[])))
        self.flow.music_assistant_client = lambda hass, entry_id: mass
        entry = NS(data={'music_assistant_entry': 'old'}, options={'accounts': [{'ha_user_id': 'manuel'}], 'other': True})
        def update(obj, data):
            obj.data = data
        hass = NS(config_entries=NS(async_entries=lambda domain: [NS(entry_id='old', title='Old'), NS(entry_id='new', title='New')], async_update_entry=update))
        flow = self.flow.MusicManagerOptionsFlow()
        flow.config_entry, flow.hass = entry, hass
        same = await flow.async_step_connect({'music_assistant_entry': 'old'})
        self.assertEqual(same['data']['accounts'], entry.options['accounts'])
        changed = await flow.async_step_connect({'music_assistant_entry': 'new'})
        self.assertEqual(changed['data'], {'accounts': [], 'other': True})
        self.assertEqual(entry.data['music_assistant_entry'], 'new')
        invalid = await flow.async_step_connect({'music_assistant_entry': 'unknown'})
        self.assertEqual(invalid['type'], 'form')
        self.assertEqual(invalid['errors']['base'], 'cannot_connect')

    async def test_account_configuration_offers_admins_and_preserves_other_assignments(self):
        admin = NS(user_id='ma-manuel', username='manuel', display_name='Manuel',
                   enabled=True, role='admin', provider_filter=['apple_music--manuel'])
        regular = NS(user_id='ma-vera', username='vera', display_name='Vera', enabled=True, role='user')
        excluded = [NS(user_id=role, enabled=True, role=role) for role in ('guest', 'service')]
        excluded.append(NS(user_id='disabled-admin', enabled=False, role='admin'))
        mass = NS(auth=NS(list_users=AsyncMock(return_value=[admin, regular, *excluded]),
                          get_user=AsyncMock(return_value=admin)),
                  providers=[NS(instance_id='apple_music--manuel', name='Apple Music Manuel',
                                domain='apple_music', available=True)])
        self.flow.music_assistant_client = lambda hass, entry_id: mass
        other = {'ha_user_id': 'ha-vera', 'ma_user_id': 'ma-vera', 'provider_id': 'apple_music--vera'}
        flow = self.flow.MusicManagerOptionsFlow()
        flow.config_entry = NS(data={'music_assistant_entry': 'mass'}, options={'accounts': [other], 'alarms': [{'alarm_id': 'existing_alarm'}]})
        flow.hass = NS(auth=NS(async_get_users=AsyncMock(return_value=[
            NS(id='ha-manuel', name='Manuel', is_active=True, system_generated=False)])))
        form = await flow.async_step_add()
        choices = form['data_schema']['ma_user_id']['options']
        self.assertEqual({choice['value'] for choice in choices}, {'ma-manuel', 'ma-vera'})
        mapping = {'ha_user_id': 'ha-manuel', 'ma_user_id': 'ma-manuel', 'provider_id': 'apple_music--manuel'}
        saved = await flow.async_step_add(mapping)
        self.assertEqual(saved['type'], 'create_entry')
        self.assertEqual(saved['data']['accounts'], [other, mapping])
        self.assertEqual(saved['data']['alarms'], [{'alarm_id': 'existing_alarm'}])
        self.assertEqual(admin.role, 'admin')
        self.assertEqual(admin.provider_filter, ['apple_music--manuel'])
        # The list may be stale: validate the live account again when saving.
        admin.provider_filter = []
        refused = await flow.async_step_add(mapping)
        self.assertEqual(refused['errors']['base'], 'account_filter')
        admin.enabled = False
        mass.auth.list_users.return_value = [NS(user_id='ma-manuel', username='manuel', enabled=True, role='admin'), regular]
        refused = await flow.async_step_add(mapping)
        self.assertEqual(refused['errors']['base'], 'account_disabled')

    async def test_alarm_configuration_validates_owner_and_source_and_preserves_other_options(self):
        from unittest.mock import patch
        alarm_module = importlib.import_module('installation_test.alarms')
        owner = NS(id='ha-max', name='Maximilian', is_active=True, system_generated=False,
                   permissions=NS(check_entity=lambda entity, policy: True))
        source = NS(entity_id='media_player.max_sonos', platform='sonos', disabled_by=None, unique_id='RINCON_AABBCCDDEEFF01400')
        self.flow.hass = None
        flow = self.flow.MusicManagerOptionsFlow()
        options = {'accounts': [{'ha_user_id': owner.id}], 'alarms': [{'alarm_id': 'old_alarm'}], 'unrelated': True}
        flow.config_entry = NS(data={'music_assistant_entry': 'mass'}, options=options)
        hass = NS(auth=NS(async_get_users=AsyncMock(return_value=[owner])),
                  states=NS(get=lambda entity: NS(attributes={'friendly_name': 'Maximilian Sonos'})),
                  registry=NS(entities={source.entity_id: source}, async_get=lambda entity: source if entity==source.entity_id else None))
        flow.hass = hass
        sys.modules['homeassistant.helpers.entity_registry'].async_get = lambda target: target.registry
        mapping = {'alarm_id': 'school_alarm', 'ha_user_id': owner.id, 'source_entity': source.entity_id}
        with patch.object(alarm_module, 'apple_target', new=AsyncMock()) as check:
            result = await flow.async_step_alarm(mapping)
            self.assertEqual(result['type'], 'create_entry')
            self.assertEqual(result['data']['alarms'], [{'alarm_id': 'old_alarm'}, mapping])
            self.assertTrue(result['data']['unrelated'])
            self.assertEqual(result['data']['accounts'], options['accounts'])
            check.assert_awaited_once()
            for changes in ({'alarm_id': '../invalid'}, {'ha_user_id': 'ha-paul'}, {'source_entity': 'media_player.other'}):
                rejected = await flow.async_step_alarm({**mapping, **changes})
                self.assertEqual(rejected['errors']['base'], 'invalid_alarm')
        flow.config_entry.options = result['data']
        removed = await flow.async_step_alarm_remove({'alarm_id': 'school_alarm'})
        self.assertEqual(removed['data']['alarms'], [{'alarm_id': 'old_alarm'}])
        self.assertTrue(removed['data']['unrelated'])
        deleted_account = await flow.async_step_remove({'ha_user_id': owner.id})
        self.assertEqual(deleted_account['data']['alarms'], result['data']['alarms'])

    def configured_options_flow(self):
        users = [NS(id='ha-' + n, name=n.title(), is_active=True, system_generated=False,
                    permissions=NS(check_entity=lambda entity, policy: True)) for n in ('one', 'two')]
        sources = [NS(entity_id='media_player.box_' + n, platform='sonos', disabled_by=None,
                      unique_id='RINCON_AABBCCDDEEFF01400') for n in ('one', 'two')]
        ma_users = [NS(user_id='ma-' + n, username=n, display_name='MA ' + n.title(),
                       enabled=True, role='user', provider_filter=['apple_music--' + n]) for n in ('one', 'two')]
        mass = NS(auth=NS(list_users=AsyncMock(return_value=ma_users), get_user=AsyncMock(return_value=ma_users[0])),
                  providers=[NS(instance_id='apple_music--' + n, name='Apple ' + n.title(),
                                domain='apple_music', available=True) for n in ('one', 'two')])
        self.flow.music_assistant_client = lambda hass, entry_id: mass
        flow = self.flow.MusicManagerOptionsFlow()
        flow.config_entry = NS(data={'music_assistant_entry': 'mass'}, options={
            'accounts': [{'ha_user_id': 'ha-' + n, 'ma_user_id': 'ma-' + n, 'provider_id': 'apple_music--' + n}
                         for n in ('one', 'two')],
            'alarms': [{'alarm_id': 'wake_' + n, 'ha_user_id': 'ha-' + n, 'source_entity': 'media_player.box_' + n}
                       for n in ('one', 'two')], 'unrelated': {'keep': True}})
        registry = {s.entity_id: s for s in sources}
        flow.hass = NS(auth=NS(async_get_users=AsyncMock(return_value=users)),
                       config_entries=NS(async_entries=lambda domain: [NS(entry_id='mass', title='MA Home')]),
                       states=NS(get=lambda entity: NS(attributes={'friendly_name': entity.replace('media_player.', '')})),
                       registry=NS(entities=registry, async_get=registry.get))
        sys.modules['homeassistant.helpers.entity_registry'].async_get = lambda target: target.registry
        stores = {u.id: NS(data={'music_manager_alarm_music': {'wake_' + u.id[3:]:
                    {'uri': 'apple_music--' + u.id[3:] + '://playlist/morning', 'media_type': 'playlist',
                     'title': 'Morning ' + u.name}}}) for u in users}
        return flow, mass, stores, sources

    async def test_overview_shows_every_saved_mapping_alarm_and_music_without_writing(self):
        import copy
        from unittest.mock import patch
        flow, mass, stores, _ = self.configured_options_flow()
        before = copy.deepcopy(flow.config_entry.options)
        storage = sys.modules['homeassistant.components.frontend.storage']
        with patch.object(storage, 'async_user_store', new=AsyncMock(side_effect=lambda hass, owner: stores[owner])):
            overview = await flow.async_step_init()
            self.assertEqual(overview['type'], 'menu')
            self.assertEqual(overview['menu_options'], ['connect', 'add', 'edit', 'remove', 'alarm', 'alarm_edit', 'alarm_remove'])
            text = overview['description_placeholders']
            self.assertEqual(text['connection'], 'MA Home')
            self.assertEqual(text['account_count'], '2')
            self.assertEqual(text['alarm_count'], '2')
            for name in ('One', 'Two'):
                self.assertIn(name + ' → MA ' + name + ' → Apple ' + name, text['accounts'])
                self.assertIn('Morning ' + name, text['alarms'])
            self.assertIn('wake\\_one', text['alarms'])
            self.assertIn('box\\_two', text['alarms'])
            mass.auth.list_users.side_effect = ConnectionError('internal details must not appear')
            offline = (await flow.async_step_init())['description_placeholders']
            self.assertIn('ma\\-one', offline['accounts'])
            self.assertIn('Apple Two', offline['accounts'])
            def disconnected(hass, entry_id):
                raise ConnectionError('private connection error')
            self.flow.music_assistant_client = disconnected
            offline = (await flow.async_step_init())['description_placeholders']
            self.assertIn('apple\\_music\\-\\-two', offline['accounts'])
            self.assertIn('Morning Two', offline['alarms'])
            self.assertNotIn('internal details', str(offline))
        self.assertEqual(flow.config_entry.options, before)

    async def test_overview_treats_names_as_text_and_keeps_alarm_when_music_cannot_be_read(self):
        from unittest.mock import patch
        flow, mass, stores, _ = self.configured_options_flow()
        mass.providers[0].name = '[open](https://example.org) <script>bad</script>\n# title'
        storage = sys.modules['homeassistant.components.frontend.storage']
        with patch.object(storage, 'async_user_store', new=AsyncMock(side_effect=OSError('private storage error'))):
            overview = (await flow.async_step_init())['description_placeholders']
        self.assertIn('\\[open\\]\\(', overview['accounts'])
        self.assertIn('&lt;script&gt;', overview['accounts'])
        self.assertNotIn('<script>', overview['accounts'])
        self.assertIn('⚠', overview['alarms'])
        self.assertIn('wake\\_two', overview['alarms'])
        self.assertNotIn('private storage error', str(overview))

    async def test_editing_account_prefills_saved_choices_and_cannot_change_owner(self):
        flow, mass, _, _ = self.configured_options_flow()
        original = [dict(a) for a in flow.config_entry.options['accounts']]
        form = await flow.async_step_edit({'ha_user_id': 'ha-one'})
        defaults = {str(k): k.default() for k in form['data_schema']}
        self.assertEqual(defaults, original[0])
        self.assertEqual(form['data_schema']['ha_user_id']['options'], [{'value': 'ha-one', 'label': 'One'}])
        refused = await flow.async_step_account_edit(original[1])
        self.assertEqual(refused['errors']['base'], 'invalid_account')
        saved = await flow.async_step_account_edit(original[0])
        self.assertEqual(saved['data']['accounts'], original)
        self.assertEqual(saved['data']['alarms'], flow.config_entry.options['alarms'])
        self.assertEqual(saved['data']['unrelated'], {'keep': True})
        # A removed provider stays visible, but must not pass live validation.
        mass.providers = [NS(instance_id='apple_music--new', name='New', domain='apple_music', available=True)]
        missing = await flow.async_step_account_edit()
        self.assertIn({'value': 'apple_music--one', 'label': 'apple_music--one ⚠'}, missing['data_schema']['provider_id']['options'])
        self.assertEqual((await flow.async_step_account_edit(original[0]))['errors']['base'], 'invalid_account')
        # Returning to add must start a fresh assignment, without the edit defaults.
        fresh = await flow.async_step_add()
        self.assertTrue(all(k.default() is None for k in fresh['data_schema']))

    async def test_editing_alarm_keeps_id_prefills_box_and_updates_only_selected_alarm(self):
        from unittest.mock import patch
        flow, _, _, sources = self.configured_options_flow()
        original = [dict(a) for a in flow.config_entry.options['alarms']]
        sources[0].disabled_by = 'user'
        form = await flow.async_step_alarm_edit({'alarm_id': 'wake_one'})
        self.assertEqual({str(k): k.default() for k in form['data_schema']}, original[0])
        self.assertIn({'value': 'media_player.box_one', 'label': 'media_player.box_one ⚠'}, form['data_schema']['source_entity']['options'])
        alarm_module = importlib.import_module('installation_test.alarms')
        with patch.object(alarm_module, 'apple_target', new=AsyncMock()):
            changed = {**original[0], 'source_entity': 'media_player.box_two'}
            refused = await flow.async_step_alarm_update({**changed, 'alarm_id': 'new_id'})
            self.assertEqual(refused['errors']['base'], 'invalid_alarm')
            saved = await flow.async_step_alarm_update(changed)
        self.assertEqual(saved['data']['alarms'], [changed, original[1]])
        self.assertEqual(saved['data']['accounts'], flow.config_entry.options['accounts'])
        self.assertEqual(saved['data']['unrelated'], {'keep': True})
        self.assertEqual((await flow.async_step_alarm_edit({'alarm_id': 'missing'}))['reason'], 'invalid_alarm')

    async def test_configuration_panel_snapshot_is_admin_only_read_only_and_hides_credentials(self):
        import copy
        from unittest.mock import patch
        config = importlib.import_module('installation_test.configuration')
        flow, mass, stores, _ = self.configured_options_flow()
        entry = flow.config_entry
        entry.entry_id = 'manager'
        entry.data['password'] = 'PRIVATE-PASSWORD'
        entry.options['accounts'][0]['token'] = 'PRIVATE-TOKEN'
        mass.providers[0].password = 'PRIVATE-PROVIDER-PASSWORD'
        flow.hass.data = {'music_manager': {'manager': entry}}
        before = copy.deepcopy(entry.options)
        connection = NS(user=NS(is_admin=True, is_active=True, system_generated=False),
                        send_result=Mock(), send_error=Mock())
        with patch.object(config, 'music_assistant_client', return_value=mass), patch.object(
                config, 'async_user_store', new=AsyncMock(side_effect=lambda hass, owner: stores[owner])):
            await config.websocket_configuration(flow.hass, connection, {'id': 1, 'type': 'music_manager/configuration'})
            connection.send_error.assert_not_called()
            data = connection.send_result.call_args.args[1]
            self.assertEqual([a['ha_name'] for a in data['accounts']], ['One', 'Two'])
            self.assertEqual([a['music_title'] for a in data['alarms']], ['Morning One', 'Morning Two'])
            serialized = json.dumps(data)
            self.assertNotIn('PRIVATE-', serialized)
            self.assertNotIn('://playlist/', serialized)
            mass.auth.list_users.side_effect = ConnectionError('PRIVATE-UPSTREAM-ERROR')
            offline = await config.configuration_snapshot(flow.hass, entry)
            self.assertFalse(offline['connection']['reachable'])
            self.assertEqual(len(offline['accounts']), 2)
            self.assertEqual(len(offline['alarms']), 2)
            self.assertNotIn('PRIVATE-', json.dumps(offline))
        self.assertEqual(entry.options, before)
        for user in [None, NS(is_admin=False, is_active=True, system_generated=False),
                     NS(is_admin=True, is_active=False, system_generated=False),
                     NS(is_admin=True, is_active=True, system_generated=True)]:
            denied = NS(user=user, send_result=Mock(), send_error=Mock())
            await config.websocket_configuration(flow.hass, denied, {'id': 2})
            denied.send_result.assert_not_called()
            self.assertEqual(denied.send_error.call_args.args[1], 'unauthorized')

    async def test_frontend_failure_requests_setup_retry_without_registering_an_entry(self):
        hass = self.make_hass()
        hass.http.async_register_static_paths.side_effect = OSError('temporary file failure')
        entry = NS(entry_id='manager', data={}, options={})
        with self.assertRaises(sys.modules['homeassistant.exceptions'].ConfigEntryNotReady):
            await self.package.async_setup_entry(hass, entry)
        self.assertNotIn('manager', hass.data.get('music_manager', {}))
        self.assertFalse(hass.extra)
