import assert from 'node:assert/strict';
import fs from 'node:fs';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCommands from '../src/app/ProjectCommands.js';
import ApplicationState from '../src/app/ApplicationState.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ReportEngine from '../src/report/ReportEngine.js?v=34.00';

const root = new URL('..', import.meta.url);
const read = relative => fs.readFileSync(new URL(relative, root), 'utf8');
let checks = 0;

const appHtml = read('app.html');
const ribbon = read('src/ui/components/RibbonComponent.js');
const sidebar = read('src/ui/components/SidebarComponent.js');
const workspace = read('src/ui/components/WorkspaceComponent.js');
const main = read('src/main.js');
const releaseDiagnostics = read('src/diagnostics/ReleaseCandidateDiagnostics.js');
const handoverEngine = read('src/handover/ProjectHandoverEngine.js');
const css = read('src/ui/phase34_00.css');
const version = read('src/core/appVersion.js');

assert.match(appHtml, /phase34_00\.css\?v=38\.00/); checks += 1;
assert.match(appHtml, /src\/main\.js\?v=45\.00/); checks += 1;
assert.match(ribbon, /showSystemManager/); checks += 1;
assert.match(ribbon, /label: 'Anlagen'/); checks += 1;
assert.match(sidebar, /type: 'systemManager'/); checks += 1;
assert.match(sidebar, /id: 'systems'/); checks += 1;
assert.match(sidebar, /ProjectCalculationService\.calculate\(project, selectedSystem\?\.id \|\| null\)/); checks += 1;
assert.match(workspace, /renderSystemManager/); checks += 1;
assert.match(workspace, /ProjectCalculationService\.calculate\(project, activeSystem\?\.id \|\| null\)/); checks += 1;
assert.match(main, /ProjectCalculationService\.calculate\(state\.project, state\.selectedSystem\?\.id/); checks += 1;
assert.match(releaseDiagnostics, /ProjectCalculationService\.calculate\(activeProject, activeSystem\?\.id \|\| null\)/); checks += 1;
assert.match(handoverEngine, /calculationResult\?\.system\?\.id !== system\.id/); checks += 1;
assert.match(workspace, /Vergleich CSV/); checks += 1;
assert.match(workspace, /data-system-action="duplicate"/); checks += 1;
assert.match(workspace, /data-system-field="bkpNumber"/); checks += 1;
assert.match(css, /dp-system-manager-summary/); checks += 1;
assert.match(css, /@media \(max-width: 470px\)/); checks += 1;
assert.match(version, /APP_RELEASE = '45\.00'/); checks += 1;
assert.match(version, /APP_VERSION = '2\.0\.0'/); checks += 1;

const project = createDemoProject();
const state = new ApplicationState();
state.setProject(project);
const commands = new ProjectCommands(state);
const second = commands.duplicateSystem(project.systems[0].id);
second.name = 'Abluftanlage Vergleich';
second.type = 'Abluft';
second.bkpNumber = '244.2';
second.sections.forEach(section => { section.q = Number(section.q || 0) * 0.75; });
project.calculationResult = ProjectCalculationService.calculate(project, project.systems[0].id);
project.reportOptions = { ...(project.reportOptions || {}), includeSystemsOverview: true };

const model = ReportEngine.createReportModel(project, { system: project.systems[0] });
assert.equal(model.systemsOverview.rows.length, 2); checks += 1;
assert.ok(model.systemsOverview.rows.some(row => row.name === 'Abluftanlage Vergleich')); checks += 1;
const plan = ReportEngine.createPagePlan(model);
assert.ok(plan.entries.some(entry => entry.key === 'systemsOverview')); checks += 1;
const body = ReportEngine.renderReportBody(model);
assert.match(body, /Projektweite Anlagenübersicht/); checks += 1;
assert.match(body, /Abluftanlage Vergleich/); checks += 1;
const csv = ReportEngine.createCsv(model);
assert.match(csv, /Projektweite Anlagenuebersicht/); checks += 1;
assert.match(csv, /244\.2/); checks += 1;

const singleProject = createDemoProject();
singleProject.calculationResult = ProjectCalculationService.calculate(singleProject, singleProject.systems[0].id);
const singleModel = ReportEngine.createReportModel(singleProject, { system: singleProject.systems[0] });
const singlePlan = ReportEngine.createPagePlan(singleModel);
assert.ok(!singlePlan.entries.some(entry => entry.key === 'systemsOverview')); checks += 1;

console.log(`Phase 34.00 UI/Report: ${checks} Prüfungen bestanden.`);
