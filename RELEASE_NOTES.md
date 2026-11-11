# Music Manager 1.3.2

- Apple Music funktioniert mit derselben persönlichen Kontozuordnung auf allen in Music Assistant eingerichteten und für den Benutzer freigegebenen Sonos-Boxen.
- In jeder Karte genügt die Auswahl der Sonos-Box. Der Connector findet die zugehörige MA-Entität automatisch anhand der Sonos-Gerätekennung und der ausgewählten MA-Integration. Eine zusätzliche MA-Playerauswahl pro Karte entfällt.
- Suche, Mediathek und Wiedergabe verwenden weiterhin das Konto des angemeldeten HA-Benutzers. Die Wiedergabe und die anschließenden Wiedergabetasten richten sich nach der jeweiligen Box.
- Fehlende, deaktivierte oder mehrfach vorhandene MA-Entitäten erhalten gezielte Hinweise. Der Connector wechselt nicht auf eine andere Box. Bestehende HA- und MA-Playerfreigaben werden weiterhin geprüft.
- Bestehende manuelle MA-Playerzuordnungen bleiben gültig; der Karteneditor bietet standardmäßig **Automatisch – dieselbe Sonos-Box** an.

## Nach dem Update

1. Im Marketplace auf **1.3.2** aktualisieren und Home Assistant neu starten. Danach die HA-Seite neu laden.
2. Alle gewünschten Sonos-Boxen in Music Assistant über den Sonos-Player-Anbieter einrichten und ihre MA-Entitäten in HA aktivieren. Eventuelle MA-Playerfilter müssen diese Boxen freigeben.
3. Die bestehende HA-Benutzer → MA-Benutzer → Apple-Music-Konto-Zuordnung gilt für alle diese Boxen. In neuen Karten nur die Sonos-Box auswählen und Apple Music öffnen. Bei vorhandenen Karten ohne zusätzliche MA-Auswahl funktioniert die automatische Zuordnung ebenfalls.

MA-Administratorkonten werden weiterhin unterstützt. Der Musikquellenfilter muss genau das persönliche Apple-Music-Konto enthalten. Radiofavoriten und Benutzerzuordnungen bleiben erhalten.
