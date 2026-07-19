// Druckverlust Pro – Phase 21.11
// Bündelt mehrere Beta-Rückmeldungen zu einer priorisierten, lokal verwaltbaren Fehlerliste.

import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FEEDBACK_SEVERITIES,
  BETA_FEEDBACK_KIND,
  createBetaFeedbackDraft,
  getBetaFeedbackCategoryLabel,
  getBetaFeedbackSeverityLabel,
  getBetaFeedbackSeverityWeight,
  parseBetaFeedbackJson,
  validateBetaFeedbackDraft,
} from './BetaFeedbackReport.js';

export const BETA_FEEDBACK_INBOX_KIND = 'druckverlust-pro-beta-feedback-inbox';
export const BETA_FEEDBACK_INBOX_SCHEMA_VERSION = '1.0';
export const BETA_FEEDBACK_INBOX_STORAGE_KEY = 'druckverlust-pro:beta-feedback-inbox:21.11';

export const BETA_FEEDBACK_TRIAGE_STATUSES = Object.freeze([
  { id: 'new', label: 'Neu', open: true, order: 10 },
  { id: 'confirmed', label: 'Bestätigt', open: true, order: 20 },
  { id: 'in_progress', label: 'In Bearbeitung', open: true, order: 30 },
  { id: 'retest', label: 'Nachtest', open: true, order: 40 },
  { id: 'fixed', label: 'Behoben', open: false, order: 50 },
  { id: 'closed', label: 'Geschlossen', open: false, order: 60 },
  { id: 'duplicate', label: 'Duplikat', open: false, order: 70 },
  { id: 'rejected', label: 'Nicht übernommen', open: false, order: 80 },
]);

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  category: 'all',
  severity: 'all',
  status: 'open',
});

