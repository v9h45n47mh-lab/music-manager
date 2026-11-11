# Music Manager 1.3.1

![Music Manager](brand/icon.png)

[![Prüfungen](https://github.com/v9h45n47mh-lab/music-manager/actions/workflows/validate.yml/badge.svg)](https://github.com/v9h45n47mh-lab/music-manager/actions/workflows/validate.yml)

**Gemeinsame Home-Assistant-Integration mit Dashboard-Karte und Apple-Music-Connector**, mit **HA UI Kit 1.2.2**. Pro Karte wählst du eine Sonos-Box. Direkt in der Karte kannst du Radiosender suchen, nach Land, Sprache und Genre auswählen und auf dieser Box abspielen.

Zurück, Play/Pause, Stop und Weiter erscheinen als vier gleich breite Symboltasten, darunter der originale Home-Assistant-Lautstärkeregler mit Prozentanzeige während der Bedienung. Alle Bedienelemente lassen sich im visuellen Karteneditor einzeln ein- oder ausblenden. Oben steht ausschließlich die gewählte Box, ohne „Music Manager“-Überschrift. Eine separate Stumm-Taste entfällt; Lautstärke 0 schaltet die Box lautlos. Direkt unter den Bedienelementen stehen persönliche Favoritensender mit Logo als Kurzwahl. Mehrere Karten steuern unabhängig voneinander ihre konfigurierte Box. Der Marketplace installiert und aktualisiert Oberfläche und Connector gemeinsam. Die Karte wird automatisch registriert. Radio funktioniert auch ohne Music Assistant; Apple Music lässt sich später einrichten und hat eine eigene Kachel mit Logo.

## Installation über den Marketplace

Voraussetzungen: Home Assistant **2026.11 oder neuer**. Für Radio die offiziellen Integrationen **Sonos** und **Radio Browser** einrichten. Radio Browser benötigt kein Konto und keinen API-Schlüssel. Music Assistant ist nur für Apple Music erforderlich.

1. Öffne **Einstellungen → Marketplace → Aus Link hinzufügen**.
2. Gib `https://github.com/v9h45n47mh-lab/music-manager` ein. Wenn nach dem Typ gefragt wird, wähle **Integration**. Verbinde GitHub, falls der Marketplace danach fragt.
3. Öffne **Music Manager** und wähle **Installieren**. Karte, Connector und Logo werden zusammen nach `custom_components/music_manager` installiert. Du musst keine Dateien kopieren.
4. Wenn der Marketplace einen Neustart verlangt, starte HA neu. Öffne danach den Einrichtungsdialog bzw. **Einstellungen → Geräte & Dienste → Integration hinzufügen → Music Manager**.
5. Wähle deine bestehende **Music-Assistant-Verbindung** oder **Nur Radio – Apple Music später einrichten** und bestätige. Die Integration legt die Dashboard-Ressource automatisch an und stellt die Karte bereit.
6. Lade die HA-Seite vollständig neu. Füge im Dashboard die Karte **Music Manager** hinzu und wähle deine Sonos-Box.

Das Repository ist ein benutzerdefinierter Marketplace-Eintrag; es wird dadurch nicht in den allgemeinen Katalog aufgenommen. Unter älteren HACS-Oberflächen heißt der Weg **Benutzerdefinierte Repositories → Typ Integration**. Der gemeinsame Betrieb setzt HA 2026.11 voraus.

### Vorhandene Dashboard-Installation einmalig umstellen

Wenn Music Manager bisher im Marketplace/HACS mit Typ **Dashboard/Lovelace** installiert ist, kann derselbe Repository-Eintrag nicht zusätzlich als Integration hinzugefügt werden:

1. Deinstalliere im Marketplace **nur das bisherige Music-Manager-Dashboard-Paket**. Deine Dashboard-Kartenkonfiguration und die persönlichen Favoriten bleiben erhalten. Eine bereits eingerichtete Music-Manager-Integration unter Geräte & Dienste nicht löschen.
2. Entferne den alten benutzerdefinierten Repository-Eintrag unter **Aus Link hinzufügen → Aus Links hinzugefügt**, falls er dort nach der Deinstallation noch vorhanden ist.
3. Füge dieselbe GitHub-URL erneut hinzu, wähle diesmal **Integration** und installiere **1.3.0 oder neuer** wie oben.
4. Starte HA neu, falls angefordert, und lade anschließend den Browser neu. Falls der Connector aus 1.2.0 bereits eingerichtet war, bleiben seine Music-Assistant-Verbindung und die Benutzerzuordnungen erhalten.

Nach dieser einmaligen Umstellung laufen künftige Updates für Karte und Connector gemeinsam über **Einstellungen → Updates**. Nach einem Integrationsupdate HA neu starten und die Seite neu laden. Ein reines Dashboard-Update kopiert keinen Python-Connector; deshalb ist der Wechsel des Marketplace-Typs erforderlich.

Die Integration übernimmt bekannte alte Ressourcen unter `/hacsfiles/music-manager/…`, `/local/community/music-manager/…` und `/local/music-manager/…` automatisch. Doppelte bekannte Ressourcen werden zusammengeführt. Fremde Ressourcen und Dashboard-Konfigurationen werden nicht verändert. Bei YAML-Ressourcen wird die alte Music-Manager-URL nur im laufenden Speicher ersetzt; deine YAML-Datei bleibt unverändert.

### Manuelle Installation als Alternative

Das Release-ZIP enthält ebenfalls das vollständige gemeinsame Paket. Kopiere daraus **`custom_components/music_manager`** nach **`/config/custom_components/music_manager`**, starte HA neu und füge **Music Manager** unter **Geräte & Dienste** hinzu. Die enthaltene Karte wird automatisch registriert; der `www`-Ordner muss dafür nicht zusätzlich kopiert werden.

Die separate JS-Datei und `www/music-manager` im ZIP bleiben für bestehende reine Dashboard-Installationen verfügbar. Diese Betriebsform kann Radio weiter verwenden. Der gemeinsame automatische Installations- und Updateweg ist die Marketplace-Kategorie **Integration**.

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
3. Verwende für jede Person ein eigenes aktives Music-Assistant-Konto mit der Rolle **Benutzer oder Administrator**. Dein vorhandenes Admin-Konto kannst du weiterverwenden; du brauchst dafür keinen zusätzlichen Benutzer. Öffne **Music Assistant → Einstellungen → Benutzerverwaltung → dein Benutzer → Musikquellen** und wähle **genau die zugehörige Apple-Music-Instanz**, beispielsweise „Apple Music Manuel“. **Die Rolle Administrator bleibt bestehen.** Der Quellenfilter gilt für dieses Konto auch bei direkter Nutzung von Music Assistant. Ein leerer Filter, mehrere Quellen oder eine andere Apple-Music-Instanz werden vom Connector abgelehnt. Optionale Playerbeschränkungen müssen die Box freigeben.
4. Installiere **Music Manager als Integration über den Marketplace**, wie oben beschrieben. Der Apple-Music-Connector ist bereits enthalten und wird gemeinsam mit der Karte aktualisiert.
5. Wenn du bei der Einrichtung Nur Radio gewählt hast: Öffne **Geräte & Dienste → Music Manager → Konfigurieren → Music-Assistant-Verbindung** und wähle die vorhandene MA-Verbindung. Sie benötigt Rechte zum Lesen und Prüfen der MA-Benutzer. Öffne danach **Konfigurieren → Benutzerzuordnung hinzufügen oder ändern**. Dort gibt es drei Auswahlfelder:

   | Feld | Beispiel |
   |---|---|
   | Home-Assistant-Benutzer | Manuel, dein HA-Anmeldekonto |
   | Music-Assistant-Benutzer | Dein bestehendes persönliches MA-Konto, auch als Administrator |
   | Apple-Music-Konto in Music Assistant | Die Musikquelle „Apple Music Manuel“ |

   Wähle die drei zusammengehörigen Einträge und speichere. Diese Zuordnung gehört zu Music Manager; sie wird zusätzlich zu einer eventuellen automatischen HA-Anmeldung in Music Assistant gespeichert.
6. Wähle im visuellen Karteneditor unter **Apple Music: Music-Assistant-Entität derselben Box** den passenden Player. Native Sonos- und MA-Entität werden anhand ihrer Sonos-Hardwarekennung geprüft. Bei der Auswahl einer anderen Sonos-Box wird diese zusätzliche Entität zurückgesetzt.
7. Öffne die **Apple-Music-Kachel**. Suche Musik oder wähle Playlists, Alben bzw. Titel und tippe auf **Abspielen**.

Die Zuordnung ist **1:1 pro HA-Benutzer**, unabhängig von Box oder Dashboard. Ein MA-Benutzer und eine Apple-Music-Instanz können nicht zwei HA-Benutzern zugeordnet werden. Änderungen und Entfernungen erfolgen unter **Music Manager → Konfigurieren**. Die Karte übergibt keine Benutzer- oder Konto-ID; der Connector bestimmt den aktuellen Benutzer anhand der authentifizierten HA-Verbindung und prüft die Zuordnung bei jeder Anfrage erneut. Gelöschte oder nicht verfügbare Konten, leere Quellenfilter und fehlende Zuordnungen führen zu einem Einrichtungshinweis. Der Connector wählt kein Ersatzkonto aus. Die weitere Auflösung der Wiedergabequelle erfolgt durch Music Assistant. Beim Benutzerwechsel werden offene Apple-Music-Ergebnisse entfernt.

Fehlt die Einrichtung, zeigt die Kachel die erforderlichen Schritte. Radio und persönliche Senderfavoriten bleiben verfügbar. Weitere Updates kommen über den Marketplace für das gesamte Paket. Die Benutzerzuordnungen bleiben als HA-Konfigurationsoptionen erhalten. Bei einem ausdrücklich gewählten Wechsel zu einem anderen MA-Server oder zu Nur Radio werden nur die Apple-Music-Zuordnungen zurückgesetzt; Radiofavoriten bleiben erhalten.

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

## Logo und gemeinsames Paket

`custom_components/music_manager/brand/` enthält die Logos für die Integration in hellen und dunklen Themes. `frontend/` in derselben Integration enthält die vollständige, lokal gebündelte Karte, die Prüfsummen und die Lizenzen. Es gibt keinen separaten Download des Connectors oder des UI Kits zur Laufzeit.

`hacs.json` bleibt auch mit alten Dashboard-Installationen kompatibel. Für die gemeinsame Installation deshalb beim Hinzufügen der Repository-URL ausdrücklich den Typ **Integration** wählen. Die Integration registriert die Karte und aktualisiert ihre Ressourcen-URL bei neuen Versionen automatisch.

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

**Durchgeführt:** Build, Prüfsummenprüfung der fest eingebundenen UI-Kit-Dateien und 34 erfolgreiche Testfälle (darin 21 Python-Prüfungen zu Installation, Ressourcenübernahme, optionaler MA-Einrichtung und Kontotrennung) mit simuliertem Home Assistant. Geprüft wurden insbesondere Service-Ziele, Radio-Browser-Payloads, Regler, Editor, parallele Karten, persönliche Favoriten, Synchronisierung, Benutzerwechsel, Speicherfehler, Logos, Fehler, verspätete Antworten und sichere Textausgabe.

**Browserprüfung:** GitHub Actions führt zusätzlich 21 Browser-Szenarien mit Chromium aus, einschließlich Desktop-/Handyansicht bei 320, 375, 390, 430 und 1100 Pixeln, hellen/dunklen Themes, Apple-Music-Kachel und -Dialog, Editor, Fokusverhalten und Schriftvergleich mit unveränderten UI-Kit-Komponenten. Der aktuelle Prüfstatus ist über das Badge oben erreichbar; die Ansichten stehen als Workflow-Artefakte bereit.

**Noch offen:** Einrichtung in einer echten HA-Instanz, Apple-OAuth-Anmeldung und Wiedergabe auf echter Sonos-Hardware. Tests mit simulierten HA-Daten ersetzen keinen Test an deiner Box.

## Technische Referenzen

- [Marketplace: Installation und Updates](https://www.home-assistant.io/integrations/marketplace/)
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
