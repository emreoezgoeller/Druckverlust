// Druckverlust Pro – T-Abzweig rund
// Berechnung der T-Abzweige aus den hinterlegten Excel-Referenztabellen.
// Die Varianten werden als Direktdruckverlust gerechnet, damit der jeweils
// richtige Bezugsdruck verwendet wird:
// - Abzweig:    Δp = ζA × pdyn(wA)
// - Durchgang:  Δp = ζD × pdyn(wD)

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const DEFAULT_RHO = 1.21;

const ALPHA_ROWS = [15, 30, 45, 60, 90];
const WD_W_COLUMNS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2];
const WA_W_COLUMNS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2];
const WA_W_COLUMNS_EXTENDED = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5];
const AA_A_ROWS = [0.1, 0.3, 0.5];

const T_ABZWEIG_DURCHGANG_RUND1 = {
  0.3: 2.2,
  0.4: 0.9,
  0.5: 0.4,
  0.6: 0.2,
  0.7: 0.1,
  0.8: 0,
  0.9: 0,
  1.0: 0,
};

const T_ABZWEIG_RUND1 = {
  ueber: {
    15: { 0.3: 5.7, 0.4: 2.4, 0.5: 1.1, 0.6: 0.6, 0.7: 0.3, 0.8: 0.2, 0.9: 0.1, 1.0: 0.1, 1.1: 0.1, 1.2: 0.1 },
    30: { 0.3: 6.3, 0.4: 2.9, 0.5: 1.5, 0.6: 0.9, 0.7: 0.6, 0.8: 0.4, 0.9: 0.3, 1.0: 0.2, 1.1: 0.2, 1.2: 0.2 },
    45: { 0.3: 7.4, 0.4: 3.7, 0.5: 2.2, 0.6: 1.4, 0.7: 1.0, 0.8: 0.8, 0.9: 0.6, 1.0: 0.5, 1.1: 0.5, 1.2: 0.5 },
    60: { 0.3: 8.8, 0.4: 4.8, 0.5: 3.0, 0.6: 2.1, 0.7: 1.6, 0.8: 1.3, 0.9: 1.0, 1.0: 0.9, 1.1: 0.8, 1.2: 0.8 },
    90: { 0.3: 12.1, 0.4: 7.3, 0.5: 5.0, 0.6: 3.8, 0.7: 3.0, 0.8: 2.6, 0.9: 2.0, 1.0: 1.8, 1.1: 1.6, 1.2: 1.5 },
  },
  gleich: {
    15: { 0.3: 5.6, 0.4: 2.4, 0.5: 1.1, 0.6: 0.5, 0.7: 0.2, 0.8: 0.1, 0.9: 0.1, 1.0: 0, 1.1: 0, 1.2: 0 },
    30: { 0.3: 6.2, 0.4: 2.8, 0.5: 1.4, 0.6: 0.7, 0.7: 0.4, 0.8: 0.3, 0.9: 0.2, 1.0: 0.1, 1.1: 0.1, 1.2: 0.1 },
    45: { 0.3: 7.0, 0.4: 3.4, 0.5: 1.8, 0.6: 1.4, 0.7: 1.1, 0.8: 0.7, 0.9: 0.4, 1.0: 0.3, 1.1: 0.2, 1.2: 0.2 },
    60: { 0.3: 8.1, 0.4: 4.1, 0.5: 2.4, 0.6: 1.5, 0.7: 1.0, 0.8: 0.7, 0.9: 0.5, 1.0: 0.4, 1.1: 0.3, 1.2: 0.2 },
    90: { 0.3: 11.1, 0.4: 6.3, 0.5: 4.0, 0.6: 2.8, 0.7: 2.0, 0.8: 1.6, 0.9: 1.2, 1.0: 1.0, 1.1: 0.8, 1.2: 0.7 },
  },
};

