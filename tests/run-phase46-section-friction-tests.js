import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateSection } from '../src/core/CalculationEngine.js';
import {
  DEFAULT_ROUGHNESS_MM,
  calcDarcyFrictionFactor,
  calcReynoldsNumber,
} from '../src/core/FrictionFactorEngine.js';
import createDefaultProject from '../src/project/defaultProject.js';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectTableImportEngine from '../src/import/ProjectTableImportEngine.js';
import StorageEngine, { PROJECT_FILE_SCHEMA_VERSION } from '../src/storage/StorageEngine.js';
import ReportEngine from '../src/report/ReportEngine.js';
import { createDefaultFormPartRegistry } from '../src/formteile/FormPartRegistry.js';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const equal = (actual, expected, message) => {
  assert.equal(actual, expected, message);
  checks += 1;
};
const close = (actual, expected, tolerance, message) => {
  assert.ok(Math.abs(Number(actual) - Number(expected)) <= tolerance, `${message}: ${actual} statt ${expected}`);
  checks += 1;
};

close(DEFAULT_ROUGHNESS_MM, 0.15, 1e-12, 'Standard-Rauigkeit beträgt 0,15 mm.');

const duct = calculateSection({
  id: 'duct', type: 'duct', q: 1800, l: 10, b: 0.6, h: 0.4, roughnessMm: 0.15,
});
const pipe = calculateSection({
  id: 'pipe', type: 'pipe', q: 1800, l: 10, d: 0.5, roughnessMm: 0.15,
});

close(duct.roughnessMm, 0.15, 1e-12, 'Kanal übernimmt k = 0,15 mm.');
close(pipe.roughnessMm, 0.15, 1e-12, 'Rohr übernimmt k = 0,15 mm.');
check(duct.reynoldsNumber > 0 && pipe.reynoldsNumber > 0, 'Reynolds-Zahlen werden je Teilstrecke berechnet.');
check(duct.frictionFactor > 0 && pipe.frictionFactor > 0, 'Darcy-Reibungszahlen werden berechnet.');
check(Math.abs(duct.frictionFactor - pipe.frictionFactor) > 1e-5, 'Kanal und Rohr erhalten aufgrund ihrer Geometrie unterschiedliche λ-Werte.');
check(duct.hydraulicDiameter !== pipe.hydraulicDiameter, 'Kanal und Rohr verwenden unterschiedliche charakteristische Durchmesser.');
check(duct.frictionRate > 0 && pipe.frictionRate > 0, 'Reibungsgefälle wird für beide Bauformen berechnet.');

const smooth = calculateSection({
  id: 'smooth', type: 'pipe', q: 1800, l: 10, d: 0.5, roughnessMm: 0.03,
});
const rough = calculateSection({
  id: 'rough', type: 'pipe', q: 1800, l: 10, d: 0.5, roughnessMm: 0.8,
});
check(rough.frictionFactor > smooth.frictionFactor, 'Höhere Rauigkeit erhöht λ bei gleicher Teilstrecke.');
check(rough.frictionLoss > smooth.frictionLoss, 'Höhere Rauigkeit erhöht den Reibungsverlust.');

const defaulted = calculateSection({ id: 'defaulted', type: 'pipe', q: 900, l: 5, d: 0.315 });
close(defaulted.roughnessMm, 0.15, 1e-12, 'Fehlende Rauigkeit wird mit 0,15 mm ergänzt.');

const fixed = calculateSection(
  { id: 'legacy', type: 'pipe', q: 900, l: 5, d: 0.315 },
  { settings: { frictionFactorMode: 'fixed', lambda: 0.025 } },
);
close(fixed.frictionFactor, 0.025, 1e-12, 'Expliziter Legacy-Referenzmodus bleibt für alte Fachtests verfügbar.');
equal(fixed.flowRegime, 'fixed', 'Legacy-Referenzmodus wird gekennzeichnet.');

