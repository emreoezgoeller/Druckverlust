// Druckverlust Pro – Übergänge
// Berechnung nach Tabellenlogik aus Excel:
// - Übergang gross → klein: ζ = Tabellenwert(β, A1/A2) + ζ(Kanalkante)
// - ζ(Kanalkante) = Tabellenwert(Kante, A1/A2) × (1 - A1/A2)
// - Übergang klein → gross: ζ = Tabellenwert(β, A1/A2)
//
// A1 = kleiner Querschnitt, A2 = grosser Querschnitt.
// A1/A2 wird in der Registry automatisch aus Kanal-/Rohrabmessungen berechnet.

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const GROSS_KLEIN_RATIO_COLUMNS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

const GROSS_KLEIN_TABLE = [
  { beta: 10, values: { 0.1: 0.00, 0.2: 0.00, 0.3: 0.00, 0.4: 0.00, 0.5: 0.00, 0.6: 0.00, 0.7: 0.00, 0.8: 0.00, 0.9: 0.00, 1.0: 0.00 } },
  { beta: 20, values: { 0.1: 0.01, 0.2: 0.01, 0.3: 0.01, 0.4: 0.01, 0.5: 0.01, 0.6: 0.01, 0.7: 0.00, 0.8: 0.00, 0.9: 0.00, 1.0: 0.00 } },
  { beta: 30, values: { 0.1: 0.02, 0.2: 0.02, 0.3: 0.02, 0.4: 0.02, 0.5: 0.01, 0.6: 0.01, 0.7: 0.01, 0.8: 0.01, 0.9: 0.01, 1.0: 0.00 } },
  { beta: 40, values: { 0.1: 0.03, 0.2: 0.03, 0.3: 0.03, 0.4: 0.03, 0.5: 0.02, 0.6: 0.02, 0.7: 0.02, 0.8: 0.01, 0.9: 0.01, 1.0: 0.00 } },
  { beta: 50, values: { 0.1: 0.05, 0.2: 0.05, 0.3: 0.05, 0.4: 0.04, 0.5: 0.04, 0.6: 0.03, 0.7: 0.03, 0.8: 0.02, 0.9: 0.01, 1.0: 0.00 } },
  { beta: 60, values: { 0.1: 0.07, 0.2: 0.07, 0.3: 0.06, 0.4: 0.06, 0.5: 0.05, 0.6: 0.04, 0.7: 0.04, 0.8: 0.03, 0.9: 0.01, 1.0: 0.00 } },
];

const GROSS_KLEIN_EDGE_RATIO_COLUMNS = [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0];

const GROSS_KLEIN_EDGE_TABLE = [
  { edge: 1, values: { 0: 0.50, 0.2: 0.40, 0.4: 0.30, 0.5: 0.25, 0.6: 0.20, 0.7: 0.15, 0.8: 0.10, 1.0: 0.00 } },
  { edge: 2, values: { 0: 0.20, 0.2: 0.16, 0.4: 0.12, 0.5: 0.10, 0.6: 0.08, 0.7: 0.06, 0.8: 0.04, 1.0: 0.00 } },
  { edge: 3, values: { 0: 0.12, 0.2: 0.10, 0.4: 0.07, 0.5: 0.06, 0.6: 0.05, 0.7: 0.04, 0.8: 0.02, 1.0: 0.00 } },
  { edge: 4, values: { 0: 0.03, 0.2: 0.02, 0.4: 0.02, 0.5: 0.02, 0.6: 0.01, 0.7: 0.01, 0.8: 0.01, 1.0: 0.00 } },
];

const KLEIN_GROSS_RATIO_COLUMNS = [0, 0.05, 0.075, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6];

