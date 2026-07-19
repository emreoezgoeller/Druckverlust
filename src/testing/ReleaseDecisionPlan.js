// Druckverlust Pro – Phase 21.08
// Dokumentiert die fachliche Freigabeentscheidung und erzeugt einen gezielten Korrektur-/Nachtestplan.

import { createFeedbackRound } from './ExpertFeedbackRound.js';

export const RELEASE_DECISION_SCHEMA_VERSION = '1.0';
export const RELEASE_DECISION_STORAGE_KEY = 'druckverlust-pro:release-decision:21.08';

export const RELEASE_DECISION_OPTIONS = Object.freeze([
  { id: 'pending', label: 'Entscheidung offen' },
  { id: 'approved', label: 'Fachlich freigegeben' },
  { id: 'approved_with_conditions', label: 'Freigegeben mit Auflagen' },
  { id: 'blocked', label: 'Freigabe blockiert' },
]);

export const RELEASE_ACTION_STATUS_OPTIONS = Object.freeze([
  { id: 'open', label: 'Offen' },
  { id: 'in_progress', label: 'In Bearbeitung' },
  { id: 'done', label: 'Erledigt' },
  { id: 'deferred', label: 'Zurückgestellt' },
]);

export const RELEASE_RETEST_STATUS_OPTIONS = Object.freeze([
  { id: 'pending', label: 'Nachtest offen' },
  { id: 'passed', label: 'Nachtest bestanden' },
  { id: 'failed', label: 'Nachtest fehlgeschlagen' },
  { id: 'waived', label: 'Nachtest nicht erforderlich' },
]);

