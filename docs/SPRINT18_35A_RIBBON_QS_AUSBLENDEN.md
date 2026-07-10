# Phase 18.35a – Ribbon-QS-Schaltflächen ausgeblendet

## Ziel

Die drei internen QS-Schaltflächen sollen vor dem Abschluss von Phase 18 aus der sichtbaren Hauptnavigation entfernt werden, damit die Oberfläche für normale Bedienung ruhiger und professioneller wirkt.

## Ausgeblendet

- Datei-QS
- Deploy prüfen
- RC prüfen

## Wichtig

Die Diagnosemodule wurden nicht gelöscht. Sie bleiben im Code erhalten und können später für interne Tests, Entwicklung oder Support wieder aktiviert werden.

## Zusätzlich bereinigt

- Statusbar erwähnt die ausgeblendeten QS-Schaltflächen nicht mehr.
- Hilfedialog wurde entsprechend gekürzt.
- Deployment-QS erwartet den Button „Deploy prüfen“ nicht mehr als sichtbaren Ribbon-Befehl.
- Cache-Version wurde auf 18.35a erhöht.
