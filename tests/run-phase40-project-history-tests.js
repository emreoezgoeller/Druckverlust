import assert from 'node:assert/strict';
import ApplicationState from '../src/app/ApplicationState.js';
import ProjectHistoryEngine, { createSnapshot, describeChange } from '../src/project/ProjectHistoryEngine.js';
import createDefaultProject from '../src/project/defaultProject.js';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const state = new ApplicationState();
const project = createDefaultProject({ projectNumber: 'HIST-001' });
state.setProject(project);
state.setSelection('project', project);

const history = new ProjectHistoryEngine(state, { debounceMs: 100000, limit: 8 });
state.historyEngine = history;
history.install();

let model = history.getState();
check(model.count === 1, 'Startstand wird angelegt.');
check(model.pointer === 0, 'Startzeiger steht auf dem ersten Eintrag.');
check(model.canUndo === false, 'Startstand kann nicht rückgängig gemacht werden.');
check(model.canRedo === false, 'Startstand besitzt keinen Redo-Stand.');

const originalQ = Number(state.project.systems[0].sections[0].q);
state.project.systems[0].sections[0].q = originalQ + 250;
state.markCalculationDirty();
history.flush();
model = history.getState();
check(model.count === 2, 'Eine fachliche Änderung erzeugt einen Verlaufseintrag.');
check(model.canUndo === true, 'Nach einer Änderung ist Rückgängig verfügbar.');
check(model.current.label.includes('Teilstrecke'), 'Änderung wird als Teilstreckenänderung beschrieben.');

state.project.calculationResult = { timestamp: 'volatile', calculation: { total: 99 } };
state.project.systems[0].formParts[0] && (state.project.systems[0].formParts[0].calculationResult = { zeta: 999 });
state.notify();
const countBeforeVolatile = history.getState().count;
history.flush();
check(history.getState().count === countBeforeVolatile, 'Reine Berechnungsergebnisse erzeugen keinen zusätzlichen Verlaufseintrag.');

check(history.undo() === true, 'Rückgängig wird ausgeführt.');
check(Number(state.project.systems[0].sections[0].q) === originalQ, 'Rückgängig stellt den ursprünglichen Luftvolumenstrom wieder her.');
check(state.isProjectDirty === true, 'Wiederhergestellter Stand wird als ungespeichert markiert.');
model = history.getState();
check(model.canRedo === true, 'Nach Rückgängig ist Wiederholen verfügbar.');

check(history.redo() === true, 'Wiederholen wird ausgeführt.');
check(Number(state.project.systems[0].sections[0].q) === originalQ + 250, 'Wiederholen stellt den geänderten Wert wieder her.');
check(history.getState().canRedo === false, 'Am neuesten Stand ist Redo nicht verfügbar.');

history.undo();
state.project.systems[0].sections[0].l = Number(state.project.systems[0].sections[0].l || 0) + 1;
state.markCalculationDirty();
history.flush();
check(history.getState().canRedo === false, 'Neue Änderung nach Rückgängig verwirft den alten Redo-Zweig.');
check(history.getState().count === 2, 'Verlauf wird nach einem neuen Zweig sauber gekürzt.');

const checkpoint = history.createCheckpoint('Vor Variantenprüfung');
check(checkpoint?.checkpoint === true, 'Aktueller Stand kann als Wiederherstellungspunkt markiert werden.');
check(history.getState().current.label === 'Vor Variantenprüfung', 'Eigene Bezeichnung des Wiederherstellungspunkts bleibt erhalten.');

state.selectSection(state.project.systems[0].sections[1]);
state.project.systems[0].sections[1].q = Number(state.project.systems[0].sections[1].q) + 100;
state.markCalculationDirty();
history.flush();
const targetIndex = history.getState().pointer;
check(history.getState().entries[targetIndex].label.includes('Teilstrecke'), 'Weitere Teilstreckenänderung wird erkannt.');
history.undo();
check(history.redo() === true, 'Redo nach Auswahlwechsel funktioniert.');
check(state.selectedSection?.id === state.project.systems[0].sections[1].id, 'Auswahl der bearbeiteten Teilstrecke wird wiederhergestellt.');

const csv = history.createCsv();
check(csv.includes('Bezeichnung'), 'CSV enthält die Verlaufsüberschrift.');
check(csv.includes('Vor Variantenprüfung'), 'CSV enthält markierte Wiederherstellungspunkte.');
check(csv.split(/\r?\n/).length >= 3, 'CSV enthält mehrere Verlaufszeilen.');

const snapshot = createSnapshot(state.project);
check(snapshot.calculationResult === undefined, 'Projektweite Berechnungsergebnisse werden aus Snapshots entfernt.');
check(snapshot.systems[0].formParts.every(part => part.calculationResult === undefined), 'Formteil-Berechnungsergebnisse werden aus Snapshots entfernt.');

const before = createSnapshot(state.project);
const after = structuredClone(before);
after.systems[0].sections.push({ id: 'history-added', name: 'ts99', q: 100, l: 1, b: .2, h: .2 });
check(describeChange(before, after).includes('hinzugefügt'), 'Änderungsbeschreibung erkennt neu hinzugefügte Teilstrecken.');

for (let i = 0; i < 12; i += 1) {
  state.project.systems[0].sections[0].description = `Historie ${i}`;
  state.markProjectDirty();
  history.flush();
}
check(history.getState().count <= 8, 'Verlauf respektiert die konfigurierte Obergrenze.');
check(history.getState().pointer === history.getState().count - 1, 'Zeiger bleibt nach Begrenzung auf dem neuesten Stand.');

history.clear();
model = history.getState();
check(model.count === 1, 'Verlauf kann auf den aktuellen Stand zurückgesetzt werden.');
check(model.canUndo === false && model.canRedo === false, 'Zurückgesetzter Verlauf hat keine Undo-/Redo-Schritte.');
check(model.current.label === 'Verlauf zurückgesetzt', 'Zurückgesetzter Verlauf ist eindeutig bezeichnet.');

const replacement = createDefaultProject({ projectNumber: 'HIST-NEW' });
state.setProject(replacement);
model = history.getState();
check(model.count === 1, 'Beim Laden eines anderen Projekts wird der Sitzungsverlauf neu gestartet.');
check(model.current.label === 'Projektstand geladen', 'Neuer Projektstand erhält eine klare Basisbezeichnung.');

history.uninstall();
console.log(`Phase 40.00 Änderungsverlauf: ${checks} Prüfungen bestanden.`);
