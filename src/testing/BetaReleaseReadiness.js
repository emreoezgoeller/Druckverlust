// Druckverlust Pro – Phase 21.11
// Konsolidiert den öffentlichen Beta-Freigabestand aus Tests, Fachtest-Runde,
// Freigabeentscheidung und einer kurzen Deployment-Checkliste.

import { createFeedbackRound } from './ExpertFeedbackRound.js';
import {
  summarizeReleaseDecision,
  validateReleaseDecisionDraft,
} from './ReleaseDecisionPlan.js';

export const BETA_RELEASE_SCHEMA_VERSION = '1.0';
export const BETA_RELEASE_STORAGE_KEY = 'druckverlust-pro:beta-release:21.10';

export const BETA_AUTOMATED_BASELINE = Object.freeze({
  suites: 11,
  passedSuites: 11,
  documentedChecks: 443,
  passedChecks: 443,
  structureChecks: 87,
  label: 'Automatischer Teststand bestanden',
});

export const BETA_RELEASE_CHECKLIST = Object.freeze([
  { id: 'githubPages', label: 'GitHub-Pages-Version veröffentlicht', required: true },
  { id: 'appStart', label: 'Produktseite und Berechnungstool starten ohne Konsolenfehler', required: true },
  { id: 'demo', label: 'Demo-Projekt und Beispielbericht geprüft', required: true },
  { id: 'projectFile', label: '.dvp speichern und erneut öffnen geprüft', required: true },
  { id: 'pdf', label: 'PDF-Bericht vollständig und mit korrekten Seitenumbrüchen geprüft', required: true },
  { id: 'assets', label: 'Logo und Formteilbilder online vollständig geladen', required: true },
  { id: 'responsive', label: 'Desktop und kleinere Fenster geprüft', required: true },
  { id: 'legal', label: 'Impressum und Datenschutz vor öffentlicher Freigabe geprüft', required: true },
]);

function safeString(value = '') {
  return String(value ?? '').trim();
}

