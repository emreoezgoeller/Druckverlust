// Druckverlust Pro – Phase 21.04
// Startet Tool, Demo, Hilfe und Beispielbericht über URL-Parameter.

import ApplicationState from './app/ApplicationState.js';
import ApplicationShell from './ui/ApplicationShell.js';
import RibbonComponent from './ui/components/RibbonComponent.js';
import SidebarComponent from './ui/components/SidebarComponent.js';
import WorkspaceComponent from './ui/components/WorkspaceComponent.js?v=21.04';
import StatusBarComponent from './ui/components/StatusBarComponent.js';
import ProjectCalculationService from './project/ProjectCalculationService.js';
import createDefaultProject from './project/defaultProject.js';
import createDemoProject from './project/demoProject.js';
import KeyboardShortcuts from './ui/core/KeyboardShortcuts.js';
import AutoSaveEngine from './storage/AutoSaveEngine.js';
import { APP_RELEASE, APP_BUILD_LABEL, createAppInfo } from './core/appVersion.js';
import { createLicenseStatus } from './licensing/licenseConfig.js';
import LicenseGate from './licensing/LicenseGate.js';

function calculateInitialProject(state) {
  const project = state.project;

  if (!project) return;

  try {
    const result = ProjectCalculationService.calculate(project);
    project.calculationResult = result;
    state.lastCalculationAt = result.timestamp;
    state.isCalculationDirty = false;
    state.isProjectDirty = false;
    state.lastAutoCalculationError = null;
  } catch (error) {
    console.warn('Initiale Berechnung konnte nicht ausgeführt werden:', error);
    state.isCalculationDirty = true;
    state.isProjectDirty = false;
    state.lastAutoCalculationError = error?.message || String(error);
  }
}

function installImageCopyProtection() {
  const isProtectedTarget = event => {
    const target = event?.target;
    return !!target?.closest?.('img, svg, picture, canvas, .dp-formpart-image, .dp-formpart-card-image, .report-catalog-image, .report-illustration-card, .report-logo-wrap, .protected-media');
  };

  ['contextmenu', 'dragstart'].forEach(type => {
    document.addEventListener(type, event => {
      if (isProtectedTarget(event)) event.preventDefault();
    }, true);
  });

  document.addEventListener('selectstart', event => {
    if (isProtectedTarget(event)) event.preventDefault();
  }, true);

  const protectImage = image => {
    image.setAttribute('draggable', 'false');
    image.setAttribute('loading', image.getAttribute('loading') || 'lazy');
    image.classList.add('dp-protected-image');
  };

  document.querySelectorAll('img').forEach(protectImage);

  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (node?.nodeType !== 1) return;
          if (node.matches?.('img')) protectImage(node);
          node.querySelectorAll?.('img').forEach(protectImage);
        });
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}

function isDemoStartupRequested() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search || '');
  const demoParam = String(params.get('demo') || '').toLowerCase();
  const hash = String(window.location.hash || '').toLowerCase();

  return ['1', 'true', 'ja', 'demo'].includes(demoParam) || hash.includes('demo');
}

function cleanupDemoUrlFlag() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has('demo') && !url.hash.toLowerCase().includes('demo')) return;

  url.searchParams.delete('demo');
  if (url.hash.toLowerCase().includes('demo')) url.hash = '';
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
}


function isHelpStartupRequested() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search || '');
  const helpParam = String(params.get('hilfe') || params.get('help') || '').toLowerCase();
  const hash = String(window.location.hash || '').toLowerCase();

  return ['1', 'true', 'ja', 'hilfe', 'help'].includes(helpParam) || hash.includes('hilfe') || hash.includes('help');
}


function getHelpStartupSection() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search || '');
  return String(params.get('section') || '').trim().toLowerCase();
}

function scrollToHelpSection(sectionId) {
  if (!sectionId || typeof document === 'undefined') return;
  window.requestAnimationFrame(() => {
    const target = document.getElementById(sectionId);
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  });
}

function cleanupHelpUrlFlag() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  const hadHelp = url.searchParams.has('hilfe') || url.searchParams.has('help') || url.hash.toLowerCase().includes('hilfe') || url.hash.toLowerCase().includes('help');
  if (!hadHelp) return;

  url.searchParams.delete('hilfe');
  url.searchParams.delete('help');
  if (url.hash.toLowerCase().includes('hilfe') || url.hash.toLowerCase().includes('help')) url.hash = '';
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
}

