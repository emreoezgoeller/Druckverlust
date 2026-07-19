// Druckverlust Pro – Phase 21.10
// DOM-unabhängiges Datenmodell für einzelne Beta-Rückmeldungen und Fehlerberichte.

import { APP_RELEASE, APP_VERSION } from '../core/appVersion.js';

export const BETA_FEEDBACK_KIND = 'druckverlust-pro-beta-feedback';
export const BETA_FEEDBACK_SCHEMA_VERSION = '1.0';
export const BETA_FEEDBACK_STORAGE_KEY = 'druckverlust-pro:beta-feedback:21.10';

export const BETA_FEEDBACK_CATEGORIES = Object.freeze([
  { id: 'calculation', label: 'Berechnung / Ergebnis' },
  { id: 'formpart', label: 'Formteil / Grössenübernahme' },
  { id: 'report', label: 'Bericht / PDF' },
  { id: 'project-file', label: 'Speichern / Öffnen (.dvp)' },
  { id: 'usability', label: 'Bedienung / Oberfläche' },
  { id: 'performance', label: 'Geschwindigkeit / Stabilität' },
  { id: 'idea', label: 'Funktionswunsch' },
  { id: 'other', label: 'Sonstiges' },
]);

export const BETA_FEEDBACK_SEVERITIES = Object.freeze([
  { id: 'suggestion', label: 'Vorschlag', weight: 1 },
  { id: 'low', label: 'Niedrig', weight: 2 },
  { id: 'medium', label: 'Mittel', weight: 3 },
  { id: 'high', label: 'Hoch', weight: 4 },
  { id: 'blocker', label: 'Blockierend', weight: 5 },
]);

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

function createEnvironmentSnapshot(environment = {}) {
  const navigatorRef = typeof navigator !== 'undefined' ? navigator : null;
  const screenRef = typeof screen !== 'undefined' ? screen : null;

  return {
    browser: safeString(environment.browser || navigatorRef?.userAgent || ''),
    platform: safeString(environment.platform || navigatorRef?.platform || ''),
    viewport: safeString(environment.viewport || (
      typeof window !== 'undefined'
        ? `${window.innerWidth || 0} × ${window.innerHeight || 0}px`
        : ''
    )),
    screen: safeString(environment.screen || (
      screenRef ? `${screenRef.width || 0} × ${screenRef.height || 0}px` : ''
    )),
    url: safeString(environment.url || (typeof window !== 'undefined' ? window.location.href : '')),
  };
}

function createId(overrides = {}) {
  const supplied = safeString(overrides.id);
  if (supplied) return supplied;
  const datePart = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `beta-${datePart}-${randomPart}`;
}

export function createBetaFeedbackDraft(overrides = {}) {
  const now = new Date().toISOString();

  return {
    kind: BETA_FEEDBACK_KIND,
    schemaVersion: BETA_FEEDBACK_SCHEMA_VERSION,
    id: createId(overrides),
    appRelease: safeString(overrides.appRelease || APP_RELEASE),
    appVersion: safeString(overrides.appVersion || APP_VERSION),
    createdAt: safeString(overrides.createdAt || now),
    updatedAt: safeString(overrides.updatedAt || now),
    reporter: {
      name: safeString(overrides.reporter?.name),
      company: safeString(overrides.reporter?.company),
      role: safeString(overrides.reporter?.role),
      email: safeString(overrides.reporter?.email),
    },
    issue: {
      category: resolveOption(overrides.issue?.category, BETA_FEEDBACK_CATEGORIES, 'calculation'),
      severity: resolveOption(overrides.issue?.severity, BETA_FEEDBACK_SEVERITIES, 'medium'),
      title: safeString(overrides.issue?.title),
      description: safeString(overrides.issue?.description),
      steps: safeString(overrides.issue?.steps),
      actual: safeString(overrides.issue?.actual),
      expected: safeString(overrides.issue?.expected),
      projectContext: safeString(overrides.issue?.projectContext),
    },
    environment: createEnvironmentSnapshot(overrides.environment),
    consent: {
      includeTechnicalData: overrides.consent?.includeTechnicalData !== false,
    },
  };
}

export function getBetaFeedbackCategoryLabel(id = '') {
  return BETA_FEEDBACK_CATEGORIES.find(item => item.id === id)?.label || 'Sonstiges';
}

export function getBetaFeedbackSeverityLabel(id = '') {
  return BETA_FEEDBACK_SEVERITIES.find(item => item.id === id)?.label || 'Mittel';
}

export function getBetaFeedbackSeverityWeight(id = '') {
  return BETA_FEEDBACK_SEVERITIES.find(item => item.id === id)?.weight || 3;
}

export function validateBetaFeedbackDraft(draft = {}) {
  const current = createBetaFeedbackDraft(draft);
  const errors = [];
  const warnings = [];

  if (!current.issue.title) errors.push('Kurztitel der Rückmeldung fehlt.');
  if (!current.issue.description) errors.push('Beschreibung der Rückmeldung fehlt.');
  if (!current.issue.steps) warnings.push('Schritte zum Nachstellen fehlen.');
  if (!current.issue.actual) warnings.push('Aktuelles Verhalten / Ergebnis fehlt.');
  if (!current.issue.expected) warnings.push('Erwartetes Verhalten / Ergebnis fehlt.');
  if (!current.reporter.name) warnings.push('Name der meldenden Person fehlt.');
  if (current.issue.severity === 'blocker' && !current.issue.steps) {
    errors.push('Bei einer blockierenden Meldung müssen Schritte zum Nachstellen angegeben werden.');
  }

  return {
    valid: errors.length === 0,
    complete: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    draft: current,
  };
}

