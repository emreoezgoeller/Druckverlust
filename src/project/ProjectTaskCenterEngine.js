// Druckverlust Pro – Phase 37.00
// Projekt-Navigator, Aufgabenliste, Favoriten und Schnellzugriffe.

import ProjectPortfolioQualityEngine from './ProjectPortfolioQualityEngine.js?v=58.00';

const MAX_MANUAL_TASKS = 120;
const MAX_FAVORITES = 16;
const VALID_PRIORITIES = ['critical', 'high', 'normal', 'low'];
const VALID_STATUSES = ['open', 'inProgress', 'done'];

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function text(value = '') {
  return String(value ?? '').trim();
}

function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePriority(value = 'normal') {
  return VALID_PRIORITIES.includes(value) ? value : 'normal';
}

function normalizeStatus(value = 'open') {
  return VALID_STATUSES.includes(value) ? value : 'open';
}

function normalizeDate(value = '') {
  const source = text(value);
  if (!source) return '';
  const date = new Date(`${source}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : source.slice(0, 10);
}

function safeToken(value = 'Projekt') {
  return String(value || 'Projekt')
    .replace(/[^\wäöüÄÖÜß-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Projekt';
}

function csvValue(value = '') {
  const source = String(value ?? '');
  return /[;"\n\r]/.test(source) ? `"${source.replaceAll('"', '""')}"` : source;
}

function downloadText(content, fileName, type = 'text/csv;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return { content, fileName, type };
  }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
  return { content, fileName, type };
}

function severityToPriority(severity = 'info') {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'high';
  return 'normal';
}

function statusRank(status = 'open') {
  return ({ open: 0, inProgress: 1, done: 2 })[status] ?? 9;
}

function priorityRank(priority = 'normal') {
  return ({ critical: 0, high: 1, normal: 2, low: 3 })[priority] ?? 9;
}

function dueRank(task = {}) {
  if (!task.dueDate || task.status === 'done') return Number.MAX_SAFE_INTEGER;
  const date = new Date(`${task.dueDate}T12:00:00`).getTime();
  return Number.isNaN(date) ? Number.MAX_SAFE_INTEGER : date;
}

function systemById(project = {}, id = '') {
  return (project.systems || []).find(item => String(item.id) === String(id)) || null;
}

function sectionById(system = {}, id = '') {
  return (system?.sections || []).find(item => String(item.id) === String(id)) || null;
}

function normalizeTask(task = {}) {
  return {
    id: text(task.id) || createId('task'),
    source: task.source === 'generated' ? 'generated' : 'manual',
    title: text(task.title) || 'Aufgabe',
    description: text(task.description),
    recommendation: text(task.recommendation),
    priority: normalizePriority(task.priority),
    status: normalizeStatus(task.status),
    dueDate: normalizeDate(task.dueDate),
    actor: text(task.actor),
    systemId: task.systemId || null,
    systemName: text(task.systemName),
    sectionId: task.sectionId || null,
    sectionName: text(task.sectionName),
    code: text(task.code),
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
  };
}

function favoriteKey(favorite = {}) {
  return [favorite.type, favorite.viewType, favorite.systemId, favorite.sectionId]
    .map(value => String(value || ''))
    .join(':');
}

function normalizeFavorite(favorite = {}) {
  const type = ['view', 'system', 'section'].includes(favorite.type) ? favorite.type : 'view';
  return {
    id: text(favorite.id) || createId('favorite'),
    type,
    label: text(favorite.label) || 'Favorit',
    meta: text(favorite.meta),
    viewType: text(favorite.viewType),
    systemId: favorite.systemId || null,
    sectionId: favorite.sectionId || null,
    createdAt: favorite.createdAt || new Date().toISOString(),
  };
}

export class ProjectTaskCenterEngine {
  static ensureTaskCenter(project = {}) {
    if (!project.workflow || typeof project.workflow !== 'object' || Array.isArray(project.workflow)) project.workflow = {};
    if (!project.workflow.taskCenter || typeof project.workflow.taskCenter !== 'object' || Array.isArray(project.workflow.taskCenter)) {
      project.workflow.taskCenter = {};
    }
    const center = project.workflow.taskCenter;
    if (!Array.isArray(center.manualTasks)) center.manualTasks = [];
    if (!Array.isArray(center.favorites)) center.favorites = [];
    if (!center.generatedStates || typeof center.generatedStates !== 'object' || Array.isArray(center.generatedStates)) center.generatedStates = {};
    center.manualTasks = center.manualTasks.map(normalizeTask).slice(0, MAX_MANUAL_TASKS);
    center.favorites = center.favorites.map(normalizeFavorite).slice(0, MAX_FAVORITES);
    return center;
  }

