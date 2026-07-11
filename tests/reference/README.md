# Referenztests

## Phase 21.00

Die automatischen Referenztests liegen zentral in:

- `src/testing/referenceCases.js` – feste Eingaben und Sollwerte
- `src/testing/ReferenceTestRunner.js` – DOM-unabhängiger Test-Runner
- `tests/run-reference-tests.js` – Ausführung über Node.js
- `tests/phase21-reference-tests.html` – visuelle Ausführung im Browser

Ausführung im Projektordner:

```bash
npm test
```

## Referenzarten

### Formelreferenzen

Die Sollwerte wurden unabhängig als feste Handrechnungswerte hinterlegt. Geprüft werden unter anderem:

- Rechteckfläche und hydraulischer Durchmesser
- Kreisfläche
- Geschwindigkeit
- dynamischer Druck
- Reibungsgefälle und Reibungsverlust
- ζ-Verlust
- Aufrundung auf 0.5 Pa
- Summenbildung mit direkten Formteilverlusten und Sonderbauteilen

### Externe Referenz

`TEST-001` vergleicht den gerundeten Gesamtdruckverlust mit dem vorhandenen Excel-Referenzwert von ca. 109.5 Pa. Die Toleranz bleibt bei 1.0 Pa, bis sämtliche einzelnen Formteilkennwerte gegen die Originalquellen validiert sind.

Diese Tests ersetzen keine vollständige fachliche Validierung aller Formteile. Sie schützen den aktuellen Rechenkern gegen unbeabsichtigte Änderungen.
