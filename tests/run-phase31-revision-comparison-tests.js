import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectCompletionEngine from '../src/closing/ProjectCompletionEngine.js';
import RevisionComparisonEngine from '../src/revision/RevisionComparisonEngine.js';
import StorageEngine from '../src/storage/StorageEngine.js';

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };

const project = createDemoProject();
const system = project.systems[0];
project.object = 'Revisionsvergleich Test';
project.anlageNumber = '244';
project.author = 'QS Tester';
project.report = { ...(project.report || {}), reportNumber: 'REV-001', revision: 'A', bearbeiter: 'QS Tester' };
project.calculationResult = ProjectCalculationService.calculate(project, system.id);

const snapshot = ProjectCompletionEngine.captureRevision(project, system.id, {
  revision: 'A', date: '16.07.2026', author: 'QS Tester', change: 'Ausgangsstand',
});
ok(snapshot.technicalSnapshot, 'Revisionssnapshot enthält technische Detaildaten.');
equal(snapshot.technicalSnapshot.sections.length, system.sections.length, 'Alle Teilstrecken werden im technischen Snapshot gespeichert.');
equal(snapshot.technicalSnapshot.formParts.length, system.formParts.length, 'Alle Formteile werden im technischen Snapshot gespeichert.');
equal(snapshot.technicalSnapshot.specialComponents.length, system.specialComponents.length, 'Alle Sonderbauteile werden im technischen Snapshot gespeichert.');
ProjectCompletionEngine.setReportRevisionBase(project, snapshot.id);
equal(project.reportRevisionBaseId, snapshot.id, 'Vergleichsbasis wird im Projekt gespeichert.');

let comparison = ProjectCompletionEngine.getRevisionComparison(project, system.id);
equal(comparison.status, 'identical', 'Unveränderter Stand ist technisch identisch.');
equal(comparison.summary.total, 0, 'Unveränderter Stand erzeugt keine Änderungen.');

const firstSection = system.sections[0];
const originalQ = Number(firstSection.q);
firstSection.q = originalQ + 250;
firstSection.l = Number(firstSection.l) + 2;
system.sections.push({
  id: `${system.id}-revision-new`, name: 'TS Revision Neu', type: 'pipe', description: 'Neue Vergleichsteilstrecke', q: 400, d: 0.25, b: 0, h: 0, l: 3, zetaSum: 0,
});
const removedFormPart = system.formParts.shift();
system.specialComponents[0].pressureLoss = Number(system.specialComponents[0].pressureLoss || 0) + 5;
project.calculationResult = ProjectCalculationService.calculate(project, system.id);

comparison = ProjectCompletionEngine.getRevisionComparison(project, system.id);
equal(comparison.status, 'changed', 'Technische Änderungen werden erkannt.');
ok(comparison.summary.total >= 5, 'Mehrere Einzeländerungen werden dokumentiert.');
equal(comparison.summary.added, 1, 'Neue Teilstrecke wird als hinzugefügt erkannt.');
equal(comparison.summary.removed, removedFormPart ? 1 : 0, 'Entferntes Formteil wird erkannt.');
ok(comparison.changes.some(item => item.field === 'q' && item.elementId === firstSection.id), 'Luftmengenänderung wird erkannt.');
ok(comparison.changes.some(item => item.field === 'l' && item.elementId === firstSection.id), 'Längenänderung wird erkannt.');
ok(comparison.changes.some(item => item.category === 'specialComponents' && item.field === 'pressureLoss'), 'Änderung am Sonderbauteil wird erkannt.');
ok(Number.isFinite(comparison.totals.delta.totalLoss), 'Druckverlustdifferenz wird berechnet.');

const csv = RevisionComparisonEngine.toCsv(comparison);
ok(csv.includes('Revisionsvergleich'), 'CSV besitzt einen Revisionsvergleich-Kopf.');
ok(csv.includes('Luftmenge'), 'CSV enthält geänderte Luftmenge.');
ok(csv.includes('Neu hinzugefügt'), 'CSV enthält neue Elemente.');

const allChecks = ProjectCompletionEngine.getReviewProtocol(project, system.id).checks.map(item => ({ id: item.id, checked: true }));
let protocol = ProjectCompletionEngine.saveReviewProtocol(project, system.id, {
  reviewer: 'Prüfer QS', date: '16.07.2026', note: 'Alle Punkte kontrolliert.', checks: allChecks,
});
equal(protocol.completed, protocol.total, 'Alle manuellen Prüfpunkte werden gezählt.');
ok(protocol.isComplete, 'Vollständiges Prüfprotokoll wird als abgeschlossen erkannt.');
equal(project.report.checkedBy, 'Prüfer QS', 'Prüfperson wird in die Berichtsangaben übernommen.');

const serialized = StorageEngine.serialize(project);
const reopened = StorageEngine.parse(serialized, { fileName: 'phase31-test.dvp' });
equal(reopened.reportRevisionBaseId, snapshot.id, 'Speicher-Roundtrip erhält die Vergleichsbasis.');
ok(reopened.revisionSnapshots[0].technicalSnapshot, 'Speicher-Roundtrip erhält technische Snapshotdaten.');
equal(reopened.reviewProtocol.systems[system.id].reviewer, 'Prüfer QS', 'Speicher-Roundtrip erhält das Prüfprotokoll.');

const completion = ProjectCompletionEngine.analyze(reopened, system.id, { isProjectDirty: false });
ok(completion.revisionComparison.summary.total > 0, 'Projektabschluss enthält den Revisionsvergleich.');
ok(completion.reviewProtocol.isComplete, 'Projektabschluss enthält das vollständige Prüfprotokoll.');
ok(completion.items.some(item => item.id === 'review-protocol' && item.status === 'ok'), 'Abschlussprüfung bewertet das manuelle Protokoll.');

console.log(`Phase 31.00 Revisionsvergleich: ${checks} Prüfungen bestanden.`);
