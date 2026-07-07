# Changelog

## 0.4.22 – Sprint 16.22 Formteilbibliothek Abschluss-QS

### Neu
- Formteil-Auswahl im Workspace ist jetzt nach Kategorien gruppiert.
- Systemübersicht zeigt den Status der Formteilbibliothek als `aktive Calculatoren / registrierte Formteile`.
- Neuer Smoke-Test für die Formteilbibliothek prüft alle registrierten Formteile mit Defaultwerten.

### Dateien
- Erweitert: `src/ui/components/WorkspaceComponent.js`
- Neu: `tests/formpart-library-smoke.html`
- Neu: `tests/formpart-library-smoke.test.js`

## 0.4.18 – Sprint 16.18 Etage 45° Calculator

### Neu
- `etage_45` ist jetzt rechenfähig.
- Die Etage 45° unterstützt Bauform `Rohr` und `Kanal`.
- Bei Rohr wird der Durchmesser `d` verwendet.
- Bei Kanal werden Breite `a` und Höhe `b` eingetragen; daraus wird automatisch der hydraulische Durchmesser `dh` berechnet.
- Das Verhältnis `LE/d(dh)` wird automatisch berechnet.
- Die Tabellenlogik verwendet wie die Excel-Referenz `XLOOKUP(..., match_mode = -1)`, also exakt oder nächst kleinerer Tabellenwert.

### Dateien
- Neu: `src/formteile/calculators/etage45Calculator.js`
- Erweitert: `src/formteile/FormPartRegistry.js`

## Sprint 16.17 – Kanalkanten-Auswahl verständlicher

- Dropdown für `Kanalkante / Abrundung` zeigt jetzt beschreibende Auswahltexte statt nur Zahlen.
- Hinweistext erklärt die Werte 1–4 direkt unter der Auswahl.
- Werte bleiben intern unverändert numerisch, damit die Berechnung weiter mit der Tabelle funktioniert.


## Sprint 16.16 – Übergang gross → klein mit Winkel und Kanalkante

- Übergang gross → klein verwendet jetzt Winkel β und Kanalkante gemeinsam.
- Die bisherige Auswahl `Berechnungsart` wurde entfernt, weil beide Einflussgrössen fachlich zusammengehören.
- ζ-Wert wird kombiniert aus `ζ(β, A1/A2)` plus `ζ(Kanalkante, A1/A2)`.
- Kanal-/Rohr-Auswahl und automatische Flächenberechnung A1/A2 bleiben unverändert.


## Sprint 16.10 – Hosenstück Luftmenge und automatische Geschwindigkeit

- Hosenstück fachlich auf `A / W / w` und `AA / WA / wA` erweitert.
- Hauptanschluss und Abzweig besitzen jetzt je eine Luftmenge in m³/h.
- Geschwindigkeiten `w` und `wA` werden automatisch aus Luftmenge und Kanal-/Rohrgrösse berechnet.
- Für Kanal wird die Fläche aus Breite × Höhe berechnet, für Rohr aus dem Durchmesser.
- Verhältnis `wA/w` wird im Ergebnis angezeigt und ist für den späteren Tabellen-Calculator vorbereitet.
- Berechnete Felder sind im Editor schreibgeschützt.


## Sprint 16.8 – Hosenstück Bauform Kanal/Rohr

- Hosenstück um Bauform-Auswahl `Kanal` / `Rohr` erweitert.
- Bei Bauform `Kanal` werden Breite `a` und Höhe `b` angezeigt.
- Bei Bauform `Rohr` wird der Durchmesser `d` angezeigt.
- Parameterstruktur unterstützt jetzt `showWhen` für abhängig sichtbare Eingabefelder.


## Sprint 16.5 – PNG-Bilder ohne Platzhalter-Skizze

- WorkspaceComponent zeigt Formteilbilder nur noch als PNG-Dateien an.
- Eingebaute SVG-/Notfall-Skizzen wurden aus dem Rendering entfernt.
- Wenn ein Bild fehlt, erscheint nur noch ein kurzer Text, keine Ersatzgrafik.
- FormPartRegistry verweist auf die neue Ordnerstruktur `assets/formteile/<id>/<id>.png`.
- Formteil-PNGs wurden zusätzlich in die passenden Unterordner übernommen.

# Changelog

## 0.4.5 – Sprint 16.3 Formteilbild und Live-Ergebnis korrigiert