  static createGeneratedTasks(project = {}, analysis = null) {
    const center = project?.workflow?.taskCenter && typeof project.workflow.taskCenter === 'object'
      ? project.workflow.taskCenter
      : { generatedStates: {} };
    const states = center.generatedStates || {};
    const cockpit = analysis || ProjectPortfolioQualityEngine.analyze(project);
    return (cockpit.findings || []).map(finding => {
      const id = `generated:${finding.id}`;
      const state = states[id] || {};
      const system = systemById(project, finding.systemId);
      const section = sectionById(system, finding.sectionId);
      return normalizeTask({
        id,
        source: 'generated',
        title: finding.title,
        description: finding.message,
        recommendation: finding.recommendation,
        priority: severityToPriority(finding.severity),
        status: state.status || 'open',
        actor: state.actor || '',
        systemId: finding.systemId,
        systemName: finding.systemName || system?.name || '',
        sectionId: finding.sectionId,
        sectionName: section?.name || '',
        code: finding.code,
        createdAt: state.createdAt || cockpit.generatedAt || new Date().toISOString(),
        updatedAt: state.updatedAt || cockpit.generatedAt || new Date().toISOString(),
      });
    });
  }

  static analyze(project = {}, options = {}) {
    const center = project?.workflow?.taskCenter && typeof project.workflow.taskCenter === 'object'
      ? project.workflow.taskCenter
      : { manualTasks: [], favorites: [], generatedStates: {} };
    const cockpit = options.cockpit || ProjectPortfolioQualityEngine.analyze(project, {
      selectedSystemId: options.selectedSystemId || null,
    });
    const manualTasks = (center.manualTasks || []).map(normalizeTask);
    const generatedTasks = this.createGeneratedTasks(project, cockpit);
    const tasks = [...generatedTasks, ...manualTasks].sort((a, b) => {
      const status = statusRank(a.status) - statusRank(b.status);
      if (status) return status;
      const priority = priorityRank(a.priority) - priorityRank(b.priority);
      if (priority) return priority;
      const due = dueRank(a) - dueRank(b);
      if (due) return due;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      const due = new Date(`${task.dueDate}T00:00:00`);
      return !Number.isNaN(due.getTime()) && due < today;
    }).length;
    const counts = tasks.reduce((acc, task) => {
      acc.total += 1;
      acc[task.status] = (acc[task.status] || 0) + 1;
      if (task.status !== 'done') acc[task.priority] = (acc[task.priority] || 0) + 1;
      acc[task.source] = (acc[task.source] || 0) + 1;
      return acc;
    }, { total: 0, open: 0, inProgress: 0, done: 0, critical: 0, high: 0, normal: 0, low: 0, generated: 0, manual: 0 });
    counts.overdue = overdue;
    const openCount = counts.open + counts.inProgress;
    const score = Math.max(0, Math.min(100, 100 - counts.critical * 14 - counts.high * 6 - overdue * 4 - Math.max(0, openCount - 12)));
    return {
      score,
      status: counts.critical ? 'critical' : counts.high || overdue ? 'warning' : openCount ? 'info' : 'ok',
      counts,
      tasks,
      openTasks: tasks.filter(task => task.status !== 'done'),
      completedTasks: tasks.filter(task => task.status === 'done'),
      favorites: (center.favorites || []).map(normalizeFavorite),
      cockpit,
      generatedAt: new Date().toISOString(),
      disclaimer: 'Die Aufgabenliste verbindet automatische Plausibilitätsfeststellungen mit manuellen Projektaufgaben. Sie ersetzt keine fachliche Freigabe oder Terminplanung.',
    };
  }

