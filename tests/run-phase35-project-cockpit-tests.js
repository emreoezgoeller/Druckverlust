import assert from 'node:assert/strict';
import ApplicationState from '../src/app/ApplicationState.js';
import ProjectCommands from '../src/app/ProjectCommands.js';
import createDemoProject from '../src/project/demoProject.js';
import ProjectPortfolioQualityEngine from '../src/project/ProjectPortfolioQualityEngine.js?v=58.00';
import StorageEngine from '../src/storage/StorageEngine.js';

let checks = 0;
const project = createDemoProject();
project.projectNumber = 'P-3500';
project.name = 'Projektcockpit Test';
project.object = 'Testobjekt';
project.author = 'Fachplanung';
project.company = 'Engineering AG';
project.report = { ...(project.report || {}), number: 'DP-3500', revision: 'A' };

const state = new ApplicationState();
state.setProject(project);
const commands = new ProjectCommands(state);
const first = project.systems[0];
first.name = 'Zuluft Hauptanlage';
first.type = 'Zuluft';
first.bkpNumber = '244.1';

const second = commands.duplicateSystem(first.id);
second.name = 'Abluft Hauptanlage';
second.type = 'Abluft';
second.bkpNumber = '244.2';
second.sections.forEach(section => { section.q = Number(section.q || 0) * 0.8; });

const blank = commands.addSystem();
blank.name = 'Fortluft Reserve';
blank.type = 'Fortluft';
blank.bkpNumber = '244.3';

const analysis = ProjectPortfolioQualityEngine.analyze(project, { selectedSystemId: second.id });
assert.equal(analysis.rows.length, 3); checks += 1;
assert.equal(analysis.summary.systems, 3); checks += 1;
assert.ok(analysis.summary.sections >= first.sections.length * 2); checks += 1;
assert.ok(analysis.rows.some(row => row.id === second.id && row.active)); checks += 1;
assert.ok(analysis.rows.some(row => row.id === blank.id && row.sections === 0)); checks += 1;
assert.ok(analysis.findings.some(item => item.code === 'SYSTEM_EMPTY' && item.systemId === blank.id)); checks += 1;
assert.ok(analysis.typeSummary.some(item => item.type === 'Zuluft')); checks += 1;
assert.ok(analysis.typeSummary.some(item => item.type === 'Abluft')); checks += 1;
assert.ok(analysis.typeSummary.some(item => item.type === 'Fortluft')); checks += 1;
assert.equal(analysis.metadata.projectNumber, 'P-3500'); checks += 1;
assert.equal(analysis.documentationScore, 100); checks += 1;
assert.ok(Number.isFinite(analysis.score)); checks += 1;
assert.ok(['ready', 'review', 'blocked'].includes(analysis.readiness)); checks += 1;
assert.ok(analysis.counts.warning >= 1); checks += 1;
assert.match(analysis.disclaimer, /Herstellerneutrale/); checks += 1;

const csv = ProjectPortfolioQualityEngine.createCsv(project, analysis);
assert.match(csv, /Projektcockpit und projektweite QS/); checks += 1;
assert.match(csv, /Zuluft Hauptanlage/); checks += 1;
assert.match(csv, /Abluft Hauptanlage/); checks += 1;
assert.match(csv, /Fortluft Reserve/); checks += 1;
assert.match(csv, /SYSTEM_EMPTY/); checks += 1;
assert.match(ProjectPortfolioQualityEngine.createCsvFileName(project), /Projektcockpit/); checks += 1;

second.bkpNumber = '244.1';
second.name = first.name;
const duplicateAnalysis = ProjectPortfolioQualityEngine.analyze(project);
assert.ok(duplicateAnalysis.findings.some(item => item.code === 'DUPLICATE_BKP')); checks += 1;
assert.ok(duplicateAnalysis.findings.some(item => item.code === 'DUPLICATE_SYSTEM_NAME')); checks += 1;

project.object = '';
project.report.number = '';
const incomplete = ProjectPortfolioQualityEngine.analyze(project);
assert.ok(incomplete.documentationScore < 100); checks += 1;
assert.ok(incomplete.findings.some(item => item.code === 'META_OBJECT_MISSING')); checks += 1;
assert.ok(incomplete.findings.some(item => item.code === 'META_REPORTNUMBER_MISSING')); checks += 1;

const restored = StorageEngine.parse(StorageEngine.serialize(project));
const restoredAnalysis = ProjectPortfolioQualityEngine.analyze(restored);
assert.equal(restoredAnalysis.rows.length, 3); checks += 1;
assert.ok(restoredAnalysis.findings.length > 0); checks += 1;

console.log(`Phase 35.00 Projektcockpit: ${checks} Prüfungen bestanden.`);