function safeString(value = '') {
  return String(value ?? '').trim();
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function resolveOption(value, options, fallback) {
  const id = safeString(value);
  return options.some(option => option.id === id) ? id : fallback;
}

function normalizeToken(value = '') {
  return safeString(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function createFingerprint(draft = {}) {
  const current = createBetaFeedbackDraft(draft);
  return [
    current.issue.category,
    normalizeToken(current.issue.title),
    normalizeToken(current.issue.actual || current.issue.description).slice(0, 140),
  ].join('|');
}

function getStatusDefinition(id = '') {
  return BETA_FEEDBACK_TRIAGE_STATUSES.find(item => item.id === id)
    || BETA_FEEDBACK_TRIAGE_STATUSES[0];
}

function createTriage(overrides = {}, draft = {}) {
  const severity = resolveOption(
    overrides.priorityOverride,
    BETA_FEEDBACK_SEVERITIES,
    '',
  );

  return {
    status: resolveOption(overrides.status, BETA_FEEDBACK_TRIAGE_STATUSES, 'new'),
    priorityOverride: severity,
    assignee: safeString(overrides.assignee),
    targetVersion: safeString(overrides.targetVersion),
    note: safeString(overrides.note),
    duplicateOf: safeString(overrides.duplicateOf),
    updatedAt: safeString(overrides.updatedAt || draft.updatedAt || new Date().toISOString()),
  };
}

export function createBetaFeedbackInboxItem(input = {}, sourceName = '') {
  const raw = input?.draft || input?.feedback || input;
  const draft = createBetaFeedbackDraft(raw || {});
  const validation = validateBetaFeedbackDraft(draft);
  const triage = createTriage(input?.triage || {}, draft);

  return {
    id: safeString(input?.id || draft.id),
    sourceName: safeString(sourceName || input?.sourceName || input?.filename),
    importedAt: safeString(input?.importedAt || new Date().toISOString()),
    fingerprint: safeString(input?.fingerprint || createFingerprint(draft)),
    draft,
    triage,
    validation: {
      valid: validation.valid,
      complete: validation.complete,
      errors: clone(validation.errors),
      warnings: clone(validation.warnings),
    },
  };
}

export function parseBetaFeedbackInboxJson(text = '', sourceName = '') {
  let parsed;
  try {
    parsed = JSON.parse(String(text || ''));
  } catch (error) {
    throw new Error(`Feedback-JSON konnte nicht gelesen werden: ${error.message}`);
  }

  if (parsed?.kind === BETA_FEEDBACK_INBOX_KIND) {
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    return entries.map(entry => createBetaFeedbackInboxItem(entry, entry?.sourceName || sourceName));
  }

  if (Array.isArray(parsed)) {
    return parsed.map((entry, index) => createBetaFeedbackInboxItem(entry, entry?.sourceName || `${sourceName || 'Import'} ${index + 1}`));
  }

  if (parsed?.kind && parsed.kind !== BETA_FEEDBACK_KIND) {
    throw new Error(`Nicht unterstützter Dateityp: ${parsed.kind}`);
  }

  const draft = parseBetaFeedbackJson(text);
  return [createBetaFeedbackInboxItem({ draft }, sourceName)];
}

function mergeEntries(rawEntries = []) {
  const byId = new Map();

  (Array.isArray(rawEntries) ? rawEntries : []).forEach((entry, index) => {
    const normalized = createBetaFeedbackInboxItem(entry, entry?.sourceName || `Rückmeldung ${index + 1}`);
    const previous = byId.get(normalized.id);

    if (!previous) {
      byId.set(normalized.id, normalized);
      return;
    }

    const previousTime = Date.parse(previous.draft.updatedAt || previous.importedAt || 0) || 0;
    const nextTime = Date.parse(normalized.draft.updatedAt || normalized.importedAt || 0) || 0;
    const latest = nextTime >= previousTime ? normalized : previous;
    const older = latest === normalized ? previous : normalized;

    latest.triage = createTriage({
      ...older.triage,
      ...latest.triage,
      status: latest.triage.status !== 'new' ? latest.triage.status : older.triage.status,
      priorityOverride: latest.triage.priorityOverride || older.triage.priorityOverride,
      assignee: latest.triage.assignee || older.triage.assignee,
      targetVersion: latest.triage.targetVersion || older.triage.targetVersion,
      note: latest.triage.note || older.triage.note,
      duplicateOf: latest.triage.duplicateOf || older.triage.duplicateOf,
    }, latest.draft);

    byId.set(normalized.id, latest);
  });

  return [...byId.values()];
}

function createDuplicateGroups(entries = []) {
  const groups = new Map();
  entries.forEach(entry => {
    if (!entry.fingerprint) return;
    if (!groups.has(entry.fingerprint)) groups.set(entry.fingerprint, []);
    groups.get(entry.fingerprint).push(entry.id);
  });

  return [...groups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([fingerprint, ids]) => ({ fingerprint, ids }));
}

export function getEffectiveSeverity(item = {}) {
  return item?.triage?.priorityOverride || item?.draft?.issue?.severity || 'medium';
}

export function createBetaFeedbackInbox(rawEntries = []) {
  const entries = mergeEntries(rawEntries);
  const duplicateGroups = createDuplicateGroups(entries);
  const duplicateIds = new Set(duplicateGroups.flatMap(group => group.ids));

  entries.forEach(entry => {
    entry.isDuplicateCandidate = duplicateIds.has(entry.id);
  });

  entries.sort((a, b) => {
    const severityDiff = getBetaFeedbackSeverityWeight(getEffectiveSeverity(b))
      - getBetaFeedbackSeverityWeight(getEffectiveSeverity(a));
    if (severityDiff) return severityDiff;

    const statusDiff = getStatusDefinition(a.triage.status).order - getStatusDefinition(b.triage.status).order;
    if (statusDiff) return statusDiff;

    return (Date.parse(b.draft.updatedAt || b.importedAt || 0) || 0)
      - (Date.parse(a.draft.updatedAt || a.importedAt || 0) || 0);
  });

  const statusCounts = Object.fromEntries(BETA_FEEDBACK_TRIAGE_STATUSES.map(item => [item.id, 0]));
  const severityCounts = Object.fromEntries(BETA_FEEDBACK_SEVERITIES.map(item => [item.id, 0]));
  const categoryCounts = Object.fromEntries(BETA_FEEDBACK_CATEGORIES.map(item => [item.id, 0]));

  entries.forEach(entry => {
    statusCounts[entry.triage.status] = (statusCounts[entry.triage.status] || 0) + 1;
    const severity = getEffectiveSeverity(entry);
    severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    const category = entry.draft.issue.category;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const openEntries = entries.filter(entry => getStatusDefinition(entry.triage.status).open);
  const blockerEntries = entries.filter(entry => getEffectiveSeverity(entry) === 'blocker');
  const highEntries = entries.filter(entry => ['blocker', 'high'].includes(getEffectiveSeverity(entry)));
  const invalidEntries = entries.filter(entry => !entry.validation.valid);

  const status = !entries.length
    ? 'empty'
    : blockerEntries.some(entry => getStatusDefinition(entry.triage.status).open)
      ? 'blocked'
      : highEntries.some(entry => getStatusDefinition(entry.triage.status).open)
        ? 'attention'
        : openEntries.length
          ? 'review'
          : 'clear';

  const labels = {
    empty: 'Noch keine Beta-Rückmeldungen',
    blocked: 'Blockierende Rückmeldung offen',
    attention: 'Hohe Priorität offen',
    review: 'Rückmeldungen in Bearbeitung',
    clear: 'Keine offenen Rückmeldungen',
  };

  return {
    kind: BETA_FEEDBACK_INBOX_KIND,
    schemaVersion: BETA_FEEDBACK_INBOX_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    status,
    label: labels[status],
    entries,
    duplicateGroups,
    counts: {
      total: entries.length,
      open: openEntries.length,
      closed: entries.length - openEntries.length,
      blocker: blockerEntries.length,
      high: highEntries.length,
      invalid: invalidEntries.length,
      duplicateCandidates: duplicateIds.size,
    },
    statusCounts,
    severityCounts,
    categoryCounts,
  };
}

export function updateBetaFeedbackInboxItem(entries = [], id = '', patch = {}) {
  return mergeEntries(entries).map(entry => {
    if (entry.id !== id) return entry;
    return createBetaFeedbackInboxItem({
      ...entry,
      triage: {
        ...entry.triage,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }, entry.sourceName);
  });
}

export function removeBetaFeedbackInboxItem(entries = [], id = '') {
  return mergeEntries(entries).filter(entry => entry.id !== id);
}

export function filterBetaFeedbackInbox(inbox = createBetaFeedbackInbox(), filters = {}) {
  const normalized = { ...DEFAULT_FILTERS, ...(filters || {}) };
  const search = normalizeToken(normalized.search);

  return inbox.entries.filter(entry => {
    const status = getStatusDefinition(entry.triage.status);
    if (normalized.status === 'open' && !status.open) return false;
    if (normalized.status === 'closed' && status.open) return false;
    if (!['all', 'open', 'closed'].includes(normalized.status) && entry.triage.status !== normalized.status) return false;
    if (normalized.category !== 'all' && entry.draft.issue.category !== normalized.category) return false;
    if (normalized.severity !== 'all' && getEffectiveSeverity(entry) !== normalized.severity) return false;

    if (search) {
      const haystack = normalizeToken([
        entry.id,
        entry.draft.issue.title,
        entry.draft.issue.description,
        entry.draft.issue.projectContext,
        entry.reporter?.name,
        entry.draft.reporter?.name,
        entry.draft.reporter?.company,
        entry.triage.assignee,
        entry.triage.note,
      ].join(' '));
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function serializeBetaFeedbackInbox(entries = []) {
  const inbox = createBetaFeedbackInbox(entries);
  return JSON.stringify({
    kind: BETA_FEEDBACK_INBOX_KIND,
    schemaVersion: BETA_FEEDBACK_INBOX_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    entries: inbox.entries.map(entry => ({
      id: entry.id,
      sourceName: entry.sourceName,
      importedAt: entry.importedAt,
      fingerprint: entry.fingerprint,
      draft: entry.draft,
      triage: entry.triage,
    })),
  }, null, 2);
}

export function deserializeBetaFeedbackInbox(text = '') {
  if (!safeString(text)) return [];
  try {
    const parsed = JSON.parse(String(text));
    const entries = Array.isArray(parsed) ? parsed : parsed?.entries;
    return Array.isArray(entries) ? mergeEntries(entries) : [];
  } catch {
    return [];
  }
}

export function formatBetaFeedbackInbox(inbox = createBetaFeedbackInbox()) {
  const lines = [
    'Druckverlust Pro – Beta-Feedback-Auswertung',
    `Stand: ${inbox.generatedAt}`,
    `Status: ${inbox.label}`,
    '',
    `Rückmeldungen: ${inbox.counts.total}`,
    `Offen: ${inbox.counts.open}`,
    `Erledigt/geschlossen: ${inbox.counts.closed}`,
    `Blockierend: ${inbox.counts.blocker}`,
    `Hoch oder blockierend: ${inbox.counts.high}`,
    `Duplikat-Kandidaten: ${inbox.counts.duplicateCandidates}`,
    '',
    'Priorisierte Fehlerliste',
  ];

  inbox.entries.forEach((entry, index) => {
    lines.push(
      `${index + 1}. [${getBetaFeedbackSeverityLabel(getEffectiveSeverity(entry))}] ${entry.draft.issue.title || '(ohne Titel)'}`,
      `   Status: ${getStatusDefinition(entry.triage.status).label}`,
      `   Kategorie: ${getBetaFeedbackCategoryLabel(entry.draft.issue.category)}`,
      `   ID: ${entry.id}`,
      `   Verantwortlich: ${entry.triage.assignee || '-'}`,
      `   Zielversion: ${entry.triage.targetVersion || '-'}`,
      `   Kontext: ${entry.draft.issue.projectContext || '-'}`,
      `   Notiz: ${entry.triage.note || '-'}`,
    );
  });

  return lines.join('\n');
}

function csvEscape(value = '') {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function createBetaFeedbackInboxCsv(inbox = createBetaFeedbackInbox()) {
  const rows = [
    ['ID', 'Status', 'Priorität', 'Kategorie', 'Titel', 'Beschreibung', 'Kontext', 'Verantwortlich', 'Zielversion', 'Notiz', 'Quelle', 'App-Version', 'Phase', 'Erstellt', 'Aktualisiert'],
    ...inbox.entries.map(entry => [
      entry.id,
      getStatusDefinition(entry.triage.status).label,
      getBetaFeedbackSeverityLabel(getEffectiveSeverity(entry)),
      getBetaFeedbackCategoryLabel(entry.draft.issue.category),
      entry.draft.issue.title,
      entry.draft.issue.description,
      entry.draft.issue.projectContext,
      entry.triage.assignee,
      entry.triage.targetVersion,
      entry.triage.note,
      entry.sourceName,
      entry.draft.appVersion,
      entry.draft.appRelease,
      entry.draft.createdAt,
      entry.draft.updatedAt,
    ]),
  ];

  return rows.map(row => row.map(csvEscape).join(';')).join('\n');
}

export function createBetaFeedbackIssueText(item = {}) {
  const entry = createBetaFeedbackInboxItem(item);
  const current = entry.draft;
  return [
    `## ${current.issue.title || 'Beta-Rückmeldung'}`,
    '',
    `**Priorität:** ${getBetaFeedbackSeverityLabel(getEffectiveSeverity(entry))}`,
    `**Kategorie:** ${getBetaFeedbackCategoryLabel(current.issue.category)}`,
    `**Meldungs-ID:** ${entry.id}`,
    `**App:** v${current.appVersion} · Phase ${current.appRelease}`,
    '',
    '### Beschreibung',
    current.issue.description || '-',
    '',
    '### Schritte zum Nachstellen',
    current.issue.steps || '-',
    '',
    '### Aktuelles Ergebnis',
    current.issue.actual || '-',
    '',
    '### Erwartetes Ergebnis',
    current.issue.expected || '-',
    '',
    '### Projektkontext',
    current.issue.projectContext || '-',
    '',
    '### Triage',
    `- Status: ${getStatusDefinition(entry.triage.status).label}`,
    `- Verantwortlich: ${entry.triage.assignee || '-'}`,
    `- Zielversion: ${entry.triage.targetVersion || '-'}`,
    `- Interne Notiz: ${entry.triage.note || '-'}`,
  ].join('\n');
}

export function createBetaFeedbackInboxFilename(extension = 'json') {
  return `Druckverlust-Pro_Beta-Feedback-Auswertung_${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export function getBetaFeedbackTriageStatusLabel(id = '') {
  return getStatusDefinition(id).label;
}

export function getBetaFeedbackTriageStatusDefinition(id = '') {
  return clone(getStatusDefinition(id));
}

export function getDefaultBetaFeedbackInboxFilters() {
  return clone(DEFAULT_FILTERS);
}

export default createBetaFeedbackInbox;
