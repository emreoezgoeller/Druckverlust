/**
 * Druckverlust Pro – CalculationEngine
 * Version 0.3.3
 *
 * Zentrale, DOM-unabhängige Berechnungslogik.
 * Dieses Modul verändert die bestehende Webseite nicht direkt.
 * Es ist die Grundlage für die Professional-Version.
 */
export class CalculationEngine {
  static defaults = Object.freeze({ rho: 1.21, lambda: 0.025 });

  static number(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  static rectangleArea(width, height) {
    width = this.number(width);
    height = this.number(height);
    return width > 0 && height > 0 ? width * height : 0;
  }

  static circularArea(diameter) {
    diameter = this.number(diameter);
    return diameter > 0 ? Math.PI * Math.pow(diameter, 2) / 4 : 0;
  }

  static hydraulicDiameterRectangle(width, height) {
    width = this.number(width);
    height = this.number(height);
    return width > 0 && height > 0 ? (2 * width * height) / (width + height) : 0;
  }

  static velocity(volumeFlowM3h, areaM2) {
    volumeFlowM3h = this.number(volumeFlowM3h);
    areaM2 = this.number(areaM2);
    return volumeFlowM3h > 0 && areaM2 > 0 ? volumeFlowM3h / (3600 * areaM2) : 0;
  }

  static dynamicPressure(velocityMS, rho = this.defaults.rho) {
    velocityMS = this.number(velocityMS);
    rho = this.number(rho, this.defaults.rho);
    return velocityMS > 0 ? 0.5 * rho * velocityMS * velocityMS : 0;
  }

  static frictionRate(lambda, hydraulicDiameterM, dynamicPressurePa) {
    lambda = this.number(lambda, this.defaults.lambda);
    hydraulicDiameterM = this.number(hydraulicDiameterM);
    dynamicPressurePa = this.number(dynamicPressurePa);
    return lambda > 0 && hydraulicDiameterM > 0 && dynamicPressurePa > 0
      ? (lambda / hydraulicDiameterM) * dynamicPressurePa
      : 0;
  }

  static zetaPressureLoss(zetaSum, dynamicPressurePa) {
    return this.number(zetaSum) * this.number(dynamicPressurePa);
  }

  static calculateSection(section, settings = {}) {
    const rho = this.number(settings.rho, this.defaults.rho);
    const lambda = this.number(settings.lambda, this.defaults.lambda);
    const type = section.type || 'duct';

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
        zetaLoss: 0,
        specialLoss: this.number(section.pa),
        totalLoss: this.number(section.pa)
      };
    }

    const q = this.number(section.q);
    const l = this.number(section.l);
    const zetaSum = this.number(section.zetaSum ?? section.zeta);

    let area = 0;
    let hydraulicDiameter = 0;

    if (type === 'pipe' || this.number(section.d) > 0 && !(this.number(section.b) > 0 && this.number(section.h) > 0)) {
      area = this.circularArea(section.d);
      hydraulicDiameter = this.number(section.d);
    } else {
      area = this.rectangleArea(section.b, section.h);
      hydraulicDiameter = this.hydraulicDiameterRectangle(section.b, section.h);
    }

    const v = this.velocity(q, area);
    const pdyn = this.dynamicPressure(v, rho);
    const r = this.frictionRate(lambda, hydraulicDiameter, pdyn);
    const rl = r * l;
    const z = this.zetaPressureLoss(zetaSum, pdyn);
    const specialLoss = this.number(section.pa);

    return {
      type,
      area,
      hydraulicDiameter,
      velocity: v,
      dynamicPressure: pdyn,
      frictionRate: r,
      frictionLoss: rl,
      zetaSum,
      zetaLoss: z,
      specialLoss,
      totalLoss: rl + z + specialLoss
    };
  }

  static calculateProject(project) {
    const settings = project.settings || project.project || {};
    const sections = project.sections || project.rows || [];
    const results = sections.map(section => ({
      id: section.id,
      ts: section.ts,
      description: section.desc || section.description,
      input: section,
      result: this.calculateSection(section, settings)
    }));

    const totals = results.reduce((sum, item) => {
      sum.friction += item.result.frictionLoss;
      sum.formParts += item.result.zetaLoss;
      sum.special += item.result.type === 'special' ? item.result.specialLoss : 0;
      sum.total += item.result.totalLoss;
      return sum;
    }, { friction: 0, formParts: 0, special: 0, total: 0 });

    return { results, totals };
  }
}
