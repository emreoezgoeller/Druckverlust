// Druckverlust Pro – Phase 51.10
// Prüft die sechs neuen Krümmerabzweige/Krümmerendstücke gegen Excel,
// automatische Teilstrecken-Synchronisation, negative ζ-Werte und Fehlerfälle.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultFormPartRegistry } from '../src/formteile/FormPartRegistry.js';
import {
  calculateKruemmerabzweig1Abzweig,
  calculateKruemmerabzweig1Durchgang,
  calculateKruemmerabzweig2Abzweig,
  calculateKruemmerabzweig2Durchgang,
  calculateKruemmerendstueck1,
  calculateKruemmerendstueck2,
} from '../src/formteile/calculators/kruemmerFormteileCalculator.js';
import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const registry = createDefaultFormPartRegistry();
const checks = [];

function normalize(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Number(value.toPrecision(12))
    : value;
}

function check(label, actual, expected, tolerance = null) {
  const passed = tolerance === null
    ? Object.is(normalize(actual), normalize(expected))
    : Math.abs(Number(actual) - Number(expected)) <= tolerance;

  checks.push({ label, actual, expected, tolerance, passed });
}

function truthy(label, actual) {
  checks.push({ label, actual: Boolean(actual), expected: true, tolerance: null, passed: Boolean(actual) });
}

function sampleValues(overrides = {}) {
  return {
    W: 1000,
    WD: 600,
    WA: 400,
    w: 2,
    wD: 1.6,
    wA: 1.2,
    A_area: 1,
    AD_area: 0.5,
    AA_area: 0.5,
    AA_AD: 1,
    AD_A: 0.5,
    AA_A: 0.5,
    wA_w: 0.6,
    wD_w: 0.8,
    ...overrides,
  };
}

const ids = [
  'kruemmerabzweig_1_abzweig',
  'kruemmerabzweig_1_durchgang',
  'kruemmerabzweig_2_abzweig',
  'kruemmerabzweig_2_durchgang',
  'kruemmerendstueck_1',
  'kruemmerendstueck_2',
];

const directCalculators = {
  kruemmerabzweig_1_abzweig: calculateKruemmerabzweig1Abzweig,
  kruemmerabzweig_1_durchgang: calculateKruemmerabzweig1Durchgang,
  kruemmerabzweig_2_abzweig: calculateKruemmerabzweig2Abzweig,
  kruemmerabzweig_2_durchgang: calculateKruemmerabzweig2Durchgang,
  kruemmerendstueck_1: calculateKruemmerendstueck1,
  kruemmerendstueck_2: calculateKruemmerendstueck2,
};

check('Formteilbibliothek enthält 21 Einträge', registry.all().length, 21);

for (const id of ids) {
  const entry = registry.get(id);
  truthy(`${id}: Registry-Eintrag vorhanden`, entry);
  truthy(`${id}: Calculator vorhanden`, typeof entry?.calculate === 'function');
  truthy(`${id}: PNG vorhanden`, fs.existsSync(path.join(root, entry?.image || '')));
  truthy(`${id}: Excel vorhanden`, fs.existsSync(path.join(root, entry?.referenceFile || '')));
}

const excelCases = [
  ['kruemmerabzweig_1_abzweig', sampleValues(), 1, 'wA'],
  ['kruemmerabzweig_1_durchgang', sampleValues(), 0.06, 'wD'],
  ['kruemmerabzweig_2_abzweig', sampleValues(), -2.9, 'wA'],
  ['kruemmerabzweig_2_durchgang', sampleValues(), 0, 'wD'],
  ['kruemmerendstueck_1', { W: 1000, WA: 1000, w: 2, wA: 1.4, A_area: 1, AA_area: 1, a_b: 1, wA_w: 0.7 }, 0.49, 'wA'],
  ['kruemmerendstueck_2', { W: 1000, WA: 1000, w: 2, wA: 1, A_area: 1, AA_area: 1, wA_w: 0.5 }, 0.28, 'wA'],
];

for (const [id, input, expectedZeta, pressureReference] of excelCases) {
  // Direkter Calculator-Aufruf: Die Werte entsprechen bereits exakt den
  // abgeleiteten Excel-Eingaben. Der Registry-Aufruf leitet diese Werte aus
  // den Rohabmessungen neu ab und wird separat im Workspace-Test geprüft.
  const result = directCalculators[id](input);
  check(`${id}: Excel-ζ`, result.zeta, expectedZeta, 1e-12);
  check(`${id}: Bezugsdruck`, result.calculation.pressureReference, pressureReference);
  check(`${id}: Direktdruckverlust-Modus`, result.calculation.lossMode, 'direct');
}

const floorResult = calculateKruemmerabzweig1Abzweig(sampleValues({ wA_w: 0.65, wA: 1.3 }));
check('Krümmerabzweig 1: 0.65 verwendet nächst kleineren Wert 0.6', floorResult.calculation.ratioLookup, 0.6, 1e-12);
check('Krümmerabzweig 1: ζ aus Spalte 0.6', floorResult.zeta, 1, 1e-12);

const negativeResult = calculateKruemmerabzweig2Abzweig(sampleValues());
truthy('Negative ζ-Werte bleiben negativ', negativeResult.zeta < 0 && negativeResult.calculation.pressureLossPa < 0);

