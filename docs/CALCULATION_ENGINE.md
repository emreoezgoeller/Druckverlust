# CalculationEngine – Druckverlust Pro

Version: 0.5.0

Diese Engine ist die zentrale mathematische Grundlage von Druckverlust Pro.
Sie ist unabhängig von HTML, CSS, PDF und Projektverwaltung.

## Einheiten

| Wert | Einheit |
|---|---:|
| Luftmenge q | m³/h |
| Breite / Höhe / Durchmesser / Länge | m |
| Fläche | m² |
| Geschwindigkeit | m/s |
| Druck | Pa |

## Unterstützt

- Rechteckkanal
- Rundrohr
- Sonderbauteile mit direktem Druckverlust
- Σζ aus manueller Eingabe und zugeordneten Formteilen
- Projekt-Gesamtauswertung
- Plausibilitätswarnungen

## Wichtige Formeln

```text
A_rechteck = b × h
A_rohr = π × d² / 4
d_h,rechteck = 2 × b × h / (b + h)
v = q / (3600 × A)
p_dyn = 0.5 × ρ × v²
R' = λ / d_h × p_dyn
Δp_Reibung = R' × L
Δp_Formteile = Σζ × p_dyn
Δp_total = Δp_Reibung + Δp_Formteile + Δp_Sonderbauteile
```

## Ziel

Alle Oberflächen- und PDF-Funktionen sollen künftig diese Engine verwenden, damit Web-App, PDF und Tests immer dieselben Ergebnisse liefern.

## Teilstreckenbezogene Rauigkeit und Reibungszahl

Jede Teilstrecke besitzt eine eigene absolute Rauigkeit `k` in Millimetern. Neue Teilstrecken erhalten standardmässig `k = 0,15 mm`; der Wert kann pro Teilstrecke angepasst werden.

Die Darcy-Reibungszahl `λ` wird nicht global vorgegeben. Sie wird aus Reynolds-Zahl, relativer Rauigkeit und charakteristischem Durchmesser berechnet. Bei Rechteckkanälen wird der hydraulische Durchmesser verwendet, bei Rundrohren der tatsächliche Rohrdurchmesser.

Zugeordnete Formteile übernehmen `k`, `Re` und `λ` von der jeweiligen Teilstrecke zur Dokumentation. Der Formteildruckverlust bleibt `ζ × p_dyn`; die Rauigkeit wird nicht zusätzlich in den Formteilverlust eingerechnet.
