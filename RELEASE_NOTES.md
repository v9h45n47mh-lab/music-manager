# Music Manager 1.3.0

Oberfläche und Apple-Music-Connector werden jetzt **als gemeinsame Integration über den Marketplace installiert und aktualisiert**. Das manuelle Kopieren des Connectors und das Anlegen einer Dashboard-Ressource entfallen.

- Die Integration enthält die vollständige Karte, Logos, Prüfsummen und Lizenzen.
- Automatische Registrierung der Karte und Übernahme bekannter alter Music-Manager-Ressourcen; vorhandene Karten, Radiofavoriten und Kontozuordnungen bleiben erhalten.
- Einrichtung wahlweise mit Music Assistant oder zunächst nur für Radio. Apple Music lässt sich später unter **Konfigurieren → Music-Assistant-Verbindung** verbinden.
- Bestehende Apple-Music-Suche, persönliche Mediathek, 1:1-Kontozuordnung, native HA-Lautstärke und Favoritenverwaltung bleiben erhalten.

## Neu installieren

1. **Einstellungen → Marketplace → Aus Link hinzufügen**: `https://github.com/v9h45n47mh-lab/music-manager` eingeben und **Typ Integration** wählen.
2. **Installieren**, HA bei Aufforderung neu starten und die Integration einrichten. Im Einrichtungsdialog Music Assistant oder Nur Radio auswählen.
3. Die HA-Seite neu laden. Die Karte ist automatisch verfügbar. Apple-Music-Konten anschließend unter **Geräte & Dienste → Music Manager → Konfigurieren** zuordnen.

## Bisher als Dashboard/Lovelace installiert?

Einmalig das alte Music-Manager-Dashboard-Paket im Marketplace deinstallieren und den benutzerdefinierten Eintrag entfernen. Danach dieselbe URL mit **Typ Integration** erneut hinzufügen und installieren. Dashboard-Kartenkonfiguration und persönliche Favoriten bleiben erhalten. Eine vorhandene Music-Manager-Integration unter Geräte & Dienste nicht löschen; ihre Verbindung und Kontozuordnungen werden weiterverwendet.

Weitere Updates installieren Oberfläche und Connector gemeinsam. Nach einem Integrationsupdate HA neu starten und den Browser neu laden. Ein reines Dashboard-Update installiert keinen Connector.

Ausführliche [Installations- und Umstellungsanleitung](https://github.com/v9h45n47mh-lab/music-manager#installation-über-den-marketplace).

## Prüfung

Build und Versions-/Prüfsummenprüfung, 34 Node-Testfälle einschließlich 21 Python-Prüfungen für Installation, Ressourcenübernahme, Einstellungen und Kontotrennung sowie 21 Chromium-Browser-Szenarien für Desktop/Mobil und helle/dunkle Themes. Der [Actions-Prüfstatus](https://github.com/v9h45n47mh-lab/music-manager/actions/workflows/validate.yml) zeigt das Ergebnis.

Die Installation in einer echten HA-Instanz und die Wiedergabe mit einem echten Apple-Music-Konto und Sonos wurden hier nicht ausgeführt.
