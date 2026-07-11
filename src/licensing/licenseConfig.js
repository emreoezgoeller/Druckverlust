// Druckverlust Pro – Lizenz-/Abo-Vorbereitung
// Phase 20.03: Lizenzstatus, Feature-Flags und Exporthinweise zentral vorbereitet. Weiterhin ohne Login/Zahlung/Sperre.

export const LICENSE_PHASE = '20.03';
export const LICENSE_MODE = 'professional-preview';
export const LICENSE_MODE_LABEL = 'Professional Preview';
export const LICENSE_EXPORT_MODE = 'preview-export';
export const LICENSE_EXPORT_LABEL = 'PDF-/HTML-Export ohne technische Sperre';
export const LICENSE_WATERMARK_TEXT = 'Druckverlust Pro · Professional Preview';

export const LICENSE_CAPABILITIES = [
  'Projektbearbeitung ohne Cloud-Zwang',
  'Speichern/Öffnen als .dvp-Projektdatei',
  'Demo-Projekt und Beispielbericht',
  'PDF-/HTML-Bericht über Browserdruck',
  'Projekt-, Rechen- und Export-QS vorbereitet',
  'Lizenzmatrix und Feature-Flags vorbereitet',
  'Exportstatus für spätere Free-/Professional-Abgrenzung vorbereitet',
];

export const LICENSE_LIMITATIONS = [
  'Noch kein Login aktiv',
  'Noch keine Zahlung aktiv',
  'Noch keine technische Zugriffssperre aktiv',
  'Feature-Flags sind vorbereitet, aber erzwingen aktuell noch keine Sperren',
  'Exportrechte werden angezeigt, aber noch nicht technisch limitiert',
  'Rechtliche Texte und Lizenzbedingungen vor Veröffentlichung final prüfen',
];

export const LICENSE_PLANS = [
  {
    id: 'test',
    name: 'Test',
    label: 'Demo / Prüfung',
    description: 'Demo-Projekt, Anleitung und Beispielbericht für erste Tests.',
    active: true,
    current: false,
    restricted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    label: 'Planung / Abgabe',
    description: 'Projektbearbeitung, Formteil-Nachweis, QS und Berichtserstellung.',
    active: true,
    current: true,
    restricted: false,
  },
  {
    id: 'future-license',
    name: 'Später',
    label: 'Lizenz / Abo',
    description: 'Vorbereitung für Aktivierung, Firmenlizenz und erweiterte Exportrechte.',
    active: false,
    current: false,
    restricted: false,
  },
];

export const LICENSE_FEATURE_FLAGS = {
  projectEditing: true,
  demoProject: true,
  localDvpStorage: true,
  htmlReport: true,
  pdfPrint: true,
  qualityChecks: true,
  exportCsv: true,
  exportStatusNotice: true,
  previewWatermarkPrepared: true,
  futureLogin: false,
  futurePayment: false,
  futureCompanyLicense: false,
  futureCloudProjects: false,
  futureApiExport: false,
  futureExportLimit: false,
};

export const LICENSE_MATRIX = [
  {
    id: 'demo-project',
    featureId: 'demoProject',
    label: 'Demo-Projekt und Anleitung',
    test: true,
    professional: true,
    future: true,
    note: 'Für Test, Vorführung und erste Kontrolle sofort verfügbar.',
  },
  {
    id: 'project-editing',
    featureId: 'projectEditing',
    label: 'Projektbearbeitung',
    test: true,
    professional: true,
    future: true,
    note: 'Teilstrecken, Formteile und Sonderbauteile bearbeiten.',
  },
  {
    id: 'dvp-storage',
    featureId: 'localDvpStorage',
    label: '.dvp speichern / öffnen',
    test: true,
    professional: true,
    future: true,
    note: 'Lokale Projektdatei ohne Cloud-Zwang.',
  },
  {
    id: 'report-export',
    featureId: 'pdfPrint',
    label: 'Bericht / PDF über Drucken',
    test: true,
    professional: true,
    future: true,
    note: 'Aktuell ohne technische Export-Sperre, später über Feature-Flag steuerbar.',
  },
  {
    id: 'quality-checks',
    featureId: 'qualityChecks',
    label: 'Projekt-, Rechen- und Datei-QS',
    test: true,
    professional: true,
    future: true,
    note: 'QS-Logik ist vorbereitet und im Tool nutzbar.',
  },
  {
    id: 'export-status',
    featureId: 'exportStatusNotice',
    label: 'Exportstatus / Lizenzhinweis',
    test: true,
    professional: true,
    future: true,
    note: 'Bericht und Tool können den aktiven Lizenz-/Exportstatus anzeigen.',
  },
  {
    id: 'company-license',
    featureId: 'futureCompanyLicense',
    label: 'Firmenlizenz / Aktivierung',
    test: false,
    professional: false,
    future: true,
    note: 'Für eine spätere geschützte Produktversion vorgesehen.',
  },
  {
    id: 'cloud-projects',
    featureId: 'futureCloudProjects',
    label: 'Cloud-Projekte / Nutzerkonto',
    test: false,
    professional: false,
    future: true,
    note: 'Nur als spätere Ausbaustufe geplant.',
  },
];

