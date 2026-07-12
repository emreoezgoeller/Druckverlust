import assert from 'node:assert/strict';
import {
  BETA_FEEDBACK_KIND,
  createBetaFeedbackDraft,
  createBetaFeedbackJson,
  formatBetaFeedback,
  parseBetaFeedbackJson,
  summarizeBetaFeedback,
  validateBetaFeedbackDraft,
} from '../src/testing/BetaFeedbackReport.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

const complete = createBetaFeedbackDraft({
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

check(complete.kind === BETA_FEEDBACK_KIND, 'Kind muss gesetzt sein.');
check(complete.issue.category === 'formpart', 'Kategorie muss erhalten bleiben.');
check(complete.issue.severity === 'high', 'Priorität muss erhalten bleiben.');
check(Boolean(complete.environment), 'Umgebung muss vorhanden sein.');

const validation = validateBetaFeedbackDraft(complete);
check(validation.valid, 'Vollständige Meldung muss gültig sein.');
check(validation.complete, 'Vollständige Meldung muss komplett sein.');

const summary = summarizeBetaFeedback(complete);
check(summary.status === 'complete', 'Status muss complete sein.');
check(summary.severityWeight === 4, 'Prioritätsgewicht für high muss 4 sein.');
check(summary.categoryLabel.includes('Formteil'), 'Kategoriebezeichnung muss Formteil enthalten.');

const text = formatBetaFeedback(complete);
check(text.includes('Formteilgrösse wird nicht übernommen'), 'Textausgabe muss Titel enthalten.');
check(text.includes('nicht automatisch versendet'), 'Textausgabe muss Datenschutz-Hinweis enthalten.');

const json = createBetaFeedbackJson(complete);
const parsed = JSON.parse(json);
check(parsed.kind === BETA_FEEDBACK_KIND, 'JSON muss Dateityp enthalten.');
const roundtrip = parseBetaFeedbackJson(json);
check(roundtrip.issue.title === complete.issue.title, 'JSON-Roundtrip muss Titel erhalten.');
check(roundtrip.reporter.name === complete.reporter.name, 'JSON-Roundtrip muss Testername erhalten.');

const incomplete = createBetaFeedbackDraft({ issue: { severity: 'blocker' } });
const invalid = validateBetaFeedbackDraft(incomplete);
check(!invalid.valid, 'Leere blockierende Meldung muss ungültig sein.');
check(invalid.errors.length >= 3, 'Leere blockierende Meldung muss mehrere Fehler liefern.');

const sanitized = createBetaFeedbackDraft({ issue: { category: 'invalid', severity: 'invalid' } });
check(sanitized.issue.category === 'calculation', 'Ungültige Kategorie muss auf Standard fallen.');
check(sanitized.issue.severity === 'medium', 'Ungültige Priorität muss auf Standard fallen.');

console.log(`Phase 21.10 Beta-Feedback: ${checks}/${checks} Prüfungen bestanden.`);
