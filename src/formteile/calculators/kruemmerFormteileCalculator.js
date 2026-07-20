// Druckverlust Pro – Krümmerabzweige und Krümmerendstücke
// Tabellenwerte aus den Excel-Referenzen der Phase 51.10.
//
// Lookup-Regeln gemäss Excel:
// - Geometriezeile: exakte Kombination der Flächenverhältnisse
// - Geschwindigkeitsverhältnis: XLOOKUP match_mode -1
//   = exakt oder nächst kleinerer Tabellenwert
// - Druckbezug:
//   - Abzweig / Endstück: Δp = ζA × pdyn(wA)
//   - Durchgang:           Δp = ζD × pdyn(wD)

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const DEFAULT_RHO = 1.21;
const GEOMETRY_TOLERANCE = 0.015;

const KRUEMMERABZWEIG_1_COLUMNS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.4, 1.6, 1.8, 2];
const KRUEMMERABZWEIG_2_COLUMNS = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2];
const KRUEMMERENDSTUECK_1_COLUMNS = [0.5, 0.6, 0.7, 0.8, 0.9, 1];
const KRUEMMERENDSTUECK_1_ASPECTS = [0.25, 0.5, 0.75, 1, 1.5, 2];
const KRUEMMERENDSTUECK_2_COLUMNS = [0.5, 1];

