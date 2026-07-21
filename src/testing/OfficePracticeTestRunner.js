// Druckverlust Pro – Phase 56.00
// Führt deterministische Büro- und Praxistests für kleine, mittlere und grosse Projekte aus.

import { performance } from 'node:perf_hooks';
import createDefaultProject from '../project/defaultProject.js';
import {
  createPhase56PracticePortfolio,
} from '../project/officePracticeProjects.js';
import ProjectCalculationService from '../project/ProjectCalculationService.js';
import ReportEngine from '../report/ReportEngine.js';
import StorageEngine from '../storage/StorageEngine.js';

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function countReportPages(html = '') {
  return (String(html).match(/<section class="report-page(?:\s|\")/g) || []).length;
}

function finiteNumbers(value, path = 'root', findings = []) {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    findings.push(path);
    return findings;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => finiteNumbers(item, `${path}[${index}]`, findings));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => finiteNumbers(item, `${path}.${key}`, findings));
  }

  return findings;
}

function createCheck(id, label, passed, actual, expected, detail = '') {
  return {
    id,
    label,
    passed: Boolean(passed),
    actual,
    expected,
    detail,
  };
}

function createManualReferenceProject() {
  const project = createDefaultProject({
    projectId: 'p56-hand-project',
    systemId: 'p56-hand-system',
    projectNumber: 'P56-HAND',
    projectName: 'Unabhängige Handreferenz',
    anlage: 'Zuluft Referenz',
    siaRoomUsageCode: '3.01',
    siaOperationMode: 'two-stage',
    settings: {
      rho: 1.21,
      frictionFactorMode: 'fixed',
      lambda: 0.025,
      sectionRoundingStep: 0.5,
    },
  });

  const system = project.systems[0];
  system.sections = [
    {
      id: 'p56-hand-duct',
      name: 'TS-H1',
      type: 'duct',
      q: 1800,
      b: 0.6,
      h: 0.3,
      d: 0,
      l: 12,
      roughnessMm: 0.15,
      zetaSum: 0.15,
    },
    {
      id: 'p56-hand-pipe',
      name: 'TS-H2',
      type: 'pipe',
      q: 900,
      b: 0,
      h: 0,
      d: 0.315,
      l: 8,
      roughnessMm: 0.15,
      zetaSum: 0.10,
    },
  ];
  system.formParts = [
    { id: 'p56-hand-fp1', name: 'ζ Kanal', type: 'freier_zeta_wert', sectionId: 'p56-hand-duct', zeta: 0.35 },
    { id: 'p56-hand-fp2', name: 'ζ Rohr', type: 'freier_zeta_wert', sectionId: 'p56-hand-pipe', zeta: 0.55 },
  ];
  system.specialComponents = [
    { id: 'p56-hand-sp1', name: 'Filter Referenz', sectionId: 'p56-hand-duct', pressureLoss: 42, pa: 42 },
  ];

  return project;
}

function manualSection({ q, area, hydraulicDiameter, length, lambda, rho, zeta }) {
  const velocity = q / (3600 * area);
  const dynamicPressure = 0.5 * rho * velocity * velocity;
  const frictionLoss = (lambda / hydraulicDiameter) * dynamicPressure * length;
  const zetaLoss = zeta * dynamicPressure;
  return { velocity, dynamicPressure, frictionLoss, zetaLoss, total: frictionLoss + zetaLoss };
}

