// Druckverlust Pro – ReleaseCandidateDiagnostics
// Phase 57.00: technische Schlussprüfung für den internen Release Candidate.

import ProjectCalculationService from '../project/ProjectCalculationService.js?v=57.00';
import ProjectDiagnostics from './ProjectDiagnostics.js?v=57.00';
import CalculationDiagnostics from './CalculationDiagnostics.js?v=57.00';
import DeploymentDiagnostics from './DeploymentDiagnostics.js?v=57.00';
import ProjectFileDiagnostics from './ProjectFileDiagnostics.js?v=57.00';
import ReportEngine from '../report/ReportEngine.js?v=57.00';
import createDemoProject from '../project/demoProject.js?v=57.00';
import { createSmallOfficePracticeProject } from '../project/officePracticeProjects.js?v=57.00';
import StorageEngine, { PROJECT_FILE_SCHEMA_VERSION } from '../storage/StorageEngine.js?v=57.00';
import {
  APP_ASSET_VERSION,
  APP_RELEASE,
  APP_VERSION,
  APP_BUILD_LABEL,
} from '../core/appVersion.js?v=57.00';

function createItem(status, area, label, message, details = '') {
  return { status, area, label, message, details };
}

function counts(items = []) {
  return items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { ok: 0, warning: 0, error: 0, total: 0 });
}

function statusFromItems(items = []) {
  const current = counts(items);
  if (current.error) return 'error';
  if (current.warning) return 'warning';
  return 'ok';
}

function labelFromStatus(status = 'ok') {
  if (status === 'error') return 'RC blockiert';
  if (status === 'warning') return 'RC mit Hinweisen';
  return 'RC bereit';
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((safeNumber(value) + Number.EPSILON) * factor) / factor;
}

function getProjectCounts(project = {}) {
  return safeArray(project.systems).reduce((summary, system) => {
    summary.systems += 1;
    summary.sections += safeArray(system?.sections).length;
    summary.formParts += safeArray(system?.formParts).length;
    summary.specialComponents += safeArray(system?.specialComponents).length;
    return summary;
  }, { systems: 0, sections: 0, formParts: 0, specialComponents: 0 });
}

function getSystemTotal(result = {}) {
  return safeNumber(
    result?.calculation?.totals?.totalRounded
    ?? result?.calculation?.totals?.total,
    Number.NaN,
  );
}

function summarizeCheck(area, label, check = null, okMessage = '') {
  if (!check) {
    return createItem('error', area, label, 'Prüfung konnte nicht erstellt werden.');
  }

  const status = check.status || 'warning';
  const statusLabel = check.label || status;
  const detail = `OK ${check.counts?.ok ?? 0} · Hinweise ${check.counts?.warning ?? 0} · Fehler ${check.counts?.error ?? 0}`;

  if (status === 'ok') {
    return createItem('ok', area, label, okMessage || `${statusLabel}: Prüfung ohne Fehler.`, detail);
  }

  if (status === 'error') {
    return createItem('error', area, label, check.summary || `${statusLabel}: Fehler gefunden.`, detail);
  }

  return createItem('warning', area, label, check.summary || `${statusLabel}: Hinweise gefunden.`, detail);
}

function worstStatus(checks = []) {
  if (checks.some(check => check?.status === 'error')) return 'error';
  if (checks.some(check => check?.status === 'warning')) return 'warning';
  return 'ok';
}

function combineChecks(checks = [], label = 'Prüfung') {
  const normalized = safeArray(checks).filter(Boolean);
  const combined = normalized.reduce((summary, check) => {
    summary.ok += safeNumber(check?.counts?.ok, 0);
    summary.warning += safeNumber(check?.counts?.warning, 0);
    summary.error += safeNumber(check?.counts?.error, 0);
    summary.total += safeNumber(check?.counts?.total, 0);
    return summary;
  }, { ok: 0, warning: 0, error: 0, total: 0 });

  return {
    status: worstStatus(normalized),
    label,
    summary: `${normalized.length} Anlage(n) geprüft.`,
    counts: combined,
  };
}