function normalizeDate(value = '') {
  const text = safeString(value);
  if (!text) return '';
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : text.slice(0, 10);
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function normalizeChecklist(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return Object.fromEntries(BETA_RELEASE_CHECKLIST.map(item => [item.id, Boolean(source[item.id])]));
}

export function createBetaReleaseDraft(raw = {}, context = {}) {
  const now = new Date().toISOString();
  const hasReleaseContext = Boolean(context.releaseDecision || raw.releaseDecision);
  const hasFeedbackContext = Boolean(context.feedbackRound || raw.feedbackRound);
  const releaseDecision = context.releaseDecision || raw.releaseDecision || {};
  const feedbackRound = context.feedbackRound || raw.feedbackRound || createFeedbackRound([]);
  const automated = { ...BETA_AUTOMATED_BASELINE, ...(context.automated || raw.automated || {}) };
  const releaseSummary = hasReleaseContext ? summarizeReleaseDecision(releaseDecision) : null;

  return {
    kind: 'druckverlust-pro-beta-release',
    schemaVersion: BETA_RELEASE_SCHEMA_VERSION,
    createdAt: safeString(raw.createdAt) || now,
    updatedAt: now,
    owner: safeString(raw.owner),
    betaDate: normalizeDate(raw.betaDate),
    targetVersion: safeString(raw.targetVersion || context.targetVersion),
    publicUrl: safeString(raw.publicUrl || context.publicUrl),
    releaseNotes: safeString(raw.releaseNotes),
    knownLimitations: safeString(raw.knownLimitations) || [
      'Keine Cloud-Speicherung oder Benutzerkonten.',
      'Projektdateien werden lokal als .dvp gespeichert.',
      'Fachliche Referenztests ersetzen keine externe Normenzertifizierung.',
    ].join('\n'),
    checklist: normalizeChecklist(raw.checklist),
    automated: clone(automated),
    feedbackSnapshot: hasFeedbackContext ? {
      status: safeString(feedbackRound.status),
      label: safeString(feedbackRound.label),
      reports: Number(feedbackRound?.counts?.reports || 0),
      completeReports: Number(feedbackRound?.counts?.completeReports || 0),
      error: Number(feedbackRound?.counts?.error || 0),
      notice: Number(feedbackRound?.counts?.notice || 0),
      notTested: Number(feedbackRound?.counts?.notTested || 0),
    } : {
      status: safeString(raw?.feedbackSnapshot?.status),
      label: safeString(raw?.feedbackSnapshot?.label),
      reports: Number(raw?.feedbackSnapshot?.reports || 0),
      completeReports: Number(raw?.feedbackSnapshot?.completeReports || 0),
      error: Number(raw?.feedbackSnapshot?.error || 0),
      notice: Number(raw?.feedbackSnapshot?.notice || 0),
      notTested: Number(raw?.feedbackSnapshot?.notTested || 0),
    },
    releaseSnapshot: releaseSummary ? {
      status: safeString(releaseSummary.status),
      label: safeString(releaseSummary.label),
      decision: safeString(releaseSummary?.draft?.decision),
      decidedBy: safeString(releaseSummary?.draft?.decidedBy),
      decisionDate: normalizeDate(releaseSummary?.draft?.decisionDate),
      openActions: Number(releaseSummary?.counts?.open || 0) + Number(releaseSummary?.counts?.inProgress || 0),
      criticalOpen: Number(releaseSummary?.counts?.criticalOpen || 0),
      retestOpen: Number(releaseSummary?.counts?.retestOpen || 0),
      retestFailed: Number(releaseSummary?.counts?.retestFailed || 0),
    } : {
      status: safeString(raw?.releaseSnapshot?.status),
      label: safeString(raw?.releaseSnapshot?.label),
      decision: safeString(raw?.releaseSnapshot?.decision),
      decidedBy: safeString(raw?.releaseSnapshot?.decidedBy),
      decisionDate: normalizeDate(raw?.releaseSnapshot?.decisionDate),
      openActions: Number(raw?.releaseSnapshot?.openActions || 0),
      criticalOpen: Number(raw?.releaseSnapshot?.criticalOpen || 0),
      retestOpen: Number(raw?.releaseSnapshot?.retestOpen || 0),
      retestFailed: Number(raw?.releaseSnapshot?.retestFailed || 0),
    },
  };
}

export function summarizeBetaRelease(rawDraft = {}, context = {}) {
  const draft = createBetaReleaseDraft(rawDraft, context);
  const checklistItems = BETA_RELEASE_CHECKLIST.map(item => ({
    ...item,
    checked: Boolean(draft.checklist[item.id]),
  }));
  const checklist = {
    total: checklistItems.length,
    checked: checklistItems.filter(item => item.checked).length,
    required: checklistItems.filter(item => item.required).length,
    requiredChecked: checklistItems.filter(item => item.required && item.checked).length,
    open: checklistItems.filter(item => item.required && !item.checked),
    items: checklistItems,
  };

  const errors = [];
  const warnings = [];
  const automatedPassed = draft.automated.passedSuites === draft.automated.suites
    && draft.automated.passedChecks === draft.automated.documentedChecks;

  if (!automatedPassed) errors.push('Der dokumentierte automatische Teststand ist nicht vollständig bestanden.');
  if (draft.releaseSnapshot.status === 'blocked' || draft.releaseSnapshot.criticalOpen > 0 || draft.releaseSnapshot.retestFailed > 0) {
    errors.push('Die fachliche Freigabe ist blockiert oder enthält kritische offene Punkte.');
  }
  if (!draft.feedbackSnapshot.reports) warnings.push('Noch keine reale Fachtest-Rückmeldung in der Runde vorhanden.');
  if (draft.releaseSnapshot.decision === 'pending' || !draft.releaseSnapshot.decision) warnings.push('Die formelle Freigabeentscheidung ist noch offen.');
  if (draft.releaseSnapshot.openActions > 0) warnings.push(`${draft.releaseSnapshot.openActions} Korrekturmassnahme(n) sind noch offen oder in Bearbeitung.`);
  if (draft.releaseSnapshot.retestOpen > 0) warnings.push(`${draft.releaseSnapshot.retestOpen} Nachtest(s) sind noch offen.`);
  if (checklist.open.length) warnings.push(`${checklist.open.length} Pflichtpunkt(e) der Beta-Checkliste sind noch offen.`);
  if (!draft.owner) warnings.push('Verantwortliche Person für den Beta-Stand fehlt.');
  if (!draft.betaDate) warnings.push('Datum des Beta-Stands fehlt.');
  if (!draft.publicUrl) warnings.push('Öffentliche Testadresse fehlt.');

  let status = 'preparation';
  let label = 'Beta-Vorbereitung läuft';
  let recommendation = 'Offene Checklistenpunkte, Fachtest-Rückmeldungen und Freigabeentscheidung ergänzen.';

  if (errors.length) {
    status = 'blocked';
    label = 'Beta-Freigabe blockiert';
    recommendation = 'Blockierende fachliche oder automatische Prüfpunkte zuerst beheben.';
  } else {
    const checklistComplete = checklist.requiredChecked === checklist.required;
    const metadataComplete = Boolean(draft.owner && draft.betaDate && draft.publicUrl);
    const hasFeedback = draft.feedbackSnapshot.reports > 0;
    const released = draft.releaseSnapshot.status === 'released';
    const releasedWithConditions = draft.releaseSnapshot.status === 'released_with_conditions';

    if (checklistComplete && metadataComplete && hasFeedback && released) {
      status = 'ready';
      label = 'Öffentliche Beta vorbereitet';
      recommendation = 'Beta-Protokoll archivieren, Version veröffentlichen und Rückmeldungen weiter sammeln.';
    } else if (checklistComplete && metadataComplete && hasFeedback && releasedWithConditions) {
      status = 'ready_with_conditions';
      label = 'Beta mit Auflagen vorbereitet';
      recommendation = 'Beta kann mit dokumentierten Auflagen starten; offene Massnahmen verbindlich nachführen.';
    }
  }

  return {
    draft,
    checklist,
    status,
    label,
    recommendation,
    errors,
    warnings,
    complete: !errors.length && !warnings.length,
  };
}

export function formatBetaRelease(rawDraft = {}, context = {}) {
  const result = summarizeBetaRelease(rawDraft, context);
  const { draft, checklist } = result;
  const lines = [
    'Druckverlust Pro – Beta-Freigabestand',
    `Stand: ${draft.updatedAt}`,
    `Zielversion: ${draft.targetVersion || '-'}`,
    `Verantwortlich: ${draft.owner || '-'}`,
    `Beta-Datum: ${draft.betaDate || '-'}`,
    `Öffentliche Adresse: ${draft.publicUrl || '-'}`,
    `Status: ${result.label}`,
    `Empfehlung: ${result.recommendation}`,
    '',
    'Automatischer Teststand',
    `Prüfserien: ${draft.automated.passedSuites}/${draft.automated.suites}`,
    `Dokumentierte Einzelprüfungen: ${draft.automated.passedChecks}/${draft.automated.documentedChecks}`,
    `Zusätzliche Strukturprüfungen: ${draft.automated.structureChecks}`,
    '',
    'Fachtest / Freigabe',
    `Rückmeldungen: ${draft.feedbackSnapshot.reports}`,
    `Fachtest-Status: ${draft.feedbackSnapshot.label || draft.feedbackSnapshot.status || '-'}`,
    `Freigabe: ${draft.releaseSnapshot.label || draft.releaseSnapshot.status || '-'}`,
    `Offene Massnahmen: ${draft.releaseSnapshot.openActions}`,
    `Offene Nachtests: ${draft.releaseSnapshot.retestOpen}`,
    '',
    `Beta-Checkliste: ${checklist.checked}/${checklist.total}`,
    ...checklist.items.map(item => `${item.checked ? '✓' : '○'} ${item.label}`),
  ];

  if (draft.releaseNotes) lines.push('', 'Freigabe-/Beta-Hinweis', draft.releaseNotes);
  if (draft.knownLimitations) lines.push('', 'Bekannte Grenzen', draft.knownLimitations);
  if (result.errors.length) lines.push('', 'Blockierende Punkte', ...result.errors.map(item => `- ${item}`));
  if (result.warnings.length) lines.push('', 'Offene Hinweise', ...result.warnings.map(item => `- ${item}`));

  return lines.join('\n');
}

function csvEscape(value = '') {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function createBetaReleaseCsv(rawDraft = {}, context = {}) {
  const result = summarizeBetaRelease(rawDraft, context);
  const rows = [
    ['Status', result.label],
    ['Zielversion', result.draft.targetVersion],
    ['Verantwortlich', result.draft.owner],
    ['Beta-Datum', result.draft.betaDate],
    ['Öffentliche Adresse', result.draft.publicUrl],
    ['Prüfserien', `${result.draft.automated.passedSuites}/${result.draft.automated.suites}`],
    ['Einzelprüfungen', `${result.draft.automated.passedChecks}/${result.draft.automated.documentedChecks}`],
    ['Fachtest-Rückmeldungen', result.draft.feedbackSnapshot.reports],
    ['Freigabestatus', result.draft.releaseSnapshot.label],
    [],
    ['Pflichtpunkt', 'Status'],
    ...result.checklist.items.map(item => [item.label, item.checked ? 'OK' : 'Offen']),
  ];
  return rows.map(row => row.map(csvEscape).join(';')).join('\n');
}

export function serializeBetaRelease(rawDraft = {}, context = {}) {
  return JSON.stringify(summarizeBetaRelease(rawDraft, context).draft, null, 2);
}

export function deserializeBetaRelease(text = '', context = {}) {
  try {
    const parsed = JSON.parse(String(text || '{}'));
    if (safeString(parsed?.kind) !== 'druckverlust-pro-beta-release') return null;
    return createBetaReleaseDraft(parsed, context);
  } catch {
    return null;
  }
}

export function createBetaReleaseFilename(extension = 'txt') {
  return `Druckverlust-Pro_Beta-Freigabestand_${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export default createBetaReleaseDraft;