const T_ABZWEIG_DURCHGANG_RUND2 = {
  ueber: {
    0.1: {
      15: { 0.3: -9, 0.4: -4.5, 0.5: -2.4, 0.6: -1.3, 0.7: -0.7, 0.8: -0.3, 0.9: 0, 1.0: 0.2, 1.1: 0.3, 1.2: 0.4, 1.5: 0.6 },
      30: { 0.3: -9, 0.4: -4.4, 0.5: -2.4, 0.6: -1.3, 0.7: -0.7, 0.8: -0.3, 0.9: 0, 1.0: 0.2, 1.1: 0.3, 1.2: 0.5, 1.5: 0.6 },
      45: { 0.3: -8.9, 0.4: -4.4, 0.5: -2.4, 0.6: -1.3, 0.7: -0.6, 0.8: -0.2, 0.9: 0.1, 1.0: 0.2, 1.1: 0.4, 1.2: 0.5, 1.5: 0.7 },
      60: { 0.3: -8.9, 0.4: -4.4, 0.5: -2.3, 0.6: -1.2, 0.7: -0.6, 0.8: -0.2, 0.9: 0.1, 1.0: 0.3, 1.1: 0.4, 1.2: 0.5, 1.5: 0.7 },
      90: { 0.3: -8.8, 0.4: -4.3, 0.5: -2.2, 0.6: -1.1, 0.7: -0.5, 0.8: -0.1, 0.9: 0.2, 1.0: 0.4, 1.1: 0.5, 1.2: 0.6, 1.5: 0.8 },
    },
    0.3: {
      15: { 0.3: -6.9, 0.4: -3, 0.5: -1.4, 0.6: -0.5, 0.7: -0.1, 0.8: 0.2, 0.9: 0.3, 1.0: 0.5, 1.1: 0.5, 1.2: 0.6, 1.5: 0.6 },
      30: { 0.3: -6.8, 0.4: -2.9, 0.5: -1.3, 0.6: -0.5, 0.7: -0.1, 0.8: 0.2, 0.9: 0.4, 1.0: 0.5, 1.1: 0.6, 1.2: 0.6, 1.5: 0.7 },
      45: { 0.3: -6.7, 0.4: -2.8, 0.5: -1.2, 0.6: -0.4, 0.7: 0.1, 0.8: 0.3, 0.9: 0.5, 1.0: 0.6, 1.1: 0.7, 1.2: 0.7, 1.5: 0.8 },
      60: { 0.3: -6.6, 0.4: -2.7, 0.5: -1.1, 0.6: -0.3, 0.7: 0.2, 0.8: 0.5, 0.9: 0.6, 1.0: 0.7, 1.1: 0.8, 1.2: 0.8, 1.5: 0.9 },
      90: { 0.3: -6.3, 0.4: -2.4, 0.5: -0.8, 0.6: 0, 0.7: 0.5, 0.8: 0.8, 0.9: 0.9, 1.0: 1.0, 1.1: 1.1, 1.2: 1.1, 1.5: 1.2 },
    },
    0.5: {
      15: { 0.3: -3.8, 0.4: -1.2, 0.5: -0.3, 0.6: 0.1, 0.7: 0.2, 0.8: 0.25, 0.9: 0.3, 1.0: 0.3, 1.1: 0.3, 1.2: 0.3, 1.5: 0.25 },
      30: { 0.3: -3.7, 0.4: -1.2, 0.5: -0.3, 0.6: 0.1, 0.7: 0.3, 0.8: 0.3, 0.9: 0.3, 1.0: 0.35, 1.1: 0.3, 1.2: 0.3, 1.5: 0.3 },
      45: { 0.3: -3.6, 0.4: -1.1, 0.5: -0.1, 0.6: 0.2, 0.7: 0.4, 0.8: 0.4, 0.9: 0.4, 1.0: 0.4, 1.1: 0.4, 1.2: 0.4, 1.5: 0.4 },
      60: { 0.3: -3.4, 0.4: -0.9, 0.5: 0, 0.6: 0.4, 0.7: 0.5, 0.8: 0.5, 0.9: 0.5, 1.0: 0.5, 1.1: 0.55, 1.2: 0.5, 1.5: 0.5 },
      90: { 0.3: -3, 0.4: -0.5, 0.5: 0.3, 0.6: 0.7, 0.7: 0.8, 0.8: 0.8, 0.9: 0.8, 1.0: 0.8, 1.1: 0.8, 1.2: 0.8, 1.5: 0.8 },
    },
  },
  gleich: {
    0.1: {
      15: { 0.3: -11.3, 0.4: -5.7, 0.5: -3.2, 0.6: -1.8, 0.7: -1.1, 0.8: -0.6, 0.9: -0.2, 1.0: 0, 1.1: 0.2, 1.2: 0.3, 1.5: 0.5 },
      30: { 0.3: -11.3, 0.4: -5.7, 0.5: -3.2, 0.6: -1.9, 0.7: -1.1, 0.8: -0.6, 0.9: -0.2, 1.0: 0, 1.1: 0.2, 1.2: 0.3, 1.5: 0.6 },
      45: { 0.3: -11.3, 0.4: -5.7, 0.5: -3.2, 0.6: -1.8, 0.7: -1, 0.8: -0.5, 0.9: -0.2, 1.0: 0.1, 1.1: 0.2, 1.2: 0.4, 1.5: 0.6 },
      60: { 0.3: -11.2, 0.4: -5.6, 0.5: -3.1, 0.6: -1.8, 0.7: -1, 0.8: -0.5, 0.9: -0.1, 1.0: 0.1, 1.1: 0.3, 1.2: 0.4, 1.5: 0.6 },
      90: { 0.3: -11.1, 0.4: -5.6, 0.5: -3, 0.6: -1.7, 0.7: -0.9, 0.8: -0.4, 0.9: 0, 1.0: 0.2, 1.1: 0.4, 1.2: 0.5, 1.5: 0.7 },
    },
    0.3: {
      15: { 0.3: -18, 0.4: -9.4, 0.5: -5.5, 0.6: -3.4, 0.7: -2.2, 0.8: -1.4, 0.9: -0.9, 1.0: -0.5, 1.1: -0.2, 1.2: 0, 1.5: 0.3 },
      30: { 0.3: -17.9, 0.4: -9.4, 0.5: -5.5, 0.6: -3.4, 0.7: -2.2, 0.8: -1.4, 0.9: -0.9, 1.0: -0.5, 1.1: -0.2, 1.2: 0, 1.5: 0.4 },
      45: { 0.3: -17.9, 0.4: -9.4, 0.5: -5.5, 0.6: -3.4, 0.7: -2.1, 0.8: -1.4, 0.9: -0.8, 1.0: -0.5, 1.1: -0.2, 1.2: 0, 1.5: 0.4 },
      60: { 0.3: -17.9, 0.4: -9.3, 0.5: -5.4, 0.6: -3.3, 0.7: -2.1, 0.8: -1.3, 0.9: -0.8, 1.0: -0.4, 1.1: -0.1, 1.2: 0.1, 1.5: 0.4 },
      90: { 0.3: -15.5, 0.4: -8, 0.5: -4.5, 0.6: -2.7, 0.7: -1.6, 0.8: -0.9, 0.9: -0.5, 1.0: -0.1, 1.1: 0.1, 1.2: 0.3, 1.5: 0.6 },
    },
    0.5: {
      15: { 0.3: -29.9, 0.4: -16, 0.5: -9.6, 0.6: -6.2, 0.7: -4.2, 0.8: -2.9, 0.9: -2.1, 1.0: -1.4, 1.1: -1, 1.2: -0.7, 1.5: 0 },
      30: { 0.3: -29.9, 0.4: -16, 0.5: -9.6, 0.6: -6.2, 0.7: -4.2, 0.8: -2.9, 0.9: -2, 1.0: -1.4, 1.1: -1, 1.2: -0.6, 1.5: 0 },
      45: { 0.3: -29.8, 0.4: -15.9, 0.5: -9.6, 0.6: -6.2, 0.7: -4.2, 0.8: -2.9, 0.9: -2, 1.0: -1.4, 1.1: -0.9, 1.2: -0.6, 1.5: 0 },
      60: { 0.3: -28.7, 0.4: -15.3, 0.5: -9.1, 0.6: -5.9, 0.7: -3.9, 0.8: -2.7, 0.9: -1.8, 1.0: -1.2, 1.1: -0.8, 1.2: -0.5, 1.5: 0.1 },
      90: { 0.3: -26.9, 0.4: -14.2, 0.5: -8.4, 0.6: -5.4, 0.7: -3.5, 0.8: -2.3, 0.9: -1.5, 1.0: -1, 1.1: -0.6, 1.2: -0.3, 1.5: 0.3 },
    },
  },
};

