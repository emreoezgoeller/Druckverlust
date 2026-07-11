// Druckverlust Pro – Diagnoseansicht für Formteilbibliothek und Excel-Referenzen

import { formatFormPartValidationReport, runFormPartValidation } from '../testing/FormPartValidationRunner.js';

export default class FormPartValidationDiagnostics {
  static run() {
    return runFormPartValidation();
  }

  static toText(report = {}) {
    return formatFormPartValidationReport(report);
  }
}
