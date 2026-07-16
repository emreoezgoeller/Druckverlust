import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectCompletionEngine from '../src/closing/ProjectCompletionEngine.js';
import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';
import ReportEngine from '../src/report/ReportEngine.js';

let checks = 0;
const match = (value, pattern, message) => { assert.match(value, pattern, message); checks += 1; };
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const project = createDemoProject();
const system = project.systems[0];
project.object = 'Phase 31 UI';
project.anlageNumber = '244';
project.author = 'UI Tester';
project.report = { ...(project.report || {}), reportNumber: 'P31-001', revision: 'A', bearbeiter: 'UI Tester' };
project.calculationResult = ProjectCalculationService.calculate(project, system.id);
const snapshot = ProjectCompletionEngine.captureRevision(project, system.id, { revision: 'A', author: 'UI Tester', change: 'Basisstand' });
ProjectCompletionEngine.setReportRevisionBase(project, snapshot.id);
system.sections[0].q = Number(system.sections[0].q) + 100;
project.calculationResult = ProjectCalculationService.calculate(project, system.id);
ProjectCompletionEngine.saveReviewProtocol(project, system.id, {
  reviewer: 'Prüferin', date: '16.07.2026', note: 'Noch nicht komplett.',
  checks: [{ id: 'inputs', checked: true }, { id: 'calculation', checked: true }],
});

let html = '';
const root = {
  set innerHTML(value) { html = String(value); },
  get innerHTML() { return html; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
};
const workspace = Object.create(WorkspaceComponent.prototype);
workspace.root = root;
workspace.state = {
  project, selectedSystem: system, selectedSection: system.sections[0],
  isProjectDirty: false, isCalculationDirty: false,
  setSelection() {}, notify() {}, markProjectDirty() {},
};
workspace.autoCalculateProject = () => project.calculationResult;
workspace.renderProjectCompletion(system);
match(html, /PHASE 31 · PROJEKTABSCHLUSS/, 'Projektabschluss zeigt Phase 31.');
match(html, /Revisionsvergleich/, 'Revisionsvergleich wird im Abschluss gerendert.');
match(html, /data-revision-base/, 'Basisrevision kann ausgewählt werden.');
match(html, /data-revision-filter="sections"/, 'Änderungen können nach Teilstrecken gefiltert werden.');
match(html, /data-revision-action="csv"/, 'Revisionsvergleich besitzt CSV-Export.');
match(html, /Internes Prüfprotokoll/, 'Manuelles Prüfprotokoll wird gerendert.');
match(html, /data-review-check="inputs"/, 'Prüfpunkte sind interaktiv vorhanden.');
match(html, /data-review-action="save"/, 'Prüfprotokoll kann gespeichert werden.');

project.reportOptions = { includeRevisionComparison: true, includeApproval: true };
const model = ReportEngine.createReportModel(project, { system });
ok(model.revisionComparison.summary.total > 0, 'Berichtmodell enthält technische Änderungen.');
ok(model.reviewProtocol.completed === 2, 'Berichtmodell enthält den manuellen Prüfstand.');
const plan = ReportEngine.createPagePlan(model);
ok(plan.entries.some(entry => entry.key === 'revisionComparison'), 'Seitenplan enthält den Revisionsvergleich.');
const reportHtml = ReportEngine.renderReportBody(model);
match(reportHtml, /Basisstand/, 'PDF-Bericht nennt die Basisrevision.');
match(reportHtml, /report-revision-comparison-table/, 'PDF-Bericht enthält die Änderungstabelle.');
match(reportHtml, /Manuelles Prüfprotokoll/, 'Freigabeseite enthält das manuelle Prüfprotokoll.');
const csv = ReportEngine.createCsv(model);
match(csv, /Revisionsvergleich/, 'Gesamt-CSV enthält den Revisionsvergleich.');
match(csv, /Manuelles Pruefprotokoll/, 'Gesamt-CSV enthält das manuelle Prüfprotokoll.');

const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/phase31_00.css', import.meta.url), 'utf8');
const version = readFileSync(new URL('../src/core/appVersion.js', import.meta.url), 'utf8');
match(appHtml, /phase31_00\.css\?v=38\.00/, 'Phase-31-CSS wird geladen.');
match(css, /dp-revision-comparison-table/, 'Phase-31-CSS enthält die Vergleichstabelle.');
match(css, /dp-review-checklist/, 'Phase-31-CSS enthält die Prüfcheckliste.');
match(version, /APP_VERSION = '1\.15\.0'/, 'App-Version wurde auf 1.15.0 fortgeschrieben.');
match(version, /APP_RELEASE = '38\.00'/, 'Aktueller Release ist Phase 38.00.');

console.log(`Phase 31.00 UI und Bericht: ${checks} Prüfungen bestanden.`);
