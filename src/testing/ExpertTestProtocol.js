// Druckverlust Pro – strukturiertes Fachtester-Protokoll Phase 21.05
// DOM-unabhängiges Datenmodell für öffentliche Testläufe und Rückmeldungen.

import { APP_RELEASE, APP_VERSION } from '../core/appVersion.js';

export const EXPERT_TEST_PROTOCOL_VERSION = '1.0';
export const EXPERT_TEST_STORAGE_KEY = 'druckverlust-pro:expert-test:21.05';

export const EXPERT_TEST_STATUS_OPTIONS = Object.freeze([
  { id: 'not_tested', label: 'Nicht geprüft' },
  { id: 'ok', label: 'OK' },
  { id: 'notice', label: 'Auffällig' },
  { id: 'error', label: 'Fehler' },
]);

export const EXPERT_TEST_RECOMMENDATIONS = Object.freeze([
  { id: '', label: 'Noch keine Empfehlung' },
  { id: 'release', label: 'Für öffentliche Testversion geeignet' },
  { id: 'release_with_notes', label: 'Geeignet mit Hinweisen' },
  { id: 'rework', label: 'Nachbesserung erforderlich' },
  { id: 'blocked', label: 'Nicht freigeben' },
]);

export const EXPERT_TEST_CHECKS = Object.freeze([
  {
    id: 'project-start',
    area: 'Projekt',
    title: 'Projekt neu anlegen und Stammdaten erfassen',
    instruction: 'Neues Projekt öffnen und Projektnummer, Projektname, BKP-Nummer sowie Anlage erfassen.',
    expected: 'Eingaben werden übernommen, bleiben sichtbar und erscheinen im Bericht.',
  },
  {
    id: 'rectangular-section',
    area: 'Teilstrecken',
    title: 'Rechteckkanal erfassen',
    instruction: 'Eine Kanal-Teilstrecke mit Luftmenge, Länge, Breite und Höhe erfassen.',
    expected: 'Geschwindigkeit, dynamischer Druck und Reibungsverlust werden automatisch berechnet.',
  },
  {
    id: 'round-section',
    area: 'Teilstrecken',
    title: 'Rundrohr erfassen',
    instruction: 'Eine Rohr-Teilstrecke mit Luftmenge, Länge und Durchmesser erfassen.',
    expected: 'Die Rohrgeometrie wird erkannt und die Ergebnisse werden plausibel aktualisiert.',
  },
  {
    id: 'formpart-selection',
    area: 'Formteile',
    title: 'Formteil auswählen und zuordnen',
    instruction: 'Bogen, Übergang oder Abzweig aus der Bibliothek hinzufügen und einer Teilstrecke zuordnen.',
    expected: 'Bild, Eingabefelder, Grössenübernahme und Druckverlust werden korrekt angezeigt.',
  },
  {
    id: 'formpart-sync',
    area: 'Formteile',
    title: 'Automatische Grössen- und Anschlussübernahme',
    instruction: 'Teilstreckengrösse ändern und danach die Formteilwerte kontrollieren.',
    expected: 'Automatische Werte werden synchronisiert; bewusst manuelle Werte bleiben geschützt.',
  },
  {
    id: 'special-component',
    area: 'Sonderbauteile',
    title: 'Sonderbauteil mit fixem Druckverlust erfassen',
    instruction: 'Zum Beispiel Filter, Schalldämpfer oder Volumenstromregler mit Pa-Wert hinzufügen.',
    expected: 'Der fixe Verlust wird im Teil- und Gesamtdruckverlust berücksichtigt.',
  },
  {
    id: 'project-roundtrip',
    area: 'Projektdatei',
    title: '.dvp speichern und wieder öffnen',
    instruction: 'Projekt speichern, Seite beziehungsweise Projekt wechseln und die Datei erneut öffnen.',
    expected: 'Teilstrecken, Formteile, Sonderbauteile, IDs und Projektangaben bleiben vollständig erhalten.',
  },
  {
    id: 'report-pdf',
    area: 'Bericht',
    title: 'Bericht und PDF-Ausgabe prüfen',
    instruction: 'Bericht öffnen, Seitenumbrüche, Bilder, Summen und PDF-Druckansicht kontrollieren.',
    expected: 'Alle Inhalte sind lesbar, vollständig und fachlich nachvollziehbar gegliedert.',
  },
  {
    id: 'plausibility',
    area: 'Fachlichkeit',
    title: 'Ergebnis gegen eigene Handrechnung oder Referenz vergleichen',
    instruction: 'Mindestens einen einfachen Kanal-/Rohrfall und ein Formteil unabhängig vergleichen.',
    expected: 'Abweichungen liegen innerhalb der fachlich begründeten Rundungs- und Tabellenlogik.',
  },
  {
    id: 'usability',
    area: 'Bedienung',
    title: 'Verständlichkeit und Arbeitsablauf bewerten',
    instruction: 'Projekt ohne zusätzliche Erklärung durch den typischen Ablauf führen.',
    expected: 'Navigation, Bezeichnungen, Hinweise und Fehlermeldungen sind verständlich.',
  },
]);

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function safeString(value = '') {
  return String(value ?? '').trim();
}

