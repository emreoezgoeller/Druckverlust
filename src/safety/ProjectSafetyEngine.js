// Druckverlust Pro – ProjectSafetyEngine
// Projektarchiv, lokale Sicherungshistorie, Wiederherstellung und Übergabe-Diagnose.

import StorageEngine from '../storage/StorageEngine.js';
import ProjectFileDiagnostics from '../diagnostics/ProjectFileDiagnostics.js';
import ProjectDiagnostics from '../diagnostics/ProjectDiagnostics.js';
import CalculationDiagnostics from '../diagnostics/CalculationDiagnostics.js';
import ProjectCompletionEngine from '../closing/ProjectCompletionEngine.js?v=33.00&release=45.00';
import { APP_NAME, APP_RELEASE, APP_VERSION } from '../core/appVersion.js?v=40.00&release=45.00';

export const PROJECT_ARCHIVE_FILE_TYPE = 'DruckverlustProArchive';
export const PROJECT_ARCHIVE_SCHEMA_VERSION = '1.0.0';
export const PROJECT_ARCHIVE_EXTENSION = '.dvpa';
export const LOCAL_BACKUP_KEY = 'druckverlust-pro.backup-history.v1';
export const MAX_LOCAL_BACKUPS = 8;
const MAX_LOCAL_BACKUP_BYTES = 4.5 * 1024 * 1024;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix = 'backup') {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function sanitizeFilePart(value, fallback = 'Druckverlust-Projekt') {
  const result = safeText(value, fallback)
    .replace(/[^\wäöüÄÖÜß-]+/g, '_')
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
  return result || fallback;
}

function dateStamp(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'unbekannt';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    '-',
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join('');
}

function fnv1a(text = '') {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}


function stableProjectChecksum(projectFile = {}) {
  const canonical = {
    ...projectFile,
    exportedAt: '',
  };
  return fnv1a(JSON.stringify(canonical));
}

function hasStorage(storage = null) {
  try {
    const target = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!target || typeof target.getItem !== 'function' || typeof target.setItem !== 'function') return false;
    const key = '__druckverlust_safety_probe__';
    target.setItem(key, '1');
    target.removeItem(key);
    return true;
  } catch (_) {
    return false;
  }
}

function resolveStorage(storage = null) {
  if (storage) return storage;
  if (typeof window !== 'undefined') return window.localStorage;
  return null;
}

function parseHistory(raw = '') {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return safeArray(data?.backups || data).filter(item => item && item.archive);
  } catch (_) {
    return [];
  }
}

function getStatusRank(status = 'ok') {
  if (status === 'error') return 3;
  if (status === 'warning') return 2;
  return 1;
}

function summarizeDiagnostics(checks = []) {
  const counts = { error: 0, warning: 0, ok: 0, total: 0 };
  const items = [];

  checks.forEach(check => {
    safeArray(check?.items).forEach(item => {
      const status = ['error', 'warning', 'ok'].includes(item.status) ? item.status : 'warning';
      counts[status] += 1;
      counts.total += 1;
      items.push({
        status,
        area: safeText(item.area, 'Prüfung'),
        label: safeText(item.label, 'Prüfpunkt'),
        message: safeText(item.message || item.detail || item.details, '-'),
        details: safeText(item.details || item.detail, ''),
      });
    });
  });

  items.sort((a, b) => getStatusRank(b.status) - getStatusRank(a.status));
  const status = counts.error ? 'error' : counts.warning ? 'warning' : 'ok';
  const score = Math.max(0, Math.min(100, 100 - counts.error * 12 - counts.warning * 3));
  return { counts, items, status, score };
}

function getSystem(project = {}, systemId = '') {
  const systems = safeArray(project.systems);
  return systems.find(item => item?.id === systemId) || systems[0] || null;
}

function getProjectLabel(project = {}) {
  return safeText(project.name || project.meta?.name || project.object, 'Unbenanntes Projekt');
}

function getRevision(project = {}) {
  return safeText(project.report?.revision || project.revision || project.rev, '0');
}

function createDownload(content, fileName, type = 'application/json;charset=utf-8') {
  if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return false;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  return true;
}

export default class ProjectSafetyEngine {
  static checksum(text = '') {
    return fnv1a(String(text));
  }

  static isStorageAvailable(storage = null) {
    return hasStorage(storage);
  }

