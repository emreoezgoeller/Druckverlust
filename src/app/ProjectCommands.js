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

  addSection() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.sections = system.sections || [];

    const number = system.sections.length + 1;

    const section = {
      id: `section-${Date.now()}`,
      name: `ts${number}`,
      type: 'duct',
      q: 0,
      l: 0,
      b: 0,
      h: 0,
      zetaSum: 0
    };

    system.sections.push(section);
    this.state.selectSection(section);
    this.state.markCalculationDirty();

    return section;
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