export function getActiveLicensePlan() {
  return LICENSE_PLANS.find(plan => plan.current) || LICENSE_PLANS.find(plan => plan.active) || LICENSE_PLANS[0];
}

export function getLicenseFeatureRows() {
  return LICENSE_MATRIX.map(row => ({ ...row }));
}

export function isLicenseFeatureEnabled(featureId) {
  return Boolean(LICENSE_FEATURE_FLAGS[featureId]);
}

export function getLicenseFeatureAccess(featureId) {
  const enabled = isLicenseFeatureEnabled(featureId);
  const activePlan = getActiveLicensePlan();
  const row = LICENSE_MATRIX.find(item => item.featureId === featureId || item.id === featureId) || null;

  return {
    featureId,
    enabled,
    allowed: enabled,
    enforced: false,
    activePlan,
    label: row?.label || featureId,
    note: row?.note || '',
    message: enabled
      ? 'Funktion ist in der Professional Preview aktiv.'
      : 'Funktion ist vorbereitet, aber noch nicht aktiv.',
  };
}

export function createLicenseStatus() {
  const activePlan = getActiveLicensePlan();

  return {
    phase: LICENSE_PHASE,
    mode: LICENSE_MODE,
    modeLabel: LICENSE_MODE_LABEL,
    exportMode: LICENSE_EXPORT_MODE,
    exportLabel: LICENSE_EXPORT_LABEL,
    watermarkText: LICENSE_WATERMARK_TEXT,
    activePlan,
    enforced: false,
    loginRequired: false,
    paymentEnabled: false,
    cloudRequired: false,
    exportRestricted: false,
    capabilities: LICENSE_CAPABILITIES,
    limitations: LICENSE_LIMITATIONS,
    plans: LICENSE_PLANS,
    featureFlags: { ...LICENSE_FEATURE_FLAGS },
    matrix: getLicenseFeatureRows(),
  };
}

export function getLicenseSummary() {
  return createLicenseStatus();
}

function mark(value) {
  return value ? 'Ja' : 'Später';
}

export function formatLicenseMatrixText(rows = getLicenseFeatureRows()) {
  const lines = [
    'Lizenzmatrix / Feature-Flags:',
    ...rows.map(row => `• ${row.label}: Test ${mark(row.test)} · Professional ${mark(row.professional)} · Später ${row.future ? 'geplant' : 'nein'}`),
  ];

  return lines.join('\n');
}

export function formatLicenseStatusText(status = createLicenseStatus()) {
  const lines = [
    `Lizenzstatus: ${status.modeLabel}`,
    `Aktiver Plan: ${status.activePlan?.name || 'unbekannt'} – ${status.activePlan?.label || ''}`.trim(),
    `Exportstatus: ${status.exportLabel}`,
    `Login erforderlich: ${status.loginRequired ? 'Ja' : 'Nein'}`,
    `Zahlung aktiv: ${status.paymentEnabled ? 'Ja' : 'Nein'}`,
    `Technische Sperre aktiv: ${status.enforced ? 'Ja' : 'Nein'}`,
    '',
    'Aktuell enthalten:',
    ...status.capabilities.map(item => `• ${item}`),
    '',
    formatLicenseMatrixText(status.matrix),
    '',
    'Noch offen:',
    ...status.limitations.map(item => `• ${item}`),
  ];

  return lines.join('\n');
}
