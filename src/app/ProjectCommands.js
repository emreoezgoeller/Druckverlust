// Druckverlust Pro – ProjectCommands
// Zentrale Projektbefehle für UI, Ribbon und spätere Dialoge.

import { createDefaultFormPartRegistry } from '../formteile/FormPartRegistry.js';

export default class ProjectCommands {
  constructor(state) {
    if (!state) {
      throw new Error('ProjectCommands benötigt einen ApplicationState.');
    }

    this.state = state;
    this.formPartRegistry = createDefaultFormPartRegistry();
  }

  createProject(name = 'Neues Projekt') {
    const now = Date.now();

    const project = {
      id: `project-${now}`,
      name,
      systems: [
        {
          id: `system-${now}`,
          name: 'Zuluftanlage',
          sections: [],
          formParts: [],
          specialComponents: []
        }
      ]
    };

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
      id: `section-${Date.now()}`,
      name: `ts${number}`,
      description: base.description ? `Kopie von ${base.name || base.id || 'Teilstrecke'} · ${base.description}` : '',
      type: base.type || 'duct',
      q: Number(base.q ?? base.volumeFlow ?? base.airVolume ?? 0),
      l: Number(base.l ?? base.length ?? 0),
      b: Number(base.b ?? base.width ?? 0),
      h: Number(base.h ?? base.height ?? 0),
      d: Number(base.d ?? base.diameter ?? 0),
      zetaSum: Number(base.zetaSum ?? 0)
    };

    system.sections.push(section);
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

  openFormPartPicker() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    if (typeof this.state.selectFormPartPicker === 'function') {
      this.state.selectFormPartPicker(system);
    } else {
      this.state.setSelection('formPartPicker', system);
      this.state.notify();
    }

    return system;
  }

  createFormPart(type = 'kreis_bogen') {
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
    const selectedSection = this.state.selectedSection || system.sections?.[0] || null;
    const defaults = typeof this.formPartRegistry.getDefaultValues === 'function'
      ? this.formPartRegistry.getDefaultValues(definition.id)
      : {};

    const formPart = {
      id: `formpart-${Date.now()}`,
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
}