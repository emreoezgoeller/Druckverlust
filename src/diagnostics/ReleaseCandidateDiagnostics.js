// Druckverlust Pro – ReleaseCandidateDiagnostics
// Finale Schlussprüfung für Phase 18.x vor der Weitergabe als Release Candidate.

import ProjectCalculationService from '../project/ProjectCalculationService.js';
import ProjectDiagnostics from './ProjectDiagnostics.js';
import CalculationDiagnostics from './CalculationDiagnostics.js';
import DeploymentDiagnostics from './DeploymentDiagnostics.js?v=33.00&release=45.00';
import ProjectFileDiagnostics from './ProjectFileDiagnostics.js';
import ReportEngine from '../report/ReportEngine.js?v=40.00&release=45.00';
import createDemoProject from '../project/demoProject.js';
import { APP_ASSET_VERSION, APP_RELEASE, APP_BUILD_LABEL } from '../core/appVersion.js?v=40.00&release=45.00';

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

function createReportItem(project = null, system = null, registry = null) {
  if (!project) {
    return createItem('error', 'Bericht', 'Berichtmodell', 'Kein Projekt für Bericht vorhanden.');
  }

  try {
    const model = ReportEngine.createReportModel(project, { system, registry });
    const checklist = ReportEngine.createExportChecklist(model);
    const hasPages = safeNumber(checklist?.printGuidance?.totalPages || checklist?.pagePlan?.totalPages, 0) > 0;
    const hasTitle = hasText(checklist?.documentTitle || ReportEngine.createDocumentTitle(model));
    const hasContent = safeNumber(model?.counts?.sections, 0) > 0
      || safeNumber(model?.counts?.formParts, 0) > 0
      || safeNumber(model?.counts?.specialComponents, 0) > 0;

    if (!hasTitle || !hasPages || !hasContent) {
      return createItem(
        'warning',
        'Bericht',
        'Berichtmodell',
        'Bericht kann erstellt werden, aber Titel, Seitenplan oder sichtbarer Inhalt sollte geprüft werden.',
        `Titel: ${hasTitle ? 'ja' : 'nein'} · Seiten: ${hasPages ? 'ja' : 'nein'} · Inhalt: ${hasContent ? 'ja' : 'nein'}`,
      );
    }

    return createItem(
      'ok',
      'Bericht',
      'Berichtmodell',
      'Berichtmodell, Export-QS und Seitenplan sind erzeugbar.',
      `${checklist.pdfFileName || 'PDF'} · ${checklist.printGuidance?.totalPages || checklist.pagePlan?.totalPages || '?'} Seite(n)`,
    );
  } catch (error) {
    return createItem('error', 'Bericht', 'Berichtmodell', 'Berichtmodell konnte nicht erstellt werden.', error.message);
  }
}

function createDemoItem() {
  try {
    const demo = createDemoProject();
    const result = ProjectCalculationService.calculate(demo);
    demo.calculationResult = result;
    const system = demo.systems?.[0];
    const total = result?.calculation?.totals?.totalRounded ?? result?.calculation?.totals?.total;

    const valid = system
      && safeArray(system.sections).length >= 5
      && safeArray(system.formParts).length >= 5
      && safeArray(system.specialComponents).length >= 3
      && Number.isFinite(Number(total))
      && Number(total) > 0;

    return valid
      ? createItem('ok', 'Demo', 'Demo-Projekt', `Demo-Projekt rechnet sauber mit ${Number(total).toFixed(1)} Pa.`, `${system.sections.length} TS · ${system.formParts.length} Formteile · ${system.specialComponents.length} Sonderbauteile`)
      : createItem('warning', 'Demo', 'Demo-Projekt', 'Demo-Projekt ist vorhanden, aber Umfang oder Ergebnis sollte geprüft werden.', `Total: ${total ?? '-'}`);
  } catch (error) {
    return createItem('error', 'Demo', 'Demo-Projekt', 'Demo-Projekt konnte nicht geladen oder berechnet werden.', error.message);
  }
}

