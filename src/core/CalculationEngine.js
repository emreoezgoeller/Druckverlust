/*
 * Druckverlust Pro – CalculationEngine
 * Version 0.3.2
 *
 * Reine Berechnungslogik ohne DOM-Zugriffe.
 * Diese Datei ist bewusst unabhängig von der Oberfläche aufgebaut.
 */
'use strict';

export const DEFAULT_SETTINGS = Object.freeze({
  rho: 1.21,       // kg/m³
  lambda: 0.025    // -
});

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function calcDuctArea(widthM, heightM) {
  const b = toNumber(widthM);
  const h = toNumber(heightM);
  return b > 0 && h > 0 ? b * h : 0;
}

export function calcHydraulicDiameter(widthM, heightM) {
  const b = toNumber(widthM);
  const h = toNumber(heightM);
  return b > 0 && h > 0 ? (2 * b * h) / (b + h) : 0;
}

export function calcPipeArea(diameterM) {
  const d = toNumber(diameterM);
  return d > 0 ? Math.PI * d * d / 4 : 0;
}

export function calcVelocity(volumeM3h, areaM2) {
  const q = toNumber(volumeM3h);
  const a = toNumber(areaM2);
  return q > 0 && a > 0 ? q / (3600 * a) : 0;
}

export function calcDynamicPressure(velocityMs, rho = DEFAULT_SETTINGS.rho) {
  const v = toNumber(velocityMs);
  const r = toNumber(rho, DEFAULT_SETTINGS.rho);
  return v > 0 ? 0.5 * r * v * v : 0;
}

export function calcFrictionRate(lambda, hydraulicDiameterM, dynamicPressurePa) {
  const l = toNumber(lambda, DEFAULT_SETTINGS.lambda);
  const d = toNumber(hydraulicDiameterM);
  const pdyn = toNumber(dynamicPressurePa);
  return d > 0 ? (l / d) * pdyn : 0;
}

export function calcSection(section, settings = DEFAULT_SETTINGS, assignedFormParts = []) {
  const type = section.type || 'duct';
  const q = toNumber(section.q);
  const length = toNumber(section.l);
  const rho = toNumber(settings.rho, DEFAULT_SETTINGS.rho);
  const lambda = toNumber(settings.lambda, DEFAULT_SETTINGS.lambda);

  if (type === 'special') {
    return {
      type,
      area: 0,
      hydraulicDiameter: 0,
      velocity: 0,
      dynamicPressure: 0,
      frictionRate: 0,
      frictionLoss: 0,
      zetaSum: 0,
      formPartLoss: 0,
      specialLoss: toNumber(section.pa),
      totalLoss: toNumber(section.pa)
    };
  }

  let area = 0;
  let hydraulicDiameter = 0;

  if (type === 'pipe') {
    hydraulicDiameter = toNumber(section.d);
    area = calcPipeArea(hydraulicDiameter);
  } else {
    area = calcDuctArea(section.b, section.h);
    hydraulicDiameter = calcHydraulicDiameter(section.b, section.h);
  }

  const velocity = calcVelocity(q, area);
  const dynamicPressure = calcDynamicPressure(velocity, rho);
  const frictionRate = calcFrictionRate(lambda, hydraulicDiameter, dynamicPressure);
  const frictionLoss = frictionRate * length;
  const zetaSum = assignedFormParts.reduce((sum, p) => sum + toNumber(p.zeta), 0);
  const formPartLoss = zetaSum * dynamicPressure;
  const totalLoss = frictionLoss + formPartLoss + toNumber(section.pa);

  return {
    type,
    area,
    hydraulicDiameter,
    velocity,
    dynamicPressure,
    frictionRate,
    frictionLoss,
    zetaSum,
    formPartLoss,
    specialLoss: toNumber(section.pa),
    totalLoss
  };
}

export function calcProject(project) {
  const settings = {
    rho: toNumber(project?.settings?.rho, DEFAULT_SETTINGS.rho),
    lambda: toNumber(project?.settings?.lambda, DEFAULT_SETTINGS.lambda)
  };
  const sections = project?.sections || [];
  const formParts = project?.formParts || [];

  const sectionResults = sections.map(section => {
    const assigned = formParts.filter(p => p.sectionId === section.id);
    return {
      sectionId: section.id,
      section,
      assignedFormParts: assigned,
      result: calcSection(section, settings, assigned)
    };
  });

  const totals = sectionResults.reduce((acc, item) => {
    acc.frictionLoss += item.result.frictionLoss;
    acc.formPartLoss += item.result.formPartLoss;
    acc.specialLoss += item.result.type === 'special' ? item.result.specialLoss : 0;
    acc.totalLoss += item.result.totalLoss;
    return acc;
  }, { frictionLoss: 0, formPartLoss: 0, specialLoss: 0, totalLoss: 0 });

  return { settings, sectionResults, totals };
}
