// Druckverlust Pro – RevisionComparisonEngine
// Phase 31.00: Detaillierte, herstellerneutrale Revisionsvergleiche.

import ProjectCalculationService from '../project/ProjectCalculationService.js';

function number(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function getSystem(project = {}, systemId = null) {
  const systems = Array.isArray(project.systems) ? project.systems : [];
  return systems.find(item => item.id === systemId) || systems[0] || null;
}

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round(number(value) * factor) / factor;
}

function sameNumber(a, b, tolerance = 1e-6) {
  return Math.abs(number(a) - number(b)) <= tolerance;
}

function formatValue(value, unit = '', digits = 2) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(digits).replace(/\.00$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    return unit ? `${formatted} ${unit}` : formatted;
  }
  return String(value);
}

const SECTION_FIELDS = [
  { key: 'name', label: 'Bezeichnung', type: 'text' },
  { key: 'description', label: 'Beschreibung', type: 'text' },
  { key: 'type', label: 'Bauform', type: 'text' },
  { key: 'q', label: 'Luftmenge', unit: 'm³/h', digits: 0 },
  { key: 'b', label: 'Breite', unit: 'mm', scale: 1000, digits: 0 },
  { key: 'h', label: 'Höhe', unit: 'mm', scale: 1000, digits: 0 },
  { key: 'd', label: 'Durchmesser', unit: 'mm', scale: 1000, digits: 0 },
  { key: 'l', label: 'Länge', unit: 'm', digits: 2 },
  { key: 'zetaSum', label: 'Manuelle ζ-Summe', unit: '-', digits: 3 },
  { key: 'velocity', label: 'Geschwindigkeit', unit: 'm/s', digits: 2 },
  { key: 'frictionRate', label: 'Reibungsgefälle', unit: 'Pa/m', digits: 3 },
  { key: 'frictionLoss', label: 'Reibungsverlust', unit: 'Pa', digits: 2 },
  { key: 'totalLoss', label: 'Teilstreckenverlust', unit: 'Pa', digits: 2 },
];

const FORMPART_FIELDS = [
  { key: 'name', label: 'Bezeichnung', type: 'text' },
  { key: 'type', label: 'Formteiltyp', type: 'text' },
  { key: 'sectionId', label: 'Zuordnung', type: 'text' },
  { key: 'secondarySectionId', label: 'Zweite Zuordnung', type: 'text' },
  { key: 'zeta', label: 'ζ-Wert', unit: '-', digits: 3 },
  { key: 'pressureLoss', label: 'Direktverlust', unit: 'Pa', digits: 2 },
];

const SPECIAL_FIELDS = [
  { key: 'name', label: 'Bezeichnung', type: 'text' },
  { key: 'type', label: 'Bauteiltyp', type: 'text' },
  { key: 'sectionId', label: 'Zuordnung', type: 'text' },
  { key: 'quantity', label: 'Anzahl', unit: 'Stk.', digits: 0 },
  { key: 'unitPressureLoss', label: 'Einzelverlust', unit: 'Pa', digits: 2 },
  { key: 'pressureLoss', label: 'Gesamtverlust', unit: 'Pa', digits: 2 },
];

function getSecondarySectionId(item = {}) {
  return item.targetSectionId || item.secondSectionId || item.sectionId2 || item.branchSectionId || item.adSectionId || item.aaSectionId || '';
}

function normalizeSection(section = {}, result = {}, index = 0) {
  return {
    id: text(section.id, `section-${index + 1}`),
    position: index + 1,
    name: text(section.name || section.ts, `TS ${index + 1}`),
    description: text(section.description),
    type: section.type === 'pipe' || number(section.d) > 0 ? 'pipe' : 'duct',
    q: round(section.q),
    b: round(section.b),
    h: round(section.h),
    d: round(section.d),
    l: round(section.l),
    zetaSum: round(section.zetaSum),
    velocity: round(result.velocity),
    frictionRate: round(result.frictionRate),
    frictionLoss: round(result.frictionLoss),
    totalLoss: round(result.roundedTotalLoss ?? result.totalLoss),
  };
}

function normalizeFormPart(item = {}, index = 0) {
  return {
    id: text(item.id, `formpart-${index + 1}`),
    position: index + 1,
    name: text(item.name, item.type || `Formteil ${index + 1}`),
    type: text(item.type || item.formPartType || item.componentType, 'Formteil'),
    sectionId: text(item.sectionId || item.sourceSectionId || item.rowId),
    secondarySectionId: text(getSecondarySectionId(item)),
    zeta: round(item.zeta ?? item.calculationResult?.zeta),
    pressureLoss: round(item.pressureLoss ?? item.pa ?? item.directPressureLoss),
  };
}

