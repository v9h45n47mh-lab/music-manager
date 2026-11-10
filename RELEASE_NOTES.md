Der Lautstärkeregler verwendet jetzt das originale Home-Assistant-Bedienelement (`ha-control-slider`).

- Standarddarstellung und Themefarben von Home Assistant, ohne lokale Nachbildung des Balkens oder Griffs.
- Prozentanzeige während des Ziehens und bei Tastaturbedienung.
- Lautstärkebefehl erst beim Loslassen bzw. Bestätigen.
- Keine separate Stumm-Taste; 0 schaltet lautlos.
- Persönliche Favoriten, Senderlogos und Wiedergabetasten bleiben erhalten.

Installation: In HACS auf 1.1.1 aktualisieren und das Dashboard vollständig neu laden. Manuell: JS-Datei ersetzen und Ressourcenparameter `?v=1.1.1` verwenden. Der UI-Kit-Standardregler mit Prozentanzeige bleibt während des Ladens und in der Offline-Vorschau als Ersatz verfügbar.

Funktions- und Browserprüfungen prüfen Reglerereignisse, die Prozentanzeige, Senderfavoriten und die Darstellung bei 320, 375, 390, 430 und 1100 Pixeln in hellen und dunklen Themes. Ein Test auf echter Sonos-Hardware steht weiterhin aus.
