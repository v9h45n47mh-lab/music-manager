"""Regression tests for per-user account isolation against MA client contracts."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace as NS
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock
from enum import Enum

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
                       get_library_albums=AsyncMock(), get_library_playlists=AsyncMock(), get_album_tracks=AsyncMock(), get_playlist_tracks=AsyncMock()))


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

    def test_catalog_exposes_only_public_https_covers(self):
        for path in ('javascript:alert(1)', 'data:image/svg+xml,private', 'http://local/image',
                     'https://user:password@example.org/cover'):
            obj = item(metadata={'images': [dict(type='thumb', remotely_accessible=True, path=path)]})
            self.assertNotIn('thumbnail', access.catalog_item(obj, 'apple_music--a'))
        obj = item(kind='album', metadata={'token': 'PRIVATE', 'images': [dict(type='thumb', remotely_accessible=True,
            path='https://is1-ssl.mzstatic.com/image/thumb/cover.jpg')]})
        result = access.catalog_item(obj, 'apple_music--a')
        self.assertEqual(result['thumbnail'], 'https://is1-ssl.mzstatic.com/image/thumb/cover.jpg')
        self.assertNotIn('PRIVATE', str(result))

    def test_sonos_pairing_is_hardware_based_and_not_name_based(self):
        self.assertEqual(access.sonos_uid('RINCON_AABBCCDDEEFF01400'), access.sonos_uid('sonos--rincon_aabbccddeeff01400'))
        self.assertNotEqual(access.sonos_uid('RINCON_AABBCCDDEEFF01400'), access.sonos_uid('RINCON_11223344556601400'))
        self.assertIsNone(access.sonos_uid('Wohnzimmer'))


class AccountTests(IsolatedAsyncioTestCase):
    async def test_album_and_playlist_tracks_use_exact_account_impersonation_and_native_paging(self):
        mass = mass_client()
        for kind in ('album', 'playlist'):
            method = getattr(mass.music, f'get_{kind}_tracks')
            method.return_value = [item(item_id='song'), item('apple_music--b'), item(kind='album')]
            result = await access.container_tracks(mass, account(), f'apple_music--a://{kind}/collection', 50)
            self.assertEqual([i['uri'] for i in result['items']], ['apple_music--a://track/song'])
            expected = {'item_id': 'collection', 'provider_instance_id_or_domain': 'apple_music--a', 'user': 'ma-a', 'limit': 50, 'offset': 50}
            if kind == 'playlist': expected['strict_provider_instance'] = True
            method.assert_awaited_once_with(**expected)
            method.return_value = [item() for _ in range(50)]
            result = await access.container_tracks(mass, account(), f'apple_music--a://{kind}/collection', 100)
            self.assertTrue(result['more'])
            self.assertEqual(result['next_offset'], 150)

    async def test_track_listing_rejects_foreign_providers_tracks_and_malformed_containers_before_calling_ma(self):
        mass = mass_client()
        for uri in ('apple_music--b://album/42', 'apple_music--a://track/42', 'library://playlist/42', 'apple_music--a://playlist/../../42'):
            with self.assertRaises(access.AccessError):
                await access.container_tracks(mass, account(), uri)
        mass.music.get_album_tracks.assert_not_awaited()
        mass.music.get_playlist_tracks.assert_not_awaited()

    async def test_provider_removal_never_falls_back_to_second_apple_account(self):
        mass = mass_client()
        await access.checked_account(mass, account())
        mass.providers.pop(0)
        with self.assertRaises(access.AccessError):
            await access.checked_account(mass, account())

    async def test_users_and_admins_keep_their_roles_and_exact_source_filter(self):
        class Role(Enum):
            ADMIN = 'admin'
        mass = mass_client()
        for role in ('user', 'admin', Role.ADMIN):
            with self.subTest(role=role):
                user = NS(enabled=True, role=role, provider_filter=['apple_music--a'])
                mass.auth.get_user.return_value = user
                checked, provider = await access.checked_account(mass, account())
                self.assertIs(checked, user)
                self.assertEqual(provider.instance_id, 'apple_music--a')
                self.assertEqual(user.role, role)
                self.assertEqual(user.provider_filter, ['apple_music--a'])

    async def test_disabled_and_unsupported_roles_fail_closed(self):
        mass = mass_client()
        for user in (None, *[NS(enabled=False, role=role, provider_filter=['apple_music--a'])
                            for role in ('user', 'admin')],
                     *[NS(enabled=True, role=role, provider_filter=['apple_music--a'])
                       for role in ('guest', 'service', 'unknown', None)]):
            mass.auth.get_user.return_value = user
            with self.assertRaises(access.AccessError) as err:
                await access.checked_account(mass, account())
            self.assertEqual(err.exception.code, 'account_disabled')
        mass.auth.get_user.assert_awaited_with('ma-a')

    async def test_admin_role_does_not_bypass_empty_wide_or_wrong_account_filters(self):
        mass = mass_client()
        for role in ('user', 'admin'):
            for sources in (None, [], ['apple_music--b'], ['apple_music--a', 'apple_music--b']):
                with self.subTest(role=role, sources=sources):
                    mass.auth.get_user.return_value = NS(enabled=True, role=role, provider_filter=sources)
                    with self.assertRaises(access.AccessError) as err:
                        await access.checked_account(mass, account())
                    self.assertEqual(err.exception.code, 'account_filter')

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
        class Players(dict):
            pass
        mass.players = Players({'RINCON_AABBCCDDEEFF01400': NS(available=True)})
        mass.players.player_command_next_track = AsyncMock()
        mass.player_queues = NS(play_media=AsyncMock(), play_index=AsyncMock(), get=lambda key: None)
        entry = NS(data={'music_assistant_entry': 'mass-entry'}, options={'accounts': [account()]})
        entities = {
            'media_player.sonos': NS(entity_id='media_player.sonos', platform='sonos', unique_id='RINCON_AABBCCDDEEFF01400', disabled_by=None),
            'media_player.mass': NS(entity_id='media_player.mass', platform='music_assistant', config_entry_id='mass-entry', unique_id='RINCON_AABBCCDDEEFF01400', disabled_by=None)}
        hass = NS(data={'music_manager': {'entry': entry}}, mass=mass, registry=NS(async_get=entities.get, entities=entities))
        permission = NS(allowed=True)
        connection = NS(user=NS(id='ha-a', permissions=NS(check_entity=lambda entity_id, policy: permission.allowed)),
                        result=None, error=None)
        connection.send_result = lambda msg_id, result: setattr(connection, 'result', result)
        connection.send_error = lambda msg_id, code, message: setattr(connection, 'error', (code, message))
        msg = dict(id=7, action='play', entity_id='media_player.mass', source_entity='media_player.sonos',
                   uri='apple_music--a://track/42', query='', media_type='playlist', offset=0)
        return hass, connection, msg, entities, permission

    async def test_container_listing_is_read_only_and_rechecks_the_callers_mapping_and_permissions(self):
        hass, connection, msg, _, _ = self.setup_gateway()
        hass.mass.music.get_album_tracks.return_value = [item()]
        request = {**msg, 'action': 'tracks', 'uri': 'apple_music--a://album/collection', 'offset': 0}
        connection.user.permissions.check_entity = lambda entity, policy: policy=='read'
        await self.gateway.websocket_apple_music(hass, connection, request)
        self.assertIsNone(connection.error)
        self.assertEqual(connection.result['items'][0]['media_type'], 'track')
        hass.mass.player_queues.play_media.assert_not_awaited()
        hass.mass.music.get_album_tracks.reset_mock()
        hass.mass.auth.get_user.return_value.provider_filter = ['apple_music--b']
        await self.gateway.websocket_apple_music(hass, connection, request)
        self.assertEqual(connection.error[0], 'account_filter')
        hass.mass.music.get_album_tracks.assert_not_awaited()

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

    async def test_next_starts_the_known_next_queue_item_without_debounce_or_reloading_media(self):
        hass, connection, msg, _, _ = self.setup_gateway()
        queue_id = 'RINCON_AABBCCDDEEFF01400'
        hass.mass.players[queue_id].active_source = queue_id
        queue = NS(active=True, current_item=NS(queue_item_id='current'),
                   next_item=NS(queue_item_id='next-shuffled-item', available=True, queue_id=queue_id))
        hass.mass.player_queues.get = lambda key: queue if key == queue_id else None
        await self.gateway.websocket_apple_music(hass, connection, {**msg, 'action': 'next'})
        self.assertIsNone(connection.error)
        self.assertEqual(connection.result, {'skipped': True})
        hass.mass.player_queues.play_index.assert_awaited_once_with(queue_id=queue_id, index='next-shuffled-item')
        hass.mass.players.player_command_next_track.assert_not_awaited()
        hass.mass.player_queues.play_media.assert_not_awaited()

    async def test_next_uses_standard_ma_routing_for_groups_repeat_one_and_unknown_queue_state(self):
        for case in ('group', 'repeat-one', 'no-queue', 'unavailable-next', 'foreign-item', 'inactive'):
            with self.subTest(case=case):
                hass, connection, msg, _, _ = self.setup_gateway()
                queue_id = 'RINCON_AABBCCDDEEFF01400'
                hass.mass.players[queue_id].active_source = 'group' if case == 'group' else queue_id
                queue = NS(active=case!='inactive', current_item=NS(queue_item_id='current'),
                    next_item=NS(queue_item_id='current' if case=='repeat-one' else 'next',
                        available=case!='unavailable-next', queue_id='foreign' if case=='foreign-item' else queue_id))
                hass.mass.player_queues.get = lambda key: None if case=='no-queue' else queue
                await self.gateway.websocket_apple_music(hass, connection, {**msg, 'action': 'next'})
                self.assertIsNone(connection.error)
                hass.mass.players.player_command_next_track.assert_awaited_once_with(queue_id)
                hass.mass.player_queues.play_index.assert_not_awaited()

    async def test_next_requires_control_permissions_and_does_not_retry_a_failed_skip(self):
        hass, connection, msg, _, _ = self.setup_gateway()
        connection.user.permissions.check_entity = lambda entity, policy: policy!='control'
        await self.gateway.websocket_apple_music(hass, connection, {**msg, 'action': 'next'})
        self.assertEqual(connection.error[0], 'unauthorized')
        hass.mass.players.player_command_next_track.assert_not_awaited()
        hass.mass.player_queues.play_index.assert_not_awaited()
        hass, connection, msg, _, _ = self.setup_gateway()
        queue_id = 'RINCON_AABBCCDDEEFF01400'
        hass.mass.players[queue_id].active_source = queue_id
        hass.mass.player_queues.get = lambda key: NS(active=True, current_item=NS(queue_item_id='current'),
            next_item=NS(queue_item_id='next', available=True))
        hass.mass.player_queues.play_index.side_effect = RuntimeError('private-cookie')
        await self.gateway.websocket_apple_music(hass, connection, {**msg, 'action': 'next'})
        self.assertEqual(connection.error[0], 'music_assistant_error')
        self.assertNotIn('private-cookie', str(connection.error))
        hass.mass.players.player_command_next_track.assert_not_awaited()

    async def test_automatic_selection_uses_the_same_account_on_each_sonos_box(self):
        hass, connection, msg, entities, _ = self.setup_gateway()
        msg.pop('entity_id')
        second_uid = 'RINCON_11223344556601400'
        entities['media_player.second_sonos'] = NS(entity_id='media_player.second_sonos', platform='sonos',
            unique_id=second_uid, disabled_by=None)
        entities['media_player.second_mass'] = NS(entity_id='media_player.second_mass', platform='music_assistant',
            unique_id=second_uid, config_entry_id='mass-entry', disabled_by=None)
        hass.mass.players[second_uid] = NS(available=True)
        for source, target, queue in [('media_player.sonos', 'media_player.mass', 'RINCON_AABBCCDDEEFF01400'),
                                      ('media_player.second_sonos', 'media_player.second_mass', second_uid)]:
            with self.subTest(source=source):
                request = {**msg, 'source_entity': source}
                await self.gateway.websocket_apple_music(hass, connection, {**request, 'action': 'status'})
                self.assertIsNone(connection.error)
                self.assertEqual(connection.result['entity_id'], target)
                await self.gateway.websocket_apple_music(hass, connection, request)
                self.assertIsNone(connection.error)
                hass.mass.player_queues.play_media.assert_awaited_with(queue_id=queue, media=msg['uri'], option='replace', user='ma-a')

    async def test_automatic_selection_never_uses_another_box_disabled_entity_or_server(self):
        for case in ('missing', 'disabled', 'different-server', 'ambiguous'):
            with self.subTest(case=case):
                hass, connection, msg, entities, _ = self.setup_gateway()
                msg.pop('entity_id')
                target = entities['media_player.mass']
                if case == 'missing':
                    target.unique_id = 'RINCON_11223344556601400'
                elif case == 'disabled':
                    target.disabled_by = 'user'
                elif case == 'different-server':
                    target.config_entry_id = 'other-mass-entry'
                else:
                    entities['media_player.duplicate'] = NS(**{**vars(target), 'entity_id': 'media_player.duplicate'})
                await self.gateway.websocket_apple_music(hass, connection, msg)
                self.assertEqual(connection.error[0], 'player_ambiguous' if case == 'ambiguous' else 'player_missing')
                hass.mass.player_queues.play_media.assert_not_awaited()

    async def test_automatic_selection_still_checks_ha_and_ma_player_permissions(self):
        for denied in ('source-read', 'target-read', 'target-control', 'ma-filter'):
            with self.subTest(denied=denied):
                hass, connection, msg, _, _ = self.setup_gateway()
                msg.pop('entity_id')
                connection.user.permissions.check_entity = lambda entity, policy: (entity, policy) != {
                    'source-read': ('media_player.sonos', 'read'),
                    'target-read': ('media_player.mass', 'read'),
                    'target-control': ('media_player.mass', 'control'),
                    'ma-filter': ('none', 'none')}[denied]
                if denied == 'ma-filter':
                    hass.mass.auth.get_user.return_value.player_filter = ['another-box']
                await self.gateway.websocket_apple_music(hass, connection, msg)
                self.assertEqual(connection.error[0], 'unauthorized')
                hass.mass.player_queues.play_media.assert_not_awaited()

    async def test_automatic_selection_is_rechecked_after_status_before_play(self):
        hass, connection, msg, entities, _ = self.setup_gateway()
        msg.pop('entity_id')
        await self.gateway.websocket_apple_music(hass, connection, {**msg, 'action': 'status'})
        self.assertIsNone(connection.error)
        entities.pop('media_player.mass')
        await self.gateway.websocket_apple_music(hass, connection, msg)
        self.assertEqual(connection.error[0], 'player_missing')
        hass.mass.player_queues.play_media.assert_not_awaited()

    async def test_admin_mapping_routes_status_search_library_and_play_as_the_same_user(self):
        hass, connection, msg, _, _ = self.setup_gateway()
        user = hass.mass.auth.get_user.return_value
        user.role = 'admin'
        hass.mass.music.search.return_value = NS(tracks=[item(), item('apple_music--b')], albums=[], playlists=[])
        hass.mass.music.get_library_playlists.return_value = [item(kind='playlist'), item('apple_music--b', kind='playlist')]
        for action in ('status', 'search', 'library', 'play'):
            with self.subTest(action=action):
                await self.gateway.websocket_apple_music(hass, connection, {**msg, 'action': action, 'query': 'Artist'})
                self.assertIsNone(connection.error)
                if action in ('search', 'library'):
                    self.assertEqual(len(connection.result['items']), 1)
                    self.assertTrue(connection.result['items'][0]['uri'].startswith('apple_music--a://'))
        hass.mass.music.search.assert_awaited_once()
        self.assertEqual(hass.mass.music.search.call_args.kwargs['user'], 'ma-a')
        self.assertEqual(hass.mass.music.get_library_playlists.call_args.kwargs['user'], 'ma-a')
        self.assertEqual(hass.mass.music.get_library_playlists.call_args.kwargs['provider'], 'apple_music--a')
        self.assertEqual(hass.mass.player_queues.play_media.call_args.kwargs['user'], 'ma-a')
        self.assertEqual(user.role, 'admin')

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