const mismatch = calculateKruemmerabzweig1Abzweig(sampleValues({ AA_AD: 0.8, AD_A: 0.7, AA_A: 0.56 }));
check('Nicht enthaltene Geometrie wird nicht erfunden', mismatch.zeta, 0);
truthy('Geometrieabweichung erzeugt verständliche Warnung', mismatch.warnings.some(message => String(message).includes('nicht enthalten')));

const belowMinimum = calculateKruemmerabzweig1Abzweig(sampleValues({ wA_w: 0.05, wA: 0.1 }));
check('Unterhalb der kleinsten Excel-Spalte wird kein Wert erfunden', belowMinimum.zeta, 0);
truthy('Fehlender nächst kleinerer Tabellenwert wird verständlich gemeldet', belowMinimum.warnings.some(message => String(message).includes('kein nächst kleinerer Tabellenwert')));

function createWorkspaceHarness() {
  const sections = [
    { id: 'main', name: 'Hauptkanal', type: 'duct', q: 1800, l: 4, b: 0.6, h: 0.3, roughnessMm: 0.15 },
    { id: 'through', name: 'Gerader Anschluss', type: 'duct', q: 1260, l: 3, b: 0.6, h: 0.3, roughnessMm: 0.15 },
    { id: 'branch', name: 'Krümmeranschluss', type: 'duct', q: 540, l: 2, b: 0.6, h: 0.15, roughnessMm: 0.15 },
    { id: 'end-main', name: 'Endstück Haupt', type: 'duct', q: 1800, l: 2, b: 0.5, h: 0.5, roughnessMm: 0.15 },
    { id: 'end-other', name: 'Endstück Anschluss', type: 'duct', q: 1260, l: 2, b: 0.5, h: 0.5, roughnessMm: 0.15 },
  ];
  const system = { id: 'system', name: 'Test', sections, formParts: [], specialComponents: [] };
  const workspace = Object.create(WorkspaceComponent.prototype);
  workspace.state = { project: { systems: [system], settings: {} }, selectedSystem: system };
  workspace.registry = registry;
  return { workspace, system };
}

const { workspace, system } = createWorkspaceHarness();
const branchPart = {
  id: 'fp-branch',
  name: 'Krümmerabzweig',
  type: 'kruemmerabzweig_1_abzweig',
  sectionId: 'main',
  throughSectionId: 'through',
  branchSectionId: 'branch',
};
system.formParts.push(branchPart);
workspace.applyFormPartDefaults(branchPart);
truthy('Krümmerabzweig: Hauptgrösse wird übernommen', workspace.applySectionDimensionsToFormPart(branchPart, { force: true }).applied);
truthy('Krümmerabzweig: Zusatzanschlüsse werden übernommen', workspace.applyConnectionSectionsToFormPart(branchPart, { force: true }).applied);
workspace.deriveAndStoreFormPart(branchPart);
const branchCalculation = workspace.calculateAndStoreFormPart(branchPart);
check('Krümmerabzweig: A-Breite aus Haupt-TS', branchPart.A_breite, 600);
check('Krümmerabzweig: AD-Höhe aus Durchgangs-TS', branchPart.AD_hoehe, 300);
check('Krümmerabzweig: AA-Höhe aus Krümmer-TS', branchPart.AA_hoehe, 150);
check('Krümmerabzweig: AA/AD automatisch', branchPart.AA_AD, 0.5, 1e-12);
check('Krümmerabzweig: AD/A automatisch', branchPart.AD_A, 1, 1e-12);
check('Krümmerabzweig: AA/A automatisch', branchPart.AA_A, 0.5, 1e-12);
check('Krümmerabzweig: wA/w automatisch', branchPart.wA_w, 0.6, 1e-12);
check('Krümmerabzweig: berechnetes ζ', branchCalculation.zeta, 1.1, 1e-12);
check('Krümmerabzweig: Anschlussziele AD und AA', workspace.getFormPartConnectionDefinitions(branchPart).map(item => item.target).sort().join(','), 'AA,AD');

const endPart = {
  id: 'fp-end',
  name: 'Krümmerendstück',
  type: 'kruemmerendstueck_1',
  sectionId: 'end-main',
  branchSectionId: 'end-other',
};
system.formParts.push(endPart);
workspace.applyFormPartDefaults(endPart);
workspace.applySectionDimensionsToFormPart(endPart, { force: true });
workspace.applyConnectionSectionsToFormPart(endPart, { force: true });
workspace.deriveAndStoreFormPart(endPart);
const endCalculation = workspace.calculateAndStoreFormPart(endPart);
check('Krümmerendstück: a/b automatisch', endPart.a_b, 1, 1e-12);
check('Krümmerendstück: wA/w automatisch', endPart.wA_w, 0.7, 1e-12);
check('Krümmerendstück: Excel-ζ aus synchronisierten Teilstrecken', endCalculation.zeta, 0.49, 1e-12);
truthy('Krümmerendstück: Anschlusslabel ist Ausgang', workspace.getFormPartConnectionDefinitions(endPart)[0]?.label.includes('Ausgang'));

const failed = checks.filter(item => !item.passed);
console.log('Druckverlust Pro – Phase 51.10 – sechs neue Formteile');
console.log(`${checks.length - failed.length}/${checks.length} Prüfungen bestanden.`);

for (const item of failed) {
  console.error(`FEHLER: ${item.label}`);
  console.error(`  Ist: ${item.actual}`);
  console.error(`  Soll: ${item.expected}${item.tolerance !== null ? ` ± ${item.tolerance}` : ''}`);
}

if (failed.length) process.exit(1);
