# Music Manager 1.2.0

![Music Manager](brand/icon.png)

[![Prüfungen](https://github.com/v9h45n47mh-lab/music-manager/actions/workflows/validate.yml/badge.svg)](https://github.com/v9h45n47mh-lab/music-manager/actions/workflows/validate.yml)

Dashboard-Karte für Home Assistant mit **HA UI Kit 1.2.2**. Pro Karte wählst du eine Sonos-Box. Direkt in der Karte kannst du Radiosender suchen, nach Land, Sprache und Genre auswählen und auf dieser Box abspielen.

Zurück, Play/Pause, Stop und Weiter erscheinen als vier gleich breite Symboltasten, darunter der originale Home-Assistant-Lautstärkeregler mit Prozentanzeige während der Bedienung. Alle Bedienelemente lassen sich im visuellen Karteneditor einzeln ein- oder ausblenden. Oben steht ausschließlich die gewählte Box, ohne „Music Manager“-Überschrift. Eine separate Stumm-Taste entfällt; Lautstärke 0 schaltet die Box lautlos. Direkt unter den Bedienelementen stehen persönliche Favoritensender mit Logo als Kurzwahl. Mehrere Karten steuern unabhängig voneinander ihre konfigurierte Box. Radio und Favoriten funktionieren weiter als eigenständige Karte. Für Apple Music gibt es zusätzlich einen optionalen HA-Connector und eine eigene Kachel mit Logo.

## Installation aus dem ZIP

Voraussetzungen: Home Assistant **2026.11 oder neuer** sowie die offiziellen Integrationen **Sonos** und **Radio Browser** unter **Einstellungen → Geräte & Dienste**. Radio Browser benötigt kein Konto und keinen API-Schlüssel. Für ältere HA-Versionen bleibt das Durchsuchen von Kategorien möglich, soweit die dortige Radio-Browser-Integration sie unterstützt; die globale Suche setzt 2026.11 voraus.

1. Entpacke das ZIP. Kopiere den enthaltenen Ordner `www/music-manager` in deinen Home-Assistant-Konfigurationsordner, sodass die Datei unter `/config/www/music-manager/music-manager-card.js` liegt. Falls du einen anderen Konfigurationspfad verwendest, nutze dessen `www`-Ordner.
2. Öffne **Einstellungen → Dashboards → Ressourcen**. Aktiviere gegebenenfalls den erweiterten Modus deines Benutzerprofils, um Ressourcen zu sehen.
3. Füge diese Ressource mit Typ **JavaScript-Modul** hinzu:

   ```text
   /local/music-manager/music-manager-card.js?v=1.2.0
   ```

4. Lade die Home-Assistant-Seite vollständig neu. Öffne dein Dashboard im Bearbeitungsmodus und füge die Karte **Music Manager** hinzu. Wähle im Karteneditor die **Sonos-Box** und die gewünschten Bedienelemente.
5. Tippe auf **Sender wählen**, suche einen Sender oder öffne eine Kategorie und wähle **Abspielen**.

Ein Neustart von Home Assistant ist für diese reine Frontend-Karte normalerweise nicht erforderlich. Die UI-Kit-Dateien sind vollständig in der JS-Datei enthalten; du musst keine zusätzliche UI-Kit-Ressource anlegen.

## Installation über HACS

Füge in HACS unter **Benutzerdefinierte Repositories** die URL `https://github.com/v9h45n47mh-lab/music-manager` mit Typ **Dashboard** (bei älteren HACS-Versionen **Lovelace**) hinzu. Lade **Music Manager** herunter und lade die HA-Seite neu. Wenn HACS die Ressource nicht automatisch anlegt, registriere `/hacsfiles/music-manager/music-manager-card.js` als JavaScript-Modul. Füge anschließend die Karte **Music Manager** hinzu und wähle die Sonos-Box.

## Beispiel für dein Dashboard

```yaml
type: custom:music-manager-card
entity: media_player.wohnzimmer
controls:
  play_pause: true
  previous: true
  next: true
  volume: true
  stop: true
```

Für einen weiteren Raum kannst du eine zweite Karte mit einer anderen Sonos-Entität anlegen. Prüfe die Entitätsnamen in deinem aktuellen HA-System. Du kannst die Einstellungen anschließend im visuellen Karteneditor ändern. Alle fünf Bedienelemente sind standardmäßig sichtbar.

## Apple Music

Die **Apple-Music-Kachel mit Logo** steht direkt unter den Bedienelementen bei den Senderfavoriten. Sie öffnet deine persönlichen **Playlists, Alben und Titel** sowie die **Apple-Music-Suche**. „Abspielen“ startet den Titel, das Album oder die Playlist auf der Sonos-Box dieser Karte. Weitere Mediathekeinträge lassen sich mit „Mehr laden“ abrufen. Für Apple Music werden die Wiedergabetasten an die zugehörige Music-Assistant-Warteschlange weitergegeben. Radiosender starten weiterhin über die native Sonos-Integration.

Apple Music benötigt einen aktiven Zugang und **Music Assistant mit Apple-Music-Anbieter, Benutzerverwaltung und Musikquellenfiltern**. Die normale HA-Sonos-Integration allein stellt keinen persönlichen Apple-Music-Katalog bereit. Die Apple-Anmeldung erfolgt ausschließlich in Music Assistant; in der Karte oder in Music Manager werden keine Apple-Passwörter, Cookies oder Tokens eingetragen.

### Einmalige Einrichtung

1. Richte den Music-Assistant-Server und die offizielle **Music Assistant**-Integration in HA ein. Füge die Box über den nativen **Sonos-Player-Anbieter** in Music Assistant hinzu. Verwende für diese Karte die MA-Entität dieser Sonos-Box, keine allgemeine Weiterleitung eines HA-Players.
2. Füge unter **Music Assistant → Einstellungen → Musikquellen** für jede Person eine eigene Apple-Music-Instanz hinzu und melde dort das jeweilige Apple-Konto an. Vergib eindeutige Namen, zum Beispiel „Apple Music Manuel“.
3. Lege in Music Assistant für jede Person einen aktiven Benutzer mit der Rolle **Benutzer** an. Beschränke dessen **Musikquellen** auf **genau die zugehörige Apple-Music-Instanz**. Ein Administrator oder ein Benutzer mit leerem Quellenfilter ist für diese Zuordnung nicht geeignet. Optionale Playerbeschränkungen müssen die Box freigeben.
4. Kopiere aus dem Release-ZIP **`custom_components/music_manager`** nach **`/config/custom_components/music_manager`** und starte HA neu. Diesen zusätzlichen Connector musst du auch bei einer vorhandenen HACS-Dashboard-Installation einmalig installieren; HACS lädt als Dashboard nur die Karte herunter.
5. Füge unter **Einstellungen → Geräte & Dienste → Integration hinzufügen → Music Manager** die bestehende Music-Assistant-Verbindung hinzu. Sie benötigt administrative Rechte zum Lesen und Prüfen der MA-Benutzer. Öffne danach **Music Manager → Konfigurieren → Benutzerzuordnung hinzufügen oder ändern** und wähle **HA-Benutzer, MA-Benutzer und Apple-Music-Konto**.
6. Wähle im visuellen Karteneditor unter **Apple Music: Music-Assistant-Entität derselben Box** den passenden Player. Native Sonos- und MA-Entität werden anhand ihrer Sonos-Hardwarekennung geprüft. Bei der Auswahl einer anderen Sonos-Box wird diese zusätzliche Entität zurückgesetzt.
7. Öffne die **Apple-Music-Kachel**. Suche Musik oder wähle Playlists, Alben bzw. Titel und tippe auf **Abspielen**.

Die Zuordnung ist **1:1 pro HA-Benutzer**, unabhängig von Box oder Dashboard. Ein MA-Benutzer und eine Apple-Music-Instanz können nicht zwei HA-Benutzern zugeordnet werden. Änderungen und Entfernungen erfolgen unter **Music Manager → Konfigurieren**. Die Karte übergibt keine Benutzer- oder Konto-ID; der Connector bestimmt den aktuellen Benutzer anhand der authentifizierten HA-Verbindung und prüft die Zuordnung bei jeder Anfrage erneut. Gelöschte oder nicht verfügbare Konten, leere Quellenfilter und fehlende Zuordnungen führen zu einem Einrichtungshinweis. Es gibt keinen Wechsel auf ein anderes Konto. Beim Benutzerwechsel werden offene Apple-Music-Ergebnisse entfernt.

Fehlt die Einrichtung, zeigt die Kachel die erforderlichen Schritte. Radio und persönliche Senderfavoriten bleiben verfügbar. Für spätere Connector-Updates den Ordner aus dem jeweiligen ZIP erneut kopieren und HA neu starten; die Benutzerzuordnungen bleiben als HA-Konfigurationsoptionen erhalten.

Beispiel mit Apple Music:

```yaml
type: custom:music-manager-card
entity: media_player.wohnzimmer
music_assistant_entity: media_player.sonos_wohnzimmer_music_assistant
```

Der zweite Entitätsname ist ein Beispiel: Wähle den tatsächlich von Music Assistant angelegten Player derselben Sonos-Box.

## Persönliche Favoriten

Im Radio Browser markierst du einen Sender mit dem **Stern** als Favoriten. Ein erneuter Tipp entfernt ihn. Unter **Sender wählen → Favoriten verwalten** siehst du außerdem alle gewählten Favoriten mit Logo und Häkchen. Entferne das Häkchen, um einen Sender abzuwählen; die Kurzwahl wird auf allen Karten und Geräten deines Benutzers aktualisiert. Diese Verwaltung funktioniert auch bei nicht erreichbarem Radio Browser oder Lautsprecher. Deine Favoriten erscheinen mit Senderlogo und Name direkt unter den Wiedergabetasten und dem Lautstärkeregler. Ein Tipp auf die Kurzwahl startet den Sender auf der Box dieser Karte. Fehlt das Logo oder kann es nicht geladen werden, erscheint ein Radiosymbol.

Favoriten gehören dem **angemeldeten Home-Assistant-Benutzer**, unabhängig von Karte, Dashboard oder Sonos-Box. Sie werden über Home Assistants Benutzerspeicher dauerhaft gespeichert und mit `frontend/subscribe_user_data` auf andere Karten, Browser und Geräte desselben Benutzers übertragen. Andere Benutzer haben ihre eigene Liste. Es gibt keine Favoriten in der Karten-YAML oder im lokalen Browserspeicher. Die Karte verwendet ausschließlich die authentifizierte Sitzung und übergibt weder Benutzer-ID noch Box-ID an den Speicher.

## Wiedergabe

- **Play/Pause** verwendet die aktuell verfügbaren Funktionen der Box. Unterstützt die Quelle nur Stop, zeigt die Karte stattdessen **Stop**. Live-Radio setzt beim Fortsetzen am aktuellen Live-Programm an.
- **Zurück/Weiter** steuern Titel der Sonos-Warteschlange. Ein Live-Radiosender bietet keinen Titelwechsel; diese Buttons springen nicht zwischen Radiosendern.
- **Stop** beendet die aktuelle Wiedergabe über `media_stop`.
- **Lautstärke** wirkt auf die konfigurierte Box; der Regler zeigt während des Ziehens oder der Tastaturbedienung den Prozentwert an und sendet erst beim Loslassen bzw. Bestätigen. Der linke Anschlag (0) schaltet lautlos. Ist die Box über eine andere App stummgeschaltet, hebt ein positiver Reglerwert die Stummschaltung auf.
- **Sonos-Gruppen** behalten ihr normales Wiedergabeverhalten. Die Karte erstellt oder trennt keine Gruppen.
- Die Karte zeigt den aktuellen Zustand der Box an, auch wenn die Wiedergabe über die Sonos-App gestartet wurde.
- Nicht verfügbare Geräte und nicht unterstützte Funktionen werden deaktiviert. Fehlgeschlagene Befehle erscheinen in der Karte; bei fehlgeschlagenem Senderstart bleibt die Auswahl geöffnet.

Die Karte verwendet die angemeldete HA-Sitzung für Senderauswahl und Steuerung. Service-Berechtigungen prüft Home Assistant; die Karte vergibt keine neuen Rechte. Das Ausblenden von Buttons ist eine Anzeigeeinstellung und keine Zugriffssperre.

## Logo und Marketplace-Vorbereitung

`brand/` enthält das neue Lautsprecher-/Musiknotenlogo im Stil der bestehenden Manager: SVG, transparente PNGs mit 256 und 512 Pixeln sowie helle und dunkle Varianten. `icon.png` und `logo.png` liegen zusätzlich im Projektstamm.

Das Quellprojekt enthält `hacs.json` für die Bereitstellung als **Dashboard-/Lovelace-Karte** über [v9h45n47mh-lab/music-manager](https://github.com/v9h45n47mh-lab/music-manager). Die Installation erfolgt über ein benutzerdefiniertes HACS-Repository; eine Aufnahme in den allgemeinen HACS-Katalog ist damit nicht verbunden. Welche Grafik HACS im Katalog zeigt, richtet sich nach dessen Branding-Verfahren; die mitgelieferten Dateien allein registrieren keinen Marketplace-Eintrag. Als reine Karte legt Music Manager keinen eigenen Eintrag unter HA „Geräte & Dienste“ an.

## Vorschau und Quellcode

`Vorschau.html` lässt sich direkt im Browser öffnen. Sie enthält zwei unabhängige Beispielkarten, Beispielsender und einen Schalter für helle/dunkle Darstellung. Die Vorschau zeigt auch die Apple-Music-Kachel und simulierte Mediathek. Sie steuert keine echten Boxen und meldet kein echtes Apple-Konto an. Das vollständige Projekt im Ordner `source/` enthält Quellcode, die unveränderte UI-Kit-Version, Prüfsummen, Buildskripte und Tests.

Der UI-Baukasten stammt aus [v9h45n47mh-lab/ha-ui-kit](https://github.com/v9h45n47mh-lab/ha-ui-kit), Release 1.2.2, Commit `6e398ba9415ed5a0b64e9703d11ab935ee7ea47d`. Schrift, Formulare, Buttons, Listenzeilen, Schalter, Reglerlogik und Dialoge stammen aus dem Kit. Die vier Medientasten, der originale HA-Lautstärkeregler und die Favoritenkacheln erhalten eine auf den vorgegebenen Screenshot abgestimmte Musikdarstellung mit Home-Assistant-Themefarben. Der Lautstärkeregler wird direkt von Home Assistant bereitgestellt. Beim Laden und in der Offline-Vorschau dient der unveränderte UI-Kit-Regler mit Prozentanzeige als Ersatz. Diese Ergänzung ist auf die Musikkomponenten begrenzt; die Kit-Dateien bleiben unverändert. Es gibt keinen Laufzeitdownload des Kits und kein CDN.

## Entwicklungsprüfung

Im Quellprojekt:

```sh
npm ci
npm run build
npm run check
npm test
npx playwright install chromium
npm run test:browser
```

`npm run build:icons` erzeugt die PNG-Logos aus der SVG-Vorlage. `python3 scripts/package.py` erstellt das Installationspaket einschließlich Vorschau.

**Durchgeführt:** Build, Prüfsummenprüfung der fest eingebundenen UI-Kit-Dateien und 34 erfolgreiche Testfälle (darin 13 Python-Prüfungen zur Kontotrennung) mit simuliertem Home Assistant. Geprüft wurden insbesondere Service-Ziele, Radio-Browser-Payloads, Regler, Editor, parallele Karten, persönliche Favoriten, Synchronisierung, Benutzerwechsel, Speicherfehler, Logos, Fehler, verspätete Antworten und sichere Textausgabe.

**Browserprüfung:** GitHub Actions führt zusätzlich 20 Browser-Szenarien mit Chromium aus, einschließlich Desktop-/Handyansicht bei 320, 375, 390, 430 und 1100 Pixeln, hellen/dunklen Themes, Apple-Music-Kachel und -Dialog, Editor, Fokusverhalten und Schriftvergleich mit unveränderten UI-Kit-Komponenten. Der aktuelle Prüfstatus ist über das Badge oben erreichbar; die Ansichten stehen als Workflow-Artefakte bereit.

**Noch offen:** Einrichtung in einer echten HA-Instanz, Apple-OAuth-Anmeldung und Wiedergabe auf echter Sonos-Hardware. Tests mit simulierten HA-Daten ersetzen keinen Test an deiner Box.

## Technische Referenzen

- [HA-Benutzerspeicher und Live-Synchronisierung](https://github.com/home-assistant/core/blob/2026.11.1/homeassistant/components/frontend/storage.py)
- [Home Assistant: Radio Browser](https://www.home-assistant.io/integrations/radio_browser/)
- [Music Assistant: Apple Music](https://www.music-assistant.io/music-providers/apple-music/)
- [Music Assistant: Benutzer und Musikquellenfilter](https://www.music-assistant.io/settings/user-management/)
- [Home Assistant: Music Assistant](https://www.home-assistant.io/integrations/music_assistant/)
- [Home Assistant: Sonos](https://www.home-assistant.io/integrations/sonos/)
- [Home Assistant: Media Player](https://www.home-assistant.io/integrations/media_player/)
- [Radio-Browser-Implementierung in HA 2026.11.1](https://github.com/home-assistant/core/blob/2026.11.1/homeassistant/components/radio_browser/media_source.py)
- [Media-Source-WebSocket-API in HA 2026.11.1](https://github.com/home-assistant/core/blob/2026.11.1/homeassistant/components/media_source/http.py)

Lizenz: MIT; die Lizenz des UI Kits ist in `LICENSES.txt` und im Quellprojekt enthalten.
