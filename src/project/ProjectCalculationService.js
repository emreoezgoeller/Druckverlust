import { calculateProject } from "../core/CalculationEngine.js";
import ValidationEngine from "../validation/ValidationEngine.js";

export default class ProjectCalculationService {
  static getDefaultSystem(project = {}) {
    return project.systems?.[0] || null;
  }

  static calculate(project = {}, systemId = null) {
    const validation = ValidationEngine.validateProject(project);

    const system = systemId
      ? project.systems?.find(s => s.id === systemId)
      : ProjectCalculationService.getDefaultSystem(project);

    const calculationInput = system
      ? {
          settings: project.settings || {},
          sections: system.sections || [],
          formParts: system.formParts || [],
          specialComponents: system.specialComponents || [],
        }
      : {
          settings: project.settings || {},
          sections: project.sections || [],
          formParts: project.formParts || [],
          specialComponents: project.specialComponents || [],
        };

    const calculation = calculateProject(calculationInput);

    return {
      project,
      system,
      validation,
      calculation,
      timestamp: new Date().toISOString(),
    };
  }
}