/* Druckverlust Pro – CalculationEngine
 * Zentrale Berechnung für Kanal, Rohr, Formteile und Sonderbauteile.
 * Keine UI-Abhängigkeiten.
 */
export class CalculationEngine {
  constructor(settings = {}) {
    this.rho = Number(settings.rho ?? 1.21);
    this.lambda = Number(settings.lambda ?? 0.025);
  }

  setSettings(settings = {}) {
    if (settings.rho !== undefined) this.rho = Number(settings.rho);
    if (settings.lambda !== undefined) this.lambda = Number(settings.lambda);
  }

  rectangleArea(width, height) {
    return Number(width) * Number(height);
  }

  circularArea(diameter) {
    return Math.PI * Math.pow(Number(diameter), 2) / 4;
  }

  equivalentDiameterRectangle(width, height) {
    width = Number(width); height = Number(height);
    if (width <= 0 || height <= 0) return 0;
    return (2 * width * height) / (width + height);
  }

  velocity(volumeFlowM3h, areaM2) {
    volumeFlowM3h = Number(volumeFlowM3h);
    areaM2 = Number(areaM2);
    if (volumeFlowM3h <= 0 || areaM2 <= 0) return 0;
    return volumeFlowM3h / (3600 * areaM2);
  }

  dynamicPressure(velocityMs) {
    return 0.5 * this.rho * Math.pow(Number(velocityMs), 2);
  }

  frictionRate(dynamicPressurePa, equivalentDiameterM) {
    equivalentDiameterM = Number(equivalentDiameterM);
    if (equivalentDiameterM <= 0) return 0;
    return (this.lambda / equivalentDiameterM) * Number(dynamicPressurePa);
  }

  calculateSection(section = {}, zetaSum = 0) {
    const type = section.type || 'duct';
    if (type === 'special') {
      return this.emptyResult({ specialPressureLoss: Number(section.pa || section.pressureLoss || 0) });
    }

    const q = Number(section.q || section.volumeFlow || 0);
    const length = Number(section.l || section.length || 0);
    let area = 0;
    let deq = 0;

    if (type === 'pipe') {
      const d = Number(section.d || section.diameter || 0);
      area = this.circularArea(d);
      deq = d;
    } else {
      const b = Number(section.b || section.width || 0);
      const h = Number(section.h || section.height || 0);
      area = this.rectangleArea(b, h);
      deq = this.equivalentDiameterRectangle(b, h);
    }

    const velocity = this.velocity(q, area);
    const pdyn = this.dynamicPressure(velocity);
    const r = this.frictionRate(pdyn, deq);
    const rl = r * length;
    const z = Number(zetaSum) * pdyn;
    const total = rl + z + Number(section.pa || 0);

    return { type, q, area, deq, velocity, pdyn, r, rl, zetaSum: Number(zetaSum), z, specialPressureLoss: Number(section.pa || 0), total };
  }

  calculateProject(project = {}) {
    const sections = project.sections || project.rows || [];
    const parts = project.formParts || project.parts || [];
    const getZeta = sectionId => parts
      .filter(p => p.sectionId === sectionId || p.rowId === sectionId)
      .reduce((sum, p) => sum + Number(p.zeta || 0), 0);

    const results = sections.map(section => ({
      sectionId: section.id,
      input: section,
      result: this.calculateSection(section, getZeta(section.id))
    }));

    const totals = results.reduce((acc, item) => {
      acc.duct += item.result.rl || 0;
      acc.formParts += item.result.z || 0;
      acc.special += item.result.specialPressureLoss || 0;
      acc.total += item.result.total || 0;
      return acc;
    }, { duct: 0, formParts: 0, special: 0, total: 0 });

    return { results, totals };
  }

  emptyResult(extra = {}) {
    return { area: 0, deq: 0, velocity: 0, pdyn: 0, r: 0, rl: 0, zetaSum: 0, z: 0, specialPressureLoss: 0, total: 0, ...extra, total: extra.specialPressureLoss || 0 };
  }
}

export default CalculationEngine;
