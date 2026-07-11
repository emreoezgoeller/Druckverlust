// Druckverlust Pro – Diagnoseansicht für Grössen- und Anschluss-Synchronisation Phase 21.03

import { formatFormPartSyncReport, runFormPartSyncValidation } from '../testing/FormPartSyncRunner.js';

export default class FormPartSyncDiagnostics {
  static run() {
    return runFormPartSyncValidation();
  }

  static toText(report = {}) {
    return formatFormPartSyncReport(report);
  }
}
