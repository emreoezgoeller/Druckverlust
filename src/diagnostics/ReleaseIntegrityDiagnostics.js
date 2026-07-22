// Druckverlust Pro – ReleaseIntegrityDiagnostics
// Phase 58.00: prüft die SHA-256-Integrität der kritischen Final-Release-Dateien.

import {
  APP_RELEASE,
  APP_VERSION,
} from '../core/appVersion.js?v=58.20';

export const RELEASE_INTEGRITY_MANIFEST = 'release-integrity.json';

function createItem(status, label, message, details = '') {
  return { status, area: 'Integrität', label, message, details };
}

function counts(items = []) {
  return items.reduce((summary, item) => {
    summary[item.status] = (summary[item.status] || 0) + 1;
    summary.total += 1;
    return summary;
  }, { ok: 0, warning: 0, error: 0, total: 0 });
}

function statusFromItems(items = []) {
  if (items.some(item => item.status === 'error')) return 'error';
  if (items.some(item => item.status === 'warning')) return 'warning';
  return 'ok';
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(bytes, cryptoRef = globalThis.crypto) {
  if (!cryptoRef?.subtle?.digest) {
    throw new Error('Web-Crypto SHA-256 ist in diesem Browser nicht verfügbar.');
  }
  const digest = await cryptoRef.subtle.digest('SHA-256', bytes);
  return toHex(digest);
}

function resolveBaseUrl(baseUrl = '') {
  if (baseUrl) return baseUrl;
  if (typeof window !== 'undefined' && window.location?.href) return window.location.href;
  return 'http://localhost/';
}

function createResult(items = [], context = {}) {
  const itemCounts = counts(items);
  const status = statusFromItems(items);
  const label = status === 'error'
    ? 'Integrität fehlerhaft'
    : status === 'warning'
      ? 'Integrität nicht vollständig geprüft'
      : 'Integrität bestätigt';

  return {
    status,
    label,
    summary: status === 'ok'
      ? `${itemCounts.ok} Integritätsprüfungen ohne Abweichung abgeschlossen.`
      : status === 'error'
        ? `${itemCounts.error} Integritätsfehler gefunden.`
        : `${itemCounts.warning} Integritätshinweis${itemCounts.warning === 1 ? '' : 'e'} vorhanden.`,
    counts: itemCounts,
    items,
    version: context.version || APP_VERSION,
    phase: context.phase || APP_RELEASE,
    manifestPath: context.manifestPath || RELEASE_INTEGRITY_MANIFEST,
    checkedFiles: context.checkedFiles || 0,
    checkedBytes: context.checkedBytes || 0,
    generatedAt: context.generatedAt || '',
    finishedAt: new Date().toISOString(),
  };
}

export default class ReleaseIntegrityDiagnostics {
  static async run({
    manifestPath = RELEASE_INTEGRITY_MANIFEST,
    fetchImpl = globalThis.fetch,
    cryptoImpl = globalThis.crypto,
    baseUrl = '',
    criticalOnly = true,
  } = {}) {
    const items = [];

    if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
      items.push(createItem(
        'warning',
        'Release-Manifest',
        'Die Integritätsprüfung benötigt den lokalen Webserver und wird bei file:// nicht ausgeführt.',
        'Druckverlust_starten.bat verwenden.',
      ));
      return createResult(items, { manifestPath });
    }

    if (typeof fetchImpl !== 'function') {
      items.push(createItem('warning', 'Release-Manifest', 'Fetch ist in dieser Umgebung nicht verfügbar.'));
      return createResult(items, { manifestPath });
    }

    try {
      const manifestUrl = new URL(manifestPath, resolveBaseUrl(baseUrl));
      const manifestResponse = await fetchImpl(manifestUrl, { cache: 'no-store' });
      if (!manifestResponse.ok) {
        items.push(createItem('error', 'Release-Manifest', `Manifest konnte nicht geladen werden (HTTP ${manifestResponse.status}).`));
        return createResult(items, { manifestPath });
      }

      const manifest = await manifestResponse.json();
      const metadataMatch = manifest?.version === APP_VERSION && manifest?.phase === APP_RELEASE;
      items.push(createItem(
        metadataMatch ? 'ok' : 'error',
        'Versionsbindung',
        metadataMatch
          ? `Manifest gehört zu Version ${APP_VERSION} · Phase ${APP_RELEASE}.`
          : 'Manifest und laufende Anwendung gehören nicht zum selben Release.',
        `Manifest ${manifest?.version || '-'} / ${manifest?.phase || '-'}`,
      ));

      const allFiles = Array.isArray(manifest?.files) ? manifest.files : [];
      const files = criticalOnly ? allFiles.filter(file => file?.critical) : allFiles;
      if (!files.length) {
        items.push(createItem('error', 'Dateiliste', 'Das Manifest enthält keine prüfbaren Dateien.'));
        return createResult(items, {
          manifestPath,
          version: manifest?.version,
          phase: manifest?.phase,
          generatedAt: manifest?.generatedAt,
        });
      }

      let checkedBytes = 0;
      const mismatches = [];
      const unavailable = [];

      for (const file of files) {
        try {
          const fileUrl = new URL(file.path, manifestUrl);
          const response = await fetchImpl(fileUrl, { cache: 'no-store' });
          if (!response.ok) {
            unavailable.push(`${file.path} (HTTP ${response.status})`);
            continue;
          }
          const bytes = await response.arrayBuffer();
          checkedBytes += bytes.byteLength;
          const digest = await sha256Hex(bytes, cryptoImpl);
          if (digest !== file.sha256 || Number(file.bytes) !== bytes.byteLength) {
            mismatches.push(file.path);
          }
        } catch (error) {
          unavailable.push(`${file.path} (${error.message})`);
        }
      }

      if (unavailable.length) {
        items.push(createItem('error', 'Dateizugriff', `${unavailable.length} Final-Datei(en) konnten nicht geprüft werden.`, unavailable.join(' · ')));
      } else {
        items.push(createItem('ok', 'Dateizugriff', `${files.length} kritische Final-Dateien wurden vollständig geladen.`, `${Math.round(checkedBytes / 1024)} KiB`));
      }

      if (mismatches.length) {
        items.push(createItem('error', 'SHA-256', `${mismatches.length} Datei(en) weichen vom Final-Manifest ab.`, mismatches.join(' · ')));
      } else if (!unavailable.length) {
        items.push(createItem('ok', 'SHA-256', 'Alle geprüften Dateien stimmen bytegenau mit dem Final-Manifest überein.'));
      }

      return createResult(items, {
        manifestPath,
        version: manifest?.version,
        phase: manifest?.phase,
        generatedAt: manifest?.generatedAt,
        checkedFiles: files.length - unavailable.length,
        checkedBytes,
      });
    } catch (error) {
      items.push(createItem('error', 'Release-Manifest', 'Integritätsprüfung ist fehlgeschlagen.', error.message));
      return createResult(items, { manifestPath });
    }
  }

  static toText(result = {}) {
    return [
      `Druckverlust Pro ${result.version || APP_VERSION} – Release-Integrität Phase ${result.phase || APP_RELEASE}`,
      `Status: ${result.label || '-'}`,
      result.summary || '',
      `Manifest: ${result.manifestPath || RELEASE_INTEGRITY_MANIFEST}`,
      `Geprüft: ${result.checkedFiles || 0} Datei(en) · ${Math.round(Number(result.checkedBytes || 0) / 1024)} KiB`,
      '',
      ...(result.items || []).map(item => `${item.status === 'ok' ? '✓' : item.status === 'warning' ? '!' : '✕'} ${item.label}: ${item.message}${item.details ? ` (${item.details})` : ''}`),
    ].join('\n');
  }
}
