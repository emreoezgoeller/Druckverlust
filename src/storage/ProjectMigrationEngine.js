// Druckverlust Pro – Phase 55.00
// Kontrollierte Erkennung, Sicherung und Migration älterer .dvp-Projektdateien.

export const CURRENT_PROJECT_SCHEMA_VERSION = '1.3.0';
export const LEGACY_RAW_SCHEMA = 'legacy-raw-project';

const PROJECT_FILE_TYPES = new Set([
  'druckverlustpro',
  'druckverlust-pro',
  'druckverlust pro',
]);

export class ProjectFileError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'ProjectFileError';
    this.code = code;
    this.details = options.details || '';
    this.recovery = Array.isArray(options.recovery) ? options.recovery : [];
    this.fileName = options.fileName || '';
    this.cause = options.cause;
  }

  toUserMessage() {
    return [
      this.message,
      this.details,
      this.recovery.length ? `Empfehlung: ${this.recovery.join(' ')}` : '',
    ].filter(Boolean).join('\n\n');
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(text) {
  return String(text ?? '').replace(/^\uFEFF/, '').trim();
}

function normalizeVersion(value = '') {
  const match = String(value || '').trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return '';
  return `${Number(match[1])}.${Number(match[2] || 0)}.${Number(match[3] || 0)}`;
}

export function compareSchemaVersions(left = '', right = '') {
  const a = normalizeVersion(left);
  const b = normalizeVersion(right);
  if (!a || !b) return 0;

  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (aParts[index] > bParts[index]) return 1;
    if (aParts[index] < bParts[index]) return -1;
  }
  return 0;
}

function parseJson(text, options = {}) {
  const normalized = normalizeText(text);
  if (!normalized) {
    throw new ProjectFileError(
      'EMPTY_FILE',
      'Die ausgewählte Projektdatei ist leer.',
      {
        fileName: options.fileName,
        recovery: ['Wähle eine frühere .dvp-Sicherung oder eine exportierte .dvpa-Datei.'],
      },
    );
  }

  try {
    return JSON.parse(normalized);
  } catch (error) {
    const position = String(error?.message || '').match(/position\s+(\d+)/i)?.[1];
    throw new ProjectFileError(
      'INVALID_JSON',
      'Die Projektdatei ist beschädigt oder unvollständig und kann nicht als JSON gelesen werden.',
      {
        fileName: options.fileName,
        details: position
          ? `Der Lesefehler liegt ungefähr bei Zeichen ${position}.`
          : String(error?.message || 'Unbekannter JSON-Lesefehler.'),
        recovery: [
          'Öffne die Datei nicht in einem Textprogramm und speichere sie nicht manuell um.',
          'Verwende nach Möglichkeit eine unveränderte Sicherungskopie.',
        ],
        cause: error,
      },
    );
  }
}

function looksLikeProject(value) {
  if (!isPlainObject(value)) return false;
  return [
    'systems', 'anlagen', 'sections', 'teilstrecken', 'formParts', 'formteile',
    'projectNumber', 'projectName', 'name', 'object', 'meta', 'report', 'settings',
  ].some(key => key in value);
}

