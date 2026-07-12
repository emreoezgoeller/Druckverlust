import {
  BETA_AUTOMATED_BASELINE,
  BETA_RELEASE_CHECKLIST,
  createBetaReleaseDraft,
  summarizeBetaRelease,
  formatBetaRelease,
  createBetaReleaseCsv,
  serializeBetaRelease,
  deserializeBetaRelease,
} from '../src/testing/BetaReleaseReadiness.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function releasedDecision(status = 'released') {
  return {
    kind: 'druckverlust-pro-release-decision',
    roundSnapshot: {
      generatedAt: '2026-07-12T10:00:00.000Z',
      status: status === 'released' ? 'ready' : 'review',
      label: status === 'released' ? 'Fachliche Freigabe vorbereitet' : 'Freigabe mit Hinweisen prüfen',
      recommendation: 'Prüfung abgeschlossen.',
      counts: { reports: 3 },
      reports: 3,
    },
    decision: status === 'released' ? 'approved' : 'approved_with_conditions',
    decidedBy: 'Emre Özgöller',
    decisionDate: '2026-07-12',
    targetVersion: '1.3.10',
    releaseNote: 'Beta-Test freigegeben.',
    actions: [],
  };
}

function feedbackRound(status = 'ready') {
  return {
    generatedAt: '2026-07-12T10:00:00.000Z',
    status,
    label: status === 'ready' ? 'Fachliche Freigabe vorbereitet' : 'Freigabe mit Hinweisen prüfen',
    recommendation: 'Beta vorbereiten.',
    counts: {
      reports: 3,
      completeReports: 3,
      incompleteReports: 0,
      testers: 3,
      ok: 30,
      notice: status === 'ready' ? 0 : 1,
      error: 0,
      notTested: 0,
    },
    priorities: [],
  };
}

function completedChecklist() {
  return Object.fromEntries(BETA_RELEASE_CHECKLIST.map(item => [item.id, true]));
}