const factorData = calcDarcyFrictionFactor({
  velocityMs: 5,
  characteristicDiameterM: 0.4,
  roughnessMm: 0.15,
});
check(factorData.frictionFactor > 0.01 && factorData.frictionFactor < 0.08, 'Colebrook-Ergebnis liegt im plausiblen Darcy-Bereich.');
close(
  factorData.reynoldsNumber,
  calcReynoldsNumber(5, 0.4),
  1e-8,
  'FrictionFactorEngine verwendet dieselbe Reynolds-Zahl.',
);

const defaultProject = createDefaultProject({ projectId: 'phase46-default', systemId: 'phase46-system' });
check(defaultProject.systems[0].sections.every(section => section.roughnessMm === 0.15), 'Alle Standard-Teilstrecken starten mit k = 0,15 mm.');
equal(defaultProject.settings.defaultRoughnessMm, 0.15, 'Projektstandard ist k = 0,15 mm.');

const oldRawProject = {
  id: 'legacy-project',
  name: 'Legacy',
  settings: { rho: 1.21, lambda: 0.025 },
  systems: [{
    id: 'legacy-system',
    name: 'Zuluft',
    sections: [{ id: 'legacy-ts', name: 'ts1', type: 'duct', q: 1000, l: 5, b: 0.5, h: 0.3 }],
    formParts: [{ id: 'legacy-fp', name: 'Bogen', type: 'kreis_bogen', sectionId: 'legacy-ts', zeta: 0.2 }],
    specialComponents: [],
  }],
};
const migrated = StorageEngine.parse(JSON.stringify(oldRawProject), { fileName: 'legacy.dvp' });
equal(PROJECT_FILE_SCHEMA_VERSION, '1.2.0', 'Projektschema ist 1.2.0.');
close(migrated.systems[0].sections[0].roughnessMm, 0.15, 1e-12, 'Altprojekt erhält k = 0,15 mm je Teilstrecke.');
check(!('lambda' in migrated.settings), 'Alter globaler λ-Wert wird nicht mehr als aktive Einstellung geführt.');
check(!('legacyLambda' in migrated.settings), 'Alter globaler λ-Wert wird auch nicht als versteckte Projekteinstellung gespeichert.');
check(Number.isFinite(migrated.systems[0].formParts[0].sectionFrictionFactor), 'Formteil erhält λ von der zugeordneten Teilstrecke.');
close(migrated.systems[0].formParts[0].sectionRoughnessMm, 0.15, 1e-12, 'Formteil erhält k von der zugeordneten Teilstrecke.');
equal(migrated.systems[0].formParts[0].frictionSourceSectionId, 'legacy-ts', 'Formteil dokumentiert die Quell-Teilstrecke.');

migrated.systems[0].sections[0].roughnessMm = 0.45;
const roundtrip = StorageEngine.parse(StorageEngine.serialize(migrated), { fileName: 'roundtrip.dvp' });
close(roundtrip.systems[0].sections[0].roughnessMm, 0.45, 1e-12, 'Individuelle Rauigkeit bleibt im .dvp-Roundtrip erhalten.');
close(roundtrip.systems[0].formParts[0].sectionRoughnessMm, 0.45, 1e-12, 'Formteil-Synchronwert wird beim Speichern aktualisiert.');
check(roundtrip.systems[0].formParts[0].sectionFrictionFactor > 0, 'Formteil-Synchronwert λ bleibt nach erneutem Öffnen vorhanden.');

const importWithoutK = ProjectTableImportEngine.createPreview(
  'TS\tTyp\tq\tl\tb\th\td\nT1\tKanal\t1000\t5\t500\t300\t',
  { system: { id: 'import', sections: [], formParts: [], specialComponents: [] }, mode: 'append' },
);
check(importWithoutK.canApply, 'Import ohne Rauigkeit bleibt möglich.');
close(importWithoutK.rows[0].section.roughnessMm, 0.15, 1e-12, 'Import ohne k ergänzt 0,15 mm.');
check(importWithoutK.rows[0].issues.some(issue => issue.code === 'ROUGHNESS_DEFAULT'), 'Import weist auf ergänzten Standardwert hin.');

