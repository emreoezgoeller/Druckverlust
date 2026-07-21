import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectTaskCenterEngine from '../src/project/ProjectTaskCenterEngine.js?v=57.00';
import StorageEngine from '../src/storage/StorageEngine.js';
import ReportEngine from '../src/report/ReportEngine.js?v=57.00';

let checks = 0;
const project = createDemoProject();
project.name = 'Phase 37 Testprojekt';
project.object = 'Projekt-Navigator';
project.author = 'Emre';
project.company = 'Engineering AG';
const system = project.systems[0];
project.calculationResult = ProjectCalculationService.calculate(project, system.id);

const initial = ProjectTaskCenterEngine.analyze(project, { selectedSystemId: system.id });
assert.ok(initial.tasks.length > 0); checks += 1;
assert.ok(initial.counts.generated > 0); checks += 1;
assert.equal(initial.counts.manual, 0); checks += 1;
assert.ok(initial.score >= 0 && initial.score <= 100); checks += 1;
assert.ok(initial.disclaimer.includes('fachliche Freigabe')); checks += 1;

const manual = ProjectTaskCenterEngine.addManualTask(project, {
  title: 'Kanalhöhe koordinieren',
  description: 'Mit Architektur abstimmen.',
  priority: 'high',
  dueDate: '2026-08-01',
  actor: 'Emre',
  systemId: system.id,
  sectionId: system.sections[0].id,
});
assert.equal(manual.source, 'manual'); checks += 1;
assert.equal(manual.priority, 'high'); checks += 1;
assert.equal(manual.systemId, system.id); checks += 1;
assert.equal(manual.sectionId, system.sections[0].id); checks += 1;

let analysis = ProjectTaskCenterEngine.analyze(project, { selectedSystemId: system.id });
assert.equal(analysis.counts.manual, 1); checks += 1;
assert.ok(analysis.tasks.some(task => task.id === manual.id)); checks += 1;
assert.equal(analysis.tasks.find(task => task.id === manual.id).status, 'open'); checks += 1;

ProjectTaskCenterEngine.updateTask(project, manual.id, { status: 'inProgress', actor: 'Planer' });
analysis = ProjectTaskCenterEngine.analyze(project);
assert.equal(analysis.tasks.find(task => task.id === manual.id).status, 'inProgress'); checks += 1;
assert.equal(analysis.tasks.find(task => task.id === manual.id).actor, 'Planer'); checks += 1;

const criticalManual = ProjectTaskCenterEngine.addManualTask(project, { title: 'Kritischen Punkt prüfen', priority: 'critical' });
analysis = ProjectTaskCenterEngine.analyze(project);
const criticalBeforeDone = analysis.counts.critical;
assert.ok(criticalBeforeDone >= 1); checks += 1;
ProjectTaskCenterEngine.updateTask(project, criticalManual.id, { status: 'done' });
analysis = ProjectTaskCenterEngine.analyze(project);
assert.equal(analysis.counts.critical, criticalBeforeDone - 1); checks += 1;
ProjectTaskCenterEngine.deleteManualTask(project, criticalManual.id);

const overdueManual = ProjectTaskCenterEngine.addManualTask(project, { title: 'Überfällige Aufgabe', priority: 'low', dueDate: '2000-01-01' });
analysis = ProjectTaskCenterEngine.analyze(project);
assert.ok(analysis.counts.overdue >= 1); checks += 1;
ProjectTaskCenterEngine.updateTask(project, overdueManual.id, { status: 'done' });
analysis = ProjectTaskCenterEngine.analyze(project);
assert.equal(analysis.tasks.find(task => task.id === overdueManual.id).status, 'done'); checks += 1;
assert.equal(analysis.counts.overdue, 0); checks += 1;
ProjectTaskCenterEngine.deleteManualTask(project, overdueManual.id);

const generated = analysis.tasks.find(task => task.source === 'generated');
assert.ok(generated); checks += 1;
ProjectTaskCenterEngine.updateTask(project, generated.id, { status: 'done', actor: 'Prüfer' });
analysis = ProjectTaskCenterEngine.analyze(project);
assert.equal(analysis.tasks.find(task => task.id === generated.id).status, 'done'); checks += 1;
assert.equal(project.workflow.taskCenter.generatedStates[generated.id].actor, 'Prüfer'); checks += 1;

