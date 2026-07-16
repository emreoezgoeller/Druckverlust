// Druckverlust Pro – Phase 36.00
// Herstellerneutrale Projektvorlagen, Prüfprofile, Massenbearbeitung und Änderungsprotokoll.

const MAX_HISTORY = 60;

function number(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, step = 0) {
  const numeric = number(value);
  const resolvedStep = Math.max(0, number(step));
  if (!resolvedStep) return numeric;
  return Math.round(numeric / resolvedStep) * resolvedStep;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeType(value = '') {
  const text = String(value || '').trim().toLocaleLowerCase('de-CH');
  if (text.includes('zuluft')) return 'Zuluft';
  if (text.includes('abluft')) return 'Abluft';
  if (text.includes('aussen') || text.includes('außen')) return 'Aussenluft';
  if (text.includes('fortluft')) return 'Fortluft';
  if (text.includes('umluft')) return 'Umluft';
  return String(value || 'Lüftungsanlage').trim() || 'Lüftungsanlage';
}

function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stableStringify(value) {
  const seen = new WeakSet();
  const sortObject = item => {
    if (Array.isArray(item)) return item.map(sortObject);
    if (!item || typeof item !== 'object') return item;
    if (seen.has(item)) return null;
    seen.add(item);
    return Object.keys(item).sort().reduce((acc, key) => {
      if (['calculationResult', 'calculation', 'validation'].includes(key)) return acc;
      acc[key] = sortObject(item[key]);
      return acc;
    }, {});
  };
  return JSON.stringify(sortObject(value));
}

function simpleHash(text = '') {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function formatCsvValue(value = '') {
  const text = String(value ?? '');
  return /[;"\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function safeToken(value = 'Projekt') {
  return String(value || 'Projekt')
    .replace(/[^\wäöüÄÖÜß-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Projekt';
}

function downloadText(text, fileName, type = 'text/csv;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return { text, fileName, type };
  }
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
  return { text, fileName, type };
}

export const QUALITY_PROFILES = Object.freeze([
  {
    id: 'general',
    name: 'Allgemeine Planung',
    description: 'Ausgewogene neutrale Prüfwerte für typische Lüftungsnetze.',
    thresholds: {
      velocityWarning: 6,
      velocityCritical: 10,
      frictionWarning: 1.5,
      frictionCritical: 3,
      lossShareWarning: 0.35,
      lossShareCritical: 0.55,
      totalLossWarning: 1000,
    },
  },
  {
    id: 'comfort',
    name: 'Komfort / geräuschsensibel',
    description: 'Strengere Prüfwerte für Bereiche mit erhöhten akustischen Anforderungen.',
    thresholds: {
      velocityWarning: 4,
      velocityCritical: 7,
      frictionWarning: 1,
      frictionCritical: 2,
      lossShareWarning: 0.3,
      lossShareCritical: 0.48,
      totalLossWarning: 800,
    },
  },
  {
    id: 'technical',
    name: 'Technik / kurze Netze',
    description: 'Weiter gefasste Prüfwerte für kompakte technische Bereiche; fachlich projektspezifisch prüfen.',
    thresholds: {
      velocityWarning: 8,
      velocityCritical: 12,
      frictionWarning: 2.5,
      frictionCritical: 4,
      lossShareWarning: 0.4,
      lossShareCritical: 0.62,
      totalLossWarning: 1300,
    },
  },
]);

export const SYSTEM_TEMPLATES = Object.freeze([
  {
    id: 'supply-exhaust',
    name: 'Zuluft und Abluft',
    description: 'Ergänzt eine neutrale Zuluft- und Abluftanlage, sofern noch nicht vorhanden.',
    systems: [
      { name: 'Zuluftanlage', type: 'Zuluft', bkpNumber: '' },
      { name: 'Abluftanlage', type: 'Abluft', bkpNumber: '' },
    ],
  },
  {
    id: 'full-air-handling',
    name: 'ZUL / ABL / AUL / FOL',
    description: 'Ergänzt die vier üblichen Luftarten als leere, herstellerneutrale Anlagen.',
    systems: [
      { name: 'Zuluftanlage', type: 'Zuluft', bkpNumber: '' },
      { name: 'Abluftanlage', type: 'Abluft', bkpNumber: '' },
      { name: 'Aussenluftanlage', type: 'Aussenluft', bkpNumber: '' },
      { name: 'Fortluftanlage', type: 'Fortluft', bkpNumber: '' },
    ],
  },
  {
    id: 'circulation',
    name: 'Umluft ergänzen',
    description: 'Ergänzt eine neutrale Umluftanlage, sofern noch nicht vorhanden.',
    systems: [
      { name: 'Umluftanlage', type: 'Umluft', bkpNumber: '' },
    ],
  },
]);

export class ProjectStandardizationEngine {
  static ensureWorkflow(project = {}) {
    if (!project.workflow || typeof project.workflow !== 'object' || Array.isArray(project.workflow)) {
      project.workflow = {};
    }
    if (!project.workflow.qualityProfile || typeof project.workflow.qualityProfile !== 'object') {
      project.workflow.qualityProfile = { id: 'general', custom: null, updatedAt: null, updatedBy: '' };
    }
    if (!Array.isArray(project.workflow.changeHistory)) project.workflow.changeHistory = [];
    return project.workflow;
  }

  static getProfiles() {
    return clone(QUALITY_PROFILES);
  }

  static getSystemTemplates() {
    return clone(SYSTEM_TEMPLATES);
  }

  static resolveProfile(project = {}) {
    const workflow = project?.workflow && typeof project.workflow === 'object' && !Array.isArray(project.workflow) ? project.workflow : {};
    const stored = workflow.qualityProfile || {};
    const base = QUALITY_PROFILES.find(profile => profile.id === stored.id) || QUALITY_PROFILES[0];
    const custom = stored.id === 'custom' && stored.custom ? stored.custom : null;
    const thresholds = this.validateThresholds(custom || base.thresholds).thresholds;
    return {
      id: custom ? 'custom' : base.id,
      name: custom ? (stored.name || 'Benutzerdefiniert') : base.name,
      description: custom ? 'Projektbezogene, frei definierte neutrale Prüfwerte.' : base.description,
      thresholds,
      updatedAt: stored.updatedAt || null,
      updatedBy: stored.updatedBy || '',
    };
  }

  static validateThresholds(input = {}) {
    const thresholds = {
      velocityWarning: clamp(number(input.velocityWarning, 6), 0.5, 30),
      velocityCritical: clamp(number(input.velocityCritical, 10), 0.6, 40),
      frictionWarning: clamp(number(input.frictionWarning, 1.5), 0.05, 20),
      frictionCritical: clamp(number(input.frictionCritical, 3), 0.06, 30),
      lossShareWarning: clamp(number(input.lossShareWarning, 0.35), 0.05, 0.95),
      lossShareCritical: clamp(number(input.lossShareCritical, 0.55), 0.06, 1),
      totalLossWarning: clamp(number(input.totalLossWarning, 1000), 10, 10000),
    };
    const warnings = [];
    if (thresholds.velocityCritical <= thresholds.velocityWarning) {
      thresholds.velocityCritical = Math.min(40, thresholds.velocityWarning + 1);
      warnings.push('Der kritische Geschwindigkeitswert wurde über den Warnwert angehoben.');
    }
    if (thresholds.frictionCritical <= thresholds.frictionWarning) {
      thresholds.frictionCritical = Math.min(30, thresholds.frictionWarning + 0.5);
      warnings.push('Der kritische Reibungswert wurde über den Warnwert angehoben.');
    }
    if (thresholds.lossShareCritical <= thresholds.lossShareWarning) {
      thresholds.lossShareCritical = Math.min(1, thresholds.lossShareWarning + 0.1);
      warnings.push('Der kritische Verlustanteil wurde über den Warnwert angehoben.');
    }
    return { thresholds, warnings };
  }

  static applyProfile(project = {}, profileId = 'general', options = {}) {
    const workflow = this.ensureWorkflow(project);
    const profile = QUALITY_PROFILES.find(item => item.id === profileId);
    const isCustom = profileId === 'custom';
    if (!profile && !isCustom) throw new Error(`Prüfprofil nicht gefunden: ${profileId}`);
    const validation = this.validateThresholds(isCustom ? options.thresholds : profile.thresholds);
    workflow.qualityProfile = {
      id: isCustom ? 'custom' : profile.id,
      name: isCustom ? String(options.name || 'Benutzerdefiniert').trim() || 'Benutzerdefiniert' : profile.name,
      custom: isCustom ? validation.thresholds : null,
      updatedAt: new Date().toISOString(),
      updatedBy: String(options.actor || '').trim(),
    };
    this.addHistory(project, {
      action: 'QUALITY_PROFILE_CHANGED',
      title: 'Prüfprofil geändert',
      actor: options.actor,
      summary: `Prüfprofil „${workflow.qualityProfile.name}“ aktiviert.`,
      details: { profileId: workflow.qualityProfile.id, thresholds: validation.thresholds, warnings: validation.warnings },
    });
    return { profile: this.resolveProfile(project), warnings: validation.warnings };
  }

  static applySystemTemplate(project = {}, templateId = '', options = {}) {
    const workflow = this.ensureWorkflow(project);
    const template = SYSTEM_TEMPLATES.find(item => item.id === templateId);
    if (!template) throw new Error(`Anlagenvorlage nicht gefunden: ${templateId}`);
    project.systems = Array.isArray(project.systems) ? project.systems : [];
    const existingTypes = new Set(project.systems.map(system => normalizeType(system.type)));
    const added = [];
    const skipped = [];
    template.systems.forEach(item => {
      const type = normalizeType(item.type);
      if (existingTypes.has(type) && options.allowDuplicates !== true) {
        skipped.push(type);
        return;
      }
      const system = {
        id: createId('system'),
        name: item.name,
        type,
        bkpNumber: item.bkpNumber || '',
        description: 'Aus neutraler Projektstruktur-Vorlage erstellt.',
        sections: [],
        formParts: [],
        specialComponents: [],
      };
      project.systems.push(system);
      existingTypes.add(type);
      added.push(system);
    });
    this.addHistory(project, {
      action: 'SYSTEM_TEMPLATE_APPLIED',
      title: 'Anlagenvorlage angewendet',
      actor: options.actor,
      summary: `${template.name}: ${added.length} Anlage(n) ergänzt, ${skipped.length} bereits vorhanden.`,
      details: { templateId, added: added.map(item => ({ id: item.id, name: item.name, type: item.type })), skipped },
    });
    workflow.lastTemplateId = templateId;
    workflow.lastTemplateAt = new Date().toISOString();
    return { template: clone(template), added, skipped };
  }

  static normalizeBulkOptions(options = {}) {
    return {
      scope: ['all', 'duct', 'pipe', 'selected'].includes(options.scope) ? options.scope : 'all',
      selectedIds: Array.isArray(options.selectedIds) ? options.selectedIds.map(String) : [],
      airflowPercent: clamp(number(options.airflowPercent, 100), 10, 300),
      lengthPercent: clamp(number(options.lengthPercent, 100), 10, 300),
      dimensionPercent: clamp(number(options.dimensionPercent, 100), 25, 300),
      airflowStep: clamp(number(options.airflowStep, 5), 0, 1000),
      lengthStep: clamp(number(options.lengthStep, 0.1), 0, 100),
      dimensionStep: clamp(number(options.dimensionStep, 0.01), 0, 1),
      renumber: Boolean(options.renumber),
      note: String(options.note || '').trim(),
      actor: String(options.actor || '').trim(),
    };
  }

  static isSectionInScope(section = {}, options = {}) {
    if (options.scope === 'selected') return options.selectedIds.includes(String(section.id));
    const isPipe = section.type === 'pipe' || number(section.d ?? section.diameter) > 0;
    if (options.scope === 'pipe') return isPipe;
    if (options.scope === 'duct') return !isPipe;
    return true;
  }

  static previewBulkEdit(system = {}, rawOptions = {}) {
    const options = this.normalizeBulkOptions(rawOptions);
    const sections = Array.isArray(system.sections) ? system.sections : [];
    const rows = [];
    sections.forEach((section, index) => {
      if (!this.isSectionInScope(section, options)) return;
      const isPipe = section.type === 'pipe' || number(section.d ?? section.diameter) > 0;
      const before = {
        name: String(section.name || `ts${index + 1}`),
        q: number(section.q ?? section.volumeFlow ?? section.airVolume),
        l: number(section.l ?? section.length),
        b: number(section.b ?? section.width),
        h: number(section.h ?? section.height),
        d: number(section.d ?? section.diameter),
      };
      const after = {
        name: options.renumber ? `ts${index + 1}` : before.name,
        q: Math.max(0, roundTo(before.q * options.airflowPercent / 100, options.airflowStep)),
        l: Math.max(0, roundTo(before.l * options.lengthPercent / 100, options.lengthStep)),
        b: isPipe ? 0 : Math.max(0, roundTo(before.b * options.dimensionPercent / 100, options.dimensionStep)),
        h: isPipe ? 0 : Math.max(0, roundTo(before.h * options.dimensionPercent / 100, options.dimensionStep)),
        d: isPipe ? Math.max(0, roundTo(before.d * options.dimensionPercent / 100, options.dimensionStep)) : 0,
      };
      const changedFields = Object.keys(after).filter(key => after[key] !== before[key]);
      rows.push({
        id: section.id,
        index,
        type: isPipe ? 'pipe' : 'duct',
        before,
        after,
        changedFields,
        changed: changedFields.length > 0,
      });
    });
    const changedRows = rows.filter(row => row.changed);
    return {
      systemId: system.id || null,
      systemName: system.name || 'Anlage',
      options,
      rows,
      changedRows,
      affectedCount: rows.length,
      changedCount: changedRows.length,
      fingerprint: simpleHash(stableStringify({ systemId: system.id, options, rows })),
      generatedAt: new Date().toISOString(),
    };
  }

  static applyBulkEdit(project = {}, system = {}, rawOptions = {}, expectedFingerprint = '') {
    this.ensureWorkflow(project);
    const preview = this.previewBulkEdit(system, rawOptions);
    if (expectedFingerprint && preview.fingerprint !== expectedFingerprint) {
      throw new Error('Die Vorschau ist nicht mehr aktuell. Bitte Änderungen erneut prüfen.');
    }
    const rowById = new Map(preview.changedRows.map(row => [String(row.id), row]));
    (system.sections || []).forEach(section => {
      const row = rowById.get(String(section.id));
      if (!row) return;
      section.name = row.after.name;
      section.q = row.after.q;
      section.l = row.after.l;
      if (row.type === 'pipe') {
        section.type = 'pipe';
        section.d = row.after.d;
        section.b = 0;
        section.h = 0;
      } else {
        section.type = 'duct';
        section.b = row.after.b;
        section.h = row.after.h;
        section.d = 0;
      }
    });
    this.addHistory(project, {
      action: 'BULK_SECTION_EDIT',
      title: 'Massenbearbeitung ausgeführt',
      actor: preview.options.actor,
      systemId: system.id || null,
      systemName: system.name || '',
      summary: `${preview.changedCount} von ${preview.affectedCount} Teilstrecken geändert.`,
      details: {
        options: preview.options,
        fingerprint: preview.fingerprint,
        rows: preview.changedRows.map(row => ({ id: row.id, before: row.before, after: row.after, changedFields: row.changedFields })),
      },
    });
    return preview;
  }

  static addHistory(project = {}, entry = {}) {
    const workflow = this.ensureWorkflow(project);
    const item = {
      id: entry.id || createId('change'),
      timestamp: entry.timestamp || new Date().toISOString(),
      action: String(entry.action || 'CHANGE'),
      title: String(entry.title || 'Änderung'),
      actor: String(entry.actor || '').trim(),
      systemId: entry.systemId || null,
      systemName: String(entry.systemName || '').trim(),
      summary: String(entry.summary || '').trim(),
      details: clone(entry.details || {}),
    };
    workflow.changeHistory.unshift(item);
    workflow.changeHistory = workflow.changeHistory.slice(0, MAX_HISTORY);
    return item;
  }

  static getHistory(project = {}) {
    const workflow = project?.workflow && typeof project.workflow === 'object' && !Array.isArray(project.workflow) ? project.workflow : {};
    return clone(Array.isArray(workflow.changeHistory) ? workflow.changeHistory : []);
  }

  static clearHistory(project = {}, options = {}) {
    const workflow = this.ensureWorkflow(project);
    const count = workflow.changeHistory.length;
    workflow.changeHistory = [];
    if (options.logClear !== false) {
      this.addHistory(project, {
        action: 'CHANGE_HISTORY_CLEARED',
        title: 'Änderungsprotokoll geleert',
        actor: options.actor,
        summary: `${count} bisherige Einträge wurden entfernt.`,
      });
    }
    return count;
  }

  static createHistoryCsv(project = {}) {
    const history = this.getHistory(project);
    const rows = [
      ['Druckverlust Pro', 'Änderungsprotokoll'],
      ['Projekt', project.name || project.meta?.name || ''],
      ['Objekt', project.object || project.meta?.object || ''],
      ['Erstellt', new Date().toLocaleString('de-CH')],
      [],
      ['Zeitpunkt', 'Aktion', 'Titel', 'Anlage', 'Bearbeiter', 'Zusammenfassung'],
      ...history.map(item => [
        item.timestamp,
        item.action,
        item.title,
        item.systemName,
        item.actor,
        item.summary,
      ]),
    ];
    return `\uFEFF${rows.map(row => row.map(formatCsvValue).join(';')).join('\r\n')}`;
  }

  static createHistoryFileName(project = {}) {
    return `${safeToken(project.name || project.meta?.name || 'Projekt')}_Aenderungsprotokoll_${new Date().toISOString().slice(0, 10)}.csv`;
  }

  static downloadHistoryCsv(project = {}) {
    const text = this.createHistoryCsv(project);
    const fileName = this.createHistoryFileName(project);
    return downloadText(text, fileName);
  }
}

export default ProjectStandardizationEngine;