  static createHealth(project = null, options = {}) {
    if (!project) {
      return {
        status: 'error',
        score: 0,
        label: 'Kein Projekt',
        summary: 'Es ist kein Projekt geladen.',
        counts: { error: 1, warning: 0, ok: 0, total: 1 },
        items: [{ status: 'error', area: 'Projekt', label: 'Projekt vorhanden', message: 'Kein Projekt geladen.', details: '' }],
        checkedAt: nowIso(),
        backups: [],
      };
    }

    const system = options.system || getSystem(project, options.systemId);
    const fileCheck = ProjectFileDiagnostics.create(project);
    const projectCheck = ProjectDiagnostics.create(project, { system });
    const calculationCheck = CalculationDiagnostics.create(project, { system });
    const aggregate = summarizeDiagnostics([fileCheck, projectCheck, calculationCheck]);
    const backups = this.listLocalBackups({ storage: options.storage });
    const storageAvailable = this.isStorageAvailable(options.storage);
    const completion = system ? ProjectCompletionEngine.analyze(project, system.id, {
      isProjectDirty: Boolean(options.isProjectDirty),
    }) : null;
    // Die Abschlussanalyse kann ältere Projekte normalisieren. Der Fingerabdruck
    // wird deshalb erst danach aus dem definitiven Speicherstand gebildet.
    const serialized = StorageEngine.serialize(project);
    const serializedPayload = JSON.parse(serialized);

    const supplemental = [];
    supplemental.push({
      status: storageAvailable ? 'ok' : 'warning',
      area: 'Sicherung',
      label: 'Lokaler Sicherungsspeicher',
      message: storageAvailable
        ? `${backups.length} lokale Sicherung${backups.length === 1 ? '' : 'en'} vorhanden.`
        : 'Lokale Sicherungen sind in diesem Browser nicht verfügbar.',
      details: storageAvailable ? `Maximal ${MAX_LOCAL_BACKUPS} Stände werden behalten.` : 'Browser- oder Datenschutz-Einstellungen prüfen.',
    });

    if (options.autosave) {
      supplemental.push({
        status: 'ok',
        area: 'Sicherung',
        label: 'Autosicherung',
        message: 'Eine wiederherstellbare Autosicherung ist vorhanden.',
        details: safeText(options.autosaveDescription, ''),
      });
    } else {
      supplemental.push({
        status: options.isProjectDirty ? 'warning' : 'ok',
        area: 'Sicherung',
        label: 'Autosicherung',
        message: options.isProjectDirty
          ? 'Projekt ist geändert; die Autosicherung wird nach kurzer Verzögerung aktualisiert.'
          : 'Kein ungesicherter Projektstand vorhanden.',
        details: '',
      });
    }

    supplemental.forEach(item => {
      aggregate.items.push(item);
      aggregate.counts[item.status] += 1;
      aggregate.counts.total += 1;
    });
    aggregate.items.sort((a, b) => getStatusRank(b.status) - getStatusRank(a.status));
    aggregate.status = aggregate.counts.error ? 'error' : aggregate.counts.warning ? 'warning' : 'ok';
    aggregate.score = Math.max(0, Math.min(100, 100 - aggregate.counts.error * 12 - aggregate.counts.warning * 3));

    return {
      ...aggregate,
      label: aggregate.status === 'ok' ? 'Projektsicherheit OK' : aggregate.status === 'error' ? 'Fehler beheben' : 'Hinweise prüfen',
      summary: aggregate.status === 'ok'
        ? 'Projektdatei, Berechnung und lokale Sicherung sind für die Weiterarbeit vorbereitet.'
        : aggregate.status === 'error'
          ? 'Vor Übergabe oder Wiederherstellung müssen Fehler korrigiert werden.'
          : 'Projekt ist nutzbar; einzelne Hinweise sollten vor der Übergabe geprüft werden.',
      checkedAt: nowIso(),
      checksum: stableProjectChecksum(serializedPayload),
      fileName: fileCheck.fileName,
      jsonSizeBytes: fileCheck.jsonSizeBytes,
      schemaVersion: fileCheck.schemaVersion,
      appVersion: APP_VERSION,
      appRelease: APP_RELEASE,
      projectLabel: getProjectLabel(project),
      revision: getRevision(project),
      systemName: safeText(system?.name, 'Keine Anlage'),
      backups,
      storageAvailable,
      completion: completion ? {
        status: completion.status,
        score: completion.score,
        revisionCurrent: completion.revisionCurrent,
        revisionCount: safeArray(completion.revisions).length,
        variantCount: safeArray(completion.variants).length,
        reviewComplete: Boolean(completion.reviewProtocol?.isComplete),
      } : null,
      checks: { fileCheck, projectCheck, calculationCheck },
    };
  }