const importWithK = ProjectTableImportEngine.createPreview(
  'TS;Typ;q;l;b;h;d;Rauigkeit k [mm];Beschreibung\nT2;Rohr;1000;5;;;400;0,35;Test',
  { system: { id: 'import2', sections: [], formParts: [], specialComponents: [] }, mode: 'append' },
);
check(importWithK.canApply, 'Import mit individueller Rauigkeit ist gültig.');
close(importWithK.rows[0].section.roughnessMm, 0.35, 1e-12, 'Individuelle Rauigkeit wird importiert.');

const exportProject = createDefaultProject({ projectId: 'export-project', systemId: 'export-system' });
exportProject.systems[0].sections[0].roughnessMm = 0.27;
const exportedTable = ProjectTableImportEngine.serializeSystem(exportProject.systems[0], { delimiter: ';' });
check(exportedTable.split('\r\n')[0].includes('Rauigkeit k [mm]'), 'Teilstreckenexport enthält Rauigkeitsspalte.');
check(exportedTable.split('\r\n')[1].includes(';0.27;'), 'Teilstreckenexport enthält individuellen k-Wert.');
const exportedPreview = ProjectTableImportEngine.createPreview(exportedTable, {
  system: { id: 'export-target', sections: [], formParts: [], specialComponents: [] },
  mode: 'append',
});
close(exportedPreview.rows[0].section.roughnessMm, 0.27, 1e-12, 'Tabellen-Roundtrip erhält individuellen k-Wert.');

const reportProject = createDemoProject();
const reportSystem = reportProject.systems[0];
reportSystem.sections[0].roughnessMm = 0.31;
reportProject.calculationResult = ProjectCalculationService.calculate(reportProject, reportSystem.id);
const reportModel = ReportEngine.createReportModel(reportProject, {
  system: reportSystem,
  registry: createDefaultFormPartRegistry(),
});
close(reportModel.sections[0].roughnessMm, 0.31, 1e-12, 'Berichtmodell enthält k je Teilstrecke.');
check(reportModel.sections[0].frictionFactor > 0, 'Berichtmodell enthält automatisch berechnetes λ.');
check(reportModel.sections[0].reynoldsNumber > 0, 'Berichtmodell enthält Reynolds-Zahl.');
const reportHtml = ReportEngine.renderReportBody(reportModel);
check(reportHtml.includes('Rauigkeit') && reportHtml.includes('Darcy-Reibungszahl'), 'Professional Report erklärt k und λ.');
check(reportHtml.includes('Von Teilstrecke übernommen'), 'Formteilbericht dokumentiert die Übernahme von k, λ und Re.');
const reportCsv = ReportEngine.createCsv(reportModel);
check(reportCsv.includes('Rauigkeit k mm'), 'Berichts-CSV enthält k.');
check(reportCsv.includes('Reibungszahl Lambda'), 'Berichts-CSV enthält λ.');

const workspace = fs.readFileSync(new URL('../src/ui/components/WorkspaceComponent.js', import.meta.url), 'utf8');
check(workspace.includes('data-field="roughnessMm"'), 'Teilstreckeneditor enthält manuelle Rauigkeitseingabe.');
check(workspace.includes('data-section-quick-field="roughnessMm"'), 'Schnellerfassung enthält Rauigkeit je Teilstrecke.');
check(!workspace.includes('data-report-setting="lambda"'), 'Berichtseinstellungen enthalten keinen globalen λ-Eingabewert mehr.');
check(workspace.includes('Übernommene Reibungszahl λ'), 'Formteildetails zeigen übernommenes λ.');

console.log(`Phase 46.00 Teilstrecken-Reibung: ${checks} Prüfungen bestanden.`);
