## Music Manager 2.0.0

- Das optimierte Player-Design ist jetzt das Design der **regulären Music-Manager-Karte**. Vorhandene Karten mit `custom:music-manager-card` erhalten es automatisch.
- Die separate Beta-Karte und ihr Eintrag im Kartenpicker entfallen. Alte Beta-YAML wird zur Vermeidung ausgefallener Kacheln über einen unsichtbaren Kompatibilitätsnamen auf denselben Player geleitet; der visuelle Editor speichert anschließend den regulären Typ.
- Kompaktes persönliches Box-Dropdown für Vera und Manuel; feste Ausgangsbox für Maximilian und Paul. Bei den Kindern steht der Boxname nur in den Einstellungen.
- Runde Medientasten, Radio mit Play/Pause, Apple Music mit Titelwechsel, Shuffle und Zeitleiste. Lautstärke **0–50 %** über die volle Breite.
- Symbolfavoriten ohne Text; der laufende Favorit ist unten ausgeblendet und bleibt in der Verwaltung erhalten. Radio Browser, Apple Music und Favoriten führen beim Schließen zurück zu den Einstellungen.
- Wecklieder nur für Maximilian und Paul, mit gemeinsamer Verwaltung „Favoriten & Wecklieder“. Persönliche Daten und Berechtigungen bleiben erhalten.
- HA UI Kit **1.4.1**, Versionsanzeige in den Einstellungen. Keine Beta-Beschriftungen mehr in der Konfiguration.

Im Marketplace aktualisieren, **HA neu starten** und die Seite vollständig neu laden. Bestehende reguläre Karten benötigen keine YAML-Änderung.
