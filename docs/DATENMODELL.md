# Datenmodell – Druckverlust Pro

Stand: `.dvp`-Schema 1.1.0 · Anwendung 1.8.0 · Phase 31.00

## 1. Dateihülle

```json
{
  "fileType": "DruckverlustPro",
  "schemaVersion": "1.1.0",
  "appVersion": "1.8.0",
  "appRelease": "31.00",
  "exportedAt": "2026-07-15T08:00:00.000Z",
  "summary": {},
  "project": {}
}
```

`StorageEngine` akzeptiert zusätzlich ältere rohe Projektobjekte und normalisiert sie beim Öffnen.

## 2. Projekt

```json
{
  "id": "project-1",
  "name": "2026-001",
  "object": "Projektname",
  "anlageNumber": "BKP 244",
  "author": "Bearbeiter",
  "company": "Firma",
  "address": "Adresse",
  "note": "Hinweis",
  "settings": {
    "rho": 1.21,
    "lambda": 0.025,
    "sectionRoundingStep": 0.5
  },
  "meta": {},
  "report": {},
  "reportOptions": {},
  "systems": [],
  "simulationVariants": [],
  "reportVariantId": "",
  "revisionSnapshots": [],
  "reportRevisionBaseId": "",
  "reviewProtocol": { "systems": {} }
}
```

## 3. Anlage

```json
{
  "id": "system-1",
  "name": "Zuluftanlage",
  "type": "Zuluft",
  "sections": [],
  "formParts": [],
  "specialComponents": []
}
```

## 4. Teilstrecke

Interne Längeneinheit ist Meter, Luftmenge m³/h und Druckverlust Pa.

```json
{
  "id": "system-1-ts1",
  "name": "ts1",
  "type": "duct",
  "description": "Rechteckkanal",
  "q": 3200,
  "b": 0.8,
  "h": 0.45,
  "d": 0,
  "l": 12.5,
  "zetaSum": 0
}
```

Für Rundrohre gilt `type: "pipe"` und der Durchmesser steht in `d`.

## 5. Formteil

Formteile besitzen eine eindeutige ID, einen Registry-Typ und die Zuordnung zu mindestens einer Teilstrecke. Weitere Felder richten sich nach dem jeweiligen der 14 Formteilrechner.

```json
{
  "id": "formpart-1",
  "type": "kreis-bogen",
  "sectionId": "system-1-ts1",
  "parameters": {},
  "manualOverrides": {}
}
```

## 6. Sonderbauteil

```json
{
  "id": "special-1",
  "name": "Filter",
  "type": "special",
  "sectionId": "system-1-ts1",
  "pressureLoss": 85,
  "q": 3200
}
```

Sonderbauteile bleiben freie, herstellerneutrale Druckverlustansätze.

## 7. Gespeicherte Simulationsvariante

```json
{
  "id": "variant-1",
  "name": "Variante grössere Kanäle",
  "note": "Abmessungen +15 %",
  "author": "Bearbeiter",
  "systemId": "system-1",
  "createdAt": "2026-07-15T08:00:00.000Z",
  "options": {
    "scope": "all",
    "sectionId": "",
    "airflowPercent": 100,
    "dimensionPercent": 115
  },
  "affectedCount": 5,
  "baseline": {},
  "scenario": {},
  "delta": {},
  "rows": [],
  "calculationFingerprint": "dp-12345678",
  "isNeutralSimulation": true
}
```

- Maximal zwölf Varianten werden gespeichert.
- `reportVariantId` verweist auf die für den Bericht ausgewählte Variante.
- Die Variante verändert die Projektgeometrie nicht automatisch.
- Der Berechnungsfingerprint kennzeichnet einen veralteten Vergleich.

## 8. Revisionssnapshot

```json
{
  "id": "revision-1",
  "revision": "2",
  "date": "15.07.2026",
  "author": "Bearbeiter",
  "change": "Abgabeprojekt aktualisiert",
  "systemId": "system-1",
  "createdAt": "2026-07-15T08:00:00.000Z",
  "fingerprint": "dp-abcdef12",
  "totals": {
    "totalLoss": 154.5,
    "frictionLoss": 20.1,
    "formPartLoss": 49.4,
    "specialLoss": 85,
    "maxVelocity": 3.47,
    "criticalSectionId": "system-1-ts2"
  },
  "counts": {
    "sections": 5,
    "formParts": 5,
    "specialComponents": 3
  },
  "engineeringScore": 92,
  "engineeringStatus": "warning",
  "findingCount": 2,
  "reportVariantId": "variant-1",
  "technicalSnapshot": {
    "systemId": "system-1",
    "settings": {},
    "totals": {},
    "sections": [],
    "formParts": [],
    "specialComponents": []
  }
}
```

Maximal zwanzig Snapshots werden gehalten. Zusätzlich führt `report.revisionHistory` die kompakte Revisionsliste für den Bericht. `technicalSnapshot` ist ab Phase 31 die Detailbasis für den Vergleich; ältere Snapshots ohne dieses Feld bleiben lesbar, liefern aber keinen Einzelvergleich.

## 9. Vergleichsbasis und manuelles Prüfprotokoll

```json
{
  "reportRevisionBaseId": "revision-1",
  "reviewProtocol": {
    "systems": {
      "system-1": {
        "reviewer": "Prüfperson",
        "date": "16.07.2026",
        "note": "Fachkontrolle durchgeführt",
        "checks": [
          { "id": "inputs", "checked": true },
          { "id": "formparts", "checked": true }
        ],
        "updatedAt": "2026-07-16T08:00:00.000Z"
      }
    }
  }
}
```

`reportRevisionBaseId` bestimmt die für Abschluss und Bericht verwendete Basisrevision. Das Prüfprotokoll wird je Anlage gespeichert; seine Prüfpunkte werden beim Lesen gegen die aktuelle Standardliste normalisiert.

## 10. Nicht persistierte Felder

Folgende Felder werden bewusst nicht in `.dvp` geschrieben:

- `calculationResult`
- `calculation`
- `validation`
- `_importInfo`

Sie sind flüchtig und werden nach dem Öffnen neu berechnet beziehungsweise erzeugt.
