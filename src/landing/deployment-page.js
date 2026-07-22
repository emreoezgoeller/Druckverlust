import { APP_RELEASE, APP_VERSION } from '../core/appVersion.js?v=58.20';
import {
  DEPLOYMENT_CONFIG,
  getDeploymentLocationInfo,
  resolveRuntimeBaseUrl,
} from '../core/deploymentConfig.js?v=58.20';

const REQUIRED_RESOURCES = Object.freeze([
  { area: 'Startseite', label: 'Produktseite', path: 'index.html' },
  { area: 'Anwendung', label: 'Berechnungstool', path: 'app.html' },
  { area: 'Anleitung', label: 'Bedienungsanleitung', path: 'bedienungsanleitung.html' },
  { area: 'Version', label: 'Release-Metadaten', path: 'release.json' },
  { area: 'Deployment', label: 'Deployment-Konfiguration', path: 'deployment-config.json' },
  { area: 'Integrität', label: 'SHA-256-Manifest', path: 'release-integrity.json' },
  { area: 'PWA', label: 'Webmanifest', path: 'site.webmanifest' },
  { area: 'Start', label: 'Hauptmodul', path: `src/main.js?v=${APP_RELEASE}` },
  { area: 'Layout', label: 'Anwendungs-CSS', path: `src/ui/ApplicationShell.css?v=${APP_RELEASE}` },
  { area: 'Logo', label: 'EO-Logo', path: 'assets/logo/eo-logo.png' },
]);

const state = { result: null };

function createCheck(area, label, status, message, details = '') {
  return { area, label, status, message, details };
}

function statusRank(status) {
  return status === 'error' ? 2 : status === 'warning' ? 1 : 0;
}

function overallStatus(checks) {
  const max = checks.reduce((value, item) => Math.max(value, statusRank(item.status)), 0);
  return max === 2 ? 'error' : max === 1 ? 'warning' : 'ok';
}

function statusText(status) {
  if (status === 'ok') return 'Bereit';
  if (status === 'warning') return 'Mit Hinweisen';
  if (status === 'error') return 'Nicht bereit';
  return 'Wird geprüft';
}

async function fetchResource(baseUrl, resource) {
  const url = new URL(resource.path, baseUrl);
  try {
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    return {
      ...resource,
      url: url.toString(),
      ok: response.ok,
      statusCode: response.status,
      response,
      message: response.ok ? 'erreichbar' : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ...resource,
      url: url.toString(),
      ok: false,
      statusCode: 0,
      response: null,
      message: error?.message || String(error),
    };
  }
}

function checkLocation(locationInfo) {
  const checks = [];
  if (locationInfo.isLocalFile) {
    checks.push(createCheck('Standort', 'Lokaler Start', 'warning', 'Die Seite läuft über file://. Pflichtdateien können so nicht zuverlässig geprüft werden.', 'Druckverlust_starten.bat verwenden.'));
  } else if (locationInfo.isGithubPages) {
    checks.push(createCheck('Standort', 'GitHub Pages', 'ok', 'GitHub Pages wurde erkannt.', locationInfo.host));
  } else if (locationInfo.isLocalhost) {
    checks.push(createCheck('Standort', 'Lokaler Webserver', 'ok', 'Lokaler Webserver wurde erkannt.', locationInfo.host));
  } else {
    checks.push(createCheck('Standort', 'Webserver', 'warning', 'Die Seite läuft auf einem anderen Webserver. Pfade und HTTPS bitte bewusst prüfen.', locationInfo.host || locationInfo.href));
  }

  if (locationInfo.isGithubPages) {
    const pathOk = locationInfo.pathname.startsWith(DEPLOYMENT_CONFIG.repositoryPath);
    checks.push(createCheck(
      'Pfad',
      'Repository-Pfad',
      pathOk ? 'ok' : 'error',
      pathOk ? `Pfad ${DEPLOYMENT_CONFIG.repositoryPath} ist korrekt.` : `Erwartet wird ${DEPLOYMENT_CONFIG.repositoryPath}.`,
      locationInfo.pathname,
    ));
    checks.push(createCheck(
      'Sicherheit',
      'HTTPS',
      locationInfo.isHttps ? 'ok' : 'error',
      locationInfo.isHttps ? 'Die veröffentlichte Seite verwendet HTTPS.' : 'GitHub Pages muss über HTTPS aufgerufen werden.',
      locationInfo.protocol,
    ));
  } else {
    checks.push(createCheck('Pfad', 'Laufzeitbasis', 'ok', 'Relative Projektpfade werden vom aktuellen Verzeichnis aus geprüft.', locationInfo.currentBasePath));
    checks.push(createCheck(
      'Sicherheit',
      'HTTPS',
      locationInfo.isLocalhost || locationInfo.isHttps ? 'ok' : 'warning',
      locationInfo.isLocalhost ? 'Für den lokalen Webserver ist HTTP zulässig.' : locationInfo.isHttps ? 'HTTPS ist aktiv.' : 'Für eine öffentliche Veröffentlichung wird HTTPS empfohlen.',
      locationInfo.protocol,
    ));
  }

  return checks;
}

