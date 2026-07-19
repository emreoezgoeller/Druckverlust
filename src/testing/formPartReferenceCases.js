// Druckverlust Pro – feste Excel-Referenzpunkte der Formteilbibliothek
//
// Die Sollwerte stammen aus den in assets/formteile/*.xlsx gespeicherten
// Tabellen-/Formelergebnissen. Sie werden hier bewusst als feste Werte
// hinterlegt und nicht zur Laufzeit aus den Excel-Dateien erzeugt.

import { calculateKreisBogen } from '../formteile/calculators/kreisBogenCalculator.js';
import { calculateEckigerBogen } from '../formteile/calculators/eckigerBogenCalculator.js';
import { calculateKanalBogenWinkel } from '../formteile/calculators/kanalBogenWinkelCalculator.js';
import { calculateUebergangGrossKlein, calculateUebergangKleinGross } from '../formteile/calculators/uebergangCalculator.js';
import { calculateEtage45 } from '../formteile/calculators/etage45Calculator.js';
import { calculateHosenstueck } from '../formteile/calculators/hosenstueckCalculator.js';
import {
  calculateTAbzweigDurchgangRund1,
  calculateTAbzweigDurchgangRund2,
  calculateTAbzweigRund1,
  calculateTAbzweigRund2,
} from '../formteile/calculators/tAbzweigCalculator.js';
import { calculateTStueck90, calculateTStueck90Variante2 } from '../formteile/calculators/tStueck90Calculator.js';
import { calculateSattelstueckMitEinstroemkonus } from '../formteile/calculators/sattelstueckMitEinstroemkonusCalculator.js';

const excel = id => `assets/formteile/${id}.xlsx`;
const zeta = (expected, tolerance = 1e-10) => ({ label: 'ζ-Wert', path: 'zeta', expected, tolerance });
const exact = (label, path, expected) => ({ label, path, expected, exact: true });
const numeric = (label, path, expected, tolerance = 1e-10) => ({ label, path, expected, tolerance });

