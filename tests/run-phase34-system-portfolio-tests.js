import assert from 'node:assert/strict';
import ApplicationState from '../src/app/ApplicationState.js';
import ProjectCommands from '../src/app/ProjectCommands.js';
import createDemoProject from '../src/project/demoProject.js';
import SystemPortfolioEngine from '../src/project/SystemPortfolioEngine.js?v=58.00';
import StorageEngine from '../src/storage/StorageEngine.js';
import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectHandoverEngine from '../src/handover/ProjectHandoverEngine.js?v=58.00';

let checks = 0;
const project = createDemoProject();
const state = new ApplicationState();
state.setProject(project);
const commands = new ProjectCommands(state);
const first = project.systems[0];
first.bkpNumber = '244.1';

const duplicate = commands.duplicateSystem(first.id);
assert.equal(project.systems.length, 2); checks += 1;
assert.notEqual(duplicate.id, first.id); checks += 1;
assert.equal(duplicate.sections.length, first.sections.length); checks += 1;
assert.equal(duplicate.formParts.length, first.formParts.length); checks += 1;
assert.equal(duplicate.specialComponents.length, first.specialComponents.length); checks += 1;
assert.equal(new Set(duplicate.sections.map(item => item.id)).size, duplicate.sections.length); checks += 1;
assert.ok(duplicate.formParts.every(item => !item.sectionId || duplicate.sections.some(section => section.id === item.sectionId))); checks += 1;
assert.ok(duplicate.specialComponents.every(item => !item.sectionId || duplicate.sections.some(section => section.id === item.sectionId))); checks += 1;

const blank = commands.addSystem();
blank.name = 'Abluftanlage';
blank.type = 'Abluft';
blank.bkpNumber = '244.2';
assert.equal(project.systems.length, 3); checks += 1;
assert.equal(blank.sections.length, 0); checks += 1;

commands.moveSystem(blank.id, -1);
assert.equal(project.systems[1].id, blank.id); checks += 1;
commands.moveSystem(blank.id, 1);
assert.equal(project.systems[2].id, blank.id); checks += 1;

const analysis = SystemPortfolioEngine.analyze(project, { selectedSystemId: duplicate.id });
assert.equal(analysis.rows.length, 3); checks += 1;
assert.equal(analysis.summary.systems, 3); checks += 1;
assert.ok(analysis.summary.totalSections >= first.sections.length * 2); checks += 1;
assert.ok(analysis.rows.some(row => row.id === duplicate.id && row.active)); checks += 1;
assert.ok(analysis.rows.filter(row => row.sections > 0).every(row => row.totalPressureLoss > 0)); checks += 1;
assert.ok(analysis.rows.every(row => Number.isFinite(row.qualityScore))); checks += 1;
assert.ok(analysis.summary.highestLoss); checks += 1;
assert.ok(analysis.summary.highestVelocity); checks += 1;

state.selectSystem(duplicate);
const workspace = Object.create(WorkspaceComponent.prototype);
workspace.state = state;
const activeResult = workspace.autoCalculateProject({ notify: false });
assert.equal(activeResult.system.id, duplicate.id); checks += 1;
assert.equal(state.project.calculationResult.system.id, duplicate.id); checks += 1;

state.project.calculationResult = ProjectCalculationService.calculate(state.project, first.id);
const handover = ProjectHandoverEngine.analyze(state.project, duplicate.id, { isProjectDirty: false });
assert.ok(handover.items.length > 0); checks += 1;
assert.equal(state.project.calculationResult.system.id, duplicate.id); checks += 1;

const csv = SystemPortfolioEngine.createCsv(project, analysis);
assert.match(csv, /Anlagenvergleich/); checks += 1;
assert.match(csv, /Zuluftanlage Demo/); checks += 1;
assert.match(csv, /Abluftanlage/); checks += 1;
assert.match(SystemPortfolioEngine.createCsvFileName(project), /Anlagenvergleich/); checks += 1;

const serialized = StorageEngine.serialize(project);
const restored = StorageEngine.parse(serialized);
assert.equal(restored.systems.length, 3); checks += 1;
assert.equal(restored.systems[1].name, project.systems[1].name); checks += 1;
assert.equal(restored.systems[0].sections.length, first.sections.length); checks += 1;

commands.deleteSystem(blank.id);
assert.equal(project.systems.length, 2); checks += 1;
commands.deleteSystem(duplicate.id);
assert.equal(project.systems.length, 1); checks += 1;
assert.throws(() => commands.deleteSystem(first.id), /letzte Anlage/); checks += 1;

console.log(`Phase 34.00 Anlagenmanager: ${checks} Prüfungen bestanden.`);
