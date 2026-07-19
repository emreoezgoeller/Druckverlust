import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectTaskCenterEngine from '../src/project/ProjectTaskCenterEngine.js?v=38.00';
import ProjectSearchEngine from '../src/project/ProjectSearchEngine.js?v=38.00';
import StorageEngine from '../src/storage/StorageEngine.js';

let checks = 0;
const project = createDemoProject();
project.name = 'Phase 38 Suchprojekt';
project.object = 'Schulhaus Nord';
project.author = 'Emre';
project.company = 'Engineering AG';
const system = project.systems[0];
system.name = 'Zuluft Aula';
system.anlageNumber = '244.10';
project.calculationResult = ProjectCalculationService.calculate(project, system.id);

ProjectTaskCenterEngine.addManualTask(project, {
  title: 'Filterdruckverlust kontrollieren',
  description: 'Wert mit Ausschreibung vergleichen.',
  priority: 'high',
  systemId: system.id,
  sectionId: system.sections[0].id,
});
for (let index = 1; index <= 10; index += 1) {
  ProjectTaskCenterEngine.addManualTask(project, {
    title: `Koordinationspunkt ${index}`,
    description: `Zusätzlicher Suchindex-Eintrag ${index}`,
    priority: 'normal',
    systemId: system.id,
  });
}
project.revisionSnapshots = [{ id: 'rev-a', systemId: system.id, revision: 'A', author: 'Emre', note: 'Vorprojekt', createdAt: '2026-07-16T10:00:00Z' }];
project.simulationVariants = [{ id: 'var-1', systemId: system.id, name: 'Variante 80 Prozent', author: 'Emre', note: 'Reduzierter Volumenstrom', airflowPercent: 80 }];

const index = ProjectSearchEngine.buildIndex(project);
assert.ok(index.length > 10); checks += 1;
assert.ok(index.some(item => item.category === 'project')); checks += 1;
assert.ok(index.some(item => item.category === 'system')); checks += 1;
assert.ok(index.some(item => item.category === 'section')); checks += 1;
assert.ok(index.some(item => item.category === 'formPart')); checks += 1;
assert.ok(index.some(item => item.category === 'specialComponent')); checks += 1;
assert.ok(index.some(item => item.category === 'task')); checks += 1;
assert.ok(index.some(item => item.category === 'revision')); checks += 1;
assert.ok(index.some(item => item.category === 'variant')); checks += 1;

const projectSearch = ProjectSearchEngine.search(project, 'Schulhaus Nord', { index });
assert.equal(projectSearch.results[0].category, 'project'); checks += 1;
assert.match(projectSearch.results[0].title, /Phase 38/); checks += 1;

const systemSearch = ProjectSearchEngine.search(project, 'Zuluft Aula', { index });
assert.equal(systemSearch.results[0].category, 'system'); checks += 1;
assert.equal(systemSearch.results[0].systemId, system.id); checks += 1;

const section = system.sections[0];
const sectionSearch = ProjectSearchEngine.search(project, section.name, { index, category: 'section' });
assert.ok(sectionSearch.results.some(item => item.sectionId === section.id)); checks += 1;
assert.ok(sectionSearch.results.every(item => item.category === 'section')); checks += 1;

const filtered = ProjectSearchEngine.search(project, '', { index, systemId: system.id });
assert.ok(filtered.results.length > 0); checks += 1;
assert.ok(filtered.results.every(item => item.systemId === system.id)); checks += 1;

const taskSearch = ProjectSearchEngine.search(project, 'Filterdruckverlust', { index });
assert.ok(taskSearch.results.some(item => item.category === 'task')); checks += 1;

const revisionSearch = ProjectSearchEngine.search(project, 'Vorprojekt', { index });
assert.ok(revisionSearch.results.some(item => item.category === 'revision')); checks += 1;
const variantSearch = ProjectSearchEngine.search(project, 'Reduzierter Volumenstrom', { index });
assert.ok(variantSearch.results.some(item => item.category === 'variant')); checks += 1;

const sectionDocument = index.find(item => item.category === 'section' && item.sectionId === section.id);
assert.ok(sectionDocument.relations.formParts >= 0); checks += 1;
assert.ok(sectionDocument.relations.specialComponents >= 0); checks += 1;
assert.ok(sectionDocument.relations.tasks >= 1); checks += 1;

ProjectSearchEngine.recordQuery(project, 'Zuluft Aula');
ProjectSearchEngine.recordQuery(project, 'TS 1');
ProjectSearchEngine.recordQuery(project, 'zuluft aula');
assert.equal(ProjectSearchEngine.getRecentQueries(project).length, 2); checks += 1;
assert.equal(ProjectSearchEngine.getRecentQueries(project)[0], 'zuluft aula'); checks += 1;
for (let i = 0; i < 12; i += 1) ProjectSearchEngine.recordQuery(project, `Suche ${i}`);
assert.equal(ProjectSearchEngine.getRecentQueries(project).length, 8); checks += 1;

let pinResult = ProjectSearchEngine.togglePin(project, sectionDocument);
assert.equal(pinResult.pinned, true); checks += 1;
assert.equal(ProjectSearchEngine.isPinned(project, sectionDocument.id), true); checks += 1;
assert.equal(ProjectSearchEngine.getPins(project, index)[0].document.sectionId, section.id); checks += 1;
pinResult = ProjectSearchEngine.togglePin(project, sectionDocument);
assert.equal(pinResult.pinned, false); checks += 1;
assert.equal(ProjectSearchEngine.isPinned(project, sectionDocument.id), false); checks += 1;

for (const item of index.slice(0, 30)) ProjectSearchEngine.togglePin(project, item);
assert.equal(ProjectSearchEngine.getPins(project, index).length, 24); checks += 1;

const csv = ProjectSearchEngine.createIndexCsv(project);
assert.match(csv, /Kategorie;Typ;Bezeichnung/); checks += 1;
assert.match(csv, /Zuluft Aula/); checks += 1;
assert.match(csv, /Teilstrecke/); checks += 1;
assert.match(csv, /Revision/); checks += 1;

const serialized = StorageEngine.serialize(project);
const restored = StorageEngine.parse(serialized);
assert.equal(restored.workflow.projectSearch.recentQueries.length, 8); checks += 1;
assert.equal(restored.workflow.projectSearch.pins.length, 24); checks += 1;
const restoredIndex = ProjectSearchEngine.buildIndex(restored);
assert.ok(ProjectSearchEngine.search(restored, 'Filterdruckverlust', { index: restoredIndex }).results.length > 0); checks += 1;
ProjectSearchEngine.clearRecentQueries(restored);
assert.equal(ProjectSearchEngine.getRecentQueries(restored).length, 0); checks += 1;

assert.equal(ProjectSearchEngine.categoryLabel('specialComponent'), 'Sonderbauteil'); checks += 1;
assert.equal(ProjectSearchEngine.search(project, 'nicht vorhandener xyz begriff', { index }).totalMatches, 0); checks += 1;

console.log(`Phase 38.00 Projektsuche/Index: ${checks} Prüfungen bestanden.`);
