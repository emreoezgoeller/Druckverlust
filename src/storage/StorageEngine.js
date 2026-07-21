// Druckverlust Pro – Phase 55.00
// Stabiles .dvp-Dateiformat mit kontrollierter Rückwärtskompatibilität.

import { APP_NAME, APP_RELEASE, APP_VERSION } from '../core/appVersion.js';
import { calculateSection } from '../core/CalculationEngine.js';
import { dimensionToMetres, isPipeSection } from '../sections/SectionSizingAssistant.js';
import { getSiaOperationMode, getSiaRoomUsage } from '../standards/SiaVelocityCompliance.js';
import ProjectMigrationEngine, {
  CURRENT_PROJECT_SCHEMA_VERSION,
  ProjectFileError,
} from './ProjectMigrationEngine.js';

export const PROJECT_FILE_TYPE = 'DruckverlustPro';
export const PROJECT_FILE_SCHEMA_VERSION = CURRENT_PROJECT_SCHEMA_VERSION;
export { ProjectFileError };

const CONNECTION_SECTION_FIELDS = Object.freeze([
  'transitionOtherSectionId',
  'throughSectionId',
  'branchSectionId',
]);

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function toOptionalId(value) {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  return String(value).trim();
}

function createId(prefix, index = 0) {
  return `${prefix}-${Date.now()}-${index + 1}`;
}

