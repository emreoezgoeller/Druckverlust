# Phase 21.00 – Fachliche Referenztests

## Ziel

Der Rechenkern erhält feste, automatisch ausführbare Referenzfälle. Bei späteren Änderungen an Formeln, Einheiten, Rundungen oder Summenbildung werden Abweichungen sofort sichtbar.

## Enthaltene Referenzfälle

- REF-001: Rechteckkanal mit ζ-Verlust
- REF-002: Rundrohr mit ζ-Verlust
- REF-003: Summenbildung aus Reibung, ζ-Verlust, direktem Formteilverlust und Sonderbauteil
- REF-004: Aufrundung auf 0.5 Pa
- REF-005: Dezimalkomma und automatische Typ-Erkennung
- TEST-001: bestehender Excel-Vergleich mit 109.5 Pa ± 1.0 Pa

## Bedienung

Im Tool unter **Rechen-QS** auf **Referenztests** klicken. Alternativ:

```bash
npm test
```

oder im Browser:

`tests/phase21-reference-tests.html`

## Abgrenzung

Die mathematischen Kernformeln und die aktuelle Summenbildung sind abgesichert. Die vollständige Einzelvalidierung sämtlicher Formteilkennwerte gegen Excel-/Hersteller-/Literaturquellen folgt in Phase 21.01.
