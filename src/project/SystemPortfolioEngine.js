// Druckverlust Pro – Phase 35.00
// Herstellerneutraler Anlagenmanager und projektweiter Anlagenvergleich.

import ProjectCalculationService from './ProjectCalculationService.js';
import EngineeringQualityEngine from '../quality/EngineeringQualityEngine.js?v=35.00';

function number(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatCsvValue(value = '') {
  const text = String(value ?? '');
  return /[;"\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function safeToken(value = 'Projekt') {
  return String(value || 'Projekt')
    .replace(/[^\wäöüÄÖÜß-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Projekt';
}

function downloadText(text, fileName, type = 'text/csv;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return { text, fileName, type };
  }

  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
  return { text, fileName, type };
}

function systemLabel(system = {}, index = 0) {
  return String(system.name || system.anlage || `Anlage ${index + 1}`).trim() || `Anlage ${index + 1}`;
}

function maxVelocity(calculation = {}) {
  return Math.max(0, ...(calculation.results || []).map(item => number(item?.result?.velocity)));
}

function inletAirflow(system = {}, calculation = {}) {
  const firstResult = calculation.results?.[0]?.result;
  const firstSection = system.sections?.[0];
  return number(firstResult?.q ?? firstSection?.q ?? firstSection?.volumeFlow ?? firstSection?.airVolume);
}

export class SystemPortfolioEngine {
  static analyze(project = {}, options = {}) {
    const systems = Array.isArray(project.systems) ? project.systems : [];
    const selectedSystemId = options.selectedSystemId || null;
    const rows = systems.map((system, index) => {
      let result = null;
      let quality = null;
      let calculationError = '';

      try {
        result = ProjectCalculationService.calculate(project, system.id);
        quality = EngineeringQualityEngine.analyze(project, system, result.calculation);
      } catch (error) {
        calculationError = error?.message || String(error);
        quality = {
          status: 'critical',
          score: 0,
          counts: { critical: 1, warning: 0, info: 0 },
          findings: [],
        };
      }

      const calculation = result?.calculation || {};
      const totals = calculation.totals || {};
      const sections = system.sections || [];
      const formParts = system.formParts || [];
      const specialComponents = system.specialComponents || [];

      return {
        index,
        position: index + 1,
        id: system.id || `system-${index + 1}`,
        name: systemLabel(system, index),
        type: String(system.type || 'Lüftungsanlage'),
        bkp: String(system.bkpNumber ?? system.anlageNumber ?? system.systemNumber ?? ''),
        description: String(system.description || ''),
        active: Boolean(selectedSystemId && system.id === selectedSystemId),
        sections: sections.length,
        formParts: formParts.length,
        specialComponents: specialComponents.length,
        airflow: inletAirflow(system, calculation),
        maxVelocity: maxVelocity(calculation),
        totalPressureLoss: number(totals.totalRounded ?? totals.total),
        rawPressureLoss: number(totals.total),
        frictionLoss: number(totals.friction),
        formPartLoss: number(totals.formParts, number(totals.zetaLoss) + number(totals.directFormPartLoss)),
        specialLoss: number(totals.special),
        qualityStatus: quality?.status || 'ok',
        qualityScore: number(quality?.score, 100),
        criticalCount: number(quality?.counts?.critical),
        warningCount: number(quality?.counts?.warning),
        infoCount: number(quality?.counts?.info),
        calculationStatus: calculationError ? 'error' : 'ok',
        calculationError,
      };
    });

    const totalElements = rows.reduce((sum, row) => sum + row.sections + row.formParts + row.specialComponents, 0);
    const totalSections = rows.reduce((sum, row) => sum + row.sections, 0);
    const averageScore = rows.length
      ? rows.reduce((sum, row) => sum + row.qualityScore, 0) / rows.length
      : 0;
    const highestLoss = [...rows].sort((a, b) => b.totalPressureLoss - a.totalPressureLoss)[0] || null;
    const highestVelocity = [...rows].sort((a, b) => b.maxVelocity - a.maxVelocity)[0] || null;
    const duplicateNames = this.findDuplicateNames(rows);
    const status = rows.some(row => row.calculationStatus === 'error' || row.qualityStatus === 'critical')
      ? 'critical'
      : rows.some(row => row.qualityStatus === 'warning') || duplicateNames.length
        ? 'warning'
        : rows.length
          ? 'ok'
          : 'empty';

    return {
      status,
      generatedAt: new Date().toISOString(),
      rows,
      duplicateNames,
      summary: {
        systems: rows.length,
        totalSections,
        totalElements,
        averageQualityScore: averageScore,
        highestLoss,
        highestVelocity,
        criticalSystems: rows.filter(row => row.qualityStatus === 'critical' || row.calculationStatus === 'error').length,
        warningSystems: rows.filter(row => row.qualityStatus === 'warning').length,
      },
      disclaimer: 'Projektweiter, herstellerneutraler Anlagenvergleich. Die Kennwerte beziehen sich auf die jeweilige Einzelanlage und werden nicht als gemeinsamer Strang addiert.',
    };
  }

  static findDuplicateNames(rows = []) {
    const counts = new Map();
    rows.forEach(row => {
      const key = String(row.name || '').trim().toLocaleLowerCase('de-CH');
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return rows.filter(row => counts.get(String(row.name || '').trim().toLocaleLowerCase('de-CH')) > 1).map(row => row.id);
  }

  static createCsv(project = {}, analysis = null) {
    const model = analysis || this.analyze(project);
    const lines = [
      ['Druckverlust Pro', 'Anlagenvergleich'],
      ['Projekt', project.name || project.meta?.name || ''],
      ['Objekt', project.object || project.meta?.object || ''],
      ['Erstellt', new Date(model.generatedAt).toLocaleString('de-CH')],
      [],
      ['Nr.', 'BKP', 'Anlage', 'Typ', 'Teilstrecken', 'Formteile', 'Sonderbauteile', 'Luftmenge m3/h', 'Max. Geschwindigkeit m/s', 'Gesamtdruckverlust Pa', 'Engineering-Score', 'Status'],
      ...model.rows.map(row => [
        row.position,
        row.bkp,
        row.name,
        row.type,
        row.sections,
        row.formParts,
        row.specialComponents,
        Math.round(row.airflow),
        row.maxVelocity.toFixed(2),
        row.totalPressureLoss.toFixed(1),
        Math.round(row.qualityScore),
        row.calculationStatus === 'error' ? 'Berechnungsfehler' : row.qualityStatus,
      ]),
      [],
      ['Hinweis', model.disclaimer],
    ];

    return `\uFEFF${lines.map(row => row.map(formatCsvValue).join(';')).join('\r\n')}`;
  }

  static createCsvFileName(project = {}) {
    const projectToken = safeToken(project.name || project.meta?.name || 'Projekt');
    const date = new Date().toISOString().slice(0, 10);
    return `${projectToken}_Anlagenvergleich_${date}.csv`;
  }

  static downloadCsv(project = {}, analysis = null) {
    const text = this.createCsv(project, analysis);
    const fileName = this.createCsvFileName(project);
    return downloadText(text, fileName);
  }
}

export default SystemPortfolioEngine;
