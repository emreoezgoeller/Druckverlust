import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import EngineeringQualityEngine from '../src/quality/EngineeringQualityEngine.js?v=57.00';
import ProjectStandardizationEngine from '../src/project/ProjectStandardizationEngine.js?v=57.00';
import StorageEngine from '../src/storage/StorageEngine.js';
import ReportEngine from '../src/report/ReportEngine.js?v=57.00';

let checks = 0;
const project = createDemoProject();
project.name = 'Phase 36 Testprojekt';
project.object = 'Projektstandardisierung';
project.author = 'Fachplaner';
project.company = 'Engineering AG';
const system = project.systems[0];

const profiles = ProjectStandardizationEngine.getProfiles();
assert.equal(profiles.length, 3); checks += 1;
assert.ok(profiles.some(item => item.id === 'general')); checks += 1;
assert.ok(profiles.some(item => item.id === 'comfort')); checks += 1;
assert.ok(profiles.some(item => item.id === 'technical')); checks += 1;
assert.equal(ProjectStandardizationEngine.resolveProfile(project).id, 'general'); checks += 1;
assert.equal(project.workflow, undefined); checks += 1;

const comfort = ProjectStandardizationEngine.applyProfile(project, 'comfort', { actor: 'Prüferin' });
assert.equal(comfort.profile.id, 'comfort'); checks += 1;
assert.equal(comfort.profile.name, 'Komfort / geräuschsensibel'); checks += 1;
assert.equal(comfort.profile.thresholds.velocityWarning, 4); checks += 1;
assert.equal(project.workflow.changeHistory[0].action, 'QUALITY_PROFILE_CHANGED'); checks += 1;
assert.equal(project.workflow.changeHistory[0].actor, 'Prüferin'); checks += 1;

const custom = ProjectStandardizationEngine.applyProfile(project, 'custom', {
  name: 'Objektbezogen',
  actor: 'Emre',
  thresholds: {
    velocityWarning: 8,
    velocityCritical: 7,
    frictionWarning: 2,
    frictionCritical: 1,
    lossShareWarning: 0.7,
    lossShareCritical: 0.6,
    totalLossWarning: 900,
  },
});
assert.equal(custom.profile.id, 'custom'); checks += 1;
assert.equal(custom.profile.name, 'Objektbezogen'); checks += 1;
assert.ok(custom.profile.thresholds.velocityCritical > custom.profile.thresholds.velocityWarning); checks += 1;
assert.ok(custom.profile.thresholds.frictionCritical > custom.profile.thresholds.frictionWarning); checks += 1;
assert.ok(custom.profile.thresholds.lossShareCritical > custom.profile.thresholds.lossShareWarning); checks += 1;
assert.equal(custom.warnings.length, 3); checks += 1;

const beforeSystems = project.systems.length;
const fullTemplate = ProjectStandardizationEngine.applySystemTemplate(project, 'full-air-handling', { actor: 'Emre' });
assert.equal(fullTemplate.added.length, 3); checks += 1;
assert.equal(fullTemplate.skipped.length, 1); checks += 1;
assert.equal(project.systems.length, beforeSystems + 3); checks += 1;
assert.ok(project.systems.some(item => item.type === 'Abluft')); checks += 1;
assert.ok(project.systems.some(item => item.type === 'Aussenluft')); checks += 1;
assert.ok(project.systems.some(item => item.type === 'Fortluft')); checks += 1;
assert.ok(fullTemplate.added.every(item => Array.isArray(item.sections) && item.sections.length === 0)); checks += 1;
assert.equal(ProjectStandardizationEngine.applySystemTemplate(project, 'full-air-handling').added.length, 0); checks += 1;

const original = JSON.parse(JSON.stringify(system.sections));
const preview = ProjectStandardizationEngine.previewBulkEdit(system, {
  scope: 'all',
  airflowPercent: 110,
  lengthPercent: 90,
  dimensionPercent: 125,
  airflowStep: 5,
  lengthStep: 0.1,
  dimensionStep: 0.01,
  actor: 'Emre',
  note: 'Koordinationsvariante',
  renumber: true,
});
assert.equal(preview.affectedCount, 5); checks += 1;
assert.equal(preview.changedCount, 5); checks += 1;
assert.ok(preview.fingerprint.length >= 8); checks += 1;
assert.deepEqual(system.sections, original); checks += 1;
assert.equal(preview.rows[0].after.q, 3520); checks += 1;
assert.equal(preview.rows[0].after.l, 7.7); checks += 1;
assert.equal(preview.rows[0].after.b, 1); checks += 1;
assert.equal(preview.rows[2].after.d, 0.63); checks += 1;

