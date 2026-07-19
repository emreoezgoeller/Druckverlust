// Druckverlust Pro – Kreisförmiger Bogen / Krümmer
// Berechnung nach Tabellenlogik aus Excel:
// ζ = Tabellenwert(R/d) × Tabellenwert(α)
// Excel-Logik: XLOOKUP(..., match_mode = 1) = exakter oder nächst grösserer Tabellenwert

import LookupEngine from '../../core/LookupEngine.js';
import FormPartResult from '../FormPartResult.js';

const RD_TABLE = [
  { x: 0.5, value: 1.18 },
  { x: 0.75, value: 0.37 },
  { x: 1.0, value: 0.21 },
  { x: 1.25, value: 0.19 },
  { x: 1.5, value: 0.17 },
  { x: 2.0, value: 0.15 },
  { x: 3.0, value: 0.13 },
  { x: 4.0, value: 0.11 },
];

const ANGLE_TABLE = [
  { x: 0, value: 0 },
  { x: 20, value: 0.31 },
  { x: 30, value: 0.45 },
  { x: 45, value: 0.60 },
  { x: 60, value: 0.78 },
  { x: 75, value: 0.90 },
  { x: 90, value: 1.00 },
  { x: 110, value: 1.13 },
  { x: 130, value: 1.20 },
  { x: 150, value: 1.28 },
  { x: 180, value: 1.40 },
];

export function calculateKreisBogen({ R = 0, d = 0, alpha = 90 } = {}) {
  const radius = Number(R);
  const diameter = Number(d);
  const angle = Number(alpha);
  const warnings = [];

  if (radius <= 0) warnings.push('Radius R fehlt oder ist 0.');
  if (diameter <= 0) warnings.push('Durchmesser d fehlt oder ist 0.');
  if (angle <= 0) warnings.push('Winkel α fehlt oder ist 0.');

  if (warnings.length) {
    return new FormPartResult({
      id: 'kreis_bogen',
      name: 'Kreisförmiger Bogen / Krümmer',
      category: 'Rund',
      input: { R, d, alpha },
      calculation: {
        ratio: 0,
        rdValue: 0,
        angleFactor: 0,
      },
      zeta: 0,
      warnings,
    });
  }

  const ratio = radius / diameter;

  const rdValue = LookupEngine.lookup(RD_TABLE, ratio, {
    mode: 'ceil',
  });

  const angleFactor = LookupEngine.lookup(ANGLE_TABLE, angle, {
    mode: 'ceil',
  });

  const zeta = rdValue * angleFactor;

  return new FormPartResult({
    id: 'kreis_bogen',
    name: 'Kreisförmiger Bogen / Krümmer',
    category: 'Rund',
    input: { R, d, alpha },
    calculation: {
      ratio,
      rdValue,
      angleFactor,
      formula: 'ζ = Tabellenwert(R/d) × Tabellenwert(α)',
      lookupMode: 'ceil',
      lookupModeLabel: 'exakt oder nächst grösserer Tabellenwert gemäss Excel',
    },
    zeta,
    warnings,
  });
}

export default calculateKreisBogen;