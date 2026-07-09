// Druckverlust Pro – AutoSaveEngine
// Lokale Autosicherung für Browser-Sitzungen und Wiederherstellung nach Refresh/Absturz.

const AUTOSAVE_KEY = 'druckverlust-pro.autosave.v1';
const AUTOSAVE_VERSION = '18.15';
const SAVE_DEBOUNCE_MS = 450;
const MAX_RECOVERY_AGE_DAYS = 30;

function hasLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch (_) {
    return false;
  }
}

function safeStringify(value) {
  const seen = new WeakSet();

  return JSON.stringify(value, (key, item) => {
    if (typeof item === 'object' && item !== null) {
      if (seen.has(item)) return undefined;
      seen.add(item);
    }

    return item;
  });
}

function isDateInRecoveryWindow(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return false;

  const ageMs = Date.now() - date.getTime();
  const maxAgeMs = MAX_RECOVERY_AGE_DAYS * 24 * 60 * 60 * 1000;

  return ageMs >= 0 && ageMs <= maxAgeMs;
}

export default class AutoSaveEngine {
  static key = AUTOSAVE_KEY;

  static save(project, options = {}) {
    if (!hasLocalStorage() || !project) return null;

    const savedAt = new Date().toISOString();
    const payload = {
      fileType: 'DruckverlustProAutoSave',
      version: AUTOSAVE_VERSION,
      savedAt,
      metadata: {
        savedAt,
        projectName: project?.name || project?.meta?.name || 'Unbenanntes Projekt',
        projectObject: project?.object || project?.meta?.object || '',
        systemName: project?.systems?.[0]?.name || project?.meta?.anlage || '',
        dirty: options.dirty !== false,
      },
      project,
    };

    window.localStorage.setItem(AUTOSAVE_KEY, safeStringify(payload));
    this.dispatchStatus(payload.metadata);

    return payload.metadata;
  }

  static load() {
    if (!hasLocalStorage()) return null;

    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;

    try {
      const payload = JSON.parse(raw);
      return this.isRecoverable(payload) ? payload : null;
    } catch (error) {
      console.warn('Autosicherung konnte nicht gelesen werden:', error);
      return null;
    }
  }

  static isRecoverable(payload = null) {
    if (!payload || payload.fileType !== 'DruckverlustProAutoSave') return false;
    if (!payload.project || typeof payload.project !== 'object') return false;
    if (!Array.isArray(payload.project.systems) || !payload.project.systems.length) return false;

    return isDateInRecoveryWindow(payload.savedAt || payload.metadata?.savedAt);
  }

  static clear() {
    if (!hasLocalStorage()) return;

    window.localStorage.removeItem(AUTOSAVE_KEY);
    this.dispatchStatus(null);
  }

  static describe(payload = null) {
    if (!this.isRecoverable(payload)) return 'Keine Autosicherung vorhanden.';

    const meta = payload.metadata || {};
    const date = new Date(meta.savedAt || payload.savedAt);
    const savedAt = Number.isNaN(date.getTime())
      ? 'unbekannter Zeitpunkt'
      : date.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' });

    const title = [
      meta.projectName || payload.project?.name || 'Unbenanntes Projekt',
      meta.projectObject || '',
      meta.systemName || '',
    ].filter(Boolean).join(' · ');

    return `${title || 'Projekt'} – gesichert am ${savedAt}`;
  }

  static install(state, options = {}) {
    if (!state || typeof state.subscribe !== 'function' || !hasLocalStorage()) {
      return () => {};
    }

    let timer = null;
    const debounceMs = Number(options.debounceMs ?? SAVE_DEBOUNCE_MS);

    const flush = () => {
      timer = null;

      if (!state.project) {
        this.clear();
        return;
      }

      if (!state.isProjectDirty) {
        this.clear();
        return;
      }

      const metadata = this.save(state.project, { dirty: state.isProjectDirty });
      if (metadata) state.lastAutoSaveAt = metadata.savedAt;
    };

    const unsubscribe = state.subscribe(() => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(flush, debounceMs);
    });

    return () => {
      if (timer) window.clearTimeout(timer);
      unsubscribe?.();
    };
  }

  static dispatchStatus(metadata = null) {
    if (typeof window === 'undefined' || typeof window.CustomEvent !== 'function') return;

    window.dispatchEvent(new CustomEvent('druckverlust:auto-save', {
      detail: metadata,
    }));
  }
}
