# Music Manager 1.12.0

![Music Manager](brand/icon.png)

[![Prüfungen](https://github.com/v9h45n47mh-lab/music-manager/actions/workflows/validate.yml/badge.svg)](https://github.com/v9h45n47mh-lab/music-manager/actions/workflows/validate.yml)

**Gemeinsame Home-Assistant-Integration mit Dashboard-Karte und Apple-Music-Connector**, mit **HA UI Kit 1.4.0**. Pro Karte wählst du eine Sonos-Box. Direkt in der Karte kannst du Radiosender suchen, nach Land, Sprache und Genre auswählen und auf dieser Box abspielen.

Zurück, Play/Pause und Weiter erscheinen als gleich breite Symboltasten. Bei Apple Music steht Shuffle als Symbol ohne Text in derselben Reihe, darunter der originale Home-Assistant-Lautstärkeregler mit Prozentanzeige während der Bedienung. Alle Bedienelemente lassen sich im visuellen Karteneditor einzeln ein- oder ausblenden. Oben links steht der aktuelle Sender oder Musiktitel deutlich größer; rechts oben erscheint der Boxname. Status und Interpret stehen kleiner unter der Musikauswahl. Lange Namen umbrechen auch auf dem Handy. Eine zusätzliche „Music Manager“-Überschrift gibt es nicht. Eine separate Stumm-Taste entfällt; Lautstärke 0 schaltet die Box lautlos. Direkt unter den Bedienelementen stehen persönliche Favoritensender mit Logo als Kurzwahl. Mehrere Karten steuern unabhängig voneinander ihre konfigurierte Box. Der Marketplace installiert und aktualisiert Oberfläche und Connector gemeinsam. Die Karte wird automatisch registriert. Radio funktioniert auch ohne Music Assistant; Apple Music lässt sich später einrichten und wird über **Apple Music** neben **Sender wählen** geöffnet.

## Zusätzliche Player-Karte · Beta (ab 1.12.0)

Die bisherige Karte bleibt erhalten. Zum Ausprobieren eine vorhandene Music-Manager-Karte duplizieren und nur `type` auf `custom:music-manager-beta-card` ändern. Alternativ im Kartenpicker **Music Manager – Player Beta** auswählen. Im Player steht keine Beta-Beschriftung.

```yaml
type: custom:music-manager-beta-card
entity: media_player.sonos_wohnzimmer
navigation_id: hauptplayer
```

`entity` durch deine tatsächliche native Sonos-Entität ersetzen. Sie bleibt die Ausgangsbox. `navigation_id` ist optional und trennt den gespeicherten Zustand mehrerer Karten; ohne Kennung teilen Beta-Karten mit gleicher Ausgangsbox den gespeicherten Stand.

- **Vera und Manuel:** Das kompakte Box-Dropdown steht oben links, ohne sichtbare Beschriftung. Die persönliche Box wird serverseitig je HA-Benutzer gespeichert und beim nächsten Öffnen wiederhergestellt. Unter Konfiguration → **Box-Auswahl (Beta)** werden die Benutzer angezeigt und verwaltet. Eindeutig benannte aktive HA-Benutzer Vera und Manuel sind die Vorgabe; bei abweichenden Namen einmal die Benutzer auswählen. HA-/MA-Berechtigungen gelten weiterhin.
- **Maximilian und Paul:** Die Karte bleibt auf der Ausgangsbox und hat kein Box-Dropdown. Ihre Einstellungen enthalten die gemeinsame Verwaltung **Favoriten & Wecklieder**, einschließlich Suche, Sortierung und Entfernen. Favoriten und Wecklieder bleiben getrennte persönliche Listen. Die beiden aktiven HA-Benutzer werden anhand ihrer eindeutigen Namen Maximilian und Paul erkannt; andere Benutzer bekommen in der Beta keine Wecklied-Funktionen.
- **Zahnrad oben rechts:** Öffnet **Sender**, **Apple Music** und die Favoritenverwaltung. Für Maximilian und Paul sind Favoriten und Wecklieder zusammengeführt. Es gibt keine zusätzliche Auswahlleiste unten. Bei Vera und Manuel entfallen Wecklieder, deren Datenladen, Verwaltung und Markierung einzelner Apple-Music-Titel vollständig in der Beta. Die allgemeine Weckerkonfiguration für Administratoren und die klassische Karte bleiben erhalten.
- **Favoritenkacheln:** ausschließlich Logo/Cover bzw. Ersatzsymbol, ohne sichtbare Texte. Tooltip und zugänglicher Name bleiben erhalten.
- **Radiowiedergabe:** nur Play/Pause; Vor/Zurück entfallen. Apple Music behält Titelwechsel und Shuffle. Die Hervorhebung der Player-Tasten bleibt auch beim Hover kreisrund.
- **Lautstärke:** 0–50 % über die gesamte Reglerbreite: 0 links, 25 in der Mitte, 50 ganz rechts. Auch gesendete Befehle und native HA-Slider-Ereignisse werden auf höchstens 50 % begrenzt. Dies ist die Begrenzung der Beta-Karte; andere HA-Karten, direkte HA-Serviceaufrufe und die Sonos-App bleiben unabhängig. Ein höherer extern eingestellter Pegel löst durch das bloße Anzeigen der Karte keinen Lautstärkebefehl aus.
- **UI Kit 1.4.0:** Kopf, Box-Auswahl, Zahnrad, Medientasten, Symbolfavoriten, Dialoge, Listen und Felder verwenden unveränderte gemeinsame Bausteine und Stile. Die Beta enthält keine eigenen CSS-Regeln. Der native HA-Lautstärkeregler wird weiter unterstützt; der Fallback stammt aus dem UI Kit.

Die Auswahl einer anderen Box verschiebt keine laufende Wiedergabe. Bei einem Speicherfehler bleibt die bisherige Box aktiv. Favoriten, Wecklieder und Apple-Music-Konto bleiben beim angemeldeten Benutzer. Die passende MA-Entität wird nach einem Wechsel neu ermittelt.

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
  shuffle: true
```

Für einen weiteren Raum kannst du eine zweite Karte mit einer anderen Sonos-Entität anlegen. Prüfe die Entitätsnamen in deinem aktuellen HA-System. Du kannst die Einstellungen anschließend im visuellen Karteneditor ändern. Wiedergabe, Titelwechsel, Lautstärke und Shuffle sind standardmäßig aktiviert. Shuffle erscheint bei Apple Music, wenn die Box es unterstützt. Alte `controls.stop`-Einträge werden ignoriert.

## Persönliche Favoriten und Reihenfolge

Sender, einzelne Apple-Music-Titel, Apple-Music-Alben und Apple-Music-Playlists erscheinen gemeinsam als Kurzwahl unter den Bedienelementen. Die Liste und ihre Reihenfolge gehören dem angemeldeten HA-Benutzer und gelten für alle seine Boxen und Karten. Bereits gespeicherte Senderfavoriten bleiben einschließlich ihrer bisherigen Reihenfolge erhalten.

- **Hinzufügen oder entfernen:** Im Radio Browser sowie bei Titeln, Alben und Playlists im Apple-Music-Dialog den Stern betätigen.
- **Titel eines Albums oder einer Playlist öffnen:** Im Apple-Music-Dialog oder in der Favoritenverwaltung **Titel anzeigen** wählen. Die einzelnen Titel lassen sich abspielen, unabhängig favorisieren oder als Wecklied vormerken. **Mehr laden** lädt weitere Titel; **Zurück** stellt die vorherige Ansicht einschließlich Suchbegriff und geladener Einträge wieder her.
- **Sortieren:** Unter der Kurzwahl **Favoriten** öffnen. Alternativ ist **Favoriten verwalten** in beiden Auswahldialogen verfügbar. Mit **↑ / ↓** wird der jeweilige Eintrag um einen Platz verschoben. Die neue Reihenfolge wird direkt gespeichert und auf den anderen Karten übernommen. Die Pfeile sind auch auf dem Handy sichtbar und per Tastatur bedienbar.
- **Entfernen:** In derselben Verwaltung das Häkchen beim betreffenden Sender, Titel, Album oder der Playlist entfernen.
- **Abspielen:** Ein Klick auf eine Kachel startet den Favoriten auf der Sonos-Box dieser Karte. Apple-Music-Favoriten werden beim Start erneut gegen die persönliche Kontozuordnung geprüft. Für ein nicht mehr verfügbares oder anders zugeordnetes Konto erscheint ein Fehler; der Connector startet kein Ersatzkonto.

Verfügbare öffentliche Album- und Playlist-Cover werden angezeigt, andernfalls das Apple-Music-Logo. **Apple Music** öffnet die Mediathek über den Button unter der Kurzwahl. Fehler beim Speichern oder Sortieren verändern die bestehende Liste nicht. Parallel gestartete Änderungen mehrerer Karten derselben HA-Verbindung werden nacheinander mit dem jeweils aktuellen Stand gespeichert.

## Konfiguration im Überblick

Unter **Einstellungen → Geräte & Dienste → Music Manager → Konfigurieren** öffnet sich die eigene Verwaltungsseite. Sie ist für HA-Administratoren auch über **Music Manager** in der Seitenleiste erreichbar. Drei einklappbare Bereiche zeigen die Music-Assistant-Verbindung, alle HA-/MA-/Apple-Music-Zuordnungen und sämtliche Wecker mit Benutzer, Box und gespeicherter Weckmusik.

Die Seite verwendet das fest eingebundene **HA UI Kit 1.4.0** für Kopfbereich, Bereiche, Zeilen, Symbole, Buttons, Auswahlfelder, Meldungen und Dialoge. Über das Stiftsymbol einen Eintrag bearbeiten; seine aktuellen Werte sind vorausgefüllt. Der Papierkorb öffnet eine ausdrückliche Bestätigung. Beim Wechsel der MA-Verbindung wird das Entfernen bestehender Kontozuordnungen zusätzlich bestätigt.

Die Verwaltungsseite speichert über die vorhandenen HA-Options-Flows. Eindeutige Konten, Quellenfilter, Benutzer- und Boxfreigaben werden weiterhin serverseitig geprüft. Die neue Übersichtsabfrage ist nur lesend und nur für aktive HA-Administratoren zugelassen. Sie liefert keine Zugangsdaten, Tokens oder Favoriten-URIs. Gespeicherte Zuordnungen bleiben auch bei nicht erreichbarem MA-Server sichtbar. Nach einem Benutzerwechsel werden offene Eingaben und Daten des vorherigen Benutzers verworfen.

## Handyansicht

Radio- und Apple-Music-Dialoge nutzen auf kleinen Bildschirmen die gesamte verfügbare Höhe. Der Schließen-Button bleibt oben erreichbar; es gibt einen durchgehenden Scrollbereich. Suchfeld, Mediathek-Tabs und Verwaltung sind getrennt angeordnet. Cover und Liednamen haben eine eigene Zeile, Aktionen darunter mindestens 44 Pixel große Bedienflächen. Sender wählen und Apple Music stehen nebeneinander; Favoriten und Wecklieder in der nächsten Zeile.

Die Weckmusik-Zeile verwendet unverändert die gemeinsame UI-Kit-Zeile und deren Button. „Auswählen“ bleibt auch auf schmalen Handys rechts neben dem Text. Der Text kann umbrechen; der Button bleibt vollständig innerhalb der Karte.

Die Weckerauswahl zeigt die markierten Lieder direkt als durchsuchbare Liste, ohne zusätzliches Dropdown. Ein Tipp auf eine Liedzeile speichert die Auswahl. Lange Titel umbrechen, das aktuelle Lied ist gekennzeichnet. „Auswahl zurücksetzen“ bleibt separat erreichbar. Das Weckersymbol ist bei ausgewählten Liedern ausgefüllt, sonst umrandet – entsprechend dem Favoritenstern.

## Persönliche Wecklieder

Wecklieder sind eine eigene Liste pro HA-Benutzer, unabhängig von den Favoriten. Bei einem einzelnen Apple-Music-Titel das **Weckersymbol** betätigen. Das speichert ihn ausschließlich unter **Wecklieder** direkt unter den Bedienelementen oder unter **Apple Music → Wecklieder**; es entsteht keine Kurzwahlkachel. In der Verwaltung lassen sich Lieder durchsuchen und über **Entfernen** einzeln aus der Liste nehmen. Diese Verwaltung benötigt keine erreichbare Music-Assistant-Verbindung. Ein Titel kann zusätzlich über den Stern ausdrücklich als normaler Favorit gespeichert werden. Beide Listen lassen sich unabhängig ändern.

Auch Titel aus Alben und Playlists sind auswählbar: **Album oder Playlist öffnen → Titel anzeigen → Weckersymbol beim gewünschten Lied**. Alben, Playlists und Radiosender selbst werden nicht als Wecklieder angeboten. Bisher mit dem Weckersymbol markierte Favoriten werden beim nächsten Laden einer Music-Manager-Karte automatisch in die getrennte Wecklied-Liste übernommen und aus der bisherigen Favoritenliste entfernt. Gespeicherte Weckerauswahlen bleiben erhalten.

**Kompatibilität:** „Titel anzeigen“ unterstützt auch den Music-Assistant-Client 1.6.0 aus Home Assistant 2026.11 sowie 1.5.1 aus 2026.10. Diese Clients liefern die vollständige Album-/Playlist-Titelliste; Music Manager zeigt sie in Seiten mit 50 Einträgen an. Neue Parameter für Benutzerausführung und serverseitiges Nachladen werden nur verwendet, wenn Client und Server sie unterstützen. Quelle und sichtbare Titel bleiben auf das exakt zugeordnete Apple-Music-Konto begrenzt.

Du kannst mehrere Wecker für verschiedene Personen sowie mehrere pro Person verwalten. Unter **Music Manager → Konfigurieren → Wecker → Wecker hinzufügen** werden sie einzeln angelegt. Jeder Wecker hat eine eindeutige Kennung, einen HA-Benutzer, seine Sonos-Box und getrennt gespeicherte persönliche Weckmusik. Neue Kennungen werden frei vorgeschlagen; eine doppelte Kennung wird mit Hinweis abgelehnt und überschreibt keinen bestehenden Wecker. Für Änderungen am vorhandenen Eintrag das Stiftsymbol verwenden.

Beispiel: `kind_1_wecker` mit Benutzer 1 und dessen Sonos-Box sowie `kind_2_wecker` mit Benutzer 2 und dessen Box. Für Schultag, Wochenende oder Ferien lassen sich bei Bedarf zusätzliche Kennungen je Person verwenden. In der jeweiligen Dashboard-Zeile und Automation muss genau die zugehörige `alarm_id` stehen. Zeiten, Licht und Rollläden werden weiterhin von der vorhandenen HA-Automation gesteuert.

Ab 1.6.0 enthält die Integration die Entities-Zeile `custom:music-manager-alarm-row` und die Aktion `music_manager.play_alarm`. Die Auswahl wird serverseitig im HA-Benutzerspeicher gesichert; die Automation funktioniert auch bei geschlossenem Dashboard und nach einem HA-Neustart.

1. In Music Manager die Apple-Music-Zuordnung des Wecker-Benutzers einrichten und einen gewünschten **einzelnen Titel über das Weckersymbol als Wecklied markieren**.
2. Als Administrator unter **Einstellungen → Geräte & Dienste → Music Manager → Konfigurieren → Wecker hinzufügen** die Kennung `school_alarm`, den HA-Benutzer **Wecker-Benutzer** und **seine Sonos-Box** auswählen. Bei mehreren Weckern muss jede Kennung eindeutig sein. Die Zuordnung kann später über das Stiftsymbol bearbeitet werden; die Kennung bleibt dabei erhalten.
3. Die passende Entities-Zeile in die vorhandene Weckerkarte einfügen:

```yaml
- type: custom:music-manager-alarm-row
  alarm_id: school_alarm
  name: Weckmusik
```

4. Unter **Weckmusik → Auswählen** ein Lied aus der persönlichen **Wecklied-Liste** des Wecker-Benutzers wählen. Ein Administrator darf dies ebenfalls für den fest zugeordneten Benutzer erledigen. Andere Benutzer können seine Auswahl weder sehen noch ändern. Die Oberfläche zeigt den tatsächlichen Besitzer und die Box vor der Auswahl an.
5. Im bestehenden Sonos-Zweig der Weckerautomation den bisherigen Start durch folgende Aktion ersetzen:

```yaml
- action: music_manager.play_alarm
  data:
    alarm_id: school_alarm
```

Neutrale Einfügebeispiele stehen unter [`examples/alarm_row.yaml`](examples/alarm_row.yaml) und [`examples/alarm_action.yaml`](examples/alarm_action.yaml). Füge die Auswahl nur in den Abschnitt ein, dessen Automation tatsächlich Musik startet. Licht-, Rollladen-, Kalender- und Stop-Aktionen bleiben in der vorhandenen Automation. Die Beispiele enthalten keine persönlichen Entitätsnamen oder vollständigen privaten Automationen.

In der Auswahlliste stehen ausschließlich ausdrücklich markierte **einzelne Wecklieder** des zugeordneten Benutzers. Normale Favoriten, Alben und Playlists werden dort nicht angeboten. Die bisherige Auswahl wird separat angezeigt; **Auswahl zurücksetzen** entfernt sie. Ohne Auswahl wird wie bisher die letzte Sonos-Wiedergabe fortgesetzt. Bereits gespeicherte Weckmusik bleibt bis zum ausdrücklichen Austausch erhalten, auch ältere Album-/Playlist-Auswahlen oder später entfernte Wecklied-Markierungen. Beim Öffnen wird daraus kein zusätzlicher Listeneintrag erzeugt. So wird ein bestehender Wecker durch das Update oder das Entfernen einer Markierung nicht stillschweigend abgeschaltet.

Der Hintergrundstart akzeptiert ausschließlich die vorher vom Administrator konfigurierte **Weckerkennung**, keine frei übergebenen Benutzer-, Konto- oder Lautsprecherkennungen. Er prüft vor Apple-Music-Wiedergabe erneut den aktiven HA-Besitzer, seine HA- und MA-Boxfreigaben, das persönliche MA-Konto und den exakten Apple-Music-Anbieter. Bei gelöschten Konten, geänderten Zuordnungen oder nicht erreichbarer Box erscheint ein Fehler in der Automation; eine fehlgeschlagene Apple-Music-Wiedergabe wechselt nicht automatisch zu einer anderen Quelle.

## Apple Music

Die Schaltfläche **Apple Music** steht unten neben **Sender wählen**. In der Kachelreihe stehen ausschließlich persönliche Sender-, Album- und Playlistfavoriten. **Apple Music** öffnet deine persönlichen **Playlists, Alben und Titel** sowie die **Apple-Music-Suche**. „Abspielen“ startet den Titel, das Album oder die Playlist auf der Sonos-Box dieser Karte. Weitere Mediathekeinträge lassen sich mit „Mehr laden“ abrufen. Für Apple Music werden die Wiedergabetasten an die zugehörige Music-Assistant-Warteschlange weitergegeben. Radiosender starten weiterhin über die native Sonos-Integration.

Während Apple Music läuft, zeigt die Tastenreihe zusätzlich **Shuffle als Symbol** und darunter eine **Zeitleiste mit verstrichener Zeit und Gesamtdauer**, ohne die zusätzliche Beschriftung „Titelposition“. Die Zeitleiste lässt sich vorwärts und rückwärts ziehen; der Spulbefehl wird erst beim Loslassen gesendet. Während des Ziehens bleiben Position und Zeitangabe stabil. Bei einem Titel- oder Boxwechsel wird eine begonnene Eingabe verworfen. Die Position läuft während der Wiedergabe weiter und bleibt bei Pause stehen. Ohne bekannte Dauer wird keine Zeitleiste angezeigt.

**Weiter** startet einen bereits bekannten nächsten Titel der eigenen aktiven MA-Warteschlange direkt und vermeidet dadurch deren zusätzliche Ein-Sekunden-Verzögerung. Die vorhandene Shuffle-Reihenfolge bleibt erhalten. Bei Gruppen, unbekanntem nächsten Eintrag oder Wiederholung des aktuellen Titels wird der normale MA-Befehl verwendet. Ein ausstehender Wechsel zeigt „Nächster Titel wird geladen …“ und wird nicht doppelt gesendet. Die eigentliche Ladezeit des Apple-Music-Streams bleibt von MA und Apple abhängig; MA dokumentiert mögliche Pausen bis etwa fünf Sekunden.

Beim Wechsel zurück zu einem Radiosender übernimmt die Karte sofort wieder den nativen Sonos-Player und zeigt den gewählten Sender. Verspätete MA-Meldungen mit dem letzten Apple-Music-Titel ändern die Radioanzeige nicht. Shuffle und Zeitleiste verschwinden bei Radio; schlägt der Wechsel fehl, bleibt die vorherige Wiedergabe erhalten.

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
6. Wähle in jeder Karte nur die gewünschte **Sonos-Box**. Der Connector findet automatisch die MA-Entität derselben Box anhand ihrer Sonos-Hardwarekennung und der verbundenen MA-Integration. Eine zusätzliche Playerzuordnung pro Karte ist nicht erforderlich. Dein Apple-Music-Konto gilt auf allen so eingerichteten und für dich freigegebenen Boxen. Jede Box muss in MA über den Sonos-Player-Anbieter eingerichtet sein; ihre MA-Entität muss in HA aktiviert sein. Bestehende HA- und MA-Playerfreigaben gelten weiterhin. Im Karteneditor ist **Apple Music: Music-Assistant-Player → Automatisch – dieselbe Sonos-Box** voreingestellt. Nur bei mehreren passenden MA-Entitäten ist eine manuelle Auswahl erforderlich; vorhandene manuelle Zuordnungen bleiben gültig.
7. Öffne die **Apple-Music-Kachel**. Suche Musik oder wähle Playlists, Alben bzw. Titel und tippe auf **Abspielen**.

Die Kontozuordnung ist **1:1 pro HA-Benutzer**, unabhängig von Box oder Dashboard. Derselbe HA-Benutzer verwendet auf allen seinen freigegebenen Sonos-Boxen dasselbe zugeordnete Apple-Music-Konto; die jeweilige Karte bestimmt das Wiedergabeziel. Ein MA-Benutzer und eine Apple-Music-Instanz können nicht zwei HA-Benutzern zugeordnet werden. Änderungen und Entfernungen erfolgen unter **Music Manager → Konfigurieren**. Die Karte übergibt keine Benutzer- oder Konto-ID; der Connector bestimmt den aktuellen Benutzer anhand der authentifizierten HA-Verbindung und prüft die Zuordnung bei jeder Anfrage erneut. Gelöschte oder nicht verfügbare Konten, leere Quellenfilter und fehlende Zuordnungen führen zu einem Einrichtungshinweis. Der Connector wählt kein Ersatzkonto aus. Die weitere Auflösung der Wiedergabequelle erfolgt durch Music Assistant. Beim Benutzerwechsel werden offene Apple-Music-Ergebnisse entfernt.

Fehlt die Einrichtung, zeigt die Kachel die erforderlichen Schritte. Radio und persönliche Senderfavoriten bleiben verfügbar. Weitere Updates kommen über den Marketplace für das gesamte Paket. Die Benutzerzuordnungen bleiben als HA-Konfigurationsoptionen erhalten. Bei einem ausdrücklich gewählten Wechsel zu einem anderen MA-Server oder zu Nur Radio werden nur die Apple-Music-Zuordnungen zurückgesetzt; Radiofavoriten bleiben erhalten.

Beispiel mit Apple Music:

```yaml
type: custom:music-manager-card
entity: media_player.wohnzimmer
```

Der zweite Entitätsname ist ein Beispiel: Wähle den tatsächlich von Music Assistant angelegten Player derselben Sonos-Box.

### Apple Music mit Access Control freigeben

Radio steuert die native Sonos-Entität. Apple Music verwendet zusätzlich die von der offiziellen Music-Assistant-Integration angelegte Playerentität **derselben Box**. Für eingeschränkte Benutzer müssen beide Entitäten zum Anzeigen und Bedienen freigegeben sein. Wird die Freigabe über Labels gesteuert, unter **Einstellungen → Geräte & Dienste → Entitäten** beim zusätzlichen Music-Assistant-Player das passende freigegebene Label setzen. Eine Labelfreigabe auf der nativen Sonos-Entität gilt nicht automatisch für den zweiten Player.

Access Control kann eine Statusantwort zu einer ausgeblendeten Entität vollständig auf `null` filtern, ohne einen zusätzlichen abgewiesenen Befehl zu protokollieren. Ab 1.7.1 erklärt die Karte diesen Fall, statt `Cannot read properties of null (reading 'entity_id')` anzuzeigen. Suche und Wiedergabe werden erst nach einem gültigen Status freigeschaltet. Nach der Rechteänderung Apple Music schließen und erneut öffnen. Die Kontozuordnung im Music Manager und die Playerfreigabe in Music Assistant müssen ebenfalls stimmen; es werden keine Rechte automatisch erweitert und kein Ersatzkonto oder Ersatzplayer gewählt.

## Persönliche Favoriten

Im Radio Browser markierst du einen Sender mit dem **Stern** als Favoriten. Ein erneuter Tipp entfernt ihn. Unter **Sender wählen → Favoriten verwalten** siehst du außerdem alle gewählten Favoriten mit Logo und Häkchen. Entferne das Häkchen, um einen Sender abzuwählen; die Kurzwahl wird auf allen Karten und Geräten deines Benutzers aktualisiert. Diese Verwaltung funktioniert auch bei nicht erreichbarem Radio Browser oder Lautsprecher. Deine Favoriten erscheinen mit Senderlogo und Name direkt unter den Wiedergabetasten und dem Lautstärkeregler. Ein Tipp auf die Kurzwahl startet den Sender auf der Box dieser Karte. Fehlt das Logo oder kann es nicht geladen werden, erscheint ein Radiosymbol.

Favoriten gehören dem **angemeldeten Home-Assistant-Benutzer**, unabhängig von Karte, Dashboard oder Sonos-Box. Sie werden über Home Assistants Benutzerspeicher dauerhaft gespeichert und mit `frontend/subscribe_user_data` auf andere Karten, Browser und Geräte desselben Benutzers übertragen. Andere Benutzer haben ihre eigene Liste. Es gibt keine Favoriten in der Karten-YAML oder im lokalen Browserspeicher. Die Karte verwendet ausschließlich die authentifizierte Sitzung und übergibt weder Benutzer-ID noch Box-ID an den Speicher.

## Wiedergabe

- **Play/Pause** verwendet die aktuell verfügbaren Funktionen der Box. Unterstützt die Quelle zum Unterbrechen nur Stop, verwendet dieselbe Play/Pause-Taste intern `media_stop`. Live-Radio setzt beim Fortsetzen am aktuellen Live-Programm an.
- **Zurück/Weiter** steuern Titel der Sonos-Warteschlange. Ein Live-Radiosender bietet keinen Titelwechsel; diese Buttons springen nicht zwischen Radiosendern.
- Eine separate **Stop-Taste** entfällt. **Shuffle** steht bei Apple Music als Symbol direkt neben den Wiedergabetasten; der aktive Zustand wird hervorgehoben.
- **Lautstärke** wirkt auf die konfigurierte Box; der Regler zeigt während des Ziehens oder der Tastaturbedienung den Prozentwert an und sendet erst beim Loslassen bzw. Bestätigen. Der linke Anschlag (0) schaltet lautlos. Ist die Box über eine andere App stummgeschaltet, hebt ein positiver Reglerwert die Stummschaltung auf.
- **Sonos-Gruppen** behalten ihr normales Wiedergabeverhalten. Die Karte erstellt oder trennt keine Gruppen.
- Die Karte zeigt den aktuellen Zustand der Box an, auch wenn die Wiedergabe über die Sonos-App gestartet wurde.
- Nicht verfügbare Geräte und nicht unterstützte Funktionen werden deaktiviert. Fehlgeschlagene Befehle erscheinen in der Karte; bei fehlgeschlagenem Senderstart bleibt die Auswahl geöffnet.

Die Karte verwendet die angemeldete HA-Sitzung für Senderauswahl und Steuerung. Service-Berechtigungen prüft Home Assistant; die Karte vergibt keine neuen Rechte. Das Ausblenden von Buttons ist eine Anzeigeeinstellung und keine Zugriffssperre.

## Logo und gemeinsames Paket

`custom_components/music_manager/brand/` enthält die Logos für die Integration in hellen und dunklen Themes. `frontend/` in derselben Integration enthält die vollständige, lokal gebündelte Karte, die Prüfsummen und die Lizenzen. Es gibt keinen separaten Download des Connectors oder des UI Kits zur Laufzeit.

`hacs.json` bleibt auch mit alten Dashboard-Installationen kompatibel. Für die gemeinsame Installation deshalb beim Hinzufügen der Repository-URL ausdrücklich den Typ **Integration** wählen. Die Integration registriert die Karte und aktualisiert ihre Ressourcen-URL bei neuen Versionen automatisch.

## Vorschau und Quellcode

`Vorschau.html` lässt sich direkt im Browser öffnen. Sie enthält zwei unabhängige Beispielkarten, Beispielsender und einen Schalter für helle/dunkle Darstellung. Die Vorschau zeigt auch die Apple-Music-Schaltfläche und simulierte Mediathek. Sie steuert keine echten Boxen und meldet kein echtes Apple-Konto an. Das vollständige Projekt im Ordner `source/` enthält Quellcode, die unveränderte UI-Kit-Version, Prüfsummen, Buildskripte und Tests.

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
