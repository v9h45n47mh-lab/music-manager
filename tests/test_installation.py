"""Installation, frontend migration and optional Music Assistant regression tests."""
import asyncio
import importlib.util
import json
from pathlib import Path
import sys
import types
from types import SimpleNamespace as NS
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock

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
    http = module('homeassistant.components.http')
    http.StaticPathConfig = lambda url, path, cache_headers: NS(url=url, path=path, cache_headers=cache_headers)
    module('homeassistant.components.lovelace').LOVELACE_DATA = 'lovelace'
    module('homeassistant.components.lovelace.resources').ResourceStorageCollection = Resources
    module('homeassistant.core').callback = lambda fn: fn
    selectors = module('homeassistant.helpers.selector')
    selectors.SelectSelector = selectors.SelectSelectorConfig = lambda *args, **kw: kw or args[0]
    selectors.SelectSelectorMode = NS(DROPDOWN='dropdown')
    module('homeassistant.exceptions').ConfigEntryNotReady = type('ConfigEntryNotReady', (Exception,), {})
    vol = module('probatio')
    vol.Required = vol.Optional = lambda key, **kwargs: key
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
                  http=NS(async_register_static_paths=AsyncMock()), extra=set())

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

    async def test_frontend_failure_requests_setup_retry_without_registering_an_entry(self):
        hass = self.make_hass()
        hass.http.async_register_static_paths.side_effect = OSError('temporary file failure')
        entry = NS(entry_id='manager', data={}, options={})
        with self.assertRaises(sys.modules['homeassistant.exceptions'].ConfigEntryNotReady):
            await self.package.async_setup_entry(hass, entry)
        self.assertNotIn('manager', hass.data.get('music_manager', {}))
        self.assertFalse(hass.extra)