function unwrapProject(data, options = {}) {
  if (!isPlainObject(data)) {
    throw new ProjectFileError(
      'INVALID_ROOT',
      'Die Projektdatei besitzt keine gültige Projektstruktur.',
      {
        fileName: options.fileName,
        details: 'Auf der obersten Ebene wurde kein Projektobjekt gefunden.',
        recovery: ['Wähle eine originale .dvp-Datei von Druckverlust Pro.'],
      },
    );
  }

  const fileType = String(data.fileType || data.type || '').trim().toLowerCase();
  const recognizedFileType = !fileType || PROJECT_FILE_TYPES.has(fileType);

  if (isPlainObject(data.project) && recognizedFileType) {
    return {
      project: data.project,
      envelope: data,
      format: 'wrapped-project',
      legacyFormat: !data.schemaVersion,
    };
  }

  // Einige frühe Entwicklungsstände verwendeten data/projectData/payload als Hülle.
  const legacyContainers = [
    ['projectData', data.projectData],
    ['data', data.data],
    ['payload', data.payload],
    ['content', data.content],
  ];

  for (const [key, candidate] of legacyContainers) {
    if (looksLikeProject(candidate)) {
      return {
        project: candidate,
        envelope: data,
        format: `legacy-wrapper:${key}`,
        legacyFormat: true,
      };
    }

    if (isPlainObject(candidate?.project) && looksLikeProject(candidate.project)) {
      return {
        project: candidate.project,
        envelope: data,
        format: `legacy-wrapper:${key}.project`,
        legacyFormat: true,
      };
    }
  }

  if (looksLikeProject(data)) {
    return {
      project: data,
      envelope: data,
      format: 'raw-project',
      legacyFormat: true,
    };
  }

  if (fileType && !recognizedFileType) {
    throw new ProjectFileError(
      'INVALID_FILE_TYPE',
      'Die Datei gehört nicht zu Druckverlust Pro.',
      {
        fileName: options.fileName,
        details: `Erkannter Dateityp: ${data.fileType || data.type}`,
        recovery: ['Wähle eine .dvp-, .dvpa- oder .dvph-Datei aus Druckverlust Pro.'],
      },
    );
  }

  throw new ProjectFileError(
    'MISSING_PROJECT_DATA',
    'Die Datei enthält keine verwertbaren Projektdaten.',
    {
      fileName: options.fileName,
      details: 'Es wurden weder Anlagen noch Teilstrecken oder Projektangaben gefunden.',
      recovery: ['Verwende eine frühere Sicherung oder exportiere das Projekt erneut aus der ursprünglichen Version.'],
    },
  );
}

function detectLegacyShape(project = {}) {
  const markers = [];
  if (Array.isArray(project.anlagen)) markers.push('anlagen');
  if (Array.isArray(project.teilstrecken)) markers.push('teilstrecken');
  if (Array.isArray(project.formteile)) markers.push('formteile');
  if (Array.isArray(project.sonderbauteile)) markers.push('sonderbauteile');
  if ('projectNumber' in project || 'projectName' in project || 'bearbeiter' in project) markers.push('alte Projektfelder');

  const systems = Array.isArray(project.systems)
    ? project.systems
    : Array.isArray(project.anlagen)
      ? project.anlagen
      : [];

  systems.forEach(system => {
    if (!isPlainObject(system)) return;
    if (Array.isArray(system.teilstrecken)) markers.push('Anlage.teilstrecken');
    if (Array.isArray(system.formteile)) markers.push('Anlage.formteile');
    if (Array.isArray(system.sonderbauteile)) markers.push('Anlage.sonderbauteile');
    if ('siaRoomUsageCode' in system || 'siaOperationMode' in system) markers.push('alte SIA-Felder');
  });

  return [...new Set(markers)];
}

function createBackupFileName(fileName = 'Druckverlust-Projekt.dvp') {
  const original = String(fileName || 'Druckverlust-Projekt.dvp').trim();
  const dotIndex = original.lastIndexOf('.');
  const base = dotIndex > 0 ? original.slice(0, dotIndex) : original;
  const extension = dotIndex > 0 ? original.slice(dotIndex) : '.dvp';
  return `${base}_Original-vor-Migration${extension || '.dvp'}`;
}

