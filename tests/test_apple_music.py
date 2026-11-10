"""Regression tests for per-user account isolation against MA client contracts."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace as NS
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock

PATH = Path(__file__).parents[1] / 'custom_components/music_manager/access.py'
spec = importlib.util.spec_from_file_location('music_manager_access', PATH)
access = importlib.util.module_from_spec(spec)
spec.loader.exec_module(access)


def account(user='ha-a', ma='ma-a', provider='apple_music--a'):
    return {'ha_user_id': user, 'ma_user_id': ma, 'provider_id': provider}


def mass_client():
    return NS(auth=NS(get_user=AsyncMock(return_value=NS(enabled=True, role='user', provider_filter=['apple_music--a']))),
              providers=[NS(instance_id='apple_music--a', domain='apple_music', available=True),
                         NS(instance_id='apple_music--b', domain='apple_music', available=True)],
              music=NS(search=AsyncMock(), get_library_tracks=AsyncMock(),
                       get_library_albums=AsyncMock(), get_library_playlists=AsyncMock()))


def item(provider='apple_music--a', item_id='42', kind='track', **changes):
    return dict(name='Song', media_type=kind, provider='library', item_id='99',
                provider_mappings=[dict(provider_instance=provider, item_id=item_id, available=True)], **changes)


class AssignmentTests(TestCase):
    def test_users_never_receive_another_users_or_default_mapping(self):
        mappings = [account(), account('ha-b', 'ma-b', 'apple_music--b')]
        self.assertEqual(access.account_for(mappings, 'ha-b')['provider_id'], 'apple_music--b')
        for unknown in ('ha-c', None, ''):
            with self.assertRaises(access.AccessError):
                access.account_for(mappings, unknown)
        with self.assertRaises(access.AccessError):
            access.account_for([account(), account('ha-b', 'ma-b')], 'ha-a')
        with self.assertRaises(access.AccessError):
            access.account_for([account(), account('ha-b', 'ma-a', 'apple_music--b')], 'ha-a')
        with self.assertRaises(access.AccessError):
            access.account_for([account(), account()], 'ha-a')

    def test_only_exact_account_catalog_uris_are_playable(self):
        for uri in ('apple_music--a://track/42', 'apple_music--a://playlist/pl.u-123', 'apple_music--a://album/12'):
            self.assertEqual(access.validate_uri(uri, 'apple_music--a'), uri)
        for uri in ('apple_music--b://track/42', 'library://track/42', 'apple_music://track/42',
                    'https://example.org/file', 'apple_music--a://track/../../42',
                    'apple_music--a://track/42?account=b', 'apple_music--a://artist/42',
                    'apple_music--a://track/42\n'):
            with self.assertRaises(access.AccessError):
                access.validate_uri(uri, 'apple_music--a')

    def test_serialization_removes_other_account_mappings_and_private_fields(self):
        obj = item(artists=[dict(name='Artist')], metadata={'token': 'NEVER-EXPOSE'})
        obj['provider_mappings'].append(dict(provider_instance='apple_music--b', item_id='secret'))
        result = access.catalog_item(obj, 'apple_music--a')
        self.assertEqual(result['uri'], 'apple_music--a://track/42')
        self.assertEqual(result['description'], 'Artist · Titel')
        self.assertNotIn('NEVER-EXPOSE', str(result))
        self.assertNotIn('secret', str(result))
        self.assertIsNone(access.catalog_item(item('apple_music--b'), 'apple_music--a'))
        obj['provider_mappings'][0]['available'] = False
        self.assertIsNone(access.catalog_item(obj, 'apple_music--a'))

    def test_sonos_pairing_is_hardware_based_and_not_name_based(self):
        self.assertEqual(access.sonos_uid('RINCON_AABBCCDDEEFF01400'), access.sonos_uid('sonos--rincon_aabbccddeeff01400'))
        self.assertNotEqual(access.sonos_uid('RINCON_AABBCCDDEEFF01400'), access.sonos_uid('RINCON_11223344556601400'))
        self.assertIsNone(access.sonos_uid('Wohnzimmer'))


class AccountTests(IsolatedAsyncioTestCase):
    async def test_provider_removal_never_falls_back_to_second_apple_account(self):
        mass = mass_client()
        await access.checked_account(mass, account())
        mass.providers.pop(0)
        with self.assertRaises(access.AccessError):
            await access.checked_account(mass, account())

    async def test_empty_wide_disabled_and_admin_accounts_fail_closed(self):
        mass = mass_client()
        for user in (None, NS(enabled=False, role='user', provider_filter=['apple_music--a']),
                     NS(enabled=True, role='admin', provider_filter=['apple_music--a']),
                     NS(enabled=True, role='user', provider_filter=[]),
                     NS(enabled=True, role='user', provider_filter=['apple_music--a', 'apple_music--b'])):
            mass.auth.get_user.return_value = user
            with self.assertRaises(access.AccessError):
                await access.checked_account(mass, account())
        mass.auth.get_user.assert_awaited_with('ma-a')

    async def test_search_always_impersonates_restricted_user_and_removes_other_provider_results(self):
        mass = mass_client()
        mass.music.search.return_value = NS(tracks=[item(), item('apple_music--b')], albums=[], playlists=[])
        results = await access.search(mass, account(), 'Artist')
        self.assertEqual(len(results['items']), 1)
        kwargs = mass.music.search.call_args.kwargs
        self.assertEqual(kwargs['user'], 'ma-a')
        self.assertFalse(kwargs['library_only'])
        self.assertEqual(kwargs['media_types'], ['track', 'album', 'playlist'])

    async def test_library_filters_exact_provider_user_and_real_pagination_offset(self):
        mass = mass_client()
        mass.music.get_library_playlists.return_value = [item(kind='playlist') for _ in range(50)]
        results = await access.library(mass, account(), 'playlist', 50)
        mass.music.get_library_playlists.assert_awaited_once_with(provider='apple_music--a', user='ma-a', limit=50, offset=50, order_by='sort_name')
        self.assertTrue(results['more'])
        self.assertEqual(results['next_offset'], 100)
        with self.assertRaises(access.AccessError):
            await access.library(mass, account(), 'unknown')

# Exercise the actual HA websocket handler with transport/registry test doubles.
# The catalog client methods and HA registry fields match the pinned 2026.11 API.
import sys
import types


def load_gateway():
    def module(name):
        obj = types.ModuleType(name)
        sys.modules[name] = obj
        return obj
    for name in ('homeassistant', 'homeassistant.auth', 'homeassistant.auth.permissions',
                 'homeassistant.components', 'homeassistant.components.music_assistant', 'homeassistant.helpers'):
        module(name)
    constants = module('homeassistant.auth.permissions.const')
    constants.POLICY_READ, constants.POLICY_CONTROL = 'read', 'control'
    ws = module('homeassistant.components.websocket_api')
    def command(schema):
        def decorate(fn):
            fn.command_schema = schema
            return fn
        return decorate
    ws.websocket_command, ws.async_response = command, lambda fn: fn
    helpers = module('homeassistant.components.music_assistant.helpers')
    helpers.get_music_assistant_client = lambda hass, entry_id: hass.mass
    registry = module('homeassistant.helpers.entity_registry')
    registry.async_get = lambda hass: hass.registry
    validator = module('probatio')
    validator.Required = validator.Optional = lambda key, **kwargs: key
    validator.In = validator.Length = validator.Range = lambda *args, **kwargs: None
    validator.All = lambda *args: None
    folder = PATH.parent
    spec = importlib.util.spec_from_file_location('gateway_test', folder / '__init__.py', submodule_search_locations=[str(folder)])
    pkg = importlib.util.module_from_spec(spec)
    sys.modules['gateway_test'] = pkg
    spec.loader.exec_module(pkg)
    return pkg


class GatewayTests(IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        cls.gateway = load_gateway()

    def setup_gateway(self):
        mass = mass_client()
        mass.players = {'RINCON_AABBCCDDEEFF01400': NS(available=True)}
        mass.player_queues = NS(play_media=AsyncMock())
        entry = NS(data={'music_assistant_entry': 'mass-entry'}, options={'accounts': [account()]})
        entities = {
            'media_player.sonos': NS(entity_id='media_player.sonos', platform='sonos', unique_id='RINCON_AABBCCDDEEFF01400', disabled_by=None),
            'media_player.mass': NS(entity_id='media_player.mass', platform='music_assistant', config_entry_id='mass-entry', unique_id='RINCON_AABBCCDDEEFF01400', disabled_by=None)}
        hass = NS(data={'music_manager': {'entry': entry}}, mass=mass, registry=NS(async_get=entities.get))
        permission = NS(allowed=True)
        connection = NS(user=NS(id='ha-a', permissions=NS(check_entity=lambda entity_id, policy: permission.allowed)),
                        result=None, error=None)
        connection.send_result = lambda msg_id, result: setattr(connection, 'result', result)
        connection.send_error = lambda msg_id, code, message: setattr(connection, 'error', (code, message))
        msg = dict(id=7, action='play', entity_id='media_player.mass', source_entity='media_player.sonos',
                   uri='apple_music--a://track/42', query='', media_type='playlist', offset=0)
        return hass, connection, msg, entities, permission

    async def test_play_uses_server_resolved_user_and_selected_sonos_queue(self):
        hass, connection, msg, _, _ = self.setup_gateway()
        await self.gateway.websocket_apple_music(hass, connection, msg)
        self.assertIsNone(connection.error)
        self.assertEqual(connection.result, {'started': True})
        hass.mass.player_queues.play_media.assert_awaited_once_with(queue_id='RINCON_AABBCCDDEEFF01400', media='apple_music--a://track/42', option='replace', user='ma-a')
        self.assertNotIn('user_id', self.gateway.websocket_apple_music.command_schema)
        self.assertNotIn('provider_id', self.gateway.websocket_apple_music.command_schema)

    async def test_unknown_or_unauthorized_user_never_starts_playback(self):
        for unknown, allowed in ((True, True), (False, False)):
            hass, connection, msg, _, permission = self.setup_gateway()
            if unknown:
                connection.user.id = 'ha-stranger'
            permission.allowed = allowed
            await self.gateway.websocket_apple_music(hass, connection, msg)
            self.assertIsNotNone(connection.error)
            hass.mass.player_queues.play_media.assert_not_awaited()

    async def test_another_room_or_another_account_uri_is_rejected(self):
        for wrong_room in (True, False):
            hass, connection, msg, entities, _ = self.setup_gateway()
            if wrong_room:
                entities['media_player.mass'].unique_id = 'RINCON_11223344556601400'
            else:
                msg['uri'] = 'apple_music--b://track/42'
            await self.gateway.websocket_apple_music(hass, connection, msg)
            self.assertIsNotNone(connection.error)
            hass.mass.player_queues.play_media.assert_not_awaited()

    async def test_provider_filter_is_rechecked_after_status_before_play(self):
        hass, connection, msg, _, _ = self.setup_gateway()
        await self.gateway.websocket_apple_music(hass, connection, {**msg, 'action': 'status'})
        self.assertIsNone(connection.error)
        hass.mass.auth.get_user.return_value.provider_filter = []
        await self.gateway.websocket_apple_music(hass, connection, msg)
        self.assertEqual(connection.error[0], 'account_filter')
        hass.mass.player_queues.play_media.assert_not_awaited()

    async def test_upstream_errors_do_not_disclose_authentication_details(self):
        hass, connection, msg, _, _ = self.setup_gateway()
        hass.mass.player_queues.play_media.side_effect = RuntimeError('secret-cookie=PRIVATE')
        await self.gateway.websocket_apple_music(hass, connection, msg)
        self.assertEqual(connection.error[0], 'music_assistant_error')
        self.assertNotIn('PRIVATE', str(connection.error))