function normalizeSpecial(item = {}, index = 0) {
  const quantity = Math.max(1, number(item.quantity, 1));
  const unitPressureLoss = number(item.unitPressureLoss, number(item.pressureLoss ?? item.pa) / quantity);
  return {
    id: text(item.id, `special-${index + 1}`),
    position: index + 1,
    name: text(item.name, item.type || `Sonderbauteil ${index + 1}`),
    type: text(item.componentType || item.type, 'Sonderbauteil'),
    sectionId: text(item.sectionId || item.rowId || item.targetSectionId),
    quantity,
    unitPressureLoss: round(unitPressureLoss),
    pressureLoss: round(item.pressureLoss ?? item.pa ?? (unitPressureLoss * quantity)),
  };
}

function createTotals(calculation = {}) {
  const totals = calculation.totals || {};
  const results = Array.isArray(calculation.results) ? calculation.results : [];
  return {
    totalLoss: round(totals.totalRounded ?? totals.total),
    frictionLoss: round(totals.friction),
    formPartLoss: round(totals.formParts, number(totals.zetaLoss) + number(totals.directFormPartLoss)),
    specialLoss: round(totals.special),
    maxVelocity: round(results.reduce((max, item) => Math.max(max, number(item?.result?.velocity)), 0)),
  };
}

function indexById(items = []) {
  return new Map((Array.isArray(items) ? items : []).map(item => [item.id, item]));
}

function compareFields(category, before, after, fields, changes) {
  fields.forEach(field => {
    const scale = number(field.scale, 1);
    const beforeRaw = before?.[field.key];
    const afterRaw = after?.[field.key];
    const isText = field.type === 'text';
    const equal = isText ? String(beforeRaw ?? '') === String(afterRaw ?? '') : sameNumber(beforeRaw, afterRaw);
    if (equal) return;

    const beforeValue = isText ? text(beforeRaw, '-') : number(beforeRaw) * scale;
    const afterValue = isText ? text(afterRaw, '-') : number(afterRaw) * scale;
    const delta = isText ? null : afterValue - beforeValue;

    changes.push({
      id: `${category}-${after?.id || before?.id}-${field.key}`,
      category,
      elementId: after?.id || before?.id || '',
      elementName: after?.name || before?.name || '-',
      changeType: 'modified',
      field: field.key,
      fieldLabel: field.label,
      before: beforeValue,
      after: afterValue,
      beforeLabel: formatValue(beforeValue, field.unit, field.digits),
      afterLabel: formatValue(afterValue, field.unit, field.digits),
      delta,
      deltaLabel: delta === null ? '' : `${delta > 0 ? '+' : ''}${formatValue(delta, field.unit, field.digits)}`,
      unit: field.unit || '',
      severity: field.key === 'totalLoss' || field.key === 'pressureLoss' || field.key === 'q' ? 'important' : 'normal',
    });
  });
}

function compareCollection(category, beforeItems, afterItems, fields) {
  const changes = [];
  const beforeMap = indexById(beforeItems);
  const afterMap = indexById(afterItems);
  const ids = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  ids.forEach(id => {
    const before = beforeMap.get(id);
    const after = afterMap.get(id);
    if (!before && after) {
      changes.push({
        id: `${category}-${id}-added`, category, elementId: id, elementName: after.name || id,
        changeType: 'added', field: '', fieldLabel: 'Element', before: null, after: after.name || id,
        beforeLabel: '-', afterLabel: 'Neu hinzugefügt', delta: null, deltaLabel: '', unit: '', severity: 'important',
      });
      return;
    }
    if (before && !after) {
      changes.push({
        id: `${category}-${id}-removed`, category, elementId: id, elementName: before.name || id,
        changeType: 'removed', field: '', fieldLabel: 'Element', before: before.name || id, after: null,
        beforeLabel: 'Vorhanden', afterLabel: 'Entfernt', delta: null, deltaLabel: '', unit: '', severity: 'important',
      });
      return;
    }
    compareFields(category, before, after, fields, changes);
  });

  return changes;
}

function summarize(changes = []) {
  const count = type => changes.filter(item => item.changeType === type).length;
  const categories = ['sections', 'formParts', 'specialComponents'].reduce((result, key) => {
    const rows = changes.filter(item => item.category === key);
    result[key] = {
      total: rows.length,
      added: rows.filter(item => item.changeType === 'added').length,
      removed: rows.filter(item => item.changeType === 'removed').length,
      modified: rows.filter(item => item.changeType === 'modified').length,
    };
    return result;
  }, {});

  return {
    total: changes.length,
    added: count('added'),
    removed: count('removed'),
    modified: count('modified'),
    important: changes.filter(item => item.severity === 'important').length,
    categories,
  };
}