function calculateAllSystems(project = {}, activeSystemId = '') {
  const startedAt = nowMs();
  const entries = safeArray(project.systems).map(system => {
    const systemStartedAt = nowMs();
    const result = ProjectCalculationService.calculate(project, system?.id || null);
    const durationMs = nowMs() - systemStartedAt;
    return { system, result, durationMs, total: getSystemTotal(result) };
  });
  const durationMs = nowMs() - startedAt;
  const activeEntry = entries.find(entry => entry.system?.id === activeSystemId) || entries[0] || null;

  if (activeEntry) project.calculationResult = activeEntry.result;

  return { entries, activeEntry, durationMs };
}

function createCalculationPortfolioItem(calculationRun = null) {
  const entries = safeArray(calculationRun?.entries);
  const invalid = entries.filter(entry => !Number.isFinite(entry.total) || entry.total < 0);

  if (!entries.length) {
    return createItem('error', 'Berechnung', 'Alle Anlagen', 'Keine Anlage konnte berechnet werden.');
  }
  if (invalid.length) {
    return createItem(
      'error',
      'Berechnung',
      'Alle Anlagen',
      `${invalid.length} Anlage(n) liefern kein gültiges Druckverlustresultat.`,
      invalid.map(entry => entry.system?.name || entry.system?.id || 'Unbenannt').join(' · '),
    );
  }

  return createItem(
    'ok',
    'Berechnung',
    'Alle Anlagen',
    `${entries.length} Anlage(n) wurden vollständig neu berechnet.`,
    `${round(calculationRun.durationMs, 1)} ms · ${entries.map(entry => `${entry.system?.name || '-'}: ${round(entry.total, 1)} Pa`).join(' · ')}`,
  );
}

function createPortfolioDiagnostics(project = null, calculationRun = null) {
  const projectChecks = [];
  const calculationChecks = [];

  safeArray(calculationRun?.entries).forEach(entry => {
    project.calculationResult = entry.result;
    projectChecks.push(ProjectDiagnostics.create(project, { system: entry.system }));
    calculationChecks.push(CalculationDiagnostics.create(project, { system: entry.system }));
  });

  if (calculationRun?.activeEntry) {
    project.calculationResult = calculationRun.activeEntry.result;
  }

  return {
    projectChecks,
    calculationChecks,
    projectCheck: combineChecks(projectChecks, 'Projektcheck'),
    calculationCheck: combineChecks(calculationChecks, 'Rechen-QS'),
  };
}

function createReportPortfolioItem(project = null, registry = null) {
  if (!project) {
    return { item: createItem('error', 'Bericht', 'Alle Anlagen', 'Kein Projekt für Bericht vorhanden.'), metrics: {} };
  }

  const startedAt = nowMs();
  const reportRows = [];
  const errors = [];

  safeArray(project.systems).forEach(system => {
    try {
      const model = ReportEngine.createReportModel(project, { system, registry });
      const checklist = ReportEngine.createExportChecklist(model);
      const pagePlan = checklist?.pagePlan || ReportEngine.createPagePlan(model);
      const pages = safeNumber(checklist?.printGuidance?.totalPages || pagePlan?.totalPages, 0);
      const hasTitle = hasText(checklist?.documentTitle || ReportEngine.createDocumentTitle(model));
      const hasContent = safeNumber(model?.counts?.sections, 0) > 0
        || safeNumber(model?.counts?.formParts, 0) > 0
        || safeNumber(model?.counts?.specialComponents, 0) > 0;

      if (!hasTitle || pages <= 0 || !hasContent) {
        errors.push(`${system?.name || 'Unbenannt'}: Titel, Seitenplan oder Inhalt unvollständig`);
      }

      reportRows.push({ system, model, checklist, pages });
    } catch (error) {
      errors.push(`${system?.name || 'Unbenannt'}: ${error.message}`);
    }
  });

  const durationMs = nowMs() - startedAt;
  const totalPages = reportRows.reduce((sum, row) => sum + row.pages, 0);

  if (errors.length) {
    return {
      item: createItem('error', 'Bericht', 'Alle Anlagen', `${errors.length} Berichtprüfung(en) sind fehlgeschlagen.`, errors.join(' · ')),
      metrics: { reportMs: durationMs, reportPages: totalPages },
    };
  }

  return {
    item: createItem(
      'ok',
      'Bericht',
      'Alle Anlagen',
      `Berichtmodell und Seitenplan sind für ${reportRows.length} Anlage(n) erzeugbar.`,
      `${totalPages} Seite(n) · ${round(durationMs, 1)} ms`,
    ),
    metrics: { reportMs: durationMs, reportPages: totalPages },
  };
}

