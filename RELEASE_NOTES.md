Erste Version der Music-Manager-Karte für Home Assistant.

- Sonos-Box im visuellen Karteneditor pro Karte auswählen.
- Radiosender aus dem HA Radio Browser suchen, durch Kategorien navigieren und direkt abspielen.
- Play/Pause bzw. Stop, vorheriger/nächster Titel, Lautstärke und Stummschalten separat ein-/ausblenden.
- Unverändert lokal eingebundenes HA UI Kit 1.2.2, ohne CDN.
- Eigenes Lautsprecher-/Musiknotenlogo mit transparenten hellen/dunklen PNG- und SVG-Assets.
- Fehleranzeige, Schutz gegen verspätete Antworten und unabhängige Karteninstanzen.

Installation über HACS als benutzerdefiniertes Repository der Kategorie Dashboard/Lovelace oder manuell aus dem ZIP. Voraussetzungen: Home Assistant 2026.11+, Sonos und Radio Browser. Die Datei `music-manager-card.js` ist die vollständige Kartenressource; das UI Kit ist enthalten.

Zurück/Weiter steuern die Sonos-Warteschlange. Live-Radio bietet keinen Titelwechsel. Die Wiedergabe wurde mit simulierten Home-Assistant-Daten geprüft; ein Test an echter Sonos-Hardware steht aus. Die GitHub-Actions-Prüfungen zeigen den Stand der Funktions- und Browserprüfungen.
