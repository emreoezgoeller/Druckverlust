import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import { createDefaultFormPartRegistry } from '../src/formteile/FormPartRegistry.js';
import ReportEngine from '../src/report/ReportEngine.js';

const project = createDemoProject();
const system = project.systems[0];
project.calculationResult = ProjectCalculationService.calculate(project, system.id);
project.reportOptions = {
  includeToc: true,
  includeExecutiveSummary: true,
  includeNetworkSchematic: true,
  includeLossAnalysis: true,
  includeEngineeringQuality: true,
  includeMainNetwork: true,
  includeAssignedFormParts: true,
  includeSpecialComponents: true,
  includeSummary: true,
  includeQualityProtocol: true,
  includeFormPartCatalog: true,
  includeApproval: true,
  includeInfo: true,
};

const model = ReportEngine.createReportModel(project, {
  system,
  registry: createDefaultFormPartRegistry(),
});
assert.ok(model.engineeringQuality, 'Berichtmodell enthält die Engineering-QS.');
assert.ok(Number.isFinite(model.engineeringQuality.score), 'Engineering-Score ist numerisch.');
assert.equal(model.networkSchematic.nodes.length, system.sections.length, 'Anlagenschema enthält alle Teilstrecken.');
assert.equal(model.lossAnalytics.rankedSections.length, model.sections.length, 'Verlustanalyse enthält alle berichtsrelevanten Teilstrecken.');
assert.equal(model.lossAnalytics.breakdown.length, 3, 'Verlustanalyse trennt drei Verlustgruppen.');

const plan = ReportEngine.createPagePlan(model);
for (const key of ['executiveSummary', 'networkSchematic', 'lossAnalysis', 'engineeringQuality']) {
  assert.ok(plan.entries.some(entry => entry.key === key), `Seitenplan enthält ${key}.`);
}

const html = ReportEngine.renderReportBody(model);
assert.match(html, /Management-Zusammenfassung/, 'Management-Zusammenfassung wird gerendert.');
assert.match(html, /report-schematic-svg/, 'Anlagenschema wird als SVG gerendert.');
assert.match(html, /Druckverlustanalyse/, 'Druckverlustanalyse wird gerendert.');
assert.match(html, /Engineering-QS/, 'Engineering-QS wird gerendert.');
const renderedPages = (html.match(/<section class="report-page/g) || []).length;
assert.equal(renderedPages, plan.totalPages, 'Gerenderte Seitenzahl entspricht dem Seitenplan.');

const csv = ReportEngine.createCsv(model);
assert.match(csv, /Engineering Score/, 'CSV enthält den Engineering-Score.');
assert.match(csv, /Engineering-QS/, 'CSV enthält die Engineering-Feststellungen.');

console.log(`Professional Report: ${plan.totalPages} Seiten, Engineering-QS, Schema und Verlustanalyse geprüft.`);
