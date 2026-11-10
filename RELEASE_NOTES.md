# Music Manager 1.2.0

- Apple Music als eigene Kachel mit Logo direkt unter den Bedienelementen.
- Persönliche Playlists, Alben und Titel sowie Apple-Music-Suche; Wiedergabe auf der gewählten Sonos-Box über Music Assistant.
- Neuer optionaler HA-Connector mit administrativer 1:1-Zuordnung HA-Benutzer → MA-Benutzer → Apple-Music-Instanz. Apple-Anmeldung und Zugangsdaten bleiben in Music Assistant.
- Jede Anfrage prüft die Kontozuordnung, den eingeschränkten Quellenfilter und die Berechtigung für dieselbe Sonos-Box. Fehlende Zugänge wechseln nicht auf ein anderes Konto. Benutzerwechsel verwerfen alte Ergebnisse.
- Native HA-Lautstärke mit Prozentanzeige, persönliche Radiofavoriten und Favoritenverwaltung bleiben erhalten.

## Apple Music aktivieren

1. Music Assistant samt Apple-Music-Konto und nativem Sonos-Player einrichten. Pro Person einen normalen MA-Benutzer anlegen und dessen Musikquellen auf genau das eigene Apple-Music-Konto beschränken.
2. Aus dem ZIP `custom_components/music_manager` nach `/config/custom_components/music_manager` kopieren und HA neu starten.
3. Unter **Geräte & Dienste → Music Manager** die bestehende MA-Verbindung hinzufügen; anschließend unter **Konfigurieren** die persönlichen Konten zuordnen.
4. Karte aktualisieren und im Karteneditor die Music-Assistant-Entität derselben Sonos-Box auswählen. Apple-Music-Kachel öffnen.

**Für vorhandene HACS-Dashboard-Installationen:** Die JS-Karte wird weiter normal aktualisiert. Für Apple Music zusätzlich den Connector aus dem ZIP installieren. Radio benötigt ihn nicht.

Ausführliche Einrichtung im [README](https://github.com/v9h45n47mh-lab/music-manager#apple-music).

## Prüfung

Build und Prüfsummenprüfung, 34 Testfälle mit simuliertem HA/MA (darunter 13 Python-Prüfungen zur Kontotrennung) und 20 Chromium-Browser-Szenarien für Desktop/Mobil sowie helle/dunkle Themes sind vorgesehen. Der [Actions-Prüfstatus](https://github.com/v9h45n47mh-lab/music-manager/actions/workflows/validate.yml) zeigt das Ergebnis. Eine echte Apple-Anmeldung und Sonos-Wiedergabe konnten hier nicht geprüft werden.
