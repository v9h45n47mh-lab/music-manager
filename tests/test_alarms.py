"""Alarm selection persistence and unattended playback authorization."""
import importlib
import sys
import types
from types import SimpleNamespace as NS
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, Mock

from test_apple_music import account, load_gateway
import test_apple_music as gateway_fixture


class AlarmTests(IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        cls.gateway = load_gateway()
        storage = types.ModuleType('homeassistant.components.frontend.storage')
        async def get_store(hass, user_id):
            return hass.user_stores[user_id]
        storage.async_user_store = get_store
        sys.modules['homeassistant.components.frontend'] = types.ModuleType('homeassistant.components.frontend')
        sys.modules[storage.__name__] = storage
        exceptions = types.ModuleType('homeassistant.exceptions')
        exceptions.HomeAssistantError = type('HomeAssistantError', (Exception,), {})
        sys.modules[exceptions.__name__] = exceptions
        sys.modules['probatio'].Schema = lambda value: value
        sys.modules['homeassistant.components.websocket_api'].async_register_command = Mock()
        cls.alarms = importlib.import_module('gateway_test.alarms')

    def setup_alarm(self):
        fixture = gateway_fixture.GatewayTests()
        fixture.gateway = self.gateway
        hass, connection, _, entities, permission = fixture.setup_gateway()
        owner = connection.user
        owner.name, owner.is_active, owner.system_generated, owner.is_admin = 'Maximilian', True, False, False
        admin = NS(id='admin', name='Manuel', is_active=True, system_generated=False, is_admin=True)
        stranger = NS(id='ha-b', name='Paul', is_active=True, system_generated=False, is_admin=False)
        users = {u.id: u for u in (owner, admin, stranger)}
        hass.auth = NS(async_get_user=AsyncMock(side_effect=users.get))
        hass.states = NS(get=lambda entity: NS(attributes={'friendly_name': 'Maximilian Sonos'}))
        hass.services = NS(async_call=AsyncMock(), async_register=Mock())
        entry = hass.data['music_manager']['entry']
        entry.options['alarms'] = [{'alarm_id': 'school_alarm', 'ha_user_id': 'ha-a', 'source_entity': 'media_player.sonos'}]
        favorite = {'kind': 'apple_music', 'uri': 'apple_music--a://playlist/pl.wake', 'media_type': 'playlist', 'title': 'Aufwachen'}
        store = NS(data={'music_manager_favorites': [favorite]})
        async def save(key, value):
            store.data[key] = value
        store.async_set_item = AsyncMock(side_effect=save)
        hass.user_stores = {'ha-a': store}
        call = NS(data={'alarm_id': 'school_alarm'}, context=NS(user_id=None))
        return hass, owner, admin, stranger, store, favorite, call, permission, entry

    async def test_only_owner_or_admin_can_read_and_change_fixed_alarm(self):
        hass, owner, admin, other, store, favorite, call, _, _ = self.setup_alarm()
        for allowed in (owner, admin):
            result = await self.alarms.alarm_data(hass, allowed, 'school_alarm')
            self.assertEqual(result['owner'], 'Maximilian')
            self.assertEqual(result['favorites'][0]['title'], 'Aufwachen')
        with self.assertRaises(self.alarms.AccessError):
            await self.alarms.alarm_data(hass, other, 'school_alarm', favorite['uri'])
        store.async_set_item.assert_not_awaited()
        call.context.user_id = other.id
        with self.assertRaises(self.alarms.HomeAssistantError):
            await self.alarms.play_alarm(hass, call)
        hass.services.async_call.assert_not_awaited()

    async def test_selection_uses_owners_exact_album_playlist_favorites_and_preserves_other_alarms(self):
        hass, owner, _, _, store, favorite, _, _, _ = self.setup_alarm()
        store.data[self.alarms.SELECTION_KEY] = {'other_alarm': {'title': 'Andere Auswahl'}}
        store.data[self.alarms.FAVORITES_KEY] += [dict(favorite), dict(favorite, uri='apple_music--b://playlist/secret'),
            dict(favorite, uri='apple_music--a://track/42', media_type='track'), {'media_content_id': 'media-source://radio_browser/swr3'}]
        result = await self.alarms.alarm_data(hass, owner, 'school_alarm', favorite['uri'])
        self.assertEqual(len(result['favorites']), 1)
        self.assertEqual(result['selection']['uri'], favorite['uri'])
        self.assertIn('other_alarm', store.data[self.alarms.SELECTION_KEY])
        for uri in ('apple_music--b://playlist/secret', 'apple_music--a://track/42', 'apple_music--a://album/not-favorited'):
            with self.assertRaises(self.alarms.AccessError):
                await self.alarms.alarm_data(hass, owner, 'school_alarm', uri)
        self.assertEqual(store.async_set_item.await_count, 1)

    async def test_multiple_people_and_multiple_alarms_keep_music_accounts_and_speakers_separate(self):
        hass, owner, admin, other, first_store, first_favorite, call, _, entry = self.setup_alarm()
        second_uid = 'RINCON_11223344556601400'
        entities = hass.registry.entities
        entities['media_player.other_sonos'] = NS(entity_id='media_player.other_sonos', platform='sonos', unique_id=second_uid, disabled_by=None)
        entities['media_player.other_mass'] = NS(entity_id='media_player.other_mass', platform='music_assistant', unique_id=second_uid, config_entry_id='mass-entry', disabled_by=None)
        other.permissions = NS(check_entity=lambda entity, policy: entity.startswith('media_player.other_'))
        entry.options['accounts'].append(account('ha-b', 'ma-b', 'apple_music--b'))
        entry.options['alarms'] += [
            {'alarm_id': 'second_alarm', 'ha_user_id': other.id, 'source_entity': 'media_player.other_sonos'},
            {'alarm_id': 'weekend_alarm', 'ha_user_id': owner.id, 'source_entity': 'media_player.sonos'}]
        second_favorite = dict(first_favorite, uri='apple_music--b://playlist/second', title='Second playlist')
        second_store = NS(data={self.alarms.FAVORITES_KEY: [second_favorite]})
        async def save(key, value):
            second_store.data[key] = value
        second_store.async_set_item = AsyncMock(side_effect=save)
        hass.user_stores[other.id] = second_store
        weekend = dict(first_favorite, uri='apple_music--a://album/weekend', media_type='album', title='Weekend album')
        first_store.data[self.alarms.FAVORITES_KEY].append(weekend)
        hass.mass.auth.get_user.side_effect = lambda uid: NS(enabled=True, role='user', provider_filter=['apple_music--a' if uid=='ma-a' else 'apple_music--b'])
        hass.mass.players[second_uid] = NS(available=True)
        for person, alarm_id, favorite in [(owner, 'school_alarm', first_favorite), (other, 'second_alarm', second_favorite), (owner, 'weekend_alarm', weekend)]:
            await self.alarms.alarm_data(hass, person, alarm_id, favorite['uri'])
        self.assertEqual(set(first_store.data[self.alarms.SELECTION_KEY]), {'school_alarm', 'weekend_alarm'})
        self.assertEqual(set(second_store.data[self.alarms.SELECTION_KEY]), {'second_alarm'})
        for person, forbidden in [(owner, 'second_alarm'), (other, 'school_alarm')]:
            with self.assertRaises(self.alarms.AccessError):
                await self.alarms.alarm_data(hass, person, forbidden)
        self.assertEqual((await self.alarms.alarm_data(hass, admin, 'second_alarm'))['selection']['uri'], second_favorite['uri'])
        for alarm_id, favorite, uid, ma_user in [
            ('school_alarm', first_favorite, 'RINCON_AABBCCDDEEFF01400', 'ma-a'),
            ('second_alarm', second_favorite, second_uid, 'ma-b'),
            ('weekend_alarm', weekend, 'RINCON_AABBCCDDEEFF01400', 'ma-a')]:
            call.data['alarm_id'] = alarm_id
            await self.alarms.play_alarm(hass, call)
            hass.mass.player_queues.play_media.assert_awaited_with(queue_id=uid, media=favorite['uri'], option='replace', user=ma_user)
        self.assertEqual(hass.mass.player_queues.play_media.await_count, 3)
        hass.services.async_call.assert_not_awaited()

    async def test_saved_music_starts_without_browser_and_survives_unstarring(self):
        hass, owner, _, _, store, favorite, call, _, _ = self.setup_alarm()
        await self.alarms.alarm_data(hass, owner, 'school_alarm', favorite['uri'])
        store.data[self.alarms.FAVORITES_KEY] = []
        result = await self.alarms.alarm_data(hass, owner, 'school_alarm')
        self.assertFalse(result['in_favorites'])
        self.assertEqual(result['selection']['title'], 'Aufwachen')
        await self.alarms.play_alarm(hass, call)
        hass.mass.player_queues.play_media.assert_awaited_once_with(queue_id='RINCON_AABBCCDDEEFF01400',
            media=favorite['uri'], option='replace', user='ma-a')
        hass.services.async_call.assert_not_awaited()

    async def test_revoked_owner_or_speaker_permissions_block_unattended_playback(self):
        for case in ('disabled', 'ha-permission', 'ma-filter', 'provider', 'owner-deleted'):
            with self.subTest(case=case):
                hass, owner, _, _, store, favorite, call, permission, _ = self.setup_alarm()
                await self.alarms.alarm_data(hass, owner, 'school_alarm', favorite['uri'])
                if case == 'disabled': owner.is_active = False
                if case == 'ha-permission': permission.allowed = False
                if case == 'ma-filter': hass.mass.auth.get_user.return_value.player_filter = ['another-player']
                if case == 'provider': hass.mass.providers.pop(0)
                if case == 'owner-deleted': hass.auth.async_get_user.side_effect = lambda user_id: None
                with self.assertRaises(self.alarms.HomeAssistantError):
                    await self.alarms.play_alarm(hass, call)
                hass.mass.player_queues.play_media.assert_not_awaited()
                hass.services.async_call.assert_not_awaited()

    async def test_changed_account_does_not_fall_back_or_play_old_choice_through_other_account(self):
        hass, owner, _, _, store, favorite, call, _, entry = self.setup_alarm()
        await self.alarms.alarm_data(hass, owner, 'school_alarm', favorite['uri'])
        entry.options['accounts'] = [account(provider='apple_music--b')]
        hass.mass.auth.get_user.return_value.provider_filter = ['apple_music--b']
        with self.assertRaises(self.alarms.HomeAssistantError):
            await self.alarms.play_alarm(hass, call)
        hass.mass.player_queues.play_media.assert_not_awaited()
        hass.services.async_call.assert_not_awaited()

    async def test_default_and_explicit_clear_keep_the_previous_sonos_resume_without_ma(self):
        hass, owner, _, _, store, favorite, call, _, _ = self.setup_alarm()
        await self.alarms.alarm_data(hass, owner, 'school_alarm', favorite['uri'])
        result = await self.alarms.alarm_data(hass, owner, 'school_alarm', '')
        self.assertIsNone(result['selection'])
        hass.mass.auth.get_user.side_effect = RuntimeError('MA is offline')
        await self.alarms.play_alarm(hass, call)
        hass.services.async_call.assert_awaited_once_with('media_player', 'media_play',
            {'entity_id': 'media_player.sonos'}, blocking=True, context=call.context)
        hass.mass.player_queues.play_media.assert_not_awaited()

    async def test_unknown_alarm_duplicates_and_deleted_caller_fail_closed(self):
        hass, _, _, _, _, _, call, _, entry = self.setup_alarm()
        for alarm_id in ('another_alarm', '../school_alarm'):
            call.data['alarm_id'] = alarm_id
            with self.assertRaises(self.alarms.HomeAssistantError):
                await self.alarms.play_alarm(hass, call)
        call.data['alarm_id'] = 'school_alarm'
        entry.options['alarms'] *= 2
        with self.assertRaises(self.alarms.HomeAssistantError):
            await self.alarms.play_alarm(hass, call)
        entry.options['alarms'].pop()
        call.context.user_id = 'deleted'
        with self.assertRaises(self.alarms.HomeAssistantError):
            await self.alarms.play_alarm(hass, call)
        hass.services.async_call.assert_not_awaited()

    async def test_failed_save_retains_previous_selection_and_websocket_hides_upstream_details(self):
        hass, owner, _, _, store, favorite, _, _, _ = self.setup_alarm()
        store.async_set_item.side_effect = RuntimeError('SECRET-TOKEN')
        conn = NS(user=owner, send_result=Mock(), send_error=Mock())
        await self.alarms.websocket_alarm(hass, conn, {'id': 1, 'action': 'select', 'alarm_id': 'school_alarm', 'uri': favorite['uri']})
        self.assertNotIn(self.alarms.SELECTION_KEY, store.data)
        self.assertNotIn('SECRET-TOKEN', str(conn.send_error.call_args))
        self.assertEqual(conn.send_error.call_args.args[1], 'alarm_error')

    async def test_registration_exposes_only_fixed_alarm_id_and_never_caller_supplied_account_or_speaker(self):
        hass, *_ = self.setup_alarm()
        self.alarms.async_register_alarms(hass)
        registration = hass.services.async_register.call_args
        self.assertEqual(registration.args[:2], ('music_manager', 'play_alarm'))
        self.assertEqual(set(registration.kwargs['schema']), {'alarm_id'})
        self.assertNotIn('user_id', self.alarms.websocket_alarm.command_schema)
        self.assertNotIn('source_entity', self.alarms.websocket_alarm.command_schema)
        self.assertNotIn('provider_id', self.alarms.websocket_alarm.command_schema)
