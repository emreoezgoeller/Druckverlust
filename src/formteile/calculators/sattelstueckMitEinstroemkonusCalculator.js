// Druckverlust Pro – Sattelstück mit Einströmkonus
// Berechnung nach Tabellenlogik aus Excel:
// Abzweig: Widerstandsbeiwert ζ bezogen auf w
// Tabellenachse: Geschwindigkeitsverhältnis wA/w
// Kurve a: h ≈ dA/2
// Kurve b: h ≈ 2dA

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const DEFAULT_RHO = 1.21;

const RATIO_COLUMNS = [
  0.05,
  0.10,
  0.15,
  0.20,
  0.30,
  0.40,
  0.50,
  0.60,
  0.70,
  0.80,
  0.90,
  1.00,
  1.20,
  1.40,
  1.60,
  1.80,
  2.00,
  2.20,
  2.40,
  2.60,
  2.80,
  3.00,
  3.50,
  4.00,
];

const ZETA_W_CURVE_A = {
  0.05: 0.80,
  0.10: 0.80,
  0.15: 0.80,
  0.20: 0.80,
  0.30: 0.80,
  0.40: 0.80,
  0.50: 0.7978564167226655,
  0.60: 0.80,
  0.70: 0.8078206173868188,
  0.80: 0.82,
  0.90: 0.8363566918691033,
  1.00: 0.86,
  1.20: 0.9338849734779138,
  1.40: 1.037897945930334,
  1.60: 1.168535631202458,
  1.80: 1.323383712026217,
  2.00: 1.50,
  2.20: 1.69711749901771,
  2.40: 1.914959300568171,
  2.60: 2.154192097045465,
  2.80: 2.415589861906614,
  3.00: 2.70,
  3.50: 3.5177102341978,
  4.00: 4.50,
};

const ZETA_W_CURVE_B = {
  0.05: 0.80,
  0.10: 0.80,
  0.15: 0.80,
  0.20: 0.80,
  0.30: 0.7703966237253098,
  0.40: 0.72,
  0.50: 0.6621916406332476,
  0.60: 0.61,
  0.70: 0.5681434305493469,
  0.80: 0.54,
  0.90: 0.5250343124520873,
  1.00: 0.52,
  1.20: 0.54,
  1.40: 0.6243879327552975,
  1.60: 0.8033931021896927,
  1.80: 1.079061525773939,
  2.00: 1.40,
  2.20: 1.702018288348692,
  2.40: 1.973152743832357,
  2.60: 2.223111562713318,
  2.80: 2.46489581066244,
  3.00: 2.712075166751802,
  3.50: 3.440422154632771,
  4.00: 4.50,
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

function curveLabel(curve) {
  return curve === 'b'
    ? 'Kurve b – h ≈ 2dA'
    : 'Kurve a – h ≈ dA/2';
}

function zetaTableByCurve(curve) {
  return curve === 'b' ? ZETA_W_CURVE_B : ZETA_W_CURVE_A;
}

function referenceRows(values = {}, calculation = {}) {
  return [
    { label: 'Hauptluftmenge W', value: toNumber(values.W), suffix: 'm³/h', digits: 0 },
    { label: 'Hauptgeschwindigkeit w', value: calculation.w ?? values.w, suffix: 'm/s', digits: 2 },
    { label: 'Abzweigluftmenge WA', value: toNumber(values.WA), suffix: 'm³/h', digits: 0 },
    { label: 'Abzweiggeschwindigkeit wA', value: calculation.wA ?? values.wA, suffix: 'm/s', digits: 2 },
    { label: 'Verhältnis wA/w', value: calculation.ratio ?? values.wA_w, digits: 3 },
    { label: 'Einströmkonus', value: curveLabel(calculation.curve ?? values.curve) },
  ];
}

function createBlockingResult({ values, warnings }) {
  return new FormPartResult({
    id: 'sattelstueck_mit_einstroemkonus',
    name: 'Sattelstück mit Einströmkonus',
    category: 'Abzweige',
    input: { ...values },
    calculation: {
      lossMode: 'direct',
      pressureReference: 'w',
      dynamicPressurePa: 0,
      pressureLossPa: 0,
      referenceRows: referenceRows(values, values),
    },
    zeta: 0,
    warnings,
  });
}

export function calculateSattelstueckMitEinstroemkonus(values = {}) {
  const ratio = toNumber(values.wA_w) || (toNumber(values.w) > 0 ? toNumber(values.wA) / toNumber(values.w) : 0);
  const curve = values.curve === 'b' ? 'b' : 'a';
  const warnings = [];
  const blockingWarnings = [];

  if (toNumber(values.W) <= 0) blockingWarnings.push('Hauptluftmenge W fehlt oder ist 0.');
  if (toNumber(values.WA) <= 0) blockingWarnings.push('Abzweigluftmenge WA fehlt oder ist 0.');
  if (toNumber(values.w) <= 0) blockingWarnings.push('Hauptgeschwindigkeit w konnte nicht berechnet werden.');
  if (toNumber(values.wA) <= 0) blockingWarnings.push('Abzweiggeschwindigkeit wA konnte nicht berechnet werden.');

  if (blockingWarnings.length) {
    return createBlockingResult({ values, warnings: blockingWarnings });
  }

  const minRatio = Math.min(...RATIO_COLUMNS);
  const maxRatio = Math.max(...RATIO_COLUMNS);

  if (ratio > 0 && ratio < minRatio) {
    warnings.push(`wA/w liegt unter ${minRatio}. Es wird der kleinste Tabellenwert ${minRatio} verwendet.`);
  }

  if (ratio > maxRatio) {
    warnings.push(`wA/w liegt über ${maxRatio}. Es wird der grösste Tabellenwert ${maxRatio} verwendet.`);
  }

  const ratioLookup = lookupValue(RATIO_COLUMNS, ratio, 'ceil');
  const zetaW = Number(zetaTableByCurve(curve)[ratioLookup] ?? 0);
  const zetaA = toNumber(values.wA) > 0
    ? zetaW * (toNumber(values.w) / toNumber(values.wA)) ** 2
    : 0;
  const dynamicPressurePa = dynamicPressure(values.w);
  const pressureLossPa = zetaW * dynamicPressurePa;

  return new FormPartResult({
    id: 'sattelstueck_mit_einstroemkonus',
    name: 'Sattelstück mit Einströmkonus',
    category: 'Abzweige',
    input: { ...values, curve },
    calculation: {
      lossMode: 'direct',
      pressureReference: 'w',
      dynamicPressurePa: roundTo(dynamicPressurePa, 3),
      pressureLossPa: roundTo(pressureLossPa, 3),
      W: toNumber(values.W),
      WA: toNumber(values.WA),
      w: roundTo(values.w, 3),
      wA: roundTo(values.wA, 3),
      ratio: roundTo(ratio, 3),
      ratioLookup,
      curve,
      zetaW: roundTo(zetaW, 3),
      zetaA: roundTo(zetaA, 3),
      formula: 'ζ = Tabellenwert(wA/w, Kurve); Δp = ζ × pdyn(w)',
      lookupMode: 'ceil',
      lookupModeLabel: 'exakt oder nächst grösserer Tabellenwert',
      referenceRows: referenceRows(values, { ratio: roundTo(ratio, 3), curve, w: values.w, wA: values.wA }),
    },
    zeta: zetaW,
    warnings,
  });
}

export default calculateSattelstueckMitEinstroemkonus;
