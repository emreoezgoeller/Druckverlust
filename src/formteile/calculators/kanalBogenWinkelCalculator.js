// Druckverlust Pro – Kanal-Bogen mit Winkel
// Berechnung nach Tabellenlogik aus Excel:
// Tabellenachsen: α und a/b
// ζ = Tabellenwert(α, a/b)
// Lookup-Logik: exakter oder nächst grösserer Tabellenwert

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const ASPECT_COLUMNS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

const KANAL_BOGEN_WINKEL_TABLE = [
  { alpha: 20, values: { 0.25: 0.14, 0.5: 0.14, 0.75: 0.14, 1: 0.13, 1.5: 0.12, 2: 0.12, 3: 0.11, 4: 0.10 } },
  { alpha: 30, values: { 0.25: 0.18, 0.5: 0.17, 0.75: 0.17, 1: 0.16, 1.5: 0.15, 2: 0.14, 3: 0.13, 4: 0.12 } },
  { alpha: 45, values: { 0.25: 0.35, 0.5: 0.34, 0.75: 0.33, 1: 0.32, 1.5: 0.30, 2: 0.29, 3: 0.27, 4: 0.25 } },
  { alpha: 60, values: { 0.25: 0.62, 0.5: 0.60, 0.75: 0.58, 1: 0.56, 1.5: 0.53, 2: 0.50, 3: 0.46, 4: 0.44 } },
  { alpha: 75, values: { 0.25: 0.89, 0.5: 0.87, 0.75: 0.84, 1: 0.81, 1.5: 0.77, 2: 0.73, 3: 0.67, 4: 0.63 } },
  { alpha: 90, values: { 0.25: 1.32, 0.5: 1.28, 0.75: 1.25, 1: 1.20, 1.5: 1.14, 2: 1.08, 3: 1.00, 4: 0.94 } },
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

function lookupZeta(alpha, aspectRatio) {
  const alphaLookup = lookupCeilValue(KANAL_BOGEN_WINKEL_TABLE.map(row => row.alpha), alpha);
  const aspectLookup = lookupCeilValue(ASPECT_COLUMNS, aspectRatio);
  const row = KANAL_BOGEN_WINKEL_TABLE.find(item => Number(item.alpha) === Number(alphaLookup));
  const zeta = Number(row?.values?.[aspectLookup] ?? 0);

  return {
    alphaLookup,
    aspectLookup,
    zeta,
  };
}

export function calculateKanalBogenWinkel({ alpha = 90, a = 0, b = 0 } = {}) {
  const angle = toNumber(alpha);
  const width = toNumber(a);
  const height = toNumber(b);
  const warnings = [];
  const blockingWarnings = [];

  if (angle <= 0) blockingWarnings.push('Winkel α fehlt oder ist 0.');
  if (width <= 0) blockingWarnings.push('Breite a fehlt oder ist 0.');
  if (height <= 0) blockingWarnings.push('Höhe b fehlt oder ist 0.');

  const aspectRatio = height > 0 ? width / height : 0;

  if (aspectRatio > 0 && aspectRatio < 0.25) {
    warnings.push('a/b liegt unter 0.25. Es wird der kleinste Tabellenwert 0.25 verwendet.');
  }

  if (aspectRatio > 4.0) {
    warnings.push('a/b liegt über 4.0. Es wird der grösste Tabellenwert 4.0 verwendet.');
  }

  if (blockingWarnings.length) {
    return new FormPartResult({
      id: 'kanal_bogen_winkel',
      name: 'Kanal-Bogen mit Winkel',
      category: 'Rechteck',
      input: { alpha, a, b },
      calculation: {
        aspectRatio,
        formula: 'ζ = Tabellenwert(α, a/b)',
        lookupMode: 'ceil',
        lookupModeLabel: 'exakt oder nächst grösserer Tabellenwert',
      },
      zeta: 0,
      warnings: blockingWarnings,
    });
  }

  const lookup = lookupZeta(angle, aspectRatio);

  return new FormPartResult({
    id: 'kanal_bogen_winkel',
    name: 'Kanal-Bogen mit Winkel',
    category: 'Rechteck',
    input: { alpha, a, b },
    calculation: {
      aspectRatio: roundTo(aspectRatio, 3),
      alpha: angle,
      alphaLookup: lookup.alphaLookup,
      aspectLookup: lookup.aspectLookup,
      formula: 'ζ = Tabellenwert(α, a/b)',
      lookupMode: 'ceil',
      lookupModeLabel: 'exakt oder nächst grösserer Tabellenwert',
      displayRows: [
        { label: 'α', value: angle, suffix: '°', digits: 0 },
        { label: 'a/b', value: roundTo(aspectRatio, 3) },
        { label: 'Tabellenwert α', value: lookup.alphaLookup, suffix: '°', digits: 0 },
        { label: 'Tabellenwert a/b', value: lookup.aspectLookup },
      ],
    },
    zeta: lookup.zeta,
    warnings,
  });
}

export default calculateKanalBogenWinkel;
