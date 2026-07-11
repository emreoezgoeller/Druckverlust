# Phase 21.02 – Praxisprojekt, Speicher-Roundtrip und Berichtstest

## Ziel

Die Anwendung wird nicht nur mit kleinen Referenzfällen geprüft, sondern zusätzlich mit einem grossen, deterministischen Praxisprojekt. Der Test deckt bewusst den früher kritischen Bereich mit mehr als 42 Teilstrecken ab.

## Praxisprojekt

Das neue Praxisprojekt enthält:

- 48 Teilstrecken
- 36 zugeordnete Formteile
- 26 Sonderbauteile
- vollständige Projekt-, Berichts-, Prüf- und Freigabeangaben
- Kanal- und Rohrteilstrecken
- mehrseitige Haupt-, Formteil- und Sonderbauteiltabellen

Die Projektdatei liegt nicht als feste Benutzerd Datei vor, sondern wird reproduzierbar durch `src/project/practiceProject.js` erzeugt.

## Automatische Prüfungen

`src/testing/PracticeProjectRunner.js` kontrolliert unter anderem:

- erwartete Anzahl und eindeutige IDs
- gültige Formteil-Zuordnungen
- Berechnung ohne Fehler
- positiven Gesamtdruckverlust
- vollständige Übernahme in das Berichtmodell
- zwei Seiten für die Teilstreckentabelle
- neun Seiten für die Formteilgruppen
- zwei Seiten für Sonderbauteile
- Übereinstimmung von Seitenplan und gerendertem Bericht
- erste und letzte Teilstrecke im Bericht
- letzte Seitenzahl im Bericht
- PDF-, HTML- und CSV-Dateinamen
- verlustfreien `.dvp`-Speicher-/Lese-Roundtrip

## Ergebnis

- 29 von 29 Prüfungen bestanden
- 48 Teilstrecken vollständig im Bericht
- 36 Formteile vollständig im Bericht
- 26 Sonderbauteile vollständig im Bericht
- 20 geplante und 20 gerenderte Berichtseiten
- 0 blockierende Exportfehler
- `.dvp`-Roundtrip ohne Verlust von Einträgen oder IDs

## Aufruf

Im Tool:

`Rechen-QS → Praxisprojekt-QS`

Im Browser:

`tests/phase21-practice-project.html`

Über Node/npm:

```bash
npm run test:practice
```

Der vollständige Regressionstest läuft weiterhin über:

```bash
npm test
```

## Einordnung

Das Praxisprojekt ist ein technischer Belastungs- und Regressionstest. Die Werte sind plausibel aufgebaut, stellen aber keine reale projektspezifische Auslegung und keine externe Zertifizierung dar.
