## Music Manager 1.12.0 – Player Beta

- Gemeinsame Player-Bausteine aus **HA UI Kit 1.4.0**, ohne lokale CSS-Überschreibungen in der Beta.
- Schmales Box-Dropdown oben links, ohne sichtbares „Box“-Label. Das Zahnrad oben rechts öffnet Sender, Apple Music und Favoriten; die Auswahlleiste unten entfällt.
- Keine sichtbare Beta-Beschriftung. Favoritenkacheln zeigen nur Logos oder Symbole; zugängliche Namen und Tooltips bleiben erhalten.
- Wecklieder samt Datenladen und Apple-Music-Markierung nur für die aktiven, eindeutig benannten HA-Benutzer **Maximilian und Paul**. Beide verwalten **Favoriten & Wecklieder** in einem gemeinsamen Dialog mit Suche, Sortierung und Entfernen. Die Listen bleiben getrennt gespeichert. Vera und Manuel erhalten nur die Favoritenverwaltung.
- Bei Radio nur Play/Pause; Apple Music behält Vor/Zurück und Shuffle. Die Player-Tasten bleiben auch beim Hover kreisrund.
- Lautstärke der Beta auf **0–50 %** begrenzt, einschließlich gesendeter Befehle und nativer HA-Slider-Ereignisse. Die Skala nutzt die ganze Breite: **0 links, 25 Mitte, 50 rechts**. Andere HA-Karten, direkte Serviceaufrufe und die Sonos-App sind unabhängig.
- Persönliche Box-Auswahl für Vera und Manuel, feste Ausgangsbox für die Kinder und persönliche Konten bleiben erhalten. Die bisherige Karte wird nicht ersetzt.

Im Marketplace aktualisieren, HA neu starten und die Seite vollständig neu laden. Bestehende Beta-Karten verwenden weiter **`custom:music-manager-beta-card`**; ihre YAML-Konfiguration bleibt gültig.
