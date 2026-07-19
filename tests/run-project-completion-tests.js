import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import LiveSimulationEngine from '../src/simulation/LiveSimulationEngine.js';
import ProjectCompletionEngine from '../src/closing/ProjectCompletionEngine.js';
import StorageEngine from '../src/storage/StorageEngine.js';

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };

const project = createDemoProject();
const system = project.systems[0];
project.object = 'Demoprojekt Lüftung';
project.anlageNumber = '244.1';
project.author = 'Test Bearbeiter';
project.report = {
  ...(project.report || {}),
  reportNumber: 'DP-TEST-001',
  revision: '0',
  bearbeiter: 'Test Bearbeiter',
};
project.calculationResult = ProjectCalculationService.calculate(project, system.id);

const simulation = LiveSimulationEngine.create(project, system.id, {
  scope: 'all',
  airflowPercent: 110,
  dimensionPercent: 120,
});
const originalSystem = JSON.stringify(system);
const variant = ProjectCompletionEngine.saveVariant(project, system.id, simulation, {
  name: 'Variante 120 Prozent Querschnitt',
  note: 'Neutraler Vergleich für den Bericht',
  includeInReport: true,
});

ok(variant.id, 'Variante besitzt eine ID.');
equal(project.simulationVariants.length, 1, 'Eine Variante wurde im Projekt gespeichert.');
equal(project.reportVariantId, variant.id, 'Variante wurde für den Bericht ausgewählt.');
equal(JSON.stringify(system), originalSystem, 'Speichern der Variante verändert die Anlage nicht.');
ok(variant.scenario.totalLoss < variant.baseline.totalLoss, 'Grössere Abmessungen reduzieren im Variantenvergleich den Druckverlust.');

const reportVariant = ProjectCompletionEngine.getReportVariant(project, system.id);
equal(reportVariant.name, variant.name, 'Ausgewählte Berichtsvariante wird gefunden.');

const snapshot = ProjectCompletionEngine.captureRevision(project, system.id, {
  revision: '1',
  date: '15.07.2026',
  author: 'Test Bearbeiter',
  change: 'Variante und Abschlussprüfung ergänzt',
});
equal(snapshot.revision, '1', 'Revisionsnummer wurde übernommen.');
equal(project.report.revision, '1', 'Bericht trägt die neue Revision.');
equal(project.report.revisionHistory[0].change, 'Variante und Abschlussprüfung ergänzt', 'Revisionsverlauf wurde automatisch ergänzt.');
ok(snapshot.fingerprint, 'Revisionssnapshot besitzt einen Projektfingerabdruck.');


const serialized = StorageEngine.serialize(project);
const reopened = StorageEngine.parse(serialized, { fileName: 'phase30-test.dvp' });
equal(reopened.simulationVariants.length, 1, 'Speicher-Roundtrip erhält das Variantenarchiv.');
equal(reopened.revisionSnapshots.length, 1, 'Speicher-Roundtrip erhält Revisionssnapshots.');
equal(reopened.reportVariantId, variant.id, 'Speicher-Roundtrip erhält die Berichtsvariante.');

let completion = ProjectCompletionEngine.analyze(project, system.id, { isProjectDirty: false });
ok(completion.revisionCurrent, 'Unveränderter Projektstand entspricht dem Revisionssnapshot.');
equal(completion.reportVariant.id, variant.id, 'Projektabschluss kennt die Berichtsvariante.');
ok(completion.score >= 80, 'Vollständiges Demoprojekt erreicht einen hohen Abschluss-Score.');

system.sections[0].q = Number(system.sections[0].q || 0) + 10;
completion = ProjectCompletionEngine.analyze(project, system.id, { isProjectDirty: true });
ok(!completion.revisionCurrent, 'Änderungen nach dem Snapshot werden erkannt.');
ok(!completion.variantCurrent, 'Änderungen an der Berechnung markieren die gespeicherte Berichtsvariante als veraltet.');
ok(completion.items.some(item => item.id === 'save-state' && item.status === 'warning'), 'Ungespeicherter Zustand wird als Hinweis geführt.');

equal(ProjectCompletionEngine.suggestNextRevision('1'), '2', 'Numerische Revision wird korrekt erhöht.');
equal(ProjectCompletionEngine.suggestNextRevision('1.4'), '1.5', 'Dezimalrevision wird korrekt erhöht.');
equal(ProjectCompletionEngine.suggestNextRevision('A'), 'B', 'Buchstabenrevision wird korrekt erhöht.');

ok(ProjectCompletionEngine.removeVariant(project, variant.id), 'Gespeicherte Variante kann gelöscht werden.');
equal(project.simulationVariants.length, 0, 'Variantenarchiv ist nach dem Löschen leer.');

console.log(`Phase 30.00 Projektabschluss: ${checks} Prüfungen bestanden.`);