export function summarizeBetaFeedback(draft = {}) {
  const validation = validateBetaFeedbackDraft(draft);
  const current = validation.draft;
  const severityWeight = getBetaFeedbackSeverityWeight(current.issue.severity);

  return {
    status: validation.valid ? (validation.complete ? 'complete' : 'review') : 'error',
    label: validation.valid
      ? (validation.complete ? 'Rückmeldung vollständig' : 'Rückmeldung mit Hinweisen')
      : 'Rückmeldung unvollständig',
    severityWeight,
    categoryLabel: getBetaFeedbackCategoryLabel(current.issue.category),
    severityLabel: getBetaFeedbackSeverityLabel(current.issue.severity),
    validation,
    draft: current,
  };
}

export function formatBetaFeedback(draft = {}) {
  const result = summarizeBetaFeedback(draft);
  const current = result.draft;
  const lines = [
    'Druckverlust Pro – Beta-Rückmeldung',
    `Meldungs-ID: ${current.id}`,
    `App: v${current.appVersion} · Phase ${current.appRelease}`,
    `Stand: ${current.updatedAt}`,
    `Status: ${result.label}`,
    '',
    `Kategorie: ${result.categoryLabel}`,
    `Priorität: ${result.severityLabel}`,
    `Titel: ${current.issue.title || '-'}`,
    '',
    'Beschreibung',
    current.issue.description || '-',
    '',
    'Schritte zum Nachstellen',
    current.issue.steps || '-',
    '',
    'Aktuelles Verhalten / Ergebnis',
    current.issue.actual || '-',
    '',
    'Erwartetes Verhalten / Ergebnis',
    current.issue.expected || '-',
    '',
    'Projektkontext',
    current.issue.projectContext || '-',
    '',
    'Meldende Person',
    `Name: ${current.reporter.name || '-'}`,
    `Firma: ${current.reporter.company || '-'}`,
    `Funktion: ${current.reporter.role || '-'}`,
    `E-Mail: ${current.reporter.email || '-'}`,
  ];

  if (current.consent.includeTechnicalData) {
    lines.push(
      '',
      'Technische Umgebung',
      `Browser: ${current.environment.browser || '-'}`,
      `Plattform: ${current.environment.platform || '-'}`,
      `Fenster: ${current.environment.viewport || '-'}`,
      `Bildschirm: ${current.environment.screen || '-'}`,
      `Adresse: ${current.environment.url || '-'}`,
    );
  }

  if (result.validation.errors.length || result.validation.warnings.length) {
    lines.push('', 'Prüfhinweise');
    result.validation.errors.forEach(item => lines.push(`FEHLER: ${item}`));
    result.validation.warnings.forEach(item => lines.push(`HINWEIS: ${item}`));
  }

  lines.push('', 'Datenschutz-Hinweis: Diese Datei wurde lokal erstellt und nicht automatisch versendet.');
  return lines.join('\n');
}

function csvEscape(value = '') {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function createBetaFeedbackCsv(draft = {}) {
  const result = summarizeBetaFeedback(draft);
  const current = result.draft;
  const rows = [
    ['Meldungs-ID', current.id],
    ['App-Version', current.appVersion],
    ['Phase', current.appRelease],
    ['Kategorie', result.categoryLabel],
    ['Priorität', result.severityLabel],
    ['Titel', current.issue.title],
    ['Beschreibung', current.issue.description],
    ['Schritte zum Nachstellen', current.issue.steps],
    ['Aktuelles Verhalten', current.issue.actual],
    ['Erwartetes Verhalten', current.issue.expected],
    ['Projektkontext', current.issue.projectContext],
    ['Name', current.reporter.name],
    ['Firma', current.reporter.company],
    ['Funktion', current.reporter.role],
    ['E-Mail', current.reporter.email],
    ['Browser', current.consent.includeTechnicalData ? current.environment.browser : 'nicht exportiert'],
    ['Plattform', current.consent.includeTechnicalData ? current.environment.platform : 'nicht exportiert'],
    ['Adresse', current.consent.includeTechnicalData ? current.environment.url : 'nicht exportiert'],
  ];
  return rows.map(row => row.map(csvEscape).join(';')).join('\n');
}

export function createBetaFeedbackJson(draft = {}) {
  const current = createBetaFeedbackDraft(draft);
  const exportDraft = clone(current);

  if (!exportDraft.consent.includeTechnicalData) {
    exportDraft.environment = {
      browser: '', platform: '', viewport: '', screen: '', url: '',
    };
  }

  return JSON.stringify({
    kind: BETA_FEEDBACK_KIND,
    schemaVersion: BETA_FEEDBACK_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    draft: exportDraft,
  }, null, 2);
}

export function parseBetaFeedbackJson(text = '') {
  let parsed;
  try {
    parsed = JSON.parse(String(text || ''));
  } catch (error) {
    throw new Error(`Beta-Feedback-JSON konnte nicht gelesen werden: ${error.message}`);
  }

  if (parsed?.kind && parsed.kind !== BETA_FEEDBACK_KIND) {
    throw new Error(`Nicht unterstützter Dateityp: ${parsed.kind}`);
  }

  return createBetaFeedbackDraft(parsed?.draft || parsed || {});
}

export function createBetaFeedbackFilename(draft = {}, extension = 'txt') {
  const current = createBetaFeedbackDraft(draft);
  const title = (current.issue.title || 'Beta-Feedback')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'Beta-Feedback';
  const date = (current.updatedAt || current.createdAt || new Date().toISOString()).slice(0, 10);
  return `Druckverlust-Pro_${current.appRelease}_${title}_${date}.${extension}`;
}

export default createBetaFeedbackDraft;
