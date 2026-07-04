/**
 * Druckverlust Pro – CalculationEngine
 * Version 0.4.2
 *
 * Zentrale, DOM-unabhängige Berechnungslogik.
 * Dieses Modul ist bewusst unabhängig von der Oberfläche, vom PDF-Export
 * und von der Projektverwaltung. Dadurch können wir alle Ergebnisse sauber
 * gegen Excel-Referenzen testen.
 *
 * Einheiten:
 * - Luftmenge q: m³/h
 * - Breite/Höhe/Durchmesser/Länge: m
 * - Fläche: m²
 * - Geschwindigkeit: m/s
 * - Druck: Pa
 */

const DEFAULTS = Object.freeze({
  rho: 1.21,
  lambda: 0.025,
  round: false,
});

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
}

export function calcDuctArea(widthM, heightM) {
  const b = toNumber(widthM);
  const h = toNumber(heightM);
  return b > 0 && h > 0 ? b * h : 0;
}

export function calcPipeArea(diameterM) {
  const d = toNumber(diameterM);
  return d > 0 ? Math.PI * d * d / 4 : 0;
}

export function calcHydraulicDiameter(widthM, heightM) {
  const b = toNumber(widthM);
  const h = toNumber(heightM);
  return b > 0 && h > 0 ? (2 * b * h) / (b + h) : 0;
}

export function calcVelocity(volumeFlowM3h, areaM2) {
  const q = toNumber(volumeFlowM3h);
  const a = toNumber(areaM2);
  return q > 0 && a > 0 ? q / (3600 * a) : 0;
}

export function calcDynamicPressure(velocityMs, rho = DEFAULTS.rho) {
  const v = toNumber(velocityMs);
  const density = toNumber(rho, DEFAULTS.rho);
  return v > 0 && density > 0 ? 0.5 * density * v * v : 0;
}

export function calcFrictionRate(lambda, hydraulicDiameterM, dynamicPressurePa) {
  const l = toNumber(lambda, DEFAULTS.lambda);
  const dh = toNumber(hydraulicDiameterM);
  const pdyn = toNumber(dynamicPressurePa);
  return l > 0 && dh > 0 && pdyn > 0 ? (l / dh) * pdyn : 0;
}

export function calcZetaLoss(zetaSum, dynamicPressurePa) {
  return toNumber(zetaSum) * toNumber(dynamicPressurePa);
}

export function normalizeType(section = {}) {
  const type = String(section.type || section.kind || '').toLowerCase();
  if (['special', 'sonder', 'sonderbauteil'].includes(type)) return 'special';
  if (['pipe', 'rohr', 'round', 'rund'].includes(type)) return 'pipe';
  if (['duct', 'kanal', 'rect', 'rechteck'].includes(type)) return 'duct';

  // Praxistaugliche Automatik: Wenn Ø vorhanden ist und Breite/Höhe fehlen,
  // behandeln wir die Teilstrecke als Rohr.
  const d = toNumber(section.d ?? section.diameter);
  const b = toNumber(section.b ?? section.width);
  const h = toNumber(section.h ?? section.height);
  if (d > 0 && !(b > 0 && h > 0)) return 'pipe';
  return 'duct';
}

export function sumFormPartZeta(formParts = [], sectionId) {
  return formParts
    .filter(part => part && (part.sectionId === sectionId || part.rowId === sectionId || part.targetSectionId === sectionId))
    .reduce((sum, part) => sum + toNumber(part.zeta), 0);
}

export function calculateSection(section = {}, options = {}) {
  const settings = { ...DEFAULTS, ...(options.settings || options) };
  const type = normalizeType(section);

  if (type === 'special') {
    const specialLoss = toNumber(section.pa ?? section.pressureLoss ?? section.dp ?? section.totalLoss);
    return createResult({
      id: section.id,
      type,
      description: section.desc || section.description || section.name || 'Sonderbauteil',
      q: toNumber(section.q ?? section.volumeFlow),
      specialLoss,
      totalLoss: specialLoss,
      warnings: [],
    });
  }

  const q = toNumber(section.q ?? section.volumeFlow);
  const length = toNumber(section.l ?? section.length);
  const zetaSum = toNumber(options.zetaSum ?? section.zetaSum ?? section.zeta);
  let area = 0;
  let hydraulicDiameter = 0;
  let width = 0;
  let height = 0;
  let diameter = 0;

  if (type === 'pipe') {
    diameter = toNumber(section.d ?? section.diameter);
    area = calcPipeArea(diameter);
    hydraulicDiameter = diameter;
  } else {
    width = toNumber(section.b ?? section.width);
    height = toNumber(section.h ?? section.height);
    area = calcDuctArea(width, height);
    hydraulicDiameter = calcHydraulicDiameter(width, height);
  }

  const velocity = calcVelocity(q, area);
  const dynamicPressure = calcDynamicPressure(velocity, settings.rho);
  const frictionRate = calcFrictionRate(settings.lambda, hydraulicDiameter, dynamicPressure);
  const frictionLoss = frictionRate * length;
  const zetaLoss = calcZetaLoss(zetaSum, dynamicPressure);
  const specialLoss = toNumber(section.pa ?? section.pressureLoss);
  const totalLoss = frictionLoss + zetaLoss + specialLoss;

  const warnings = [];
  if (q <= 0) warnings.push('Luftmenge fehlt oder ist 0.');
  if (area <= 0) warnings.push(type === 'pipe' ? 'Rohrdurchmesser fehlt.' : 'Breite/Höhe fehlen.');
  if (velocity > 6) warnings.push('Luftgeschwindigkeit über 6 m/s prüfen.');
  if (velocity > 10) warnings.push('Luftgeschwindigkeit sehr hoch. Dimensionierung prüfen.');
  if (zetaSum < 0) warnings.push('Σζ ist negativ. Eingabe/Formteil prüfen.');

  return createResult({
    id: section.id,
    type,
    description: section.desc || section.description || '',
    ts: section.ts || section.sectionNo || '',
    q,
    width,
    height,
    diameter,
    length,
    area,
    hydraulicDiameter,
    velocity,
    dynamicPressure,
    frictionRate,
    frictionLoss,
    zetaSum,
    zetaLoss,
    specialLoss,
    totalLoss,
    warnings,
  });
}