export function createMigrationPlan(data, options = {}) {
  const unwrapped = unwrapProject(data, options);
  const envelope = unwrapped.envelope || {};
  const rawSchema = envelope.schemaVersion || envelope.projectSchema || envelope.version || '';
  const sourceSchemaVersion = normalizeVersion(rawSchema) || (unwrapped.legacyFormat ? LEGACY_RAW_SCHEMA : 'unknown');
  const legacyMarkers = detectLegacyShape(unwrapped.project);

  if (sourceSchemaVersion !== LEGACY_RAW_SCHEMA
      && sourceSchemaVersion !== 'unknown'
      && compareSchemaVersions(sourceSchemaVersion, CURRENT_PROJECT_SCHEMA_VERSION) > 0) {
    throw new ProjectFileError(
      'FUTURE_SCHEMA',
      'Diese Projektdatei wurde mit einer neueren Version von Druckverlust Pro erstellt.',
      {
        fileName: options.fileName,
        details: `Schema ${sourceSchemaVersion}; unterstützt wird bis Schema ${CURRENT_PROJECT_SCHEMA_VERSION}.`,
        recovery: ['Öffne die Datei mit derselben oder einer neueren Programmversion.'],
      },
    );
  }

  const schemaIsCurrent = sourceSchemaVersion === CURRENT_PROJECT_SCHEMA_VERSION;
  const requiresMigration = !schemaIsCurrent || unwrapped.legacyFormat || legacyMarkers.length > 0;
  const steps = [];

  if (!schemaIsCurrent) {
    steps.push(`Dateischema ${sourceSchemaVersion} auf ${CURRENT_PROJECT_SCHEMA_VERSION} aktualisieren.`);
  }
  if (unwrapped.format !== 'wrapped-project') {
    steps.push('Historische Dateihülle in das aktuelle .dvp-Format überführen.');
  }
  if (legacyMarkers.length) {
    steps.push(`Historische Feldstruktur übernehmen: ${legacyMarkers.join(', ')}.`);
  }
  if (requiresMigration) {
    steps.push('Rauigkeit und SIA-Konfiguration je Anlage/Teilstrecke sicher ergänzen.');
    steps.push('Formteil- und Sonderbauteilzuordnungen anhand der vorhandenen IDs prüfen.');
  }

  return {
    sourceSchemaVersion,
    targetSchemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    sourceAppVersion: String(envelope.appVersion || envelope.version || ''),
    sourceAppRelease: String(envelope.appRelease || envelope.release || ''),
    sourceExportedAt: String(envelope.exportedAt || envelope.savedAt || ''),
    format: unwrapped.format,
    legacyFormat: unwrapped.legacyFormat,
    legacyMarkers,
    requiresMigration,
    steps,
    project: unwrapped.project,
    envelope,
    backupFileName: createBackupFileName(options.fileName),
  };
}

function firstArray(...candidates) {
  return candidates.find(Array.isArray) || [];
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null);
}

function adaptSection(sectionInput = {}) {
  const section = isPlainObject(sectionInput) ? { ...sectionInput } : {};
  return {
    ...section,
    id: firstDefined(section.id, section.sectionId, section.teilstreckeId, section.uuid),
    name: firstDefined(section.name, section.bezeichnung, section.nummer, section.label),
    type: firstDefined(section.type, section.kind, section.querschnittstyp, section.form),
    description: firstDefined(section.description, section.beschreibung, section.hinweis),
    q: firstDefined(section.q, section.volumeFlow, section.airVolume, section.volumeFlowM3h, section.luftmenge, section.volumenstrom),
    l: firstDefined(section.l, section.length, section.laenge, section.länge),
    b: firstDefined(section.b, section.width, section.breite),
    h: firstDefined(section.h, section.height, section.hoehe, section.höhe),
    d: firstDefined(section.d, section.diameter, section.durchmesser),
    roughnessMm: firstDefined(section.roughnessMm, section.roughness, section.k, section.epsilonMm, section.rauigkeit, section.rauigkeitMm),
    zetaSum: firstDefined(section.zetaSum, section.zeta, section.zetaGesamt),
  };
}

function adaptFormPart(formPartInput = {}) {
  const formPart = isPlainObject(formPartInput) ? { ...formPartInput } : {};
  return {
    ...formPart,
    id: firstDefined(formPart.id, formPart.formPartId, formPart.formteilId, formPart.uuid),
    name: firstDefined(formPart.name, formPart.bezeichnung, formPart.label),
    type: firstDefined(formPart.type, formPart.formPartType, formPart.formteiltyp, formPart.typ),
    sectionId: firstDefined(
      formPart.sectionId,
      formPart.teilstreckeId,
      formPart.section_id,
      formPart.teilstrecke?.id,
    ),
    transitionOtherSectionId: firstDefined(formPart.transitionOtherSectionId, formPart.uebergangTeilstreckeId),
    throughSectionId: firstDefined(formPart.throughSectionId, formPart.durchgangTeilstreckeId),
    branchSectionId: firstDefined(formPart.branchSectionId, formPart.abzweigTeilstreckeId),
    zeta: firstDefined(formPart.zeta, formPart.zetaValue, formPart.widerstandsbeiwert),
  };
}

function adaptSpecialComponent(componentInput = {}) {
  const component = isPlainObject(componentInput) ? { ...componentInput } : {};
  return {
    ...component,
    id: firstDefined(component.id, component.componentId, component.bauteilId, component.uuid),
    name: firstDefined(component.name, component.bezeichnung, component.label),
    type: firstDefined(component.type, component.componentType, component.bauteiltyp, component.typ),
    sectionId: firstDefined(component.sectionId, component.teilstreckeId, component.section_id, component.teilstrecke?.id),
    quantity: firstDefined(component.quantity, component.count, component.anzahl),
    unitPressureLoss: firstDefined(
      component.unitPressureLoss,
      component.singlePressureLoss,
      component.dpUnit,
      component.pressureLoss,
      component.druckverlust,
    ),
  };
}

