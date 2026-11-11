# Music Manager 1.6.0

- **Weckmusik aus Apple-Music-Favoriten:** Die neue Zeile `custom:music-manager-alarm-row` ergänzt vorhandene HA-Entities-Karten um eine persönliche Auswahl aus favorisierten Alben und Playlists.
- **Start ohne geöffnetes Dashboard:** `music_manager.play_alarm` startet die gespeicherte Auswahl serverseitig über Music Assistant. Vorher ordnet ein Administrator die Weckerkennung fest einem HA-Benutzer und seiner Sonos-Box zu.
- **Persönliche Konten und Freigaben:** Nur der Besitzer und HA-Administratoren dürfen die Auswahl lesen oder ändern. Konto-, Quellen- und Boxfreigaben werden beim Musikstart erneut geprüft. Eine fehlgeschlagene Apple-Music-Wiedergabe wechselt nicht zu einer anderen Quelle.
- **Bisheriges Verhalten als Auswahl:** Ohne Album/Playlist wird wie bisher die letzte Sonos-Wiedergabe fortgesetzt. Ein gespeicherter Favorit bleibt als Weckmusik erhalten, wenn er später aus der Favoritenliste entfernt wird.
- **Neutrale YAML-Beispiele:** Unter `examples/` liegen eine Zeile für bestehende Entities-Karten und die neue Musikaktion. Persönliche Geräte- und Automationskonfigurationen sind nicht enthalten.

## Einrichten

1. Im Marketplace auf **1.6.0** aktualisieren, Home Assistant neu starten und die HA-Seite neu laden.
2. Unter **Geräte & Dienste → Music Manager → Konfigurieren → Wecker hinzufügen oder ändern**: eine eigene Kennung, den **Wecker-Benutzer** und seine **Sonos-Box**.
3. Die Zeile und Aktion aus `examples/` in die vorhandene Weckerkarte und Automation einfügen; dieselbe Kennung verwenden. In der Weckerkarte anschließend **Weckmusik → Auswählen** öffnen.
