// Druckverlust Pro – ProjectCommands
// Zentrale Projektbefehle für UI, Ribbon und spätere Dialoge.

import { createDefaultFormPartRegistry } from '../formteile/FormPartRegistry.js?v=57.00';
import {
  moveFormPartWithinSection as moveFormPartWithinSectionInCollection,
  resolveFormPartContextSection,
} from '../formteile/FormPartWorkflowEngine.js?v=57.00';
import createDefaultProject from '../project/defaultProject.js';


const SPECIAL_COMPONENT_LIBRARY = Object.freeze([
  {
    id: 'filter',
    type: 'Filter',
    category: 'Luftaufbereitung',
    name: 'Filter',
    unitPressureLoss: 80,
    note: 'Typischer Ansatz für Vor-/Feinfilter. Herstellerwert prüfen.'
  },
  {
    id: 'schalldaempfer',
    type: 'Schalldämpfer',
    category: 'Schall',
    name: 'Schalldämpfer',
    unitPressureLoss: 20,
    note: 'Druckverlust gemäss Herstellerdatenblatt einsetzen.'
  },
  {
    id: 'volumenstromregler',
    type: 'Volumenstromregler',
    category: 'Regelung',
    name: 'Volumenstromregler',
    unitPressureLoss: 35,
    note: 'Druckverlust abhängig von Luftmenge und Regelbereich.'
  },
  {
    id: 'brandschutzklappe',
    type: 'Brandschutzklappe',
    category: 'Brandschutz',
    name: 'Brandschutzklappe',
    unitPressureLoss: 15,
    note: 'Herstellerkennlinie und Einbausituation prüfen.'
  },
  {
    id: 'luftdurchlass',
    type: 'Luftdurchlass',
    category: 'Raumluft',
    name: 'Luftdurchlass / Gitter',
    unitPressureLoss: 25,
    note: 'Druckverlust gemäss Auslegung / Auslassdatenblatt.'
  },
  {
    id: 'monoblock',
    type: 'Monoblock / Lüftungsgerät',
    category: 'Gerät',
    name: 'Lüftungsgerät / Monoblock',
    unitPressureLoss: 100,
    note: 'Interner Geräteverlust / externer Druck gemäss Geräteauslegung.'
  },
  {
    id: 'wettergitter',
    type: 'Wettergitter / Lamellenhaube',
    category: 'Aussenluft / Fortluft',
    name: 'Wettergitter / Lamellenhaube',
    unitPressureLoss: 20,
    note: 'Druckverlust abhängig von freiem Querschnitt und Anströmung.'
  },
  {
    id: 'freie_komponente',
    type: 'Freie Komponente',
    category: 'Manuell',
    name: 'Freie Komponente',
    unitPressureLoss: 0,
    note: 'Manueller Druckverlustansatz.'
  },
]);

