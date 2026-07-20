#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateFreierZetaWert } from '../src/formteile/calculators/freierZetaWertCalculator.js';
import { createDefaultFormPartRegistry } from '../src/formteile/FormPartRegistry.js';
import createDefaultProject from '../src/project/defaultProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ReportEngine from '../src/report/ReportEngine.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const close = (actual, expected, tolerance, message) => {
  assert.ok(Math.abs(Number(actual) - Number(expected)) <= tolerance, `${message}: ${actual} statt ${expected}`);
  checks += 1;
};

const result = calculateFreierZetaWert({ zeta: '0.35' });
close(result.zeta, 0.35, 1e-12, 'Manueller ζ-Wert wird unverändert übernommen.');
equal(result.calculation.inputMode, 'manual-zeta', 'Manueller Eingabemodus ist dokumentiert.');
equal(result.calculation.pressureReference, 'Teilstrecke', 'Dynamischer Druck stammt aus der Teilstrecke.');
check(result.calculation.formula.includes('ζ × p_dyn'), 'Formel ist dokumentiert.');

const negative = calculateFreierZetaWert({ zeta: -0.2 });
close(negative.zeta, -0.2, 1e-12, 'Negative ζ-Werte bleiben für fachliche Sonderfälle möglich.');
check(negative.warnings.length === 1, 'Negativer ζ-Wert erzeugt einen Prüfhinweis.');

const registry = createDefaultFormPartRegistry();
const entry = registry.get('freier_zeta_wert');
check(Boolean(entry), 'Formteil ist in der Bibliothek registriert.');
equal(entry.editorMode, 'zeta-only', 'Editor ist auf reine ζ-Eingabe begrenzt.');
equal(entry.parameters.length, 1, 'Nur ein Fachparameter wird angeboten.');
equal(entry.parameters[0].id, 'zeta', 'Der einzige Fachparameter ist ζ.');
close(registry.calculate('freier_zeta_wert', { zeta: 0.62 }).zeta, 0.62, 1e-12, 'Registry berechnet den freien ζ-Wert.');

const project = createDefaultProject({ projectId: 'phase47-project', systemId: 'phase47-system' });
const system = project.systems[0];
system.sections = [{
  id: 'ts1', name: 'ts1', type: 'duct', description: 'Prüfkanal',
  q: 1800, b: 0.5, h: 0.4, d: 0, l: 4, roughnessMm: 0.15, zetaSum: 0,
}];
system.formParts = [{
  id: 'fp-free', name: 'Freier ζ-Wert', type: 'freier_zeta_wert', sectionId: 'ts1', zeta: 0.5,
}];
system.specialComponents = [];

let calculation = ProjectCalculationService.calculate(project, system.id);
let item = calculation.calculation.results[0];
close(item.zetaFromParts, 0.5, 1e-12, 'Freier ζ-Wert wird der Teilstrecke zugeordnet.');
close(item.result.zetaLoss, 0.5 * item.result.dynamicPressure, 1e-10, 'Δp wird automatisch als ζ × p_dyn berechnet.');
check(item.result.zetaLoss > 0, 'Automatisch berechneter Formteildruckverlust ist positiv.');
check(!('pressureLossPa' in system.formParts[0]), 'Formteil speichert keinen manuellen Pa-Direktwert.');

const originalLoss = item.result.zetaLoss;
system.sections[0].q = 2700;
calculation = ProjectCalculationService.calculate(project, system.id);
item = calculation.calculation.results[0];
check(item.result.zetaLoss > originalLoss, 'Bei höherer Luftmenge wird Δp automatisch neu berechnet.');
close(system.formParts[0].zeta, 0.5, 1e-12, 'ζ bleibt bei Neuberechnung unverändert.');

system.formParts[0].zeta = 0.8;
calculation = ProjectCalculationService.calculate(project, system.id);
project.calculationResult = calculation;
item = calculation.calculation.results[0];
close(item.zetaFromParts, 0.8, 1e-12, 'Manuell geänderter ζ-Wert wird übernommen.');
close(item.result.zetaLoss, 0.8 * item.result.dynamicPressure, 1e-10, 'Pa wird nach ζ-Änderung automatisch aktualisiert.');

const report = ReportEngine.createReportModel(project, { system, registry });
const row = report.sections[0].formParts.find(part => part.id === 'fp-free');
check(Boolean(row), 'Freier ζ-Wert erscheint im Bericht.');
close(row.zeta, 0.8, 1e-12, 'Bericht übernimmt den ζ-Wert.');
close(row.pressureLoss, item.result.dynamicPressure * 0.8, 1e-8, 'Bericht übernimmt den automatisch berechneten Pa-Wert.');

check(fs.existsSync('assets/formteile/freier_zeta_wert.png'), 'Neutrale Formteilskizze ist vorhanden.');
check(fs.existsSync('assets/formteile/freier_zeta_wert.xlsx'), 'Excel-Referenzdatei ist vorhanden.');

const workspace = fs.readFileSync('src/ui/components/WorkspaceComponent.js', 'utf8');
check(workspace.includes("editorMode === 'zeta-only'"), 'Workspace erkennt den vereinfachten ζ-Editor.');
check(workspace.includes('Nur den ζ-Wert eintragen'), 'Workspace erklärt die automatische Pa-Berechnung.');

console.log(`Phase 47.00 Freier ζ-Wert: ${checks} Prüfungen bestanden.`);
