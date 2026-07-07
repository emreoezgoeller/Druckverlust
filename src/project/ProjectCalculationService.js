import { calculateProject } from "../core/CalculationEngine.js";
import ValidationEngine from "../validation/ValidationEngine.js";
import { createDefaultFormPartRegistry } from "../formteile/FormPartRegistry.js";

function uniqueMessages(messages = []) {
  return [...new Set(messages.map(message => String(message || '').trim()).filter(Boolean))];
}

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
    const warnings = [];
    const errors = [];

    formParts.forEach(formPart => {
      if (!formPart?.type) {
        warnings.push(`Formteil "${formPart?.name || formPart?.id || '-'}" hat keinen Typ.`);
        return;
      }

      if (!registry.exists(formPart.type)) {
        errors.push(`Formteiltyp nicht gefunden: ${formPart.type}`);
        formPart.calculationResult = {
          id: formPart.type,
          name: formPart.name || formPart.type,
          zeta: Number(formPart.zeta ?? 0),
          warnings: [`Formteiltyp nicht gefunden: ${formPart.type}`],
        };
        return;
      }

      const entry = registry.get(formPart.type);
      const values = typeof registry.deriveValues === 'function'
        ? registry.deriveValues(formPart.type, formPart)
        : registry.normalizeValues(formPart.type, formPart);

      Object.assign(formPart, values);

      if (typeof entry?.calculate !== 'function') {
        warnings.push(`Formteil "${entry.name}" besitzt noch keinen Calculator.`);
        return;
      }

      try {
        const result = registry.calculate(formPart.type, values);

        formPart.zeta = Number(result?.zeta ?? 0);
        formPart.calculationResult = result;

        const calculation = result?.calculation || {};
        const pressureLossPa = Number(calculation.pressureLossPa ?? 0);

        if (calculation.lossMode === 'direct' && Number.isFinite(pressureLossPa) && pressureLossPa !== 0) {
          formPart.lossMode = 'direct';
          formPart.pressureLossPa = pressureLossPa;
        } else {
          delete formPart.lossMode;
          delete formPart.pressureLossPa;
        }
      } catch (error) {
        const message = error?.message || String(error);
        errors.push(`Formteil "${formPart.name || entry.name}" konnte nicht berechnet werden: ${message}`);

        formPart.calculationResult = {
          id: entry.id,
          name: entry.name,
          category: entry.category,
          zeta: Number(formPart.zeta ?? 0),
          warnings: [message],
        };

        delete formPart.lossMode;
        delete formPart.pressureLossPa;
      }
    });

    return {
      formParts,
      warnings: uniqueMessages(warnings),
      errors: uniqueMessages(errors),
    };
  }

  static createQualitySummary(validation = {}, calculation = {}, formPartUpdate = {}) {
    const calculationWarnings = (calculation?.totals?.warnings || [])
      .map(item => item?.message || item)
      .filter(Boolean);

    const warnings = uniqueMessages([
      ...(validation.warnings || []),
      ...(formPartUpdate.warnings || []),
      ...calculationWarnings,
    ]);

    const errors = uniqueMessages([
      ...(validation.errors || []),
      ...(formPartUpdate.errors || []),
    ]);

    return {
      status: errors.length ? 'error' : warnings.length ? 'warning' : 'ok',
      warningCount: warnings.length,
      errorCount: errors.length,
      warnings,
      errors,
    };
  }

  static calculate(project = {}, systemId = null) {
    const validation = ValidationEngine.validateProject(project);

    const system = systemId
      ? project.systems?.find(s => s.id === systemId)
      : ProjectCalculationService.getDefaultSystem(project);

    const source = system || project;
    const formPartUpdate = ProjectCalculationService.updateFormPartZetas(source.formParts || []);

    const calculationInput = {
      settings: project.settings || {},
      sections: source.sections || [],
      formParts: formPartUpdate.formParts,
      specialComponents: source.specialComponents || [],
    };

    const calculation = calculateProject(calculationInput);
    const quality = ProjectCalculationService.createQualitySummary(validation, calculation, formPartUpdate);

    return {
      project: {
        id: project.id || project.meta?.id || null,
        name: project.name || project.project?.name || 'Projekt',
      },
      system,
      validation,
      calculation,
      quality,
      timestamp: new Date().toISOString(),
    };
  }
}
