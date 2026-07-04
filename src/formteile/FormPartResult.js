// Druckverlust Pro – FormPartResult
// Einheitliches Ergebnisobjekt für alle Formteil-Rechner.

export default class FormPartResult {
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.category = data.category || '';
    this.input = data.input || {};
    this.calculation = data.calculation || {};
    this.zeta = Number(data.zeta ?? 0);
    this.warnings = data.warnings || [];
  }

  hasWarnings() {
    return this.warnings.length > 0;
  }
}