function cloneSpecialComponentPreset(type = 'freie_komponente') {
  const fallback = SPECIAL_COMPONENT_LIBRARY.find(item => item.id === 'freie_komponente') || SPECIAL_COMPONENT_LIBRARY[0];
  return SPECIAL_COMPONENT_LIBRARY.find(item => item.id === type) || fallback;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

let runtimeIdSequence = 0;

function createUniqueRuntimeId(prefix, collection = []) {
  const usedIds = new Set((Array.isArray(collection) ? collection : [])
    .map(item => item?.id)
    .filter(Boolean));

  let id;
  do {
    runtimeIdSequence += 1;
    id = `${prefix}-${Date.now()}-${runtimeIdSequence}`;
  } while (usedIds.has(id));

  return id;
}

export default class ProjectCommands {
  constructor(state) {
    if (!state) {
      throw new Error('ProjectCommands benötigt einen ApplicationState.');
    }

    this.state = state;
    this.formPartRegistry = createDefaultFormPartRegistry();
  }

  createProject(options = {}) {
    const config = typeof options === 'string'
      ? { projectNumber: options }
      : { ...options };

    const project = createDefaultProject(config);

    this.state.setProject(project);
    this.state.setSelection('project', project);
    this.state.markCalculationDirty();

    return project;
  }

  addSection(template = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.sections = system.sections || [];

    const number = this.getNextSectionNumber(system);
    const base = template && typeof template === 'object' ? template : {};

    const section = {
      id: createUniqueRuntimeId('section', system.sections),
      name: `ts${number}`,
      description: base.description ? `Kopie von ${base.name || base.id || 'Teilstrecke'} · ${base.description}` : '',
      type: base.type || 'duct',
      q: Number(base.q ?? base.volumeFlow ?? base.airVolume ?? 0),
      l: Number(base.l ?? base.length ?? 0),
      b: Number(base.b ?? base.width ?? 0),
      h: Number(base.h ?? base.height ?? 0),
      d: Number(base.d ?? base.diameter ?? 0),
      roughnessMm: Number(base.roughnessMm ?? base.roughness ?? 0.15),
      zetaSum: Number(base.zetaSum ?? 0)
    };

    system.sections.push(section);
    this.state.rememberCreatedSection?.(section, system);
    this.state.selectSection(section);
    this.state.markCalculationDirty();

    return section;
  }

  getNextSectionNumber(system) {
    const sections = system?.sections || [];
    const usedNumbers = sections
      .map(section => String(section?.name || '').match(/^ts\s*(\d+)$/i)?.[1])
      .map(value => Number(value))
      .filter(value => Number.isInteger(value) && value > 0);

    let number = 1;
    while (usedNumbers.includes(number)) number += 1;
    return number;
  }

  duplicateSection(sectionId = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const source = system.sections?.find(section => section.id === sectionId)
      || this.state.selectedSection
      || system.sections?.[0]
      || null;

    if (!source) {
      throw new Error('Es ist keine Teilstrecke zum Duplizieren vorhanden.');
    }

    const section = this.addSection(source);
    section.description = source.description || `Kopie von ${source.name || source.id || 'Teilstrecke'}`;

    return section;
  }

  deleteSection(sectionId = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.sections = system.sections || [];
    const index = system.sections.findIndex(section => section.id === sectionId);

    if (index === -1) {
      throw new Error('Teilstrecke nicht gefunden.');
    }

    const [removed] = system.sections.splice(index, 1);
    this.state.forgetCreatedSection?.(removed?.id, system);

    // Zugeordnete Formteile bleiben erhalten, werden aber bewusst entkoppelt.
    // Dadurch gehen keine Formteile verloren und die Plausibilitätsprüfung weist auf fehlende Zuordnung hin.
    (system.formParts || []).forEach(part => {
      if (part?.sectionId === removed.id) {
        part.sectionId = system.sections[index]?.id || system.sections[index - 1]?.id || null;
      }
    });

    const nextSelection = system.sections[index] || system.sections[index - 1] || null;

    if (nextSelection) {
      this.state.selectSection(nextSelection);
    } else {
      this.state.selectSystem(system);
    }

    this.state.markCalculationDirty();
    return removed;
  }

  moveSection(sectionId, direction = 0) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system || !Array.isArray(system.sections)) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const index = system.sections.findIndex(section => section.id === sectionId);
    const targetIndex = index + Number(direction);

    if (index < 0 || targetIndex < 0 || targetIndex >= system.sections.length) {
      return null;
    }

    const [section] = system.sections.splice(index, 1);
    system.sections.splice(targetIndex, 0, section);

    this.state.selectSection(section);
    this.state.markProjectDirty();

    return section;
  }

  renumberSections(options = {}) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const force = Boolean(options.force);

    (system.sections || []).forEach((section, index) => {
      const currentName = String(section?.name || '').trim();
      const isAutoName = !currentName || /^ts\s*\d+$/i.test(currentName);

      if (force || isAutoName) {
        section.name = `ts${index + 1}`;
      }
    });

    this.state.markProjectDirty();
    this.state.notify();

    return system.sections || [];
  }

  addFormPart() {
    return this.openFormPartPicker();
  }

  openFormPartPicker(sectionId = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const contextSection = this.getDefaultFormPartSection(system, {
      requestedSectionId: sectionId,
      usePickerContext: false,
    });

    if (typeof this.state.selectFormPartPicker === 'function') {
      this.state.selectFormPartPicker(system, { sectionId: contextSection?.id || null });
    } else {
      this.state.formPartPickerSectionId = contextSection?.id || null;
      this.state.setSelection('formPartPicker', system);
      this.state.notify();
    }

    return system;
  }

  getDefaultFormPartSection(system = null, options = {}) {
    const activeSystem = system || this.state.selectedSystem || this.state.project?.systems?.[0] || null;
    const rememberedSection = typeof this.state.getLastCreatedSection === 'function'
      ? this.state.getLastCreatedSection(activeSystem)
      : null;

    const pickerContextId = options.usePickerContext === false
      ? null
      : this.state.getSelectionType?.() === 'formPartPicker'
        ? this.state.formPartPickerSectionId
        : null;

    return resolveFormPartContextSection(activeSystem, {
      requestedSectionId: options.requestedSectionId ?? pickerContextId,
      selectedSectionId: options.selectedSectionId,
      rememberedSectionId: rememberedSection?.id,
    });
  }

  createFormPart(type = 'kreis_bogen', options = {}) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const definition = this.formPartRegistry.get(type) || this.formPartRegistry.get('kreis_bogen');

    if (!definition) {
      throw new Error(`Formteiltyp nicht gefunden: ${type}`);
    }

    system.formParts = system.formParts || [];

    const number = system.formParts.length + 1;
    const selectedSection = options.sectionId
      ? this.getDefaultFormPartSection(system, { requestedSectionId: options.sectionId })
      : this.getDefaultFormPartSection(system);
    const defaults = typeof this.formPartRegistry.getDefaultValues === 'function'
      ? this.formPartRegistry.getDefaultValues(definition.id)
      : {};

    const formPart = {
      id: createUniqueRuntimeId('formpart', system.formParts),
      name: `Formteil ${number}`,
      type: definition.id,
      sectionId: selectedSection?.id || null,
      ...defaults,
      zeta: 0
    };

    if (typeof this.formPartRegistry.deriveValues === 'function') {
      Object.assign(formPart, this.formPartRegistry.deriveValues(definition.id, formPart));
    }

    if (typeof definition.calculate === 'function') {
      try {
        const result = this.formPartRegistry.calculate(definition.id, formPart);
        formPart.zeta = Number(result?.zeta ?? 0);
        formPart.calculationResult = result;
      } catch (error) {
        formPart.calculationResult = {
          id: definition.id,
          name: definition.name,
          category: definition.category,
          zeta: Number(formPart.zeta ?? 0),
          warnings: [error.message],
        };
      }
    }

    system.formParts.push(formPart);
    this.state.selectFormPart(formPart);
    this.state.markProjectDirty();

    return formPart;
  }

  duplicateFormPart(formPartId = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.formParts = system.formParts || [];

    const index = system.formParts.findIndex(part => part.id === formPartId);
    const source = index >= 0
      ? system.formParts[index]
      : this.state.selectedFormPart || system.formParts[0] || null;

    if (!source) {
      throw new Error('Es ist kein Formteil zum Duplizieren vorhanden.');
    }

    const sourceIndex = system.formParts.findIndex(part => part.id === source.id);
    const copy = JSON.parse(JSON.stringify(source));
    const number = system.formParts.length + 1;

    copy.id = createUniqueRuntimeId('formpart', system.formParts);
    copy.name = `${source.name || 'Formteil'} Kopie`;
    copy.createdFrom = source.id;
    copy.sortIndex = number;

    const insertIndex = sourceIndex >= 0 ? sourceIndex + 1 : system.formParts.length;
    system.formParts.splice(insertIndex, 0, copy);
    this.state.selectFormPart(copy);
    this.state.markCalculationDirty();

    return copy;
  }

  deleteFormPart(formPartId = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.formParts = system.formParts || [];
    const index = system.formParts.findIndex(part => part.id === formPartId);

    if (index === -1) {
      throw new Error('Formteil nicht gefunden.');
    }

    const [removed] = system.formParts.splice(index, 1);
    const nextSelection = system.formParts[index] || system.formParts[index - 1] || null;

    if (nextSelection) {
      this.state.selectFormPart(nextSelection);
    } else {
      this.state.selectSystem(system);
    }

    this.state.markCalculationDirty();
    return removed;
  }

  moveFormPart(formPartId, direction = 0) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system || !Array.isArray(system.formParts)) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const index = system.formParts.findIndex(part => part.id === formPartId);
    const targetIndex = index + Number(direction);

    if (index < 0 || targetIndex < 0 || targetIndex >= system.formParts.length) {
      return null;
    }

    const [formPart] = system.formParts.splice(index, 1);
    system.formParts.splice(targetIndex, 0, formPart);

    this.state.selectFormPart(formPart);
    this.state.markProjectDirty();

    return formPart;
  }

  moveFormPartWithinSection(formPartId, direction = 0) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system || !Array.isArray(system.formParts)) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const formPart = moveFormPartWithinSectionInCollection(system.formParts, formPartId, direction);
    if (!formPart) return null;

    this.state.selectFormPart(formPart);
    this.state.markProjectDirty();
    return formPart;
  }

  renumberFormParts(options = {}) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const force = Boolean(options.force);

    (system.formParts || []).forEach((formPart, index) => {
      const currentName = String(formPart?.name || '').trim();
      const isAutoName = !currentName || /^formteil\s*\d+$/i.test(currentName);

      if (force || isAutoName) {
        const definition = this.formPartRegistry.get(formPart?.type);
        const baseName = definition?.name || 'Formteil';
        formPart.name = `${baseName} ${index + 1}`;
      }
    });

    this.state.markProjectDirty();
    this.state.notify();

    return system.formParts || [];
  }


  getSpecialComponentLibrary() {
    return SPECIAL_COMPONENT_LIBRARY.map(item => ({ ...item }));
  }

  normalizeSpecialComponent(component = {}) {
    const quantity = Math.max(1, toNumber(component.quantity ?? component.count ?? 1, 1));
    const unitPressureLoss = toNumber(component.unitPressureLoss ?? component.singlePressureLoss ?? component.dpUnit ?? component.pressureLoss ?? component.pa ?? 0);

    // pressureLoss ist bei Sonderbauteilen ein berechneter Gesamtwert:
    // Anzahl × Druckverlust je Stück. Darum darf ein alter gespeicherter
    // pressureLoss-Wert die Neuberechnung nach Änderung von quantity oder
    // unitPressureLoss nicht übersteuern.
    const totalPressureLoss = unitPressureLoss * quantity;

    component.quantity = quantity;
    component.unitPressureLoss = unitPressureLoss;
    component.pressureLoss = Number.isFinite(totalPressureLoss) ? totalPressureLoss : 0;
    component.pa = component.pressureLoss;
    component.q = toNumber(component.q ?? component.airflow ?? component.volumeFlow ?? component.airVolume ?? 0);
    component.airflow = component.q;

    return component;
  }

  addSpecialComponent(type = 'freie_komponente') {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.specialComponents = system.specialComponents || [];
    const preset = cloneSpecialComponentPreset(type);
    const number = system.specialComponents.length + 1;
    const selectedSection = this.state.selectedSection || system.sections?.[0] || null;

    const component = this.normalizeSpecialComponent({
      id: createUniqueRuntimeId('special', system.specialComponents),
      name: `${preset.name} ${number}`,
      componentType: preset.id,
      type: preset.type,
      category: preset.category,
      sectionId: selectedSection?.id || '',
      manufacturer: '',
      model: '',
      q: selectedSection?.q ?? selectedSection?.volumeFlow ?? selectedSection?.airVolume ?? 0,
      quantity: 1,
      unitPressureLoss: preset.unitPressureLoss,
      pressureLoss: preset.unitPressureLoss,
      note: preset.note || '',
    });

    system.specialComponents.push(component);
    this.state.selectSpecialComponent(component);
    this.state.markCalculationDirty();

    return component;
  }

  duplicateSpecialComponent(componentId = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.specialComponents = system.specialComponents || [];
    const index = system.specialComponents.findIndex(component => component.id === componentId);
    const source = index >= 0
      ? system.specialComponents[index]
      : this.state.selectedSpecialComponent || system.specialComponents[0] || null;

    if (!source) {
      throw new Error('Es ist kein Sonderbauteil zum Duplizieren vorhanden.');
    }

    const copy = this.normalizeSpecialComponent(JSON.parse(JSON.stringify(source)));
    copy.id = createUniqueRuntimeId('special', system.specialComponents);
    copy.name = `${source.name || 'Sonderbauteil'} Kopie`;
    copy.createdFrom = source.id;

    const insertIndex = index >= 0 ? index + 1 : system.specialComponents.length;
    system.specialComponents.splice(insertIndex, 0, copy);
    this.state.selectSpecialComponent(copy);
    this.state.markCalculationDirty();

    return copy;
  }

  deleteSpecialComponent(componentId = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.specialComponents = system.specialComponents || [];
    const index = system.specialComponents.findIndex(component => component.id === componentId);

    if (index === -1) {
      throw new Error('Sonderbauteil nicht gefunden.');
    }

    const [removed] = system.specialComponents.splice(index, 1);
    const nextSelection = system.specialComponents[index] || system.specialComponents[index - 1] || null;

    if (nextSelection) {
      this.state.selectSpecialComponent(nextSelection);
    } else {
      this.state.selectSystem(system);
    }

    this.state.markCalculationDirty();
    return removed;
  }

  moveSpecialComponent(componentId, direction = 0) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system || !Array.isArray(system.specialComponents)) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const index = system.specialComponents.findIndex(component => component.id === componentId);
    const targetIndex = index + Number(direction);

    if (index < 0 || targetIndex < 0 || targetIndex >= system.specialComponents.length) {
      return null;
    }

    const [component] = system.specialComponents.splice(index, 1);
    system.specialComponents.splice(targetIndex, 0, component);

    this.state.selectSpecialComponent(component);
    this.state.markProjectDirty();

    return component;
  }

  renumberSpecialComponents(options = {}) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    const force = Boolean(options.force);

    (system.specialComponents || []).forEach((component, index) => {
      const currentName = String(component?.name || '').trim();
      const isAutoName = !currentName || /^sonderbauteil\s*\d+$/i.test(currentName) || /\s\d+$/.test(currentName);
      const preset = cloneSpecialComponentPreset(component?.componentType);

      if (force || isAutoName) {
        component.name = `${preset.name || component.type || 'Sonderbauteil'} ${index + 1}`;
      }

      this.normalizeSpecialComponent(component);
    });

    this.state.markProjectDirty();
    this.state.notify();

    return system.specialComponents || [];
  }


  addSystem(template = null) {
    const project = this.state.project;

    if (!project) {
      throw new Error('Es ist kein Projekt vorhanden.');
    }

    project.systems = Array.isArray(project.systems) ? project.systems : [];
    const source = template && typeof template === 'object' ? template : null;
    const system = source
      ? this.cloneSystemForProject(source, project.systems)
      : {
          id: createUniqueRuntimeId('system', project.systems),
          name: `Anlage ${project.systems.length + 1}`,
          type: 'Zuluft',
          bkpNumber: '',
          description: '',
          siaVelocity: {
            roomUsageCode: '',
            operationMode: '',
          },
          sections: [],
          formParts: [],
          specialComponents: [],
        };

    if (source) {
      system.name = `${source.name || 'Anlage'} Kopie`;
      system.createdFrom = source.id || null;
    }

    project.systems.push(system);
    this.state.selectSystem(system);
    this.state.markCalculationDirty();
    return system;
  }

  duplicateSystem(systemId = null) {
    const project = this.state.project;
    const systems = project?.systems || [];
    const source = systems.find(system => system.id === systemId)
      || this.state.selectedSystem
      || systems[0]
      || null;

    if (!source) {
      throw new Error('Es ist keine Anlage zum Duplizieren vorhanden.');
    }

    return this.addSystem(source);
  }

  cloneSystemForProject(source = {}, existingSystems = []) {
    const clone = JSON.parse(JSON.stringify(source || {}));
    const systemId = createUniqueRuntimeId('system', existingSystems);
    const sectionIdMap = new Map();

    clone.id = systemId;
    clone.sections = (clone.sections || []).map((section, index) => {
      const oldId = section.id;
      const next = { ...section, id: `${systemId}-ts${index + 1}` };
      if (oldId) sectionIdMap.set(oldId, next.id);
      return next;
    });

    clone.formParts = (clone.formParts || []).map((part, index) => ({
      ...part,
      id: `${systemId}-formpart-${index + 1}`,
      sectionId: part.sectionId ? sectionIdMap.get(part.sectionId) || null : null,
      createdFrom: part.id || null,
    }));

    clone.specialComponents = (clone.specialComponents || []).map((component, index) => ({
      ...component,
      id: `${systemId}-special-${index + 1}`,
      sectionId: component.sectionId ? sectionIdMap.get(component.sectionId) || '' : '',
      createdFrom: component.id || null,
    }));

    delete clone.calculationResult;
    delete clone.validation;
    return clone;
  }

  deleteSystem(systemId = null) {
    const project = this.state.project;
    const systems = project?.systems || [];

    if (systems.length <= 1) {
      throw new Error('Die letzte Anlage kann nicht gelöscht werden.');
    }

    const index = systems.findIndex(system => system.id === systemId);
    if (index < 0) {
      throw new Error('Anlage nicht gefunden.');
    }

    const [removed] = systems.splice(index, 1);
    const next = systems[index] || systems[index - 1] || systems[0] || null;
    if (next) this.state.selectSystem(next);
    this.state.markCalculationDirty();
    return removed;
  }

  moveSystem(systemId, direction = 0) {
    const project = this.state.project;
    const systems = project?.systems || [];
    const index = systems.findIndex(system => system.id === systemId);
    const targetIndex = index + Number(direction);

    if (index < 0 || targetIndex < 0 || targetIndex >= systems.length) {
      return null;
    }

    const [system] = systems.splice(index, 1);
    systems.splice(targetIndex, 0, system);
    this.state.selectSystem(system);
    this.state.markProjectDirty();
    return system;
  }

}