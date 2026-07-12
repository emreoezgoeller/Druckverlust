// Druckverlust Pro – Phase 21.07
// Bündelt mehrere Fachtester-Protokolle und leitet eine Freigabeempfehlung ab.

import {
  EXPERT_TEST_CHECKS,
  EXPERT_TEST_RECOMMENDATIONS,
  createExpertTestDraft,
  summarizeExpertTestDraft,
  validateExpertTestDraft,
} from './ExpertTestProtocol.js';

export const EXPERT_FEEDBACK_ROUND_VERSION = '1.0';
export const EXPERT_FEEDBACK_STORAGE_KEY = 'druckverlust-pro:expert-feedback-round:21.07';

const STATUS_KEYS = Object.freeze(['not_tested', 'ok', 'notice', 'error']);

function safeString(value = '') {
  return String(value ?? '').trim();
}

function recommendationLabel(value = '') {
  return EXPERT_TEST_RECOMMENDATIONS.find(item => item.id === value)?.label || 'Noch keine Empfehlung';
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function normalizeFeedbackEntry(entry = {}, sourceName = '') {
  const rawDraft = entry?.draft || entry?.report?.draft || entry;
  const draft = createExpertTestDraft(rawDraft || {});
  const validation = validateExpertTestDraft(draft);
  const manual = summarizeExpertTestDraft(draft);

  return {
    id: safeString(entry?.id) || `${draft.tester.name || 'fachtest'}-${draft.updatedAt || draft.createdAt}`,
    sourceName: safeString(sourceName || entry?.sourceName || entry?.filename),
    importedAt: safeString(entry?.importedAt) || new Date().toISOString(),
    draft,
    automated: entry?.automated || entry?.report?.automated || null,
    validation,
    manual,
  };
}

export function parseFeedbackJson(text = '', sourceName = '') {
  let parsed;
  try {
    parsed = JSON.parse(String(text || ''));
  } catch (error) {
    throw new Error(`JSON konnte nicht gelesen werden: ${error.message}`);
  }

  const kind = safeString(parsed?.kind);
  if (kind && kind !== 'druckverlust-pro-expert-test') {
    throw new Error(`Nicht unterstützter Dateityp: ${kind}`);
  }

  return normalizeFeedbackEntry(parsed, sourceName);
}

function createCheckSummary(entries = []) {
  return EXPERT_TEST_CHECKS.map(definition => {
    const counts = { not_tested: 0, ok: 0, notice: 0, error: 0 };
    const notes = [];

    entries.forEach(entry => {
      const item = entry.draft.checks.find(check => check.id === definition.id);
      const status = STATUS_KEYS.includes(item?.status) ? item.status : 'not_tested';
      counts[status] += 1;
      const note = safeString(item?.note);
      if (note) {
        notes.push({
          tester: entry.draft.tester.name || entry.sourceName || 'Unbekannt',
          company: entry.draft.tester.company || '',
          status,
          note,
        });
      }
    });

    return {
      ...clone(definition),
      counts,
      tested: entries.length - counts.not_tested,
      issueCount: counts.notice + counts.error,
      notes,
    };
  });
}

function createRecommendationSummary(entries = []) {
  const result = Object.fromEntries(EXPERT_TEST_RECOMMENDATIONS.map(item => [item.id || 'none', 0]));
  entries.forEach(entry => {
    const key = safeString(entry.draft.overall.recommendation) || 'none';
    result[key] = (result[key] || 0) + 1;
  });
  return result;
}

function deriveDecision(entries, checks, recommendations) {
  if (!entries.length) {
    return {
      status: 'no_data',
      label: 'Noch keine Rückmeldungen',
      recommendation: 'Fachtest-Protokolle als JSON importieren.',
    };
  }

  const manualErrors = checks.reduce((sum, item) => sum + item.counts.error, 0);
  const manualNotTested = checks.reduce((sum, item) => sum + item.counts.not_tested, 0);
  const manualNotices = checks.reduce((sum, item) => sum + item.counts.notice, 0);
  const automatedFailures = entries.filter(entry => entry.automated?.status === 'error').length;

  if (manualErrors > 0 || automatedFailures > 0 || (recommendations.blocked || 0) > 0) {
    return {
      status: 'blocked',
      label: 'Freigabe blockiert',
      recommendation: 'Fehler priorisieren, korrigieren und betroffene Prüfpunkte erneut testen.',
    };
  }

  if ((recommendations.rework || 0) > 0 || manualNotTested > 0) {
    return {
      status: 'rework',
      label: 'Nachbesserung / Nachtest erforderlich',
      recommendation: 'Offene Prüfpunkte und Nachbesserungsempfehlungen vor einer Freigabe abschliessen.',
    };
  }

  if (manualNotices > 0 || (recommendations.release_with_notes || 0) > 0 || (recommendations.none || 0) > 0) {
    return {
      status: 'review',
      label: 'Freigabe mit Hinweisen prüfen',
      recommendation: 'Hinweise dokumentieren, bewerten und danach eine bewusste Freigabeentscheidung treffen.',
    };
  }

  return {
    status: 'ready',
    label: 'Fachliche Freigabe vorbereitet',
    recommendation: 'Alle importierten Rückmeldungen sind vollständig und ohne Fehler/Auffälligkeiten.',
  };
}

export function createFeedbackRound(rawEntries = []) {
  const entries = (Array.isArray(rawEntries) ? rawEntries : [])
    .map((entry, index) => normalizeFeedbackEntry(entry, entry?.sourceName || `Fachtest ${index + 1}`));
  const checks = createCheckSummary(entries);
  const recommendations = createRecommendationSummary(entries);
  const decision = deriveDecision(entries, checks, recommendations);

  const counts = {
    reports: entries.length,
    completeReports: entries.filter(entry => entry.validation.complete).length,
    incompleteReports: entries.filter(entry => !entry.validation.complete).length,
    testers: new Set(entries.map(entry => entry.draft.tester.email || entry.draft.tester.name || entry.id)).size,
    ok: checks.reduce((sum, item) => sum + item.counts.ok, 0),
    notice: checks.reduce((sum, item) => sum + item.counts.notice, 0),
    error: checks.reduce((sum, item) => sum + item.counts.error, 0),
    notTested: checks.reduce((sum, item) => sum + item.counts.not_tested, 0),
  };

  const priorities = checks
    .filter(item => item.issueCount > 0 || item.counts.not_tested > 0)
    .sort((a, b) => (
      (b.counts.error * 100 + b.counts.notice * 10 + b.counts.not_tested)
      - (a.counts.error * 100 + a.counts.notice * 10 + a.counts.not_tested)
    ));

  return {
    schemaVersion: EXPERT_FEEDBACK_ROUND_VERSION,
    generatedAt: new Date().toISOString(),
    status: decision.status,
    label: decision.label,
    recommendation: decision.recommendation,
    entries,
    checks,
    recommendations,
    priorities,
    counts,
  };
}

export function formatFeedbackRound(round = createFeedbackRound()) {
  const lines = [
    'Druckverlust Pro – Auswertung Fachtest-Runde',
    `Stand: ${round.generatedAt}`,
    `Status: ${round.label}`,
    `Empfehlung: ${round.recommendation}`,
    '',
    `Rückmeldungen: ${round.counts.reports}`,
    `Vollständige Protokolle: ${round.counts.completeReports}`,
    `Unvollständige Protokolle: ${round.counts.incompleteReports}`,
    `Tester/innen: ${round.counts.testers}`,
    `OK: ${round.counts.ok} · Auffällig: ${round.counts.notice} · Fehler: ${round.counts.error} · Nicht geprüft: ${round.counts.notTested}`,
    '',
    'Freigabeempfehlungen',
  ];

  EXPERT_TEST_RECOMMENDATIONS.forEach(item => {
    lines.push(`${item.label}: ${round.recommendations[item.id || 'none'] || 0}`);
  });

  lines.push('', 'Prüfpunkt-Auswertung');
  round.checks.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.area} – ${item.title}`);
    lines.push(`   OK ${item.counts.ok} · Auffällig ${item.counts.notice} · Fehler ${item.counts.error} · Nicht geprüft ${item.counts.not_tested}`);
    item.notes.forEach(note => lines.push(`   - ${note.tester}${note.company ? ` (${note.company})` : ''}: [${note.status}] ${note.note}`));
  });

  return lines.join('\n');
}

function csvEscape(value = '') {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function createFeedbackRoundCsv(round = createFeedbackRound()) {
  const rows = [
    ['Status', round.label],
    ['Empfehlung', round.recommendation],
    ['Rückmeldungen', round.counts.reports],
    ['Vollständige Protokolle', round.counts.completeReports],
    ['Unvollständige Protokolle', round.counts.incompleteReports],
    [],
    ['Nr.', 'Bereich', 'Prüfpunkt', 'OK', 'Auffällig', 'Fehler', 'Nicht geprüft', 'Bemerkungen'],
    ...round.checks.map((item, index) => [
      index + 1,
      item.area,
      item.title,
      item.counts.ok,
      item.counts.notice,
      item.counts.error,
      item.counts.not_tested,
      item.notes.map(note => `${note.tester}: ${note.note}`).join(' | '),
    ]),
  ];

  return rows.map(row => row.map(csvEscape).join(';')).join('\n');
}

export function serializeFeedbackRoundEntries(entries = []) {
  return JSON.stringify(entries.map(entry => ({
    kind: 'druckverlust-pro-expert-test',
    schemaVersion: '1.0',
    sourceName: entry.sourceName,
    importedAt: entry.importedAt,
    draft: entry.draft,
    automated: entry.automated,
  })));
}

export function deserializeFeedbackRoundEntries(text = '') {
  try {
    const parsed = JSON.parse(String(text || '[]'));
    return Array.isArray(parsed) ? parsed.map(item => normalizeFeedbackEntry(item, item?.sourceName)) : [];
  } catch {
    return [];
  }
}

export function createFeedbackRoundFilename(extension = 'txt') {
  return `Druckverlust-Pro_Fachtest-Auswertung_${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export function getRecommendationLabel(value = '') {
  return recommendationLabel(value);
}

export default createFeedbackRound;