function runManualReference() {
  const project = createManualReferenceProject();
  const system = project.systems[0];
  const result = ProjectCalculationService.calculate(project, system.id);
  const rho = 1.21;
  const lambda = 0.025;

  const duct = manualSection({
    q: 1800,
    area: 0.6 * 0.3,
    hydraulicDiameter: (2 * 0.6 * 0.3) / (0.6 + 0.3),
    length: 12,
    lambda,
    rho,
    zeta: 0.15 + 0.35,
  });
  const pipeArea = Math.PI * 0.315 * 0.315 / 4;
  const pipe = manualSection({
    q: 900,
    area: pipeArea,
    hydraulicDiameter: 0.315,
    length: 8,
    lambda,
    rho,
    zeta: 0.10 + 0.55,
  });
  const expected = {
    friction: duct.frictionLoss + pipe.frictionLoss,
    zeta: duct.zetaLoss + pipe.zetaLoss,
    special: 42,
    total: duct.total + pipe.total + 42,
  };

  const actual = result.calculation.totals;
  const tolerance = 1e-8;
  const checks = [
    createCheck('hand-friction', 'Reibungssumme stimmt mit unabhängiger Handrechnung überein', Math.abs(actual.friction - expected.friction) <= tolerance, round(actual.friction, 8), round(expected.friction, 8)),
    createCheck('hand-zeta', 'ζ-Verlustsumme stimmt mit unabhängiger Handrechnung überein', Math.abs(actual.zetaLoss - expected.zeta) <= tolerance, round(actual.zetaLoss, 8), round(expected.zeta, 8)),
    createCheck('hand-special', 'Sonderbauteilsumme stimmt mit der Büroreferenz überein', Math.abs(actual.special - expected.special) <= tolerance, actual.special, expected.special),
    createCheck('hand-total', 'Gesamtsumme stimmt mit unabhängiger Handrechnung überein', Math.abs(actual.total - expected.total) <= tolerance, round(actual.total, 8), round(expected.total, 8)),
    createCheck('hand-audit', 'Komponentenaudit der Handreferenz ist geschlossen', actual.audit?.ok === true && Math.abs(actual.audit?.difference || 0) <= tolerance, round(actual.audit?.difference || 0, 12), 0),
  ];

  return { project, result, expected, checks };
}

function runRoughnessSensitivity() {
  const project = createDefaultProject({
    projectId: 'p56-roughness-project',
    systemId: 'p56-roughness-system',
    projectNumber: 'P56-K',
    projectName: 'Rauigkeitsvergleich',
    siaRoomUsageCode: '3.01',
    siaOperationMode: 'two-stage',
  });
  const system = project.systems[0];
  system.sections = [
    { id: 'p56-k-low', name: 'k 0,09', type: 'pipe', q: 2200, d: 0.4, b: 0, h: 0, l: 20, roughnessMm: 0.09, zetaSum: 0 },
    { id: 'p56-k-high', name: 'k 0,30', type: 'pipe', q: 2200, d: 0.4, b: 0, h: 0, l: 20, roughnessMm: 0.30, zetaSum: 0 },
  ];
  system.formParts = [];
  system.specialComponents = [];

  const result = ProjectCalculationService.calculate(project, system.id);
  const low = result.calculation.results[0].result;
  const high = result.calculation.results[1].result;
  const checks = [
    createCheck('roughness-lambda', 'Höhere Rauigkeit erhöht die Reibungszahl', high.frictionFactor > low.frictionFactor, round(high.frictionFactor, 6), `> ${round(low.frictionFactor, 6)}`),
    createCheck('roughness-loss', 'Höhere Rauigkeit erhöht den Reibungsverlust', high.frictionLoss > low.frictionLoss, round(high.frictionLoss, 4), `> ${round(low.frictionLoss, 4)}`),
    createCheck('roughness-geometry', 'Vergleich verwendet identische Geometrie und Luftmenge', Math.abs(high.velocity - low.velocity) <= 1e-12, round(high.velocity, 8), round(low.velocity, 8)),
  ];

  return { project, result, checks };
}