function createStorageItem(project = null) {
  try {
    JSON.stringify(project || {});
    return createItem('ok', 'Speichern', 'JSON-Serialisierung', 'Aktuelles Projekt ist serialisierbar.');
  } catch (error) {
    return createItem('error', 'Speichern', 'JSON-Serialisierung', 'Aktuelles Projekt kann nicht serialisiert werden.', error.message);
  }
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

    try {
      const result = ProjectCalculationService.calculate(activeProject, activeSystem?.id || null);
      activeProject.calculationResult = result;
      if (state) {
        state.lastCalculationAt = result.timestamp || new Date().toISOString();
        state.isCalculationDirty = false;
        state.lastAutoCalculationError = null;
      }
      items.push(createItem('ok', 'Berechnung', 'Live-Rechenlauf', 'Projekt konnte für die Schlussprüfung neu berechnet werden.', `${safeNumber(result?.calculation?.totals?.totalRounded ?? result?.calculation?.totals?.total, 0).toFixed(1)} Pa`));
    } catch (error) {
      items.push(createItem('error', 'Berechnung', 'Live-Rechenlauf', 'Projekt konnte nicht neu berechnet werden.', error.message));
    }

    const projectCheck = ProjectDiagnostics.create(activeProject, { system: activeSystem });
    const calculationCheck = CalculationDiagnostics.create(activeProject, { system: activeSystem });
    const fileCheck = ProjectFileDiagnostics.create(activeProject);

    items.push(summarizeCheck('Projekt', 'Projektcheck', projectCheck, 'Projektcheck ohne Fehler abgeschlossen.'));
    items.push(summarizeCheck('Berechnung', 'Rechen-QS', calculationCheck, 'Rechen-QS ohne Fehler abgeschlossen.'));
    items.push(summarizeCheck('Datei', 'Datei-QS', fileCheck, 'Datei-QS ohne Fehler abgeschlossen.'));
    items.push(createReportItem(activeProject, activeSystem, registry));
    items.push(createDemoItem());
    items.push(createStorageItem(activeProject));
    items.push(createDirtyItem(Boolean(state?.isProjectDirty)));

    if (includeDeployment) {
      try {
        deploymentCheck = await DeploymentDiagnostics.run({ project: activeProject, version: APP_ASSET_VERSION });
        if (state) state.deploymentCheck = deploymentCheck;
      } catch (error) {
        deploymentCheck = null;
        items.push(createItem('warning', 'Deployment', 'Deploy-QS', 'Deployment-QS konnte im RC-Check nicht automatisch ausgeführt werden.', error.message));
      }
    }

    if (includeDeployment) {
      items.push(createDeploymentItem(deploymentCheck));
    }

    const checks = { projectCheck, calculationCheck, fileCheck, deploymentCheck };
    return this.finish(items, { project: activeProject, system: activeSystem, startedAt, checks });
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
      buildLabel: APP_BUILD_LABEL,
      startedAt: context.startedAt,
      finishedAt,
      checks: context.checks || {},
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

  static createRecommendation(status, itemCounts = {}) {
    if (status === 'error') return 'Rote Punkte zuerst beheben, danach RC-Check erneut ausführen.';
    if (status === 'warning') return 'Gelbe Punkte fachlich prüfen. Für interne Tests ist die Version nutzbar.';
    return 'Version kann als interner Teststand / Release Candidate weitergegeben werden.';
  }

  static toText(result = {}) {
    const lines = [
      `Druckverlust Pro – Release Candidate ${result.release || APP_RELEASE}`,
      `Status: ${result.label || '-'}`,
      result.summary || '',
      `Empfehlung: ${result.nextRecommendation || '-'}`,
      '',
      `Projekt: ${result.projectName || '-'}`,
      `Anlage: ${result.systemName || '-'}`,
      `Geprüft: ${result.finishedAt || '-'}`,
      `OK: ${result.counts?.ok ?? 0} · Hinweise: ${result.counts?.warning ?? 0} · Fehler: ${result.counts?.error ?? 0}`,
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