const T_ABZWEIG_RUND2 = {
  ueber: {
    0.1: T_ABZWEIG_RUND1.ueber,
    0.3: T_ABZWEIG_DURCHGANG_RUND2.gleich[0.3],
    0.5: T_ABZWEIG_DURCHGANG_RUND2.gleich[0.5],
  },
  gleich: {
    0.1: T_ABZWEIG_RUND1.gleich,
    0.3: T_ABZWEIG_DURCHGANG_RUND2.gleich[0.3],
    0.5: T_ABZWEIG_DURCHGANG_RUND2.gleich[0.5],
  },
};

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

function lookupValue(list = [], value, mode = 'ceil') {
  return LookupEngine.lookup(list.map(x => ({ x, value: x })), value, { mode });
}

function getCondition(values = {}) {
  return values.bedingung || 'ueber';
}

function conditionLabel(condition) {
  return condition === 'gleich'
    ? 'AA + AD = A'
    : 'AA + AD > A; AD = A';
}

function referenceRows(values = {}, calculation = {}, options = {}) {
  const rows = [
    { label: 'Hauptluftmenge W', value: toNumber(values.W), suffix: 'm³/h', digits: 0 },
    { label: 'Hauptgeschwindigkeit w', value: calculation.w ?? values.w, suffix: 'm/s', digits: 2 },
  ];

  if (options.includeThrough !== false) {
    rows.push(
      { label: 'Durchgangsluftmenge WD', value: toNumber(values.WD), suffix: 'm³/h', digits: 0 },
      { label: 'Durchgangsgeschwindigkeit wD', value: calculation.wD ?? values.wD, suffix: 'm/s', digits: 2 },
    );
  }

  if (options.includeBranch !== false) {
    rows.push(
      { label: 'Abzweigluftmenge WA', value: toNumber(values.WA), suffix: 'm³/h', digits: 0 },
      { label: 'Abzweiggeschwindigkeit wA', value: calculation.wA ?? values.wA, suffix: 'm/s', digits: 2 },
    );
  }

  if (options.includeWdRatio) {
    rows.push({ label: 'Verhältnis WD/W', value: calculation.WD_W ?? values.WD_W, digits: 3 });
  }

  if (options.includeWaVelocityRatio) {
    rows.push({ label: 'Verhältnis wA/w', value: calculation.wA_w ?? values.wA_w, digits: 3 });
  }

  if (options.includeAreaRatio) {
    rows.push({ label: 'Flächenverhältnis AA/A', value: calculation.AA_A ?? values.AA_A, digits: 3 });
  }

  return rows;
}