  static createArchive(project, options = {}) {
    if (!project) throw new Error('Kein Projekt für das Projektarchiv vorhanden.');

    const system = options.system || getSystem(project, options.systemId);
    // Die Abschlussanalyse kann ältere Projekte einmalig normalisieren. Deshalb
    // wird zuerst die Diagnose erstellt und erst danach der definitive .dvp-Inhalt
    // serialisiert, damit identische Projektstände dieselbe Prüfsumme erhalten.
    const health = options.health || this.createHealth(project, {
      system,
      systemId: system?.id,
      isProjectDirty: options.isProjectDirty,
      autosave: options.autosave,
      autosaveDescription: options.autosaveDescription,
      storage: options.storage,
    });
    const projectText = StorageEngine.serialize(project);
    const projectFile = JSON.parse(projectText);
    const createdAt = options.createdAt || nowIso();
    const checksum = stableProjectChecksum(projectFile);

    return {
      fileType: PROJECT_ARCHIVE_FILE_TYPE,
      schemaVersion: PROJECT_ARCHIVE_SCHEMA_VERSION,
      appName: APP_NAME,
      appVersion: APP_VERSION,
      appRelease: APP_RELEASE,
      createdAt,
      id: options.id || createId('archive'),
      reason: safeText(options.reason, 'manual'),
      label: safeText(options.label, 'Manuelle Projektsicherung'),
      note: safeText(options.note, ''),
      projectName: getProjectLabel(project),
      systemName: safeText(system?.name, ''),
      revision: getRevision(project),
      checksum,
      summary: projectFile.summary || health.checks?.fileCheck?.projectSummary || {},
      diagnostics: {
        status: health.status,
        score: health.score,
        counts: health.counts,
        checkedAt: health.checkedAt,
        items: health.items,
      },
      completion: health.completion,
      projectFile,
    };
  }

  static serializeArchive(archive = {}) {
    if (!archive || archive.fileType !== PROJECT_ARCHIVE_FILE_TYPE) {
      throw new Error('Ungültiges Druckverlust-Projektarchiv.');
    }
    return JSON.stringify(archive, null, 2);
  }

  static parseArchive(input, options = {}) {
    let archive;
    try {
      archive = typeof input === 'string' ? JSON.parse(input) : input;
    } catch (error) {
      throw new Error(`Projektarchiv konnte nicht gelesen werden: ${error.message}`);
    }

    if (!archive || archive.fileType !== PROJECT_ARCHIVE_FILE_TYPE || !archive.projectFile) {
      throw new Error('Keine gültige .dvpa-Datei von Druckverlust Pro.');
    }

    const actualChecksum = stableProjectChecksum(archive.projectFile);
    if (archive.checksum && archive.checksum !== actualChecksum) {
      throw new Error('Die Prüfsumme des Projektarchivs stimmt nicht. Die Datei ist möglicherweise beschädigt oder verändert.');
    }

    const project = StorageEngine.parse(JSON.stringify(archive.projectFile), {
      fileName: options.fileName || this.createArchiveFileName({ name: archive.projectName }, archive.createdAt),
    });

    return {
      archive: { ...archive, checksum: actualChecksum },
      project,
      warnings: safeArray(project?._importInfo?.warnings || project?._importInfo?.normalizedWarnings),
    };
  }

  static createArchiveFileName(project = {}, createdAt = new Date()) {
    const base = sanitizeFilePart(getProjectLabel(project));
    return `${base}_Archiv_${dateStamp(createdAt)}${PROJECT_ARCHIVE_EXTENSION}`;
  }

  static createDiagnosticsFileName(project = {}) {
    return `${sanitizeFilePart(getProjectLabel(project))}_Sicherheitsdiagnose_${dateStamp()}_Phase${APP_RELEASE}.csv`;
  }

  static downloadArchive(project, options = {}) {
    const archive = this.createArchive(project, options);
    const fileName = options.fileName || this.createArchiveFileName(project, archive.createdAt);
    createDownload(this.serializeArchive(archive), fileName);
    return { archive, fileName };
  }

  static downloadStoredArchive(backup = {}) {
    if (!backup?.archive) throw new Error('Lokale Sicherung ist nicht verfügbar.');
    const fileName = this.createArchiveFileName({ name: backup.archive.projectName }, backup.archive.createdAt);
    createDownload(this.serializeArchive(backup.archive), fileName);
    return fileName;
  }

