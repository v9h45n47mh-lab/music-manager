# Music Manager 1.4.0

- **Apple Music: Shuffle** lässt sich direkt in der Karte ein- und ausschalten. Die Anzeige folgt dem tatsächlichen Zustand der MA-Warteschlange.
- **Apple Music: Zeitleiste** mit verstrichener Zeit und Gesamtdauer. Ziehen zum Vor- und Zurückspulen; erst Loslassen sendet einen Befehl. Titel- und Boxwechsel verwerfen laufende Eingaben. Bei fehlender Dauer wird keine Zeitleiste angeboten.
- **Titelwechsel optimiert:** Ein bekannter nächster Eintrag in der eigenen aktiven MA-Warteschlange wird direkt gestartet, ohne die zusätzliche Ein-Sekunden-Verzögerung des normalen MA-Weiter-Befehls. Gruppen, Wiederholung des aktuellen Titels und unklare Warteschlangenzustände verwenden den normalen MA-Befehl. Während des Wechsels erscheint eine unmittelbare Rückmeldung; wiederholte Klicks starten keinen zweiten Wechsel.
- **Radioanzeige korrigiert:** Nach Apple Music zeigt die Karte sofort wieder den ausgewählten Radiosender und steuert den nativen Sonos-Player. Der letzte MA-Titel kann diese Anzeige nicht mehr überschreiben. Shuffle und Zeitleiste werden ausgeblendet.

Die Ladezeit von Apple Music hängt weiterhin von MA und Apple ab. MA dokumentiert mögliche Pausen bis etwa fünf Sekunden: https://www.music-assistant.io/music-providers/apple-music/

## Aktualisieren

Im Marketplace auf **1.4.0** aktualisieren, Home Assistant neu starten und danach die HA-Seite neu laden. Karte und Connector werden gemeinsam aktualisiert. Benutzerzuordnungen und Radiofavoriten bleiben erhalten.