function commonWarnings(values = {}, { requireBranch = true, requireThrough = true } = {}) {
  const warnings = [];
  const blockingWarnings = [];

  if (toNumber(values.W) <= 0) blockingWarnings.push('Hauptluftmenge W fehlt oder ist 0.');
  if (requireBranch && toNumber(values.WA) <= 0) blockingWarnings.push('Abzweigluftmenge WA fehlt oder ist 0.');
  if (requireThrough && toNumber(values.WD) <= 0) blockingWarnings.push('Durchgangsluftmenge WD fehlt oder ist 0.');
  if (toNumber(values.w) <= 0) blockingWarnings.push('Hauptgeschwindigkeit w konnte nicht berechnet werden.');
  if (requireBranch && toNumber(values.wA) <= 0) blockingWarnings.push('Abzweiggeschwindigkeit wA konnte nicht berechnet werden.');
  if (requireThrough && toNumber(values.wD) <= 0) blockingWarnings.push('Durchgangsgeschwindigkeit wD konnte nicht berechnet werden.');

  return { warnings, blockingWarnings };
}

function addLookupWarnings(warnings, value, columns, label) {
  const min = Math.min(...columns);
  const max = Math.max(...columns);

  if (value > 0 && value < min) warnings.push(`${label} liegt unter ${min}. Es wird der kleinste Tabellenwert ${min} verwendet.`);
  if (value > max) warnings.push(`${label} liegt über ${max}. Es wird der grösste Tabellenwert ${max} verwendet.`);
}

