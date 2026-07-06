import { calculateProject } from "../core/CalculationEngine.js";
import ValidationEngine from "../validation/ValidationEngine.js";
import { createDefaultFormPartRegistry } from "../formteile/FormPartRegistry.js";

export default class ProjectCalculationService {
  static getDefaultSystem(project = {}) {
    return project.systems?.[0] || null;
  }

  static getFormPartRegistry() {
    if (!ProjectCalculationService.formPartRegistry) {
      ProjectCalculationService.formPartRegistry = createDefaultFormPartRegistry();
    }

    return ProjectCalculationService.formPartRegistry;
  }

  static updateFormPartZetas(formParts = []) {
    const registry = ProjectCalculationService.getFormPartRegistry();

    formParts.forEach(formPart => {
      if (!formPart?.type || !registry.exists(formPart.type)) return;

      const entry = registry.get(formPart.type);
      if (typeof entry?.calculate !== 'function') return;

      const values = registry.normalizeValues(formPart.type, formPart);
      const result = registry.calculate(formPart.type, values);

      formPart.zeta = Number(result?.zeta ?? 0);
      formPart.calculationResult = result;
    });

    return formParts;
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
          formParts: ProjectCalculationService.updateFormPartZetas(system.formParts || []),
          specialComponents: system.specialComponents || [],
        }
      : {
          settings: project.settings || {},
          sections: project.sections || [],
          formParts: ProjectCalculationService.updateFormPartZetas(project.formParts || []),
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