/* Druckverlust Pro – CalculationEngine v0.4.1
 * Zentrale, browserkompatible Berechnungs-Engine.
 * Keine DOM-Abhängigkeit. Kann später von UI, Tests und PDF gemeinsam genutzt werden.
 */
(function (global) {
  'use strict';

  const DEFAULTS = Object.freeze({
    rho: 1.2,       // kg/m³
    lambda: 0.025,  // -
    decimals: 3
  });

  function n(value, fallback = 0) {
    const parsed = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function round(value, decimals = 3) {
    if (!Number.isFinite(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function areaRect(width, height) {
    const b = n(width);
    const h = n(height);
    return b > 0 && h > 0 ? b * h : 0;
  }

  function areaRound(diameter) {
    const d = n(diameter);
    return d > 0 ? Math.PI * Math.pow(d, 2) / 4 : 0;
  }

  function hydraulicDiameterRect(width, height) {
    const b = n(width);
    const h = n(height);
    return b > 0 && h > 0 ? (2 * b * h) / (b + h) : 0;
  }

  function velocity(volumeM3h, areaM2) {
    const q = n(volumeM3h);
    const a = n(areaM2);
    return q > 0 && a > 0 ? q / 3600 / a : 0;
  }

  function dynamicPressure(v, rho = DEFAULTS.rho) {
    const speed = n(v);
    const density = n(rho, DEFAULTS.rho);
    return speed > 0 ? 0.5 * density * Math.pow(speed, 2) : 0;
  }

  function frictionRate(pDyn, diameter, lambda = DEFAULTS.lambda) {
    const d = n(diameter);
    const p = n(pDyn);
    const lmb = n(lambda, DEFAULTS.lambda);
    return d > 0 && p > 0 ? (lmb / d) * p : 0;
  }

  function calculateSection(section, options = {}) {
    const opts = Object.assign({}, DEFAULTS, options);
    const type = section.type || section.kind || 'rect';
    const q = n(section.volume ?? section.q ?? section.luftmenge);
    const length = n(section.length ?? section.l ?? section.laenge);
    const zeta = n(section.zetaSum ?? section.zeta ?? section.sumZeta);

    let area = 0;
    let dh = 0;
    let dimensions = '';

    if (type === 'round' || type === 'rohr') {
      const d = n(section.diameter ?? section.d ?? section.durchmesser);
      area = areaRound(d);
      dh = d;
      dimensions = d > 0 ? `Ø${round(d * 1000, 0)} mm` : '';
    } else {
      const b = n(section.width ?? section.b ?? section.breite);
      const h = n(section.height ?? section.h ?? section.hoehe);
      area = areaRect(b, h);
      dh = hydraulicDiameterRect(b, h);
      dimensions = b > 0 && h > 0 ? `${round(b * 1000, 0)}×${round(h * 1000, 0)} mm` : '';
    }

    const v = velocity(q, area);
    const pDyn = dynamicPressure(v, opts.rho);
    const r = frictionRate(pDyn, dh, opts.lambda);
    const dpFriction = r * length;
    const dpZeta = zeta * pDyn;
    const dpTotal = dpFriction + dpZeta;

    return {
      id: section.id || '',
      type,
      description: section.description || section.beschreibung || dimensions,
      dimensions,
      volume: round(q, 3),
      length: round(length, 3),
      area: round(area, 4),
      hydraulicDiameter: round(dh, 4),
      velocity: round(v, 3),
      dynamicPressure: round(pDyn, 3),
      frictionRate: round(r, 4),
      pressureFriction: round(dpFriction, 3),
      zetaSum: round(zeta, 4),
      pressureZeta: round(dpZeta, 3),
      pressureTotal: round(dpTotal, 3),
      warnings: getSectionWarnings({ velocity: v, dynamicPressure: pDyn, hydraulicDiameter: dh })
    };
  }

  function calculateSpecial(component) {
    const pressure = n(component.pressure ?? component.dp ?? component.druckverlust);
    const amount = n(component.amount ?? component.anzahl, 1);
    return {
      id: component.id || '',
      type: 'special',
      description: component.description || component.name || 'Sonderbauteil',
      pressure: round(pressure, 3),
      amount: round(amount, 3),
      pressureTotal: round(pressure * amount, 3)
    };
  }

  function calculateProject(project, options = {}) {
    const items = project.items || project.sections || [];
    const results = items.map((item) => {
      if ((item.type || item.kind) === 'special' || item.kind === 'sonderbauteil') return calculateSpecial(item);
      return calculateSection(item, options);
    });

    const channelPressure = results
      .filter((r) => r.type !== 'special')
      .reduce((sum, r) => sum + r.pressureTotal, 0);
    const specialPressure = results
      .filter((r) => r.type === 'special')
      .reduce((sum, r) => sum + r.pressureTotal, 0);

    return {
      results,
      totals: {
        channelPressure: round(channelPressure, 3),
        specialPressure: round(specialPressure, 3),
        totalPressure: round(channelPressure + specialPressure, 3)
      },
      warnings: results.flatMap((r) => r.warnings || [])
    };
  }

  function getSectionWarnings(values) {
    const warnings = [];
    if (values.velocity > 8) warnings.push({ level: 'warning', code: 'HIGH_VELOCITY', message: 'Luftgeschwindigkeit über 8 m/s prüfen.' });
    if (values.velocity > 12) warnings.push({ level: 'critical', code: 'VERY_HIGH_VELOCITY', message: 'Luftgeschwindigkeit sehr hoch.' });
    if (values.hydraulicDiameter <= 0) warnings.push({ level: 'info', code: 'MISSING_DIMENSIONS', message: 'Abmessungen fehlen oder sind ungültig.' });
    return warnings;
  }

  const CalculationEngine = {
    DEFAULTS,
    round,
    areaRect,
    areaRound,
    hydraulicDiameterRect,
    velocity,
    dynamicPressure,
    frictionRate,
    calculateSection,
    calculateSpecial,
    calculateProject
  };

  global.DruckverlustPro = global.DruckverlustPro || {};
  global.DruckverlustPro.CalculationEngine = CalculationEngine;

  if (typeof module !== 'undefined' && module.exports) module.exports = CalculationEngine;
})(typeof window !== 'undefined' ? window : globalThis);
