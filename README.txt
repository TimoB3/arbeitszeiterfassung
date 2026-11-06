ARBEITSZEITERFASSUNG (PWA) - Version 2.7

Neu in 2.1: Automatische Wochenend-Kennzeichnung im PDF
- Samstage erscheinen im PDF automatisch als "SAMSTAG", Sonntage als "SONNTAG".
- Die Bezeichnung steht in der zusammengefassten Beginn-/Ende-Spalte.
- Keine Arbeitszeiten und keine Tätigkeiten für Wochenendtage im PDF.
- Die gespeicherten Tagesdaten werden nicht verändert; die Kennzeichnung entsteht nur beim Erstellen des PDFs.

Testen unter Windows (Firefox):
1. ZIP entpacken, index.html in Firefox öffnen.
2. Testtag 08:00 - 17:00 eintragen -> 8 Std. 30 Min. Netto.
3. Tab schließen, neu öffnen: Daten sind noch da.
Hinweis: Über file:// läuft die App, aber Service Worker/Offline-Betrieb gibt es erst über HTTP(S) (z. B. GitHub Pages).

PDF: Button "Monat als PDF ausgeben" öffnet den Druckdialog; dort "Als PDF speichern" (iPhone: Teilen-Symbol/Drucken -> PDF sichern).
Name: Zahnrad oben rechts.

Änderungen 2.2:
- Datum überall als TT.MM.JJJJ, Uhrzeiten im 24-h-Format.
- Zeiten nur in Viertelstunden wählbar (Stunde und Minute 00/15/30/45).
- PDF: ohne Kopf-/Fußzeile, Tabelle füllt die A4-Seite, nur senkrechte Linien, Zeilen abwechselnd weiß/grau.
- Neue Spalte "Stunden" (Nettozeit, z. B. 8,75h) zwischen Ende und Tätigkeiten.
- Anmerkungen und lange Tätigkeiten werden automatisch verkleinert, bis sie in die Zeile passen.
Tipp im Druckdialog: "Kopf- und Fußzeilen" aus und Skalierung 100 % ("Tatsächliche Größe").

Änderungen 2.3:
- Statuszeile unter dem Titel: "Gespeichert ✓ hh:mm" nach jeder Eingabe, rote Warnung falls der Browser das Speichern verweigert.

Änderungen 2.4:
- Pausenabzug: bis 6 Std. keine Pause; über 6 und unter 9 Std. 30 Min; über 9 Std. 45 Min (genau 9 Std. = 30 Min).
- PDF: Summenzeile unten mit der Netto-Gesamtzeit in der Spalte Stunden; weiterhin eine A4-Seite.
- Doppeltipp-Zoom beim schnellen Klicken auf Vor/Zurück unterbunden.

Änderungen 2.5:
- Datensicherung (Zahnrad oben rechts): "Sicherung speichern" erstellt eine Datei arbeitszeit_backup_JJJJ-MM-TT.json
  (am iPhone über das Teilen-Menü, z. B. in "Dateien" sichern). "Sicherung einlesen" lädt sie wieder; gleiche Tage werden überschrieben, alle anderen bleiben.
- Beschriftung "Reisekosten ?".
- Service Worker lädt Dateien zuerst aus dem Netz (neue Versionen kommen ohne Cache-Probleme an), offline weiter aus dem Zwischenspeicher.

Änderungen 2.6:
- Drei Checkboxen: "Reisekosten ?", "Beleg abgegeben?", "Betrag erhalten ?".
- "Beleg abgegeben?" nur wählbar, wenn "Reisekosten ?" gesetzt ist; "Betrag erhalten ?" nur, wenn beide davor gesetzt sind.
- Wird ein Feld abgewählt, werden die folgenden automatisch ebenfalls abgewählt.
- Reisekosten-Angaben erscheinen weiterhin nicht im PDF.

Änderungen 2.7:
- Neues App-Symbol (Uhr auf blauem Grund). Auf dem iPhone ändert sich das Symbol erst, wenn die App neu zum Home-Bildschirm hinzugefügt wird (vorher Datensicherung machen!).
