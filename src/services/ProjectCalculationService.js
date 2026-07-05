// Druckverlust Pro – ProjectCalculationService
// Orchestriert die Berechnung eines vollständigen Projekts.

import ProjectCalculationService from '../../project/ProjectCalculationService.js';

export default class ProjectCalculationService {
  static calculate(project) {
    if (!project) {
      throw new Error('Kein Projekt vorhanden.');
    }

    const systems = project.systems || [];

    const result = {
      projectId: project.id,
      projectName: project.name,
      systems: [],
      totalPressureLoss: 0
    };

    for (const system of systems) {
      const systemResult = this.calculateSystem(system);

      result.systems.push(systemResult);
      result.totalPressureLoss += systemResult.totalPressureLoss;
    }

    result.totalPressureLoss = this.round(result.totalPressureLoss);

    return result;
  }

  static calculateSystem(system) {
    const sections = system.sections || [];
    const formParts = system.formParts || [];
    const specialComponents = system.specialComponents || [];

    const sectionResults = sections.map(section => this.calculateSection(section));
    const formPartResults = formParts.map(formPart => this.calculateFormPart(formPart));
    const specialComponentResults = specialComponents.map(component => this.calculateSpecialComponent(component));

    const totalPressureLoss =
      this.sumPressureLoss(sectionResults) +
      this.sumPressureLoss(formPartResults) +
      this.sumPressureLoss(specialComponentResults);

    return {
      id: system.id,
      name: system.name,
      sections: sectionResults,
      formParts: formPartResults,
      specialComponents: specialComponentResults,
      totalPressureLoss: this.round(totalPressureLoss)
    };
  }

  static calculateSection(section) {
    return {
      id: section.id,
      name: section.name,
      type: section.type,
      airVolume: Number(section.airVolume || 0),
      length: Number(section.length || 0),
      pressureLoss: this.round(Number(section.pressureLoss || 0))
    };
  }

  static calculateFormPart(formPart) {
    return {
      id: formPart.id,
      name: formPart.name,
      type: formPart.type,
      sectionId: formPart.sectionId,
      zeta: Number(formPart.zeta || 0),
      pressureLoss: this.round(Number(formPart.pressureLoss || 0))
    };
  }

  static calculateSpecialComponent(component) {
    return {
      id: component.id,
      name: component.name,
      type: component.type,
      manufacturer: component.manufacturer,
      pressureLoss: this.round(Number(component.pressureLoss || 0))
    };
  }

  static sumPressureLoss(items) {
    return items.reduce((sum, item) => {
      return sum + Number(item.pressureLoss || 0);
    }, 0);
  }

  static round(value, digits = 3) {
    const factor = 10 ** digits;
    return Math.round(Number(value || 0) * factor) / factor;
  }
}