function runProjectScenario(project, index) {
  const expected = project.phase56Practice.expected;
  const primarySystem = project.systems.find(system => system.id === project.phase56Practice.primarySystemId) || project.systems[0];
  const startedCalculation = performance.now();
  const calculations = project.systems.map(system => ({
    system,
    result: ProjectCalculationService.calculate(project, system.id),
  }));
  const calculationMs = performance.now() - startedCalculation;
  const primaryCalculation = calculations.find(item => item.system.id === primarySystem.id)?.result;
  project.calculationResult = primaryCalculation;

  const startedReport = performance.now();
  const reportModel = ReportEngine.createReportModel(project, {
    system: primarySystem,
    registry: ProjectCalculationService.getFormPartRegistry(),
  });
  const pagePlan = ReportEngine.createPagePlan(reportModel);
  const reportHtml = ReportEngine.createStandaloneHtml(reportModel);
  const reportCsv = ReportEngine.createCsv(reportModel);
  const reportMs = performance.now() - startedReport;

  const startedStorage = performance.now();
  const serialized = StorageEngine.serialize(project);
  const reopened = StorageEngine.parse(serialized, { fileName: `${project.name}.dvp` });
  const storageMs = performance.now() - startedStorage;
  const reopenedCalculations = reopened.systems.map(system => ProjectCalculationService.calculate(reopened, system.id));

  const allSections = project.systems.flatMap(system => system.sections || []);
  const allFormParts = project.systems.flatMap(system => system.formParts || []);
  const allSpecials = project.systems.flatMap(system => system.specialComponents || []);
  const resultRows = calculations.flatMap(item => item.result.calculation.results || []);
  const velocityRows = calculations.flatMap(item => item.result.velocityCompliance?.rows || []);
  const renderedPages = countReportPages(reportHtml);
  const nonFinitePaths = finiteNumbers(calculations.map(item => item.result.calculation));
  const totalRoundtripDifference = calculations.reduce((sum, item, systemIndex) => {
    const sourceTotal = Number(item.result.calculation.totals.total || 0);
    const reopenedTotal = Number(reopenedCalculations[systemIndex]?.calculation?.totals?.total || 0);
    return sum + Math.abs(sourceTotal - reopenedTotal);
  }, 0);

  const ductCount = allSections.filter(section => section.type === 'duct').length;
  const pipeCount = allSections.filter(section => section.type === 'pipe').length;
  const maxCalculationMs = index === 2 ? 10000 : index === 1 ? 5000 : 2500;
  const maxReportMs = index === 2 ? 15000 : index === 1 ? 8000 : 4000;
  const maxStorageMs = index === 2 ? 8000 : 4000;
  const firstPrimary = primarySystem.sections[0];
  const lastPrimary = primarySystem.sections.at(-1);

  const checks = [
    createCheck(`${index}-systems`, 'Anlagenanzahl entspricht dem Praxisprofil', project.systems.length === expected.systems, project.systems.length, expected.systems),
    createCheck(`${index}-sections`, 'Alle vorgesehenen Teilstrecken sind vorhanden', allSections.length === expected.sections, allSections.length, expected.sections),
    createCheck(`${index}-formparts`, 'Alle vorgesehenen Formteile sind vorhanden', allFormParts.length === expected.formParts, allFormParts.length, expected.formParts),
    createCheck(`${index}-specials`, 'Alle vorgesehenen Sonderbauteile sind vorhanden', allSpecials.length === expected.specialComponents, allSpecials.length, expected.specialComponents),
    createCheck(`${index}-mixed`, 'Rechteck- und Rundnetze sind gemeinsam enthalten', ductCount > 0 && pipeCount > 0, `${ductCount} Kanal / ${pipeCount} Rohr`, 'beide > 0'),
    createCheck(`${index}-unique-sections`, 'Teilstrecken-IDs sind projektweit eindeutig', new Set(allSections.map(item => item.id)).size === allSections.length, new Set(allSections.map(item => item.id)).size, allSections.length),
    createCheck(`${index}-unique-parts`, 'Formteil-IDs sind projektweit eindeutig', new Set(allFormParts.map(item => item.id)).size === allFormParts.length, new Set(allFormParts.map(item => item.id)).size, allFormParts.length),
    createCheck(`${index}-assignments`, 'Alle Bauteile sind gültigen Teilstrecken zugeordnet', allFormParts.every(part => allSections.some(section => section.id === part.sectionId)) && allSpecials.every(part => allSections.some(section => section.id === part.sectionId)), 'vollständig', 'vollständig'),
    createCheck(`${index}-calculated`, 'Jede Teilstrecke wurde berechnet', resultRows.length === allSections.length, resultRows.length, allSections.length),
    createCheck(`${index}-errors`, 'Berechnung enthält keine blockierenden Fehler', calculations.every(item => item.result.quality.errorCount === 0), calculations.reduce((sum, item) => sum + item.result.quality.errorCount, 0), 0),
    createCheck(`${index}-finite`, 'Berechnung enthält keine NaN-/Infinity-Werte', nonFinitePaths.length === 0, nonFinitePaths.length ? nonFinitePaths.slice(0, 3).join(', ') : 'keine', 'keine'),
    createCheck(`${index}-audit`, 'Summenaudit ist in allen Anlagen geschlossen', calculations.every(item => item.result.calculation.totals.audit?.ok === true), calculations.map(item => round(item.result.calculation.totals.audit?.difference || 0, 10)).join(' / '), 0),
    createCheck(`${index}-sia-config`, 'SIA-Raumnutzung und Betriebsart sind in jeder Anlage vollständig', calculations.every(item => item.result.velocityCompliance?.config?.complete), calculations.filter(item => item.result.velocityCompliance?.config?.complete).length, calculations.length),
    createCheck(`${index}-sia-rows`, 'SIA-Prüfung bewertet jede Teilstrecke', velocityRows.length === allSections.length && velocityRows.every(row => row.status !== 'not-configured'), velocityRows.length, allSections.length),
    createCheck(`${index}-report-count`, 'Berichtmodell enthält alle Teilstrecken der gewählten Anlage', reportModel.counts.sections === primarySystem.sections.length, reportModel.counts.sections, primarySystem.sections.length),
    createCheck(`${index}-report-pages`, 'Gerenderte Berichtseiten entsprechen dem Seitenplan', renderedPages === pagePlan.totalPages, renderedPages, pagePlan.totalPages),
    createCheck(`${index}-report-first`, 'Erste Teilstrecke ist im Bericht enthalten', reportHtml.includes(firstPrimary.name), reportHtml.includes(firstPrimary.name) ? firstPrimary.name : 'fehlt', firstPrimary.name),
    createCheck(`${index}-report-last`, 'Letzte Teilstrecke ist im Bericht enthalten', reportHtml.includes(lastPrimary.name), reportHtml.includes(lastPrimary.name) ? lastPrimary.name : 'fehlt', lastPrimary.name),
    createCheck(`${index}-report-clean`, 'Bericht enthält keine sichtbaren NaN-/undefined-Ausgaben', !/\bNaN\b|>undefined<|\bInfinity\b/.test(reportHtml), 'sauber', 'sauber'),
    createCheck(`${index}-csv-last`, 'CSV-Export enthält die letzte Teilstrecke', reportCsv.includes(lastPrimary.name), reportCsv.includes(lastPrimary.name) ? lastPrimary.name : 'fehlt', lastPrimary.name),
    createCheck(`${index}-storage-systems`, 'Speicher-Roundtrip erhält alle Anlagen', reopened.systems.length === project.systems.length, reopened.systems.length, project.systems.length),
    createCheck(`${index}-storage-sections`, 'Speicher-Roundtrip erhält alle Teilstrecken', reopened.systems.reduce((sum, system) => sum + system.sections.length, 0) === allSections.length, reopened.systems.reduce((sum, system) => sum + system.sections.length, 0), allSections.length),
    createCheck(`${index}-storage-parts`, 'Speicher-Roundtrip erhält alle Formteile', reopened.systems.reduce((sum, system) => sum + system.formParts.length, 0) === allFormParts.length, reopened.systems.reduce((sum, system) => sum + system.formParts.length, 0), allFormParts.length),
    createCheck(`${index}-storage-total`, 'Speicher-Roundtrip erhält die Rechenergebnisse', totalRoundtripDifference <= 1e-7, round(totalRoundtripDifference, 10), '≤ 1e-7 Pa'),
    createCheck(`${index}-file-size`, 'Projektdatei bleibt unter 10 MB', serialized.length < 10_000_000, `${Math.round(serialized.length / 1024)} KiB`, '< 9’766 KiB'),
    createCheck(`${index}-calc-performance`, 'Berechnung bleibt innerhalb des Praxis-Zeitbudgets', calculationMs < maxCalculationMs, `${calculationMs.toFixed(1)} ms`, `< ${maxCalculationMs} ms`),
    createCheck(`${index}-report-performance`, 'Berichtaufbau bleibt innerhalb des Praxis-Zeitbudgets', reportMs < maxReportMs, `${reportMs.toFixed(1)} ms`, `< ${maxReportMs} ms`),
    createCheck(`${index}-storage-performance`, 'Speichern/Öffnen bleibt innerhalb des Praxis-Zeitbudgets', storageMs < maxStorageMs, `${storageMs.toFixed(1)} ms`, `< ${maxStorageMs} ms`),
  ];

  if (index === 2) {
    checks.push(createCheck('large-primary-100', 'Kritischer Grossstrang enthält mindestens 100 Teilstrecken', primarySystem.sections.length >= 100, primarySystem.sections.length, '≥ 100'));
    checks.push(createCheck('large-parts-100', 'Grossprojekt enthält eine umfangreiche Bauteilkette', primarySystem.formParts.length >= 100, primarySystem.formParts.length, '≥ 100'));
    checks.push(createCheck('large-multipage', 'Grossprojekt erzeugt einen umfangreichen Mehrseitenbericht', pagePlan.totalPages >= 30, pagePlan.totalPages, '≥ 30'));
  }

  return {
    label: project.phase56Practice.label,
    project,
    primarySystem,
    calculations,
    primaryCalculation,
    reportModel,
    pagePlan,
    reportHtml,
    reportCsv,
    serializedBytes: serialized.length,
    timings: { calculationMs, reportMs, storageMs },
    counts: {
      systems: project.systems.length,
      sections: allSections.length,
      formParts: allFormParts.length,
      specialComponents: allSpecials.length,
      reportPages: pagePlan.totalPages,
      siaExceeded: velocityRows.filter(row => row.status === 'exceeded').length,
      siaWarnings: velocityRows.filter(row => row.status === 'warning').length,
    },
    checks,
  };
}

