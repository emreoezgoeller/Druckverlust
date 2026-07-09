// Druckverlust Pro – kompatible Berechnungs-Engine für die aktuelle Startseite.
// Diese Datei stellt die API bereit, die src/main.js und src/pdf/report.js verwenden.

export const CALCULATION_ENGINE_VERSION = '0.4.1-compat';

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

export function fmt(value, digits = 1) {
  const number = toNumber(value, NaN);
  return Number.isFinite(number) ? number.toFixed(digits) : '-';
}

function calcAreaAndDiameter(row = {}) {
  const type = String(row.type || '').toLowerCase();
  const d = toNumber(row.d ?? row.diameter);
  const b = toNumber(row.b ?? row.width);
  const h = toNumber(row.h ?? row.height);

  if ((type === 'pipe' || type === 'rohr' || type === 'round') || (d > 0 && !(b > 0 && h > 0))) {
    return {
      type: 'pipe',
      area: d > 0 ? Math.PI * d * d / 4 : 0,
      eqDiameter: d > 0 ? d : 0,
    };
  }

  return {
    type: 'duct',
    area: b > 0 && h > 0 ? b * h : 0,
    eqDiameter: b > 0 && h > 0 ? (2 * b * h) / (b + h) : 0,
  };
}

function partBelongsToRow(part = {}, row = {}) {
  if (!part || !row) return false;
  return (
    part.rowId === row.id ||
    part.sectionId === row.id ||
    part.targetSectionId === row.id ||
    (part.ts && row.ts && String(part.ts) === String(row.ts))
  );
}

export function calculateRow(row = {}, project = {}, parts = []) {
  const type = String(row.type || '').toLowerCase();
  const q = toNumber(row.q ?? row.volumeFlow ?? row.airVolume);
  const l = toNumber(row.l ?? row.length);
  const rho = toNumber(project.rho ?? project.airDensity, 1.21);
  const lambda = toNumber(project.lambda, 0.025);
  const manualPa = toNumber(row.pa ?? row.pressureLoss ?? row.dp);

  if (type === 'special' || type === 'sonderbauteil') {
    return {
      area: 0,
      eqDiameter: 0,
      velocity: 0,
      pdyn: 0,
      r: 0,
      rl: 0,
      zeta: 0,
      z: 0,
      total: manualPa,
      warnings: manualPa <= 0 ? ['Sonderbauteil hat keinen Druckverlust.'] : [],
    };
  }

  const geometry = calcAreaAndDiameter(row);
  const velocity = q > 0 && geometry.area > 0 ? q / (3600 * geometry.area) : 0;
  const pdyn = velocity > 0 ? 0.5 * rho * velocity * velocity : 0;
  const r = lambda > 0 && geometry.eqDiameter > 0 && pdyn > 0 ? (lambda / geometry.eqDiameter) * pdyn : 0;
  const rl = r * l;
  const zetaFromParts = Array.isArray(parts)
    ? parts.filter(part => partBelongsToRow(part, row)).reduce((sum, part) => sum + toNumber(part.zeta), 0)
    : 0;
  const zeta = zetaFromParts + toNumber(row.zetaSum ?? row.zeta ?? row.sumZeta);
  const z = zeta * pdyn;
  const total = rl + z + manualPa;

  const warnings = [];
  if (q <= 0) warnings.push('Luftmenge fehlt oder ist 0.');
  if (geometry.area <= 0) warnings.push(geometry.type === 'pipe' ? 'Rohrdurchmesser fehlt.' : 'Breite/Höhe fehlen.');
  if (velocity > 6) warnings.push('Luftgeschwindigkeit über 6 m/s prüfen.');
  if (velocity > 10) warnings.push('Luftgeschwindigkeit sehr hoch. Dimensionierung prüfen.');
  if (zeta < 0) warnings.push('Σζ ist negativ. Eingabe/Formteil prüfen.');

  return {
    area: geometry.area,
    eqDiameter: geometry.eqDiameter,
    velocity,
    pdyn,
    r,
    rl,
    zeta,
    z,
    total,
    warnings,
  };
}

export function calculateProject(state = {}) {
  const project = state.project || state.settings || {};
  const rows = Array.isArray(state.rows) ? state.rows : (Array.isArray(state.sections) ? state.sections : []);
  const parts = Array.isArray(state.parts) ? state.parts : (Array.isArray(state.formParts) ? state.formParts : []);
  const specials = Array.isArray(state.specialComponents) ? state.specialComponents : [];
  const rowResults = new Map();

  const totals = {
    duct: 0,
    part: 0,
    special: 0,
    total: 0,
    rowResults,
    warnings: [],
    version: CALCULATION_ENGINE_VERSION,
  };

  rows.forEach(row => {
    const result = calculateRow(row, project, parts);
    rowResults.set(row.id, result);

    const rowType = String(row.type || '').toLowerCase();
    if (rowType === 'special' || rowType === 'sonderbauteil') {
      totals.special += result.total;
    } else {
      totals.duct += result.rl;
      totals.part += result.z;
    }

    result.warnings.forEach(message => totals.warnings.push({ rowId: row.id, ts: row.ts, message }));
  });

  specials.forEach(component => {
    const pressureLoss = toNumber(component.pressureLoss ?? component.pa ?? component.dp ?? component.totalLoss);
    totals.special += pressureLoss;
    if (pressureLoss <= 0) {
      totals.warnings.push({ rowId: component.id, ts: component.ts, message: 'Sonderbauteil hat keinen Druckverlust.' });
    }
  });

  totals.total = totals.duct + totals.part + totals.special;
  return totals;
}

export function createTest001State(makeUid = () => Math.random().toString(36).slice(2, 10)) {
  return {
    project: {
      name: 'TEST-001 – Monoblock Referenz 900 m³/h',
      system: 'Lüftungsanlage Referenz',
      editor: 'Emre Özgöller',
      date: new Date().toISOString().slice(0, 10),
      rho: 1.21,
      lambda: 0.025,
    },
    rows: [
      { id: makeUid(), type: 'duct', desc: 'Rechteckkanal 450 × 450 mm', ts: 'TS1', q: 900, b: 0.45, h: 0.45, d: 0, l: 1.25, zetaSum: 0.33, pa: 0 },
      { id: makeUid(), type: 'duct', desc: 'Rechteckkanal 800 × 800 mm', ts: 'TS2', q: 900, b: 0.80, h: 0.80, d: 0, l: 1.25, zetaSum: 0, pa: 0 },
      { id: makeUid(), type: 'special', desc: 'Monoblock', ts: '', q: 900, b: 0, h: 0, d: 0, l: 0, zetaSum: 0, pa: 100 },
      { id: makeUid(), type: 'pipe', desc: 'Rundrohr Ø500 mm', ts: 'TS3', q: 900, b: 0, h: 0, d: 0.50, l: 1.25, zetaSum: 2.36, pa: 0 },
      { id: makeUid(), type: 'pipe', desc: 'Rundrohr Ø300 mm', ts: 'TS4', q: 900, b: 0, h: 0, d: 0.30, l: 1.25, zetaSum: 0.59, pa: 0 },
      { id: makeUid(), type: 'pipe', desc: 'Rundrohr Ø400 mm', ts: 'TS5', q: 900, b: 0, h: 0, d: 0.40, l: 1.25, zetaSum: 0, pa: 0 },
    ],
    parts: [],
  };
}

export default {
  CALCULATION_ENGINE_VERSION,
  toNumber,
  fmt,
  calculateRow,
  calculateProject,
  createTest001State,
};
