import { calculateProject } from "../core/CalculationEngine.js";
import ValidationEngine from "../validation/ValidationEngine.js";
import { createDefaultFormPartRegistry } from "../formteile/FormPartRegistry.js?v=51.20&release=53.00";
import { analyzeSystemVelocityCompliance } from "../standards/SiaVelocityCompliance.js?v=51.20";

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


  static normalizeProjectFormPartTypes(project = {}) {
    const registry = ProjectCalculationService.getFormPartRegistry();

    (project.systems || []).forEach(system => {
      (system.formParts || []).forEach(formPart => {
        if (typeof registry.normalizeFormPart === 'function') {
          registry.normalizeFormPart(formPart);
        }
      });
    });

    return project;
  }

  static updateFormPartZetas(formParts = []) {
    const registry = ProjectCalculationService.getFormPartRegistry();
    const warnings = [];
    const errors = [];

    formParts.forEach(formPart => {
      const entry = typeof registry.normalizeFormPart === 'function'
        ? registry.normalizeFormPart(formPart)
        : registry.get(formPart?.type);

      if (!entry) {
        const label = formPart?.name || formPart?.type || formPart?.id || '-';
        errors.push(`Formteiltyp nicht gefunden: ${label}`);
        formPart.calculationResult = {
          id: formPart?.type || null,
          name: label,
          zeta: Number(formPart?.zeta ?? 0),
          warnings: [`Formteiltyp nicht gefunden: ${label}`],
        };
        return;
      }

      const values = typeof registry.deriveValues === 'function'
        ? registry.deriveValues(entry.id, formPart)
        : registry.normalizeValues(entry.id, formPart);

      Object.assign(formPart, values);

      if (typeof entry?.calculate !== 'function') {
        warnings.push(`Formteil "${entry.name}" besitzt noch keinen Calculator.`);
        return;
      }

      try {
        const result = registry.calculate(entry.id, values);

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

  static createQualitySummary(validation = {}, calculation = {}, formPartUpdate = {}, velocityCompliance = null) {
    const calculationWarnings = (calculation?.totals?.warnings || [])
      .map(item => item?.message || item)
      .filter(Boolean);

    const complianceWarnings = velocityCompliance?.messages || [];

    const warnings = uniqueMessages([
      ...(validation.warnings || []),
      ...(formPartUpdate.warnings || []),
      ...calculationWarnings,
      ...complianceWarnings,
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
    ProjectCalculationService.normalizeProjectFormPartTypes(project);

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
    const velocityCompliance = analyzeSystemVelocityCompliance(system || {}, calculation);
    const quality = ProjectCalculationService.createQualitySummary(validation, calculation, formPartUpdate, velocityCompliance);

    return {
      project: {
        id: project.id || project.meta?.id || null,
        name: project.name || project.project?.name || 'Projekt',
      },
      system,
      validation,
      calculation,
      velocityCompliance,
      quality,
      timestamp: new Date().toISOString(),
    };
  }
}