function createSiaConfigurationItem(project = null) {
  const incomplete = safeArray(project?.systems).filter(system => {
    const config = system?.siaVelocity || {};
    return !hasText(config.roomUsageCode) || !hasText(config.operationMode);
  });

  if (!safeArray(project?.systems).length) {
    return createItem('error', 'SIA', 'Geschwindigkeitsvorgaben', 'Keine Anlage für die SIA-Konfiguration vorhanden.');
  }
  if (incomplete.length) {
    return createItem(
      'warning',
      'SIA',
      'Geschwindigkeitsvorgaben',
      `${incomplete.length} Anlage(n) haben noch keine vollständige Raumnutzung/Betriebsart.`,
      incomplete.map(system => system?.name || system?.id || 'Unbenannt').join(' · '),
    );
  }

  return createItem('ok', 'SIA', 'Geschwindigkeitsvorgaben', 'Raumnutzung und Betriebsart sind für alle Anlagen konfiguriert.');
}

function createStorageRoundtripItem(project = null, calculationRun = null) {
  const startedAt = nowMs();

  try {
    const sourceCounts = getProjectCounts(project);
    const serialized = StorageEngine.serialize(project);
    const envelope = JSON.parse(serialized);
    const reopened = StorageEngine.parse(serialized, { fileName: `${project?.name || 'RC-Projekt'}.dvp` });
    const reopenedCounts = getProjectCounts(reopened);
    const reopenedResults = safeArray(reopened.systems).map(system => ProjectCalculationService.calculate(reopened, system?.id || null));
    const sourceTotals = safeArray(calculationRun?.entries).map(entry => entry.total);
    const reopenedTotals = reopenedResults.map(result => getSystemTotal(result));
    const maxDifference = sourceTotals.reduce((maximum, value, index) => {
      const difference = Math.abs(safeNumber(value) - safeNumber(reopenedTotals[index]));
      return Math.max(maximum, difference);
    }, 0);
    const countsMatch = JSON.stringify(sourceCounts) === JSON.stringify(reopenedCounts);
    const envelopeMatches = envelope?.appVersion === APP_VERSION
      && envelope?.appRelease === APP_RELEASE
      && envelope?.schemaVersion === PROJECT_FILE_SCHEMA_VERSION;
    const durationMs = nowMs() - startedAt;

    if (!countsMatch || maxDifference > 1e-8 || !envelopeMatches) {
      return {
        item: createItem(
          'error',
          'Datei',
          '.dvp-Roundtrip',
          'Projektdatei lässt sich nicht vollständig verlustfrei speichern und erneut berechnen.',
          `Struktur: ${countsMatch ? 'gleich' : 'abweichend'} · Δp-Abweichung ${maxDifference} Pa · Metadaten ${envelopeMatches ? 'OK' : 'abweichend'}`,
        ),
        metrics: { storageMs: durationMs, fileBytes: serialized.length },
      };
    }

    return {
      item: createItem(
        'ok',
        'Datei',
        '.dvp-Roundtrip',
        'Speichern, Öffnen und erneutes Berechnen bleiben verlustfrei.',
        `Schema ${PROJECT_FILE_SCHEMA_VERSION} · ${Math.round(serialized.length / 1024)} kB · ${round(durationMs, 1)} ms`,
      ),
      metrics: { storageMs: durationMs, fileBytes: serialized.length },
    };
  } catch (error) {
    return {
      item: createItem('error', 'Datei', '.dvp-Roundtrip', 'Projektdatei-Roundtrip ist fehlgeschlagen.', error.message),
      metrics: {},
    };
  }
}

function createDemoItem() {
  try {
    const demo = createDemoProject();
    const result = ProjectCalculationService.calculate(demo);
    demo.calculationResult = result;
    const system = demo.systems?.[0];
    const total = getSystemTotal(result);

    const valid = system
      && safeArray(system.sections).length >= 5
      && safeArray(system.formParts).length >= 5
      && safeArray(system.specialComponents).length >= 3
      && Number.isFinite(total)
      && total > 0;

    return valid
      ? createItem('ok', 'Regression', 'Demo-Projekt', `Demo-Projekt rechnet sauber mit ${round(total, 1)} Pa.`, `${system.sections.length} TS · ${system.formParts.length} Formteile · ${system.specialComponents.length} Sonderbauteile`)
      : createItem('warning', 'Regression', 'Demo-Projekt', 'Demo-Projekt ist vorhanden, aber Umfang oder Ergebnis sollte geprüft werden.', `Total: ${total ?? '-'}`);
  } catch (error) {
    return createItem('error', 'Regression', 'Demo-Projekt', 'Demo-Projekt konnte nicht geladen oder berechnet werden.', error.message);
  }
}

