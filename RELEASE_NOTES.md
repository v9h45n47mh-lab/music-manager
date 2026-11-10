Die Karte verwendet jetzt die kompakte Mediensteuerung nach der Screenshot-Vorlage und persönliche Radiofavoriten.

- Oben nur der Name der gewählten Sonos-Box, ohne Music-Manager-Titel oder Navigation.
- Vier gleich breite Symboltasten: Zurück, Play/Pause, Stop, Weiter.
- Breiter Lautstärkeregler; keine separate Stumm-Taste. 0 schaltet lautlos, ein positiver Wert hebt eine externe Stummschaltung auf.
- Sender im Radio Browser mit dem Stern favorisieren oder entfernen.
- Kurzwahl mit Senderlogo direkt unter den Bedienelementen, inklusive Ersatzsymbol bei fehlendem Logo.
- Favoriten dauerhaft im Home-Assistant-Benutzerprofil: unabhängig von Box, Karte, Browser und Gerät. Live-Synchronisierung für denselben Benutzer; getrennte Listen für andere Benutzer.
- HA UI Kit 1.2.2 weiterhin unverändert enthalten; Musikdarstellung nach der Vorlage ergänzt. Marketplace-Logo bleibt enthalten.

Installation: In HACS auf 1.1.0 aktualisieren und das Dashboard vollständig neu laden. Bei manueller Installation die JS-Datei ersetzen und den Ressourcenparameter auf `?v=1.1.0` setzen. Bestehende Kartenkonfigurationen funktionieren weiterhin; `name` und `controls.mute` werden für die Darstellung nicht mehr verwendet.

24 Funktions-/DOM-Tests sowie 15 Browser-Szenarien mit mobilen und Desktop-Ansichten in hellen und dunklen Themes. Der aktuelle Status steht in GitHub Actions. Sonos-Hardware wurde in dieser Umgebung nicht live getestet.
