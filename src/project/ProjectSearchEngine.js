// Druckverlust Pro – Phase 38.00
// Globale Projektsuche, Projektindex, Querverweise und Sprungmarken.

import ProjectTaskCenterEngine from './ProjectTaskCenterEngine.js?v=38.00&release=46.00';

const MAX_RECENT_QUERIES = 8;
const MAX_PINS = 24;
const VALID_CATEGORIES = ['project', 'system', 'section', 'formPart', 'specialComponent', 'task', 'revision', 'variant'];

function text(value = '') {
  return String(value ?? '').trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalize(value = '') {
  return text(value)
    .toLocaleLowerCase('de-CH')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9äöüß]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value = '') {
  return [...new Set(normalize(value).split(' ').filter(Boolean))];
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(number(value));
}

function formatDimension(section = {}) {
  if (section.type === 'pipe' || number(section.d) > 0) {
    return number(section.d) > 0 ? `Ø ${formatNumber(number(section.d) * 1000, 0)} mm` : 'Rundrohr';
  }
  if (number(section.b) > 0 && number(section.h) > 0) {
    return `${formatNumber(number(section.b) * 1000, 0)} × ${formatNumber(number(section.h) * 1000, 0)} mm`;
  }
  return 'Rechteckkanal';
}

function sectionResult(section = {}) {
  return section.calculation || section.result || section.calculationResult || {};
}

function componentPressureLoss(component = {}) {
  return number(component.pressureLoss ?? component.pa ?? component.dp ?? component.unitPressureLoss, 0);
}

function formPartPressureLoss(part = {}) {
  return number(part.pressureLoss ?? part.dp ?? part.deltaP ?? part.result?.pressureLoss, 0);
}

