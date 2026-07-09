// Druckverlust Pro – Phase 18.12
// Startet die professionelle Oberfläche als aktive Hauptanwendung.

import ApplicationState from './app/ApplicationState.js';
import ApplicationShell from './ui/ApplicationShell.js';
import RibbonComponent from './ui/components/RibbonComponent.js';
import SidebarComponent from './ui/components/SidebarComponent.js';
import WorkspaceComponent from './ui/components/WorkspaceComponent.js';
import PropertiesComponent from './ui/components/PropertiesComponent.js';
import StatusBarComponent from './ui/components/StatusBarComponent.js';
import ProjectCalculationService from './project/ProjectCalculationService.js';

function createDefaultProject() {
  const now = Date.now();
  const systemId = `system-${now}`;

  return {
    id: `project-${now}`,
    name: 'Unbenanntes Projekt',
    object: '',
    anlageNumber: '',
    author: '',
    company: '',
    address: '',
    note: '',
    settings: {
      rho: 1.21,
      lambda: 0.025,
      sectionRoundingStep: 0.5,
    },
    meta: {
      name: '',
      object: '',
      anlageNumber: '',
      anlage: 'Zuluftanlage',
      bearbeiter: '',
      company: '',
      address: '',
      note: '',
    },
    report: {
      project: '',
      object: '',
      anlageNumber: '',
      anlage: 'Zuluftanlage',
      bearbeiter: '',
      company: '',
      address: '',
      hinweis: '',
      datum: new Date().toISOString().slice(0, 10),
    },
    systems: [
      {
        id: systemId,
        name: 'Zuluftanlage',
        type: 'Zuluft',
        sections: [
          {
            id: `${systemId}-ts1`,
            name: 'ts1',
            type: 'duct',
            description: 'Rechteckkanal 450 × 450 mm',
            q: 900,
            b: 0.45,
            h: 0.45,
            d: 0,
            l: 1.25,
            zetaSum: 0,
          },
          {
            id: `${systemId}-ts2`,
            name: 'ts2',
            type: 'duct',
            description: 'Rechteckkanal 800 × 800 mm',
            q: 900,
            b: 0.8,
            h: 0.8,
            d: 0,
            l: 1.25,
            zetaSum: 0,
          },
          {
            id: `${systemId}-ts3`,
            name: 'ts3',
            type: 'pipe',
            description: 'Rundrohr Ø500 mm',
            q: 900,
            b: 0,
            h: 0,
            d: 0.5,
            l: 1.25,
            zetaSum: 0,
          },
          {
            id: `${systemId}-ts4`,
            name: 'ts4',
            type: 'pipe',
            description: 'Rundrohr Ø300 mm',
            q: 900,
            b: 0,
            h: 0,
            d: 0.3,
            l: 1.25,
            zetaSum: 0,
          },
          {
            id: `${systemId}-ts5`,
            name: 'ts5',
            type: 'pipe',
            description: 'Rundrohr Ø400 mm',
            q: 900,
            b: 0,
            h: 0,
            d: 0.4,
            l: 1.25,
            zetaSum: 0,
          },
        ],
        formParts: [],
        specialComponents: [],
      },
    ],
  };
}

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

function bootstrap() {
  const root = document.getElementById('app');

  if (!root) {
    throw new Error('App-Container #app wurde nicht gefunden.');
  }

  const state = new ApplicationState();
  const project = createDefaultProject();
  state.setProject(project);
  state.setSelection('project', project);
  calculateInitialProject(state);

  const shell = new ApplicationShell(root);
  shell.render();

  new RibbonComponent(document.querySelector('.dp-ribbon'), state).render();
  new SidebarComponent(document.querySelector('.dp-sidebar'), state);
  new WorkspaceComponent(document.querySelector('.dp-workspace'), state);
  new PropertiesComponent(document.querySelector('.dp-properties'), state);
  new StatusBarComponent(document.querySelector('.dp-status'), state);

  window.DruckverlustPro = {
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
