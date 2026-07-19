// Druckverlust Pro – Diagnoseansicht für die fachliche Vergleichsmatrix Phase 21.04

import {
  createComparisonMatrixCsv,
  formatComparisonMatrixReport,
  runComparisonMatrix,
} from '../testing/ComparisonMatrixRunner.js';

export default class ComparisonMatrixDiagnostics {
  static run() {
    return runComparisonMatrix();
  }

  static toText(report = {}) {
    return formatComparisonMatrixReport(report);
  }

  static toCsv(report = {}) {
    return createComparisonMatrixCsv(report);
  }
}
