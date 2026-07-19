// Druckverlust Pro – 90° T-Stück
// Berechnung nach Tabellenlogik aus Excel:
// - t_stueck_90: ζ oder ζA über wA/w
// - t_stueck_90_2: ζA über AA/A und wA/w
// Bei ζA ist der Druckverlust auf wA bezogen.
// Bei ζ ist der Druckverlust auf w bezogen.

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const DEFAULT_RHO = 1.21;

const T_STUECK_90_RATIO_COLUMNS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

const T_STUECK_90_ZETA = {
  0.3: 1.03,
  0.4: 1.05,
  0.5: 1.08,
  0.6: 1.11,
  0.7: 1.15,
  0.8: 1.19,
  0.9: 1.24,
  1.0: 1.30,
};

const T_STUECK_90_ZETA_A = {
  0.3: 11.40,
  0.4: 6.55,
  0.5: 4.30,
  0.6: 3.09,
  0.7: 2.34,
  0.8: 1.86,
  0.9: 1.53,
  1.0: 1.30,
};

const T_STUECK_90_2_RATIO_COLUMNS = [0.4, 0.6, 0.8, 1.0, 1.2];
const T_STUECK_90_2_AREA_ROWS = [0.5, 0.75, 1.0];

const T_STUECK_90_2_TABLE = {
  0.5: { 0.4: 19.30, 0.6: 6.90, 0.8: 3.30, 1.0: 2.00, 1.2: 1.50 },
  0.75: { 0.4: 10.40, 0.6: 4.10, 0.8: 2.30, 1.0: 1.80, 1.2: 1.60 },
  1.0: { 0.4: 8.00, 0.6: 3.60, 0.8: 2.40, 1.0: 2.00, 1.2: 2.00 },
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

function referenceRows(values = {}, calculation = {}) {
  return [
    { label: 'Hauptluftmenge W', value: toNumber(values.W), suffix: 'm³/h', digits: 0 },
    { label: 'Hauptgeschwindigkeit w', value: calculation.w ?? values.w, suffix: 'm/s', digits: 2 },
    { label: 'Abzweigluftmenge WA', value: toNumber(values.WA), suffix: 'm³/h', digits: 0 },
    { label: 'Abzweiggeschwindigkeit wA', value: calculation.wA ?? values.wA, suffix: 'm/s', digits: 2 },
  ];
}

function commonWarnings(values = {}, ratio = 0, { minRatio = 0.3, maxRatio = 1.0 } = {}) {
  const warnings = [];
  const blockingWarnings = [];
  const W = toNumber(values.W);
  const WA = toNumber(values.WA);
  const w = toNumber(values.w);
  const wA = toNumber(values.wA);

  if (W <= 0) blockingWarnings.push('Hauptluftmenge W fehlt oder ist 0.');
  if (WA <= 0) blockingWarnings.push('Abzweigluftmenge WA fehlt oder ist 0.');
  if (w <= 0) blockingWarnings.push('Hauptgeschwindigkeit w konnte nicht berechnet werden.');
  if (wA <= 0) blockingWarnings.push('Abzweiggeschwindigkeit wA konnte nicht berechnet werden.');

  if (ratio > 0 && ratio < minRatio) {
    warnings.push(`wA/w liegt unter ${minRatio}. Es wird der kleinste Tabellenwert ${minRatio} verwendet.`);
  }

  if (ratio > maxRatio) {
    warnings.push(`wA/w liegt über ${maxRatio}. Es wird der grösste Tabellenwert ${maxRatio} verwendet.`);
  }

  return { warnings, blockingWarnings };
}

function createBlockingResult({ id, name, values, ratio, warnings }) {
  return new FormPartResult({
    id,
    name,
    category: 'Abzweige',
    input: { ...values },
    calculation: {
      ratio,
      formula: 'ζ = Tabellenwert(wA/w)',
      referenceRows: referenceRows(values, values),
    },
    zeta: 0,
    warnings,
  });
}

export function calculateTStueck90(values = {}) {
  const name = '90° T-Stück';
  const ratio = toNumber(values.wA_w) || (toNumber(values.w) > 0 ? toNumber(values.wA) / toNumber(values.w) : 0);
  const bezug = values.bezug || 'abzweig';
  const { warnings, blockingWarnings } = commonWarnings(values, ratio);

  if (blockingWarnings.length) {
    return createBlockingResult({
      id: 't_stueck_90',
      name,
      values,
      ratio,
      warnings: blockingWarnings,
    });
  }

  const ratioLookup = lookupValue(T_STUECK_90_RATIO_COLUMNS, ratio, 'ceil');
  const zeta = bezug === 'durchgang'
    ? Number(T_STUECK_90_ZETA[ratioLookup] ?? 0)
    : Number(T_STUECK_90_ZETA_A[ratioLookup] ?? 0);
  const pressureReference = bezug === 'durchgang' ? 'w' : 'wA';
  const pressureVelocity = bezug === 'durchgang' ? toNumber(values.w) : toNumber(values.wA);
  const dynamicPressurePa = dynamicPressure(pressureVelocity);
  const pressureLossPa = zeta * dynamicPressurePa;

  return new FormPartResult({
    id: 't_stueck_90',
    name,
    category: 'Abzweige',
    input: { ...values, bezug },
    calculation: {
      lossMode: 'direct',
      pressureReference,
      dynamicPressurePa: roundTo(dynamicPressurePa, 3),
      pressureLossPa: roundTo(pressureLossPa, 3),
      W: toNumber(values.W),
      WA: toNumber(values.WA),
      w: roundTo(values.w, 3),
      wA: roundTo(values.wA, 3),
      ratio: roundTo(ratio, 3),
      ratioLookup,
      bezug,
      formula: bezug === 'durchgang'
        ? 'ζ = Tabellenwert(wA/w); Δp = ζ × pdyn(w)'
        : 'ζA = Tabellenwert(wA/w); Δp = ζA × pdyn(wA)',
      lookupMode: 'ceil',
      lookupModeLabel: 'exakt oder nächst grösserer Tabellenwert',
      referenceRows: referenceRows(values, values),
    },
    zeta,
    warnings,
  });
}

export function calculateTStueck90Variante2(values = {}) {
  const name = '90° T-Stück Variante 2';
  const ratio = toNumber(values.wA_w) || (toNumber(values.w) > 0 ? toNumber(values.wA) / toNumber(values.w) : 0);
  const areaRatio = toNumber(values.AA_A) || (toNumber(values.A_area) > 0 ? toNumber(values.AA_area) / toNumber(values.A_area) : 0);
  const { warnings, blockingWarnings } = commonWarnings(values, ratio, { minRatio: 0.4, maxRatio: 1.2 });

  if (toNumber(values.A_area) <= 0) blockingWarnings.push('Hauptanschluss A ist nicht vollständig definiert.');
  if (toNumber(values.AA_area) <= 0) blockingWarnings.push('Abzweig AA ist nicht vollständig definiert.');

  if (areaRatio > 0 && areaRatio < 0.5) {
    warnings.push('AA/A liegt unter 0.5. Es wird der kleinste Tabellenwert 0.5 verwendet.');
  }

  if (areaRatio > 1.0) {
    warnings.push('AA/A liegt über 1.0. Es wird der grösste Tabellenwert 1.0 verwendet.');
  }


  if (blockingWarnings.length) {
    return createBlockingResult({
      id: 't_stueck_90_2',
      name,
      values,
      ratio,
      warnings: blockingWarnings,
    });
  }

  const areaLookup = lookupValue(T_STUECK_90_2_AREA_ROWS, areaRatio, 'ceil');
  const ratioLookup = lookupValue(T_STUECK_90_2_RATIO_COLUMNS, ratio, 'floor');
  const zeta = Number(T_STUECK_90_2_TABLE[areaLookup]?.[ratioLookup] ?? 0);
  const dynamicPressurePa = dynamicPressure(values.wA);
  const pressureLossPa = zeta * dynamicPressurePa;

  return new FormPartResult({
    id: 't_stueck_90_2',
    name,
    category: 'Abzweige',
    input: { ...values },
    calculation: {
      lossMode: 'direct',
      pressureReference: 'wA',
      dynamicPressurePa: roundTo(dynamicPressurePa, 3),
      pressureLossPa: roundTo(pressureLossPa, 3),
      W: toNumber(values.W),
      WA: toNumber(values.WA),
      w: roundTo(values.w, 3),
      wA: roundTo(values.wA, 3),
      ratio: roundTo(ratio, 3),
      ratioLookup,
      areaRatio: roundTo(areaRatio, 3),
      areaLookup,
      formula: 'ζA = Tabellenwert(AA/A, wA/w); Δp = ζA × pdyn(wA)',
      lookupMode: 'AA/A: ceil; wA/w: floor',
      lookupModeLabel: 'AA/A auf nächst grössere Tabellenzeile; wA/w exakt oder nächst kleiner gemäss Excel',
      referenceRows: [
        ...referenceRows(values, values),
        { label: 'Flächenverhältnis AA/A', value: roundTo(areaRatio, 3), digits: 3 },
      ],
    },
    zeta,
    warnings,
  });
}

export default calculateTStueck90;
