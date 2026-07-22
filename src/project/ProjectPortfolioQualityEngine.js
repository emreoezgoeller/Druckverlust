// Druckverlust Pro – Phase 35.00
// Projektweites Cockpit und herstellerneutrale Qualitätsmatrix für Mehranlagen-Projekte.

import ProjectCalculationService from './ProjectCalculationService.js';
import EngineeringQualityEngine from '../quality/EngineeringQualityEngine.js?v=58.20';
import SystemPortfolioEngine from './SystemPortfolioEngine.js?v=58.20';

function number(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function text(value = '') {
  return String(value ?? '').trim();
}

function systemName(system = {}, index = 0) {
  return text(system.name || system.anlage || `Anlage ${index + 1}`) || `Anlage ${index + 1}`;
}

function normalizeType(value = '') {
  const source = text(value).toLocaleLowerCase('de-CH');
  if (source.includes('zuluft')) return 'Zuluft';
  if (source.includes('abluft')) return 'Abluft';
  if (source.includes('aussen') || source.includes('außen')) return 'Aussenluft';
  if (source.includes('fortluft')) return 'Fortluft';
  if (source.includes('umluft')) return 'Umluft';
  return text(value) || 'Nicht klassifiziert';
}

function projectMeta(project = {}) {
  const meta = project.meta || {};
  const report = project.report || {};
  return {
    projectNumber: text(project.projectNumber ?? project.number ?? meta.projectNumber ?? meta.number),
    projectName: text(project.name ?? project.title ?? project.projectName ?? meta.name),
    object: text(project.object ?? meta.object),
    author: text(project.author ?? project.bearbeiter ?? meta.author ?? meta.bearbeiter),
    company: text(project.company ?? meta.company),
    reportNumber: text(report.number ?? project.reportNumber ?? meta.reportNumber),
    revision: text(report.revision ?? project.revision ?? meta.revision),
  };
}

function severityRank(value = '') {
  return ({ critical: 0, warning: 1, info: 2, ok: 3 })[value] ?? 9;
}

function createFinding({
  severity = 'info',
  code = 'INFO',
  scope = 'project',
  systemId = null,
  systemName: name = '',
  sectionId = null,
  title = '',
  message = '',
  recommendation = '',
}) {
  return {
    id: `${scope}:${systemId || 'project'}:${sectionId || code}:${code}`,
    severity,
    code,
    scope,
    systemId,
    systemName: name,
    sectionId,
    title,
    message,
    recommendation,
  };
}

function csvValue(value = '') {
  const source = String(value ?? '');
  return /[;"\n\r]/.test(source) ? `"${source.replaceAll('"', '""')}"` : source;
}

function safeToken(value = 'Projekt') {
  return String(value || 'Projekt')
    .replace(/[^\wäöüÄÖÜß-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Projekt';
}

function downloadText(content, fileName, type = 'text/csv;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return { content, fileName, type };
  }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
  return { content, fileName, type };
}

export class ProjectPortfolioQualityEngine {
  static analyze(project = {}, options = {}) {
    const systems = Array.isArray(project.systems) ? project.systems : [];
    const selectedSystemId = options.selectedSystemId || null;
    const portfolio = SystemPortfolioEngine.analyze(project, { selectedSystemId });
    const meta = projectMeta(project);
    const findings = [];
    const rows = [];

    if (!systems.length) {
      findings.push(createFinding({
        severity: 'critical',
        code: 'PROJECT_NO_SYSTEMS',
        title: 'Keine Anlage vorhanden',
        message: 'Das Projekt enthält keine auswertbare Lüftungsanlage.',
        recommendation: 'Mindestens eine Anlage mit Teilstrecken anlegen.',
      }));
    }

    const documentationChecks = [
      ['projectNumber', 'Projektnummer fehlt', 'Eine eindeutige Projektnummer ergänzen.'],
      ['projectName', 'Projektname fehlt', 'Den Projekt- beziehungsweise Objektbezug eindeutig bezeichnen.'],
      ['object', 'Objektangabe fehlt', 'Die Objektbezeichnung für Bericht und Übergabe ergänzen.'],
      ['author', 'Bearbeiter fehlt', 'Die verantwortliche Bearbeitung dokumentieren.'],
      ['company', 'Firma fehlt', 'Die Firmenangabe für Bericht und Übergabe ergänzen.'],
      ['reportNumber', 'Berichtnummer fehlt', 'Vor der Abgabe eine eindeutige Berichtnummer vergeben.'],
      ['revision', 'Revision fehlt', 'Vor der Abgabe einen Revisionsstand dokumentieren.'],
    ];

    documentationChecks.forEach(([key, title, recommendation]) => {
      if (!meta[key]) {
        findings.push(createFinding({
          severity: ['projectName', 'object'].includes(key) ? 'warning' : 'info',
          code: `META_${key.toUpperCase()}_MISSING`,
          title,
          message: 'Die Angabe ist im aktuellen Projektstand nicht vollständig dokumentiert.',
          recommendation,
        }));
      }
    });

    const nameMap = new Map();
    const bkpMap = new Map();
    systems.forEach((system, index) => {
      const nameKey = systemName(system, index).toLocaleLowerCase('de-CH');
      nameMap.set(nameKey, [...(nameMap.get(nameKey) || []), system]);
      const bkp = text(system.bkpNumber ?? system.anlageNumber ?? system.systemNumber);
      if (bkp) bkpMap.set(bkp.toLocaleLowerCase('de-CH'), [...(bkpMap.get(bkp.toLocaleLowerCase('de-CH')) || []), system]);
    });

    nameMap.forEach(group => {
      if (group.length < 2) return;
      group.forEach(system => findings.push(createFinding({
        severity: 'warning',
        code: 'DUPLICATE_SYSTEM_NAME',
        scope: 'system',
        systemId: system.id,
        systemName: text(system.name),
        title: `Doppelte Anlagenbezeichnung: ${text(system.name) || 'ohne Name'}`,
        message: `${group.length} Anlagen verwenden dieselbe Bezeichnung.`,
        recommendation: 'Für Projektbaum, Bericht und Übergabe eindeutige Anlagenbezeichnungen verwenden.',
      })));
    });

    bkpMap.forEach(group => {
      if (group.length < 2) return;
      group.forEach(system => findings.push(createFinding({
        severity: 'warning',
        code: 'DUPLICATE_BKP',
        scope: 'system',
        systemId: system.id,
        systemName: text(system.name),
        title: `BKP-Nummer mehrfach vergeben`,
        message: `Die BKP-Nummer ${text(system.bkpNumber ?? system.anlageNumber ?? system.systemNumber)} wird in ${group.length} Anlagen verwendet.`,
        recommendation: 'Prüfen, ob die Doppelvergabe beabsichtigt ist oder die Anlagen eindeutiger gegliedert werden sollen.',
      })));
    });

    systems.forEach((system, index) => {
      const name = systemName(system, index);
      let calculation = null;
      let quality = null;
      let calculationError = '';

      try {
        calculation = ProjectCalculationService.calculate(project, system.id)?.calculation || null;
        quality = EngineeringQualityEngine.analyze(project, system, calculation);
      } catch (error) {
        calculationError = error?.message || String(error);
        quality = { status: 'critical', score: 0, counts: { critical: 1, warning: 0, info: 0 }, findings: [] };
        findings.push(createFinding({
          severity: 'critical',
          code: 'SYSTEM_CALCULATION_ERROR',
          scope: 'system',
          systemId: system.id,
          systemName: name,
          title: `${name}: Berechnung fehlgeschlagen`,
          message: calculationError,
          recommendation: 'Eingaben, Zuordnungen und Dimensionswerte dieser Anlage kontrollieren.',
        }));
      }

      const bkp = text(system.bkpNumber ?? system.anlageNumber ?? system.systemNumber);
      const type = normalizeType(system.type);
      const sectionCount = system.sections?.length || 0;
      const formPartCount = system.formParts?.length || 0;
      const specialCount = system.specialComponents?.length || 0;
      const totals = calculation?.totals || {};
      const maxVelocity = Math.max(0, ...(calculation?.results || []).map(item => number(item?.result?.velocity)));
      const inletAirflow = number(calculation?.results?.[0]?.result?.q ?? system.sections?.[0]?.q ?? system.sections?.[0]?.volumeFlow);

      if (!bkp) {
        findings.push(createFinding({
          severity: 'info', code: 'SYSTEM_BKP_MISSING', scope: 'system', systemId: system.id, systemName: name,
          title: `${name}: BKP-Nummer fehlt`,
          message: 'Die Anlage besitzt keine dokumentierte BKP-Nummer.',
          recommendation: 'Für Projektbaum, Bericht und Übergabe eine BKP-Nummer ergänzen.',
        }));
      }
      if (!sectionCount) {
        findings.push(createFinding({
          severity: 'warning', code: 'SYSTEM_EMPTY', scope: 'system', systemId: system.id, systemName: name,
          title: `${name}: keine Teilstrecken`,
          message: 'Die Anlage ist im Projekt vorhanden, enthält aber keine berechenbaren Teilstrecken.',
          recommendation: 'Teilstrecken ergänzen oder die unbenötigte Anlage entfernen.',
        }));
      }
      if (type === 'Nicht klassifiziert') {
        findings.push(createFinding({
          severity: 'info', code: 'SYSTEM_TYPE_UNCLASSIFIED', scope: 'system', systemId: system.id, systemName: name,
          title: `${name}: Luftart nicht klassifiziert`,
          message: 'Die Luftart ist nicht als Zu-, Ab-, Aussen-, Fort- oder Umluft bezeichnet.',
          recommendation: 'Die Luftart für projektweite Übersicht und Bericht eindeutig festlegen.',
        }));
      }

      (quality?.findings || []).forEach(item => findings.push(createFinding({
        severity: item.severity,
        code: item.code,
        scope: item.sectionId ? 'section' : 'system',
        systemId: system.id,
        systemName: name,
        sectionId: item.sectionId || null,
        title: item.title,
        message: item.message,
        recommendation: item.recommendation,
      })));

      rows.push({
        id: system.id || `system-${index + 1}`,
        position: index + 1,
        name,
        bkp,
        type,
        active: Boolean(system.id && system.id === selectedSystemId),
        sections: sectionCount,
        formParts: formPartCount,
        specialComponents: specialCount,
        totalPressureLoss: number(totals.totalRounded ?? totals.total),
        maxVelocity,
        airflow: inletAirflow,
        qualityScore: number(quality?.score, 100),
        qualityStatus: quality?.status || 'ok',
        criticalCount: number(quality?.counts?.critical),
        warningCount: number(quality?.counts?.warning),
        infoCount: number(quality?.counts?.info),
        calculationStatus: calculationError ? 'error' : 'ok',
        calculationError,
      });
    });

    findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.systemName.localeCompare(b.systemName, 'de'));
    const counts = findings.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, { critical: 0, warning: 0, info: 0 });

    const documentationFindingCount = findings.filter(item => item.code.startsWith('META_')).length;
    const documentationScore = clamp(100 - documentationFindingCount * 7);
    const engineeringAverage = rows.length ? rows.reduce((sum, row) => sum + row.qualityScore, 0) / rows.length : 0;
    const projectPenalty = counts.critical * 5 + counts.warning * 1.8 + counts.info * 0.35;
    const score = clamp(engineeringAverage * 0.72 + documentationScore * 0.28 - projectPenalty);
    const readiness = counts.critical || rows.some(row => row.calculationStatus === 'error') || !rows.length
      ? 'blocked'
      : counts.warning
        ? 'review'
        : 'ready';

    const typeSummary = [...rows.reduce((map, row) => {
      const current = map.get(row.type) || { type: row.type, systems: 0, airflow: 0, sections: 0 };
      current.systems += 1;
      current.airflow += row.airflow;
      current.sections += row.sections;
      map.set(row.type, current);
      return map;
    }, new Map()).values()].sort((a, b) => b.airflow - a.airflow || a.type.localeCompare(b.type, 'de'));

    return {
      generatedAt: new Date().toISOString(),
      readiness,
      score,
      label: readiness === 'blocked' ? 'Blockiert' : readiness === 'review' ? 'Prüfung erforderlich' : 'Bereit',
      counts,
      metadata: meta,
      documentationScore,
      engineeringAverage,
      rows,
      findings,
      topFindings: findings.slice(0, 12),
      typeSummary,
      portfolio,
      summary: {
        systems: rows.length,
        sections: rows.reduce((sum, row) => sum + row.sections, 0),
        elements: rows.reduce((sum, row) => sum + row.sections + row.formParts + row.specialComponents, 0),
        criticalSystems: rows.filter(row => row.qualityStatus === 'critical' || row.calculationStatus === 'error').length,
        warningSystems: rows.filter(row => row.qualityStatus === 'warning').length,
        emptySystems: rows.filter(row => row.sections === 0).length,
        averageQualityScore: engineeringAverage,
      },
      disclaimer: 'Herstellerneutrale, projektweite Plausibilitäts- und Dokumentationsprüfung. Anlagenkennwerte werden einzeln beurteilt und nicht als gemeinsamer Strang addiert.',
    };
  }

  static createCsv(project = {}, analysis = null) {
    const model = analysis || this.analyze(project);
    const rows = [
      ['Druckverlust Pro', 'Projektcockpit und projektweite QS'],
      ['Projekt', model.metadata.projectName],
      ['Projektnummer', model.metadata.projectNumber],
      ['Status', model.label],
      ['Projekt-Score', Math.round(model.score)],
      ['Engineering-Mittelwert', Math.round(model.engineeringAverage)],
      ['Dokumentations-Score', Math.round(model.documentationScore)],
      ['Erstellt', new Date(model.generatedAt).toLocaleString('de-CH')],
      [],
      ['Anlagenmatrix'],
      ['Nr.', 'BKP', 'Anlage', 'Luftart', 'Teilstrecken', 'Formteile', 'Sonderbauteile', 'Luftmenge m3/h', 'Max. Geschwindigkeit m/s', 'Gesamtdruckverlust Pa', 'Engineering-Score', 'Kritisch', 'Warnungen', 'Hinweise'],
      ...model.rows.map(row => [
        row.position, row.bkp, row.name, row.type, row.sections, row.formParts, row.specialComponents,
        Math.round(row.airflow), row.maxVelocity.toFixed(2), row.totalPressureLoss.toFixed(1), Math.round(row.qualityScore),
        row.criticalCount, row.warningCount, row.infoCount,
      ]),
      [],
      ['Projektweite Feststellungen'],
      ['Priorität', 'Bereich', 'Anlage', 'Code', 'Feststellung', 'Empfehlung'],
      ...model.findings.map(item => [
        item.severity, item.scope, item.systemName, item.code, item.title, item.recommendation || item.message,
      ]),
      [],
      ['Hinweis', model.disclaimer],
    ];
    return `\uFEFF${rows.map(row => row.map(csvValue).join(';')).join('\r\n')}`;
  }

  static createCsvFileName(project = {}) {
    const meta = projectMeta(project);
    return `${safeToken(meta.projectNumber || meta.projectName || 'Projekt')}_Projektcockpit_${new Date().toISOString().slice(0, 10)}.csv`;
  }

  static downloadCsv(project = {}, analysis = null) {
    const content = this.createCsv(project, analysis);
    const fileName = this.createCsvFileName(project);
    return downloadText(content, fileName);
  }
}

export default ProjectPortfolioQualityEngine;
