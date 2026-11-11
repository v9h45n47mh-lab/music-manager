## Music Manager 1.11.0

Neue zusätzliche Karte **Music Manager – Player Beta** (`custom:music-manager-beta-card`). Die bisherige Karte bleibt verfügbar und wird nicht automatisch ersetzt.

- Player-Darstellung mit Cover, Titel, zentraler Play/Pause-Taste und persönlichem Box-Dropdown oben rechts.
- Vera und Manuel können ihre Box unabhängig wechseln. Die Auswahl wird je authentifiziertem HA-Benutzer gespeichert und beim nächsten Öffnen wiederhergestellt. Ausgangsbox Wohnzimmer: Manuel kann Büro, Vera Schlafzimmer wählen.
- Maximilian und Paul behalten die in der Karte konfigurierte Ausgangsbox und bekommen kein Dropdown.
- Favoriten, Wecklieder und Apple-Music-Konten bleiben persönlich. Wiedergabe und Lautstärke steuern nach einem Wechsel die gewählte Box; die MA-Zuordnung wird neu ermittelt.
- Konfiguration → **Box-Auswahl (Beta)** zeigt und verwaltet die freigeschalteten Benutzer. Eindeutig benannte aktive HA-Benutzer Vera und Manuel sind die Vorgabe; bei abweichenden Namen einmal die passenden Benutzer auswählen. HA-/MA-Berechtigungen bleiben erhalten.
- Optionales `navigation_id` trennt den gespeicherten Zustand mehrerer Beta-Karten.
- Standard-Dropdown, Status, Verwaltung und Dialoge verwenden das unveränderte HA UI Kit 1.3.1.

Nach dem Update HA neu starten und die Seite vollständig neu laden. Zum Testen eine vorhandene Karte duplizieren und ausschließlich ihren Typ auf **`custom:music-manager-beta-card`** ändern. Die konfigurierte `entity` bleibt die Ausgangsbox für Benutzer ohne Box-Auswahl. Ein Boxwechsel verschiebt keine laufende Wiedergabe.