async function checkMetadata(probes) {
  const checks = [];
  const releaseProbe = probes.find(item => item.path === 'release.json');
  if (releaseProbe?.ok) {
    try {
      const data = await releaseProbe.response.clone().json();
      const matches = data.version === APP_VERSION && data.phase === APP_RELEASE;
      checks.push(createCheck(
        'Version',
        'Release-Konsistenz',
        matches ? 'ok' : 'error',
        matches ? `release.json bestätigt Version ${APP_VERSION} · Phase ${APP_RELEASE}.` : 'release.json und Laufzeitversion stimmen nicht überein.',
        `Datei: ${data.version || '–'} / ${data.phase || '–'}`,
      ));
    } catch (error) {
      checks.push(createCheck('Version', 'Release-Konsistenz', 'error', 'release.json ist nicht als gültiges JSON lesbar.', error?.message || String(error)));
    }
  }

  const appProbe = probes.find(item => item.path === 'app.html');
  if (appProbe?.ok) {
    try {
      const source = await appProbe.response.clone().text();
      const mainVersion = source.match(/src\/main\.js\?v=([0-9.]+)/)?.[1] || '';
      checks.push(createCheck(
        'Cache',
        'Main-Kennung',
        mainVersion === APP_RELEASE ? 'ok' : 'error',
        mainVersion === APP_RELEASE ? `app.html lädt src/main.js mit ?v=${APP_RELEASE}.` : `app.html verwendet eine abweichende Cachekennung.`,
        mainVersion || 'keine Kennung',
      ));
    } catch (error) {
      checks.push(createCheck('Cache', 'Main-Kennung', 'warning', 'app.html konnte nicht inhaltlich geprüft werden.', error?.message || String(error)));
    }
  }

  const configProbe = probes.find(item => item.path === 'deployment-config.json');
  if (configProbe?.ok) {
    try {
      const data = await configProbe.response.clone().json();
      const matches = data.repositoryPath === DEPLOYMENT_CONFIG.repositoryPath && data.version === APP_VERSION;
      checks.push(createCheck(
        'Deployment',
        'Konfiguration',
        matches ? 'ok' : 'error',
        matches ? 'Deployment-Konfiguration ist konsistent.' : 'Deployment-Konfiguration passt nicht zur Laufzeit.',
        `${data.repositoryPath || '–'} · ${data.version || '–'}`,
      ));
    } catch (error) {
      checks.push(createCheck('Deployment', 'Konfiguration', 'error', 'deployment-config.json ist nicht lesbar.', error?.message || String(error)));
    }
  }

  const integrityProbe = probes.find(item => item.path === 'release-integrity.json');
  if (integrityProbe?.ok) {
    try {
      const data = await integrityProbe.response.clone().json();
      const matches = data.version === APP_VERSION && data.phase === APP_RELEASE && Number(data.fileCount) > 0;
      checks.push(createCheck(
        'Integrität',
        'Manifest-Version',
        matches ? 'ok' : 'error',
        matches ? `${data.fileCount} Laufzeitdateien sind im SHA-256-Manifest erfasst.` : 'Integritätsmanifest gehört nicht zum aktuellen Release.',
        `${data.version || '–'} / ${data.phase || '–'}`,
      ));
    } catch (error) {
      checks.push(createCheck('Integrität', 'Manifest-Version', 'error', 'release-integrity.json ist nicht lesbar.', error?.message || String(error)));
    }
  }

  return checks;
}

function renderChecks(checks, running = false) {
  const container = document.querySelector('[data-deployment-results]');
  if (!container) return;
  container.innerHTML = '';
  checks.forEach(item => {
    const article = document.createElement('article');
    article.className = 'dp-deployment-result';
    article.dataset.status = running ? 'checking' : item.status;
    const area = document.createElement('span');
    area.textContent = item.area;
    const title = document.createElement('strong');
    title.textContent = item.label;
    const text = document.createElement('p');
    text.textContent = item.message;
    article.append(area, title, text);
    if (item.details) {
      const details = document.createElement('p');
      const code = document.createElement('code');
      code.textContent = item.details;
      details.append(code);
      article.append(details);
    }
    container.append(article);
  });
}

