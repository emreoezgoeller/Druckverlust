// Druckverlust Pro – Phase 18.20a
// Startet die professionelle Oberfläche als aktive Hauptanwendung.

import ApplicationState from './app/ApplicationState.js';
import ApplicationShell from './ui/ApplicationShell.js';
import RibbonComponent from './ui/components/RibbonComponent.js';
import SidebarComponent from './ui/components/SidebarComponent.js';
import WorkspaceComponent from './ui/components/WorkspaceComponent.js?v=18.20a';
import StatusBarComponent from './ui/components/StatusBarComponent.js';
import ProjectCalculationService from './project/ProjectCalculationService.js';
import createDefaultProject from './project/defaultProject.js';
import KeyboardShortcuts from './ui/core/KeyboardShortcuts.js';
import AutoSaveEngine from './storage/AutoSaveEngine.js';
import { APP_RELEASE, APP_BUILD_LABEL, createAppInfo } from './core/appVersion.js';

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

function resolveStartupProject() {
  const recovery = AutoSaveEngine.load();

  if (AutoSaveEngine.isRecoverable(recovery)) {
    const description = AutoSaveEngine.describe(recovery);
    const restore = confirm([
      'Lokale Autosicherung gefunden.',
      '',
      description,
      '',
      'Möchtest du diese Version wiederherstellen?',
    ].join('\n'));

    if (restore) {
      return { project: recovery.project, recovered: true, recoveredAt: recovery.metadata?.savedAt || recovery.savedAt || null };
    }

    AutoSaveEngine.clear();
  }

  return { project: createDefaultProject(), recovered: false, recoveredAt: null };
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

  const shell = new ApplicationShell(root);
  shell.render();

  new RibbonComponent(document.querySelector('.dp-ribbon'), state).render();
  new SidebarComponent(document.querySelector('.dp-sidebar'), state);
  new WorkspaceComponent(document.querySelector('.dp-workspace'), state);
  new StatusBarComponent(document.querySelector('.dp-status'), state);
  new KeyboardShortcuts(state).install();

  AutoSaveEngine.install(state);
  installBeforeUnloadProtection(state);
  installImageCopyProtection();

  window.DruckverlustPro = {
    version: APP_RELEASE,
    label: APP_BUILD_LABEL,
    info: createAppInfo(),
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
