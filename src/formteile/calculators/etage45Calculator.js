// Druckverlust Pro – Etage 45°
// Berechnung nach Tabellenlogik aus Excel:
// Tabellenachse: LE/d(dh)
// ζ = Tabellenwert(LE/d(dh))
// Excel-Logik: XLOOKUP(..., match_mode = -1) = exakter oder nächst kleinerer Tabellenwert

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const ETAGE_45_TABLE = [
  { x: 0, value: 0.00 },
  { x: 0.25, value: 0.06 },
  { x: 0.5, value: 0.11 },
  { x: 1, value: 0.15 },
  { x: 2, value: 0.15 },
  { x: 3, value: 0.16 },
  { x: 4, value: 0.16 },
  { x: 5, value: 0.16 },
  { x: 6, value: 0.16 },
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

function lookupFloorRatio(value) {
  const ratioLookup = LookupEngine.lookup(
    ETAGE_45_TABLE.map(item => ({ x: item.x, value: item.x })),
    value,
    { mode: 'floor' }
  );

  const zeta = LookupEngine.lookup(ETAGE_45_TABLE, value, { mode: 'floor' });

  return {
    ratioLookup,
    zeta,
  };
}

export function calculateEtage45(values = {}) {
  const LE = toNumber(values.LE);
  const diameter = toNumber(values.dh ?? values.d);
  const bauform = values.bauform || 'Rohr';
  const warnings = [];
  const blockingWarnings = [];

  if (LE <= 0) blockingWarnings.push('Länge LE fehlt oder ist 0.');
  if (diameter <= 0) blockingWarnings.push('Bezugsdurchmesser d/dh fehlt oder ist 0.');

  const ratio = diameter > 0 ? LE / diameter : 0;

  if (ratio > 6) {
    warnings.push('LE/d(dh) liegt über 6. Es wird der grösste Tabellenwert 6 verwendet.');
  }

  if (blockingWarnings.length) {
    return new FormPartResult({
      id: 'etage_45',
      name: 'Etage 45°',
      category: 'Spezial',
      input: { ...values, LE, dh: diameter, bauform },
      calculation: {
        ratio,
        formula: 'ζ = Tabellenwert(LE/d(dh))',
        lookupMode: 'floor',
        lookupModeLabel: 'exakt oder nächst kleinerer Tabellenwert gemäss Excel',
      },
      zeta: 0,
      warnings: blockingWarnings,
    });
  }

  const lookup = lookupFloorRatio(ratio);

  return new FormPartResult({
    id: 'etage_45',
    name: 'Etage 45°',
    category: 'Spezial',
    input: { ...values, LE, dh: diameter, bauform },
    calculation: {
      bauform,
      LE,
      dh: roundTo(diameter, 3),
      ratio: roundTo(ratio, 3),
      ratioLookup: lookup.ratioLookup,
      formula: 'ζ = Tabellenwert(LE/d(dh))',
      lookupMode: 'floor',
      lookupModeLabel: 'exakt oder nächst kleinerer Tabellenwert gemäss Excel',
    },
    zeta: lookup.zeta,
    warnings,
  });
}

export default calculateEtage45;