function cloneForStorage(value) {
  const seen = new WeakSet();

  return JSON.parse(JSON.stringify(value, (key, item) => {
    if (
      key === 'calculationResult'
      || key === 'calculation'
      || key === 'validation'
      || key === '_importInfo'
      || key === '_migrationSource'
    ) {
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

function addSummaryWarning(warnings, count, singular, plural = `${singular}en`) {
  if (!count) return;
  warnings.push(`${count} ${count === 1 ? singular : plural} wurde${count === 1 ? '' : 'n'} automatisch ergänzt.`);
}

function normalizeSectionType(section = {}) {
  return isPipeSection(section) || section.d || section.diameter ? 'pipe' : 'duct';
}

function normalizeSiaConfig(system = {}, stats, warnings) {
  const source = isPlainObject(system.siaVelocity) ? system.siaVelocity : {};
  const rawRoomUsageCode = String(
    source.roomUsageCode
    ?? system.siaRoomUsageCode
    ?? system.roomUsageCode
    ?? '',
  ).trim();
  const rawOperationMode = String(
    source.operationMode
    ?? system.siaOperationMode
    ?? system.operationMode
    ?? '',
  ).trim();

  const validRoomUsageCode = rawRoomUsageCode && getSiaRoomUsage(rawRoomUsageCode)
    ? rawRoomUsageCode
    : '';
  const validOperationMode = rawOperationMode && getSiaOperationMode(rawOperationMode)
    ? rawOperationMode
    : '';

  if (!rawRoomUsageCode || !rawOperationMode) {
    stats.defaultedSiaSystems += 1;
  }
  if (rawRoomUsageCode && !validRoomUsageCode) {
    stats.invalidSiaValues += 1;
    warnings.push(`Anlage „${system.name || 'Unbenannt'}“: unbekannte SIA-Raumnutzung „${rawRoomUsageCode}“ wurde nicht für die Geschwindigkeitsprüfung übernommen.`);
  }
  if (rawOperationMode && !validOperationMode) {
    stats.invalidSiaValues += 1;
    warnings.push(`Anlage „${system.name || 'Unbenannt'}“: unbekannte Betriebsart „${rawOperationMode}“ wurde nicht für die Geschwindigkeitsprüfung übernommen.`);
  }

  return {
    roomUsageCode: validRoomUsageCode,
    operationMode: validOperationMode,
  };
}

function normalizeAssignmentField(target, field, sectionIds, stats, warnings, label, options = {}) {
  const rawValue = toOptionalId(target[field]);
  const emptyValue = Object.prototype.hasOwnProperty.call(options, 'emptyValue') ? options.emptyValue : '';

  if (!rawValue) {
    target[field] = emptyValue;
    return;
  }

  if (sectionIds.has(rawValue)) {
    target[field] = rawValue;
    stats.preservedAssignments += 1;
    return;
  }

  target[field] = emptyValue;
  stats.clearedAssignments += 1;
  warnings.push(`${label} hatte eine ungültige Teilstrecken-Zuordnung „${rawValue}“. Die Zuordnung wurde geleert.`);
}

export function normalizeProjectForStorage(projectInput = {}, context = {}) {
  const warnings = [];
  const source = isPlainObject(projectInput) ? cloneForStorage(projectInput) : {};
  const stats = {
    defaultedRoughnessSections: 0,
    defaultedSiaSystems: 0,
    invalidSiaValues: 0,
    preservedAssignments: 0,
    clearedAssignments: 0,
    convertedMillimetreDimensions: 0,
    correctedDuplicateIds: 0,
  };

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

  const sourceSettings = isPlainObject(project.settings) ? project.settings : {};
  project.settings = {
    ...sourceSettings,
    rho: toNumber(sourceSettings.rho, 1.21),
    defaultRoughnessMm: Math.max(0, toNumber(sourceSettings.defaultRoughnessMm, 0.15)),
    kinematicViscosity: Math.max(0, toNumber(sourceSettings.kinematicViscosity, 0.0000151)),
    sectionRoundingStep: Math.max(0, toNumber(sourceSettings.sectionRoundingStep, 0.5)),
  };

  if ('lambda' in project.settings || 'legacyLambda' in project.settings) {
    warnings.push('Ein alter globaler λ-Wert wurde verworfen; λ wird jetzt je Teilstrecke automatisch berechnet.');
  }
  delete project.settings.lambda;
  delete project.settings.legacyLambda;
  delete project.settings.frictionFactorMode;

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
      stats.correctedDuplicateIds += 1;
    }

    usedSystemIds.add(systemId);
    system.id = systemId;
    system.name = String(system.name ?? system.anlage ?? project.meta?.anlage ?? project.report?.anlage ?? `Anlage ${systemIndex + 1}`).trim() || `Anlage ${systemIndex + 1}`;
    system.type = system.type || 'Zuluft';
    system.siaVelocity = normalizeSiaConfig(system, stats, warnings);
    delete system.siaRoomUsageCode;
    delete system.siaOperationMode;
    delete system.roomUsageCode;
    delete system.operationMode;

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
        stats.correctedDuplicateIds += 1;
      }

      usedSectionIds.add(sectionId);
      section.id = sectionId;
      section.name = String(section.name || `ts${sectionIndex + 1}`).trim() || `ts${sectionIndex + 1}`;
      section.type = normalizeSectionType(section);
      section.description = String(section.description || '').trim();
      section.q = Math.max(0, toNumber(section.q ?? section.volumeFlow ?? section.airVolume, 0));
      section.l = Math.max(0, toNumber(section.l ?? section.length, 0));

      const rawB = toNumber(section.b ?? section.width, 0);
      const rawH = toNumber(section.h ?? section.height, 0);
      const rawD = toNumber(section.d ?? section.diameter, 0);
      section.b = dimensionToMetres(rawB);
      section.h = dimensionToMetres(rawH);
      section.d = dimensionToMetres(rawD);
      if ([rawB, rawH, rawD].some(value => value >= 10)) stats.convertedMillimetreDimensions += 1;

      const hasRoughness = [section.roughnessMm, section.roughness, section.k, section.epsilonMm].some(value => value !== undefined && value !== null && String(value).trim() !== '');
      section.roughnessMm = Math.max(0, toNumber(
        section.roughnessMm ?? section.roughness ?? section.k ?? section.epsilonMm,
        project.settings.defaultRoughnessMm,
      ));
      if (!hasRoughness) stats.defaultedRoughnessSections += 1;

      delete section.roughness;
      delete section.k;
      delete section.epsilonMm;
      delete section.lambda;
      delete section.width;
      delete section.height;
      delete section.diameter;
      delete section.length;
      delete section.volumeFlow;
      delete section.airVolume;
      section.zetaSum = toNumber(section.zetaSum, 0);
      return section;
    });

    const sectionIds = new Set(system.sections.map(section => String(section.id)));

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
        stats.correctedDuplicateIds += 1;
      }

      usedFormPartIds.add(formPartId);
      formPart.id = formPartId;
      formPart.name = String(formPart.name || `Formteil ${formPartIndex + 1}`).trim() || `Formteil ${formPartIndex + 1}`;
      formPart.type = String(formPart.type || formPart.formPartType || 'kreis_bogen');
      formPart.zeta = toNumber(formPart.zeta, 0);

      normalizeAssignmentField(
        formPart,
        'sectionId',
        sectionIds,
        stats,
        warnings,
        `Formteil „${formPart.name}“`,
        { emptyValue: null },
      );

      CONNECTION_SECTION_FIELDS.forEach(field => {
        normalizeAssignmentField(
          formPart,
          field,
          sectionIds,
          stats,
          warnings,
          `Formteil „${formPart.name}“ (${field})`,
          { emptyValue: '' },
        );
      });

      const sourceSection = formPart.sectionId
        ? system.sections.find(section => String(section.id) === String(formPart.sectionId))
        : null;
      if (sourceSection) {
        const sectionResult = calculateSection(sourceSection, { settings: project.settings });
        formPart.sectionRoughnessMm = toNumber(sectionResult.roughnessMm, sourceSection.roughnessMm);
        formPart.sectionFrictionFactor = toNumber(sectionResult.frictionFactor ?? sectionResult.lambda, 0);
        formPart.sectionReynoldsNumber = toNumber(sectionResult.reynoldsNumber, 0);
        formPart.frictionSourceSectionId = sourceSection.id;
      } else {
        delete formPart.sectionRoughnessMm;
        delete formPart.sectionFrictionFactor;
        delete formPart.sectionReynoldsNumber;
        delete formPart.frictionSourceSectionId;
      }

      delete formPart.formPartType;
      delete formPart.teilstreckeId;
      delete formPart.section_id;
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
        stats.correctedDuplicateIds += 1;
      }

      usedSpecialIds.add(componentId);
      component.id = componentId;
      component.name = String(component.name || `Sonderbauteil ${componentIndex + 1}`).trim() || `Sonderbauteil ${componentIndex + 1}`;
      component.type = component.type || component.componentType || 'Freie Komponente';
      component.quantity = Math.max(1, toNumber(component.quantity ?? component.count, 1));
      component.unitPressureLoss = toNumber(component.unitPressureLoss ?? component.singlePressureLoss ?? component.dpUnit ?? component.pressureLoss, 0);
      component.pressureLoss = toNumber(component.unitPressureLoss * component.quantity, 0);
      component.pa = component.pressureLoss;

      normalizeAssignmentField(
        component,
        'sectionId',
        sectionIds,
        stats,
        warnings,
        `Sonderbauteil „${component.name}“`,
        { emptyValue: '' },
      );

      delete component.componentType;
      delete component.count;
      delete component.singlePressureLoss;
      delete component.dpUnit;
      delete component.teilstreckeId;
      delete component.section_id;
      return component;
    });

    delete system.teilstrecken;
    delete system.formteile;
    delete system.sonderbauteile;
    return system;
  });

  if (stats.defaultedRoughnessSections) {
    warnings.push(`${stats.defaultedRoughnessSections} ${stats.defaultedRoughnessSections === 1 ? 'Teilstrecke' : 'Teilstrecken'} ohne Rauigkeit ${stats.defaultedRoughnessSections === 1 ? 'wurde' : 'wurden'} mit 0,15 mm ergänzt.`);
  }
  if (stats.defaultedSiaSystems) {
    warnings.push(`${stats.defaultedSiaSystems} Anlage(n) hatten keine vollständige SIA-Raumnutzung/Betriebsart. Die Geschwindigkeitsprüfung bleibt dort bewusst „nicht konfiguriert“, bis die Angaben gewählt werden.`);
  }
  if (stats.convertedMillimetreDimensions) {
    warnings.push(`${stats.convertedMillimetreDimensions} Teilstrecken-Geometrie(n) wurden aus historischen Millimeterwerten in Meter umgerechnet.`);
  }

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

  delete project.anlagen;
  delete project.teilstrecken;
  delete project.formteile;
  delete project.sonderbauteile;
  delete project.projectNumber;
  delete project.projectName;
  delete project.projektnummer;
  delete project.projektname;
  delete project.bearbeiter;
  delete project.firma;
  delete project.adresse;
  delete project.hinweis;
  delete project._migrationSource;

  const migration = context.migration || null;
  const info = {
    schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
    sourceSchemaVersion: migration?.sourceSchemaVersion || context.schemaVersion || PROJECT_FILE_SCHEMA_VERSION,
    targetSchemaVersion: PROJECT_FILE_SCHEMA_VERSION,
    appVersion: context.appVersion || APP_VERSION,
    appRelease: context.appRelease || APP_RELEASE,
    importedAt: context.importedAt || new Date().toISOString(),
    fileName: context.fileName || '',
    warnings,
    summary: countProjectObjects(project),
    migrationRequired: Boolean(migration?.requiresMigration),
    migrationSteps: migration?.steps || [],
    sourceFormat: migration?.format || 'current-project',
    sourceAppVersion: migration?.sourceAppVersion || '',
    sourceAppRelease: migration?.sourceAppRelease || '',
    backupFileName: context.backupFileName || migration?.backupFileName || '',
    backupCreated: Boolean(context.backupCreated),
    migrationStats: stats,
  };

  return { project: attachImportInfo(project, info), warnings, info, stats };
}

