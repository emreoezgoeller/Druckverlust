// Druckverlust Pro – DeploymentDiagnostics
// Prüft GitHub-Pages-Pfade, Cache-Version, Pflichtdateien, UI-Layout und Startzustand.

import { APP_ASSET_VERSION } from '../core/appVersion.js?v=22.03';

const DEFAULT_VERSION = APP_ASSET_VERSION;

function nowIso() {
  return new Date().toISOString();
}

function getLocationInfo() {
  if (typeof window === 'undefined' || !window.location) {
    return {
      href: 'Node/Testumgebung',
      origin: '',
      pathname: '',
      host: '',
      isGithubPages: false,
      isLocalFile: false,
      expectedBasePath: '/',
    };
  }

  const { href, origin, pathname, host, protocol } = window.location;
  const isGithubPages = /github\.io$/i.test(host || '');
  const isLocalFile = protocol === 'file:';
  const expectedBasePath = isGithubPages ? '/Druckverlust/' : './';

  return { href, origin, pathname, host, isGithubPages, isLocalFile, expectedBasePath };
}

function normalizeStatus(items = []) {
  const errors = items.filter(item => item.status === 'error').length;
  const warnings = items.filter(item => item.status === 'warning').length;

  if (errors) return 'error';
  if (warnings) return 'warning';
  return 'ok';
}

function statusLabel(status = 'ok') {
  if (status === 'error') return 'Fehler';
  if (status === 'warning') return 'Hinweise';
  return 'OK';
}

function createItem(area, label, status, message, details = '') {
  return { area, label, status, message, details };
}

