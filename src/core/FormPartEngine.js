/* Druckverlust Pro – FormPartEngine v0.4.1
 * Zeta-Berechnung: aktuell sichere Grundstruktur.
 * Die Excel-Tabellen/Formeln werden in den nächsten Sprints formteilweise 1:1 übertragen.
 */
(function (global) {
  'use strict';

  function number(value, fallback = 0) {
    const v = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
    return Number.isFinite(v) ? v : fallback;
  }

  function round(value, decimals = 4) {
    const factor = Math.pow(10, decimals);
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  // Vorläufige, transparente Näherungen für UI-Test und Datenfluss.
  // Jede Formel bekommt später ihren Excel-Abgleich und TEST-Fall.
  const calculators = {
    kreis_bogen(params) {
      const R = number(params.R);
      const d = number(params.d);
      const alpha = number(params.alpha ?? params['α'], 90);
      if (R <= 0 || d <= 0) return { zeta: 0, note: 'R und d erforderlich.' };
      const ratio = R / d;
      const base = ratio >= 1 ? 0.21 : 0.35;
      return { zeta: round(base * (alpha / 90)), note: 'Vorläufige Formel, Excel-Abgleich folgt.' };
    },
    default(params) {
      const zeta = number(params.zeta ?? params['ζ']);
      return { zeta: round(zeta), note: zeta ? 'Manuell erfasster ζ-Wert.' : 'ζ-Wert fehlt.' };
    }
  };

  function calculate(formPartId, params = {}) {
    const fn = calculators[formPartId] || calculators.default;
    return Object.assign({ formPartId }, fn(params));
  }

  function assignToSection(section, formPart, params, result) {
    const entry = {
      id: `${formPart.id}_${Date.now().toString(36)}`,
      formPartId: formPart.id,
      name: formPart.name,
      category: formPart.category,
      params: Object.assign({}, params),
      zeta: number(result.zeta),
      note: result.note || ''
    };
    section.formParts = Array.isArray(section.formParts) ? section.formParts : [];
    section.formParts.push(entry);
    section.zetaSum = section.formParts.reduce((sum, p) => sum + number(p.zeta), 0);
    return section;
  }

  const FormPartEngine = { calculate, assignToSection };
  global.DruckverlustPro = global.DruckverlustPro || {};
  global.DruckverlustPro.FormPartEngine = FormPartEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = FormPartEngine;
})(typeof window !== 'undefined' ? window : globalThis);
