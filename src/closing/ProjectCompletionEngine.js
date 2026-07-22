// Druckverlust Pro – ProjectCompletionEngine
// Phase 31.00: Variantenarchiv, detaillierte Revisionen und neutraler Projektabschluss.

import ProjectCalculationService from '../project/ProjectCalculationService.js';
import EngineeringQualityEngine from '../quality/EngineeringQualityEngine.js?v=58.20';
import RevisionComparisonEngine from '../revision/RevisionComparisonEngine.js?v=58.20';

function number(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function getSystem(project = {}, systemId = null) {
  const systems = Array.isArray(project.systems) ? project.systems : [];
  return systems.find(item => item.id === systemId) || systems[0] || null;
}

function summarizeCalculation(calculation = {}) {
  const results = Array.isArray(calculation.results) ? calculation.results : [];
  const totals = calculation.totals || {};
  const critical = [...results]
    .sort((a, b) => number(b?.result?.roundedTotalLoss ?? b?.result?.totalLoss) - number(a?.result?.roundedTotalLoss ?? a?.result?.totalLoss))[0] || null;

  return {
    totalLoss: number(totals.totalRounded ?? totals.total),
    frictionLoss: number(totals.friction),
    formPartLoss: number(totals.formParts, number(totals.zetaLoss) + number(totals.directFormPartLoss)),
    specialLoss: number(totals.special),
    maxVelocity: results.reduce((maximum, item) => Math.max(maximum, number(item?.result?.velocity)), 0),
    criticalSectionId: critical?.id || '',
    criticalSectionName: critical?.input?.name || critical?.input?.ts || critical?.id || '-',
    criticalSectionLoss: number(critical?.result?.roundedTotalLoss ?? critical?.result?.totalLoss),
  };
}

function createCounts(system = {}) {
  return {
    sections: Array.isArray(system.sections) ? system.sections.length : 0,
    formParts: Array.isArray(system.formParts) ? system.formParts.length : 0,
    specialComponents: Array.isArray(system.specialComponents) ? system.specialComponents.length : 0,
  };
}

function stableNormalize(value) {
  if (Array.isArray(value)) return value.map(stableNormalize);
  if (!value || typeof value !== 'object') return value;

  return Object.keys(value)
    .filter(key => ![
      'calculationResult', 'calculation', 'validation', '_importInfo',
      'sectionRoughnessMm', 'sectionFrictionFactor', 'sectionReynoldsNumber',
      'frictionSourceSectionId', 'frictionInheritedAt'
    ].includes(key))
    .sort()
    .reduce((result, key) => {
      result[key] = stableNormalize(value[key]);
      return result;
    }, {});
}

function simpleHash(value = '') {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `dp-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function normalizeVariantRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    id: row.id || '',
    position: number(row.position),
    name: text(row.name, row.id || '-'),
    baseline: {
      airflow: number(row.baseline?.airflow),
      velocity: number(row.baseline?.velocity),
      pressureLoss: number(row.baseline?.pressureLoss),
      frictionRate: number(row.baseline?.frictionRate),
    },
    scenario: {
      airflow: number(row.scenario?.airflow),
      velocity: number(row.scenario?.velocity),
      pressureLoss: number(row.scenario?.pressureLoss),
      frictionRate: number(row.scenario?.frictionRate),
    },
    delta: {
      velocity: number(row.delta?.velocity),
      velocityPercent: Number.isFinite(Number(row.delta?.velocityPercent)) ? Number(row.delta.velocityPercent) : null,
      pressureLoss: number(row.delta?.pressureLoss),
      pressureLossPercent: Number.isFinite(Number(row.delta?.pressureLossPercent)) ? Number(row.delta.pressureLossPercent) : null,
    },
  }));
}

function getReportData(project = {}) {
  if (!project.report || typeof project.report !== 'object') project.report = {};
  return project.report;
}

function ensureCollections(project = {}) {
  if (!Array.isArray(project.simulationVariants)) project.simulationVariants = [];
  if (!Array.isArray(project.revisionSnapshots)) project.revisionSnapshots = [];
  if (!project.reviewProtocol || typeof project.reviewProtocol !== 'object') project.reviewProtocol = {};
  return project;
}

function calculate(project = {}, systemId = null) {
  const cloned = deepClone(project);
  const system = getSystem(cloned, systemId);
  if (!system) throw new Error('Keine Anlage für den Projektabschluss vorhanden.');
  return ProjectCalculationService.calculate(cloned, system.id);
}

export default class ProjectCompletionEngine {
  static createCalculationFingerprint(project = {}, systemId = null) {
    const system = getSystem(project, systemId);
    if (!system) return 'dp-empty';
    return simpleHash(JSON.stringify(stableNormalize({ settings: project.settings || {}, system })));
  }

  static createProjectFingerprint(project = {}, systemId = null) {
    const system = getSystem(project, systemId);
    if (!system) return 'dp-empty';

    const report = project.report || {};
    const payload = {
      project: {
        name: project.name || '',
        object: project.object || '',
        author: project.author || '',
        anlageNumber: project.anlageNumber || '',
        settings: project.settings || {},
      },
      report: {
        reportNumber: report.reportNumber || project.reportNumber || '',
        revision: report.revision || project.revision || '',
        checkedBy: report.checkedBy || project.checkedBy || '',
        approvedBy: report.approvedBy || project.approvedBy || '',
        approvalDate: report.approvalDate || project.approvalDate || '',
      },
      system,
    };

    return simpleHash(JSON.stringify(stableNormalize(payload)));
  }

  static getVariants(project = {}, systemId = null) {
    ensureCollections(project);
    return project.simulationVariants
      .filter(item => !systemId || item.systemId === systemId)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  static saveVariant(project = {}, systemId = null, simulation = {}, details = {}) {
    ensureCollections(project);
    const system = getSystem(project, systemId);
    if (!system) throw new Error('Keine Anlage zum Speichern der Variante vorhanden.');
    if (!simulation?.scenario || !simulation?.baseline) throw new Error('Die Simulationsdaten sind unvollständig.');

    const createdAt = new Date().toISOString();
    const variantsForSystem = this.getVariants(project, system.id);
    const variant = {
      id: details.id || `variant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: text(details.name, `Variante ${variantsForSystem.length + 1}`),
      note: text(details.note),
      author: text(details.author, project.author || project.report?.bearbeiter || ''),
      systemId: system.id,
      systemName: system.name || 'Anlage',
      createdAt,
      options: {
        scope: simulation.options?.scope === 'selected' ? 'selected' : 'all',
        sectionId: text(simulation.options?.sectionId),
        airflowPercent: number(simulation.options?.airflowPercent, 100),
        dimensionPercent: number(simulation.options?.dimensionPercent, 100),
      },
      affectedCount: number(simulation.affectedCount),
      baseline: deepClone(simulation.baseline),
      scenario: deepClone(simulation.scenario),
      delta: deepClone(simulation.delta),
      rows: normalizeVariantRows(simulation.rows),
      calculationFingerprint: this.createCalculationFingerprint(project, system.id),
      projectFingerprint: this.createCalculationFingerprint(project, system.id),
      isNeutralSimulation: true,
    };

    project.simulationVariants = [
      variant,
      ...project.simulationVariants.filter(item => item.id !== variant.id),
    ].slice(0, 12);

    if (details.includeInReport || !project.reportVariantId) {
      project.reportVariantId = variant.id;
    }

    return variant;
  }

  static removeVariant(project = {}, variantId = '') {
    ensureCollections(project);
    const before = project.simulationVariants.length;
    project.simulationVariants = project.simulationVariants.filter(item => item.id !== variantId);
    if (project.reportVariantId === variantId) {
      project.reportVariantId = project.simulationVariants[0]?.id || '';
    }
    return before !== project.simulationVariants.length;
  }

  static setReportVariant(project = {}, variantId = '') {
    ensureCollections(project);
    const variant = project.simulationVariants.find(item => item.id === variantId) || null;
    project.reportVariantId = variant?.id || '';
    return variant;
  }

  static getReportVariant(project = {}, systemId = null) {
    ensureCollections(project);
    const variants = this.getVariants(project, systemId);
    return variants.find(item => item.id === project.reportVariantId) || null;
  }

  static suggestNextRevision(currentRevision = '0') {
    const value = text(currentRevision, '0');
    if (/^\d+$/.test(value)) return String(Number(value) + 1);
    if (/^\d+\.\d+$/.test(value)) {
      const parts = value.split('.');
      parts[parts.length - 1] = String(Number(parts.at(-1)) + 1);
      return parts.join('.');
    }
    if (/^[A-Z]$/i.test(value)) return String.fromCharCode(value.toUpperCase().charCodeAt(0) + 1);
    return value;
  }

  static captureRevision(project = {}, systemId = null, details = {}) {
    ensureCollections(project);
    const system = getSystem(project, systemId);
    if (!system) throw new Error('Keine Anlage für den Revisionsstand vorhanden.');

    const report = getReportData(project);
    const calculationResult = calculate(project, system.id);
    const calculation = calculationResult.calculation || {};
    const quality = EngineeringQualityEngine.analyze(project, system, calculation);
    const revision = text(details.revision, report.revision || project.revision || '0');
    const date = text(details.date, new Date().toLocaleDateString('de-CH'));
    const author = text(details.author, report.bearbeiter || project.author || '-');
    const change = text(details.change, 'Berechnungsstand dokumentiert');
    report.revision = revision;
    project.revision = revision;
    const snapshot = {
      id: `revision-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      revision,
      date,
      author,
      change,
      systemId: system.id,
      systemName: system.name || 'Anlage',
      createdAt: new Date().toISOString(),
      fingerprint: this.createProjectFingerprint(project, system.id),
      totals: summarizeCalculation(calculation),
      counts: createCounts(system),
      engineeringScore: number(quality?.score, 100),
      engineeringStatus: quality?.status || 'ok',
      findingCount: Array.isArray(quality?.findings) ? quality.findings.length : 0,
      reportVariantId: project.reportVariantId || '',
      technicalSnapshot: RevisionComparisonEngine.createTechnicalSnapshot(project, system.id, calculation),
    };

    project.revisionSnapshots = [
      snapshot,
      ...project.revisionSnapshots.filter(item => !(item.systemId === system.id && item.revision === revision)),
    ].slice(0, 20);

    report.revisionHistory = Array.isArray(report.revisionHistory) ? report.revisionHistory : [];
    report.revisionHistory = [
      { revision, date, author, change },
      ...report.revisionHistory.filter(row => String(row?.revision || '') !== revision),
    ].slice(0, 12);
    project.revisionHistory = deepClone(report.revisionHistory);

    return snapshot;
  }

  static getRevisionSnapshots(project = {}, systemId = null) {
    ensureCollections(project);
    return project.revisionSnapshots
      .filter(item => !systemId || item.systemId === systemId)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  static getRevisionComparison(project = {}, systemId = null, revisionId = null) {
    ensureCollections(project);
    const snapshots = this.getRevisionSnapshots(project, systemId);
    const selectedId = revisionId || project.reportRevisionBaseId || snapshots[0]?.id || '';
    const revision = snapshots.find(item => item.id === selectedId) || snapshots[0] || null;
    if (!revision) return RevisionComparisonEngine.compareSnapshots(null, null);
    return RevisionComparisonEngine.compareRevisionToCurrent(project, systemId, revision);
  }

  static setReportRevisionBase(project = {}, revisionId = '') {
    ensureCollections(project);
    const revision = project.revisionSnapshots.find(item => item.id === revisionId) || null;
    project.reportRevisionBaseId = revision?.id || '';
    return revision;
  }

  static getReviewProtocol(project = {}, systemId = null) {
    ensureCollections(project);
    const system = getSystem(project, systemId);
    const defaults = [
      { id: 'inputs', label: 'Eingabedaten und Abmessungen geprüft' },
      { id: 'formparts', label: 'Formteile und Zuordnungen geprüft' },
      { id: 'specials', label: 'Sonderbauteile und Druckverluste geprüft' },
      { id: 'calculation', label: 'Berechnung und Summen geprüft' },
      { id: 'schematic', label: 'Anlagenschema geprüft' },
      { id: 'report', label: 'Bericht und Revisionsstand geprüft' },
    ];
    const stored = project.reviewProtocol?.systems?.[system?.id] || {};
    const storedChecks = Array.isArray(stored.checks) ? stored.checks : [];
    const checks = defaults.map(item => ({
      ...item,
      checked: Boolean(storedChecks.find(row => row.id === item.id)?.checked),
    }));
    return {
      systemId: system?.id || '',
      reviewer: text(stored.reviewer, project.report?.checkedBy || project.checkedBy || ''),
      date: text(stored.date),
      note: text(stored.note),
      checks,
      completed: checks.filter(item => item.checked).length,
      total: checks.length,
      isComplete: checks.length > 0 && checks.every(item => item.checked),
      updatedAt: stored.updatedAt || '',
    };
  }

  static saveReviewProtocol(project = {}, systemId = null, data = {}) {
    ensureCollections(project);
    const system = getSystem(project, systemId);
    if (!system) throw new Error('Keine Anlage für das Prüfprotokoll vorhanden.');
    const current = this.getReviewProtocol(project, system.id);
    const checks = current.checks.map(item => ({
      id: item.id,
      label: item.label,
      checked: Boolean((data.checks || []).find(row => row.id === item.id)?.checked),
    }));
    if (!project.reviewProtocol.systems || typeof project.reviewProtocol.systems !== 'object') project.reviewProtocol.systems = {};
    const protocol = {
      systemId: system.id,
      reviewer: text(data.reviewer),
      date: text(data.date),
      note: text(data.note),
      checks,
      updatedAt: new Date().toISOString(),
    };
    project.reviewProtocol.systems[system.id] = protocol;
    if (protocol.reviewer) {
      project.checkedBy = protocol.reviewer;
      if (!project.report || typeof project.report !== 'object') project.report = {};
      project.report.checkedBy = protocol.reviewer;
    }
    return this.getReviewProtocol(project, system.id);
  }

  static analyze(project = {}, systemId = null, context = {}) {
    const system = getSystem(project, systemId);
    if (!system) {
      return {
        status: 'blocked',
        score: 0,
        items: [{ id: 'system', status: 'error', label: 'Anlage', message: 'Keine Anlage vorhanden.' }],
        variants: [],
        revisions: [],
      };
    }

    let calculationResult = project.calculationResult;
    if (!calculationResult?.calculation) calculationResult = calculate(project, system.id);
    const calculation = calculationResult.calculation || {};
    const engineering = EngineeringQualityEngine.analyze(project, system, calculation);
    const report = project.report || {};
    const variants = this.getVariants(project, system.id);
    const reportVariant = this.getReportVariant(project, system.id);
    const revisions = this.getRevisionSnapshots(project, system.id);
    const currentFingerprint = this.createProjectFingerprint(project, system.id);
    const currentCalculationFingerprint = this.createCalculationFingerprint(project, system.id);
    const latestRevision = revisions[0] || null;
    const revisionComparison = this.getRevisionComparison(project, system.id);
    const reviewProtocol = this.getReviewProtocol(project, system.id);
    const revisionCurrent = Boolean(latestRevision && latestRevision.fingerprint === currentFingerprint);
    const variantCurrent = !reportVariant || (reportVariant.calculationFingerprint || reportVariant.projectFingerprint) === currentCalculationFingerprint;

    const projectFields = [project.name, project.object, project.anlageNumber, project.author, system.name];
    const reportFields = [report.reportNumber || project.reportNumber, report.revision || project.revision];
    const totalLoss = number(calculation?.totals?.totalRounded ?? calculation?.totals?.total);
    const calculationOk = Number.isFinite(totalLoss) && totalLoss >= 0 && Array.isArray(calculation.results) && calculation.results.length > 0;
    const engineeringCritical = engineering?.status === 'critical'
      || (engineering?.findings || []).some(item => item.severity === 'critical' || item.level === 'critical');

    const items = [
      {
        id: 'calculation',
        status: calculationOk ? 'ok' : 'error',
        label: 'Berechnung',
        message: calculationOk ? `${totalLoss.toFixed(1)} Pa Gesamtdruckverlust sind berechnet.` : 'Kein gültiges Berechnungsergebnis vorhanden.',
      },
      {
        id: 'project-data',
        status: projectFields.every(value => text(value)) ? 'ok' : 'warning',
        label: 'Projektangaben',
        message: projectFields.every(value => text(value)) ? 'Projektnummer, Projektname, BKP, Anlage und Bearbeiter sind gepflegt.' : 'Projekt- oder Anlagenangaben sind noch unvollständig.',
      },
      {
        id: 'report-data',
        status: reportFields.every(value => text(value)) ? 'ok' : 'warning',
        label: 'Berichtsstand',
        message: reportFields.every(value => text(value)) ? 'Bericht-Nr. und Revision sind gesetzt.' : 'Bericht-Nr. oder Revision fehlen.',
      },
      {
        id: 'engineering',
        status: engineeringCritical ? 'warning' : 'ok',
        label: 'Engineering-QS',
        message: `Score ${Math.round(number(engineering?.score, 100))}/100 · ${(engineering?.findings || []).length} Feststellung(en).`,
      },
      {
        id: 'revision',
        status: revisionCurrent ? 'ok' : 'warning',
        label: 'Revisionssnapshot',
        message: revisionCurrent ? `Revision ${latestRevision.revision} entspricht dem aktuellen Berechnungsstand.` : revisions.length ? 'Der aktuelle Projektstand wurde nach dem letzten Revisionssnapshot verändert.' : 'Noch kein automatischer Revisionssnapshot vorhanden.',
      },
      {
        id: 'variant',
        status: variants.length && (!reportVariant || !variantCurrent) ? 'warning' : 'ok',
        label: 'Variantenvergleich',
        message: reportVariant
          ? variantCurrent
            ? `„${reportVariant.name}“ ist für den Bericht ausgewählt und basiert auf dem aktuellen Berechnungsstand.`
            : `„${reportVariant.name}“ basiert auf einem älteren Berechnungsstand und sollte neu simuliert werden.`
          : variants.length ? `${variants.length} Variante(n) gespeichert, aber keine für den Bericht ausgewählt.` : 'Kein Variantenvergleich gespeichert – optional.',
      },
      {
        id: 'review-protocol',
        status: reviewProtocol.isComplete ? 'ok' : 'warning',
        label: 'Manuelles Prüfprotokoll',
        message: reviewProtocol.isComplete
          ? `Alle ${reviewProtocol.total} Prüfpunkte wurden durch ${reviewProtocol.reviewer || 'die prüfende Stelle'} bestätigt.`
          : `${reviewProtocol.completed}/${reviewProtocol.total} manuelle Prüfpunkte sind bestätigt.`,
      },
      {
        id: 'save-state',
        status: context.isProjectDirty ? 'warning' : 'ok',
        label: 'Projektdatei',
        message: context.isProjectDirty ? 'Es gibt noch ungespeicherte Änderungen.' : 'Der Projektstand ist als gespeichert markiert.',
      },
    ];

    const weights = { error: 30, warning: 8, ok: 0 };
    const score = Math.max(0, 100 - items.reduce((sum, item) => sum + (weights[item.status] || 0), 0));
    const status = items.some(item => item.status === 'error') ? 'blocked' : items.some(item => item.status === 'warning') ? 'review' : 'ready';

    return {
      status,
      score,
      items,
      system,
      calculation: summarizeCalculation(calculation),
      engineering,
      variants,
      reportVariant,
      revisions,
      latestRevision,
      currentFingerprint,
      currentCalculationFingerprint,
      revisionCurrent,
      variantCurrent,
      revisionComparison,
      reviewProtocol,
      generatedAt: new Date().toISOString(),
      disclaimer: 'Der Projektabschluss ist eine herstellerneutrale Plausibilitäts- und Dokumentationshilfe. Er ersetzt keine objektspezifische fachliche Prüfung oder Freigabe.',
    };
  }
}
