// Druckverlust Pro – CalculationEngine
// Zentrale Berechnungs-Engine für Kanal, Rohr, Formteile und Gesamtprojekt.

export function round(value, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function calcDuctArea(width, height) {
  return Number(width) * Number(height);
}

export function calcPipeArea(diameter) {
  return Math.PI * Math.pow(Number(diameter), 2) / 4;
}

export function calcHydraulicDiameter(width, height) {
  const b = Number(width);
  const h = Number(height);
  if (b <= 0 || h <= 0) return 0;
  return (2 * b * h) / (b + h);
}

export function calcVelocity(flowM3h, areaM2) {
  const q = Number(flowM3h);
  const a = Number(areaM2);
  if (q <= 0 || a <= 0) return 0;
  return q / 3600 / a;
}

export function calcDynamicPressure(velocity, rho = 1.2) {
  const v = Number(velocity);
  return 0.5 * Number(rho) * Math.pow(v, 2);
}

export function calcFrictionPressure(lambda, hydraulicDiameter, dynamicPressure) {
  const l = Number(lambda);
  const d = Number(hydraulicDiameter);
  const pdyn = Number(dynamicPressure);
  if (l <= 0 || d <= 0 || pdyn <= 0) return 0;
  return (l / d) * pdyn;
}

export function calculateSection(section, settings = {}) {
  const rho = Number(settings.airDensity ?? settings.rho ?? 1.2);
  const lambda = Number(settings.lambda ?? 0.025);

  const type = section.type || section.kind || "duct";
  const flow = Number(section.flow ?? section.airflow ?? section.q ?? 0);
  const length = Number(section.length ?? section.l ?? 0);
  const zeta = Number(section.zeta ?? section.zetaSum ?? section.sumZeta ?? 0);

  let area = 0;
  let hydraulicDiameter = 0;

  if (type === "pipe" || type === "round" || type === "rohr") {
    const diameter = Number(section.diameter ?? section.d ?? 0);
    area = calcPipeArea(diameter);
    hydraulicDiameter = diameter;
  } else {
    const width = Number(section.width ?? section.b ?? 0);
    const height = Number(section.height ?? section.h ?? 0);
    area = calcDuctArea(width, height);
    hydraulicDiameter = calcHydraulicDiameter(width, height);
  }

  const velocity = calcVelocity(flow, area);
  const dynamicPressure = calcDynamicPressure(velocity, rho);
  const frictionPressure = calcFrictionPressure(lambda, hydraulicDiameter, dynamicPressure);
  const frictionLoss = frictionPressure * length;
  const zetaLoss = zeta * dynamicPressure;
  const totalLoss = frictionLoss + zetaLoss;

  return {
    area,
    hydraulicDiameter,
    velocity,
    dynamicPressure,
    frictionPressure,
    frictionLoss,
    zeta,
    zetaLoss,
    totalLoss
  };
}

export function calculateProject(project) {
  const settings = project.settings || {};
  const sections = project.sections || [];

  const results = sections.map((section, index) => ({
    id: section.id || section.name || `TS${index + 1}`,
    section,
    result: calculateSection(section, settings)
  }));

  const sectionTotal = results.reduce((sum, item) => sum + item.result.totalLoss, 0);

  const specialTotal = (project.specialComponents || project.specials || [])
    .reduce((sum, item) => sum + Number(item.pressureLoss ?? item.dp ?? item.value ?? 0), 0);

  const total = sectionTotal + specialTotal;

  return {
    results,
    totals: {
      sections: sectionTotal,
      specialComponents: specialTotal,
      total
    }
  };
}

export default {
  round,
  calcDuctArea,
  calcPipeArea,
  calcHydraulicDiameter,
  calcVelocity,
  calcDynamicPressure,
  calcFrictionPressure,
  calculateSection,
  calculateProject
};