function safeString(value = '') {
  return String(value ?? '').trim();
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function normalizeDate(value = '') {
  const text = safeString(value);
  if (!text) return '';
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : text.slice(0, 10);
}

function deriveSeverity(item = {}) {
  if (Number(item?.counts?.error || 0) > 0) return 'critical';
  if (Number(item?.counts?.notice || 0) > 0) return 'high';
  if (Number(item?.counts?.not_tested || 0) > 0) return 'medium';
  return 'low';
}

function severityLabel(value = '') {
  return ({ critical: 'Kritisch', high: 'Hoch', medium: 'Mittel', low: 'Niedrig' })[value] || 'Niedrig';
}

function suggestedDecision(round = createFeedbackRound()) {
  if (round.status === 'ready') return 'approved';
  if (round.status === 'review') return 'approved_with_conditions';
  if (round.status === 'blocked') return 'blocked';
  return 'pending';
}

function createActionFromPriority(item = {}, existing = {}) {
  const severity = deriveSeverity(item);
  const id = safeString(item.id) || `action-${safeString(item.area)}-${safeString(item.title)}`
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return {
    id,
    checkId: safeString(item.id),
    area: safeString(item.area) || 'Allgemein',
    title: safeString(item.title) || 'Offener Prüfpunkt',
    severity,
    severityLabel: severityLabel(severity),
    counts: {
      ok: Number(item?.counts?.ok || 0),
      notice: Number(item?.counts?.notice || 0),
      error: Number(item?.counts?.error || 0),
      notTested: Number(item?.counts?.not_tested || 0),
    },
    sourceNotes: Array.isArray(item.notes) ? clone(item.notes) : [],
    status: RELEASE_ACTION_STATUS_OPTIONS.some(option => option.id === existing.status) ? existing.status : 'open',
    owner: safeString(existing.owner),
    dueDate: normalizeDate(existing.dueDate),
    correction: safeString(existing.correction),
    retestStatus: RELEASE_RETEST_STATUS_OPTIONS.some(option => option.id === existing.retestStatus)
      ? existing.retestStatus
      : 'pending',
    retestNote: safeString(existing.retestNote),
  };
}

export function createReleaseDecisionDraft(rawRound = null, existingDraft = {}, targetVersion = '') {
  const round = (rawRound?.checks || rawRound?.priorities || rawRound?.counts)
    ? rawRound
    : createFeedbackRound(rawRound || []);
  const existingActions = new Map((Array.isArray(existingDraft?.actions) ? existingDraft.actions : [])
    .map(action => [safeString(action.checkId || action.id), action]));

  const actions = (round.priorities || []).map(item => createActionFromPriority(
    item,
    existingActions.get(safeString(item.id)) || {},
  ));

  return {
    kind: 'druckverlust-pro-release-decision',
    schemaVersion: RELEASE_DECISION_SCHEMA_VERSION,
    createdAt: safeString(existingDraft?.createdAt) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    roundSnapshot: {
      generatedAt: safeString(round.generatedAt),
      status: safeString(round.status),
      label: safeString(round.label),
      recommendation: safeString(round.recommendation),
      counts: clone(round.counts || {}),
      reports: Number(round?.counts?.reports || 0),
    },
    suggestedDecision: suggestedDecision(round),
    decision: RELEASE_DECISION_OPTIONS.some(option => option.id === existingDraft?.decision)
      ? existingDraft.decision
      : 'pending',
    decidedBy: safeString(existingDraft?.decidedBy),
    decisionDate: normalizeDate(existingDraft?.decisionDate),
    targetVersion: safeString(existingDraft?.targetVersion || targetVersion),
    releaseNote: safeString(existingDraft?.releaseNote),
    actions,
  };
}

export function summarizeReleaseDecision(rawDraft = {}) {
  const draft = createReleaseDecisionDraft({
    generatedAt: rawDraft?.roundSnapshot?.generatedAt,
    status: rawDraft?.roundSnapshot?.status || 'no_data',
    label: rawDraft?.roundSnapshot?.label || '',
    recommendation: rawDraft?.roundSnapshot?.recommendation || '',
    counts: rawDraft?.roundSnapshot?.counts || {},
    priorities: (rawDraft?.actions || []).map(action => ({
      id: action.checkId || action.id,
      area: action.area,
      title: action.title,
      counts: {
        ok: action?.counts?.ok || 0,
        notice: action?.counts?.notice || 0,
        error: action?.counts?.error || 0,
        not_tested: action?.counts?.notTested || 0,
      },
      notes: action.sourceNotes || [],
    })),
  }, rawDraft, rawDraft?.targetVersion || '');

  const counts = {
    total: draft.actions.length,
    open: draft.actions.filter(item => item.status === 'open').length,
    inProgress: draft.actions.filter(item => item.status === 'in_progress').length,
    done: draft.actions.filter(item => item.status === 'done').length,
    deferred: draft.actions.filter(item => item.status === 'deferred').length,
    criticalOpen: draft.actions.filter(item => item.severity === 'critical' && !['done', 'deferred'].includes(item.status)).length,
    highOpen: draft.actions.filter(item => item.severity === 'high' && !['done', 'deferred'].includes(item.status)).length,
    retestOpen: draft.actions.filter(item => !['passed', 'waived'].includes(item.retestStatus)).length,
    retestFailed: draft.actions.filter(item => item.retestStatus === 'failed').length,
  };

  let status = 'draft';
  let label = 'Entscheidung dokumentieren';
  let recommendation = 'Freigabeentscheidung, Verantwortliche und offene Massnahmen ergänzen.';

  if (draft.decision === 'blocked' || counts.criticalOpen > 0 || counts.retestFailed > 0) {
    status = 'blocked';
    label = 'Freigabe blockiert';
    recommendation = 'Kritische Punkte korrigieren und den Nachtest erfolgreich abschliessen.';
  } else if (draft.decision === 'approved' && counts.open === 0 && counts.inProgress === 0 && counts.retestOpen === 0) {
    status = 'released';
    label = 'Fachlich freigegeben';
    recommendation = 'Freigabeprotokoll archivieren und die freigegebene Version kennzeichnen.';
  } else if (draft.decision === 'approved_with_conditions' && counts.criticalOpen === 0 && counts.retestFailed === 0) {
    status = 'released_with_conditions';
    label = 'Freigegeben mit Auflagen';
    recommendation = 'Auflagen, Termine und Nachweise verbindlich nachführen.';
  } else if (draft.decision !== 'pending' || counts.total > 0) {
    status = 'action_required';
    label = 'Korrektur-/Nachtestplan offen';
    recommendation = 'Offene Massnahmen abschliessen und danach die Freigabeentscheidung aktualisieren.';
  }

  return { draft, counts, status, label, recommendation };
}

export function validateReleaseDecisionDraft(rawDraft = {}) {
  const summary = summarizeReleaseDecision(rawDraft);
  const { draft, counts } = summary;
  const errors = [];
  const warnings = [];

  if (!Number(draft?.roundSnapshot?.reports || 0)) errors.push('Keine Fachtest-Rückmeldungen in der Entscheidung dokumentiert.');
  if (draft.decision === 'pending') warnings.push('Die formelle Freigabeentscheidung ist noch offen.');
  if (draft.decision !== 'pending' && !draft.decidedBy) errors.push('Die freigebende Person fehlt.');
  if (draft.decision !== 'pending' && !draft.decisionDate) errors.push('Das Freigabedatum fehlt.');
  if (counts.criticalOpen > 0) errors.push(`${counts.criticalOpen} kritische Massnahme(n) sind noch offen.`);
  if (counts.retestFailed > 0) errors.push(`${counts.retestFailed} Nachtest(s) sind fehlgeschlagen.`);
  if (counts.open + counts.inProgress > 0) warnings.push(`${counts.open + counts.inProgress} Massnahme(n) sind noch offen oder in Bearbeitung.`);
  if (counts.retestOpen > 0) warnings.push(`${counts.retestOpen} Nachtest(s) sind noch nicht abgeschlossen.`);

  return {
    valid: errors.length === 0,
    complete: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    summary,
  };
}

export function formatReleaseDecision(rawDraft = {}) {
  const validation = validateReleaseDecisionDraft(rawDraft);
  const { draft, counts, label, recommendation } = validation.summary;
  const decisionLabel = RELEASE_DECISION_OPTIONS.find(item => item.id === draft.decision)?.label || draft.decision;

  const lines = [
    'Druckverlust Pro – Fachliche Freigabeentscheidung',
    `Stand: ${draft.updatedAt}`,
    `Fachtest-Runde: ${draft.roundSnapshot.label || '-'}`,
    `Rückmeldungen: ${draft.roundSnapshot.reports || 0}`,
    `Entscheidung: ${decisionLabel}`,
    `Freigegeben durch: ${draft.decidedBy || '-'}`,
    `Datum: ${draft.decisionDate || '-'}`,
    `Zielversion: ${draft.targetVersion || '-'}`,
    `Status: ${label}`,
    `Empfehlung: ${recommendation}`,
    '',
    `Massnahmen: ${counts.total} · offen ${counts.open} · in Bearbeitung ${counts.inProgress} · erledigt ${counts.done} · zurückgestellt ${counts.deferred}`,
    `Nachtests offen: ${counts.retestOpen} · fehlgeschlagen: ${counts.retestFailed}`,
  ];

  if (draft.releaseNote) lines.push('', 'Freigabevermerk', draft.releaseNote);

  lines.push('', 'Korrektur- und Nachtestplan');
  if (!draft.actions.length) lines.push('Keine offenen Massnahmen aus der Fachtest-Runde.');
  draft.actions.forEach((item, index) => {
    lines.push(`${index + 1}. [${item.severityLabel}] ${item.area} – ${item.title}`);
    lines.push(`   Status: ${RELEASE_ACTION_STATUS_OPTIONS.find(option => option.id === item.status)?.label || item.status}`);
    lines.push(`   Verantwortlich: ${item.owner || '-'} · Termin: ${item.dueDate || '-'}`);
    lines.push(`   Korrektur: ${item.correction || '-'}`);
    lines.push(`   Nachtest: ${RELEASE_RETEST_STATUS_OPTIONS.find(option => option.id === item.retestStatus)?.label || item.retestStatus}${item.retestNote ? ` · ${item.retestNote}` : ''}`);
  });

  if (validation.errors.length) lines.push('', 'Blockierende Punkte', ...validation.errors.map(item => `- ${item}`));
  if (validation.warnings.length) lines.push('', 'Hinweise', ...validation.warnings.map(item => `- ${item}`));

  return lines.join('\n');
}

function csvEscape(value = '') {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function createReleaseDecisionCsv(rawDraft = {}) {
  const validation = validateReleaseDecisionDraft(rawDraft);
  const { draft } = validation.summary;
  const rows = [
    ['Entscheidung', RELEASE_DECISION_OPTIONS.find(item => item.id === draft.decision)?.label || draft.decision],
    ['Freigegeben durch', draft.decidedBy],
    ['Freigabedatum', draft.decisionDate],
    ['Zielversion', draft.targetVersion],
    ['Fachtest-Rückmeldungen', draft.roundSnapshot.reports || 0],
    [],
    ['Nr.', 'Priorität', 'Bereich', 'Prüfpunkt', 'Status', 'Verantwortlich', 'Termin', 'Korrektur', 'Nachtest', 'Nachtest-Bemerkung'],
    ...draft.actions.map((item, index) => [
      index + 1,
      item.severityLabel,
      item.area,
      item.title,
      RELEASE_ACTION_STATUS_OPTIONS.find(option => option.id === item.status)?.label || item.status,
      item.owner,
      item.dueDate,
      item.correction,
      RELEASE_RETEST_STATUS_OPTIONS.find(option => option.id === item.retestStatus)?.label || item.retestStatus,
      item.retestNote,
    ]),
  ];
  return rows.map(row => row.map(csvEscape).join(';')).join('\n');
}

export function serializeReleaseDecision(rawDraft = {}) {
  const draft = summarizeReleaseDecision(rawDraft).draft;
  return JSON.stringify(draft, null, 2);
}

export function deserializeReleaseDecision(text = '') {
  try {
    const parsed = JSON.parse(String(text || '{}'));
    if (safeString(parsed?.kind) !== 'druckverlust-pro-release-decision') return null;
    return createReleaseDecisionDraft({
      generatedAt: parsed?.roundSnapshot?.generatedAt,
      status: parsed?.roundSnapshot?.status,
      label: parsed?.roundSnapshot?.label,
      recommendation: parsed?.roundSnapshot?.recommendation,
      counts: parsed?.roundSnapshot?.counts,
      priorities: (parsed?.actions || []).map(action => ({
        id: action.checkId || action.id,
        area: action.area,
        title: action.title,
        counts: {
          ok: action?.counts?.ok || 0,
          notice: action?.counts?.notice || 0,
          error: action?.counts?.error || 0,
          not_tested: action?.counts?.notTested || 0,
        },
        notes: action.sourceNotes || [],
      })),
    }, parsed, parsed?.targetVersion || '');
  } catch {
    return null;
  }
}

export function createReleaseDecisionFilename(extension = 'txt') {
  return `Druckverlust-Pro_Freigabeentscheidung_${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export default createReleaseDecisionDraft;
