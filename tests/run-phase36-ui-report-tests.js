import assert from 'node:assert/strict';
import fs from 'node:fs';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectStandardizationEngine from '../src/project/ProjectStandardizationEngine.js?v=38.00';
import ReportEngine from '../src/report/ReportEngine.js?v=38.00';

const root = new URL('..', import.meta.url);
const read = relative => fs.readFileSync(new URL(relative, root), 'utf8');
let checks = 0;

const appHtml = read('app.html');
const ribbon = read('src/ui/components/RibbonComponent.js');
const actions = read('src/ui/core/RibbonActions.js');
const shortcuts = read('src/ui/core/KeyboardShortcuts.js');
const sidebar = read('src/ui/components/SidebarComponent.js');
const workspace = read('src/ui/components/WorkspaceComponent.js');
const statusbar = read('src/ui/components/StatusBarComponent.js');
const css = read('src/ui/phase36_00.css');
const version = read('src/core/appVersion.js');
const deployment = read('src/diagnostics/DeploymentDiagnostics.js');
const quality = read('src/quality/EngineeringQualityEngine.js');
const report = read('src/report/ReportEngine.js');

assert.match(appHtml, /phase36_00\.css\?v=38\.00/); checks += 1;
assert.match(appHtml, /src\/main\.js\?v=52\.00/); checks += 1;
assert.match(ribbon, /showProjectStandardization/); checks += 1;
assert.match(ribbon, /label: 'Workflow'/); checks += 1;
assert.match(actions, /showProjectStandardization/); checks += 1;
assert.match(shortcuts, /key === 'w'/); checks += 1;
assert.match(sidebar, /type: 'projectStandardization'/); checks += 1;
assert.match(sidebar, /Projektworkflow/); checks += 1;
assert.match(workspace, /renderProjectStandardization/); checks += 1;
assert.match(workspace, /Kontrollierte Massenbearbeitung/); checks += 1;
assert.match(workspace, /Anlagenstruktur-Vorlagen/); checks += 1;
assert.match(workspace, /Änderungsprotokoll/); checks += 1;
assert.match(statusbar, /Projektworkflow/); checks += 1;
assert.match(css, /dp-standardization-grid/); checks += 1;
assert.match(css, /dp-bulk-preview-table/); checks += 1;
assert.match(deployment, /ProjectStandardizationEngine/); checks += 1;
assert.match(deployment, /phase36_00\.css/); checks += 1;
assert.match(quality, /resolveProfile/); checks += 1;
assert.match(quality, /profile\.name/); checks += 1;
assert.match(report, /projectWorkflow/); checks += 1;
assert.match(report, /Engineering Pruefprofil/); checks += 1;
assert.match(version, /APP_RELEASE = '52\.00'/); checks += 1;
assert.match(version, /APP_VERSION = '2\.7\.0'/); checks += 1;

const project = createDemoProject();
project.name = 'Phase 36 Bericht';
project.object = 'Workflow-Test';
ProjectStandardizationEngine.applyProfile(project, 'comfort', { actor: 'Prüfer' });
ProjectStandardizationEngine.addHistory(project, {
  action: 'TEST_CHANGE',
  title: 'Teständerung',
  actor: 'Prüfer',
  systemId: project.systems[0].id,
  systemName: project.systems[0].name,
  summary: 'Dokumentierter Testeintrag',
});
project.calculationResult = ProjectCalculationService.calculate(project, project.systems[0].id);
const model = ReportEngine.createReportModel(project, { system: project.systems[0] });
assert.equal(model.projectWorkflow.profile.id, 'comfort'); checks += 1;
assert.ok(model.projectWorkflow.changeHistory.length >= 2); checks += 1;
const body = ReportEngine.renderReportBody(model);
assert.match(body, /Prüfprofil/); checks += 1;
assert.match(body, /Komfort \/ geräuschsensibel/); checks += 1;
const csv = ReportEngine.createCsv(model);
assert.match(csv, /Engineering Pruefprofil/); checks += 1;
assert.match(csv, /Aenderungsprotokoll/); checks += 1;
assert.match(csv, /TEST_CHANGE/); checks += 1;

console.log(`Phase 36.00 UI/Report: ${checks} Prüfungen bestanden.`);