export default class RevisionComparisonEngine {
  static createTechnicalSnapshot(project = {}, systemId = null, calculationInput = null) {
    const cloned = deepClone(project);
    const sourceSystem = getSystem(cloned, systemId);
    if (!sourceSystem) throw new Error('Keine Anlage für den technischen Revisionssnapshot vorhanden.');

    const calculated = ProjectCalculationService.calculate(cloned, sourceSystem.id);
    const system = calculated.system || getSystem(calculated.project || cloned, sourceSystem.id) || sourceSystem;
    const calculation = calculationInput?.calculation || calculationInput || calculated.calculation;
    const resultMap = new Map((calculation.results || []).map(item => [item.id || item.input?.id, item.result || {}]));

    return {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      system: {
        id: system.id || '',
        name: system.name || 'Anlage',
        type: system.type || '',
      },
      settings: {
        rho: round(cloned.settings?.rho, 1.21),
        lambda: round(cloned.settings?.lambda, 0.025),
        sectionRoundingStep: round(cloned.settings?.sectionRoundingStep, 0.5),
      },
      totals: createTotals(calculation),
      sections: (system.sections || []).map((item, index) => normalizeSection(item, resultMap.get(item.id) || {}, index)),
      formParts: (system.formParts || []).map(normalizeFormPart),
      specialComponents: (system.specialComponents || []).map(normalizeSpecial),
    };
  }

  static compareSnapshots(before = null, after = null, meta = {}) {
    if (!before || !after) {
      return {
        status: 'unavailable', legacy: true, changes: [], summary: summarize([]),
        message: 'Für mindestens einen Revisionsstand fehlen technische Detaildaten.',
      };
    }

    const changes = [
      ...compareCollection('sections', before.sections, after.sections, SECTION_FIELDS),
      ...compareCollection('formParts', before.formParts, after.formParts, FORMPART_FIELDS),
      ...compareCollection('specialComponents', before.specialComponents, after.specialComponents, SPECIAL_FIELDS),
    ];

    const totalDelta = number(after.totals?.totalLoss) - number(before.totals?.totalLoss);
    const velocityDelta = number(after.totals?.maxVelocity) - number(before.totals?.maxVelocity);
    const summary = summarize(changes);
    const status = changes.length ? 'changed' : 'identical';

    return {
      status,
      legacy: false,
      base: { ...meta.base, snapshot: before },
      target: { ...meta.target, snapshot: after },
      totals: {
        before: before.totals || {},
        after: after.totals || {},
        delta: {
          totalLoss: round(totalDelta),
          frictionLoss: round(number(after.totals?.frictionLoss) - number(before.totals?.frictionLoss)),
          formPartLoss: round(number(after.totals?.formPartLoss) - number(before.totals?.formPartLoss)),
          specialLoss: round(number(after.totals?.specialLoss) - number(before.totals?.specialLoss)),
          maxVelocity: round(velocityDelta),
        },
      },
      changes: changes.sort((a, b) => {
        const typeWeight = { removed: 0, added: 1, modified: 2 };
        const categoryWeight = { sections: 0, formParts: 1, specialComponents: 2 };
        return (categoryWeight[a.category] ?? 9) - (categoryWeight[b.category] ?? 9)
          || (typeWeight[a.changeType] ?? 9) - (typeWeight[b.changeType] ?? 9)
          || String(a.elementName).localeCompare(String(b.elementName), 'de')
          || String(a.fieldLabel).localeCompare(String(b.fieldLabel), 'de');
      }),
      summary,
      generatedAt: new Date().toISOString(),
      message: changes.length ? `${changes.length} technische Änderung(en) erkannt.` : 'Keine technischen Änderungen erkannt.',
    };
  }

  static compareRevisionToCurrent(project = {}, systemId = null, revisionSnapshot = null) {
    if (!revisionSnapshot) return this.compareSnapshots(null, null);
    const current = this.createTechnicalSnapshot(project, systemId);
    return this.compareSnapshots(revisionSnapshot.technicalSnapshot || null, current, {
      base: { id: revisionSnapshot.id || '', label: `Revision ${revisionSnapshot.revision || '-'}`, revision: revisionSnapshot.revision || '' },
      target: { id: 'current', label: 'Aktueller Projektstand', revision: project.report?.revision || project.revision || '' },
    });
  }

  static toCsv(comparison = {}) {
    const rows = [
      ['Revisionsvergleich'],
      ['Basis', comparison.base?.label || '-'],
      ['Ziel', comparison.target?.label || '-'],
      ['Status', comparison.status || '-'],
      ['Änderungen', comparison.summary?.total || 0],
      [],
      ['Kategorie', 'Element', 'Änderung', 'Feld', 'Vorher', 'Nachher', 'Differenz'],
    ];
    (comparison.changes || []).forEach(item => rows.push([
      item.category,
      item.elementName,
      item.changeType,
      item.fieldLabel,
      item.beforeLabel,
      item.afterLabel,
      item.deltaLabel,
    ]));
    return rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
  }
}
