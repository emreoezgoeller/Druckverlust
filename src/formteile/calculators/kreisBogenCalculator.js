// Kreisförmiger Bogen / Krümmer
// Excel-Logik: ζ = Tabellenwert(R/d) × Tabellenwert(α)

const RD_TABLE = [
  { x: 0.5, zeta: 1.18 },
  { x: 0.75, zeta: 0.37 },
  { x: 1.0, zeta: 0.21 },
  { x: 1.25, zeta: 0.19 },
  { x: 1.5, zeta: 0.17 },
  { x: 2.0, zeta: 0.15 },
  { x: 3.0, zeta: 0.13 },
  { x: 4.0, zeta: 0.11 },
];

const ANGLE_TABLE = [
  { x: 0, factor: 0 },
  { x: 20, factor: 0.31 },
  { x: 30, factor: 0.45 },
  { x: 45, factor: 0.60 },
  { x: 60, factor: 0.78 },
  { x: 75, factor: 0.90 },
  { x: 90, factor: 1.00 },
  { x: 110, factor: 1.13 },
  { x: 130, factor: 1.20 },
  { x: 150, factor: 1.28 },
  { x: 180, factor: 1.40 },
];

function lookupApprox(value, table, valueKey) {
  const v = Number(value);

  if (!Number.isFinite(v)) return 0;

  let best = table[0];

  for (const item of table) {
    if (v >= item.x) {
      best = item;
    }
  }

  return best[valueKey];
}

export function calculateKreisBogen({ R = 0, d = 0, alpha = 90 } = {}) {
  const radius = Number(R);
  const diameter = Number(d);
  const angle = Number(alpha);

  if (radius <= 0 || diameter <= 0 || angle <= 0) {
    return {
      zeta: 0,
      ratio: 0,
      rdValue: 0,
      angleFactor: 0,
      warnings: ['R, d oder α fehlt.'],
    };
  }

  const ratio = radius / diameter;
  const rdValue = lookupApprox(ratio, RD_TABLE, 'zeta');
  const angleFactor = lookupApprox(angle, ANGLE_TABLE, 'factor');
  const zeta = rdValue * angleFactor;

  return {
    zeta,
    ratio,
    rdValue,
    angleFactor,
    warnings: [],
  };
}

export default calculateKreisBogen;