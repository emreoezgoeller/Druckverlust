// Druckverlust Pro – Diagnoseansicht für feste Rechenreferenzen

import { formatReferenceTestReport, runReferenceTests } from '../testing/ReferenceTestRunner.js';

export default class ReferenceTestDiagnostics {
  static run() {
    return runReferenceTests();
  }

  static toText(report = {}) {
    return formatReferenceTestReport(report);
  }
}
