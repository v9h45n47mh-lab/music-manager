# Änderungen

## 2.4.0

Manuell sortierbare Einträge werden am gemeinsamen Sortiergriff gedrückt gehalten und an die gewünschte Position gezogen. Die bisherigen Auf-/Ab-Pfeile entfallen. Maus, Touch und Tastatur am Griff werden unterstützt; Escape bricht den Vorgang ab. HA UI Kit 1.7.0 liefert Griff, Rückmeldung und Interaktion gemeinsam. Bestehende Rechte und gespeicherte Daten bleiben erhalten.

Die persönliche Favoritenreihenfolge wird mit einem einzigen Speichervorgang geändert. Andere Benutzer, Wecklieder und private Kontozuordnungen bleiben erhalten.


## 2.3.0

Rollenrechte: Musikansicht, Wiedergabe, Konfiguration ansehen, fremde Weckmusik verwalten, Boxauswahl und persönliche Wecklieder. Die lokale Rechteauswahl für die Boxauswahl entfällt. Musikkonto- und Playerzuordnungen bleiben erhalten. Native Musiktasten laufen über einen authentifizierten Backend-Endpunkt mit Rollen- und Geräteprüfung.

Berechtigungen werden jetzt in **Family Access → Anwendung → Rolle** verwaltet. Benutzer können mehrere Rollen erhalten; ihre Freigaben ergänzen sich. Vorhandene Anwendungsrechte werden einmalig in Rollen mit dem Zusatz „übernommen“ importiert und den bisherigen Benutzern zugeordnet. Dashboardfreigaben und die Aktivierung der Dashboardnavigation werden dadurch nicht verändert.

Zum Entziehen eines Rechts alle zugewiesenen Rollen einschließlich übernommener Rollen prüfen. Neue Benutzer erhalten nach der Übernahme keine automatischen Anwendungsrechte. Echte HA-Administratoren behalten Vollzugriff zur Wiederherstellung. Geräte-, Eigentümer- und externe Kontoberechtigungen gelten zusätzlich; eine Rolle erzeugt keine HA-Administratorrechte.

**Aktualisierung:** zuerst Family Access Manager 1.1.0 oder neuer, danach die beteiligten Anwendungen aktualisieren und Home Assistant neu starten. Solange Family Access nicht eingerichtet ist, bleibt die bisherige Rechtevergabe erhalten. Ist Family Access eingerichtet, aber nicht verfügbar oder zu alt, werden Anwendungsaktionen für normale Benutzer abgelehnt. Lokale Benutzer-/Personen-, Geräte- und Musikkontozuordnungen bleiben für Identität und Eigentum erhalten; Rechte werden zentral vergeben.