### Behoben
- Formteilbilder werden jetzt robuster geladen. Falls der erste Pfad nicht gefunden wird, werden alternative Bildpfade versucht.
- Die hochgeladenen PNG-/Excel-Dateien der Formteile wurden in `assets/formteile` übernommen.
- Beim Formteil wird automatisch die erste vorhandene Teilstrecke zugewiesen, wenn noch keine gültige Teilstrecke gesetzt ist.
- Dynamischer Druck, Geschwindigkeit und Druckverlust des Formteils werden direkt aus der zugewiesenen Teilstrecke angezeigt, auch wenn das Projekt noch nicht global berechnet wurde.
- Neue Teilstrecken verwenden wieder die aktiven Feldnamen `q`, `l`, `b`, `h` und `type: 'duct'`.
- Die Berechnungslogik akzeptiert weiterhin ältere Feldnamen wie `airVolume`, `width`, `height` und `length`.

### Fachlich
- `kreis_bogen` verwendet für R/d und α jetzt die Excel-Logik `exakt oder nächst grösserer Tabellenwert`.
- Die α-Auswahl für `kreis_bogen` wurde aus der Excel-Referenz übernommen: `0, 20, 30, 45, 60, 75, 90, 110, 130, 150, 180`.
- Der Excel-Hinweis zeigt keinen technischen Rohpfad mehr an, sondern eine saubere Fachinformation.

## 0.4.4 – Sprint 16.2 Formteil-Editor professionalisiert

### Neu
- Formteil-Übersicht im Workspace mit Skizze, Kategorie, ID und ζ-Sofortwert.
- Parametergruppen für Formteile, z. B. `Geometrie` und `Referenzwerte`.
- Hilfetexte pro Parameter.
- Dropdown-Felder zeigen deutlich, dass Referenzwerte nicht frei eingetippt werden.
- Registry validiert `select`-Werte gegen die erlaubten Optionen und fällt bei ungültigen Werten auf den Default zurück.
- `kreis_bogen` besitzt jetzt Beschreibung und Referenz-Metadaten zur Excel-Datei.

### Wichtig
- Die Excel-Werte werden noch nicht automatisch importiert.
- Die Struktur ist jetzt für den späteren Excel-Abgleich vorbereitet.

## 0.4.2 – CalculationEngine abgeschlossen

### Neu
- Zentrale, DOM-unabhängige `CalculationEngine` in `src/core/CalculationEngine.js`.
- Kompatibilitäts-Exporte für `src/calculation/CalculationEngine.js` und `src/calculation/engine.js`.
- Berechnung für Rechteckkanal, Rohr und Sonderbauteile.
- Automatische Berücksichtigung von `zetaSum` und zugeordneten Formteilen.
- Plausibilitätswarnungen vorbereitet.
- Browser-Referenztest für TEST-001 ergänzt.
- Dokumentation `docs/CALCULATION_ENGINE.md` ergänzt.

### Wichtig
- Diese Version ändert die bestehende Oberfläche nicht.
- Ziel ist ein stabiles Rechenfundament, bevor UI und PDF weiter professionalisiert werden.

## Sprint 16.4 – Formteilbild, Anzeige und Luftmenge

- Kreis-Bogen-Skizze wird direkt im Workspace als integrierte SVG-Skizze gerendert und ist nicht mehr von einem externen PNG-Pfad abhängig.
- Sichtbarer Excel-/Referenz-Hinweis im Formteil-Editor entfernt.
- Winkel α bleibt als Dropdown gesperrt, aber ohne sichtbaren Excel-Hinweis.
- Luftmenge wird in Ergebnis- und Übersichtstabellen ohne Nachkommastellen angezeigt.
- Eingabefeld Luftmenge verwendet Schrittweite 1.

## Sprint 16.6 – Robuster Bildpfad-Fix
- Formteilbilder werden jetzt über `new URL(..., import.meta.url)` aufgelöst.
- Dadurch funktionieren die Bildpfade stabiler bei Vite, Live Server und direktem Projektstart.
- PNG-Platzhalter bleiben entfernt; es werden nur echte Formteilbilder angezeigt.


## Sprint 16.7 – Alle Formteilbilder und Bibliothek erweitert

- Alle aktuell gelieferten Formteil-PNGs und Excel-Referenzen in `assets/formteile` übernommen.
- Formteil-IDs und Bildpfade vereinheitlicht.
- `FormPartRegistry.js` um alle gelieferten Formteile erweitert.
- Bildpfade wieder bewusst als einfache relative `assets/...` Pfade aufgebaut, damit sie im Browser stabil geladen werden.
- Sichtbare Excel-Info bleibt weiterhin ausgeblendet; Referenzdateien sind nur intern hinterlegt.

## Sprint 16.9 – Hosenstück A / AA / w / wA korrigiert