export const FORM_PART_REFERENCE_CASES = Object.freeze([
  {
    id: 'FP-001', partId: 'kreis_bogen', title: 'Kreisförmiger Bogen', source: excel('kreis_bogen'),
    calculate: calculateKreisBogen, input: { R: 110, d: 50, alpha: 90 },
    expectations: [zeta(0.13), numeric('R/d Tabellenachse', 'calculation.ratio', 2.2), numeric('Winkelfaktor', 'calculation.angleFactor', 1)],
  },
  {
    id: 'FP-002', partId: 'eckiger_bogen', title: 'Eckiger Kanalbogen', source: excel('eckiger_bogen'),
    calculate: calculateEckigerBogen, input: { R: 110, a: 300, b: 400 },
    expectations: [zeta(1.29), numeric('Tabellenzeile R/b', 'calculation.rbLookup', 0.5), numeric('Tabellenspalte a/b', 'calculation.aspectLookup', 0.75)],
  },
  {
    id: 'FP-003', partId: 'kanal_bogen_winkel', title: 'Kanalbogen mit Winkel', source: excel('kanal_bogen_winkel'),
    calculate: calculateKanalBogenWinkel, input: { alpha: 20, a: 300, b: 400 },
    expectations: [zeta(0.14), numeric('Winkelachse', 'calculation.alphaLookup', 20), numeric('Seitenverhältnis', 'calculation.aspectLookup', 0.75)],
  },
  {
    id: 'FP-004', partId: 'uebergang_gross_klein', title: 'Übergang gross → klein', source: excel('uebergang_gross_klein'),
    calculate: calculateUebergangGrossKlein, input: { beta: 10, kanalkante: 1, A1: 0.125, A2: 0.25 },
    expectations: [zeta(0.125), numeric('Flächenverhältnis A1/A2', 'calculation.areaRatio', 0.5), numeric('Kantenanteil', 'calculation.zetaEdge', 0.125)],
  },
  {
    id: 'FP-005', partId: 'uebergang_klein_gross', title: 'Übergang klein → gross', source: excel('uebergang_klein_gross'),
    calculate: calculateUebergangKleinGross, input: { beta: 40, A1: 0.125, A2: 0.25 },
    expectations: [zeta(0.23), numeric('Flächenverhältnis A1/A2', 'calculation.areaRatio', 0.5), numeric('Winkelachse', 'calculation.betaLookup', 40)],
  },
  {
    id: 'FP-006', partId: 'etage_45', title: 'Etage 45°', source: excel('etage_45'),
    calculate: calculateEtage45, input: { LE: 450, dh: 250, bauform: 'Rohr' },
    expectations: [zeta(0.15), numeric('LE/dh', 'calculation.ratio', 1.8), numeric('Tabellenwert LE/dh', 'calculation.ratioLookup', 1)],
  },
  {
    id: 'FP-007', partId: 'hosenstueck', title: 'Hosenstück', source: excel('hosenstueck'),
    calculate: calculateHosenstueck, input: { W: 900, WA: 720, A_area: 0.1, AA_area: 0.1, alpha: 45 },
    expectations: [zeta(0.53), numeric('wA/w', 'calculation.ratio', 0.8), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 0.8), exact('Bezugsdruck', 'calculation.pressureReference', 'wA')],
  },
  {
    id: 'FP-008', partId: 't_abzweig_durchgang_rund1', title: 'T-Abzweig Durchgang rund 1', source: excel('t_abzweig_durchgang_rund1'),
    calculate: calculateTAbzweigDurchgangRund1, input: { W: 3.5, WD: 2.5, WA: 1, w: 3.5, wD: 2.5, wA: 2 },
    expectations: [zeta(0.1), numeric('Tabellenspalte WD/W', 'calculation.ratioLookup', 0.7), exact('Bezugsdruck', 'calculation.pressureReference', 'wD')],
  },
  {
    id: 'FP-009', partId: 't_abzweig_rund1', title: 'T-Abzweig rund 1', source: excel('t_abzweig_rund1'),
    calculate: calculateTAbzweigRund1, input: { W: 3.5, WD: 2.5, WA: 1, w: 3.5, wD: 2.5, wA: 2, alpha: 45, bedingung: 'ueber' },
    expectations: [zeta(1), numeric('Tabellenspalte WD/W', 'calculation.ratioLookup', 0.7), numeric('Winkelachse', 'calculation.alphaLookup', 45), exact('Bezugsdruck', 'calculation.pressureReference', 'wA')],
  },
  {
    id: 'FP-010', partId: 't_abzweig_durchgang_rund2', title: 'T-Abzweig Durchgang rund 2', source: excel('t_abzweig_durchgang_rund2'),
    calculate: calculateTAbzweigDurchgangRund2, input: { W: 3.5, WD: 1, WA: 2.5, w: 3.5, wD: 1, wA: 2.5, AA_A: 0.4, alpha: 45, bedingung: 'ueber' },
    expectations: [zeta(0.1), numeric('Excel-Flächenband', 'calculation.areaLookup', 0.3), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 0.7), exact('Bezugsdruck', 'calculation.pressureReference', 'wD')],
  },
  {
    id: 'FP-011', partId: 't_abzweig_rund2', title: 'T-Abzweig rund 2', source: excel('t_abzweig_rund2'),
    calculate: calculateTAbzweigRund2, input: { W: 3.5, WD: 1, WA: 2.5, w: 3.5, wD: 1, wA: 2.5, AA_A: 0.4, alpha: 45, bedingung: 'ueber' },
    expectations: [zeta(-2.1), numeric('Excel-Flächenband', 'calculation.areaLookup', 0.3), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 0.7), exact('Bezugsdruck', 'calculation.pressureReference', 'wA')],
  },
  {
    id: 'FP-012A', partId: 't_stueck_90', title: '90° T-Stück – Durchgang', source: excel('t_stueck_90'),
    calculate: calculateTStueck90, input: { W: 1, WA: 1, w: 2.5, wA: 2, bezug: 'durchgang' },
    expectations: [zeta(1.19), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 0.8), exact('Bezugsdruck', 'calculation.pressureReference', 'w')],
  },
  {
    id: 'FP-012B', partId: 't_stueck_90', title: '90° T-Stück – Abzweig', source: excel('t_stueck_90'),
    calculate: calculateTStueck90, input: { W: 1, WA: 1, w: 2.5, wA: 2, bezug: 'abzweig' },
    expectations: [zeta(1.86), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 0.8), exact('Bezugsdruck', 'calculation.pressureReference', 'wA')],
  },
  {
    id: 'FP-013', partId: 't_stueck_90_2', title: '90° T-Stück Variante 2', source: excel('t_stueck_90_2'),
    calculate: calculateTStueck90Variante2, input: { W: 1, WA: 1, w: 2.5, wA: 2, A_area: 1, AA_area: 0.75, AA_A: 0.75 },
    expectations: [zeta(2.3), numeric('Tabellenzeile AA/A', 'calculation.areaLookup', 0.75), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 0.8)],
  },
  {
    id: 'FP-014A', partId: 'sattelstueck_mit_einstroemkonus', title: 'Sattelstück – Kurve a', source: excel('sattelstueck_mit_einstroemkonus'),
    calculate: calculateSattelstueckMitEinstroemkonus, input: { W: 1, WA: 1, w: 1, wA: 1.2, curve: 'a' },
    expectations: [zeta(0.9338849734779138, 1e-12), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 1.2), exact('Kurve', 'calculation.curve', 'a')],
  },
  {
    id: 'FP-014B', partId: 'sattelstueck_mit_einstroemkonus', title: 'Sattelstück – Kurve b', source: excel('sattelstueck_mit_einstroemkonus'),
    calculate: calculateSattelstueckMitEinstroemkonus, input: { W: 1, WA: 1, w: 1, wA: 1.2, curve: 'b' },
    expectations: [zeta(0.54), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 1.2), exact('Kurve', 'calculation.curve', 'b')],
  },
  {
    id: 'FP-L01', partId: 'hosenstueck', title: 'Hosenstück – Excel-Bodensuche 0.85 → 0.8', source: excel('hosenstueck'),
    calculate: calculateHosenstueck, input: { W: 900, WA: 765, A_area: 0.1, AA_area: 0.1, alpha: 45 },
    expectations: [zeta(0.53), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 0.8)],
  },
  {
    id: 'FP-L02', partId: 't_stueck_90_2', title: 'T-Stück Variante 2 – Excel-Bodensuche 0.85 → 0.8', source: excel('t_stueck_90_2'),
    calculate: calculateTStueck90Variante2, input: { W: 1, WA: 1, w: 2.5, wA: 2.125, A_area: 1, AA_area: 0.75, AA_A: 0.75 },
    expectations: [zeta(2.3), numeric('Tabellenspalte wA/w', 'calculation.ratioLookup', 0.8)],
  },
]);

export default FORM_PART_REFERENCE_CASES;
