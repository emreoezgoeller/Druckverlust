# Phase 21.09 – Öffentliche Beta und konsolidierter Freigabestand

## Ziel

Die technisch und fachlich vorbereitete Anwendung soll als klar gekennzeichnete öffentliche Beta getestet werden können. Dafür werden automatische Tests, Fachtest-Rückmeldungen, Freigabeentscheidung und Veröffentlichungsschritte in einem gemeinsamen Status zusammengeführt.

## Umsetzung

- Neue öffentliche Seite `beta.html` mit:
  - kompaktem Beta-Status,
  - sechs empfohlenen Praxistests,
  - bekannten Grenzen,
  - direkten Links zu Demo, Fachtest-Protokoll und Beta-Status.
- Neuer Bereich im Tool: **Rechen-QS → Beta-Freigabestand**.
- Direkter Aufruf über `app.html?beta=1`.
- Dokumentation von Verantwortlichem, Beta-Datum, Zielversion, öffentlicher URL, Freigabehinweis und bekannten Grenzen.
- Achtteilige Checkliste für GitHub Pages, Toolstart, Demo, `.dvp`, PDF, Bilder, responsive Darstellung und Rechtliches.
- Lokale Speicherung im Browser.
- Export als Text, JSON und CSV.
- Beta-Seite in Sitemap und Web-App-Manifest ergänzt.

## Automatisierter Teststand

Der Beta-Status weist den dokumentierten Stand aus:

- 9 Prüfserien,
- 396 dokumentierte Einzelprüfungen,
- 87 zusätzliche Strukturprüfungen der Formteilbibliothek.

Neu hinzugekommen ist der Test `npm run test:beta-release` mit 27 Einzelprüfungen für Statuslogik, Blockierung, Auflagen, Checkliste und Export-Roundtrip.

## Abgrenzung

Die Beta-Version besitzt weiterhin keine Cloud-Speicherung, Benutzerkonten, Zahlung oder technische Lizenzsperre. Die internen Referenz- und Excel-Vergleiche ersetzen keine externe Normenzertifizierung.