function isReportStartupRequested() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search || '');
  const reportParam = String(params.get('bericht') || params.get('report') || '').toLowerCase();
  const hash = String(window.location.hash || '').toLowerCase();

  return ['1', 'true', 'ja', 'bericht', 'report', 'beispiel'].includes(reportParam) || hash.includes('bericht') || hash.includes('report');
}

function cleanupReportUrlFlag() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  const hadReport = url.searchParams.has('bericht') || url.searchParams.has('report') || url.hash.toLowerCase().includes('bericht') || url.hash.toLowerCase().includes('report');
  if (!hadReport) return;

  url.searchParams.delete('bericht');
  url.searchParams.delete('report');
  if (url.hash.toLowerCase().includes('bericht') || url.hash.toLowerCase().includes('report')) url.hash = '';
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
}

function resolveStartupProject() {
  const demoRequested = isDemoStartupRequested();
  const recovery = AutoSaveEngine.load();

  if (AutoSaveEngine.isRecoverable(recovery)) {
    const description = AutoSaveEngine.describe(recovery);
    const intro = demoRequested
      ? 'Demo-Projekt wurde angefordert, aber es gibt noch eine lokale Autosicherung.'
      : 'Lokale Autosicherung gefunden.';
    const restoreQuestion = demoRequested
      ? 'OK = Autosicherung wiederherstellen, Abbrechen = Demo-Projekt laden.'
      : 'Möchtest du diese Version wiederherstellen?';

    const restore = confirm([
      intro,
      '',
      description,
      '',
      restoreQuestion,
    ].join('\n'));

    if (restore) {
      return { project: recovery.project, recovered: true, recoveredAt: recovery.metadata?.savedAt || recovery.savedAt || null, demoRequested: false };
    }

    AutoSaveEngine.clear();
  }

  if (demoRequested) {
    cleanupDemoUrlFlag();
    return { project: createDemoProject(), recovered: false, recoveredAt: null, demoRequested: true };
  }

  return { project: createDefaultProject(), recovered: false, recoveredAt: null, demoRequested: false };
}

function installBeforeUnloadProtection(state) {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeunload', event => {
    if (!state?.isProjectDirty) return;

    event.preventDefault();
    event.returnValue = '';
  });
}

function bootstrap() {
  const root = document.getElementById('app');

  if (!root) {
    throw new Error('App-Container #app wurde nicht gefunden.');
  }

  const state = new ApplicationState();
  const startup = resolveStartupProject();
  const project = startup.project;

  state.setProject(project);
  state.setSelection('project', project);
  calculateInitialProject(state);

  if (startup.recovered) {
    state.isProjectDirty = true;
    state.recoveredFromAutoSave = true;
    state.lastAutoSaveAt = startup.recoveredAt;
  }

  if (startup.demoRequested) {
    state.loadedFromLandingDemo = true;
    state.isProjectDirty = false;
  }

  const helpRequested = isHelpStartupRequested();
  const helpSection = getHelpStartupSection();
  const reportRequested = isReportStartupRequested();

  if (helpRequested) {
    state.setSelection('help', { source: 'landing' });
    cleanupHelpUrlFlag();
  } else if (reportRequested) {
    const activeSystem = state.selectedSystem || project?.systems?.[0] || project;
    state.setSelection('report', activeSystem);
    state.selectedReport = activeSystem;
    cleanupReportUrlFlag();
  }

  const shell = new ApplicationShell(root);
  shell.render();

  new RibbonComponent(document.querySelector('.dp-ribbon'), state).render();
  new SidebarComponent(document.querySelector('.dp-sidebar'), state);
  new WorkspaceComponent(document.querySelector('.dp-workspace'), state);
  new StatusBarComponent(document.querySelector('.dp-status'), state);
  new KeyboardShortcuts(state).install();

  if (helpRequested) scrollToHelpSection(helpSection);

  AutoSaveEngine.install(state);
  installBeforeUnloadProtection(state);
  installImageCopyProtection();

  window.DruckverlustPro = {
    version: APP_RELEASE,
    label: APP_BUILD_LABEL,
    info: createAppInfo(),
    license: createLicenseStatus(),
    licenseGate: LicenseGate,
    state,
    recalculate() {
      const result = ProjectCalculationService.calculate(state.project);
      state.project.calculationResult = result;
      state.lastCalculationAt = result.timestamp;
      state.isCalculationDirty = false;
      state.lastAutoCalculationError = null;
      state.notify();
      return result;
    },
  };
}

bootstrap();