export function runOfficePracticeTestValidation() {
  const startedAt = new Date().toISOString();
  const scenarios = createPhase56PracticePortfolio().map(runProjectScenario);
  const manualReference = runManualReference();
  const roughnessSensitivity = runRoughnessSensitivity();
  const checks = [
    ...scenarios.flatMap(item => item.checks),
    ...manualReference.checks,
    ...roughnessSensitivity.checks,
  ];
  const failedChecks = checks.filter(check => !check.passed);

  return {
    id: 'PHASE-56-OFFICE-PRACTICE',
    label: failedChecks.length ? 'Phase-56-Praxistest fehlgeschlagen' : 'Phase-56-Praxistest bestanden',
    status: failedChecks.length ? 'error' : 'ok',
    summary: failedChecks.length
      ? `${failedChecks.length} von ${checks.length} Prüfungen fehlgeschlagen.`
      : `${checks.length} von ${checks.length} Prüfungen bestanden. Kleine, mittlere und grosse Mehranlagenprojekte sind rechnerisch, dateitechnisch und im Bericht konsistent.`,
    startedAt,
    finishedAt: new Date().toISOString(),
    checks,
    failedChecks,
    scenarios,
    manualReference,
    roughnessSensitivity,
    totals: {
      checks: checks.length,
      passed: checks.length - failedChecks.length,
      failed: failedChecks.length,
      projects: scenarios.length,
      systems: scenarios.reduce((sum, item) => sum + item.counts.systems, 0),
      sections: scenarios.reduce((sum, item) => sum + item.counts.sections, 0),
      formParts: scenarios.reduce((sum, item) => sum + item.counts.formParts, 0),
      specialComponents: scenarios.reduce((sum, item) => sum + item.counts.specialComponents, 0),
      reportPages: scenarios.reduce((sum, item) => sum + item.counts.reportPages, 0),
    },
  };
}

export default runOfficePracticeTestValidation;