function createBlockingResult({ id, name, values, warnings, referenceOptions }) {
  return new FormPartResult({
    id,
    name,
    category: 'Abzweige',
    input: { ...values },
    calculation: {
      lossMode: 'direct',
      pressureReference: '-',
      dynamicPressurePa: 0,
      pressureLossPa: 0,
      referenceRows: referenceRows(values, values, referenceOptions),
    },
    zeta: 0,
    warnings,
  });
}

function createDirectResult({ id, name, values, zeta, pressureReference, velocity, calculation, warnings }) {
  const dynamicPressurePa = dynamicPressure(velocity);
  const pressureLossPa = zeta * dynamicPressurePa;

  return new FormPartResult({
    id,
    name,
    category: 'Abzweige',
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

export function calculateTAbzweigDurchgangRund1(values = {}) {
  const id = 't_abzweig_durchgang_rund1';
  const name = 'T-Abzweig Durchgang rund 1';
  const ratio = toNumber(values.WD_W) || (toNumber(values.W) > 0 ? toNumber(values.WD) / toNumber(values.W) : 0);
  const { warnings, blockingWarnings } = commonWarnings(values, { requireBranch: false, requireThrough: true });
  addLookupWarnings(warnings, ratio, Object.keys(T_ABZWEIG_DURCHGANG_RUND1).map(Number), 'WD/W');

  if (blockingWarnings.length) {
    return createBlockingResult({ id, name, values, warnings: blockingWarnings, referenceOptions: { includeWdRatio: true, includeBranch: false } });
  }

  const ratioLookup = lookupValue(Object.keys(T_ABZWEIG_DURCHGANG_RUND1).map(Number), ratio, 'floor');
  const zeta = Number(T_ABZWEIG_DURCHGANG_RUND1[ratioLookup] ?? 0);

  return createDirectResult({
    id,
    name,
    values,
    zeta,
    pressureReference: 'wD',
    velocity: values.wD,
    calculation: {
      W: toNumber(values.W),
      WD: toNumber(values.WD),
      WA: toNumber(values.WA),
      w: roundTo(values.w, 3),
      wD: roundTo(values.wD, 3),
      wA: roundTo(values.wA, 3),
      WD_W: roundTo(ratio, 3),
      ratioLookup,
      lookupMode: 'floor',
      lookupModeLabel: 'exakt oder nächst kleinerer Tabellenwert',
      formula: 'ζD = Tabellenwert(WD/W); Δp = ζD × pdyn(wD)',
      referenceRows: referenceRows(values, values, { includeWdRatio: true, includeBranch: false }),
    },
    warnings,
  });
}

export function calculateTAbzweigRund1(values = {}) {
  const id = 't_abzweig_rund1';
  const name = 'T-Abzweig rund 1';
  const condition = getCondition(values);
  const ratio = toNumber(values.WD_W) || (toNumber(values.W) > 0 ? toNumber(values.WD) / toNumber(values.W) : 0);
  const alpha = toNumber(values.alpha, 90);
  const { warnings, blockingWarnings } = commonWarnings(values, { requireBranch: true, requireThrough: true });
  addLookupWarnings(warnings, ratio, WD_W_COLUMNS, 'WD/W');

  if (blockingWarnings.length) {
    return createBlockingResult({ id, name, values, warnings: blockingWarnings, referenceOptions: { includeWdRatio: true, includeBranch: false } });
  }

  const alphaLookup = lookupValue(ALPHA_ROWS, alpha, 'ceil');
  const ratioLookup = lookupValue(WD_W_COLUMNS, ratio, 'floor');
  const zeta = Number(T_ABZWEIG_RUND1[condition]?.[alphaLookup]?.[ratioLookup] ?? 0);

  return createDirectResult({
    id,
    name,
    values,
    zeta,
    pressureReference: 'wA',
    velocity: values.wA,
    calculation: {
      W: toNumber(values.W),
      WD: toNumber(values.WD),
      WA: toNumber(values.WA),
      w: roundTo(values.w, 3),
      wD: roundTo(values.wD, 3),
      wA: roundTo(values.wA, 3),
      WD_W: roundTo(ratio, 3),
      ratioLookup,
      alpha: alphaLookup,
      alphaLookup,
      condition,
      conditionLabel: conditionLabel(condition),
      lookupMode: 'floor/ceil',
      lookupModeLabel: 'WD/W exakt oder nächst kleiner; α exakt oder nächst grösser',
      formula: 'ζA = Tabellenwert(α, WD/W); Δp = ζA × pdyn(wA)',
      referenceRows: [
        ...referenceRows(values, values, { includeWdRatio: true }),
        { label: 'Bedingung', value: conditionLabel(condition) },
      ],
    },
    warnings,
  });
}

function lookupAreaBand(areaRatio) {
  const ratio = toNumber(areaRatio);

  // Excel-Vorlage: IF(AA/A <= 0.2, Tabelle 0.1,
  //                    IF(AA/A <= 0.4, Tabelle 0.3, Tabelle 0.5))
  if (ratio <= 0.2) return 0.1;
  if (ratio <= 0.4) return 0.3;
  return 0.5;
}

function lookupTAbzweigRund2(table, condition, areaRatio, alpha, velocityRatio, ratioColumns) {
  const areaLookup = lookupAreaBand(areaRatio);
  const alphaLookup = lookupValue(ALPHA_ROWS, alpha, 'floor');
  const ratioLookup = lookupValue(ratioColumns, velocityRatio, 'floor');
  const zeta = Number(table[condition]?.[areaLookup]?.[alphaLookup]?.[ratioLookup] ?? 0);

  return { areaLookup, alphaLookup, ratioLookup, zeta };
}

export function calculateTAbzweigDurchgangRund2(values = {}) {
  const id = 't_abzweig_durchgang_rund2';
  const name = 'T-Abzweig Durchgang rund 2';
  const condition = getCondition(values);
  const velocityRatio = toNumber(values.wA_w) || (toNumber(values.w) > 0 ? toNumber(values.wA) / toNumber(values.w) : 0);
  const areaRatio = toNumber(values.AA_A) || (toNumber(values.A_area) > 0 ? toNumber(values.AA_area) / toNumber(values.A_area) : 0);
  const alpha = toNumber(values.alpha, 90);
  const { warnings, blockingWarnings } = commonWarnings(values, { requireBranch: true, requireThrough: true });
  addLookupWarnings(warnings, velocityRatio, WA_W_COLUMNS_EXTENDED, 'wA/w');
  addLookupWarnings(warnings, areaRatio, AA_A_ROWS, 'AA/A');

  if (blockingWarnings.length) {
    return createBlockingResult({ id, name, values, warnings: blockingWarnings, referenceOptions: { includeWaVelocityRatio: true, includeAreaRatio: true } });
  }

  const lookup = lookupTAbzweigRund2(T_ABZWEIG_DURCHGANG_RUND2, condition, areaRatio, alpha, velocityRatio, WA_W_COLUMNS_EXTENDED);

  return createDirectResult({
    id,
    name,
    values,
    zeta: lookup.zeta,
    pressureReference: 'wD',
    velocity: values.wD,
    calculation: {
      W: toNumber(values.W),
      WD: toNumber(values.WD),
      WA: toNumber(values.WA),
      w: roundTo(values.w, 3),
      wD: roundTo(values.wD, 3),
      wA: roundTo(values.wA, 3),
      wA_w: roundTo(velocityRatio, 3),
      AA_A: roundTo(areaRatio, 3),
      ratioLookup: lookup.ratioLookup,
      areaLookup: lookup.areaLookup,
      alphaLookup: lookup.alphaLookup,
      condition,
      conditionLabel: conditionLabel(condition),
      lookupMode: 'AA/A: Excel-Band; α und wA/w: floor',
      lookupModeLabel: 'Flächenband gemäss Excel; α und wA/w exakt oder nächst kleiner',
      formula: 'ζD = Tabellenwert(AA/A, α, wA/w); Δp = ζD × pdyn(wD)',
      referenceRows: [
        ...referenceRows(values, values, { includeWaVelocityRatio: true, includeAreaRatio: true }),
        { label: 'Bedingung', value: conditionLabel(condition) },
      ],
    },
    warnings,
  });
}

export function calculateTAbzweigRund2(values = {}) {
  const id = 't_abzweig_rund2';
  const name = 'T-Abzweig rund 2';
  const condition = getCondition(values);
  const velocityRatio = toNumber(values.wA_w) || (toNumber(values.w) > 0 ? toNumber(values.wA) / toNumber(values.w) : 0);
  const areaRatio = toNumber(values.AA_A) || (toNumber(values.A_area) > 0 ? toNumber(values.AA_area) / toNumber(values.A_area) : 0);
  const alpha = toNumber(values.alpha, 90);
  const { warnings, blockingWarnings } = commonWarnings(values, { requireBranch: true, requireThrough: false });
  addLookupWarnings(warnings, velocityRatio, WA_W_COLUMNS, 'wA/w');
  addLookupWarnings(warnings, areaRatio, AA_A_ROWS, 'AA/A');

  if (blockingWarnings.length) {
    return createBlockingResult({ id, name, values, warnings: blockingWarnings, referenceOptions: { includeWaVelocityRatio: true, includeAreaRatio: true } });
  }

  const lookup = lookupTAbzweigRund2(T_ABZWEIG_RUND2, condition, areaRatio, alpha, velocityRatio, WA_W_COLUMNS);

  return createDirectResult({
    id,
    name,
    values,
    zeta: lookup.zeta,
    pressureReference: 'wA',
    velocity: values.wA,
    calculation: {
      W: toNumber(values.W),
      WD: toNumber(values.WD),
      WA: toNumber(values.WA),
      w: roundTo(values.w, 3),
      wD: roundTo(values.wD, 3),
      wA: roundTo(values.wA, 3),
      wA_w: roundTo(velocityRatio, 3),
      AA_A: roundTo(areaRatio, 3),
      ratioLookup: lookup.ratioLookup,
      areaLookup: lookup.areaLookup,
      alphaLookup: lookup.alphaLookup,
      condition,
      conditionLabel: conditionLabel(condition),
      lookupMode: 'AA/A: Excel-Band; α und wA/w: floor',
      lookupModeLabel: 'Flächenband gemäss Excel; α und wA/w exakt oder nächst kleiner',
      formula: 'ζA = Tabellenwert(AA/A, α, wA/w); Δp = ζA × pdyn(wA)',
      referenceRows: [
        ...referenceRows(values, values, { includeWaVelocityRatio: true, includeAreaRatio: true }),
        { label: 'Bedingung', value: conditionLabel(condition) },
      ],
    },
    warnings,
  });
}
