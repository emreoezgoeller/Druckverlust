// Druckverlust Pro – Fachtester-Diagnose Phase 21.10

import ReferenceTestDiagnostics from './ReferenceTestDiagnostics.js';
import FormPartValidationDiagnostics from './FormPartValidationDiagnostics.js';
import FormPartSyncDiagnostics from './FormPartSyncDiagnostics.js';
import ComparisonMatrixDiagnostics from './ComparisonMatrixDiagnostics.js';
import PracticeProjectDiagnostics from './PracticeProjectDiagnostics.js';
import BetaFeedbackDiagnostics from './BetaFeedbackDiagnostics.js?v=21.11';
import {
  createExpertTestCsv,
  createExpertTestJson,
  createExpertTestDraft,
  formatExpertTestProtocol,
  summarizeExpertTestDraft,
  validateExpertTestDraft,
} from '../testing/ExpertTestProtocol.js?v=21.11';

function suiteResult(id, label, report = {}) {
  const checks = Number(
    report.counts?.checks
    ?? report.counts?.referenceChecks
    ?? report.checks?.length
    ?? 0,
  );
  const failedChecks = Number(
    report.counts?.failedChecks
    ?? report.counts?.failed
    ?? (report.checks || []).filter(item => item?.passed === false).length
    ?? 0,
  );
  const passedChecks = Math.max(0, checks - failedChecks);
  const passed = report.status === 'ok' || report.passed === true;

  return {
    id,
    label,
    passed,
    status: passed ? 'ok' : 'error',
    summary: report.summary || report.label || (passed ? 'Bestanden' : 'Fehlgeschlagen'),
    checks,
    passedChecks,
    failedChecks,
  };
}

export default class ExpertTestDiagnostics {
  static runAutomatedPreflight() {
    const startedAt = new Date();
    const suites = [
      suiteResult('reference', 'Rechenkern / Referenztests', ReferenceTestDiagnostics.run()),
      suiteResult('formparts', 'Formteilbibliothek / Excel-Referenzen', FormPartValidationDiagnostics.run()),
      suiteResult('sync', 'Formteil-Grössen- und Anschluss-Sync', FormPartSyncDiagnostics.run()),
      suiteResult('comparison', 'Handrechnungen / Vergleichsmatrix', ComparisonMatrixDiagnostics.run()),
      suiteResult('practice', 'Praxisprojekt / Bericht / .dvp', PracticeProjectDiagnostics.run()),
      suiteResult('beta-feedback', 'Beta-Feedback / Fehlererfassung', BetaFeedbackDiagnostics.run()),
    ];

    const failedSuites = suites.filter(item => !item.passed).length;
    const checks = suites.reduce((sum, item) => sum + item.checks, 0);
    const passedChecks = suites.reduce((sum, item) => sum + item.passedChecks, 0);
    const failedChecks = suites.reduce((sum, item) => sum + item.failedChecks, 0);

    return {
      status: failedSuites ? 'error' : 'ok',
      label: failedSuites ? 'Automatischer Vorabcheck fehlgeschlagen' : 'Automatischer Vorabcheck bestanden',
      summary: failedSuites
        ? `${failedSuites} von ${suites.length} Prüfserien sind fehlgeschlagen.`
        : `${suites.length} Prüfserien und ${checks} Einzelprüfungen sind für den Fachtest bereit.`,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      counts: {
        suites: suites.length,
        passedSuites: suites.length - failedSuites,
        failedSuites,
        checks,
        passedChecks,
        failedChecks,
      },
      suites,
    };
  }

  static create(draft = null, automated = null) {
    const currentDraft = createExpertTestDraft(draft || {});
    const automatedReport = automated || this.runAutomatedPreflight();
    const validation = validateExpertTestDraft(currentDraft);
    const manual = summarizeExpertTestDraft(currentDraft);

    let status = 'in_progress';
    let label = 'Fachtest in Bearbeitung';

    if (automatedReport.status === 'error' || manual.error > 0) {
      status = 'blocked';
      label = 'Fachtest blockiert';
    } else if (manual.notTested === 0 && validation.warnings.length === 0) {
      status = 'ready';
      label = 'Fachtest vollständig';
    } else if (manual.notTested === 0) {
      status = 'review';
      label = 'Fachtest mit Hinweisen';
    }

    return {
      status,
      label,
      summary: automatedReport.status === 'error'
        ? 'Die öffentliche Fachtest-Runde sollte erst nach Behebung der automatischen Testfehler gestartet werden.'
        : `${manual.completed} von ${manual.total} manuellen Prüfpunkten sind bearbeitet.`,
      generatedAt: new Date().toISOString(),
      draft: currentDraft,
      automated: automatedReport,
      validation,
      manual,
    };
  }

  static toText(report = null) {
    const current = report || this.create();
    return formatExpertTestProtocol(current.draft, current.automated);
  }

  static toCsv(report = null) {
    const current = report || this.create();
    return createExpertTestCsv(current.draft, current.automated);
  }

  static toJson(report = null) {
    const current = report || this.create();
    return createExpertTestJson(current.draft, current.automated);
  }
}
