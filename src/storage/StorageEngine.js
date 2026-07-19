import { APP_NAME, APP_RELEASE, APP_VERSION } from '../core/appVersion.js';

export const PROJECT_FILE_TYPE = 'DruckverlustPro';
export const PROJECT_FILE_SCHEMA_VERSION = '1.1.0';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function createId(prefix, index = 0) {
  return `${prefix}-${Date.now()}-${index + 1}`;
}

function cloneForStorage(value) {
  const seen = new WeakSet();

  return JSON.parse(JSON.stringify(value, (key, item) => {
    if (key === 'calculationResult' || key === 'calculation' || key === 'validation' || key === '_importInfo') {
      return undefined;
    }

    if (typeof item === 'object' && item !== null) {
      if (seen.has(item)) return undefined;
      seen.add(item);
    }

    return item;
  }));
}

function countProjectObjects(project = {}) {
  const systems = Array.isArray(project.systems) ? project.systems : [];
  return systems.reduce((summary, system) => {
    summary.systems += 1;
    summary.sections += Array.isArray(system.sections) ? system.sections.length : 0;
    summary.formParts += Array.isArray(system.formParts) ? system.formParts.length : 0;
    summary.specialComponents += Array.isArray(system.specialComponents) ? system.specialComponents.length : 0;
    return summary;
  }, {
    systems: 0,
    sections: 0,
    formParts: 0,
    specialComponents: 0,
  });
}

