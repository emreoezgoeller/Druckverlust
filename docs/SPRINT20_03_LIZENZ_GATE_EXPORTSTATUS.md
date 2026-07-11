# Sprint 20.03 – Lizenz-Gate und Exportstatus

Ziel dieser Phase war, die Lizenzlogik technisch sauberer zu zentralisieren, ohne die aktuelle Professional-Preview-Version zu sperren.

## Umgesetzt

- `src/licensing/LicenseGate.js` als zentrale Zugriffsschicht ergänzt.
- `licenseConfig.js` bereinigt und um Exportstatus, Wasserzeichen-Text und Feature-Zugriff erweitert.
- Berichtmodell erhält `license` und `exportNotice`.
- Export-QS und Info-Seite im Bericht zeigen den Lizenz-/Exportstatus.
- Produktseite und Lizenzseite enthalten einen kurzen Exportstatus-Hinweis.
- Deployment-QS prüft die neuen Lizenzmodule.

## Wichtig

Es ist weiterhin keine Zahlung, kein Login und keine technische Zugriffssperre aktiv. Das License-Gate dient als Vorbereitung für spätere Lizenzstufen.