const KRUEMMERABZWEIG_1_ABZWEIG = Object.freeze([
  { AA_AD: 0.5, AD_A: 1, AA_A: 0.5, values: [74.8, 15.9, 6, 2.9, 1.7, 1.1, 0.8, 0.6, 0.5, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5] },
  { AA_AD: 1, AD_A: 0.5, AA_A: 0.5, values: [51.3, 11.3, 4.5, 2.4, 1.4, 1, 0.8, 0.6, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { AA_AD: 1, AD_A: 1, AA_A: 1, values: [67.8, 13.6, 4.9, 2.2, 1.2, 0.8, 0.6, 0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.7, 0.7] },
  { AA_AD: 2, AD_A: 0.5, AA_A: 1, values: [62.8, 12.4, 4.3, 1.9, 1, 0.5, 0.4, 0.3, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5] },
]);

const KRUEMMERABZWEIG_1_DURCHGANG = Object.freeze([
  { AA_AD: 0.5, AD_A: 1, AA_A: 0.5, values: [35.3, 6.5, 2, 0.7, 0.22, 0.03, -0.04, -0.05, -0.05, -0.03, 0.02, 0.07, 0.11, 0.15, 0.19] },
  { AA_AD: 1, AD_A: 0.5, AA_A: 0.5, values: [39.3, 7.5, 2.5, 1, 0.4, 0.19, 0.09, 0.06, 0.05, 0.06, 0.1, 0.14, 0.18, 0.22, 0.26] },
  { AA_AD: 1, AD_A: 1, AA_A: 1, values: [38.9, 7.1, 2.2, 0.7, 0.23, 0.03, -0.04, -0.05, -0.04, -0.02, 0.04, 0.1, 0.15, 0.2, 0.24] },
  { AA_AD: 2, AD_A: 0.5, AA_A: 1, values: [27.4, 5.2, 1.7, 0.7, 0.3, 0.15, 0.08, 0.06, 0.06, 0.07, 0.1, 0.13, 0.16, 0.19, 0.21] },
]);

const KRUEMMERABZWEIG_2_ABZWEIG = Object.freeze([
  { AA_AD: 0.5, AD_A: 1, AA_A: 0.5, values: [-11.4, -1.8, -0.3, 0.2, 0.4, 0.5, 0.6, 0.6, 0.6, 0.6] },
  { AA_AD: 1, AD_A: 0.5, AA_A: 0.5, values: [-52.5, -9.8, -2.9, -0.8, 0, 0.3, 0.5, 0.5, 0.6, 0.6] },
  { AA_AD: 1, AD_A: 1, AA_A: 1, values: [-9.7, 0, 0.8, 0.6, 0.4, 0.2, 0.1, -0.1, -0.2, -0.3] },
]);

const KRUEMMERABZWEIG_2_DURCHGANG = Object.freeze([
  { AA_AD: 0.5, AD_A: 1, AA_A: 0.5, values: [-8.9, -1.1, 0, 0.2, 0.3, 0.3, 0.2, 0.2, 0.2, 0.1] },
  { AA_AD: 1, AD_A: 0.5, AA_A: 0.5, values: [-32.2, -5, -1, 0, 0.4, 0.4, 0.4, 0.4, 0.4, 0.3] },
  { AA_AD: 1, AD_A: 1, AA_A: 1, values: [0, 0.2, 0.3, 0.2, 0.1, -0.1, -0.4, -0.8, -1.3, -1.9] },
]);

const KRUEMMERENDSTUECK_1 = Object.freeze({
  0.25: [1.32, 0.67, 0.35, 0.19, 0.11, 0.1],
  0.5: [1.44, 0.76, 0.41, 0.23, 0.15, 0.11],
  0.75: [1.52, 0.81, 0.45, 0.27, 0.17, 0.13],
  1: [1.6, 0.87, 0.49, 0.3, 0.2, 0.15],
  1.5: [1.72, 0.95, 0.55, 0.34, 0.23, 0.18],
  2: [1.84, 1.03, 0.61, 0.39, 0.27, 0.21],
});

const KRUEMMERENDSTUECK_2 = Object.freeze({
  0.5: 0.28,
  1: 0.23,
});

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

function dynamicPressure(velocityMs, rho = DEFAULT_RHO) {
  const velocity = toNumber(velocityMs);
  const density = toNumber(rho, DEFAULT_RHO);
  return velocity > 0 && density > 0 ? 0.5 * density * velocity * velocity : 0;
}

function lookupFloor(columns, value) {
  return LookupEngine.lookup(columns.map(x => ({ x, value: x })), value, { mode: 'floor' });
}

function nearlyEqual(a, b, tolerance = GEOMETRY_TOLERANCE) {
  return Math.abs(toNumber(a) - toNumber(b)) <= tolerance;
}

function addRangeWarnings(warnings, blockingWarnings, value, columns, label) {
  const number = toNumber(value);
  const min = Math.min(...columns);
  const max = Math.max(...columns);

  if (number > 0 && number < min) {
    blockingWarnings.push(`${label} liegt unter ${min}. In der Excel-Tabelle ist kein nächst kleinerer Tabellenwert vorhanden.`);
  }
  if (number > max) warnings.push(`${label} liegt über ${max}. Es wird der grösste Tabellenwert ${max} verwendet.`);
}

function findGeometryRow(rows, values = {}) {
  return rows.find(row =>
    nearlyEqual(row.AA_AD, values.AA_AD)
    && nearlyEqual(row.AD_A, values.AD_A)
    && nearlyEqual(row.AA_A, values.AA_A)
  ) || null;
}

function geometryLabel(row) {
  if (!row) return '-';
  return `AA/AD ${row.AA_AD} · AD/A ${row.AD_A} · AA/A ${row.AA_A}`;
}

function commonAbzweigWarnings(values = {}) {
  const warnings = [];
  const blockingWarnings = [];

  if (toNumber(values.A_area) <= 0) blockingWarnings.push('Hauptquerschnitt A konnte nicht berechnet werden. Dieses Formteil ist für Rechteckkanäle vorgesehen.');
  if (toNumber(values.AD_area) <= 0) blockingWarnings.push('Durchgangsquerschnitt AD konnte nicht berechnet werden. Bitte Rechteck-Abmessungen des Durchgangs prüfen.');
  if (toNumber(values.AA_area) <= 0) blockingWarnings.push('Abzweigquerschnitt AA konnte nicht berechnet werden. Bitte Rechteck-Abmessungen des Abzweigs prüfen.');
  if (toNumber(values.W) <= 0) blockingWarnings.push('Hauptluftmenge W fehlt oder ist 0.');
  if (toNumber(values.WD) <= 0) blockingWarnings.push('Durchgangsluftmenge WD fehlt oder ist 0.');
  if (toNumber(values.WA) <= 0) blockingWarnings.push('Abzweigluftmenge WA fehlt oder ist 0.');
  if (toNumber(values.w) <= 0) blockingWarnings.push('Hauptgeschwindigkeit w konnte nicht berechnet werden.');
  if (toNumber(values.wD) <= 0) blockingWarnings.push('Durchgangsgeschwindigkeit wD konnte nicht berechnet werden.');
  if (toNumber(values.wA) <= 0) blockingWarnings.push('Abzweiggeschwindigkeit wA konnte nicht berechnet werden.');

  const W = toNumber(values.W);
  const WD = toNumber(values.WD);
  const WA = toNumber(values.WA);
  if (W > 0 && WD > 0 && WA > 0 && Math.abs(W - WD - WA) > Math.max(1, W * 0.02)) {
    warnings.push('Luftmengenbilanz prüfen: W sollte ungefähr WD + WA entsprechen.');
  }

  return { warnings, blockingWarnings };
}

function commonEndstueckWarnings(values = {}) {
  const warnings = [];
  const blockingWarnings = [];

  if (toNumber(values.A_area) <= 0) blockingWarnings.push('Hauptquerschnitt A konnte nicht berechnet werden. Dieses Formteil ist für Rechteckkanäle vorgesehen.');
  if (toNumber(values.AA_area) <= 0) blockingWarnings.push('Anschlussquerschnitt AA konnte nicht berechnet werden. Bitte Rechteck-Abmessungen prüfen.');
  if (toNumber(values.W) <= 0) blockingWarnings.push('Luftmenge W fehlt oder ist 0.');
  if (toNumber(values.WA) <= 0) blockingWarnings.push('Luftmenge WA fehlt oder ist 0.');
  if (toNumber(values.w) <= 0) blockingWarnings.push('Geschwindigkeit w konnte nicht berechnet werden.');
  if (toNumber(values.wA) <= 0) blockingWarnings.push('Geschwindigkeit wA konnte nicht berechnet werden.');

  return { warnings, blockingWarnings };
}

function abzweigReferenceRows(values = {}, ratioLabel, ratioValue, geometryRow = null) {
  return [
    { label: 'Hauptluftmenge W', value: toNumber(values.W), suffix: 'm³/h', digits: 0 },
    { label: 'Hauptgeschwindigkeit w', value: toNumber(values.w), suffix: 'm/s', digits: 2 },
    { label: 'Durchgangsluftmenge WD', value: toNumber(values.WD), suffix: 'm³/h', digits: 0 },
    { label: 'Durchgangsgeschwindigkeit wD', value: toNumber(values.wD), suffix: 'm/s', digits: 2 },
    { label: 'Abzweigluftmenge WA', value: toNumber(values.WA), suffix: 'm³/h', digits: 0 },
    { label: 'Abzweiggeschwindigkeit wA', value: toNumber(values.wA), suffix: 'm/s', digits: 2 },
    { label: 'Flächenverhältnis AA/AD', value: toNumber(values.AA_AD), digits: 3 },
    { label: 'Flächenverhältnis AD/A', value: toNumber(values.AD_A), digits: 3 },
    { label: 'Flächenverhältnis AA/A', value: toNumber(values.AA_A), digits: 3 },
    { label: ratioLabel, value: ratioValue, digits: 3 },
    { label: 'Tabellen-Geometriefall', value: geometryLabel(geometryRow) },
  ];
}

function endstueckReferenceRows(values = {}, ratioLookup, includeAspect = false) {
  const rows = [
    { label: 'Luftmenge W', value: toNumber(values.W), suffix: 'm³/h', digits: 0 },
    { label: 'Geschwindigkeit w', value: toNumber(values.w), suffix: 'm/s', digits: 2 },
    { label: 'Luftmenge WA', value: toNumber(values.WA), suffix: 'm³/h', digits: 0 },
    { label: 'Geschwindigkeit wA', value: toNumber(values.wA), suffix: 'm/s', digits: 2 },
    { label: 'Verhältnis wA/w', value: toNumber(values.wA_w), digits: 3 },
    { label: 'Tabellenspalte wA/w', value: ratioLookup, digits: 3 },
  ];

  if (includeAspect) rows.push({ label: 'Seitenverhältnis a/b', value: toNumber(values.a_b), digits: 3 });
  return rows;
}

function blockingResult({ id, name, category, values, warnings, referenceRows = [] }) {
  return new FormPartResult({
    id,
    name,
    category,
    input: { ...values },
    calculation: {
      lossMode: 'direct',
      pressureReference: '-',
      dynamicPressurePa: 0,
      pressureLossPa: 0,
      referenceRows,
    },
    zeta: 0,
    warnings,
  });
}

function directResult({ id, name, category, values, zeta, pressureReference, velocity, calculation, warnings }) {
  const dynamicPressurePa = dynamicPressure(velocity);
  const pressureLossPa = zeta * dynamicPressurePa;

  return new FormPartResult({
    id,
    name,
    category,
    input: { ...values },
    calculation: {
      lossMode: 'direct',
      pressureReference,
      dynamicPressurePa: roundTo(dynamicPressurePa, 3),
      pressureLossPa: roundTo(pressureLossPa, 3),
      ...calculation,
    },
    zeta,
    warnings,
  });
}

function calculateKruemmerabzweig(values, config) {
  const ratio = toNumber(values[config.ratioField])
    || (toNumber(values.w) > 0 ? toNumber(values[config.velocityField]) / toNumber(values.w) : 0);
  const { warnings, blockingWarnings } = commonAbzweigWarnings(values);
  const geometryRow = findGeometryRow(config.table, values);

  addRangeWarnings(warnings, blockingWarnings, ratio, config.columns, config.ratioLabel);

  if (!geometryRow) {
    blockingWarnings.push(
      `Die Geometrie AA/AD ${roundTo(values.AA_AD, 3)}, AD/A ${roundTo(values.AD_A, 3)}, AA/A ${roundTo(values.AA_A, 3)} ist in der Excel-Tabelle nicht enthalten.`
    );
  }

  if (blockingWarnings.length) {
    return blockingResult({
      id: config.id,
      name: config.name,
      category: 'Abzweige',
      values,
      warnings: [...blockingWarnings, ...warnings],
      referenceRows: abzweigReferenceRows(values, config.ratioLabel, ratio, geometryRow),
    });
  }

  const ratioLookup = lookupFloor(config.columns, ratio);
  const columnIndex = config.columns.indexOf(ratioLookup);
  const zeta = Number(geometryRow.values[columnIndex] ?? 0);

  return directResult({
    id: config.id,
    name: config.name,
    category: 'Abzweige',
    values,
    zeta,
    pressureReference: config.pressureReference,
    velocity: values[config.velocityField],
    calculation: {
      W: toNumber(values.W),
      WD: toNumber(values.WD),
      WA: toNumber(values.WA),
      w: roundTo(values.w, 3),
      wD: roundTo(values.wD, 3),
      wA: roundTo(values.wA, 3),
      AA_AD: roundTo(values.AA_AD, 3),
      AD_A: roundTo(values.AD_A, 3),
      AA_A: roundTo(values.AA_A, 3),
      [config.ratioField]: roundTo(ratio, 3),
      ratioLookup,
      geometryLookup: {
        AA_AD: geometryRow.AA_AD,
        AD_A: geometryRow.AD_A,
        AA_A: geometryRow.AA_A,
      },
      lookupMode: 'geometry-exact/ratio-floor',
      lookupModeLabel: 'Geometrie exakt; Geschwindigkeitsverhältnis exakt oder nächst kleiner',
      formula: config.formula,
      referenceRows: abzweigReferenceRows(values, config.ratioLabel, ratio, geometryRow),
    },
    warnings,
  });
}

export function calculateKruemmerabzweig1Abzweig(values = {}) {
  return calculateKruemmerabzweig(values, {
    id: 'kruemmerabzweig_1_abzweig',
    name: 'Krümmerabzweig 1 – Abzweig',
    table: KRUEMMERABZWEIG_1_ABZWEIG,
    columns: KRUEMMERABZWEIG_1_COLUMNS,
    ratioField: 'wA_w',
    ratioLabel: 'Verhältnis wA/w',
    velocityField: 'wA',
    pressureReference: 'wA',
    formula: 'ζA = Tabellenwert(AA/AD, AD/A, AA/A, wA/w); Δp = ζA × pdyn(wA)',
  });
}

export function calculateKruemmerabzweig1Durchgang(values = {}) {
  return calculateKruemmerabzweig(values, {
    id: 'kruemmerabzweig_1_durchgang',
    name: 'Krümmerabzweig 1 – Durchgang',
    table: KRUEMMERABZWEIG_1_DURCHGANG,
    columns: KRUEMMERABZWEIG_1_COLUMNS,
    ratioField: 'wD_w',
    ratioLabel: 'Verhältnis wD/w',
    velocityField: 'wD',
    pressureReference: 'wD',
    formula: 'ζD = Tabellenwert(AA/AD, AD/A, AA/A, wD/w); Δp = ζD × pdyn(wD)',
  });
}

export function calculateKruemmerabzweig2Abzweig(values = {}) {
  return calculateKruemmerabzweig(values, {
    id: 'kruemmerabzweig_2_abzweig',
    name: 'Krümmerabzweig 2 – Abzweig (Zusammenfluss)',
    table: KRUEMMERABZWEIG_2_ABZWEIG,
    columns: KRUEMMERABZWEIG_2_COLUMNS,
    ratioField: 'wA_w',
    ratioLabel: 'Verhältnis wA/w',
    velocityField: 'wA',
    pressureReference: 'wA',
    formula: 'ζA = Tabellenwert(AA/AD, AD/A, AA/A, wA/w); Δp = ζA × pdyn(wA)',
  });
}

export function calculateKruemmerabzweig2Durchgang(values = {}) {
  return calculateKruemmerabzweig(values, {
    id: 'kruemmerabzweig_2_durchgang',
    name: 'Krümmerabzweig 2 – Durchgang (Zusammenfluss)',
    table: KRUEMMERABZWEIG_2_DURCHGANG,
    columns: KRUEMMERABZWEIG_2_COLUMNS,
    ratioField: 'wD_w',
    ratioLabel: 'Verhältnis wD/w',
    velocityField: 'wD',
    pressureReference: 'wD',
    formula: 'ζD = Tabellenwert(AA/AD, AD/A, AA/A, wD/w); Δp = ζD × pdyn(wD)',
  });
}

export function calculateKruemmerendstueck1(values = {}) {
  const id = 'kruemmerendstueck_1';
  const name = 'Krümmerendstück 1';
  const ratio = toNumber(values.wA_w) || (toNumber(values.w) > 0 ? toNumber(values.wA) / toNumber(values.w) : 0);
  const aspect = toNumber(values.a_b);
  const { warnings, blockingWarnings } = commonEndstueckWarnings(values);
  const aspectLookup = KRUEMMERENDSTUECK_1_ASPECTS.find(value => nearlyEqual(value, aspect)) ?? null;

  addRangeWarnings(warnings, blockingWarnings, ratio, KRUEMMERENDSTUECK_1_COLUMNS, 'wA/w');
  if (aspectLookup === null) {
    blockingWarnings.push(`Das Seitenverhältnis a/b ${roundTo(aspect, 3)} ist in der Excel-Tabelle nicht enthalten. Zulässig: ${KRUEMMERENDSTUECK_1_ASPECTS.join(', ')}.`);
  }

  if (blockingWarnings.length) {
    return blockingResult({
      id,
      name,
      category: 'Rechteck',
      values,
      warnings: [...blockingWarnings, ...warnings],
      referenceRows: endstueckReferenceRows(values, 0, true),
    });
  }

  const ratioLookup = lookupFloor(KRUEMMERENDSTUECK_1_COLUMNS, ratio);
  const columnIndex = KRUEMMERENDSTUECK_1_COLUMNS.indexOf(ratioLookup);
  const zeta = Number(KRUEMMERENDSTUECK_1[aspectLookup]?.[columnIndex] ?? 0);

  return directResult({
    id,
    name,
    category: 'Rechteck',
    values,
    zeta,
    pressureReference: 'wA',
    velocity: values.wA,
    calculation: {
      w: roundTo(values.w, 3),
      wA: roundTo(values.wA, 3),
      wA_w: roundTo(ratio, 3),
      a_b: aspectLookup,
      ratioLookup,
      aspectLookup,
      lookupMode: 'aspect-exact/ratio-floor',
      lookupModeLabel: 'a/b exakt; wA/w exakt oder nächst kleiner',
      formula: 'ζA = Tabellenwert(a/b, wA/w); Δp = ζA × pdyn(wA)',
      referenceRows: endstueckReferenceRows(values, ratioLookup, true),
    },
    warnings,
  });
}

export function calculateKruemmerendstueck2(values = {}) {
  const id = 'kruemmerendstueck_2';
  const name = 'Krümmerendstück 2 (Zusammenfluss)';
  const ratio = toNumber(values.wA_w) || (toNumber(values.w) > 0 ? toNumber(values.wA) / toNumber(values.w) : 0);
  const { warnings, blockingWarnings } = commonEndstueckWarnings(values);

  addRangeWarnings(warnings, blockingWarnings, ratio, KRUEMMERENDSTUECK_2_COLUMNS, 'wA/w');

  if (blockingWarnings.length) {
    return blockingResult({
      id,
      name,
      category: 'Rechteck',
      values,
      warnings: [...blockingWarnings, ...warnings],
      referenceRows: endstueckReferenceRows(values, 0),
    });
  }

  const ratioLookup = lookupFloor(KRUEMMERENDSTUECK_2_COLUMNS, ratio);
  const zeta = Number(KRUEMMERENDSTUECK_2[ratioLookup] ?? 0);

  return directResult({
    id,
    name,
    category: 'Rechteck',
    values,
    zeta,
    pressureReference: 'wA',
    velocity: values.wA,
    calculation: {
      w: roundTo(values.w, 3),
      wA: roundTo(values.wA, 3),
      wA_w: roundTo(ratio, 3),
      ratioLookup,
      lookupMode: 'floor',
      lookupModeLabel: 'wA/w exakt oder nächst kleiner',
      formula: 'ζA = Tabellenwert(wA/w); Δp = ζA × pdyn(wA)',
      referenceRows: endstueckReferenceRows(values, ratioLookup),
    },
    warnings,
  });
}
