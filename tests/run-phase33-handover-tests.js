import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import StorageEngine from '../src/storage/StorageEngine.js';
import ProjectSafetyEngine from '../src/safety/ProjectSafetyEngine.js?v=57.00';
import ProjectCompletionEngine from '../src/closing/ProjectCompletionEngine.js?v=57.00';
import ProjectHandoverEngine, { HANDOVER_FILE_TYPE, HANDOVER_EXTENSION } from '../src/handover/ProjectHandoverEngine.js?v=57.00';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

function prepareProject() {
  const project = createDemoProject();
  project.calculationResult = ProjectCalculationService.calculate(project);
  const system = project.systems[0];
  const protocol = ProjectCompletionEngine.getReviewProtocol(project, system.id);
  ProjectCompletionEngine.saveReviewProtocol(project, system.id, {
    reviewer: 'Prüfer Muster',
    date: '2026-07-16',
    note: 'Fachprüfung vollständig durchgeführt.',
    checks: protocol.checks.map(item => ({ id: item.id, checked: true })),
  });
  ProjectCompletionEngine.captureRevision(project, system.id, {
    revision: project.report.revision,
    date: '2026-07-16',
    author: project.author,
    change: 'Übergabestand Phase 33',
  });
  return { project, system };
}

const storage = createMemoryStorage();
const { project, system } = prepareProject();
let checks = 0;

const initial = ProjectHandoverEngine.analyze(project, system.id, { storage });
assert.equal(initial.coreReady, true); checks += 1;
assert.equal(initial.canExport, true); checks += 1;
assert.equal(initial.approval.status, 'draft'); checks += 1;
assert.ok(initial.items.some(item => item.id === 'revision' && item.status === 'ok')); checks += 1;
assert.ok(initial.items.some(item => item.id === 'review' && item.status === 'ok')); checks += 1;

const released = ProjectHandoverEngine.saveApproval(project, system.id, {
  status: 'released',
  preparedBy: 'Planer Muster',
  checkedBy: 'Prüfer Muster',
  releasedBy: 'Projektleitung Muster',
  note: 'Zur Projektübergabe freigegeben.',
}, { storage });
assert.equal(released.status, 'released'); checks += 1;
assert.ok(released.preparedAt); checks += 1;
assert.ok(released.checkedAt); checks += 1;
assert.ok(released.releasedAt); checks += 1;

const releasedAnalysis = ProjectHandoverEngine.analyze(project, system.id, { storage });
assert.equal(releasedAnalysis.status, 'released'); checks += 1;
assert.equal(releasedAnalysis.coreReady, true); checks += 1;

const packageData = ProjectHandoverEngine.createPackage(project, { system, storage, analysis: releasedAnalysis });
assert.equal(packageData.fileType, HANDOVER_FILE_TYPE); checks += 1;
assert.equal(packageData.status, 'released'); checks += 1;
assert.equal(packageData.approval.releasedBy, 'Projektleitung Muster'); checks += 1;
assert.ok(packageData.checksum); checks += 1;
assert.equal(packageData.manifest.counts.sections, system.sections.length); checks += 1;

const serializedPackage = ProjectHandoverEngine.serializePackage(packageData);
const parsedPackage = ProjectHandoverEngine.parsePackage(serializedPackage);
assert.equal(parsedPackage.project.name, project.name); checks += 1;
assert.equal(parsedPackage.package.checksum, packageData.checksum); checks += 1;
assert.equal(parsedPackage.project.handover.systems[system.id].status, 'released'); checks += 1;

const tampered = JSON.parse(serializedPackage);
tampered.projectName = 'Manipuliert';
assert.throws(() => ProjectHandoverEngine.parsePackage(tampered), /Prüfsumme/); checks += 1;

const dvpText = StorageEngine.serialize(project);
const dvpPreview = ProjectHandoverEngine.inspectInput(dvpText, { fileName: 'Demo.dvp', currentProject: project, storage });
assert.equal(dvpPreview.sourceType, 'project'); checks += 1;
assert.equal(dvpPreview.comparison.sameChecksum, true); checks += 1;
assert.equal(dvpPreview.canImport, true); checks += 1;
assert.equal(dvpPreview.counts.sections, system.sections.length); checks += 1;

const archive = ProjectSafetyEngine.createArchive(project, { system, storage });
const archivePreview = ProjectHandoverEngine.inspectInput(archive, { fileName: 'Demo.dvpa', currentProject: project, storage });
assert.equal(archivePreview.sourceType, 'archive'); checks += 1;
assert.equal(archivePreview.projectName, project.name); checks += 1;

const handoverPreview = ProjectHandoverEngine.inspectInput(packageData, { fileName: 'Demo.dvph', currentProject: project, storage });
assert.equal(handoverPreview.sourceType, 'handover'); checks += 1;
assert.equal(handoverPreview.analysis.status, 'released'); checks += 1;
assert.equal(handoverPreview.comparison.sameProjectId, true); checks += 1;

const protocol = ProjectHandoverEngine.toProtocolCsv(project, system.id, { storage });
assert.match(protocol, /Übergabeprotokoll/); checks += 1;
assert.match(protocol, /Projektleitung Muster/); checks += 1;
assert.match(protocol, /Projekt-Prüfsumme/); checks += 1;
assert.ok(ProjectHandoverEngine.createPackageFileName(project).endsWith(HANDOVER_EXTENSION)); checks += 1;

console.log(`Phase 33 Handover: ${checks} Prüfungen bestanden.`);
