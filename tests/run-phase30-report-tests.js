import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import LiveSimulationEngine from '../src/simulation/LiveSimulationEngine.js';
import ProjectCompletionEngine from '../src/closing/ProjectCompletionEngine.js';
import ReportEngine from '../src/report/ReportEngine.js';

let checks = 0;
const match = (value, pattern, message) => { assert.match(value, pattern, message); checks += 1; };
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const project = createDemoProject();
const system = project.systems[0];
project.object = 'Berichtsprojekt';
project.anlageNumber = '244';
project.author = 'Bericht Tester';
project.report = { ...(project.report || {}), reportNumber: 'DP-BERICHT-001', revision: '1', bearbeiter: 'Bericht Tester' };
project.reportOptions = { includeVariantComparison: true };
project.calculationResult = ProjectCalculationService.calculate(project, system.id);

const simulation = LiveSimulationEngine.create(project, system.id, {
  scope: 'all',
  airflowPercent: 115,
  dimensionPercent: 125,
});
ProjectCompletionEngine.saveVariant(project, system.id, simulation, {
  name: 'Berichtsvariante',
  note: 'Vergleich für technischen Nachweis',
  includeInReport: true,
});
ProjectCompletionEngine.captureRevision(project, system.id, {
  revision: '1',
  author: 'Bericht Tester',
  change: 'Variantenvergleich ergänzt',
});

const model = ReportEngine.createReportModel(project, { system });
ok(model.variantComparison, 'Berichtmodell enthält die ausgewählte Variante.');
ok(model.revisionSnapshots.length === 1, 'Berichtmodell enthält den Revisionssnapshot.');
ok(model.variantComparison.rows.length <= 10, 'Variantenseite begrenzt die Detailtabelle auf zehn gut lesbare Teilstrecken.');
const plan = ReportEngine.createPagePlan(model);
ok(plan.entries.some(entry => entry.key === 'variantComparison'), 'Inhaltsverzeichnis plant eine Variantenseite ein.');

const html = ReportEngine.renderReportBody(model);
match(html, /Variantenvergleich/, 'Bericht enthält die Variantenseite.');
match(html, /Berichtsvariante/, 'Name der Variante wird ausgegeben.');
match(html, /Bestand gegenüber Berichtsvariante/, 'Seitentitel beschreibt den Vergleich.');
match(html, /Simulationsparameter/, 'Simulationsparameter werden dokumentiert.');
match(html, /Grösste Änderungen nach Teilstrecke/, 'Teilstreckenvergleich wird ausgegeben.');
match(html, /report-variant-kpis/, 'Varianten-Kennwerte besitzen das Drucklayout.');

const csv = ReportEngine.createCsv(model);
match(csv, /Variantenvergleich/, 'CSV enthält den Variantenvergleich.');
match(csv, /Berichtsvariante/, 'CSV enthält den Variantennamen.');
match(csv, /Variantenvergleich ergänzt/, 'CSV enthält den Revisionsverlauf.');

const projectWithoutVariants = createDemoProject();
projectWithoutVariants.object = 'Projekt ohne Varianten';
projectWithoutVariants.anlageNumber = '244';
projectWithoutVariants.author = 'Bericht Tester';
projectWithoutVariants.report = { ...(projectWithoutVariants.report || {}), reportNumber: 'DP-OHNE-VAR', revision: '0', bearbeiter: 'Bericht Tester' };
projectWithoutVariants.reportOptions = { includeVariantComparison: true };
projectWithoutVariants.calculationResult = ProjectCalculationService.calculate(projectWithoutVariants, projectWithoutVariants.systems[0].id);
const modelWithoutVariants = ReportEngine.createReportModel(projectWithoutVariants, { system: projectWithoutVariants.systems[0] });
const variantChecklistItem = ReportEngine.createExportChecklist(modelWithoutVariants).items.find(item => item.id === 'variant-comparison');
ok(variantChecklistItem?.status === 'ok', 'Ein Projekt ohne gespeicherte Varianten erhält keine unnötige Exportwarnung.');

console.log(`Phase 30.00 Bericht: ${checks} Prüfungen bestanden.`);
