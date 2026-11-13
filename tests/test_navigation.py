"""User isolation, remembered speakers and restrictions of the beta player."""
import importlib
import sys
from types import SimpleNamespace as NS
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock

from test_installation import load_installation


class NavigationTests(IsolatedAsyncioTestCase):
    def setUp(self):
        _, _, self.flow_module = load_installation()
        sys.modules.pop('installation_test.navigation', None)
        self.nav = importlib.import_module('installation_test.navigation')
        self.entry = NS(entry_id='music', options={})
        def person(name):
            return NS(id=name.lower(), name=name, is_active=True, system_generated=False,
                      permissions=NS(check_entity=lambda entity, policy: True))
        self.users = {n.lower(): person(n) for n in ['Manuel', 'Vera', 'Maximilian', 'Paul']}
        self.states = {f'media_player.{n}': NS(state='playing', attributes={'friendly_name': n.title()})
                       for n in ['living', 'office', 'bedroom', 'tv', 'disabled']}
        entities = {e: NS(entity_id=e, platform='cast' if e.endswith('tv') else 'sonos',
                          disabled_by='user' if e.endswith('disabled') else None,
                          unique_id='RINCON_' + e.split('.')[1].upper()) for e in self.states}
        self.registry = NS(entities=entities)
        self.nav.er.async_get = lambda hass: self.registry
        self.stores = {}
        async def store_for(hass, uid):
            if uid not in self.stores:
                store = NS(data={})
                async def write(key, value):
                    store.data[key] = value
                store.async_set_item = AsyncMock(side_effect=write)
                self.stores[uid] = store
            return self.stores[uid]
        self.nav.async_user_store = AsyncMock(side_effect=store_for)
        self.hass = NS(data={'music_manager': {'music': self.entry}}, states=NS(get=self.states.get),
                       auth=NS(async_get_users=AsyncMock(return_value=list(self.users.values()))))

    async def data(self, user, selected=None, **kwargs):
        return await self.nav.navigation_data(self.hass, self.users[user], 'media_player.living', selected=selected, **kwargs)

    async def test_personal_speaker_persists_and_does_not_touch_favorites(self):
        self.assertEqual((await self.data('manuel'))['entity_id'], 'media_player.living')
        self.stores['manuel'].data['music_manager_favorites'] = [{'title': 'Personal radio'}]
        await self.data('manuel', 'media_player.office')
        await self.data('vera', 'media_player.bedroom')
        self.assertEqual((await self.data('manuel'))['entity_id'], 'media_player.office')
        self.assertEqual((await self.data('vera'))['entity_id'], 'media_player.bedroom')
        self.assertEqual(self.stores['manuel'].data['music_manager_favorites'], [{'title': 'Personal radio'}])
        self.assertEqual(self.entry.options, {})

    async def test_children_always_use_initial_speaker_and_cannot_save_other_speaker(self):
        for child in ['maximilian', 'paul']:
            result = await self.data(child)
            self.assertEqual(result, {'can_select': False, 'entity_id': 'media_player.living', 'players': [], 'show_alarm_songs': True, 'version': self.nav.VERSION})
            with self.assertRaises(self.nav.AccessError):
                await self.data(child, 'media_player.office')
        self.nav.async_user_store.assert_not_awaited()

    async def test_only_permitted_active_sonos_entities_are_exposed(self):
        self.users['manuel'].permissions.check_entity = lambda e, p: not e.endswith('bedroom')
        result = await self.data('manuel')
        self.assertEqual({p['entity_id'] for p in result['players']}, {'media_player.living', 'media_player.office'})
        for target in ['media_player.bedroom', 'media_player.tv', 'media_player.disabled', 'media_player.missing']:
            with self.assertRaises(self.nav.AccessError):
                await self.data('manuel', target)

    async def test_revoked_permission_or_removed_entity_discards_saved_target(self):
        await self.data('manuel', 'media_player.office')
        self.users['manuel'].permissions.check_entity = lambda e, p: not e.endswith('office')
        self.assertEqual((await self.data('manuel'))['entity_id'], 'media_player.living')
        self.entry.options['speaker_selection_users'] = []
        result = await self.data('manuel')
        self.assertFalse(result['can_select'])
        self.assertEqual(result['entity_id'], 'media_player.living')

    async def test_explicit_ids_override_names_and_duplicate_default_names_fail_closed(self):
        self.entry.options['speaker_selection_users'] = ['vera']
        self.users['vera'].name = 'Renamed account'
        self.assertTrue((await self.data('vera'))['can_select'])
        self.assertFalse((await self.data('manuel'))['can_select'])
        self.entry.options = {}
        self.hass.auth.async_get_users.return_value.append(NS(id='another', name='Manuel', is_active=True, system_generated=False))
        self.assertFalse((await self.data('manuel'))['can_select'])

    async def test_navigation_ids_keep_two_cards_separate(self):
        await self.data('manuel', 'media_player.office', navigation_id='first')
        await self.data('manuel', 'media_player.bedroom', navigation_id='second')
        self.assertEqual((await self.data('manuel', navigation_id='first'))['entity_id'], 'media_player.office')
        self.assertEqual((await self.data('manuel', navigation_id='second'))['entity_id'], 'media_player.bedroom')
        with self.assertRaises(self.nav.AccessError):
            await self.data('manuel', navigation_id='../invalid')

    async def test_save_error_does_not_replace_remembered_target(self):
        await self.data('manuel', 'media_player.office')
        self.stores['manuel'].async_set_item.side_effect = RuntimeError('Storage offline')
        with self.assertRaises(RuntimeError):
            await self.data('manuel', 'media_player.bedroom')
        self.assertEqual((await self.data('manuel'))['entity_id'], 'media_player.office')

    async def test_options_flow_prefills_defaults_and_preserves_existing_configuration(self):
        flow = self.flow_module.MusicManagerOptionsFlow()
        flow.hass, flow.config_entry = self.hass, self.entry
        form = await flow.async_step_speaker_users()
        marker = next(iter(form['data_schema']))
        self.assertEqual(set(marker.default()), {'manuel', 'vera'})
        self.entry.options = {'accounts': [{'ha_user_id': 'manuel'}], 'alarms': [{'alarm_id': 'school'}]}
        saved = await flow.async_step_speaker_users({'speaker_selection_users': ['manuel', 'vera']})
        self.assertEqual(saved['data']['accounts'], self.entry.options['accounts'])
        self.assertEqual(saved['data']['alarms'], self.entry.options['alarms'])
        self.assertEqual(saved['data']['speaker_selection_users'], ['manuel', 'vera'])

    async def test_wake_content_is_available_to_children_and_parents_only(self):
        for name in ['manuel', 'vera', 'maximilian', 'paul']:
            self.assertEqual((await self.data(name))['show_alarm_songs'], True)
        self.hass.auth.async_get_users.return_value.append(NS(id='duplicate', name='Paul', is_active=True, system_generated=False))
        self.assertFalse((await self.data('paul'))['show_alarm_songs'])

    async def test_unrelated_account_does_not_gain_wake_controls(self):
        self.users['guest'] = NS(id='guest', name='Guest', is_active=True, system_generated=False)
        self.assertFalse((await self.data('guest'))['show_alarm_songs'])
