// Druckverlust Pro – Phase 21.10
// Automatischer QS-Lauf für das Beta-Feedback-Datenmodell.

import {
  BETA_FEEDBACK_KIND,
  createBetaFeedbackDraft,
  createBetaFeedbackJson,
  formatBetaFeedback,
  parseBetaFeedbackJson,
  summarizeBetaFeedback,
  validateBetaFeedbackDraft,
} from '../testing/BetaFeedbackReport.js?v=21.12&release=46.00';

function runCheck(label, fn) {
  try {
    const value = fn();
    return { label, passed: value !== false, value };
  } catch (error) {
    return { label, passed: false, error: error?.message || String(error) };
  }
}

export default class BetaFeedbackDiagnostics {
  static run() {
    const draft = createBetaFeedbackDraft({
      reporter: { name: 'Test Planer', role: 'Lüftungsplanung' },
      issue: {
        category: 'formpart',
        severity: 'high',
        title: 'Formteilgrösse wird nicht übernommen',
        description: 'Nach dem Wechsel der Teilstrecke bleibt die alte Grösse sichtbar.',
        steps: 'Formteil öffnen, Teilstrecke wechseln, Ergebnis prüfen.',
        actual: 'Alte Grösse bleibt stehen.',
        expected: 'Neue Teilstreckengrösse wird übernommen.',
        projectContext: 'Demo-Projekt, TS 2',
      },
    });

    const checks = [
      runCheck('Dateityp gesetzt', () => draft.kind === BETA_FEEDBACK_KIND),
      runCheck('Kategorie bleibt erhalten', () => draft.issue.category === 'formpart'),
      runCheck('Priorität bleibt erhalten', () => draft.issue.severity === 'high'),
      runCheck('Umgebung vorhanden', () => Boolean(draft.environment)),
      runCheck('Vollständige Meldung gültig', () => validateBetaFeedbackDraft(draft).valid),
      runCheck('Vollständige Meldung komplett', () => validateBetaFeedbackDraft(draft).complete),
      runCheck('Status vollständig', () => summarizeBetaFeedback(draft).status === 'complete'),
      runCheck('Prioritätsgewicht high = 4', () => summarizeBetaFeedback(draft).severityWeight === 4),
      runCheck('Kategoriebezeichnung enthält Formteil', () => summarizeBetaFeedback(draft).categoryLabel.includes('Formteil')),
      runCheck('Text enthält Titel', () => formatBetaFeedback(draft).includes(draft.issue.title)),
      runCheck('Text enthält Datenschutz-Hinweis', () => formatBetaFeedback(draft).includes('nicht automatisch versendet')),
      runCheck('JSON enthält Dateityp', () => JSON.parse(createBetaFeedbackJson(draft)).kind === BETA_FEEDBACK_KIND),
      runCheck('JSON-Roundtrip erhält Titel', () => parseBetaFeedbackJson(createBetaFeedbackJson(draft)).issue.title === draft.issue.title),
      runCheck('JSON-Roundtrip erhält Name', () => parseBetaFeedbackJson(createBetaFeedbackJson(draft)).reporter.name === draft.reporter.name),
      runCheck('Leere Blockermeldung ungültig', () => !validateBetaFeedbackDraft(createBetaFeedbackDraft({ issue: { severity: 'blocker' } })).valid),
      runCheck('Blockermeldung liefert mehrere Fehler', () => validateBetaFeedbackDraft(createBetaFeedbackDraft({ issue: { severity: 'blocker' } })).errors.length >= 3),
      runCheck('Ungültige Kategorie fällt zurück', () => createBetaFeedbackDraft({ issue: { category: 'invalid' } }).issue.category === 'calculation'),
      runCheck('Ungültige Priorität fällt zurück', () => createBetaFeedbackDraft({ issue: { severity: 'invalid' } }).issue.severity === 'medium'),
    ];

    const failedChecks = checks.filter(item => !item.passed).length;
    return {
      status: failedChecks ? 'error' : 'ok',
      passed: failedChecks === 0,
      label: failedChecks ? 'Beta-Feedback-QS fehlgeschlagen' : 'Beta-Feedback-QS bestanden',
      summary: failedChecks
        ? `${failedChecks} von ${checks.length} Prüfungen sind fehlgeschlagen.`
        : `${checks.length} von ${checks.length} Prüfungen bestanden.`,
      counts: {
        checks: checks.length,
        passedChecks: checks.length - failedChecks,
        failedChecks,
      },
      checks,
    };
  }
}