const favView = ProjectTaskCenterEngine.addFavorite(project, {
  type: 'view', viewType: 'projectCockpit', label: 'Projektcockpit', meta: 'QS',
});
assert.equal(favView.viewType, 'projectCockpit'); checks += 1;
const favSystem = ProjectTaskCenterEngine.addFavorite(project, {
  type: 'system', systemId: system.id, label: system.name, meta: system.type,
});
assert.equal(favSystem.systemId, system.id); checks += 1;
const favSection = ProjectTaskCenterEngine.addFavorite(project, {
  type: 'section', systemId: system.id, sectionId: system.sections[0].id, label: system.sections[0].name, meta: system.name,
});
assert.equal(favSection.sectionId, system.sections[0].id); checks += 1;
ProjectTaskCenterEngine.addFavorite(project, {
  type: 'view', viewType: 'projectCockpit', label: 'Projektcockpit', meta: 'QS',
});
analysis = ProjectTaskCenterEngine.analyze(project);
assert.equal(analysis.favorites.length, 3); checks += 1;

for (let index = 0; index < 20; index += 1) {
  ProjectTaskCenterEngine.addFavorite(project, { type: 'view', viewType: `view-${index}`, label: `Favorit ${index}` });
}
analysis = ProjectTaskCenterEngine.analyze(project);
assert.equal(analysis.favorites.length, 16); checks += 1;

const csv = ProjectTaskCenterEngine.createCsv(project, analysis);
assert.match(csv, /Projekt-Navigator und Aufgabenliste/); checks += 1;
assert.match(csv, /Kanalhöhe koordinieren/); checks += 1;
assert.match(csv, /Automatisch/); checks += 1;
assert.match(ProjectTaskCenterEngine.createFileName(project), /_Aufgaben_/); checks += 1;

ProjectTaskCenterEngine.updateTask(project, manual.id, { status: 'done' });
assert.equal(ProjectTaskCenterEngine.clearCompletedManualTasks(project), 1); checks += 1;
analysis = ProjectTaskCenterEngine.analyze(project);
assert.equal(analysis.counts.manual, 0); checks += 1;

const second = ProjectTaskCenterEngine.addManualTask(project, { title: 'Bericht kontrollieren', priority: 'normal' });
assert.ok(ProjectTaskCenterEngine.deleteManualTask(project, second.id)); checks += 1;
assert.equal(ProjectTaskCenterEngine.deleteManualTask(project, 'nicht-vorhanden'), false); checks += 1;
assert.throws(() => ProjectTaskCenterEngine.addManualTask(project, { title: '   ' }), /Aufgabenbezeichnung/); checks += 1;

const storedTask = ProjectTaskCenterEngine.addManualTask(project, { title: 'Gespeicherte Aufgabe', priority: 'critical', actor: 'Emre' });
const serialized = StorageEngine.serialize(project);
const restored = StorageEngine.parse(serialized);
const restoredAnalysis = ProjectTaskCenterEngine.analyze(restored, { selectedSystemId: restored.systems[0].id });
assert.ok(restoredAnalysis.tasks.some(task => task.id === storedTask.id)); checks += 1;
assert.equal(restoredAnalysis.favorites.length, 16); checks += 1;
assert.equal(restored.workflow.taskCenter.generatedStates[generated.id].status, 'done'); checks += 1;

restored.calculationResult = ProjectCalculationService.calculate(restored, restored.systems[0].id);
const model = ReportEngine.createReportModel(restored, { system: restored.systems[0] });
assert.ok(model.projectTasks); checks += 1;
assert.ok(model.projectTasks.tasks.length > 0); checks += 1;
const pagePlan = ReportEngine.createPagePlan(model);
assert.ok(pagePlan.entries.some(entry => entry.key === 'projectTasks')); checks += 1;
const body = ReportEngine.renderReportBody(model);
assert.match(body, /Projektaufgaben/); checks += 1;
assert.match(body, /Gespeicherte Aufgabe/); checks += 1;
const reportCsv = ReportEngine.createCsv(model);
assert.match(reportCsv, /Projektaufgaben/); checks += 1;
assert.match(reportCsv, /Gespeicherte Aufgabe/); checks += 1;

console.log(`Phase 37.00 Projekt-Navigator/Aufgaben: ${checks} Prüfungen bestanden.`);
