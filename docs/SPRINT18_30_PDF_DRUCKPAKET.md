# Sprint 18.30 – PDF-Druckpaket und Berichtsabschluss

## Ziel

Die Berichtsausgabe soll für die Abgabe verständlicher werden. Der Benutzer soll vor dem Export sehen, welche Druckeinstellungen für einen sauberen PDF-Bericht wichtig sind.

## Umgesetzt

- PDF-Druckpaket in der Exportprüfung ergänzt.
- Empfohlene Einstellungen: A4 Hochformat, Skalierung 100 %, Hintergrundgrafiken aktivieren.
- Zentrale Dateinamen für PDF, HTML und CSV.
- Standalone-HTML-Bericht erhält eine nicht druckbare Hilfsleiste.
- Berichtsfusszeile zeigt Bericht-Nr., Revision, Anlage und Seitenzählung.
- Export-QS-Text enthält die Druckeinstellungen.

## Hinweis

Der eigentliche PDF-Export läuft weiterhin über den Browser-Druckdialog. Das ist auf GitHub Pages stabiler und benötigt keinen Server.
