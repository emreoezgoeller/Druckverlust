# Sprint 16 Abschluss – Formteilbibliothek 2.0

Sprint 16 schliesst die professionelle Formteilbibliothek ab. Der Fokus lag auf flexiblen Parameterdefinitionen, automatischer Berechnung, sauberer Ergebnisdarstellung, QS-Hinweisen und belastbarer Projektberechnung.

## Abgeschlossener Funktionsumfang

### Formteilbibliothek

Die Bibliothek enthält aktuell 14 aktive Formteile:

1. Kreisförmiger Bogen / Krümmer
2. Eckiger Kanalbogen
3. Kanal-Bogen mit Winkel
4. Übergang gross → klein
5. Übergang klein → gross
6. Etage 45°
7. Hosenstück
8. T-Abzweig Durchgang rund 1
9. T-Abzweig Durchgang rund 2
10. T-Abzweig rund 1
11. T-Abzweig rund 2
12. 90° T-Stück
13. 90° T-Stück Variante 2
14. Sattelstück mit Einströmkonus

Alle Formteile besitzen eine Bildreferenz, Parameterdefinitionen und einen Calculator.

### Parameterlogik

Parameter werden als Metadatenobjekte geführt:

- `id`
- `label`
- `type`
- `default`
- `unit`
- `group`
- `options`
- `showWhen`
- `readOnly`
- `derived`
- `help`

Dadurch erzeugt der Workspace die Eingabefelder automatisch.

### Automatische Berechnung

Teilstrecken und Formteile werden nach jeder Eingabe automatisch aktualisiert. Der manuelle Button bleibt nur noch als Notfall-/Neu-Berechnen-Funktion bestehen.

### Direkte Formteilverluste

Formteile mit eigenem Bezugsdruck, z. B. Hosenstück, T-Abzweige oder Sattelstück, können eigene Direktdruckverluste ausgeben. Diese werden separat im Systemtotal geführt und dürfen auch negativ sein, wenn die Tabelle eine Druckrückgewinnung ergibt.

### QS und Plausibilität

Die Oberfläche zeigt:

- Plausibilitätsstatus
- Berechnungsprüfung
- Reibungsverlust
- ζ-Verlust Formteile
- Direktverlust Formteile
- Sonderbauteile
- Gesamt gerundet
- Zugeordnete Formteile pro Teilstrecke

### Speichern

Die Projektdatei `.dvp` wird gegen zyklische Berechnungsreferenzen abgesichert. Dadurch kann ein Projekt auch nach automatischer Berechnung gespeichert werden.

## Abschluss-Test

Neuer Test:

```text
tests/sprint16-final.html
```

Der Test prüft:

- 14/14 Formteile vorhanden
- 14/14 Calculatoren aktiv
- Bildreferenzen vorhanden
- Default-Berechnung aller Formteile
- Referenzprojekt mit Formteilen und Sonderbauteil
- QS-Status
- Berechnungsprüfung
- Speicher-Serialisierung ohne Zyklusfehler

## Status

Sprint 16 ist damit fachlich und technisch abgeschlossen.

Empfohlener nächster Sprint:

```text
Sprint 17 – Professioneller Bericht / Export / Druckansicht
```