  static addManualTask(project = {}, input = {}) {
    const center = this.ensureTaskCenter(project);
    const title = text(input.title);
    if (!title) throw new Error('Bitte eine Aufgabenbezeichnung eingeben.');
    const system = systemById(project, input.systemId);
    const section = sectionById(system, input.sectionId);
    const task = normalizeTask({
      id: createId('task'),
      source: 'manual',
      title,
      description: input.description,
      priority: input.priority,
      status: input.status || 'open',
      dueDate: input.dueDate,
      actor: input.actor,
      systemId: system?.id || null,
      systemName: system?.name || '',
      sectionId: section?.id || null,
      sectionName: section?.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    center.manualTasks.unshift(task);
    center.manualTasks = center.manualTasks.slice(0, MAX_MANUAL_TASKS);
    center.updatedAt = new Date().toISOString();
    return clone(task);
  }

  static updateTask(project = {}, taskId = '', changes = {}) {
    const center = this.ensureTaskCenter(project);
    const id = String(taskId || '');
    if (id.startsWith('generated:')) {
      const existing = center.generatedStates[id] || { createdAt: new Date().toISOString() };
      center.generatedStates[id] = {
        ...existing,
        status: normalizeStatus(changes.status ?? existing.status),
        actor: text(changes.actor ?? existing.actor),
        updatedAt: new Date().toISOString(),
      };
      center.updatedAt = new Date().toISOString();
      return clone(center.generatedStates[id]);
    }
    const index = center.manualTasks.findIndex(task => String(task.id) === id);
    if (index < 0) throw new Error('Aufgabe wurde nicht gefunden.');
    const current = normalizeTask(center.manualTasks[index]);
    const system = changes.systemId !== undefined ? systemById(project, changes.systemId) : systemById(project, current.systemId);
    const section = changes.sectionId !== undefined ? sectionById(system, changes.sectionId) : sectionById(system, current.sectionId);
    const next = normalizeTask({
      ...current,
      ...changes,
      title: changes.title !== undefined ? text(changes.title) : current.title,
      systemId: system?.id || null,
      systemName: system?.name || '',
      sectionId: section?.id || null,
      sectionName: section?.name || '',
      updatedAt: new Date().toISOString(),
    });
    if (!next.title) throw new Error('Bitte eine Aufgabenbezeichnung eingeben.');
    center.manualTasks[index] = next;
    center.updatedAt = new Date().toISOString();
    return clone(next);
  }

  static deleteManualTask(project = {}, taskId = '') {
    const center = this.ensureTaskCenter(project);
    const before = center.manualTasks.length;
    center.manualTasks = center.manualTasks.filter(task => String(task.id) !== String(taskId));
    center.updatedAt = new Date().toISOString();
    return before !== center.manualTasks.length;
  }

  static clearCompletedManualTasks(project = {}) {
    const center = this.ensureTaskCenter(project);
    const before = center.manualTasks.length;
    center.manualTasks = center.manualTasks.filter(task => normalizeStatus(task.status) !== 'done');
    center.updatedAt = new Date().toISOString();
    return before - center.manualTasks.length;
  }

  static addFavorite(project = {}, input = {}) {
    const center = this.ensureTaskCenter(project);
    const favorite = normalizeFavorite(input);
    const key = favoriteKey(favorite);
    if (center.favorites.some(item => favoriteKey(item) === key)) return clone(center.favorites.find(item => favoriteKey(item) === key));
    center.favorites.unshift(favorite);
    center.favorites = center.favorites.slice(0, MAX_FAVORITES);
    center.updatedAt = new Date().toISOString();
    return clone(favorite);
  }

  static removeFavorite(project = {}, favoriteId = '') {
    const center = this.ensureTaskCenter(project);
    const before = center.favorites.length;
    center.favorites = center.favorites.filter(item => String(item.id) !== String(favoriteId));
    center.updatedAt = new Date().toISOString();
    return before !== center.favorites.length;
  }

  static createCsv(project = {}, analysis = null) {
    const model = analysis || this.analyze(project);
    const rows = [
      ['Druckverlust Pro', 'Projekt-Navigator und Aufgabenliste'],
      ['Projekt', project.name || project.meta?.name || ''],
      ['Erstellt', new Date().toLocaleString('de-CH')],
      ['Aufgaben gesamt', model.counts.total],
      ['Offen', model.counts.open],
      ['In Bearbeitung', model.counts.inProgress],
      ['Erledigt', model.counts.done],
      ['Überfällig', model.counts.overdue],
      [],
      ['Quelle', 'Priorität', 'Status', 'Fälligkeit', 'Anlage', 'Teilstrecke', 'Aufgabe', 'Beschreibung / Empfehlung', 'Bearbeiter', 'Code'],
      ...model.tasks.map(task => [
        task.source === 'generated' ? 'Automatisch' : 'Manuell',
        task.priority,
        task.status,
        task.dueDate,
        task.systemName,
        task.sectionName,
        task.title,
        task.recommendation || task.description,
        task.actor,
        task.code,
      ]),
      [],
      ['Favoriten'],
      ['Typ', 'Bezeichnung', 'Zusatz', 'Ansicht', 'Anlage', 'Teilstrecke'],
      ...model.favorites.map(item => [item.type, item.label, item.meta, item.viewType, item.systemId, item.sectionId]),
    ];
    return `\uFEFF${rows.map(row => row.map(csvValue).join(';')).join('\r\n')}`;
  }

  static createFileName(project = {}) {
    return `${safeToken(project.name || project.meta?.name || 'Projekt')}_Aufgaben_${new Date().toISOString().slice(0, 10)}.csv`;
  }

  static downloadCsv(project = {}, analysis = null) {
    return downloadText(this.createCsv(project, analysis), this.createFileName(project));
  }
}

export default ProjectTaskCenterEngine;