function updateSummary(result) {
  const status = overallStatus(result.checks);
  const counts = result.checks.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { ok: 0, warning: 0, error: 0 });
  const overall = document.querySelector('[data-deployment-overall]');
  const summary = document.querySelector('[data-deployment-summary]');
  const progress = document.querySelector('[data-deployment-progress]');
  if (overall) overall.textContent = statusText(status);
  if (summary) summary.textContent = `OK: ${counts.ok} · Hinweise: ${counts.warning} · Fehler: ${counts.error}`;
  if (progress) progress.textContent = `${result.checks.length} Prüfpunkte abgeschlossen.`;
  document.querySelectorAll('[data-copy-deployment-report]').forEach(button => { button.disabled = false; });
}

function createReport(result) {
  const lines = [
    `DRUCKVERLUST PRO ${APP_VERSION} – DEPLOYMENT-PRÜFUNG PHASE ${APP_RELEASE}`,
    `Zeitpunkt: ${result.timestamp}`,
    `Standort: ${result.location.href}`,
    '',
    ...result.checks.map(item => `${item.status === 'ok' ? '✓' : item.status === 'warning' ? '!' : '✕'} ${item.area} – ${item.label}: ${item.message}${item.details ? ` (${item.details})` : ''}`),
  ];
  return lines.join('\n');
}

async function runCheck() {
  const buttons = document.querySelectorAll('[data-run-deployment-check]');
  buttons.forEach(button => { button.disabled = true; button.textContent = 'Prüfung läuft …'; });
  const progress = document.querySelector('[data-deployment-progress]');
  if (progress) progress.textContent = 'Pflichtdateien werden geprüft …';

  const location = getDeploymentLocationInfo();
  const baseUrl = resolveRuntimeBaseUrl();
  const initial = checkLocation(location);
  renderChecks(initial, true);

  let probes = [];
  if (!location.isLocalFile) {
    probes = await Promise.all(REQUIRED_RESOURCES.map(resource => fetchResource(baseUrl, resource)));
  }

  const resourceChecks = location.isLocalFile
    ? [createCheck('Dateien', 'Online-Prüfung', 'warning', 'Fetch ist über file:// blockiert. Bitte den Windows-Starter verwenden.')]
    : probes.map(item => createCheck(
        item.area,
        item.label,
        item.ok ? 'ok' : 'error',
        item.ok ? 'Pflichtdatei ist erreichbar.' : `Pflichtdatei fehlt oder ist nicht erreichbar: ${item.message}`,
        item.path,
      ));

  const metadataChecks = location.isLocalFile ? [] : await checkMetadata(probes);
  const result = {
    timestamp: new Date().toISOString(),
    location,
    baseUrl,
    checks: [...initial, ...resourceChecks, ...metadataChecks],
  };
  state.result = result;
  renderChecks(result.checks);
  updateSummary(result);

  document.querySelector('[data-deployment-location]').textContent = location.isGithubPages ? 'GitHub Pages' : location.isLocalhost ? 'Lokaler Server' : location.isLocalFile ? 'Lokale Datei' : location.host || 'Webserver';
  buttons.forEach(button => { button.disabled = false; button.textContent = 'Erneut prüfen'; });
}

async function copyReport() {
  if (!state.result) return;
  const report = createReport(state.result);
  try {
    await navigator.clipboard.writeText(report);
    document.querySelectorAll('[data-copy-deployment-report]').forEach(button => { button.textContent = 'Protokoll kopiert'; });
    window.setTimeout(() => document.querySelectorAll('[data-copy-deployment-report]').forEach(button => { button.textContent = 'Prüfprotokoll kopieren'; }), 1800);
  } catch {
    window.prompt('Prüfprotokoll kopieren:', report);
  }
}

document.querySelectorAll('[data-run-deployment-check]').forEach(button => button.addEventListener('click', runCheck));
document.querySelectorAll('[data-copy-deployment-report]').forEach(button => button.addEventListener('click', copyReport));
document.querySelector('[data-deployment-version]').textContent = APP_VERSION;
document.querySelector('[data-deployment-phase]').textContent = APP_RELEASE;
document.querySelector('[data-deployment-location]').textContent = getDeploymentLocationInfo().host || 'Lokal';

if (!getDeploymentLocationInfo().isLocalFile) {
  window.setTimeout(() => runCheck(), 0);
}

document.addEventListener('contextmenu', event => {
  if (event.target.closest('img')) event.preventDefault();
}, true);
document.addEventListener('dragstart', event => {
  if (event.target.closest('img')) event.preventDefault();
}, true);
