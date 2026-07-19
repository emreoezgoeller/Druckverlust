// Druckverlust Pro – LiveSimulationEngine
// Phase 26–28: Herstellerneutrale, nicht-destruktive Variantenrechnung.

import ProjectCalculationService from '../project/ProjectCalculationService.js';
import { normalizeType } from '../core/CalculationEngine.js';

function number(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, number(value, min)));
}

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(number(value) * factor) / factor;
}

function percentageDelta(before, after) {
  const base = number(before);
  const next = number(after);
  if (Math.abs(base) < 1e-9) return Math.abs(next) < 1e-9 ? 0 : null;
  return ((next - base) / Math.abs(base)) * 100;
}

function getSystem(project = {}, systemId = null) {
  const systems = Array.isArray(project.systems) ? project.systems : [];
  return systems.find(item => item.id === systemId) || systems[0] || null;
}

function readAirflow(section = {}) {
  return number(section.q ?? section.volumeFlow ?? section.airflow ?? section.airVolume ?? section.volumeFlowM3h);
}

function writeAirflow(section = {}, value = 0) {
  const next = Math.max(0, round(value, 1));
  section.q = next;
  if ('volumeFlow' in section) section.volumeFlow = next;
  if ('airflow' in section) section.airflow = next;
  if ('airVolume' in section) section.airVolume = next;
  if ('volumeFlowM3h' in section) section.volumeFlowM3h = next;
}

function readDimension(section = {}, key = '') {
  const aliases = key === 'd'
    ? [section.d, section.diameter]
    : key === 'b'
      ? [section.b, section.width]
      : [section.h, section.height];
  return number(aliases.find(value => value !== undefined && value !== null));
}

function writeDimension(section = {}, key = '', value = 0) {
  const next = Math.max(0.001, round(value, 3));
  if (key === 'd') {
    section.d = next;
    if ('diameter' in section) section.diameter = next;
    return;
  }
  if (key === 'b') {
    section.b = next;
    if ('width' in section) section.width = next;
    return;
  }
  section.h = next;
  if ('height' in section) section.height = next;
}

function summarizeCalculation(calculation = {}) {
  const results = Array.isArray(calculation.results) ? calculation.results : [];
  const totals = calculation.totals || {};
  const maxVelocity = results.reduce((maximum, item) => Math.max(maximum, number(item?.result?.velocity)), 0);
  const maxFrictionRate = results.reduce((maximum, item) => Math.max(maximum, number(item?.result?.frictionRate)), 0);
  const critical = [...results]
    .sort((a, b) => number(b?.result?.roundedTotalLoss ?? b?.result?.totalLoss) - number(a?.result?.roundedTotalLoss ?? a?.result?.totalLoss))[0] || null;

  return {
    totalLoss: number(totals.totalRounded ?? totals.total),
    rawTotalLoss: number(totals.total),
    frictionLoss: number(totals.friction),
    formPartLoss: number(totals.formParts, number(totals.zetaLoss) + number(totals.directFormPartLoss)),
    specialLoss: number(totals.special),
    maxVelocity,
    maxFrictionRate,
    criticalSectionId: critical?.id || '',
    criticalSectionName: critical?.input?.name || critical?.input?.ts || critical?.id || '-',
    criticalSectionLoss: number(critical?.result?.roundedTotalLoss ?? critical?.result?.totalLoss),
    sectionCount: results.length,
  };
}

function createRows(system = {}, baselineCalculation = {}, scenarioCalculation = {}) {
  const baselineMap = new Map((baselineCalculation.results || []).map(item => [item.id, item]));
  const scenarioMap = new Map((scenarioCalculation.results || []).map(item => [item.id, item]));

  return (system.sections || []).map((section, index) => {
    const baseline = baselineMap.get(section.id)?.result || {};
    const scenario = scenarioMap.get(section.id)?.result || {};
    const baselineLoss = number(baseline.roundedTotalLoss ?? baseline.totalLoss);
    const scenarioLoss = number(scenario.roundedTotalLoss ?? scenario.totalLoss);
    const baselineVelocity = number(baseline.velocity);
    const scenarioVelocity = number(scenario.velocity);

    return {
      id: section.id || `section-${index + 1}`,
      position: index + 1,
      name: section.name || section.ts || `TS ${index + 1}`,
      baseline: {
        airflow: number(baseline.q, readAirflow(section)),
        velocity: baselineVelocity,
        pressureLoss: baselineLoss,
        frictionRate: number(baseline.frictionRate),
      },
      scenario: {
        airflow: number(scenario.q),
        velocity: scenarioVelocity,
        pressureLoss: scenarioLoss,
        frictionRate: number(scenario.frictionRate),
      },
      delta: {
        velocity: scenarioVelocity - baselineVelocity,
        velocityPercent: percentageDelta(baselineVelocity, scenarioVelocity),
        pressureLoss: scenarioLoss - baselineLoss,
        pressureLossPercent: percentageDelta(baselineLoss, scenarioLoss),
      },
    };
  });
}

