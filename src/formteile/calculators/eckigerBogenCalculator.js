// Druckverlust Pro – Eckiger Kanalbogen
// Berechnung nach Tabellenlogik aus Excel:
// Tabellenachsen: R/b und a/b
// ζ = Tabellenwert(R/b, a/b)
// Lookup-Logik: exakter oder nächst grösserer Tabellenwert

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const ASPECT_COLUMNS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

const ECKIGER_BOGEN_TABLE = [
  { rb: 0.5, values: { 0.25: 1.53, 0.5: 1.38, 0.75: 1.29, 1: 1.18, 1.5: 1.06, 2: 1.00, 3: 1.00, 4: 1.06 } },
  { rb: 0.6, values: { 0.25: 1.00, 0.5: 0.90, 0.75: 0.84, 1: 0.77, 1.5: 0.69, 2: 0.65, 3: 0.65, 4: 0.69 } },
  { rb: 0.7, values: { 0.25: 0.66, 0.5: 0.60, 0.75: 0.56, 1: 0.51, 1.5: 0.46, 2: 0.43, 3: 0.43, 4: 0.46 } },
  { rb: 0.8, values: { 0.25: 0.48, 0.5: 0.43, 0.75: 0.40, 1: 0.37, 1.5: 0.33, 2: 0.31, 3: 0.31, 4: 0.33 } },
  { rb: 0.9, values: { 0.25: 0.36, 0.5: 0.33, 0.75: 0.31, 1: 0.28, 1.5: 0.25, 2: 0.24, 3: 0.24, 4: 0.25 } },
  { rb: 1.0, values: { 0.25: 0.27, 0.5: 0.25, 0.75: 0.23, 1: 0.21, 1.5: 0.19, 2: 0.18, 3: 0.18, 4: 0.19 } },
  { rb: 1.25, values: { 0.25: 0.25, 0.5: 0.22, 0.75: 0.21, 1: 0.19, 1.5: 0.17, 2: 0.16, 3: 0.16, 4: 0.17 } },
  { rb: 1.5, values: { 0.25: 0.22, 0.5: 0.20, 0.75: 0.19, 1: 0.17, 1.5: 0.15, 2: 0.14, 3: 0.14, 4: 0.15 } },
  { rb: 2.0, values: { 0.25: 0.20, 0.5: 0.18, 0.75: 0.16, 1: 0.15, 1.5: 0.14, 2: 0.13, 3: 0.13, 4: 0.14 } },
  { rb: 2.5, values: { 0.25: 0.17, 0.5: 0.15, 0.75: 0.14, 1: 0.13, 1.5: 0.12, 2: 0.11, 3: 0.11, 4: 0.12 } },
  { rb: 3.0, values: { 0.25: 0.16, 0.5: 0.14, 0.75: 0.13, 1: 0.12, 1.5: 0.11, 2: 0.10, 3: 0.10, 4: 0.11 } },
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

function lookupCeilValue(list = [], value) {
  return LookupEngine.lookup(list.map(x => ({ x, value: x })), value, { mode: 'ceil' });
}

function lookupZeta(rbRatio, aspectRatio) {
  const rbLookup = lookupCeilValue(ECKIGER_BOGEN_TABLE.map(row => row.rb), rbRatio);
  const aspectLookup = lookupCeilValue(ASPECT_COLUMNS, aspectRatio);
  const row = ECKIGER_BOGEN_TABLE.find(item => Number(item.rb) === Number(rbLookup));
  const zeta = Number(row?.values?.[aspectLookup] ?? 0);

  return {
    rbLookup,
    aspectLookup,
    zeta,
  };
}

export function calculateEckigerBogen({ R = 0, a = 0, b = 0 } = {}) {
  const radius = toNumber(R);
  const width = toNumber(a);
  const height = toNumber(b);
  const warnings = [];
  const blockingWarnings = [];

  if (radius <= 0) blockingWarnings.push('Radius R fehlt oder ist 0.');
  if (width <= 0) blockingWarnings.push('Breite a fehlt oder ist 0.');
  if (height <= 0) blockingWarnings.push('Höhe b fehlt oder ist 0.');

  const rbRatio = height > 0 ? radius / height : 0;
  const aspectRatio = height > 0 ? width / height : 0;

  if (rbRatio > 0 && rbRatio < 0.5) {
    warnings.push('R/b liegt unter 0.5. Es wird der kleinste Tabellenwert 0.5 verwendet.');
  }

  if (rbRatio > 3.0) {
    warnings.push('R/b liegt über 3.0. Es wird der grösste Tabellenwert 3.0 verwendet.');
  }

  if (aspectRatio > 0 && aspectRatio < 0.25) {
    warnings.push('a/b liegt unter 0.25. Es wird der kleinste Tabellenwert 0.25 verwendet.');
  }

  if (aspectRatio > 4.0) {
    warnings.push('a/b liegt über 4.0. Es wird der grösste Tabellenwert 4.0 verwendet.');
  }

  if (blockingWarnings.length) {
    return new FormPartResult({
      id: 'eckiger_bogen',
      name: 'Eckiger Kanalbogen',
      category: 'Rechteck',
      input: { R, a, b },
      calculation: {
        rbRatio,
        aspectRatio,
        formula: 'ζ = Tabellenwert(R/b, a/b)',
        lookupMode: 'ceil',
        lookupModeLabel: 'exakt oder nächst grösserer Tabellenwert',
      },
      zeta: 0,
      warnings: blockingWarnings,
    });
  }

  const lookup = lookupZeta(rbRatio, aspectRatio);

  return new FormPartResult({
    id: 'eckiger_bogen',
    name: 'Eckiger Kanalbogen',
    category: 'Rechteck',
    input: { R, a, b },
    calculation: {
      rbRatio: roundTo(rbRatio, 3),
      aspectRatio: roundTo(aspectRatio, 3),
      rbLookup: lookup.rbLookup,
      aspectLookup: lookup.aspectLookup,
      formula: 'ζ = Tabellenwert(R/b, a/b)',
      lookupMode: 'ceil',
      lookupModeLabel: 'exakt oder nächst grösserer Tabellenwert',
      displayRows: [
        { label: 'R/b', value: roundTo(rbRatio, 3) },
        { label: 'a/b', value: roundTo(aspectRatio, 3) },
        { label: 'Tabellenwert R/b', value: lookup.rbLookup },
        { label: 'Tabellenwert a/b', value: lookup.aspectLookup },
      ],
    },
    zeta: lookup.zeta,
    warnings,
  });
}

export default calculateEckigerBogen;