function normalizeStatus(value = 'not_tested') {
  const id = safeString(value);
  return EXPERT_TEST_STATUS_OPTIONS.some(option => option.id === id) ? id : 'not_tested';
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

export function createExpertTestDraft(overrides = {}) {
  const now = new Date().toISOString();
  const sourceChecks = Array.isArray(overrides.checks) ? overrides.checks : [];

  const checks = EXPERT_TEST_CHECKS.map(definition => {
    const existing = sourceChecks.find(item => item?.id === definition.id) || {};
    return {
      ...clone(definition),
      status: normalizeStatus(existing.status),
      note: safeString(existing.note),
    };
  });

  return {
    protocolVersion: EXPERT_TEST_PROTOCOL_VERSION,
    appRelease: APP_RELEASE,
    appVersion: APP_VERSION,
    createdAt: safeString(overrides.createdAt || now),
    updatedAt: safeString(overrides.updatedAt || now),
    tester: {
      name: safeString(overrides.tester?.name),
      company: safeString(overrides.tester?.company),
      role: safeString(overrides.tester?.role),
      email: safeString(overrides.tester?.email),
    },
    environment: createEnvironmentSnapshot(overrides.environment),
    checks,
    overall: {
      rating: safeString(overrides.overall?.rating),
      recommendation: safeString(overrides.overall?.recommendation),
      strengths: safeString(overrides.overall?.strengths),
      improvements: safeString(overrides.overall?.improvements),
      notes: safeString(overrides.overall?.notes),
    },
  };
}

export function summarizeExpertTestDraft(draft = {}) {
  const normalized = createExpertTestDraft(draft);
  const counts = {
    total: normalized.checks.length,
    notTested: 0,
    ok: 0,
    notice: 0,
    error: 0,
  };

  normalized.checks.forEach(item => {
    if (item.status === 'ok') counts.ok += 1;
    else if (item.status === 'notice') counts.notice += 1;
    else if (item.status === 'error') counts.error += 1;
    else counts.notTested += 1;
  });

  counts.completed = counts.total - counts.notTested;
  counts.completionPercent = counts.total
    ? Math.round((counts.completed / counts.total) * 100)
    : 0;

  return counts;
}

export function validateExpertTestDraft(draft = {}) {
  const normalized = createExpertTestDraft(draft);
  const counts = summarizeExpertTestDraft(normalized);
  const errors = [];
  const warnings = [];

  if (!normalized.tester.name) warnings.push('Name der testenden Person fehlt.');
  if (!normalized.tester.role) warnings.push('Funktion / Fachgebiet der testenden Person fehlt.');
  if (!normalized.overall.recommendation) warnings.push('Freigabeempfehlung wurde noch nicht gewählt.');
  if (counts.notTested > 0) warnings.push(`${counts.notTested} Prüfpunkte sind noch nicht bearbeitet.`);
  if (counts.error > 0) errors.push(`${counts.error} manuelle Prüfpunkte wurden als Fehler bewertet.`);

  const issuesWithoutNotes = normalized.checks.filter(item => (
    (item.status === 'notice' || item.status === 'error') && !item.note
  ));
  if (issuesWithoutNotes.length) {
    warnings.push(`${issuesWithoutNotes.length} Auffälligkeiten/Fehler haben noch keine Bemerkung.`);
  }

  if (normalized.overall.recommendation === 'release' && (counts.error > 0 || counts.notTested > 0)) {
    warnings.push('Empfehlung „geeignet“ passt noch nicht zum unvollständigen oder fehlerhaften Prüfstand.');
  }

  return {
    valid: errors.length === 0,
    complete: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
    counts,
    draft: normalized,
  };
}

function statusLabel(status = 'not_tested') {
  return EXPERT_TEST_STATUS_OPTIONS.find(option => option.id === status)?.label || 'Nicht geprüft';
}

function recommendationLabel(value = '') {
  return EXPERT_TEST_RECOMMENDATIONS.find(option => option.id === value)?.label || 'Noch keine Empfehlung';
}

export function formatExpertTestProtocol(draft = {}, automatedReport = null) {
  const validation = validateExpertTestDraft(draft);
  const current = validation.draft;
  const counts = validation.counts;
  const lines = [
    'Druckverlust Pro – Fachtester-Protokoll',
    `Protokollversion: ${current.protocolVersion}`,
    `App: v${current.appVersion} · Phase ${current.appRelease}`,
    `Stand: ${current.updatedAt || current.createdAt}`,
    '',
    `Tester/in: ${current.tester.name || '-'}`,
    `Firma: ${current.tester.company || '-'}`,
    `Funktion / Fachgebiet: ${current.tester.role || '-'}`,
    `E-Mail: ${current.tester.email || '-'}`,
    '',
    `Umgebung: ${current.environment.platform || '-'} · ${current.environment.viewport || '-'}`,
    `Browser: ${current.environment.browser || '-'}`,
    `Adresse: ${current.environment.url || '-'}`,
    '',
  ];

  if (automatedReport) {
    lines.push('Automatischer Vorabcheck');
    lines.push(`Status: ${automatedReport.label || automatedReport.status || '-'}`);
    lines.push(`Prüfserien: ${automatedReport.counts?.passedSuites ?? 0}/${automatedReport.counts?.suites ?? 0} bestanden`);
    lines.push(`Einzelprüfungen: ${automatedReport.counts?.passedChecks ?? 0}/${automatedReport.counts?.checks ?? 0} bestanden`);
    (automatedReport.suites || []).forEach(suite => {
      lines.push(`  ${suite.passed ? '✓' : '✗'} ${suite.label}: ${suite.summary}`);
    });
    lines.push('');
  }

  lines.push(`Manueller Fortschritt: ${counts.completed}/${counts.total} (${counts.completionPercent} %)`, '');

  current.checks.forEach((item, index) => {
    lines.push(`${index + 1}. [${statusLabel(item.status)}] ${item.area} – ${item.title}`);
    lines.push(`   Erwartung: ${item.expected}`);
    lines.push(`   Bemerkung: ${item.note || '-'}`);
  });

  lines.push('', 'Gesamtbewertung');
  lines.push(`Bewertung: ${current.overall.rating || '-'}`);
  lines.push(`Empfehlung: ${recommendationLabel(current.overall.recommendation)}`);
  lines.push(`Stärken: ${current.overall.strengths || '-'}`);
  lines.push(`Verbesserungen: ${current.overall.improvements || '-'}`);
  lines.push(`Weitere Hinweise: ${current.overall.notes || '-'}`);

  if (validation.errors.length || validation.warnings.length) {
    lines.push('', 'Protokoll-Hinweise');
    validation.errors.forEach(item => lines.push(`FEHLER: ${item}`));
    validation.warnings.forEach(item => lines.push(`HINWEIS: ${item}`));
  }

  return lines.join('\n');
}

function csvEscape(value = '') {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function createExpertTestCsv(draft = {}, automatedReport = null) {
  const validation = validateExpertTestDraft(draft);
  const current = validation.draft;
  const rows = [
    ['Protokollversion', current.protocolVersion],
    ['App-Version', current.appVersion],
    ['Phase', current.appRelease],
    ['Tester/in', current.tester.name],
    ['Firma', current.tester.company],
    ['Funktion / Fachgebiet', current.tester.role],
    ['E-Mail', current.tester.email],
    ['Browser', current.environment.browser],
    ['Plattform', current.environment.platform],
    ['Viewport', current.environment.viewport],
    ['Automatischer Vorabcheck', automatedReport?.label || 'nicht ausgeführt'],
    [],
    ['Nr.', 'Bereich', 'Prüfpunkt', 'Status', 'Erwartung', 'Bemerkung'],
    ...current.checks.map((item, index) => [
      index + 1,
      item.area,
      item.title,
      statusLabel(item.status),
      item.expected,
      item.note,
    ]),
    [],
    ['Gesamtbewertung', current.overall.rating],
    ['Empfehlung', recommendationLabel(current.overall.recommendation)],
    ['Stärken', current.overall.strengths],
    ['Verbesserungen', current.overall.improvements],
    ['Weitere Hinweise', current.overall.notes],
  ];

  return rows.map(row => row.map(csvEscape).join(';')).join('\n');
}

export function createExpertTestFilename(draft = {}, extension = 'txt') {
  const normalized = createExpertTestDraft(draft);
  const tester = normalized.tester.name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'Fachtest';
  const date = (normalized.updatedAt || normalized.createdAt || new Date().toISOString()).slice(0, 10);
  return `Druckverlust-Pro_${normalized.appRelease}_${tester}_${date}.${extension}`;
}

export default createExpertTestDraft;
