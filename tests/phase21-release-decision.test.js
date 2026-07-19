import {
  createReleaseDecisionDraft,
  summarizeReleaseDecision,
  validateReleaseDecisionDraft,
  formatReleaseDecision,
  createReleaseDecisionCsv,
  serializeReleaseDecision,
  deserializeReleaseDecision,
} from '../src/testing/ReleaseDecisionPlan.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createRound(status = 'blocked') {
  return {
    generatedAt: '2026-07-12T10:00:00.000Z',
    status,
    label: status === 'blocked' ? 'Freigabe blockiert' : 'Freigabe mit Hinweisen prüfen',
    recommendation: 'Gezielte Korrekturrunde durchführen.',
    counts: {
      reports: 3,
      completeReports: 3,
      incompleteReports: 0,
      testers: 3,
      ok: 22,
      notice: 2,
      error: status === 'blocked' ? 1 : 0,
      notTested: 1,
    },
    priorities: [
      {
        id: 'pdf-export',
        area: 'Bericht / PDF',
        title: 'PDF-Ausgabe vollständig prüfen',
        counts: { ok: 2, notice: 0, error: status === 'blocked' ? 1 : 0, not_tested: 0 },
        notes: [{ tester: 'Tester A', status: 'error', note: 'Seitenumbruch prüfen.' }],
      },
      {
        id: 'formpart-sync',
        area: 'Formteile',
        title: 'Grössenübernahme prüfen',
        counts: { ok: 1, notice: 2, error: 0, not_tested: 0 },
        notes: [{ tester: 'Tester B', status: 'notice', note: 'Hinweis bei manueller Änderung ergänzen.' }],
      },
      {
        id: 'project-file',
        area: 'Projektdatei',
        title: 'Öffnen älterer Dateien nachtesten',
        counts: { ok: 2, notice: 0, error: 0, not_tested: 1 },
        notes: [],
      },
    ],
  };
}

export function runReleaseDecisionTests() {
  const checks = [];
  const check = (label, fn) => {
    try {
      fn();
      checks.push({ label, passed: true });
    } catch (error) {
      checks.push({ label, passed: false, error: error.message });
    }
  };

  const round = createRound('blocked');
  const draft = createReleaseDecisionDraft(round, {}, '1.3.8');

  check('Entwurf übernimmt Anzahl Rückmeldungen', () => assert(draft.roundSnapshot.reports === 3, `Ist ${draft.roundSnapshot.reports}`));
  check('Entwurf erzeugt drei Massnahmen', () => assert(draft.actions.length === 3, `Ist ${draft.actions.length}`));
  check('Fehler wird als kritisch priorisiert', () => assert(draft.actions[0].severity === 'critical', draft.actions[0].severity));
  check('Hinweis wird hoch priorisiert', () => assert(draft.actions[1].severity === 'high', draft.actions[1].severity));
  check('Nicht geprüft wird mittel priorisiert', () => assert(draft.actions[2].severity === 'medium', draft.actions[2].severity));
  check('Blockierte Runde schlägt blockiert vor', () => assert(draft.suggestedDecision === 'blocked', draft.suggestedDecision));
  check('Formelle Entscheidung bleibt bewusst offen', () => assert(draft.decision === 'pending', draft.decision));
  check('Zielversion wird übernommen', () => assert(draft.targetVersion === '1.3.8', draft.targetVersion));

  const preserved = createReleaseDecisionDraft(round, {
    ...draft,
    decision: 'approved_with_conditions',
    decidedBy: 'Emre Özgöller',
    decisionDate: '2026-07-12',
    actions: draft.actions.map((action, index) => ({
      ...action,
      status: index === 0 ? 'done' : action.status,
      owner: index === 0 ? 'EO' : '',
      correction: index === 0 ? 'Seitenumbruch korrigiert.' : '',
      retestStatus: index === 0 ? 'passed' : action.retestStatus,
    })),
  }, '1.3.8');

  check('Bearbeitete Massnahme bleibt beim Aktualisieren erhalten', () => assert(preserved.actions[0].status === 'done', preserved.actions[0].status));
  check('Verantwortlicher bleibt erhalten', () => assert(preserved.actions[0].owner === 'EO', preserved.actions[0].owner));
  check('Korrekturtext bleibt erhalten', () => assert(preserved.actions[0].correction.includes('Seitenumbruch'), preserved.actions[0].correction));

  const blockedSummary = summarizeReleaseDecision(draft);
  check('Offene kritische Massnahme blockiert', () => assert(blockedSummary.status === 'blocked', blockedSummary.status));
  check('Massnahmenzählung ist konsistent', () => assert(blockedSummary.counts.total === 3 && blockedSummary.counts.open === 3, JSON.stringify(blockedSummary.counts)));

  const releasedDraft = createReleaseDecisionDraft(createRound('review'), {
    decision: 'approved',
    decidedBy: 'Emre Özgöller',
    decisionDate: '2026-07-12',
    targetVersion: '1.3.8',
    releaseNote: 'Fachlich geprüft.',
    actions: createReleaseDecisionDraft(createRound('review')).actions.map(action => ({
      ...action,
      status: 'done',
      owner: 'EO',
      correction: 'Erledigt',
      retestStatus: 'passed',
    })),
  }, '1.3.8');
  const releasedSummary = summarizeReleaseDecision(releasedDraft);
  const releasedValidation = validateReleaseDecisionDraft(releasedDraft);

  check('Abgeschlossener Plan wird freigegeben', () => assert(releasedSummary.status === 'released', releasedSummary.status));
  check('Abgeschlossener Plan ist vollständig', () => assert(releasedValidation.complete === true, JSON.stringify(releasedValidation)));
  check('Freigabetext enthält Entscheidung', () => assert(formatReleaseDecision(releasedDraft).includes('Fachlich freigegeben'), 'Text fehlt'));
  check('CSV enthält Massnahmenüberschrift', () => assert(createReleaseDecisionCsv(releasedDraft).includes('Verantwortlich'), 'CSV fehlt'));

  const serialized = serializeReleaseDecision(releasedDraft);
  const restored = deserializeReleaseDecision(serialized);
  check('JSON-Roundtrip liefert Entwurf', () => assert(restored?.kind === 'druckverlust-pro-release-decision', restored?.kind));
  check('JSON-Roundtrip erhält Entscheider', () => assert(restored?.decidedBy === 'Emre Özgöller', restored?.decidedBy));
  check('JSON-Roundtrip erhält Massnahmenstatus', () => assert(restored?.actions.every(action => action.status === 'done'), JSON.stringify(restored?.actions)));
  check('Fremdes JSON wird abgewiesen', () => assert(deserializeReleaseDecision('{"kind":"other"}') === null, 'Soll null sein'));
  check('Ungültiges JSON wird abgewiesen', () => assert(deserializeReleaseDecision('{') === null, 'Soll null sein'));

  const invalid = validateReleaseDecisionDraft({ ...draft, decision: 'approved' });
  check('Freigabe ohne Person wird beanstandet', () => assert(invalid.errors.some(item => item.includes('Person')), invalid.errors.join(' | ')));
  check('Freigabe ohne Datum wird beanstandet', () => assert(invalid.errors.some(item => item.includes('Freigabedatum')), invalid.errors.join(' | ')));

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

export default runReleaseDecisionTests;
