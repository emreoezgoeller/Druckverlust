# Phase 21.04 – Fachliche Vergleichsmatrix und Handrechnungen

## Ziel

Den Rechenkern zusätzlich zu Excel-Referenzen mit transparenten, unabhängig festgelegten Handrechnungen absichern.

## Umfang

- 10 Vergleichsfälle
- 92 Einzelprüfungen
- Rechteckkanal und Rundrohr
- Variation von Luftdichte und Reibungszahl
- Systemsumme mit ζ-Formteilen, Direktverlust und Sonderbauteil
- Prüfung der Aufrundung auf 0,5 Pa

## Bedienung

Im Tool: **Rechen-QS → Vergleichsmatrix**. Dort können das vollständige Textprotokoll und eine semikolongetrennte CSV-Matrix kopiert werden.

Browser-Test: `tests/phase21-comparison-matrix.html`

Konsole:

```bash
npm run test:comparison
```

## Fachliche Einordnung

Die Sollwerte sind feste Handrechnungen auf Basis der im Tool dokumentierten Formeln und Konstanten. Sie werden nicht zur Laufzeit aus dem Ist-Ergebnis berechnet. Die Vergleichsmatrix ist eine Regression- und Plausibilitätsprüfung, aber keine externe Normenfreigabe oder Zertifizierung.
