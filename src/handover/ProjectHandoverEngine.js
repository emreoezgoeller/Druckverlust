// Druckverlust Pro – ProjectHandoverEngine
// Phase 33.00: Importvorschau, kontrollierte Projektübergabe und Freigabepaket.

import StorageEngine, { PROJECT_FILE_TYPE } from '../storage/StorageEngine.js';
import ProjectCalculationService from '../project/ProjectCalculationService.js';
import ProjectSafetyEngine, { PROJECT_ARCHIVE_FILE_TYPE } from '../safety/ProjectSafetyEngine.js?v=33.00';
import ProjectCompletionEngine from '../closing/ProjectCompletionEngine.js?v=33.00';
import { APP_NAME, APP_RELEASE, APP_VERSION } from '../core/appVersion.js?v=40.00';

export const HANDOVER_FILE_TYPE = 'DruckverlustProHandover';
export const HANDOVER_SCHEMA_VERSION = '1.0.0';
export const HANDOVER_EXTENSION = '.dvph';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function number(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix = 'handover') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeFilePart(value, fallback = 'Druckverlust-Projekt') {
  const result = safeText(value, fallback)
    .replace(/[^\wäöüÄÖÜß-]+/g, '_')
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
  return result || fallback;
}

function dateStamp(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'unbekannt';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
}

