import assert from 'node:assert/strict';
import fs from 'node:fs';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectCompletionEngine from '../src/closing/ProjectCompletionEngine.js?v=34.00';
import ProjectHandoverEngine from '../src/handover/ProjectHandoverEngine.js?v=34.00';
import ReportEngine from '../src/report/ReportEngine.js?v=34.00';

const root = new URL('..', import.meta.url);
const read = relative => fs.readFileSync(new URL(relative, root), 'utf8');
let checks = 0;

const appHtml = read('app.html');
const ribbonSource = read('src/ui/components/RibbonComponent.js');
const workspaceSource = read('src/ui/components/WorkspaceComponent.js');
const css = read('src/ui/phase33_00.css');
const deploymentSource = read('src/diagnostics/DeploymentDiagnostics.js');

assert.match(appHtml, /phase33_00\.css\?v=38\.00/); checks += 1;
assert.match(appHtml, /src\/main\.js\?v=51\.00/); checks += 1;
assert.match(ribbonSource, /showProjectHandover/); checks += 1;
assert.match(ribbonSource, /label: 'Übergabe'/); checks += 1;
assert.match(workspaceSource, /renderProjectHandover/); checks += 1;
assert.match(workspaceSource, /Importkontrolle und Freigabepaket/); checks += 1;
assert.match(workspaceSource, /data-handover-action="inspect-import"/); checks += 1;
assert.match(workspaceSource, /data-handover-status="released"/); checks += 1;
assert.match(css, /dp-handover-score/); checks += 1;
assert.match(css, /@media \(max-width:760px\)/); checks += 1;
assert.match(deploymentSource, /ProjectHandoverEngine/); checks += 1;
assert.match(deploymentSource, /phase33_00\.css/); checks += 1;

const project = createDemoProject();
project.calculationResult = ProjectCalculationService.calculate(project);
const system = project.systems[0];
const protocol = ProjectCompletionEngine.getReviewProtocol(project, system.id);
ProjectCompletionEngine.saveReviewProtocol(project, system.id, {
  reviewer: 'Prüfer Bericht', date: '2026-07-16', note: 'Berichtsprüfung',
  checks: protocol.checks.map(item => ({ id: item.id, checked: true })),
});
ProjectCompletionEngine.captureRevision(project, system.id, { revision: project.report.revision, author: project.author, change: 'Berichtsstand' });
ProjectHandoverEngine.saveApproval(project, system.id, {
  status: 'released', preparedBy: 'Bearbeiter Bericht', checkedBy: 'Prüfer Bericht', releasedBy: 'Freigabe Bericht', note: 'Dokumentierter Übergabestand',
});
const model = ReportEngine.createReportModel(project, { system });
assert.equal(model.handoverApproval.status, 'released'); checks += 1;
const html = ReportEngine.createStandaloneHtml(model);
assert.match(html, /Dokumentierte Projektübergabe/); checks += 1;
assert.match(html, /Freigabe Bericht/); checks += 1;
assert.match(html, /Dokumentierter Übergabestand/); checks += 1;
const csv = ReportEngine.createCsv(model);
assert.match(csv, /Uebergabestatus/); checks += 1;
assert.match(csv, /Freigabe Bericht/); checks += 1;

console.log(`Phase 33 UI/Report: ${checks} Prüfungen bestanden.`);