function adaptSystem(systemInput = {}, index = 0) {
  const system = isPlainObject(systemInput) ? { ...systemInput } : {};
  const sections = firstArray(system.sections, system.teilstrecken, system.strecken);
  const formParts = firstArray(system.formParts, system.formteile, system.fittings);
  const specialComponents = firstArray(system.specialComponents, system.sonderbauteile, system.components, system.bauteile);

  return {
    ...system,
    id: firstDefined(system.id, system.systemId, system.anlageId, system.uuid),
    name: firstDefined(system.name, system.anlage, system.anlageName, system.bezeichnung, `Anlage ${index + 1}`),
    type: firstDefined(system.type, system.systemType, system.luftrichtung, system.art),
    siaVelocity: isPlainObject(system.siaVelocity)
      ? { ...system.siaVelocity }
      : {
        roomUsageCode: firstDefined(system.siaRoomUsageCode, system.roomUsageCode, system.raumnutzungCode),
        operationMode: firstDefined(system.siaOperationMode, system.operationMode, system.betriebsart),
      },
    sections: sections.map(adaptSection),
    formParts: formParts.map(adaptFormPart),
    specialComponents: specialComponents.map(adaptSpecialComponent),
  };
}

export function adaptLegacyProjectShape(projectInput = {}, plan = {}) {
  const project = isPlainObject(projectInput) ? { ...projectInput } : {};
  let systems = firstArray(project.systems, project.anlagen);

  // Sehr frühe Dateien konnten eine einzelne Anlage direkt auf Projektebene speichern.
  if (!systems.length && [project.sections, project.teilstrecken, project.formParts, project.formteile].some(Array.isArray)) {
    systems = [{
      id: firstDefined(project.systemId, project.anlageId),
      name: firstDefined(project.anlage, project.anlageName, project.report?.anlage, 'Anlage 1'),
      type: firstDefined(project.systemType, project.luftrichtung, 'Zuluft'),
      sections: firstArray(project.sections, project.teilstrecken),
      formParts: firstArray(project.formParts, project.formteile),
      specialComponents: firstArray(project.specialComponents, project.sonderbauteile),
      siaVelocity: project.siaVelocity,
      siaRoomUsageCode: project.siaRoomUsageCode,
      siaOperationMode: project.siaOperationMode,
    }];
  }

  return {
    ...project,
    id: firstDefined(project.id, project.projectId, project.uuid),
    name: firstDefined(project.name, project.projectNumber, project.projektnummer, project.title, project.meta?.name, project.report?.project),
    object: firstDefined(project.object, project.projectName, project.projektname, project.objekt, project.meta?.object, project.report?.object),
    author: firstDefined(project.author, project.bearbeiter, project.user, project.meta?.bearbeiter, project.report?.bearbeiter),
    company: firstDefined(project.company, project.firma, project.meta?.company, project.report?.company),
    address: firstDefined(project.address, project.adresse, project.meta?.address, project.report?.address),
    note: firstDefined(project.note, project.hinweis, project.meta?.note, project.report?.hinweis),
    systems: systems.map(adaptSystem),
    _migrationSource: {
      format: plan.format || '',
      sourceSchemaVersion: plan.sourceSchemaVersion || '',
    },
  };
}

export function prepareProjectImport(text, options = {}) {
  const sourceText = normalizeText(text);
  const data = parseJson(sourceText, options);
  const plan = createMigrationPlan(data, options);

  return {
    sourceText,
    data,
    plan,
    project: plan.project,
    backup: {
      text: sourceText,
      fileName: plan.backupFileName,
      originalFileName: options.fileName || '',
    },
  };
}

export default class ProjectMigrationEngine {
  static currentSchemaVersion = CURRENT_PROJECT_SCHEMA_VERSION;

  static prepare(text, options = {}) {
    return prepareProjectImport(text, options);
  }

  static createPlan(data, options = {}) {
    return createMigrationPlan(data, options);
  }

  static adapt(project, plan = {}) {
    return adaptLegacyProjectShape(project, plan);
  }

  static compareVersions(left, right) {
    return compareSchemaVersions(left, right);
  }
}