  static readArchiveFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Keine Projektarchiv-Datei ausgewählt.'));
      const name = safeText(file.name).toLowerCase();
      if (name && !name.endsWith(PROJECT_ARCHIVE_EXTENSION) && !name.endsWith('.json')) {
        return reject(new Error('Bitte eine .dvpa-Projektarchivdatei auswählen.'));
      }
      if (Number(file.size || 0) > 15 * 1024 * 1024) {
        return reject(new Error('Die Projektarchivdatei ist ungewöhnlich gross.'));
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(this.parseArchive(reader.result, { fileName: file.name || '' }));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Datei konnte nicht gelesen werden.'));
      reader.readAsText(file, 'utf-8');
    });
  }

  static listLocalBackups(options = {}) {
    const storage = resolveStorage(options.storage);
    if (!hasStorage(storage)) return [];
    const history = parseHistory(storage.getItem(LOCAL_BACKUP_KEY));
    return history
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .map(item => ({
        id: item.id,
        createdAt: item.createdAt,
        label: item.label,
        note: item.note,
        reason: item.reason,
        projectName: item.archive?.projectName || '',
        systemName: item.archive?.systemName || '',
        revision: item.archive?.revision || '',
        checksum: item.archive?.checksum || '',
        sizeBytes: Number(item.sizeBytes || JSON.stringify(item.archive || {}).length),
        status: item.archive?.diagnostics?.status || 'unknown',
        score: Number(item.archive?.diagnostics?.score || 0),
      }));
  }

  static getLocalBackup(id, options = {}) {
    const storage = resolveStorage(options.storage);
    if (!hasStorage(storage)) return null;
    return parseHistory(storage.getItem(LOCAL_BACKUP_KEY)).find(item => item.id === id) || null;
  }

  static saveLocalBackup(project, options = {}) {
    if (!project) return null;
    const storage = resolveStorage(options.storage);
    if (!hasStorage(storage)) return null;

    const archive = this.createArchive(project, { ...options, storage });
    let history = parseHistory(storage.getItem(LOCAL_BACKUP_KEY));
    const newest = history.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0];

    if (newest?.archive?.checksum === archive.checksum && options.allowDuplicate !== true) {
      newest.createdAt = archive.createdAt;
      newest.label = archive.label;
      newest.note = archive.note;
      newest.reason = archive.reason;
      newest.archive = archive;
      newest.sizeBytes = JSON.stringify(archive).length;
    } else {
      history.push({
        id: archive.id,
        createdAt: archive.createdAt,
        label: archive.label,
        note: archive.note,
        reason: archive.reason,
        sizeBytes: JSON.stringify(archive).length,
        archive,
      });
    }

    history = history
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, MAX_LOCAL_BACKUPS);

    let payload = JSON.stringify({ version: 1, backups: history });
    while (payload.length > MAX_LOCAL_BACKUP_BYTES && history.length > 1) {
      history.pop();
      payload = JSON.stringify({ version: 1, backups: history });
    }

    try {
      storage.setItem(LOCAL_BACKUP_KEY, payload);
    } catch (error) {
      if (history.length > 1) {
        history = history.slice(0, Math.max(1, Math.floor(history.length / 2)));
        storage.setItem(LOCAL_BACKUP_KEY, JSON.stringify({ version: 1, backups: history }));
      } else {
        throw new Error(`Lokale Sicherung konnte nicht gespeichert werden: ${error.message}`);
      }
    }

    return this.listLocalBackups({ storage }).find(item => item.checksum === archive.checksum) || null;
  }

  static restoreLocalBackup(id, options = {}) {
    const backup = this.getLocalBackup(id, options);
    if (!backup) throw new Error('Die gewählte lokale Sicherung wurde nicht gefunden.');
    return this.parseArchive(backup.archive, { fileName: `${backup.archive.projectName || 'Projekt'}${PROJECT_ARCHIVE_EXTENSION}` });
  }

  static deleteLocalBackup(id, options = {}) {
    const storage = resolveStorage(options.storage);
    if (!hasStorage(storage)) return false;
    const history = parseHistory(storage.getItem(LOCAL_BACKUP_KEY));
    const next = history.filter(item => item.id !== id);
    if (next.length === history.length) return false;
    storage.setItem(LOCAL_BACKUP_KEY, JSON.stringify({ version: 1, backups: next }));
    return true;
  }

  static clearLocalBackups(options = {}) {
    const storage = resolveStorage(options.storage);
    if (!hasStorage(storage)) return false;
    storage.removeItem(LOCAL_BACKUP_KEY);
    return true;
  }

  static toDiagnosticsCsv(health = {}) {
    const rows = [
      ['Druckverlust Pro Sicherheitsdiagnose'],
      ['Projekt', health.projectLabel || ''],
      ['Anlage', health.systemName || ''],
      ['Revision', health.revision || ''],
      ['Phase', health.appRelease || APP_RELEASE],
      ['Version', health.appVersion || APP_VERSION],
      ['Status', health.label || health.status || ''],
      ['Score', health.score ?? ''],
      ['Prüfsumme', health.checksum || ''],
      ['Geprüft am', health.checkedAt || ''],
      [],
      ['Status', 'Bereich', 'Prüfpunkt', 'Meldung', 'Details'],
      ...safeArray(health.items).map(item => [item.status, item.area, item.label, item.message, item.details || '']),
    ];

    const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return rows.map(row => row.map(quote).join(';')).join('\r\n');
  }

  static downloadDiagnostics(project, health = null, options = {}) {
    const result = health || this.createHealth(project, options);
    const fileName = this.createDiagnosticsFileName(project);
    createDownload(`\ufeff${this.toDiagnosticsCsv(result)}`, fileName, 'text/csv;charset=utf-8');
    return fileName;
  }
}
