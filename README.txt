ARBEITSZEITERFASSUNG (PWA) - Version 2.2

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