- Hosenstück fachlich auf die Bezeichnungen aus der Referenztabelle umgestellt.
- Hauptanschluss wird jetzt als grösserer Anschluss `A / w` geführt.
- Abzweig wird jetzt als `AA / wA` geführt.
- Bei Bauform `Kanal` werden für Hauptanschluss und Abzweig je Breite/Höhe abgefragt.
- Bei Bauform `Rohr` werden für Hauptanschluss und Abzweig je Durchmesser abgefragt.
- Geschwindigkeit `w` und `wA` sind vorbereitet, damit später das Tabellenverhältnis `wA/w` berechnet werden kann.

## Sprint 16.11 – Hosenstück-Calculator

- Hosenstück erhält einen eigenen Calculator auf Basis der Tabelle ζA bezogen auf wA.
- Berechnung von wA/w aus automatisch berechneten Geschwindigkeiten w und wA.
- Tabellenlookup für α und wA/w mit exakt oder nächst grösserem Tabellenwert.
- Dynamischer Druck und Druckverlust beim Hosenstück werden bezogen auf wA berechnet.
- Direktdruckverlust wird in der Projektberechnung separat berücksichtigt und nicht zusätzlich über Σζ der Teilstrecke falsch mit dem Teilstrecken-pdyn verrechnet.

## Sprint 16.12 – Hosenstück Ergebnisanzeige

- Hosenstück-Ergebnis zeigt jetzt Hauptluftmenge W und Hauptgeschwindigkeit w.
- Hosenstück-Ergebnis zeigt jetzt Abzweigluftmenge WA und Abzweiggeschwindigkeit wA.
- Bei direkter Druckverlustberechnung wird die allgemeine Teilstrecken-Luftmenge/Geschwindigkeit nicht mehr angezeigt, damit keine falschen 0-Werte erscheinen.
- Dynamischer Druck wird beim Hosenstück sichtbar auf wA bezogen dargestellt.

## Sprint 16.13 – Rechteckbogen-Calculatoren

- `eckiger_bogen` erhält einen eigenen Calculator mit Tabellenlogik über `R/b` und `a/b`.
- `kanal_bogen_winkel` erhält einen eigenen Calculator mit Tabellenlogik über `α` und `a/b`.
- Beide Calculatoren verwenden exakt oder nächst grösserer Tabellenwert, passend zur bisherigen Excel-Logik.
- Workspace kann jetzt allgemeine Calculator-Detailzeilen über `displayRows` anzeigen, damit neue Formteil-Calculatoren ihre Tabellenwerte sauber ausgeben können.
- Projektberechnung übernimmt die berechneten ζ-Werte automatisch wie bei Kreis-Bogen.

## Sprint 16.14 – Ergebnisanzeige vereinfacht + Übergänge

- Formteil-Ergebnisanzeige bereinigt: technische Tabellenwerte, Formelzeilen und interne Lookup-Werte werden im Workspace nicht mehr angezeigt.
- Hosenstück-Ergebnis bleibt auf WA / wA bezogen und zeigt weiterhin Haupt-/Abzweigluftmenge sowie Haupt-/Abzweiggeschwindigkeit.
- Neue Calculator-Datei `uebergangCalculator.js` ergänzt.
- `uebergang_gross_klein` rechnet jetzt ζ aus β und A1/A2.
- `uebergang_klein_gross` rechnet jetzt ζ aus β und A1/A2.
- Lookup-Logik weiterhin: exakter oder nächst grösserer Tabellenwert.

## Sprint 16.15 – Übergänge mit Kanal-/Rohrgrössen und Kanalkante

- Übergang gross → klein und Übergang klein → gross fragen A1/A2 nicht mehr als manuelle Flächen ab.
- Für kleinen Anschluss A1 und grossen Anschluss A2 kann jeweils `Kanal` oder `Rohr` gewählt werden.
- Kanalgrössen werden über Breite/Höhe eingegeben, Rohrgrössen über Durchmesser.
- Die Flächen A1/A2 werden automatisch aus den eingegebenen Grössen berechnet und nur noch als berechnete Werte angezeigt.
- Kombinationen wie Kanal → Rohr und Rohr → Kanal sind dadurch möglich.
- Beim Übergang gross → klein kann neu zwischen `Winkel β` und `Kanalkante` gewählt werden.
- Kanalkanten 1–4 sind eingebaut: scharfe Kante, gebrochene Kante, gerundete Kante, glatte/gute Abrundung.
- Für Kanalkante wird die Excel-Logik `ζ = Tabellenwert(Kante, A1/A2) × (1 - A1/A2)` verwendet.