function fnv1a(text = '') {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function canonicalChecksum(value = {}) {
  const data = clone(value) || {};
  delete data.checksum;
  if (data.projectArchive?.projectFile) data.projectArchive.projectFile.exportedAt = '';
  return fnv1a(JSON.stringify(data));
}

function projectChecksum(project = {}) {
  const payload = JSON.parse(StorageEngine.serialize(project));
  payload.exportedAt = '';
  return fnv1a(JSON.stringify(payload));
}

function getSystem(project = {}, systemId = '') {
  const systems = safeArray(project.systems);
  return systems.find(item => item?.id === systemId) || systems[0] || null;
}

function getReport(project = {}) {
  if (!project.report || typeof project.report !== 'object') project.report = {};
  return project.report;
}

function countObjects(project = {}) {
  return safeArray(project.systems).reduce((summary, system) => {
    summary.systems += 1;
    summary.sections += safeArray(system?.sections).length;
    summary.formParts += safeArray(system?.formParts).length;
    summary.specialComponents += safeArray(system?.specialComponents).length;
    return summary;
  }, { systems: 0, sections: 0, formParts: 0, specialComponents: 0 });
}

function ensureHandover(project = {}) {
  if (!project.handover || typeof project.handover !== 'object') project.handover = {};
  if (!project.handover.systems || typeof project.handover.systems !== 'object') project.handover.systems = {};
  return project.handover;
}

function approvalDefaults(systemId = '') {
  return {
    systemId,
    status: 'draft',
    preparedBy: '',
    preparedAt: '',
    checkedBy: '',
    checkedAt: '',
    releasedBy: '',
    releasedAt: '',
    note: '',
    packageId: '',
    updatedAt: '',
  };
}

function normalizeApproval(value = {}, systemId = '') {
  const allowed = ['draft', 'prepared', 'checked', 'released'];
  return {
    ...approvalDefaults(systemId),
    ...value,
    systemId,
    status: allowed.includes(value?.status) ? value.status : 'draft',
    preparedBy: safeText(value?.preparedBy),
    preparedAt: safeText(value?.preparedAt),
    checkedBy: safeText(value?.checkedBy),
    checkedAt: safeText(value?.checkedAt),
    releasedBy: safeText(value?.releasedBy),
    releasedAt: safeText(value?.releasedAt),
    note: safeText(value?.note),
    packageId: safeText(value?.packageId),
    updatedAt: safeText(value?.updatedAt),
  };
}

function statusRank(status = 'draft') {
  return { draft: 0, prepared: 1, checked: 2, released: 3 }[status] ?? 0;
}

function statusLabel(status = 'draft') {
  return {
    draft: 'Entwurf',
    prepared: 'Vorbereitet',
    checked: 'Geprüft',
    released: 'Freigegeben',
    ready: 'Übergabebereit',
    review: 'Prüfung erforderlich',
    blocked: 'Blockiert',
  }[status] || status;
}

function createDownload(content, fileName, type = 'application/json;charset=utf-8') {
  if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return false;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  return true;
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function compareVersions(source = '', current = '') {
  const parse = value => String(value || '').split('.').map(part => Number(part.replace(/\D/g, '')) || 0);
  const a = parse(source);
  const b = parse(current);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1;
    if ((a[index] || 0) < (b[index] || 0)) return -1;
  }
  return 0;
}

export default class ProjectHandoverEngine {
  static getApproval(project = {}, systemId = '') {
    const system = getSystem(project, systemId);
    if (!system) return approvalDefaults('');
    const handover = ensureHandover(project);
    const approval = normalizeApproval(handover.systems[system.id], system.id);
    handover.systems[system.id] = approval;
    return clone(approval);
  }

  static saveApproval(project = {}, systemId = '', data = {}, context = {}) {
    const system = getSystem(project, systemId);
    if (!system) throw new Error('Keine Anlage für die Übergabefreigabe vorhanden.');

    const current = this.getApproval(project, system.id);
    const desiredStatus = ['draft', 'prepared', 'checked', 'released'].includes(data.status) ? data.status : current.status;
    const preparedBy = safeText(data.preparedBy, current.preparedBy);
    const checkedBy = safeText(data.checkedBy, current.checkedBy);
    const releasedBy = safeText(data.releasedBy, current.releasedBy);
    const analysis = this.analyze(project, system.id, context);

    if (statusRank(desiredStatus) >= 1 && !preparedBy) {
      throw new Error('Für den Status „Vorbereitet“ muss eine verantwortliche Person eingetragen sein.');
    }
    if (statusRank(desiredStatus) >= 2 && !checkedBy) {
      throw new Error('Für den Status „Geprüft“ muss eine prüfende Person eingetragen sein.');
    }
    if (statusRank(desiredStatus) >= 2 && !analysis.completion?.reviewProtocol?.isComplete) {
      throw new Error('Das manuelle Prüfprotokoll im Bereich „Abschluss“ ist noch nicht vollständig bestätigt.');
    }
    if (desiredStatus === 'released' && !releasedBy) {
      throw new Error('Für die Freigabe muss eine freigebende Person eingetragen sein.');
    }
    if (desiredStatus === 'released' && !analysis.coreReady) {
      const blocker = analysis.items.find(item => item.status === 'error' || item.required && item.status !== 'ok');
      throw new Error(blocker?.message || 'Das Projekt ist noch nicht freigabebereit.');
    }

    const timestamp = nowIso();
    const next = {
      ...current,
      status: desiredStatus,
      preparedBy,
      checkedBy,
      releasedBy,
      note: safeText(data.note, current.note),
      preparedAt: statusRank(desiredStatus) >= 1 ? (current.preparedAt || timestamp) : '',
      checkedAt: statusRank(desiredStatus) >= 2 ? (current.checkedAt || timestamp) : '',
      releasedAt: desiredStatus === 'released' ? timestamp : '',
      packageId: desiredStatus === 'released' ? (current.packageId || createId('release')) : current.packageId,
      updatedAt: timestamp,
    };

    const handover = ensureHandover(project);
    handover.systems[system.id] = next;
    handover.updatedAt = timestamp;

    return clone(next);
  }

  static analyze(project = {}, systemId = '', context = {}) {
    const system = getSystem(project, systemId);
    if (!system) {
      return {
        status: 'blocked', label: 'Blockiert', score: 0, coreReady: false, canExport: false, canRelease: false,
        items: [{ id: 'system', status: 'error', required: true, label: 'Anlage', message: 'Keine Anlage vorhanden.' }],
        approval: approvalDefaults(''), completion: null, health: null,
      };
    }

    let calculationResult = project.calculationResult;
    if (!calculationResult?.calculation || calculationResult?.system?.id !== system.id) {
      calculationResult = ProjectCalculationService.calculate(project, system.id);
      project.calculationResult = calculationResult;
    }

    const health = ProjectSafetyEngine.createHealth(project, {
      system,
      isProjectDirty: Boolean(context.isProjectDirty),
      storage: context.storage,
    });
    const completion = ProjectCompletionEngine.analyze(project, system.id, {
      isProjectDirty: Boolean(context.isProjectDirty),
    });
    const approval = this.getApproval(project, system.id);
    const report = getReport(project);
    const totalLoss = number(calculationResult?.calculation?.totals?.totalRounded ?? calculationResult?.calculation?.totals?.total, NaN);
    const selectedVariant = completion?.reportVariant || null;

    const items = [
      {
        id: 'calculation', required: true, blocking: true,
        status: Number.isFinite(totalLoss) && totalLoss >= 0 ? 'ok' : 'error',
        label: 'Berechnung',
        message: Number.isFinite(totalLoss) ? `${totalLoss.toFixed(1)} Pa Gesamtdruckverlust sind berechnet.` : 'Es liegt kein gültiges Berechnungsergebnis vor.',
      },
      {
        id: 'safety', required: true, blocking: health.status === 'error',
        status: health.status === 'error' ? 'error' : health.status === 'warning' ? 'warning' : 'ok',
        label: 'Projektsicherheit',
        message: `${health.label || 'Projektprüfung'} · ${Math.round(number(health.score))}/100.`,
      },
      {
        id: 'report-data', required: true, blocking: true,
        status: safeText(report.reportNumber || project.reportNumber) && safeText(report.revision || project.revision) ? 'ok' : 'warning',
        label: 'Berichtsangaben',
        message: safeText(report.reportNumber || project.reportNumber) && safeText(report.revision || project.revision)
          ? 'Berichtnummer und Revision sind gepflegt.'
          : 'Berichtnummer oder Revision ist noch nicht vollständig gepflegt.',
      },
      {
        id: 'revision', required: true, blocking: true,
        status: completion?.revisionCurrent ? 'ok' : 'warning',
        label: 'Revisionsstand',
        message: completion?.revisionCurrent ? 'Der dokumentierte Revisionsstand entspricht dem aktuellen Projekt.' : 'Aktuellen Projektstand im Bereich „Abschluss“ als Revision dokumentieren.',
      },
      {
        id: 'review', required: true, blocking: true,
        status: completion?.reviewProtocol?.isComplete ? 'ok' : 'warning',
        label: 'Prüfprotokoll',
        message: completion?.reviewProtocol?.isComplete ? 'Alle Prüfpunkte sind bestätigt.' : `${completion?.reviewProtocol?.completed || 0}/${completion?.reviewProtocol?.total || 0} Prüfpunkte sind bestätigt.`,
      },
      {
        id: 'variant', required: false, blocking: false,
        status: !selectedVariant || completion?.variantCurrent ? 'ok' : 'warning',
        label: 'Berichtsvariante',
        message: !selectedVariant ? 'Keine Simulationsvariante für den Bericht ausgewählt.' : completion?.variantCurrent ? 'Die ausgewählte Variante entspricht dem aktuellen Berechnungsstand.' : 'Die ausgewählte Variante basiert auf einem älteren Berechnungsstand.',
      },
      {
        id: 'prepared', required: false, blocking: false,
        status: approval.preparedBy ? 'ok' : 'warning',
        label: 'Übergabe vorbereitet',
        message: approval.preparedBy ? `${approval.preparedBy} hat die Übergabe vorbereitet.` : 'Verantwortliche Person für die Übergabe eintragen.',
      },
      {
        id: 'checked', required: false, blocking: false,
        status: approval.checkedBy ? 'ok' : 'warning',
        label: 'Übergabe geprüft',
        message: approval.checkedBy ? `${approval.checkedBy} ist als prüfende Person dokumentiert.` : 'Prüfende Person noch nicht eingetragen.',
      },
      {
        id: 'released', required: false, blocking: false,
        status: approval.status === 'released' ? 'ok' : 'warning',
        label: 'Übergabe freigegeben',
        message: approval.status === 'released' ? `${approval.releasedBy || 'Freigabe'} · ${approval.releasedAt || '-'}` : 'Das Übergabepaket ist noch nicht freigegeben.',
      },
    ];

    const requiredItems = items.filter(item => item.required);
    const requiredErrors = requiredItems.filter(item => item.status === 'error');
    const requiredOpen = requiredItems.filter(item => item.blocking !== false && item.status !== 'ok');
    const coreReady = requiredErrors.length === 0 && requiredOpen.length === 0;
    const canExport = requiredErrors.length === 0;
    const canRelease = coreReady && Boolean(approval.preparedBy && approval.checkedBy);
    const errorCount = items.filter(item => item.status === 'error').length;
    const warningCount = items.filter(item => item.status === 'warning').length;
    const score = Math.max(0, Math.min(100, 100 - errorCount * 18 - warningCount * 4));
    const status = approval.status === 'released' && coreReady ? 'released' : coreReady ? 'ready' : requiredErrors.length ? 'blocked' : 'review';

    return {
      status,
      label: statusLabel(status),
      score,
      coreReady,
      canExport,
      canRelease,
      items,
      counts: { error: errorCount, warning: warningCount, ok: items.length - errorCount - warningCount, total: items.length },
      approval,
      completion,
      health,
      system,
      totalLoss,
      checkedAt: nowIso(),
      checksum: projectChecksum(project),
    };
  }

  static createPackage(project = {}, options = {}) {
    const system = options.system || getSystem(project, options.systemId);
    if (!system) throw new Error('Keine Anlage für das Übergabepaket vorhanden.');
    const analysis = options.analysis || this.analyze(project, system.id, options);
    if (!analysis.canExport && options.allowBlocked !== true) {
      throw new Error('Das Übergabepaket kann wegen fachlicher oder struktureller Fehler noch nicht erstellt werden.');
    }

    const approval = this.getApproval(project, system.id);
    const projectArchive = ProjectSafetyEngine.createArchive(project, {
      system,
      reason: 'handover-package',
      label: options.label || 'Projektübergabe',
      note: options.note || approval.note,
      isProjectDirty: options.isProjectDirty,
    });
    const createdAt = nowIso();
    const report = getReport(project);
    const packageData = {
      fileType: HANDOVER_FILE_TYPE,
      schemaVersion: HANDOVER_SCHEMA_VERSION,
      appName: APP_NAME,
      appVersion: APP_VERSION,
      appRelease: APP_RELEASE,
      id: createId('handover'),
      createdAt,
      status: analysis.status,
      statusLabel: analysis.label,
      projectName: safeText(project.name, 'Unbenanntes Projekt'),
      objectName: safeText(project.object),
      systemId: system.id,
      systemName: safeText(system.name, 'Anlage'),
      revision: safeText(report.revision || project.revision, '0'),
      reportNumber: safeText(report.reportNumber || project.reportNumber),
      approval,
      manifest: {
        counts: countObjects(project),
        projectChecksum: analysis.checksum,
        safetyScore: analysis.health?.score ?? 0,
        completionScore: analysis.completion?.score ?? 0,
        handoverScore: analysis.score,
        included: [
          'Bearbeitbare Druckverlust-Projektdatei',
          'Projekt- und Berechnungsdiagnose',
          'Revisions- und Variantenstand',
          'Prüf- und Freigabeangaben',
          'Prüfsummen zur Integritätskontrolle',
        ],
      },
      diagnostics: {
        status: analysis.status,
        score: analysis.score,
        counts: analysis.counts,
        checkedAt: analysis.checkedAt,
        items: analysis.items,
      },
      projectArchive,
    };
    packageData.checksum = canonicalChecksum(packageData);
    return packageData;
  }

  static serializePackage(packageData = {}) {
    if (packageData?.fileType !== HANDOVER_FILE_TYPE) throw new Error('Ungültiges Druckverlust-Übergabepaket.');
    return JSON.stringify(packageData, null, 2);
  }

  static parsePackage(input, options = {}) {
    let packageData;
    try {
      packageData = typeof input === 'string' ? JSON.parse(input) : clone(input);
    } catch (error) {
      throw new Error(`Übergabepaket konnte nicht gelesen werden: ${error.message}`);
    }
    if (!packageData || packageData.fileType !== HANDOVER_FILE_TYPE || !packageData.projectArchive) {
      throw new Error('Keine gültige .dvph-Datei von Druckverlust Pro.');
    }
    const actualChecksum = canonicalChecksum(packageData);
    if (packageData.checksum && packageData.checksum !== actualChecksum) {
      throw new Error('Die Prüfsumme des Übergabepakets stimmt nicht. Die Datei ist möglicherweise beschädigt oder verändert.');
    }
    const archiveResult = ProjectSafetyEngine.parseArchive(packageData.projectArchive, { fileName: options.fileName || '' });
    return {
      package: { ...packageData, checksum: actualChecksum },
      project: archiveResult.project,
      warnings: archiveResult.warnings,
    };
  }

  static inspectInput(input, options = {}) {
    let raw;
    try {
      raw = typeof input === 'string' ? JSON.parse(input) : clone(input);
    } catch (error) {
      throw new Error(`Datei konnte nicht gelesen werden: ${error.message}`);
    }

    let sourceType = 'project';
    let sourceLabel = '.dvp-Projektdatei';
    let sourceMeta = {};
    let project;
    let warnings = [];

    if (raw?.fileType === HANDOVER_FILE_TYPE) {
      const result = this.parsePackage(raw, options);
      sourceType = 'handover';
      sourceLabel = '.dvph-Übergabepaket';
      sourceMeta = result.package;
      project = result.project;
      warnings = result.warnings;
    } else if (raw?.fileType === PROJECT_ARCHIVE_FILE_TYPE) {
      const result = ProjectSafetyEngine.parseArchive(raw, options);
      sourceType = 'archive';
      sourceLabel = '.dvpa-Projektarchiv';
      sourceMeta = result.archive;
      project = result.project;
      warnings = result.warnings;
    } else if (raw?.fileType === PROJECT_FILE_TYPE || Array.isArray(raw?.systems)) {
      project = StorageEngine.parse(JSON.stringify(raw), options);
      sourceMeta = raw;
      warnings = safeArray(project?._importInfo?.normalizedWarnings || project?._importInfo?.warnings);
    } else {
      throw new Error('Dateityp wird nicht erkannt. Erwartet wird .dvp, .dvpa oder .dvph.');
    }

    const system = getSystem(project, options.systemId || sourceMeta.systemId);
    const calculationResult = ProjectCalculationService.calculate(project, system?.id || null);
    project.calculationResult = calculationResult;
    const analysis = this.analyze(project, system?.id, { isProjectDirty: false, storage: options.storage });
    const incomingCounts = countObjects(project);
    const currentProject = options.currentProject || null;
    const currentCounts = currentProject ? countObjects(currentProject) : null;
    const incomingChecksum = projectChecksum(project);
    const currentChecksum = currentProject ? projectChecksum(currentProject) : '';
    const sourceRelease = safeText(sourceMeta.appRelease || sourceMeta.projectArchive?.appRelease || project?._importInfo?.appRelease);
    const releaseComparison = sourceRelease ? compareVersions(sourceRelease, APP_RELEASE) : 0;

    return {
      sourceType,
      sourceLabel,
      fileName: safeText(options.fileName),
      fileSizeBytes: number(options.fileSizeBytes),
      sourceAppVersion: safeText(sourceMeta.appVersion || sourceMeta.projectArchive?.appVersion || project?._importInfo?.appVersion),
      sourceAppRelease: sourceRelease,
      sourceSchemaVersion: safeText(sourceMeta.schemaVersion || sourceMeta.projectArchive?.schemaVersion || project?._importInfo?.schemaVersion),
      sourceNewer: releaseComparison > 0,
      project,
      system,
      projectName: safeText(project.name, 'Unbenanntes Projekt'),
      objectName: safeText(project.object),
      systemName: safeText(system?.name, 'Anlage'),
      revision: safeText(project.report?.revision || project.revision, '0'),
      checksum: incomingChecksum,
      warnings,
      analysis,
      counts: incomingCounts,
      comparison: currentProject ? {
        sameChecksum: incomingChecksum === currentChecksum,
        sameProjectId: Boolean(project.id && currentProject.id && project.id === currentProject.id),
        sameProjectName: safeText(project.name) === safeText(currentProject.name),
        currentProjectName: safeText(currentProject.name, 'Aktuelles Projekt'),
        currentRevision: safeText(currentProject.report?.revision || currentProject.revision, '0'),
        countDelta: {
          systems: incomingCounts.systems - currentCounts.systems,
          sections: incomingCounts.sections - currentCounts.sections,
          formParts: incomingCounts.formParts - currentCounts.formParts,
          specialComponents: incomingCounts.specialComponents - currentCounts.specialComponents,
        },
      } : null,
      canImport: analysis.health?.status !== 'error',
      checkedAt: nowIso(),
    };
  }

  static readImportFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Keine Datei ausgewählt.'));
      const fileName = safeText(file.name).toLowerCase();
      if (fileName && !['.dvp', '.dvpa', '.dvph', '.json'].some(extension => fileName.endsWith(extension))) {
        return reject(new Error('Bitte eine .dvp-, .dvpa- oder .dvph-Datei auswählen.'));
      }
      if (number(file.size) > 20 * 1024 * 1024) return reject(new Error('Die ausgewählte Datei ist ungewöhnlich gross.'));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(this.inspectInput(reader.result, {
            ...options,
            fileName: file.name || '',
            fileSizeBytes: file.size || 0,
          }));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Datei konnte nicht gelesen werden.'));
      reader.readAsText(file, 'utf-8');
    });
  }

  static createPackageFileName(project = {}, createdAt = new Date()) {
    const revision = safeText(project.report?.revision || project.revision, '0');
    return `${sanitizeFilePart(project.name)}_Rev-${sanitizeFilePart(revision, '0')}_Uebergabe_${dateStamp(createdAt)}${HANDOVER_EXTENSION}`;
  }

  static downloadPackage(project = {}, options = {}) {
    const packageData = this.createPackage(project, options);
    const fileName = options.fileName || this.createPackageFileName(project, packageData.createdAt);
    createDownload(this.serializePackage(packageData), fileName);
    return { package: packageData, fileName };
  }

  static toProtocolCsv(project = {}, systemId = '', context = {}) {
    const analysis = this.analyze(project, systemId, context);
    const approval = analysis.approval;
    const rows = [
      ['Druckverlust Pro – Übergabeprotokoll'],
      ['Projekt', project.name || ''],
      ['Projektname', project.object || ''],
      ['Anlage', analysis.system?.name || ''],
      ['Revision', project.report?.revision || project.revision || ''],
      ['Phase', APP_RELEASE],
      ['Version', APP_VERSION],
      ['Status', analysis.label],
      ['Übergabe-Score', analysis.score],
      ['Projekt-Prüfsumme', analysis.checksum],
      ['Geprüft am', analysis.checkedAt],
      [],
      ['Freigabeschritt', 'Person', 'Zeitpunkt'],
      ['Vorbereitet', approval.preparedBy, approval.preparedAt],
      ['Geprüft', approval.checkedBy, approval.checkedAt],
      ['Freigegeben', approval.releasedBy, approval.releasedAt],
      ['Vermerk', approval.note, ''],
      [],
      ['Status', 'Prüfpunkt', 'Feststellung', 'Pflicht'],
      ...analysis.items.map(item => [item.status, item.label, item.message, item.required ? 'ja' : 'nein']),
    ];
    return rows.map(row => row.map(csvCell).join(';')).join('\r\n');
  }

  static downloadProtocol(project = {}, systemId = '', context = {}) {
    const content = `\ufeff${this.toProtocolCsv(project, systemId, context)}`;
    const fileName = `${sanitizeFilePart(project.name)}_Uebergabeprotokoll_${dateStamp()}.csv`;
    createDownload(content, fileName, 'text/csv;charset=utf-8');
    return fileName;
  }
}