function safeToken(value = 'Projekt') {
  return text(value || 'Projekt')
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

function createDocument(input = {}) {
  const title = text(input.title) || 'Eintrag';
  const subtitle = text(input.subtitle);
  const meta = text(input.meta);
  const keywords = Array.isArray(input.keywords) ? input.keywords.map(text).filter(Boolean) : [];
  const searchable = normalize([title, subtitle, meta, ...keywords].join(' '));
  return {
    id: text(input.id),
    category: VALID_CATEGORIES.includes(input.category) ? input.category : 'project',
    typeLabel: text(input.typeLabel) || 'Projekt',
    title,
    subtitle,
    meta,
    keywords,
    searchable,
    systemId: input.systemId || null,
    sectionId: input.sectionId || null,
    targetId: input.targetId || null,
    targetType: text(input.targetType) || input.category || 'project',
    relations: input.relations || { sections: 0, formParts: 0, specialComponents: 0, tasks: 0 },
    sortOrder: number(input.sortOrder, 0),
    raw: input.raw || null,
  };
}

function categoryLabel(category = '') {
  return ({
    project: 'Projekt',
    system: 'Anlage',
    section: 'Teilstrecke',
    formPart: 'Formteil',
    specialComponent: 'Sonderbauteil',
    task: 'Aufgabe',
    revision: 'Revision',
    variant: 'Variante',
  })[category] || category;
}

function scoreDocument(documentItem, queryTokens, normalizedQuery) {
  if (!queryTokens.length) return Math.max(1, 1000 - documentItem.sortOrder);
  const title = normalize(documentItem.title);
  const subtitle = normalize(documentItem.subtitle);
  const meta = normalize(documentItem.meta);
  let score = 0;
  if (title === normalizedQuery) score += 120;
  if (title.startsWith(normalizedQuery)) score += 80;
  if (title.includes(normalizedQuery)) score += 55;
  if (documentItem.searchable.includes(normalizedQuery)) score += 30;
  for (const token of queryTokens) {
    if (!documentItem.searchable.includes(token)) return 0;
    if (title === token) score += 36;
    else if (title.startsWith(token)) score += 25;
    else if (title.includes(token)) score += 18;
    else if (subtitle.includes(token)) score += 10;
    else if (meta.includes(token)) score += 6;
    else score += 3;
  }
  const categoryBoost = ({ section: 9, system: 8, formPart: 7, specialComponent: 7, task: 5, project: 4, revision: 3, variant: 3 })[documentItem.category] || 0;
  return score + categoryBoost;
}

export class ProjectSearchEngine {
  static ensureSearchCenter(project = {}) {
    if (!project.workflow || typeof project.workflow !== 'object' || Array.isArray(project.workflow)) project.workflow = {};
    if (!project.workflow.projectSearch || typeof project.workflow.projectSearch !== 'object' || Array.isArray(project.workflow.projectSearch)) {
      project.workflow.projectSearch = {};
    }
    const center = project.workflow.projectSearch;
    if (!Array.isArray(center.recentQueries)) center.recentQueries = [];
    if (!Array.isArray(center.pins)) center.pins = [];
    center.recentQueries = center.recentQueries.map(text).filter(Boolean).slice(0, MAX_RECENT_QUERIES);
    center.pins = center.pins
      .filter(item => item && text(item.id))
      .map(item => ({ id: text(item.id), title: text(item.title), category: text(item.category), addedAt: item.addedAt || new Date().toISOString() }))
      .slice(0, MAX_PINS);
    return center;
  }

  static buildIndex(project = {}) {
    const documents = [];
    const systems = Array.isArray(project.systems) ? project.systems : [];
    let sortOrder = 0;

    documents.push(createDocument({
      id: `project:${project.id || 'project'}`,
      category: 'project',
      typeLabel: 'Projekt',
      title: project.name || project.meta?.name || 'Projekt',
      subtitle: project.object || project.meta?.object || 'Projektübersicht',
      meta: [project.author, project.company, project.address, project.report?.reportNumber, project.report?.revision].filter(Boolean).join(' · '),
      keywords: [project.note, project.meta?.note, project.report?.hinweis, 'projekt start übersicht'],
      targetType: 'project',
      relations: {
        sections: systems.reduce((sum, system) => sum + (system.sections?.length || 0), 0),
        formParts: systems.reduce((sum, system) => sum + (system.formParts?.length || 0), 0),
        specialComponents: systems.reduce((sum, system) => sum + (system.specialComponents?.length || 0), 0),
        tasks: 0,
      },
      sortOrder: sortOrder++,
      raw: project,
    }));

    const taskModel = ProjectTaskCenterEngine.analyze(project);
    const tasksBySystem = new Map();
    const tasksBySection = new Map();
    for (const task of taskModel.tasks || []) {
      if (task.systemId) tasksBySystem.set(task.systemId, (tasksBySystem.get(task.systemId) || 0) + 1);
      if (task.sectionId) tasksBySection.set(task.sectionId, (tasksBySection.get(task.sectionId) || 0) + 1);
    }
    documents[0].relations.tasks = taskModel.tasks?.length || 0;

    systems.forEach((system, systemIndex) => {
      const sections = Array.isArray(system.sections) ? system.sections : [];
      const formParts = Array.isArray(system.formParts) ? system.formParts : [];
      const specials = Array.isArray(system.specialComponents) ? system.specialComponents : [];
      const bkp = system.anlageNumber || system.bkpNumber || system.number || '';
      documents.push(createDocument({
        id: `system:${system.id}`,
        category: 'system',
        typeLabel: 'Anlage',
        title: system.name || `Anlage ${systemIndex + 1}`,
        subtitle: [bkp && `BKP ${bkp}`, system.type || system.airType].filter(Boolean).join(' · '),
        meta: `${sections.length} Teilstrecken · ${formParts.length} Formteile · ${specials.length} Sonderbauteile`,
        keywords: [system.description, system.note, system.type, bkp, 'anlage system luftart'],
        systemId: system.id,
        targetId: system.id,
        targetType: 'system',
        relations: { sections: sections.length, formParts: formParts.length, specialComponents: specials.length, tasks: tasksBySystem.get(system.id) || 0 },
        sortOrder: sortOrder++,
        raw: system,
      }));

      const sectionName = new Map(sections.map(section => [section.id, section.name || section.id]));
      sections.forEach((section, sectionIndex) => {
        const result = sectionResult(section);
        const relatedFormParts = formParts.filter(item => item.sectionId === section.id).length;
        const relatedSpecials = specials.filter(item => item.sectionId === section.id).length;
        const q = number(section.q ?? section.volumeFlow, 0);
        const length = number(section.l ?? section.length, 0);
        const pressureLoss = number(result.totalPressureLoss ?? result.pressureLoss ?? section.totalPressureLoss ?? section.dp, 0);
        const velocity = number(result.velocity ?? section.velocity, 0);
        documents.push(createDocument({
          id: `section:${system.id}:${section.id}`,
          category: 'section',
          typeLabel: 'Teilstrecke',
          title: section.name || `Teilstrecke ${sectionIndex + 1}`,
          subtitle: `${system.name || 'Anlage'} · ${formatDimension(section)}`,
          meta: `${formatNumber(q, 0)} m³/h · ${formatNumber(length, 2)} m${velocity ? ` · ${formatNumber(velocity, 2)} m/s` : ''}${pressureLoss ? ` · ${formatNumber(pressureLoss, 1)} Pa` : ''}`,
          keywords: [section.description, section.type, formatDimension(section), q, length, velocity, pressureLoss, 'teilstrecke kanal rohr'],
          systemId: system.id,
          sectionId: section.id,
          targetId: section.id,
          targetType: 'section',
          relations: { sections: 0, formParts: relatedFormParts, specialComponents: relatedSpecials, tasks: tasksBySection.get(section.id) || 0 },
          sortOrder: sortOrder++,
          raw: section,
        }));
      });

      formParts.forEach((part, partIndex) => {
        documents.push(createDocument({
          id: `formPart:${system.id}:${part.id}`,
          category: 'formPart',
          typeLabel: 'Formteil',
          title: part.name || `Formteil ${partIndex + 1}`,
          subtitle: `${system.name || 'Anlage'}${part.sectionId ? ` · ${sectionName.get(part.sectionId) || part.sectionId}` : ' · ohne Zuordnung'}`,
          meta: [part.type, Number.isFinite(Number(part.zeta)) ? `ζ ${formatNumber(part.zeta, 3)}` : '', formPartPressureLoss(part) ? `${formatNumber(formPartPressureLoss(part), 1)} Pa` : ''].filter(Boolean).join(' · '),
          keywords: [part.description, part.category, part.type, part.zeta, formPartPressureLoss(part), 'formteil zeta'],
          systemId: system.id,
          sectionId: part.sectionId || null,
          targetId: part.id,
          targetType: 'formPart',
          relations: { sections: part.sectionId ? 1 : 0, formParts: 0, specialComponents: 0, tasks: 0 },
          sortOrder: sortOrder++,
          raw: part,
        }));
      });

      specials.forEach((component, componentIndex) => {
        documents.push(createDocument({
          id: `specialComponent:${system.id}:${component.id}`,
          category: 'specialComponent',
          typeLabel: 'Sonderbauteil',
          title: component.name || `Sonderbauteil ${componentIndex + 1}`,
          subtitle: `${system.name || 'Anlage'}${component.sectionId ? ` · ${sectionName.get(component.sectionId) || component.sectionId}` : ' · ohne Zuordnung'}`,
          meta: [component.type || component.category, `${formatNumber(componentPressureLoss(component), 1)} Pa`, number(component.quantity, 1) > 1 ? `${formatNumber(component.quantity, 0)} Stück` : ''].filter(Boolean).join(' · '),
          keywords: [component.description, component.category, component.type, component.manufacturer, componentPressureLoss(component), 'sonderbauteil druckverlust'],
          systemId: system.id,
          sectionId: component.sectionId || null,
          targetId: component.id,
          targetType: 'specialComponent',
          relations: { sections: component.sectionId ? 1 : 0, formParts: 0, specialComponents: 0, tasks: 0 },
          sortOrder: sortOrder++,
          raw: component,
        }));
      });
    });

    (taskModel.tasks || []).forEach((task, index) => {
      documents.push(createDocument({
        id: `task:${task.id}`,
        category: 'task',
        typeLabel: 'Aufgabe',
        title: task.title || `Aufgabe ${index + 1}`,
        subtitle: [task.systemName, task.sectionName].filter(Boolean).join(' · ') || 'Projektaufgabe',
        meta: [task.priority, task.status, task.actor, task.dueDate].filter(Boolean).join(' · '),
        keywords: [task.description, task.recommendation, task.code, task.source, 'aufgabe qs offen erledigt'],
        systemId: task.systemId || null,
        sectionId: task.sectionId || null,
        targetId: task.id,
        targetType: 'task',
        relations: { sections: task.sectionId ? 1 : 0, formParts: 0, specialComponents: 0, tasks: 0 },
        sortOrder: sortOrder++,
        raw: task,
      }));
    });

    (Array.isArray(project.revisionSnapshots) ? project.revisionSnapshots : []).forEach((revision, index) => {
      const system = systems.find(item => item.id === revision.systemId);
      documents.push(createDocument({
        id: `revision:${revision.id || index}`,
        category: 'revision',
        typeLabel: 'Revision',
        title: `Revision ${revision.revision || index + 1}`,
        subtitle: system?.name || revision.systemName || 'Projektrevision',
        meta: [revision.author, revision.createdAt || revision.date, revision.note || revision.description].filter(Boolean).join(' · '),
        keywords: [revision.changeDescription, revision.note, revision.author, revision.revision, 'revision snapshot stand'],
        systemId: revision.systemId || null,
        targetId: revision.id || null,
        targetType: 'revision',
        sortOrder: sortOrder++,
        raw: revision,
      }));
    });

    (Array.isArray(project.simulationVariants) ? project.simulationVariants : []).forEach((variant, index) => {
      const system = systems.find(item => item.id === variant.systemId);
      documents.push(createDocument({
        id: `variant:${variant.id || index}`,
        category: 'variant',
        typeLabel: 'Variante',
        title: variant.name || `Variante ${index + 1}`,
        subtitle: system?.name || variant.systemName || 'Simulationsvariante',
        meta: [variant.author, variant.createdAt, variant.note].filter(Boolean).join(' · '),
        keywords: [variant.note, variant.author, variant.scope, variant.airflowPercent, variant.dimensionPercent, 'variante simulation vergleich'],
        systemId: variant.systemId || null,
        targetId: variant.id || null,
        targetType: 'variant',
        sortOrder: sortOrder++,
        raw: variant,
      }));
    });

    return documents;
  }

  static search(project = {}, query = '', options = {}) {
    const index = options.index || this.buildIndex(project);
    const normalizedQuery = normalize(query);
    const queryTokens = tokens(query);
    const category = VALID_CATEGORIES.includes(options.category) ? options.category : 'all';
    const systemId = text(options.systemId) || 'all';
    const limit = Math.max(1, Math.min(500, number(options.limit, 120)));
    const filtered = index.filter(item => {
      if (category !== 'all' && item.category !== category) return false;
      if (systemId !== 'all' && item.systemId !== systemId) return false;
      return true;
    });
    const scored = filtered
      .map(item => ({ item, score: scoreDocument(item, queryTokens, normalizedQuery) }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.sortOrder - b.item.sortOrder)
      .slice(0, limit)
      .map(entry => ({ ...entry.item, score: entry.score }));
    const categoryCounts = index.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    return {
      query: text(query),
      normalizedQuery,
      totalIndexed: index.length,
      totalMatches: scored.length,
      results: scored,
      categoryCounts,
      index,
      generatedAt: new Date().toISOString(),
    };
  }

  static recordQuery(project = {}, query = '') {
    const value = text(query);
    if (!value) return this.ensureSearchCenter(project).recentQueries;
    const center = this.ensureSearchCenter(project);
    center.recentQueries = [value, ...center.recentQueries.filter(item => normalize(item) !== normalize(value))].slice(0, MAX_RECENT_QUERIES);
    return center.recentQueries;
  }

  static clearRecentQueries(project = {}) {
    const center = this.ensureSearchCenter(project);
    center.recentQueries = [];
    return center.recentQueries;
  }

  static getRecentQueries(project = {}) {
    return [...this.ensureSearchCenter(project).recentQueries];
  }

  static togglePin(project = {}, documentItem = {}) {
    const center = this.ensureSearchCenter(project);
    const id = text(documentItem.id);
    if (!id) throw new Error('Der Eintrag besitzt keine gültige Such-ID.');
    const existing = center.pins.find(item => item.id === id);
    if (existing) {
      center.pins = center.pins.filter(item => item.id !== id);
      return { pinned: false, pins: clone(center.pins) };
    }
    center.pins = [{
      id,
      title: text(documentItem.title) || id,
      category: text(documentItem.category),
      addedAt: new Date().toISOString(),
    }, ...center.pins].slice(0, MAX_PINS);
    return { pinned: true, pins: clone(center.pins) };
  }

  static getPins(project = {}, index = null) {
    const center = this.ensureSearchCenter(project);
    const documents = index || this.buildIndex(project);
    const byId = new Map(documents.map(item => [item.id, item]));
    const validPins = center.pins.filter(pin => byId.has(pin.id));
    if (validPins.length !== center.pins.length) center.pins = validPins;
    return validPins.map(pin => ({ ...pin, document: byId.get(pin.id) }));
  }

  static isPinned(project = {}, id = '') {
    return this.ensureSearchCenter(project).pins.some(item => item.id === id);
  }

  static createIndexCsv(project = {}) {
    const index = this.buildIndex(project);
    const rows = [
      ['Kategorie', 'Typ', 'Bezeichnung', 'Anlage', 'Teilstrecke', 'Untertitel', 'Kennwerte', 'Such-ID'],
      ...index.map(item => [
        categoryLabel(item.category),
        item.typeLabel,
        item.title,
        item.systemId || '',
        item.sectionId || '',
        item.subtitle,
        item.meta,
        item.id,
      ]),
    ];
    return rows.map(row => row.map(csvValue).join(';')).join('\r\n');
  }

  static downloadIndexCsv(project = {}) {
    const projectToken = safeToken(project.name || project.meta?.name || 'Projekt');
    return downloadText(this.createIndexCsv(project), `${projectToken}_Projektindex.csv`);
  }

  static categoryLabel(category = '') {
    return categoryLabel(category);
  }
}

export default ProjectSearchEngine;