function createPracticeRegressionItem(registry = null) {
  const startedAt = nowMs();
  try {
    const project = createSmallOfficePracticeProject();
    const system = project.systems?.[0];
    const result = ProjectCalculationService.calculate(project, system?.id || null);
    project.calculationResult = result;
    const total = getSystemTotal(result);
    const model = ReportEngine.createReportModel(project, { system, registry });
    const pages = safeNumber(ReportEngine.createPagePlan(model)?.totalPages, 0);
    const serialized = StorageEngine.serialize(project);
    const reopened = StorageEngine.parse(serialized, { fileName: 'Phase57-RC-Regression.dvp' });
    const durationMs = nowMs() - startedAt;
    const valid = Number.isFinite(total)
      && total > 0
      && safeArray(system?.sections).length >= 8
      && pages > 0
      && getProjectCounts(reopened).sections === getProjectCounts(project).sections;

    return valid
      ? createItem('ok', 'Regression', 'Büro-Referenz', 'Deterministisches Praxisprojekt besteht Rechen-, Bericht- und Datei-Smoketest.', `${round(total, 1)} Pa · ${pages} Seite(n) · ${round(durationMs, 1)} ms`)
      : createItem('error', 'Regression', 'Büro-Referenz', 'Deterministischer Praxis-Smoketest ist unvollständig.', `Total ${total} · Seiten ${pages}`);
  } catch (error) {
    return createItem('error', 'Regression', 'Büro-Referenz', 'Deterministischer Praxis-Smoketest ist fehlgeschlagen.', error.message);
  }
}

function createPerformanceItem(metrics = {}, projectCounts = {}) {
  const objectCount = safeNumber(projectCounts.sections) + safeNumber(projectCounts.formParts) + safeNumber(projectCounts.specialComponents);
  const calculationLimit = Math.max(1500, objectCount * 20);
  const reportLimit = Math.max(3000, objectCount * 35);
  const storageLimit = Math.max(1500, objectCount * 20);
  const slow = [];

  if (safeNumber(metrics.calculationMs) > calculationLimit) slow.push(`Berechnung ${round(metrics.calculationMs, 1)} ms`);
  if (safeNumber(metrics.reportMs) > reportLimit) slow.push(`Bericht ${round(metrics.reportMs, 1)} ms`);
  if (safeNumber(metrics.storageMs) > storageLimit) slow.push(`Datei ${round(metrics.storageMs, 1)} ms`);

  if (slow.length) {
    return createItem(
      'warning',
      'Performance',
      'RC-Zeitbudget',
      'Mindestens ein Arbeitsschritt liegt über dem konservativen RC-Zeitbudget.',
      `${slow.join(' · ')} · Objektumfang ${objectCount}`,
    );
  }

  return createItem(
    'ok',
    'Performance',
    'RC-Zeitbudget',
    'Berechnung, Bericht und Datei-Roundtrip liegen im RC-Zeitbudget.',
    `Berechnung ${round(metrics.calculationMs, 1)} ms · Bericht ${round(metrics.reportMs, 1)} ms · Datei ${round(metrics.storageMs, 1)} ms`,
  );
}

function createBrowserReadinessItem() {
  if (typeof window === 'undefined') {
    return createItem('ok', 'Browser', 'Druckumgebung', 'Browserfunktionen werden im App-Lauf geprüft; Node-Regressionslauf ist verfügbar.');
  }

  const missing = [];
  if (typeof window.print !== 'function') missing.push('Drucken');
  if (typeof Blob === 'undefined') missing.push('Blob');
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') missing.push('Dateidownload');
  if (typeof FileReader === 'undefined') missing.push('Dateiimport');

  return missing.length
    ? createItem('error', 'Browser', 'Druckumgebung', 'Wichtige Browserfunktionen fehlen.', missing.join(' · '))
    : createItem('ok', 'Browser', 'Druckumgebung', 'Drucken, Dateiimport und Dateidownload sind im aktuellen Browser verfügbar.');
}