function getScriptVersion() {
  if (typeof document === 'undefined') return null;
  const script = document.querySelector('script[type="module"][src*="src/main.js"]');
  if (!script) return null;
  try {
    const url = new URL(script.getAttribute('src'), typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
    return url.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

function getStylesheetVersion() {
  if (typeof document === 'undefined') return null;
  const link = document.querySelector('link[rel="stylesheet"][href*="ApplicationShell.css"]');
  if (!link) return null;
  try {
    const url = new URL(link.getAttribute('href'), typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
    return url.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

async function probeUrl(path) {
  if (typeof fetch !== 'function') {
    return { path, ok: false, skipped: true, status: 0, message: 'Fetch nicht verfügbar.' };
  }

  if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
    return { path, ok: false, skipped: true, status: 0, message: 'Lokale Datei – Online-Prüfung übersprungen.' };
  }

  try {
    const url = new URL(path, typeof window !== 'undefined' ? window.location.href : 'http://localhost/').toString();
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    return { path, ok: response.ok, status: response.status, message: response.ok ? 'gefunden' : `HTTP ${response.status}` };
  } catch (error) {
    return { path, ok: false, status: 0, message: error?.message || String(error) };
  }
}

function getRequiredFiles(version = DEFAULT_VERSION) {
  return [
    { area: 'Start', label: 'Hauptmodul', path: `src/main.js?v=${version}` },
    { area: 'Layout', label: 'Shell-CSS', path: `src/ui/ApplicationShell.css?v=${version}` },
    { area: 'Layout', label: 'Bibliotheks-/Dialog-CSS', path: `src/ui/phase22_03.css?v=${version}` },
    { area: 'Berechnung', label: 'Aktiver Rechenkern', path: `src/core/CalculationEngine.js?v=${version}` },
    { area: 'Oberfläche', label: 'Workspace-Komponente', path: `src/ui/components/WorkspaceComponent.js?v=${version}` },
    { area: 'Oberfläche', label: 'Ribbon-Aktionen', path: `src/ui/core/RibbonActions.js?v=${version}` },
    { area: 'Oberfläche', label: 'Dialogdienst', path: `src/ui/core/UiDialogService.js?v=${version}` },
    { area: 'QS', label: 'Deployment-Diagnose', path: `src/diagnostics/DeploymentDiagnostics.js?v=${version}` },
    { area: 'QS', label: 'Rechen-QS', path: `src/diagnostics/CalculationDiagnostics.js?v=${version}` },
    { area: 'QS', label: 'Referenztest-Diagnose', path: `src/diagnostics/ReferenceTestDiagnostics.js?v=${version}` },
    { area: 'Tests', label: 'Referenztest-Runner', path: `src/testing/ReferenceTestRunner.js?v=${version}` },
    { area: 'Tests', label: 'Referenzfälle', path: `src/testing/referenceCases.js?v=${version}` },
    { area: 'QS', label: 'Formteil-QS-Diagnose', path: `src/diagnostics/FormPartValidationDiagnostics.js?v=${version}` },
    { area: 'Tests', label: 'Formteil-QS-Runner', path: `src/testing/FormPartValidationRunner.js?v=${version}` },
    { area: 'Tests', label: 'Formteil-Referenzfälle', path: `src/testing/formPartReferenceCases.js?v=${version}` },
    { area: 'QS', label: 'Formteil-Sync-Diagnose', path: `src/diagnostics/FormPartSyncDiagnostics.js?v=${version}` },
    { area: 'Tests', label: 'Formteil-Sync-Runner', path: `src/testing/FormPartSyncRunner.js?v=${version}` },
    { area: 'Tests', label: 'Formteil-Sync-Browsertest', path: `tests/phase21-formpart-sync.html?v=${version}` },
    { area: 'QS', label: 'Vergleichsmatrix-Diagnose', path: `src/diagnostics/ComparisonMatrixDiagnostics.js?v=${version}` },
    { area: 'Tests', label: 'Vergleichsmatrix-Runner', path: `src/testing/ComparisonMatrixRunner.js?v=${version}` },
    { area: 'Tests', label: 'Vergleichsmatrix-Fälle', path: `src/testing/comparisonMatrixCases.js?v=${version}` },
    { area: 'Tests', label: 'Vergleichsmatrix-Browsertest', path: `tests/phase21-comparison-matrix.html?v=${version}` },
    { area: 'QS', label: 'Praxisprojekt-Diagnose', path: `src/diagnostics/PracticeProjectDiagnostics.js?v=${version}` },
    { area: 'Tests', label: 'Praxisprojekt-Runner', path: `src/testing/PracticeProjectRunner.js?v=${version}` },
    { area: 'Tests', label: 'Praxisprojekt', path: `src/project/practiceProject.js?v=${version}` },
    { area: 'Tests', label: 'Praxisprojekt-Browsertest', path: `tests/phase21-practice-project.html?v=${version}` },
    { area: 'Fachtest', label: 'Fachtest-Oberfläche', path: `src/ui/phase21_05.css?v=${version}` },
    { area: 'Fachtest', label: 'Fachtester-Diagnose', path: `src/diagnostics/ExpertTestDiagnostics.js?v=${version}` },
    { area: 'Fachtest', label: 'Fachtester-Protokoll', path: `src/testing/ExpertTestProtocol.js?v=${version}` },
    { area: 'Fachtest', label: 'Fachtester-Browsertest', path: `tests/phase21-expert-test-protocol.html?v=${version}` },
    { area: 'Fachtest', label: 'Fachtest-Runden-Auswertung', path: `src/testing/ExpertFeedbackRound.js?v=${version}` },
    { area: 'Fachtest', label: 'Fachtest-Runden-Browsertest', path: `tests/phase21-feedback-round.html?v=${version}` },
    { area: 'Fachtest', label: 'Freigabeentscheidungs-Modul', path: `src/testing/ReleaseDecisionPlan.js?v=${version}` },
    { area: 'Fachtest', label: 'Freigabeentscheidungs-Oberfläche', path: `src/ui/phase21_08.css?v=${version}` },
    { area: 'Fachtest', label: 'Freigabeentscheidungs-Browsertest', path: `tests/phase21-release-decision.html?v=${version}` },
    { area: 'Beta', label: 'Beta-Freigabestand-Modul', path: `src/testing/BetaReleaseReadiness.js?v=${version}` },
    { area: 'Beta', label: 'Beta-Freigabestand-Oberfläche', path: `src/ui/phase21_09.css?v=${version}` },
    { area: 'Beta', label: 'Beta-Freigabestand-Browsertest', path: `tests/phase21-beta-release.html?v=${version}` },
    { area: 'Beta', label: 'Öffentliche Beta-Seite', path: `beta.html?v=${version}` },
    { area: 'Beta', label: 'Beta-Feedback-Modul', path: `src/testing/BetaFeedbackReport.js?v=${version}` },
    { area: 'Beta', label: 'Beta-Feedback-Diagnose', path: `src/diagnostics/BetaFeedbackDiagnostics.js?v=${version}` },
    { area: 'Beta', label: 'Beta-Feedback-Oberfläche', path: `src/ui/phase21_10.css?v=${version}` },
    { area: 'Beta', label: 'Öffentliches Feedback-Formular', path: `feedback.html?v=${version}` },
    { area: 'Beta', label: 'Feedback-Formular-Script', path: `src/landing/beta-feedback-page.js?v=${version}` },
    { area: 'Beta', label: 'Beta-Feedback-Browsertest', path: `tests/phase21-beta-feedback.html?v=${version}` },
    { area: 'Beta', label: 'Beta-Feedback-Auswertung', path: `src/testing/BetaFeedbackInbox.js?v=${version}` },
    { area: 'Beta', label: 'Feedback-Auswertungs-Oberfläche', path: `src/ui/phase21_11.css?v=${version}` },
    { area: 'Beta', label: 'Feedback-Auswertungs-Browsertest', path: `tests/phase21-beta-feedback-inbox.html?v=${version}` },
    { area: 'QS', label: 'Datei-QS', path: `src/diagnostics/ProjectFileDiagnostics.js?v=${version}` },
    { area: 'QS', label: 'Release-Candidate-QS', path: `src/diagnostics/ReleaseCandidateDiagnostics.js?v=${version}` },
    { area: 'Version', label: 'Versionszentrale', path: `src/core/appVersion.js?v=${version}` },
    { area: 'Lizenz', label: 'Lizenz-Konfiguration', path: `src/licensing/licenseConfig.js?v=${version}` },
    { area: 'Lizenz', label: 'License-Gate', path: `src/licensing/LicenseGate.js?v=${version}` },
    { area: 'Bericht', label: 'Bericht-Engine', path: `src/report/ReportEngine.js?v=${version}` },
    { area: 'Logo', label: 'EO-Logo', path: 'assets/logo/eo-logo.png' },
    { area: 'Bericht', label: 'Bericht-Hero', path: 'assets/report/duct-network-hero.png' },
    { area: 'Formteile', label: 'Übergang gross/klein', path: 'assets/formteile/uebergang_gross_klein.png' },
    { area: 'Formteile', label: 'Übergang klein/gross', path: 'assets/formteile/uebergang_klein_gross.png' },
  ];
}

function checkRuntime(project = null, version = DEFAULT_VERSION) {
  const items = [];
  const location = getLocationInfo();
  const scriptVersion = getScriptVersion();
  const stylesheetVersion = getStylesheetVersion();

  if (location.isGithubPages && !String(location.pathname || '').startsWith('/Druckverlust/')) {
    items.push(createItem(
      'GitHub Pages',
      'Projektpfad',
      'error',
      'Die Seite läuft nicht unter /Druckverlust/. Dadurch können relative Pfade falsch aufgelöst werden.',
      location.pathname,
    ));
  } else {
    items.push(createItem('GitHub Pages', 'Projektpfad', 'ok', 'Projektpfad ist für GitHub Pages geeignet.', location.pathname || location.href));
  }

  if (scriptVersion !== version) {
    items.push(createItem(
      'Cache',
      'Main-Version',
      'warning',
      `src/main.js wird nicht mit ?v=${version} geladen. Browsercache kann alte Module behalten.`,
      scriptVersion === null ? 'Script nicht gefunden' : `aktuell: ${scriptVersion || 'ohne Version'}`,
    ));
  } else {
    items.push(createItem('Cache', 'Main-Version', 'ok', `src/main.js lädt mit ?v=${version}.`));
  }

  if (stylesheetVersion !== version) {
    items.push(createItem(
      'Cache',
      'CSS-Version',
      'warning',
      `ApplicationShell.css wird nicht mit ?v=${version} geladen.`,
      stylesheetVersion === null ? 'Stylesheet nicht gefunden' : `aktuell: ${stylesheetVersion || 'ohne Version'}`,
    ));
  } else {
    items.push(createItem('Cache', 'CSS-Version', 'ok', `ApplicationShell.css lädt mit ?v=${version}.`));
  }

  if (!project) {
    items.push(createItem('Projekt', 'Projektzustand', 'error', 'Kein Projekt im Speicher vorhanden.'));
  } else {
    items.push(createItem('Projekt', 'Projektzustand', 'ok', 'Projekt ist im Speicher geladen.', project.name || project.meta?.name || 'Unbenannt'));
  }

  if (project?.calculationResult?.calculation) {
    const total = project.calculationResult.calculation?.totals?.totalRounded ?? project.calculationResult.calculation?.totals?.total ?? null;
    items.push(createItem('Berechnung', 'Startberechnung', 'ok', 'Berechnungsergebnis ist vorhanden.', total === null ? '' : `${total} Pa`));
  } else {
    items.push(createItem('Berechnung', 'Startberechnung', 'warning', 'Noch kein Berechnungsergebnis vorhanden. Bitte einmal „Neu berechnen“ ausführen.'));
  }

  if (typeof document !== 'undefined') {
    const logo = document.querySelector('.dp-brand-logo');
    if (!logo) {
      items.push(createItem('Logo', 'Ribbon-Logo', 'warning', 'Logo im Ribbon wurde nicht gefunden.'));
    } else if (logo.getAttribute('draggable') !== 'false') {
      items.push(createItem('Bildschutz', 'Ribbon-Logo', 'warning', 'Logo ist sichtbar, aber Drag-Schutz fehlt.'));
    } else {
      items.push(createItem('Bildschutz', 'Ribbon-Logo', 'ok', 'Logo ist eingebunden und gegen Ziehen geschützt.'));
    }
  }

  return items;
}

function isElementVisible(element) {
  if (!element || typeof window === 'undefined') return false;

  const style = window.getComputedStyle ? window.getComputedStyle(element) : null;
  if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) return false;

  return element.getClientRects().length > 0;
}

function checkUiShell() {
  const items = [];

  if (typeof document === 'undefined') {
    items.push(createItem('UI', 'Browserprüfung', 'warning', 'DOM ist in dieser Umgebung nicht verfügbar. UI-Prüfung wurde übersprungen.'));
    return items;
  }

  const requiredAreas = [
    ['.dp-shell', 'Shell'],
    ['.dp-ribbon', 'Ribbon'],
    ['.dp-sidebar', 'Sidebar'],
    ['.dp-workspace', 'Arbeitsbereich'],
    ['.dp-status', 'Statusbar'],
  ];

  requiredAreas.forEach(([selector, label]) => {
    const element = document.querySelector(selector);
    items.push(createItem(
      'UI',
      label,
      isElementVisible(element) ? 'ok' : 'error',
      isElementVisible(element) ? `${label} ist sichtbar.` : `${label} wurde nicht sichtbar gerendert.`,
      selector,
    ));
  });

  const properties = document.querySelector('.dp-properties');
  items.push(createItem(
    'UI',
    'Eigenschaftenfenster',
    properties && isElementVisible(properties) ? 'warning' : 'ok',
    properties && isElementVisible(properties)
      ? 'Eigenschaftenfenster ist sichtbar. Aktuell soll es ausgeblendet bleiben.'
      : 'Eigenschaftenfenster ist ausgeblendet und stört die Arbeitsfläche nicht.',
  ));

  const actions = Array.from(document.querySelectorAll('.dp-tabs [data-action]')).map(button => button.dataset.action);
  const requiredActions = [
    'newProject',
    'openProject',
    'saveProject',
    'addSection',
    'addFormPart',
    'addSpecialComponent',
    'calculate',
    'projectCheck',
    'showReport',
    'showShortcutHelp',
    'showAppInfo',
  ];
  const missingActions = requiredActions.filter(action => !actions.includes(action));

  items.push(createItem(
    'UI',
    'Ribbon-Befehle',
    missingActions.length ? 'error' : 'ok',
    missingActions.length
      ? `Folgende Ribbon-Befehle fehlen: ${missingActions.join(', ')}`
      : `${requiredActions.length} Ribbon-Befehle sind vorhanden.`,
  ));

  const tabs = document.querySelector('.dp-tabs');
  if (tabs) {
    const overflow = tabs.scrollWidth > tabs.clientWidth + 4;
    items.push(createItem(
      'UI',
      'Ribbon-Breite',
      overflow ? 'warning' : 'ok',
      overflow
        ? 'Ribbon ist breiter als der sichtbare Bereich. Auf kleineren Bildschirmen kann horizontales Scrollen nötig sein.'
        : 'Ribbon passt in den sichtbaren Bereich.',
      `${tabs.clientWidth}px sichtbar / ${tabs.scrollWidth}px Inhalt`,
    ));
  }

  const root = document.documentElement;
  if (root) {
    const pageOverflow = root.scrollWidth > root.clientWidth + 4;
    items.push(createItem(
      'UI',
      'Seitenbreite',
      pageOverflow ? 'warning' : 'ok',
      pageOverflow
        ? 'Die Seite erzeugt horizontales Überlaufen. Layout bei aktueller Fensterbreite prüfen.'
        : 'Kein horizontales Seitenüberlaufen erkannt.',
      `${root.clientWidth}px sichtbar / ${root.scrollWidth}px Inhalt`,
    ));
  }

  const logo = document.querySelector('.dp-brand-logo');
  if (logo) {
    const loaded = logo.complete && (logo.naturalWidth || 0) > 0;
    items.push(createItem(
      'Bildschutz',
      'Logo geladen',
      loaded ? 'ok' : 'warning',
      loaded ? 'Ribbon-Logo ist geladen.' : 'Ribbon-Logo ist noch nicht geladen oder nicht erreichbar.',
      logo.getAttribute('src') || '',
    ));
  }

  const images = Array.from(document.querySelectorAll('img'));
  const unprotectedImages = images.filter(image => image.getAttribute('draggable') !== 'false');
  items.push(createItem(
    'Bildschutz',
    'Kopierschutz-Attribute',
    unprotectedImages.length ? 'warning' : 'ok',
    unprotectedImages.length
      ? `${unprotectedImages.length} Bild(er) haben kein draggable="false".`
      : `${images.length} Bild(er) mit Drag-Schutz geprüft.`,
  ));

  return items;
}

export default class DeploymentDiagnostics {
  static getRequiredFiles(version = DEFAULT_VERSION) {
    return getRequiredFiles(version);
  }

  static async run({ project = null, version = DEFAULT_VERSION } = {}) {
    const startedAt = nowIso();
    const location = getLocationInfo();
    const runtimeItems = checkRuntime(project, version);
    const uiItems = checkUiShell();
    const requiredFiles = getRequiredFiles(version);
    const probes = await Promise.all(requiredFiles.map(file => probeUrl(file.path)));

    const fileItems = probes.map((probe, index) => {
      const file = requiredFiles[index];
      if (probe.skipped) {
        return createItem(file.area, file.label, 'warning', probe.message, file.path);
      }

      return createItem(
        file.area,
        file.label,
        probe.ok ? 'ok' : 'error',
        probe.ok ? 'Datei ist erreichbar.' : `Datei nicht erreichbar: ${probe.message}`,
        file.path,
      );
    });

    const items = [...runtimeItems, ...uiItems, ...fileItems];
    const status = normalizeStatus(items);
    const counts = {
      ok: items.filter(item => item.status === 'ok').length,
      warning: items.filter(item => item.status === 'warning').length,
      error: items.filter(item => item.status === 'error').length,
    };

    return {
      version,
      startedAt,
      finishedAt: nowIso(),
      location,
      status,
      label: statusLabel(status),
      counts,
      items,
      requiredFiles,
      summary: this.createSummary(status, counts, location),
    };
  }

  static createSummary(status, counts, location = {}) {
    if (status === 'ok') {
      return `Deployment-QS OK: ${counts.ok} Punkte geprüft. Die Seite ist für ${location.isGithubPages ? 'GitHub Pages' : 'den aktuellen Standort'} bereit.`;
    }

    if (status === 'error') {
      return `Deployment-QS mit ${counts.error} Fehler${counts.error === 1 ? '' : 'n'} und ${counts.warning} Hinweis${counts.warning === 1 ? '' : 'en'}. Bitte rote Punkte vor dem Deployment korrigieren.`;
    }

    return `Deployment-QS mit ${counts.warning} Hinweis${counts.warning === 1 ? '' : 'en'}. Deployment ist möglich, aber die gelben Punkte sollten geprüft werden.`;
  }

  static toText(result = {}) {
    const lines = [
      `Druckverlust Pro – Deployment-QS ${result.version || DEFAULT_VERSION}`,
      result.summary || '',
      '',
      `OK: ${result.counts?.ok ?? 0} · Hinweise: ${result.counts?.warning ?? 0} · Fehler: ${result.counts?.error ?? 0}`,
      '',
      ...(result.items || []).map(item => {
        const mark = item.status === 'ok' ? '✓' : item.status === 'warning' ? '!' : '✕';
        return `${mark} ${item.area} – ${item.label}: ${item.message}${item.details ? ` (${item.details})` : ''}`;
      }),
    ];

    return lines.join('\n');
  }
}