const KLEIN_GROSS_TABLE = [
  { beta: 3, values: { 0: 0.03, 0.05: 0.03, 0.075: 0.03, 0.1: 0.03, 0.15: 0.02, 0.2: 0.02, 0.25: 0.02, 0.3: 0.02, 0.4: 0.01, 0.5: 0.01, 0.6: 0.01 } },
  { beta: 6, values: { 0: 0.08, 0.05: 0.07, 0.075: 0.07, 0.1: 0.07, 0.15: 0.06, 0.2: 0.05, 0.25: 0.05, 0.3: 0.04, 0.4: 0.03, 0.5: 0.02, 0.6: 0.01 } },
  { beta: 8, values: { 0: 0.11, 0.05: 0.10, 0.075: 0.09, 0.1: 0.09, 0.15: 0.08, 0.2: 0.07, 0.25: 0.06, 0.3: 0.05, 0.4: 0.04, 0.5: 0.03, 0.6: 0.02 } },
  { beta: 10, values: { 0: 0.15, 0.05: 0.14, 0.075: 0.13, 0.1: 0.12, 0.15: 0.11, 0.2: 0.10, 0.25: 0.08, 0.3: 0.07, 0.4: 0.06, 0.5: 0.04, 0.6: 0.03 } },
  { beta: 12, values: { 0: 0.19, 0.05: 0.16, 0.075: 0.16, 0.1: 0.15, 0.15: 0.14, 0.2: 0.12, 0.25: 0.10, 0.3: 0.09, 0.4: 0.07, 0.5: 0.05, 0.6: 0.03 } },
  { beta: 14, values: { 0: 0.23, 0.05: 0.20, 0.075: 0.19, 0.1: 0.18, 0.15: 0.17, 0.2: 0.15, 0.25: 0.13, 0.3: 0.11, 0.4: 0.08, 0.5: 0.06, 0.6: 0.04 } },
  { beta: 16, values: { 0: 0.27, 0.05: 0.24, 0.075: 0.23, 0.1: 0.22, 0.15: 0.20, 0.2: 0.17, 0.25: 0.15, 0.3: 0.13, 0.4: 0.10, 0.5: 0.07, 0.6: 0.05 } },
  { beta: 20, values: { 0: 0.36, 0.05: 0.32, 0.075: 0.30, 0.1: 0.29, 0.15: 0.26, 0.2: 0.23, 0.25: 0.20, 0.3: 0.18, 0.4: 0.13, 0.5: 0.09, 0.6: 0.06 } },
  { beta: 24, values: { 0: 0.47, 0.05: 0.42, 0.075: 0.40, 0.1: 0.38, 0.15: 0.34, 0.2: 0.30, 0.25: 0.26, 0.3: 0.23, 0.4: 0.17, 0.5: 0.12, 0.6: 0.08 } },
  { beta: 30, values: { 0: 0.65, 0.05: 0.58, 0.075: 0.55, 0.1: 0.52, 0.15: 0.46, 0.2: 0.41, 0.25: 0.35, 0.3: 0.31, 0.4: 0.23, 0.5: 0.16, 0.6: 0.10 } },
  { beta: 40, values: { 0: 0.92, 0.05: 0.83, 0.075: 0.79, 0.1: 0.75, 0.15: 0.67, 0.2: 0.59, 0.25: 0.47, 0.3: 0.40, 0.4: 0.33, 0.5: 0.23, 0.6: 0.15 } },
  { beta: 60, values: { 0: 1.15, 0.05: 1.04, 0.075: 0.99, 0.1: 0.93, 0.15: 0.84, 0.2: 0.74, 0.25: 0.65, 0.3: 0.57, 0.4: 0.41, 0.5: 0.29, 0.6: 0.18 } },
  { beta: 90, values: { 0: 1.10, 0.05: 1.00, 0.075: 0.95, 0.1: 0.89, 0.15: 0.79, 0.2: 0.70, 0.25: 0.62, 0.3: 0.54, 0.4: 0.39, 0.5: 0.28, 0.6: 0.17 } },
  { beta: 180, values: { 0: 1.02, 0.05: 0.92, 0.075: 0.88, 0.1: 0.83, 0.15: 0.74, 0.2: 0.65, 0.25: 0.58, 0.3: 0.50, 0.4: 0.37, 0.5: 0.26, 0.6: 0.16 } },
];

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function roundTo(value, digits = 3) {
  const number = toNumber(value);
  const factor = 10 ** digits;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function lookupValue(list = [], value, mode = 'ceil') {
  return LookupEngine.lookup(list.map(x => ({ x, value: x })), value, { mode });
}

function areaRatio(A1, A2) {
  const area1 = toNumber(A1);
  const area2 = toNumber(A2);
  return area2 > 0 ? area1 / area2 : 0;
}

function lookupTransition(table, ratioColumns, beta, ratio) {
  const betaLookup = lookupValue(table.map(row => row.beta), beta, 'ceil');
  const ratioLookup = lookupValue(ratioColumns, ratio, 'ceil');
  const row = table.find(item => Number(item.beta) === Number(betaLookup));
  const zeta = Number(row?.values?.[ratioLookup] ?? 0);

  return {
    betaLookup,
    ratioLookup,
    zeta,
  };
}

function lookupGrossKleinEdge(edge, ratio) {
  const edgeLookup = lookupValue(GROSS_KLEIN_EDGE_TABLE.map(row => row.edge), edge, 'ceil');
  const ratioLookup = lookupValue(GROSS_KLEIN_EDGE_RATIO_COLUMNS, ratio, 'floor');
  const row = GROSS_KLEIN_EDGE_TABLE.find(item => Number(item.edge) === Number(edgeLookup));
  const baseZeta = Number(row?.values?.[ratioLookup] ?? 0);
  const zeta = baseZeta * Math.max(0, 1 - ratio);

  return {
    edgeLookup,
    ratioLookup,
    baseZeta,
    zeta: roundTo(zeta, 3),
  };
}

function transitionInput(values = {}) {
  return {
    beta: values.beta,
    berechnungsart: values.berechnungsart,
    kanalkante: values.kanalkante,
    A1_bauform: values.A1_bauform,
    A1_breite: values.A1_breite,
    A1_hoehe: values.A1_hoehe,
    A1_d: values.A1_d,
    A2_bauform: values.A2_bauform,
    A2_breite: values.A2_breite,
    A2_hoehe: values.A2_hoehe,
    A2_d: values.A2_d,
    A1: values.A1,
    A2: values.A2,
  };
}

function commonWarnings(area1, area2, ratio, minRatio, maxRatio) {
  const blockingWarnings = [];
  const warnings = [];

  if (area1 <= 0) blockingWarnings.push('Kleiner Querschnitt A1 fehlt oder ist 0.');
  if (area2 <= 0) blockingWarnings.push('Grosser Querschnitt A2 fehlt oder ist 0.');
  if (area1 > 0 && area2 > 0 && area1 > area2) warnings.push('A1 ist grösser als A2. Bitte kleinere und grössere Seite prüfen.');
  if (ratio > 0 && ratio < minRatio) warnings.push(`A1/A2 liegt unter ${minRatio}. Es wird der kleinste Tabellenwert verwendet.`);
  if (ratio > maxRatio) warnings.push(`A1/A2 liegt über ${maxRatio}. Es wird der grösste Tabellenwert verwendet.`);

  return { blockingWarnings, warnings };
}

function buildTransitionResult({ id, name, category, values, ratio, lookup, warnings, formula }) {
  return new FormPartResult({
    id,
    name,
    category,
    input: transitionInput(values),
    calculation: {
      beta: toNumber(values.beta),
      berechnungsart: values.berechnungsart,
      kanalkante: values.kanalkante,
      area1: toNumber(values.A1),
      area2: toNumber(values.A2),
      areaRatio: roundTo(ratio, 3),
      betaLookup: lookup.betaLookup,
      edgeLookup: lookup.edgeLookup,
      ratioLookup: lookup.ratioLookup,
      angleRatioLookup: lookup.angleRatioLookup,
      edgeRatioLookup: lookup.edgeRatioLookup,
      baseZeta: lookup.baseZeta,
      zetaAngle: lookup.zetaAngle,
      zetaEdge: lookup.zetaEdge,
      formula,
      lookupMode: lookup.lookupMode || (lookup.edgeLookup ? 'floor/ceil gemäss Excel-Kantentabelle' : 'ceil'),
      lookupModeLabel: lookup.lookupModeLabel || (lookup.edgeLookup ? 'Kanalkante gemäss Excel-Tabelle' : 'exakt oder nächst grösserer Tabellenwert'),
    },
    zeta: lookup.zeta,
    warnings,
  });
}

export function calculateUebergangGrossKlein(values = {}) {
  const angle = toNumber(values.beta);
  const edge = toNumber(values.kanalkante, 1);
  const area1 = toNumber(values.A1);
  const area2 = toNumber(values.A2);
  const ratio = areaRatio(area1, area2);
  const { blockingWarnings, warnings } = commonWarnings(area1, area2, ratio, 0.1, 1.0);

  if (angle <= 0) blockingWarnings.push('Winkel β fehlt oder ist 0.');
  if (edge <= 0) blockingWarnings.push('Kanalkante fehlt.');

  if (blockingWarnings.length) {
    return new FormPartResult({
      id: 'uebergang_gross_klein',
      name: 'Übergang gross → klein',
      category: 'Übergänge',
      input: transitionInput(values),
      calculation: { beta: angle, kanalkante: edge, areaRatio: ratio },
      zeta: 0,
      warnings: blockingWarnings,
    });
  }

  const angleLookup = lookupTransition(GROSS_KLEIN_TABLE, GROSS_KLEIN_RATIO_COLUMNS, angle, ratio);
  const edgeLookup = lookupGrossKleinEdge(edge, ratio);
  const zetaAngle = toNumber(angleLookup.zeta);
  const zetaEdge = toNumber(edgeLookup.zeta);

  const lookup = {
    zetaAngle: roundTo(zetaAngle, 3),
    zetaEdge: roundTo(zetaEdge, 3),
    zeta: roundTo(zetaAngle + zetaEdge, 3),
    betaLookup: angleLookup.betaLookup,
    edgeLookup: edgeLookup.edgeLookup,
    angleRatioLookup: angleLookup.ratioLookup,
    edgeRatioLookup: edgeLookup.ratioLookup,
    ratioLookup: angleLookup.ratioLookup,
    baseZeta: edgeLookup.baseZeta,
    lookupMode: 'Winkel β: ceil; Kanalkante: gemäss Excel-Kantentabelle',
    lookupModeLabel: 'Winkel β und Kanalkante gemeinsam berücksichtigt',
  };

  return buildTransitionResult({
    id: 'uebergang_gross_klein',
    name: 'Übergang gross → klein',
    category: 'Übergänge',
    values,
    ratio,
    lookup,
    warnings,
    formula: 'ζ = Tabellenwert(β, A1/A2) + Tabellenwert(Kanalkante, A1/A2) × (1 - A1/A2)',
  });
}

export function calculateUebergangKleinGross(values = {}) {
  const angle = toNumber(values.beta);
  const area1 = toNumber(values.A1);
  const area2 = toNumber(values.A2);
  const ratio = areaRatio(area1, area2);
  const { blockingWarnings, warnings } = commonWarnings(area1, area2, ratio, 0, 0.6);

  if (angle <= 0) blockingWarnings.push('Winkel β fehlt oder ist 0.');

  if (blockingWarnings.length) {
    return new FormPartResult({
      id: 'uebergang_klein_gross',
      name: 'Übergang klein → gross',
      category: 'Übergänge',
      input: transitionInput(values),
      calculation: { beta: angle, areaRatio: ratio },
      zeta: 0,
      warnings: blockingWarnings,
    });
  }

  const lookup = lookupTransition(KLEIN_GROSS_TABLE, KLEIN_GROSS_RATIO_COLUMNS, angle, ratio);

  return buildTransitionResult({
    id: 'uebergang_klein_gross',
    name: 'Übergang klein → gross',
    category: 'Übergänge',
    values,
    ratio,
    lookup,
    warnings,
    formula: 'ζ = Tabellenwert(β, A1/A2)',
  });
}

export default {
  calculateUebergangGrossKlein,
  calculateUebergangKleinGross,
};
