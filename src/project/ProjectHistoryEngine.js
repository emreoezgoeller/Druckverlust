// Druckverlust Pro – ProjectHistoryEngine
// Phase 40.00: Sitzungsbezogener Änderungsverlauf mit Rückgängig/Wiederholen.

import ProjectCalculationService from './ProjectCalculationService.js';

const DEFAULT_LIMIT = 40;
const DEFAULT_DEBOUNCE_MS = 360;
const TRANSIENT_KEYS = new Set([
  'calculationResult',
  '_importInfo',
  '_runtime',
]);

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // JSON-Fallback unten.
    }
  }

  return JSON.parse(JSON.stringify(value));
}

function sanitize(value, key = '') {
  if (TRANSIENT_KEYS.has(key)) return undefined;
  if (Array.isArray(value)) return value.map(item => sanitize(item)).filter(item => item !== undefined);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(Object.entries(value)
    .map(([entryKey, entryValue]) => [entryKey, sanitize(entryValue, entryKey)])
    .filter(([, entryValue]) => entryValue !== undefined));
}

function createSnapshot(project) {
  return sanitize(deepClone(project || {}));
}

function stableHash(snapshot) {
  return JSON.stringify(snapshot || {});
}

function createSelectionSnapshot(state) {
  const selection = state?.getSelection?.() || state?.selection || {};
  return {
    type: selection.type || 'project',
    id: selection.id || selection.data?.id || null,
    systemId: state?.selectedSystem?.id || null,
    sectionId: state?.selectedSection?.id || null,
    formPartId: state?.selectedFormPart?.id || null,
    specialComponentId: state?.selectedSpecialComponent?.id || null,
  };
}

function getSystemMaps(project = {}) {
  const systems = Array.isArray(project.systems) ? project.systems : [];
  return {
    systems,
    byId: new Map(systems.map((system, index) => [system?.id || `system-${index}`, system])),
  };
}

function getEntityMap(project = {}, collectionName) {
  const map = new Map();
  (project.systems || []).forEach((system, systemIndex) => {
    (system?.[collectionName] || []).forEach((item, index) => {
      const key = item?.id || `${system?.id || systemIndex}:${collectionName}:${index}`;
      map.set(key, { item, system });
    });
  });
  return map;
}

function countCollection(project = {}, collectionName) {
  return (project.systems || []).reduce((sum, system) => sum + (system?.[collectionName]?.length || 0), 0);
}

function compareEntityMaps(beforeMap, afterMap) {
  let added = 0;
  let removed = 0;
  let changed = 0;
  let firstChanged = null;

  afterMap.forEach((afterEntry, key) => {
    const beforeEntry = beforeMap.get(key);
    if (!beforeEntry) {
      added += 1;
      firstChanged ||= afterEntry?.item?.name || afterEntry?.item?.id || key;
      return;
    }

    if (JSON.stringify(beforeEntry.item) !== JSON.stringify(afterEntry.item)) {
      changed += 1;
      firstChanged ||= afterEntry?.item?.name || afterEntry?.item?.id || key;
    }
  });

  beforeMap.forEach((beforeEntry, key) => {
    if (afterMap.has(key)) return;
    removed += 1;
    firstChanged ||= beforeEntry?.item?.name || beforeEntry?.item?.id || key;
  });

  return { added, removed, changed, firstChanged };
}

function summarizeEntity(labelSingular, labelPlural, result) {
  const total = result.added + result.removed + result.changed;
  if (!total) return '';

  if (total === 1) {
    if (result.added) return `${labelSingular} hinzugefügt${result.firstChanged ? `: ${result.firstChanged}` : ''}`;
    if (result.removed) return `${labelSingular} entfernt${result.firstChanged ? `: ${result.firstChanged}` : ''}`;
    return `${labelSingular} geändert${result.firstChanged ? `: ${result.firstChanged}` : ''}`;
  }

  const parts = [];
  if (result.added) parts.push(`${result.added} neu`);
  if (result.changed) parts.push(`${result.changed} geändert`);
  if (result.removed) parts.push(`${result.removed} entfernt`);
  return `${labelPlural}: ${parts.join(', ')}`;
}