function formatProjectFileError(error) {
  if (error instanceof ProjectFileError) return error;
  return new ProjectFileError(
    'UNKNOWN_IMPORT_ERROR',
    'Projektdatei konnte nicht verarbeitet werden.',
    {
      details: error?.message || String(error),
      recovery: ['Verwende eine unveränderte Sicherungskopie oder exportiere das Projekt erneut.'],
      cause: error,
    },
  );
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
      if (
        key === '_importInfo'
        || key === '_migrationSource'
        || key === 'calculationResult'
        || key === 'calculation'
        || key === 'validation'
      ) {
        return undefined;
      }

      return value;
    }, 2);
  }

  static prepareImport(text, options = {}) {
    try {
      return ProjectMigrationEngine.prepare(text, options);
    } catch (error) {
      throw formatProjectFileError(error);
    }
  }

  static parse(text, options = {}) {
    let prepared;
    try {
      prepared = this.prepareImport(text, options);
      let backupCreated = false;

      if (prepared.plan.requiresMigration && typeof options.onBeforeMigration === 'function') {
        options.onBeforeMigration({
          ...prepared.backup,
          plan: prepared.plan,
        });
        backupCreated = true;
      }

      const adaptedProject = ProjectMigrationEngine.adapt(prepared.project, prepared.plan);
      const { project, warnings, info } = normalizeProjectForStorage(adaptedProject, {
        schemaVersion: prepared.plan.sourceSchemaVersion,
        appVersion: prepared.plan.sourceAppVersion,
        appRelease: prepared.plan.sourceAppRelease,
        importedAt: new Date().toISOString(),
        fileName: options.fileName || '',
        migration: prepared.plan,
        backupFileName: prepared.backup.fileName,
        backupCreated,
      });

      info.exportedAt = prepared.plan.sourceExportedAt || '';
      info.normalizedWarnings = warnings;
      return attachImportInfo(project, info);
    } catch (error) {
      throw formatProjectFileError(error);
    }
  }

  static inspect(project) {
    const { project: normalizedProject, warnings, info } = normalizeProjectForStorage(project, {
      schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      appRelease: APP_RELEASE,
    });

    const serialized = this.serialize(normalizedProject);
    const jsonSizeBytes = typeof Blob !== 'undefined'
      ? new Blob([serialized]).size
      : new TextEncoder().encode(serialized).length;

    return {
      ...info,
      warnings,
      fileName: this.createFileName(normalizedProject),
      summary: countProjectObjects(normalizedProject),
      jsonSizeBytes,
    };
  }

  static createFileName(project, fallback = 'Druckverlust-Projekt') {
    const name = project?.name || project?.meta?.name || project?.object || fallback;
    const safeName = String(name)
      .replace(/[^\wäöüÄÖÜß-]+/g, '_')
      .replace(/[<>:"/\\|?*]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 80);

    return `${safeName || fallback}${this.extension}`;
  }

  static downloadText(text, fileName, mimeType = 'application/json') {
    if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
      return { text: String(text ?? ''), fileName: String(fileName || 'Druckverlust-Projekt.dvp'), mimeType };
    }

    const blob = new Blob([String(text ?? '')], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = String(fileName || 'Druckverlust-Projekt.dvp');
    link.click();
    URL.revokeObjectURL(link.href);
    return { fileName: link.download, size: blob.size, mimeType };
  }

  static download(project) {
    if (!project) {
      throw new Error('Kein Projekt zum Speichern vorhanden.');
    }
    return this.downloadText(this.serialize(project), this.createFileName(project));
  }

  static openFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new ProjectFileError('NO_FILE', 'Keine Datei ausgewählt.'));
        return;
      }

      const fileName = file.name || '';
      const lowerFileName = fileName.toLowerCase();
      const isDvp = lowerFileName.endsWith(this.extension);
      const isJson = lowerFileName.endsWith('.json');

      if (fileName && !isDvp && !isJson) {
        reject(new ProjectFileError(
          'INVALID_EXTENSION',
          'Bitte eine .dvp-Projektdatei auswählen.',
          { fileName, details: `Ausgewählt wurde: ${fileName}` },
        ));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        reject(new ProjectFileError(
          'FILE_TOO_LARGE',
          'Die Projektdatei ist ungewöhnlich gross.',
          {
            fileName,
            details: `Dateigrösse: ${(file.size / 1024 / 1024).toFixed(1)} MB; zulässig sind maximal 10 MB.`,
            recovery: ['Prüfe, ob wirklich eine .dvp-Datei ausgewählt wurde.'],
          },
        ));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(this.parse(reader.result, { ...options, fileName }));
        } catch (error) {
          reject(formatProjectFileError(error));
        }
      };
      reader.onerror = () => reject(new ProjectFileError(
        'FILE_READ_ERROR',
        'Die Projektdatei konnte vom Browser nicht gelesen werden.',
        { fileName, details: reader.error?.message || '' },
      ));
      reader.readAsText(file, 'utf-8');
    });
  }

  static readFile(file, options = {}) {
    return this.openFile(file, options);
  }
}

export default StorageEngine;
