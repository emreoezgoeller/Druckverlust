import {
  createFeedbackRound,
  createFeedbackRoundCsv,
  formatFeedbackRound,
  parseFeedbackJson,
} from '../src/testing/ExpertFeedbackRound.js';
import {
  EXPERT_TEST_CHECKS,
  createExpertTestDraft,
  createExpertTestJson,
} from '../src/testing/ExpertTestProtocol.js';

function assertion(label, passed, actual = '', expected = '') {
  return { label, passed: Boolean(passed), actual, expected };
}

function completeDraft(name, recommendation = 'release', status = 'ok') {
  return createExpertTestDraft({
    tester: { name, role: 'Gebäudetechnikplaner Lüftung' },
    checks: EXPERT_TEST_CHECKS.map(item => ({ id: item.id, status, note: status === 'ok' ? '' : `${name}: Hinweis` })),
    overall: { rating: 'gut', recommendation },
  });
}

export function runFeedbackRoundTests() {
  const checks = [];

  const empty = createFeedbackRound([]);
  checks.push(assertion('Leere Runde wird erkannt', empty.status === 'no_data', empty.status, 'no_data'));

  const readyDraftA = completeDraft('Anna', 'release', 'ok');
  const readyDraftB = completeDraft('Beat', 'release', 'ok');
  const ready = createFeedbackRound([{ draft: readyDraftA }, { draft: readyDraftB }]);
  checks.push(assertion('Zwei Berichte werden gezählt', ready.counts.reports === 2, ready.counts.reports, 2));
  checks.push(assertion('Zwei Tester werden erkannt', ready.counts.testers === 2, ready.counts.testers, 2));
  checks.push(assertion('Fehlerfreie vollständige Runde ist bereit', ready.status === 'ready', ready.status, 'ready'));
  checks.push(assertion('Alle OK-Bewertungen werden summiert', ready.counts.ok === EXPERT_TEST_CHECKS.length * 2, ready.counts.ok, EXPERT_TEST_CHECKS.length * 2));

  const noticeDraft = completeDraft('Céline', 'release_with_notes', 'ok');
  noticeDraft.checks[3].status = 'notice';
  noticeDraft.checks[3].note = 'Bildzuordnung prüfen.';
  const review = createFeedbackRound([{ draft: readyDraftA }, { draft: noticeDraft }]);
  checks.push(assertion('Auffälligkeit führt zu Review', review.status === 'review', review.status, 'review'));
  checks.push(assertion('Auffälligkeit wird gezählt', review.counts.notice === 1, review.counts.notice, 1));
  checks.push(assertion('Bemerkung wird priorisiert', review.priorities[0]?.notes?.[0]?.note === 'Bildzuordnung prüfen.', review.priorities[0]?.notes?.[0]?.note, 'Bildzuordnung prüfen.'));

  const errorDraft = completeDraft('Daniel', 'blocked', 'ok');
  errorDraft.checks[7].status = 'error';
  errorDraft.checks[7].note = 'PDF-Seitenumbruch fehlerhaft.';
  const blocked = createFeedbackRound([{ draft: readyDraftA }, { draft: errorDraft }]);
  checks.push(assertion('Fehler blockiert Freigabe', blocked.status === 'blocked', blocked.status, 'blocked'));
  checks.push(assertion('Fehler erhält höchste Priorität', blocked.priorities[0]?.counts?.error === 1, blocked.priorities[0]?.counts?.error, 1));

  const json = createExpertTestJson(noticeDraft, { status: 'ok', label: 'Bestanden' });
  const parsed = parseFeedbackJson(json, 'celine.json');
  checks.push(assertion('JSON-Export kann importiert werden', parsed.draft.tester.name === 'Céline', parsed.draft.tester.name, 'Céline'));
  checks.push(assertion('Quelldatei bleibt erhalten', parsed.sourceName === 'celine.json', parsed.sourceName, 'celine.json'));

  const text = formatFeedbackRound(review);
  checks.push(assertion('Textauswertung enthält Status', text.includes(review.label), text.includes(review.label), true));
  checks.push(assertion('Textauswertung enthält Bemerkung', text.includes('Bildzuordnung prüfen.'), text.includes('Bildzuordnung prüfen.'), true));

  const csv = createFeedbackRoundCsv(review);
  checks.push(assertion('CSV enthält Prüfpunktspalten', csv.includes('"Prüfpunkt"'), csv.includes('"Prüfpunkt"'), true));
  checks.push(assertion('CSV enthält Bemerkung', csv.includes('Bildzuordnung prüfen.'), csv.includes('Bildzuordnung prüfen.'), true));

  return {
    status: checks.every(item => item.passed) ? 'ok' : 'error',
    label: checks.every(item => item.passed) ? 'Fachtest-Runden-QS bestanden' : 'Fachtest-Runden-QS fehlgeschlagen',
    summary: `${checks.filter(item => item.passed).length} von ${checks.length} Einzelprüfungen bestanden.`,
    counts: {
      checks: checks.length,
      passedChecks: checks.filter(item => item.passed).length,
      failedChecks: checks.filter(item => !item.passed).length,
    },
    checks,
  };
}

export default runFeedbackRoundTests;
