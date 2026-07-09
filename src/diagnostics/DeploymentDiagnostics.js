// Druckverlust Pro – DeploymentDiagnostics
// Prüft GitHub-Pages-Pfade, Cache-Version, Pflichtdateien und Startzustand.

import { APP_RELEASE } from '../core/appVersion.js';

const DEFAULT_VERSION = APP_RELEASE;

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
    { area: 'Berechnung', label: 'Kompatibilitäts-Engine', path: `src/calculation/engine.js?v=${version}` },
    { area: 'Bericht', label: 'Bericht-Engine', path: `src/report/ReportEngine.js?v=${version}` },
    { area: 'PDF', label: 'PDF-Export', path: `src/pdf/report.js?v=${version}` },
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

export default class DeploymentDiagnostics {
  static getRequiredFiles(version = DEFAULT_VERSION) {
    return getRequiredFiles(version);
  }

  static async run({ project = null, version = DEFAULT_VERSION } = {}) {
    const startedAt = nowIso();
    const location = getLocationInfo();
    const runtimeItems = checkRuntime(project, version);
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

    const items = [...runtimeItems, ...fileItems];
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