function attachImportInfo(project, info) {
  try {
    Object.defineProperty(project, '_importInfo', {
      value: info,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  } catch {
    project._importInfo = info;
  }

  return project;
}

export function normalizeProjectForStorage(projectInput = {}, context = {}) {
  const warnings = [];
  const source = isPlainObject(projectInput) ? cloneForStorage(projectInput) : {};

  if (!isPlainObject(projectInput)) {
    warnings.push('Projektinhalt war leer oder nicht lesbar und wurde als neues Projektgerüst normalisiert.');
  }

  const project = source;
  project.id = project.id || createId('project');
  project.name = String(project.name ?? project.projectNumber ?? project.title ?? project.meta?.name ?? project.report?.project ?? 'Unbenannte Projektnummer').trim() || 'Unbenannte Projektnummer';
  project.object = String(project.object ?? project.projectName ?? project.meta?.object ?? project.report?.object ?? '').trim();
  project.author = String(project.author ?? project.bearbeiter ?? project.meta?.bearbeiter ?? project.report?.bearbeiter ?? '').trim();
  project.company = String(project.company ?? project.meta?.company ?? project.report?.company ?? '').trim();
  project.address = String(project.address ?? project.meta?.address ?? project.report?.address ?? '').trim();
  project.note = String(project.note ?? project.meta?.note ?? project.report?.hinweis ?? '').trim();
  project.settings = {
    rho: toNumber(project.settings?.rho, 1.21),
    lambda: toNumber(project.settings?.lambda, 0.025),
    sectionRoundingStep: toNumber(project.settings?.sectionRoundingStep, 0.5),
    ...(isPlainObject(project.settings) ? project.settings : {}),
  };

  if (!Array.isArray(project.systems) || project.systems.length === 0) {
    warnings.push('Keine Anlage gefunden. Eine leere Anlage wurde ergänzt.');
    project.systems = [{ id: createId('system'), name: project.meta?.anlage || project.report?.anlage || 'Zuluftanlage' }];
  }

  const usedSystemIds = new Set();
  project.systems = project.systems.map((systemInput, systemIndex) => {
    const system = isPlainObject(systemInput) ? systemInput : {};
    const fallbackId = createId('system', systemIndex);
    let systemId = String(system.id || fallbackId);

    if (usedSystemIds.has(systemId)) {
      warnings.push(`Doppelte Anlagen-ID „${systemId}“ wurde korrigiert.`);
      systemId = `${systemId}-${systemIndex + 1}`;
    }

    usedSystemIds.add(systemId);
    system.id = systemId;
    system.name = String(system.name ?? system.anlage ?? project.meta?.anlage ?? project.report?.anlage ?? `Anlage ${systemIndex + 1}`).trim() || `Anlage ${systemIndex + 1}`;
    system.type = system.type || 'Zuluft';

    if (!Array.isArray(system.sections)) {
      warnings.push(`Anlage „${system.name}“ hatte keine Teilstreckenliste. Eine leere Liste wurde ergänzt.`);
      system.sections = [];
    }

    const usedSectionIds = new Set();
    system.sections = system.sections.map((sectionInput, sectionIndex) => {
      const section = isPlainObject(sectionInput) ? sectionInput : {};
      let sectionId = String(section.id || `${system.id}-ts${sectionIndex + 1}`);

      if (usedSectionIds.has(sectionId)) {
        warnings.push(`Doppelte Teilstrecken-ID „${sectionId}“ wurde korrigiert.`);
        sectionId = `${sectionId}-${sectionIndex + 1}`;
      }

      usedSectionIds.add(sectionId);
      section.id = sectionId;
      section.name = String(section.name || `ts${sectionIndex + 1}`).trim() || `ts${sectionIndex + 1}`;
      section.type = section.type === 'pipe' || section.d || section.diameter ? 'pipe' : 'duct';
      section.description = String(section.description || '').trim();
      section.q = toNumber(section.q ?? section.volumeFlow ?? section.airVolume, 0);
      section.l = toNumber(section.l ?? section.length, 0);
      section.b = toNumber(section.b ?? section.width, 0);
      section.h = toNumber(section.h ?? section.height, 0);
      section.d = toNumber(section.d ?? section.diameter, 0);
      section.zetaSum = toNumber(section.zetaSum, 0);
      return section;
    });

    const sectionIds = new Set(system.sections.map(section => section.id));

    if (!Array.isArray(system.formParts)) {
      warnings.push(`Anlage „${system.name}“ hatte keine Formteilliste. Eine leere Liste wurde ergänzt.`);
      system.formParts = [];
    }

    const usedFormPartIds = new Set();
    system.formParts = system.formParts.map((formPartInput, formPartIndex) => {
      const formPart = isPlainObject(formPartInput) ? formPartInput : {};
      let formPartId = String(formPart.id || `${system.id}-formpart-${formPartIndex + 1}`);

      if (usedFormPartIds.has(formPartId)) {
        warnings.push(`Doppelte Formteil-ID „${formPartId}“ wurde korrigiert.`);
        formPartId = `${formPartId}-${formPartIndex + 1}`;
      }

      usedFormPartIds.add(formPartId);
      formPart.id = formPartId;
      formPart.name = String(formPart.name || `Formteil ${formPartIndex + 1}`).trim() || `Formteil ${formPartIndex + 1}`;
      formPart.type = String(formPart.type || formPart.formPartType || 'kreis_bogen');
      formPart.zeta = toNumber(formPart.zeta, 0);

      if (formPart.sectionId && !sectionIds.has(formPart.sectionId)) {
        warnings.push(`Formteil „${formPart.name}“ hatte eine ungültige Teilstrecken-Zuordnung. Die Zuordnung wurde geleert.`);
        formPart.sectionId = null;
      }

      return formPart;
    });

    if (!Array.isArray(system.specialComponents)) {
      warnings.push(`Anlage „${system.name}“ hatte keine Sonderbauteilliste. Eine leere Liste wurde ergänzt.`);
      system.specialComponents = [];
    }

    const usedSpecialIds = new Set();
    system.specialComponents = system.specialComponents.map((componentInput, componentIndex) => {
      const component = isPlainObject(componentInput) ? componentInput : {};
      let componentId = String(component.id || `${system.id}-special-${componentIndex + 1}`);

      if (usedSpecialIds.has(componentId)) {
        warnings.push(`Doppelte Sonderbauteil-ID „${componentId}“ wurde korrigiert.`);
        componentId = `${componentId}-${componentIndex + 1}`;
      }

      usedSpecialIds.add(componentId);
      component.id = componentId;
      component.name = String(component.name || `Sonderbauteil ${componentIndex + 1}`).trim() || `Sonderbauteil ${componentIndex + 1}`;
      component.type = component.type || component.componentType || 'Freie Komponente';
      component.quantity = Math.max(1, toNumber(component.quantity ?? component.count, 1));
      component.unitPressureLoss = toNumber(component.unitPressureLoss ?? component.singlePressureLoss ?? component.dpUnit ?? component.pressureLoss, 0);
      component.pressureLoss = toNumber(component.unitPressureLoss * component.quantity, 0);
      component.pa = component.pressureLoss;

      if (component.sectionId && !sectionIds.has(component.sectionId)) {
        warnings.push(`Sonderbauteil „${component.name}“ hatte eine ungültige Teilstrecken-Zuordnung. Die Zuordnung wurde geleert.`);
        component.sectionId = '';
      }

      return component;
    });

    return system;
  });

  const firstSystem = project.systems[0] || {};
  const anlage = String(project.meta?.anlage ?? project.report?.anlage ?? firstSystem.name ?? 'Zuluftanlage').trim() || 'Zuluftanlage';
  const anlageNumber = String(project.anlageNumber ?? project.meta?.anlageNumber ?? project.report?.anlageNumber ?? '').trim();
  const datum = String(project.report?.datum ?? new Date().toISOString().slice(0, 10));

  project.anlageNumber = anlageNumber;
  project.meta = {
    ...(isPlainObject(project.meta) ? project.meta : {}),
    name: project.name,
    object: project.object,
    anlageNumber,
    anlage,
    bearbeiter: project.author,
    company: project.company,
    address: project.address,
    note: project.note,
  };
  project.report = {
    ...(isPlainObject(project.report) ? project.report : {}),
    project: project.name,
    object: project.object,
    anlageNumber,
    anlage,
    bearbeiter: project.author,
    company: project.company,
    address: project.address,
    hinweis: project.note,
    datum,
  };

  const info = {
    schemaVersion: context.schemaVersion || PROJECT_FILE_SCHEMA_VERSION,
    appVersion: context.appVersion || APP_VERSION,
    appRelease: context.appRelease || APP_RELEASE,
    importedAt: context.importedAt || new Date().toISOString(),
    fileName: context.fileName || '',
    warnings,
    summary: countProjectObjects(project),
  };

  return { project: attachImportInfo(project, info), warnings, info };
}

export class StorageEngine {
  static extension = '.dvp';
  static fileType = PROJECT_FILE_TYPE;
  static schemaVersion = PROJECT_FILE_SCHEMA_VERSION;

  static serialize(project) {
    if (!project) {
      throw new Error('Kein Projekt zum Speichern vorhanden.');
    }

    const { project: normalizedProject, warnings } = normalizeProjectForStorage(project, {
      schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      appRelease: APP_RELEASE,
    });

    const payload = {
      fileType: PROJECT_FILE_TYPE,
      schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
      appName: APP_NAME,
      appVersion: APP_VERSION,
      appRelease: APP_RELEASE,
      exportedAt: new Date().toISOString(),
      summary: countProjectObjects(normalizedProject),
      warnings: warnings.length ? warnings : undefined,
      project: normalizedProject,
    };

    return JSON.stringify(payload, (key, value) => {
      if (key === '_importInfo' || key === 'calculationResult' || key === 'calculation' || key === 'validation') {
        return undefined;
      }

      return value;
    }, 2);
  }

  static parse(text, options = {}) {
    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(`Projektdatei konnte nicht gelesen werden: ${error.message}`);
    }

    const isWrappedPayload = data?.fileType === PROJECT_FILE_TYPE && isPlainObject(data.project);
    const isLegacyRawProject = isPlainObject(data) && Array.isArray(data.systems);

    if (!isWrappedPayload && !isLegacyRawProject) {
      throw new Error('Keine gültige Druckverlust-Projektdatei. Erwartet wird eine .dvp-Datei von Druckverlust Pro.');
    }

    const sourceProject = isWrappedPayload ? data.project : data;
    const { project, warnings, info } = normalizeProjectForStorage(sourceProject, {
      schemaVersion: data.schemaVersion || (isLegacyRawProject ? 'legacy-raw-project' : PROJECT_FILE_SCHEMA_VERSION),
      appVersion: data.appVersion || '',
      appRelease: data.appRelease || '',
      importedAt: new Date().toISOString(),
      fileName: options.fileName || '',
    });

    info.exportedAt = data.exportedAt || '';
    info.normalizedWarnings = warnings;

    return attachImportInfo(project, info);
  }

  static inspect(project) {
    const { project: normalizedProject, warnings, info } = normalizeProjectForStorage(project, {
      schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      appRelease: APP_RELEASE,
    });

    return {
      ...info,
      warnings,
      fileName: this.createFileName(normalizedProject),
      summary: countProjectObjects(normalizedProject),
      jsonSizeBytes: new Blob([this.serialize(normalizedProject)]).size,
    };
  }

  static createFileName(project, fallback = 'Druckverlust-Projekt') {
    const name =
      project?.name ||
      project?.meta?.name ||
      project?.object ||
      fallback;

    const safeName = String(name)
      .replace(/[^\wäöüÄÖÜß-]+/g, '_')
      .replace(/[<>:"/\\|?*]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 80);

    return `${safeName || fallback}${this.extension}`;
  }


  static download(project) {
    if (!project) {
      throw new Error('Kein Projekt zum Speichern vorhanden.');
    }

    const json = this.serialize(project);
    const blob = new Blob([json], {
      type: 'application/json'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = this.createFileName(project);
    link.click();

    URL.revokeObjectURL(link.href);
  }

  static openFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Keine Datei ausgewählt.'));
        return;
      }

      const fileName = file.name || '';
      const isDvp = fileName.toLowerCase().endsWith(this.extension);
      const isJson = fileName.toLowerCase().endsWith('.json');

      if (fileName && !isDvp && !isJson) {
        reject(new Error('Bitte eine .dvp-Projektdatei auswählen.'));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('Die Projektdatei ist ungewöhnlich gross. Bitte prüfe, ob wirklich eine .dvp-Datei ausgewählt wurde.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try {
          resolve(this.parse(reader.result, { fileName }));
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, 'utf-8');
    });
  }

  static readFile(file) {
    return this.openFile(file);
  }
}

export default StorageEngine;