export default class LiveSimulationEngine {
  static normalizeOptions(options = {}) {
    return {
      scope: options.scope === 'selected' ? 'selected' : 'all',
      sectionId: String(options.sectionId || ''),
      airflowPercent: clamp(options.airflowPercent ?? 100, 50, 150),
      dimensionPercent: clamp(options.dimensionPercent ?? 100, 75, 160),
    };
  }

  static getTargetSections(system = {}, options = {}) {
    const normalized = this.normalizeOptions(options);
    const sections = Array.isArray(system.sections) ? system.sections : [];
    if (normalized.scope !== 'selected') return sections;
    return sections.filter(section => section.id === normalized.sectionId);
  }

  static applyFactorsToSystem(system = {}, options = {}) {
    const normalized = this.normalizeOptions(options);
    const targets = this.getTargetSections(system, normalized);
    const airflowFactor = normalized.airflowPercent / 100;
    const dimensionFactor = normalized.dimensionPercent / 100;

    targets.forEach(section => {
      writeAirflow(section, readAirflow(section) * airflowFactor);
      const type = normalizeType(section);
      if (type === 'pipe') {
        const diameter = readDimension(section, 'd');
        if (diameter > 0) writeDimension(section, 'd', diameter * dimensionFactor);
      } else {
        const width = readDimension(section, 'b');
        const height = readDimension(section, 'h');
        if (width > 0) writeDimension(section, 'b', width * dimensionFactor);
        if (height > 0) writeDimension(section, 'h', height * dimensionFactor);
      }
    });

    return {
      options: normalized,
      affectedSectionIds: targets.map(section => section.id),
      affectedCount: targets.length,
    };
  }

  static create(project = {}, systemId = null, options = {}) {
    const normalized = this.normalizeOptions(options);
    const baselineProject = deepClone(project);
    const baselineSystem = getSystem(baselineProject, systemId);
    if (!baselineSystem) throw new Error('Für die Live-Simulation ist keine Anlage vorhanden.');

    const scenarioProject = deepClone(project);
    const scenarioSystem = getSystem(scenarioProject, systemId);
    const application = this.applyFactorsToSystem(scenarioSystem, normalized);

    const baselineResult = ProjectCalculationService.calculate(baselineProject, baselineSystem.id);
    const scenarioResult = ProjectCalculationService.calculate(scenarioProject, scenarioSystem.id);
    const baseline = summarizeCalculation(baselineResult.calculation);
    const scenario = summarizeCalculation(scenarioResult.calculation);
    const rows = createRows(baselineSystem, baselineResult.calculation, scenarioResult.calculation);

    return {
      options: normalized,
      affectedSectionIds: application.affectedSectionIds,
      affectedCount: application.affectedCount,
      baseline,
      scenario,
      delta: {
        totalLoss: scenario.totalLoss - baseline.totalLoss,
        totalLossPercent: percentageDelta(baseline.totalLoss, scenario.totalLoss),
        maxVelocity: scenario.maxVelocity - baseline.maxVelocity,
        maxVelocityPercent: percentageDelta(baseline.maxVelocity, scenario.maxVelocity),
        frictionLoss: scenario.frictionLoss - baseline.frictionLoss,
        formPartLoss: scenario.formPartLoss - baseline.formPartLoss,
      },
      rows,
      generatedAt: new Date().toISOString(),
      isNeutralSimulation: true,
      isNonDestructive: true,
    };
  }

  static applyToProject(project = {}, systemId = null, options = {}) {
    const system = getSystem(project, systemId);
    if (!system) throw new Error('Keine Anlage zum Übernehmen der Simulation vorhanden.');
    return this.applyFactorsToSystem(system, options);
  }
}