function createDirtyItem(isProjectDirty = false) {
  return isProjectDirty
    ? createItem('warning', 'Status', 'Ungespeicherte Änderungen', 'Projekt enthält ungespeicherte Änderungen. Vor Weitergabe speichern.')
    : createItem('ok', 'Status', 'Ungespeicherte Änderungen', 'Projekt ist als gespeichert markiert.');
}

function createDeploymentItem(deploymentCheck = null) {
  if (!deploymentCheck) {
    return createItem('warning', 'Deployment', 'Deploy-QS', 'Deployment-QS wurde übersprungen oder konnte nicht gelesen werden.');
  }

  return summarizeCheck('Deployment', 'Deploy-QS', deploymentCheck, 'Deployment-QS ohne Fehler abgeschlossen.');
}

export default class ReleaseCandidateDiagnostics {
  static async run({ state = null, project = null, system = null, registry = null, includeDeployment = true } = {}) {
    const startedAt = new Date().toISOString();
    const activeProject = project || state?.project || null;
    const activeSystem = system || state?.selectedSystem || activeProject?.systems?.[0] || null;
    const items = [];
    let deploymentCheck = state?.deploymentCheck || null;

    if (!activeProject) {
      items.push(createItem('error', 'Projekt', 'Projekt vorhanden', 'Kein Projekt geladen.'));
      return this.finish(items, { project: activeProject, system: activeSystem, startedAt, deploymentCheck });
    }

    const projectCounts = getProjectCounts(activeProject);
    let calculationRun = null;
    let portfolioDiagnostics = null;
    const metrics = {};

    try {
      calculationRun = calculateAllSystems(activeProject, activeSystem?.id || '');
      metrics.calculationMs = calculationRun.durationMs;
      metrics.systems = projectCounts.systems;
      metrics.sections = projectCounts.sections;
      metrics.formParts = projectCounts.formParts;
      metrics.specialComponents = projectCounts.specialComponents;
      items.push(createCalculationPortfolioItem(calculationRun));

      if (state) {
        state.lastCalculationAt = calculationRun.activeEntry?.result?.timestamp || new Date().toISOString();
        state.isCalculationDirty = false;
        state.lastAutoCalculationError = null;
      }
    } catch (error) {
      items.push(createItem('error', 'Berechnung', 'Alle Anlagen', 'Projekt konnte nicht vollständig neu berechnet werden.', error.message));
    }

    if (calculationRun) {
      portfolioDiagnostics = createPortfolioDiagnostics(activeProject, calculationRun);
      items.push(summarizeCheck('Projekt', 'Projektcheck aller Anlagen', portfolioDiagnostics.projectCheck, 'Projektcheck aller Anlagen ohne Fehler abgeschlossen.'));
      items.push(summarizeCheck('Berechnung', 'Rechen-QS aller Anlagen', portfolioDiagnostics.calculationCheck, 'Rechen-QS aller Anlagen ohne Fehler abgeschlossen.'));
    }

    const fileCheck = ProjectFileDiagnostics.create(activeProject);
    items.push(summarizeCheck('Datei', 'Datei-QS', fileCheck, 'Datei-QS ohne Fehler abgeschlossen.'));
    items.push(createSiaConfigurationItem(activeProject));

    const reportResult = createReportPortfolioItem(activeProject, registry);
    Object.assign(metrics, reportResult.metrics);
    items.push(reportResult.item);

    if (calculationRun) {
      const storageResult = createStorageRoundtripItem(activeProject, calculationRun);
      Object.assign(metrics, storageResult.metrics);
      items.push(storageResult.item);
    }

    items.push(createDemoItem());
    items.push(createPracticeRegressionItem(registry));
    items.push(createBrowserReadinessItem());
    items.push(createPerformanceItem(metrics, projectCounts));
    items.push(createDirtyItem(Boolean(state?.isProjectDirty)));

    if (includeDeployment) {
      try {
        deploymentCheck = await DeploymentDiagnostics.run({ project: activeProject, version: APP_ASSET_VERSION });
        if (state) state.deploymentCheck = deploymentCheck;
      } catch (error) {
        deploymentCheck = null;
        items.push(createItem('warning', 'Deployment', 'Deploy-QS', 'Deployment-QS konnte im RC-Check nicht automatisch ausgeführt werden.', error.message));
      }
      items.push(createDeploymentItem(deploymentCheck));
    }

    const checks = {
      projectChecks: portfolioDiagnostics?.projectChecks || [],
      calculationChecks: portfolioDiagnostics?.calculationChecks || [],
      fileCheck,
      deploymentCheck,
    };

    return this.finish(items, {
      project: activeProject,
      system: activeSystem,
      startedAt,
      checks,
      metrics,
      projectCounts,
    });
  }

