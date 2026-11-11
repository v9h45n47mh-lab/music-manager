# Music Manager 1.3.1

- Bestehende Music-Assistant-Konten mit der Rolle **Administrator** lassen sich jetzt direkt einem HA-Benutzer und dessen Apple-Music-Anmeldung zuordnen. Ein zusätzlicher normaler MA-Benutzer ist nicht erforderlich; die Admin-Rolle bleibt erhalten.
- Der Connector prüft bei jeder Anfrage weiterhin die eindeutige 1:1-Zuordnung und den Musikquellenfilter. Auch für Admin-Konten muss in MA genau die zugeordnete Apple-Music-Instanz ausgewählt sein.
- Der Einrichtungsdialog erklärt den Quellenfilter und meldet deaktivierte Konten oder nicht verfügbare Apple-Music-Anmeldungen gezielt.
- Bestehende Zuordnungen, Radiofavoriten und Kartenkonfigurationen bleiben erhalten.

## Nach dem Update

1. Aktualisiere **Music Manager auf 1.3.1** im Marketplace und starte Home Assistant neu.
2. Öffne **Music Assistant → Einstellungen → Benutzerverwaltung → dein Admin-Konto → Musikquellen** und wähle nur deine Apple-Music-Anmeldung. Die Rolle Administrator beibehalten. Der Quellenfilter gilt für dieses MA-Konto auch außerhalb von Music Manager.
3. Öffne in HA **Einstellungen → Geräte & Dienste → Music Manager → Konfigurieren → Benutzerzuordnung hinzufügen oder ändern**. Wähle deinen HA-Benutzer, dein bestehendes MA-Admin-Konto und dieselbe Apple-Music-Anmeldung.

Die Karte und der Connector werden weiterhin gemeinsam als Marketplace-Integration aktualisiert. Apple-Passwörter und Tokens bleiben in Music Assistant.