export function runBetaReleaseTests() {
  const checks = [];
  const check = (label, fn) => {
    try {
      fn();
      checks.push({ label, passed: true });
    } catch (error) {
      checks.push({ label, passed: false, error: error.message });
    }
  };

  const context = {
    targetVersion: '1.3.10',
    publicUrl: 'https://emreoezgoeller.github.io/Druckverlust/',
    feedbackRound: feedbackRound('ready'),
    releaseDecision: releasedDecision('released'),
  };

  const draft = createBetaReleaseDraft({
    owner: 'Emre Özgöller',
    betaDate: '2026-07-12',
    checklist: completedChecklist(),
  }, context);
  const ready = summarizeBetaRelease(draft, context);

  check('Schema wird gesetzt', () => assert(draft.schemaVersion === '1.0', draft.schemaVersion));
  check('Zielversion wird übernommen', () => assert(draft.targetVersion === '1.3.10', draft.targetVersion));
  check('Öffentliche URL wird übernommen', () => assert(draft.publicUrl.includes('github.io'), draft.publicUrl));
  check('Automatische Prüfserien vollständig', () => assert(draft.automated.passedSuites === BETA_AUTOMATED_BASELINE.suites, JSON.stringify(draft.automated)));
  check('Dokumentierte Einzelprüfungen vollständig', () => assert(draft.automated.passedChecks === 443, draft.automated.passedChecks));
  check('Fachtestberichte werden übernommen', () => assert(draft.feedbackSnapshot.reports === 3, draft.feedbackSnapshot.reports));
  check('Freigabestatus wird übernommen', () => assert(draft.releaseSnapshot.status === 'released', draft.releaseSnapshot.status));
  check('Checkliste enthält alle Pflichtpunkte', () => assert(ready.checklist.total === BETA_RELEASE_CHECKLIST.length, ready.checklist.total));
  check('Checkliste ist vollständig', () => assert(ready.checklist.open.length === 0, ready.checklist.open.length));
  check('Vollständiger Stand ist bereit', () => assert(ready.status === 'ready', ready.status));
  check('Bereitschaft enthält keine Fehler', () => assert(ready.errors.length === 0, ready.errors.join(' | ')));
  check('Bereitschaft enthält keine Warnungen', () => assert(ready.warnings.length === 0, ready.warnings.join(' | ')));

  const incomplete = summarizeBetaRelease(createBetaReleaseDraft({}, {
    targetVersion: '1.3.10',
    feedbackRound: { counts: { reports: 0 }, status: 'no_data', label: 'Keine Rückmeldungen' },
    releaseDecision: { decision: 'pending', roundSnapshot: { reports: 0 }, actions: [] },
  }));
  check('Leerer Stand bleibt Vorbereitung', () => assert(incomplete.status === 'preparation', incomplete.status));
  check('Fehlende Rückmeldungen werden gemeldet', () => assert(incomplete.warnings.some(item => item.includes('Fachtest')), incomplete.warnings.join(' | ')));
  check('Offene Freigabe wird gemeldet', () => assert(incomplete.warnings.some(item => item.includes('Freigabeentscheidung')), incomplete.warnings.join(' | ')));
  check('Offene Checkliste wird gemeldet', () => assert(incomplete.checklist.open.length === BETA_RELEASE_CHECKLIST.length, incomplete.checklist.open.length));

  const blocked = summarizeBetaRelease(createBetaReleaseDraft({
    owner: 'EO',
    betaDate: '2026-07-12',
    publicUrl: 'https://example.test',
    checklist: completedChecklist(),
  }, {
    feedbackRound: feedbackRound('ready'),
    releaseDecision: {
      ...releasedDecision('released'),
      decision: 'blocked',
      actions: [{ id: 'critical', checkId: 'critical', area: 'PDF', title: 'Fehler', severity: 'critical', severityLabel: 'Kritisch', counts: { error: 1 }, status: 'open', retestStatus: 'failed' }],
    },
  }));
  check('Blockierte Freigabe blockiert Beta', () => assert(blocked.status === 'blocked', blocked.status));
  check('Blockierung erzeugt Fehlerhinweis', () => assert(blocked.errors.length > 0, blocked.errors.length));

  const conditioned = summarizeBetaRelease(createBetaReleaseDraft({
    owner: 'EO',
    betaDate: '2026-07-12',
    publicUrl: 'https://example.test',
    checklist: completedChecklist(),
  }, {
    feedbackRound: feedbackRound('review'),
    releaseDecision: releasedDecision('released_with_conditions'),
  }));
  check('Freigabe mit Auflagen wird erkannt', () => assert(conditioned.status === 'ready_with_conditions', conditioned.status));

  const text = formatBetaRelease(draft, context);
  check('Text enthält Beta-Status', () => assert(text.includes('Öffentliche Beta vorbereitet'), text));
  check('Text enthält Checkliste', () => assert(text.includes('Beta-Checkliste'), text));
  const csv = createBetaReleaseCsv(draft, context);
  check('CSV enthält Pflichtpunkt', () => assert(csv.includes('Pflichtpunkt'), csv));
  check('CSV enthält Zielversion', () => assert(csv.includes('1.3.10'), csv));

  const serialized = serializeBetaRelease(draft, context);
  const restored = deserializeBetaRelease(serialized, context);
  check('JSON-Roundtrip erhält Art', () => assert(restored?.kind === 'druckverlust-pro-beta-release', restored?.kind));
  check('JSON-Roundtrip erhält Checkliste', () => assert(restored?.checklist?.pdf === true, JSON.stringify(restored?.checklist)));
  check('Fremdes JSON wird abgewiesen', () => assert(deserializeBetaRelease('{"kind":"other"}') === null, 'Soll null sein'));
  check('Ungültiges JSON wird abgewiesen', () => assert(deserializeBetaRelease('{') === null, 'Soll null sein'));

  return {
    passed: checks.every(item => item.passed),
    checks,
    counts: {
      total: checks.length,
      passed: checks.filter(item => item.passed).length,
      failed: checks.filter(item => !item.passed).length,
    },
  };
}

export default runBetaReleaseTests;