  static finish(items = [], context = {}) {
    const normalized = safeArray(items);
    const itemCounts = counts(normalized);
    const status = statusFromItems(normalized);
    const finishedAt = new Date().toISOString();
    const project = context.project || {};
    const system = context.system || project?.systems?.[0] || {};

    return {
      status,
      label: labelFromStatus(status),
      summary: this.createSummary(status, itemCounts),
      counts: itemCounts,
      items: normalized,
      projectName: project?.name || project?.meta?.name || '-',
      systemName: system?.name || '-',
      release: APP_RELEASE,
      version: APP_VERSION,
      buildLabel: APP_BUILD_LABEL,
      schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
      startedAt: context.startedAt,
      finishedAt,
      checks: context.checks || {},
      metrics: context.metrics || {},
      projectCounts: context.projectCounts || getProjectCounts(project),
      nextRecommendation: this.createRecommendation(status, itemCounts),
    };
  }

  static createSummary(status, itemCounts = {}) {
    if (status === 'error') {
      return `Release Candidate noch blockiert: ${itemCounts.error} Fehler und ${itemCounts.warning} Hinweis${itemCounts.warning === 1 ? '' : 'e'} gefunden.`;
    }

    if (status === 'warning') {
      return `Release Candidate grundsätzlich nutzbar, aber ${itemCounts.warning} Hinweis${itemCounts.warning === 1 ? '' : 'e'} vor externer Weitergabe prüfen.`;
    }

    return `Release Candidate bereit: ${itemCounts.ok} Prüfpunkte ohne Fehler abgeschlossen.`;
  }

  static createRecommendation(status) {
    if (status === 'error') return 'Rote Punkte zuerst beheben, danach RC-Check erneut ausführen.';
    if (status === 'warning') return 'Gelbe Punkte fachlich prüfen und die Windows-Chrome-/Edge-Druckabnahme dokumentieren.';
    return 'Version kann als interner Release Candidate weitergegeben werden; vor Final 3.0 folgt die manuelle Windows-Browserabnahme.';
  }

  static toText(result = {}) {
    const metrics = result.metrics || {};
    const projectCounts = result.projectCounts || {};
    const lines = [
      `Druckverlust Pro ${result.version || APP_VERSION} – Release Candidate Phase ${result.release || APP_RELEASE}`,
      `Status: ${result.label || '-'}`,
      result.summary || '',
      `Empfehlung: ${result.nextRecommendation || '-'}`,
      '',
      `Projekt: ${result.projectName || '-'}`,
      `Aktive Anlage: ${result.systemName || '-'}`,
      `Dateischema: ${result.schemaVersion || PROJECT_FILE_SCHEMA_VERSION}`,
      `Geprüft: ${result.finishedAt || '-'}`,
      `OK: ${result.counts?.ok ?? 0} · Hinweise: ${result.counts?.warning ?? 0} · Fehler: ${result.counts?.error ?? 0}`,
      `Umfang: ${projectCounts.systems ?? 0} Anlagen · ${projectCounts.sections ?? 0} TS · ${projectCounts.formParts ?? 0} Formteile · ${projectCounts.specialComponents ?? 0} Sonderbauteile`,
      `Laufzeiten: Berechnung ${round(metrics.calculationMs, 1)} ms · Bericht ${round(metrics.reportMs, 1)} ms · Datei ${round(metrics.storageMs, 1)} ms · Bericht ${metrics.reportPages ?? 0} Seite(n)`,
      '',
      'Prüfpunkte:',
      ...safeArray(result.items).map(item => {
        const mark = item.status === 'ok' ? '✓' : item.status === 'warning' ? '!' : '✕';
        return `${mark} ${item.area} – ${item.label}: ${item.message}${item.details ? ` (${item.details})` : ''}`;
      }),
    ];

    return lines.filter(line => line !== null && line !== undefined).join('\n');
  }
}