const ductPreview = ProjectStandardizationEngine.previewBulkEdit(system, { scope: 'duct', dimensionPercent: 110 });
assert.equal(ductPreview.affectedCount, 3); checks += 1;
assert.ok(ductPreview.rows.every(row => row.type === 'duct')); checks += 1;
const pipePreview = ProjectStandardizationEngine.previewBulkEdit(system, { scope: 'pipe', dimensionPercent: 110 });
assert.equal(pipePreview.affectedCount, 2); checks += 1;
assert.ok(pipePreview.rows.every(row => row.type === 'pipe')); checks += 1;
const selectedPreview = ProjectStandardizationEngine.previewBulkEdit(system, { scope: 'selected', selectedIds: [system.sections[1].id], airflowPercent: 120 });
assert.equal(selectedPreview.affectedCount, 1); checks += 1;
assert.equal(selectedPreview.rows[0].id, system.sections[1].id); checks += 1;

assert.throws(() => ProjectStandardizationEngine.applyBulkEdit(project, system, preview.options, 'stale-preview'), /nicht mehr aktuell/); checks += 1;
const applied = ProjectStandardizationEngine.applyBulkEdit(project, system, preview.options, preview.fingerprint);
assert.equal(applied.changedCount, 5); checks += 1;
assert.equal(system.sections[0].q, 3520); checks += 1;
assert.equal(system.sections[0].l, 7.7); checks += 1;
assert.equal(system.sections[0].b, 1); checks += 1;
assert.equal(system.sections[2].d, 0.63); checks += 1;
assert.equal(project.workflow.changeHistory[0].action, 'BULK_SECTION_EDIT'); checks += 1;
assert.match(project.workflow.changeHistory[0].summary, /5 von 5/); checks += 1;
assert.equal(project.workflow.changeHistory[0].details.options.note, 'Koordinationsvariante'); checks += 1;

project.calculationResult = ProjectCalculationService.calculate(project, system.id);
const qualityCustom = EngineeringQualityEngine.analyze(project, system, project.calculationResult.calculation);
assert.equal(qualityCustom.profile.name, 'Objektbezogen'); checks += 1;
assert.match(qualityCustom.disclaimer, /Objektbezogen/); checks += 1;

ProjectStandardizationEngine.applyProfile(project, 'comfort');
const qualityComfort = EngineeringQualityEngine.analyze(project, system, project.calculationResult.calculation);
ProjectStandardizationEngine.applyProfile(project, 'technical');
const qualityTechnical = EngineeringQualityEngine.analyze(project, system, project.calculationResult.calculation);
assert.ok(qualityComfort.counts.critical + qualityComfort.counts.warning >= qualityTechnical.counts.critical + qualityTechnical.counts.warning); checks += 1;
assert.equal(qualityTechnical.profile.id, 'technical'); checks += 1;

const csv = ProjectStandardizationEngine.createHistoryCsv(project);
assert.match(csv, /Änderungsprotokoll/); checks += 1;
assert.match(csv, /BULK_SECTION_EDIT/); checks += 1;
assert.match(csv, /QUALITY_PROFILE_CHANGED/); checks += 1;
assert.match(ProjectStandardizationEngine.createHistoryFileName(project), /Aenderungsprotokoll/); checks += 1;

for (let index = 0; index < 70; index += 1) {
  ProjectStandardizationEngine.addHistory(project, { action: 'TEST', title: `Test ${index}`, summary: 'Begrenzung' });
}
assert.equal(ProjectStandardizationEngine.getHistory(project).length, 60); checks += 1;

const serialized = StorageEngine.serialize(project);
const restored = StorageEngine.parse(serialized);
assert.equal(ProjectStandardizationEngine.resolveProfile(restored).id, 'technical'); checks += 1;
assert.equal(ProjectStandardizationEngine.getHistory(restored).length, 60); checks += 1;
assert.equal(restored.systems.length, project.systems.length); checks += 1;

restored.calculationResult = ProjectCalculationService.calculate(restored, restored.systems[0].id);
const reportModel = ReportEngine.createReportModel(restored, { system: restored.systems[0] });
assert.equal(reportModel.projectWorkflow.profile.id, 'technical'); checks += 1;
assert.equal(reportModel.projectWorkflow.changeHistory.length, 60); checks += 1;
const reportCsv = ReportEngine.createCsv(reportModel);
assert.match(reportCsv, /Engineering Pruefprofil[^\r\n]*Technik \/ kurze Netze/); checks += 1;
assert.match(reportCsv, /Aenderungsprotokoll/); checks += 1;

const cleared = ProjectStandardizationEngine.clearHistory(restored, { logClear: false });
assert.equal(cleared, 60); checks += 1;
assert.equal(ProjectStandardizationEngine.getHistory(restored).length, 0); checks += 1;

console.log(`Phase 36.00 Projektstandardisierung: ${checks} Prüfungen bestanden.`);
