// Druckverlust Pro – Hosenstück
// Berechnung nach Tabellenlogik:
// ζA-Wert bezogen auf wA
// Tabellenachsen: α und wA/w

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const DEFAULT_RHO = 1.21;

const RATIO_COLUMNS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

const HOSENSTUECK_TABLE = [
  { alpha: 5, values: { 0.5: 1.01, 0.6: 0.45, 0.7: 0.19, 0.8: 0.07, 0.9: 0.02, 1.0: 0.00 } },
  { alpha: 15, values: { 0.5: 1.13, 0.6: 0.54, 0.7: 0.25, 0.8: 0.11, 0.9: 0.05, 1.0: 0.03 } },
  { alpha: 30, values: { 0.5: 1.53, 0.6: 0.81, 0.7: 0.46, 0.8: 0.27, 0.9: 0.18, 1.0: 0.13 } },
  { alpha: 45, values: { 0.5: 2.20, 0.6: 1.23, 0.7: 0.80, 0.8: 0.53, 0.9: 0.38, 1.0: 0.30 } },
  { alpha: 60, values: { 0.5: 3.13, 0.6: 1.93, 0.7: 1.27, 0.8: 0.90, 0.9: 0.67, 1.0: 0.53 } },
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

function rectangleAreaMm(widthMm, heightMm) {
  const width = toNumber(widthMm);
  const height = toNumber(heightMm);
  return width > 0 && height > 0 ? (width * height) / 1_000_000 : 0;
}

function circleAreaMm(diameterMm) {
  const diameter = toNumber(diameterMm);
  return diameter > 0 ? (Math.PI * diameter * diameter / 4) / 1_000_000 : 0;
}

function velocityFromAirflow(volumeFlowM3h, areaM2) {
  const q = toNumber(volumeFlowM3h);
  const area = toNumber(areaM2);
  return q > 0 && area > 0 ? q / (3600 * area) : 0;
}

function dynamicPressure(velocityMs, rho = DEFAULT_RHO) {
  const velocity = toNumber(velocityMs);
  const density = toNumber(rho, DEFAULT_RHO);
  return velocity > 0 && density > 0 ? 0.5 * density * velocity * velocity : 0;
}

function getGeometry(values = {}) {
  const bauform = String(values.bauform || 'Kanal');
  const isPipe = bauform === 'Rohr';

  const mainArea = toNumber(values.A_area) || (isPipe
    ? circleAreaMm(values.A_d)
    : rectangleAreaMm(values.A_breite, values.A_hoehe));

  const branchArea = toNumber(values.AA_area) || (isPipe
    ? circleAreaMm(values.AA_d)
    : rectangleAreaMm(values.AA_breite, values.AA_hoehe));

  const w = toNumber(values.w) || velocityFromAirflow(values.W, mainArea);
  const wA = toNumber(values.wA) || velocityFromAirflow(values.WA, branchArea);
  const ratio = w > 0 ? wA / w : 0;

  return {
    bauform,
    mainArea,
    branchArea,
    w,
    wA,
    ratio,
  };
}

function lookupCeilValue(list = [], value) {
  return LookupEngine.lookup(list.map(x => ({ x, value: x })), value, { mode: 'ceil' });
}

function lookupZeta(alpha, ratio) {
  const alphaLookup = lookupCeilValue(HOSENSTUECK_TABLE.map(row => row.alpha), alpha);
  const ratioLookup = lookupCeilValue(RATIO_COLUMNS, ratio);
  const row = HOSENSTUECK_TABLE.find(item => Number(item.alpha) === Number(alphaLookup));
  const zeta = Number(row?.values?.[ratioLookup] ?? 0);

  return {
    alphaLookup,
    ratioLookup,
    zeta,
  };
}

export function calculateHosenstueck(values = {}) {
  const alpha = toNumber(values.alpha, 45);
  const W = toNumber(values.W);
  const WA = toNumber(values.WA);
  const geometry = getGeometry(values);
  const warnings = [];
  const blockingWarnings = [];

  if (alpha <= 0) blockingWarnings.push('Winkel α fehlt oder ist 0.');
  if (W <= 0) blockingWarnings.push('Hauptluftmenge W fehlt oder ist 0.');
  if (WA <= 0) blockingWarnings.push('Abzweigluftmenge WA fehlt oder ist 0.');
  if (geometry.mainArea <= 0) blockingWarnings.push('Hauptanschluss A ist nicht vollständig definiert.');
  if (geometry.branchArea <= 0) blockingWarnings.push('Abzweig AA ist nicht vollständig definiert.');
  if (geometry.w <= 0) blockingWarnings.push('Hauptgeschwindigkeit w konnte nicht berechnet werden.');
  if (geometry.wA <= 0) blockingWarnings.push('Abzweiggeschwindigkeit wA konnte nicht berechnet werden.');

  if (geometry.ratio > 0 && geometry.ratio < 0.5) {
    warnings.push('wA/w liegt unter 0.5. Es wird der kleinste Tabellenwert 0.5 verwendet.');
  }

  if (geometry.ratio > 1.0) {
    warnings.push('wA/w liegt über 1.0. Es wird der grösste Tabellenwert 1.0 verwendet.');
  }

  if (blockingWarnings.length) {
    return new FormPartResult({
      id: 'hosenstueck',
      name: 'Hosenstück',
      category: 'Abzweige',
      input: values,
      calculation: {
        bauform: geometry.bauform,
        mainArea: geometry.mainArea,
        branchArea: geometry.branchArea,
        w: geometry.w,
        wA: geometry.wA,
        ratio: geometry.ratio,
        pressureReference: 'wA',
        lossMode: 'direct',
      },
      zeta: 0,
      warnings: blockingWarnings,
    });
  }

  const lookup = lookupZeta(alpha, geometry.ratio);
  const pdynA = dynamicPressure(geometry.wA);
  const pressureLossPa = lookup.zeta * pdynA;

  return new FormPartResult({
    id: 'hosenstueck',
    name: 'Hosenstück',
    category: 'Abzweige',
    input: values,
    calculation: {
      bauform: geometry.bauform,
      mainArea: roundTo(geometry.mainArea, 6),
      branchArea: roundTo(geometry.branchArea, 6),
      w: roundTo(geometry.w, 3),
      wA: roundTo(geometry.wA, 3),
      ratio: roundTo(geometry.ratio, 3),
      alpha,
      alphaLookup: lookup.alphaLookup,
      ratioLookup: lookup.ratioLookup,
      dynamicPressurePa: roundTo(pdynA, 3),
      pressureLossPa: roundTo(pressureLossPa, 3),
      pressureReference: 'wA',
      lossMode: 'direct',
      formula: 'ζA = Tabellenwert(α, wA/w); Δp = ζA × pdyn(wA)',
      lookupMode: 'ceil',
      lookupModeLabel: 'exakt oder nächst grösserer Tabellenwert',
    },
    zeta: lookup.zeta,
    warnings,
  });
}

export default calculateHosenstueck;