function describeChange(before = {}, after = {}) {
  const labels = [];
  const beforeSystems = getSystemMaps(before);
  const afterSystems = getSystemMaps(after);

  const projectFields = ['name', 'projectNumber', 'objectName', 'company', 'author', 'description'];
  if (projectFields.some(field => JSON.stringify(before?.[field]) !== JSON.stringify(after?.[field]))) {
    labels.push('Projektangaben geändert');
  }

  const systemsResult = compareEntityMaps(
    new Map([...beforeSystems.byId].map(([key, system]) => [key, { item: { ...system, sections: undefined, formParts: undefined, specialComponents: undefined } }])),
    new Map([...afterSystems.byId].map(([key, system]) => [key, { item: { ...system, sections: undefined, formParts: undefined, specialComponents: undefined } }])),
  );

  const sectionResult = compareEntityMaps(getEntityMap(before, 'sections'), getEntityMap(after, 'sections'));
  const formPartResult = compareEntityMaps(getEntityMap(before, 'formParts'), getEntityMap(after, 'formParts'));
  const specialResult = compareEntityMaps(getEntityMap(before, 'specialComponents'), getEntityMap(after, 'specialComponents'));

  [
    summarizeEntity('Anlage', 'Anlagen', systemsResult),
    summarizeEntity('Teilstrecke', 'Teilstrecken', sectionResult),
    summarizeEntity('Formteil', 'Formteile', formPartResult),
    summarizeEntity('Sonderbauteil', 'Sonderbauteile', specialResult),
  ].filter(Boolean).forEach(label => labels.push(label));

  if (!labels.length) {
    const beforeCount = countCollection(before, 'sections') + countCollection(before, 'formParts') + countCollection(before, 'specialComponents');
    const afterCount = countCollection(after, 'sections') + countCollection(after, 'formParts') + countCollection(after, 'specialComponents');
    labels.push(beforeCount !== afterCount ? 'Projektstruktur geändert' : 'Projektstand geändert');
  }

  return labels.slice(0, 2).join(' · ') + (labels.length > 2 ? ' · …' : '');
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default class ProjectHistoryEngine {
  constructor(state, options = {}) {
    if (!state) throw new Error('ProjectHistoryEngine benötigt einen ApplicationState.');

    this.state = state;
    this.limit = Math.max(5, Number(options.limit || DEFAULT_LIMIT));
    this.debounceMs = Math.max(80, Number(options.debounceMs || DEFAULT_DEBOUNCE_MS));
    this.entries = [];
    this.pointer = -1;
    this.timer = null;
    this.unsubscribe = null;
    this.isApplying = false;
    this.sequence = 0;
  }

  install() {
    if (this.unsubscribe) return this;

    this.reset(this.state.project, {
      label: 'Sitzung gestartet',
      selection: createSelectionSnapshot(this.state),
    });

    this.unsubscribe = this.state.subscribe(() => this.scheduleCapture());
    return this;
  }

  uninstall() {
    this.flush();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  reset(project = this.state.project, options = {}) {
    if (this.isApplying || !project) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;

    const snapshot = createSnapshot(project);
    this.sequence += 1;
    this.entries = [{
      id: `history-${Date.now()}-${this.sequence}`,
      createdAt: new Date().toISOString(),
      label: options.label || 'Projektstand geladen',
      snapshot,
      hash: stableHash(snapshot),
      selection: options.selection || createSelectionSnapshot(this.state),
      checkpoint: true,
    }];
    this.pointer = 0;
    this.emitChange();
  }

  scheduleCapture() {
    if (this.isApplying || !this.state.project) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.capture(), this.debounceMs);
  }

  flush() {
    if (!this.timer) return false;
    clearTimeout(this.timer);
    this.timer = null;
    return this.capture();
  }

  capture(options = {}) {
    if (this.isApplying || !this.state.project) return false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const snapshot = createSnapshot(this.state.project);
    const hash = stableHash(snapshot);
    const current = this.entries[this.pointer];

    if (current?.hash === hash && !options.force) return false;

    const label = options.label || describeChange(current?.snapshot || {}, snapshot);

    if (this.pointer < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.pointer + 1);
    }

    this.sequence += 1;
    this.entries.push({
      id: `history-${Date.now()}-${this.sequence}`,
      createdAt: new Date().toISOString(),
      label,
      snapshot,
      hash,
      selection: createSelectionSnapshot(this.state),
      checkpoint: Boolean(options.checkpoint),
    });

    if (this.entries.length > this.limit) {
      const overflow = this.entries.length - this.limit;
      this.entries.splice(0, overflow);
      this.pointer = Math.max(0, this.pointer - overflow);
    }

    this.pointer = this.entries.length - 1;
    this.emitChange();
    return true;
  }

  createCheckpoint(label = 'Manueller Wiederherstellungspunkt') {
    this.flush();
    const current = this.entries[this.pointer];
    if (!current) return null;
    current.checkpoint = true;
    current.label = String(label || 'Manueller Wiederherstellungspunkt').trim() || 'Manueller Wiederherstellungspunkt';
    current.createdAt = new Date().toISOString();
    this.emitChange();
    return current;
  }

  canUndo() {
    this.flush();
    return this.pointer > 0;
  }

  canRedo() {
    this.flush();
    return this.pointer >= 0 && this.pointer < this.entries.length - 1;
  }

  undo() {
    this.flush();
    if (this.pointer <= 0) return false;
    return this.restoreTo(this.pointer - 1, { direction: 'undo' });
  }

  redo() {
    this.flush();
    if (this.pointer < 0 || this.pointer >= this.entries.length - 1) return false;
    return this.restoreTo(this.pointer + 1, { direction: 'redo' });
  }

  restoreTo(index, options = {}) {
    this.flush();
    const targetIndex = Number(index);
    const entry = this.entries[targetIndex];
    if (!entry || targetIndex < 0 || targetIndex >= this.entries.length) return false;
    if (targetIndex === this.pointer) return true;

    this.isApplying = true;
    try {
      const project = deepClone(entry.snapshot);
      this.state.setProject(project);
      this.restoreSelection(entry.selection);

      try {
        const result = ProjectCalculationService.calculate(project, this.state.selectedSystem?.id || project.systems?.[0]?.id || null);
        project.calculationResult = result;
        this.state.lastCalculationAt = result.timestamp;
        this.state.isCalculationDirty = false;
        this.state.lastAutoCalculationError = null;
      } catch (error) {
        this.state.isCalculationDirty = true;
        this.state.lastAutoCalculationError = error?.message || String(error);
      }

      this.state.isProjectDirty = true;
      this.pointer = targetIndex;
      this.state.notify();
      this.emitChange({ direction: options.direction || 'restore', entry });
      return true;
    } finally {
      this.isApplying = false;
    }
  }

  restoreSelection(selection = {}) {
    const project = this.state.project;
    const systems = project?.systems || [];
    const system = systems.find(item => item?.id === selection.systemId)
      || systems.find(item => (item?.sections || []).some(section => section?.id === selection.sectionId))
      || systems.find(item => (item?.formParts || []).some(part => part?.id === selection.formPartId))
      || systems.find(item => (item?.specialComponents || []).some(component => component?.id === selection.specialComponentId))
      || systems[0]
      || null;

    this.state.selectedSystem = system;
    const section = system?.sections?.find(item => item?.id === selection.sectionId) || null;
    const formPart = system?.formParts?.find(item => item?.id === selection.formPartId) || null;
    const specialComponent = system?.specialComponents?.find(item => item?.id === selection.specialComponentId) || null;

    if (section) return this.state.selectSection(section);
    if (formPart) return this.state.selectFormPart(formPart);
    if (specialComponent) return this.state.selectSpecialComponent(specialComponent);
    if (system) return this.state.selectSystem(system);
    this.state.setSelection('project', project);
  }

  clear() {
    const current = this.entries[this.pointer];
    if (!current) return;
    this.entries = [{ ...current, label: 'Verlauf zurückgesetzt', checkpoint: true, createdAt: new Date().toISOString() }];
    this.pointer = 0;
    this.emitChange();
  }

  getState() {
    return {
      entries: this.entries.map((entry, index) => ({
        id: entry.id,
        index,
        label: entry.label,
        createdAt: entry.createdAt,
        timeLabel: formatTime(entry.createdAt),
        checkpoint: Boolean(entry.checkpoint),
        isCurrent: index === this.pointer,
        isFuture: index > this.pointer,
      })),
      pointer: this.pointer,
      count: this.entries.length,
      undoCount: Math.max(0, this.pointer),
      redoCount: Math.max(0, this.entries.length - this.pointer - 1),
      canUndo: this.pointer > 0,
      canRedo: this.pointer >= 0 && this.pointer < this.entries.length - 1,
      limit: this.limit,
      current: this.entries[this.pointer] ? {
        id: this.entries[this.pointer].id,
        label: this.entries[this.pointer].label,
        createdAt: this.entries[this.pointer].createdAt,
      } : null,
    };
  }

  createCsv() {
    this.flush();
    const state = this.getState();
    const rows = [
      ['Index', 'Status', 'Zeitpunkt', 'Bezeichnung', 'Wiederherstellungspunkt'],
      ...state.entries.map(entry => [
        entry.index + 1,
        entry.isCurrent ? 'Aktuell' : entry.isFuture ? 'Wiederholen' : 'Rückgängig',
        entry.createdAt,
        entry.label,
        entry.checkpoint ? 'Ja' : 'Nein',
      ]),
    ];
    return rows.map(row => row.map(csvEscape).join(';')).join('\r\n');
  }

  downloadCsv(project = this.state.project) {
    if (typeof document === 'undefined') return null;
    const safeProject = String(project?.projectNumber || project?.name || 'Druckverlust-Pro')
      .replace(/[^a-z0-9äöüß_-]+/gi, '_')
      .replace(/^_+|_+$/g, '') || 'Druckverlust-Pro';
    const filename = `${safeProject}_Aenderungsverlauf.csv`;
    const blob = new Blob([`\ufeff${this.createCsv()}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  }

  emitChange(detail = {}) {
    if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
    window.dispatchEvent(new CustomEvent('druckverlust:history-change', {
      detail: { ...this.getStateWithoutFlush(), ...detail },
    }));
  }

  getStateWithoutFlush() {
    return {
      pointer: this.pointer,
      count: this.entries.length,
      undoCount: Math.max(0, this.pointer),
      redoCount: Math.max(0, this.entries.length - this.pointer - 1),
      canUndo: this.pointer > 0,
      canRedo: this.pointer >= 0 && this.pointer < this.entries.length - 1,
    };
  }
}

export {
  createSnapshot,
  describeChange,
  stableHash,
};