function createResult(values) {
  return {
    id: values.id || '',
    type: values.type || 'duct',
    description: values.description || '',
    ts: values.ts || '',
    q: values.q || 0,
    width: values.width || 0,
    height: values.height || 0,
    diameter: values.diameter || 0,
    length: values.length || 0,
    area: values.area || 0,
    hydraulicDiameter: values.hydraulicDiameter || 0,
    velocity: values.velocity || 0,
    dynamicPressure: values.dynamicPressure || 0,
    frictionRate: values.frictionRate || 0,
    frictionLoss: values.frictionLoss || 0,
    zetaSum: values.zetaSum || 0,
    zetaLoss: values.zetaLoss || 0,
    specialLoss: values.specialLoss || 0,
    totalLoss: values.totalLoss || 0,
    warnings: values.warnings || [],
  };
}

export function calculateProject(project = {}) {
  const settings = project.settings || project.project || {};
  const sections = project.sections || project.rows || [];
  const formParts = project.formParts || project.parts || [];

  const results = sections.map((section, index) => {
    const zetaFromParts = sumFormPartZeta(formParts, section.id);
    const manualZeta = toNumber(section.zetaSum ?? section.zeta);
    const zetaSum = zetaFromParts + manualZeta;
    const result = calculateSection(section, { settings, zetaSum });
    return {
      index,
      id: section.id || `section-${index + 1}`,
      input: section,
      zetaFromParts,
      manualZeta,
      result,
    };
  });

  const totals = results.reduce((acc, item) => {
    const r = item.result;
    acc.friction += r.frictionLoss;
    acc.formParts += r.zetaLoss;
    acc.special += r.type === 'special' ? r.specialLoss : 0;
    acc.total += r.totalLoss;
    acc.warnings.push(...r.warnings.map(w => ({ sectionId: item.id, message: w })));
    return acc;
  }, { friction: 0, formParts: 0, special: 0, total: 0, warnings: [] });

  return { settings: { ...DEFAULTS, ...settings }, results, totals };
}

export class CalculationEngine {
  constructor(settings = {}) {
    this.settings = { ...DEFAULTS, ...settings };
  }

  setSettings(settings = {}) {
    this.settings = { ...this.settings, ...settings };
    return this;
  }

  calculateSection(section = {}, options = {}) {
    return calculateSection(section, { ...options, settings: { ...this.settings, ...(options.settings || {}) } });
  }

  calculateProject(project = {}) {
    return calculateProject({ ...project, settings: { ...this.settings, ...(project.settings || project.project || {}) } });
  }

  // Kompatibilität mit älteren Modulversionen
  rectangleArea(width, height) { return calcDuctArea(width, height); }
  circularArea(diameter) { return calcPipeArea(diameter); }
  equivalentDiameterRectangle(width, height) { return calcHydraulicDiameter(width, height); }
  hydraulicDiameterRectangle(width, height) { return calcHydraulicDiameter(width, height); }
  velocity(q, area) { return calcVelocity(q, area); }
  dynamicPressure(v) { return calcDynamicPressure(v, this.settings.rho); }
  frictionRate(pdyn, dh) { return calcFrictionRate(this.settings.lambda, dh, pdyn); }
}

CalculationEngine.defaults = DEFAULTS;
CalculationEngine.number = toNumber;
CalculationEngine.round = round;
CalculationEngine.rectangleArea = calcDuctArea;
CalculationEngine.circularArea = calcPipeArea;
CalculationEngine.equivalentDiameterRectangle = calcHydraulicDiameter;
CalculationEngine.hydraulicDiameterRectangle = calcHydraulicDiameter;
CalculationEngine.velocity = calcVelocity;
CalculationEngine.dynamicPressure = calcDynamicPressure;
CalculationEngine.frictionRate = (lambda, dh, pdyn) => calcFrictionRate(lambda, dh, pdyn);
CalculationEngine.zetaPressureLoss = calcZetaLoss;
CalculationEngine.calculateSection = calculateSection;
CalculationEngine.calculateProject = calculateProject;

export default CalculationEngine;
