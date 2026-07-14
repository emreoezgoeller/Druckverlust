// Druckverlust Pro – RibbonActions
// Zentrale Befehle für die Ribbon-Oberfläche.

import ProjectCommands from '../../app/ProjectCommands.js';
import StorageEngine from '../../storage/StorageEngine.js';
import ProjectCalculationService from '../../project/ProjectCalculationService.js';
import AutoSaveEngine from '../../storage/AutoSaveEngine.js';
import createDemoProject from '../../project/demoProject.js';
import ProjectDiagnostics from '../../diagnostics/ProjectDiagnostics.js';
import DeploymentDiagnostics from '../../diagnostics/DeploymentDiagnostics.js?v=29.00';
import CalculationDiagnostics from '../../diagnostics/CalculationDiagnostics.js';
import ProjectFileDiagnostics from '../../diagnostics/ProjectFileDiagnostics.js';
import ReleaseCandidateDiagnostics from '../../diagnostics/ReleaseCandidateDiagnostics.js';
import { APP_ASSET_VERSION, APP_BUILD_LABEL, APP_RELEASE, createAppInfo } from '../../core/appVersion.js?v=29.00';
import { createLicenseStatus, formatLicenseStatusText } from '../../licensing/licenseConfig.js';
import UiDialogService from './UiDialogService.js?v=29.00';

export default class RibbonActions {
  constructor(state) {
    if (!state) {
      throw new Error('RibbonActions benötigt einen ApplicationState.');
    }

    this.state = state;
    this.commands = new ProjectCommands(state);
  }

  async confirmDiscardChanges(actionLabel = 'fortfahren') {
    if (!this.state.isProjectDirty) return true;

    return UiDialogService.confirm({
      title: 'Ungespeicherte Änderungen',
      message: `Das aktuelle Projekt enthält Änderungen, die noch nicht gespeichert wurden. Möchtest du trotzdem ${actionLabel}?`,
      details: ['Nicht gespeicherte Änderungen gehen dabei verloren.'],
      confirmLabel: 'Trotzdem fortfahren',
      tone: 'warning',
    });
  }

  showDashboard() {
    const project = this.state.project;
    const system = this.getActiveSystem();

    if (system && typeof this.state.selectSystem === 'function') {
      this.state.selectSystem(system);
      return;
    }

    if (project) {
      this.state.setSelection?.('project', project);
      this.state.notify?.();
    }
  }

  async newProject() {
    if (!await this.confirmDiscardChanges('ein neues Projekt erstellen')) return;

    this.commands.createProject({ projectNumber: 'Unbenannte Projektnummer' });
    this.calculate({ silent: true, keepDirty: false });
    this.state.markProjectClean();
    AutoSaveEngine.clear();
    console.info('RibbonAction: Neues Projekt erstellt');
  }


  async loadDemoProject() {
    if (!await this.confirmDiscardChanges('das Demo-Projekt laden')) return;

    const project = createDemoProject();
    this.state.setProject(project);
    this.state.setSelection('project', project);
    this.calculate({ silent: true, keepDirty: false });
    this.state.markProjectClean();
    AutoSaveEngine.clear();
    console.info('RibbonAction: Demo-Projekt geladen', project);
  }

  async openProject() {
    if (!await this.confirmDiscardChanges('ein anderes Projekt öffnen')) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dvp,application/json';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      try {
        const project = await StorageEngine.openFile(file);
        const importWarnings = project?._importInfo?.normalizedWarnings || project?._importInfo?.warnings || [];

        this.state.setProject(project);
        this.state.setSelection('project', project);
        this.calculate({ silent: true, keepDirty: false });
        this.state.markProjectClean();
        AutoSaveEngine.clear();

        if (importWarnings.length) {
          UiDialogService.alert([
            'Projekt wurde geöffnet und automatisch bereinigt.',
            '',
            ...importWarnings.slice(0, 6).map(item => `• ${item}`),
            importWarnings.length > 6 ? `• … ${importWarnings.length - 6} weitere Hinweise` : '',
            '',
            'Tipp: Einmal speichern, damit die Datei im neuen stabilen Format abgelegt wird.',
          ].filter(Boolean).join('\n'));
        }

        console.info('RibbonAction: Projekt geöffnet', project);
      } catch (error) {
        UiDialogService.alert(`Projekt konnte nicht geöffnet werden: ${error.message}`);
      }
    });

    input.click();
  }

  saveProject() {
    const project = this.state.project;

    if (!project) {
      UiDialogService.alert('Kein Projekt zum Speichern vorhanden.');
      return;
    }

    try {
      this.calculate({ silent: true, keepDirty: true });
      StorageEngine.download(project);
      this.state.markProjectClean();
      AutoSaveEngine.clear();
      console.info('RibbonAction: Projekt gespeichert', project);
    } catch (error) {
      UiDialogService.alert(`Projekt konnte nicht gespeichert werden: ${error.message}`);
    }
  }

  addSection() {
    try {
      const section = this.commands.addSection();
      this.calculate({ silent: true, keepDirty: true });
      console.info('RibbonAction: Teilstrecke hinzugefügt', section);
    } catch (error) {
      UiDialogService.alert(error.message);
    }
  }

  addFormPart() {
    try {
      const formPart = this.commands.addFormPart();
      console.info('RibbonAction: Formteil-Auswahl geöffnet', formPart);
    } catch (error) {
      UiDialogService.alert(error.message);
    }
  }

  addSpecialComponent() {
    try {
      const component = this.commands.addSpecialComponent('freie_komponente');
      this.calculate({ silent: true, keepDirty: true });
      console.info('RibbonAction: Sonderbauteil hinzugefügt', component);
    } catch (error) {
      UiDialogService.alert(error.message);
    }
  }

  calculate(options = {}) {
    const project = this.state.project;

    if (!project) {
      if (!options.silent) UiDialogService.alert('Kein Projekt vorhanden.');
      return null;
    }

    try {
      const result = ProjectCalculationService.calculate(project);
      project.calculationResult = result;

      const timestamp = result.timestamp || new Date().toISOString();
      this.state.lastCalculationAt = timestamp;

      if (typeof this.state.markAutoCalculated === 'function') {
        this.state.markAutoCalculated(timestamp);
      } else {
        this.state.markCalculationClean();
      }

      if (options.keepDirty === false) {
        this.state.markProjectClean();
      }

      console.info('RibbonAction: Berechnung aktualisiert', result);
      return result;
    } catch (error) {
      console.error(error);

      if (typeof this.state.markAutoCalculationFailed === 'function') {
        this.state.markAutoCalculationFailed(error);
      } else {
        this.state.markCalculationDirty();
      }

      if (!options.silent) {
        UiDialogService.alert(`Berechnung fehlgeschlagen: ${error.message}`);
      }

      return null;
    }
  }



  getActiveSystem() {
    return this.state.selectedSystem || this.state.project?.systems?.[0] || null;
  }

  getSelection() {
    return this.state.getSelection ? this.state.getSelection() : this.state.selection;
  }

  selectActiveSystem() {
    const system = this.getActiveSystem();

    if (system && typeof this.state.selectSystem === 'function') {
      this.state.selectSystem(system);
    }
  }

  duplicateSelected() {
    const selection = this.getSelection();

    try {
      if (selection?.type === 'section') {
        this.commands.duplicateSection(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      if (selection?.type === 'formPart') {
        this.commands.duplicateFormPart(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      if (selection?.type === 'specialComponent') {
        this.commands.duplicateSpecialComponent(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      console.info('RibbonAction: Keine duplizierbare Auswahl vorhanden.');
    } catch (error) {
      UiDialogService.alert(error.message);
    }
  }

  async deleteSelected() {
    const selection = this.getSelection();
    const system = this.getActiveSystem();

    try {
      if (selection?.type === 'section') {
        const section = system?.sections?.find(item => item.id === selection.id);
        const name = section?.name || 'diese Teilstrecke';
        const confirmed = await UiDialogService.confirm({
          title: 'Teilstrecke löschen',
          message: `„${name}“ wird dauerhaft aus der Anlage entfernt.`,
          details: ['Zugeordnete Formteile werden der nächsten verfügbaren Teilstrecke zugewiesen.'],
          confirmLabel: 'Teilstrecke löschen',
          tone: 'danger',
        });
        if (!confirmed) return;
        this.commands.deleteSection(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      if (selection?.type === 'formPart') {
        const formPart = system?.formParts?.find(item => item.id === selection.id);
        const name = formPart?.name || 'dieses Formteil';
        const confirmed = await UiDialogService.confirm({
          title: 'Formteil löschen',
          message: `„${name}“ wird dauerhaft aus der Anlage entfernt.`,
          confirmLabel: 'Formteil löschen',
          tone: 'danger',
        });
        if (!confirmed) return;
        this.commands.deleteFormPart(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      if (selection?.type === 'specialComponent') {
        const component = system?.specialComponents?.find(item => item.id === selection.id);
        const name = component?.name || 'dieses Sonderbauteil';
        const confirmed = await UiDialogService.confirm({
          title: 'Sonderbauteil löschen',
          message: `„${name}“ wird dauerhaft aus der Anlage entfernt.`,
          details: ['Der hinterlegte Druckverlust wird danach nicht mehr berücksichtigt.'],
          confirmLabel: 'Sonderbauteil löschen',
          tone: 'danger',
        });
        if (!confirmed) return;
        this.commands.deleteSpecialComponent(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      console.info('RibbonAction: Keine löschbare Auswahl vorhanden.');
    } catch (error) {
      UiDialogService.alert({ title: 'Aktion nicht möglich', message: error.message, tone: 'danger' });
    }
  }

  moveSelectedUp() {
    this.moveSelected(-1);
  }

  moveSelectedDown() {
    this.moveSelected(1);
  }

  moveSelected(direction = 0) {
    const selection = this.getSelection();

    try {
      if (selection?.type === 'section') {
        this.commands.moveSection(selection.id, direction);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      if (selection?.type === 'formPart') {
        this.commands.moveFormPart(selection.id, direction);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      if (selection?.type === 'specialComponent') {
        this.commands.moveSpecialComponent(selection.id, direction);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }
    } catch (error) {
      UiDialogService.alert(error.message);
    }
  }

  projectCheck() {
    const project = this.state.project;
    const system = this.getActiveSystem();

    if (!project) {
      UiDialogService.alert('Kein Projekt vorhanden.');
      return;
    }

    this.calculate({ silent: true, keepDirty: true });
    const check = ProjectDiagnostics.create(project, { system });

    if (system && typeof this.state.selectSystem === 'function') {
      this.state.selectSystem(system);
    } else {
      this.state.notify?.();
    }

    const text = ProjectDiagnostics.toText(check);
    UiDialogService.alert(text || 'Projektcheck abgeschlossen.');
  }


  calculationCheck() {
    const project = this.state.project;
    const system = this.getActiveSystem();

    if (!project) {
      UiDialogService.alert('Kein Projekt vorhanden.');
      return;
    }

    this.calculate({ silent: true, keepDirty: true });

    const check = CalculationDiagnostics.create(project, { system });
    this.state.calculationCheck = check;
    this.state.setSelection?.('calculationCheck', check);
    this.state.notify?.();

    const text = CalculationDiagnostics.toText(check);
    if (check.status === 'error') {
      console.warn(text);
    } else {
      console.info(text);
    }
  }


  projectFileCheck() {
    const project = this.state.project;

    if (!project) {
      UiDialogService.alert('Kein Projekt vorhanden.');
      return;
    }

    const check = ProjectFileDiagnostics.create(project);
    this.state.projectFileCheck = check;
    this.state.setSelection?.('projectFileCheck', check);
    this.state.notify?.();

    const text = ProjectFileDiagnostics.toText(check);
    if (check.status === 'error') {
      console.warn(text);
    } else {
      console.info(text);
    }
  }


  async deploymentCheck() {
    const project = this.state.project;

    if (!project) {
      UiDialogService.alert('Kein Projekt vorhanden.');
      return;
    }

    this.calculate({ silent: true, keepDirty: true });

    try {
      const check = await DeploymentDiagnostics.run({ project, version: APP_ASSET_VERSION });
      this.state.deploymentCheck = check;
      this.state.setSelection?.('deploymentCheck', check);
      this.state.notify?.();

      if (check.status === 'error') {
        console.warn(DeploymentDiagnostics.toText(check));
      } else {
        console.info(DeploymentDiagnostics.toText(check));
      }
    } catch (error) {
      UiDialogService.alert(`Deployment-QS konnte nicht ausgeführt werden: ${error.message}`);
    }
  }

  async releaseCandidateCheck() {
    const project = this.state.project;
    const system = this.getActiveSystem();

    if (!project) {
      UiDialogService.alert('Kein Projekt vorhanden.');
      return;
    }

    try {
      const check = await ReleaseCandidateDiagnostics.run({ state: this.state, project, system });
      this.state.releaseCandidateCheck = check;
      this.state.setSelection?.('releaseCandidateCheck', check);
      this.state.notify?.();

      const text = ReleaseCandidateDiagnostics.toText(check);
      if (check.status === 'error') {
        console.warn(text);
      } else {
        console.info(text);
      }
    } catch (error) {
      UiDialogService.alert(`Release-Candidate-QS konnte nicht ausgeführt werden: ${error.message}`);
    }
  }


  showShortcutHelp() {
    this.state.helpContext = {
      openedAt: new Date().toISOString(),
      label: APP_BUILD_LABEL,
    };
    this.state.setSelection?.('help', this.state.helpContext);
    this.state.notify?.();
  }

  copyShortcutHelp() {
    const text = [
      `Tastaturkürzel ${APP_BUILD_LABEL}`,
      '',
      'Ctrl + S: Projekt speichern',
      'Ctrl + O: Projekt öffnen',
      'Demo laden: Beispielprojekt mit Teilstrecken, Formteilen und Sonderbauteilen',
      'Ctrl + N: Neues Projekt',
      'Ctrl + Enter: Neu berechnen',
      'Alt + Home: zurück zur Startübersicht',
      'Ctrl + B oder Ctrl + P: Bericht öffnen',
      'Ctrl + D: ausgewähltes Element duplizieren',
      'Entf: ausgewähltes Element löschen',
      'Ctrl + Alt + ↑/↓: ausgewähltes Element verschieben',
      'Esc: zurück zur Anlagenübersicht',
      '',
      'Autosicherung: Ungespeicherte Änderungen werden lokal im Browser gesichert.',
      'Nach dem Speichern wird diese lokale Sicherung automatisch gelöscht.',
    ].join('\n');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => UiDialogService.alert('Tastaturkürzel wurden kopiert.')).catch(() => UiDialogService.alert(text));
      return;
    }

    UiDialogService.alert(text);
  }


  showAppInfo() {
    const info = createAppInfo();
    const project = this.state.project;
    const system = this.getActiveSystem();
    const sections = system?.sections?.length || 0;
    const formParts = system?.formParts?.length || 0;
    const specialComponents = system?.specialComponents?.length || 0;

    const license = createLicenseStatus();

    UiDialogService.alert([
      APP_BUILD_LABEL,
      '',
      `Cache-Version: ?v=${APP_ASSET_VERSION}`,
      `Adresse: ${info.href || 'lokal / unbekannt'}`,
      `Lizenzstatus: ${license.modeLabel}`,
      `Aktiver Plan: ${license.activePlan?.name || 'unbekannt'} – ${license.activePlan?.label || ''}`,
      '',
      `Aktuelles Projekt: ${project?.name || project?.meta?.name || 'kein Projekt'}${project?.demo?.isDemoProject ? ' (Demo)' : ''}`,
      `Aktive Anlage: ${system?.name || 'keine Anlage'}`,
      `Teilstrecken: ${sections}`,
      `Formteile: ${formParts}`,
      `Sonderbauteile: ${specialComponents}`,
      `Projektdatei: ${StorageEngine.createFileName(project || {})}`,
      '',
      formatLicenseStatusText(license),
      '',
      'Hinweis: Nach dem Hochladen auf GitHub Pages bitte Ctrl+F5 drücken, damit die neue Cache-Version geladen wird.',
    ].join('\n'));
  }

  showReport() {
    const project = this.state.project;

    if (!project) {
      UiDialogService.alert('Kein Projekt vorhanden.');
      return;
    }

    this.calculate({ silent: true, keepDirty: true });

    if (typeof this.state.selectReport === 'function') {
      this.state.selectReport(this.state.selectedSystem || project.systems?.[0] || project);
    } else {
      this.state.setSelection('report', this.state.selectedSystem || project.systems?.[0] || project);
      this.state.notify();
    }

    console.info('RibbonAction: Bericht geöffnet');
  }

  exportPdf() {
    this.showReport();
  }
  showEngineeringQuality() {
    const project = this.state.project;
    if (!project) {
      UiDialogService.alert('Kein Projekt vorhanden.');
      return;
    }
    this.calculate({ silent: true, keepDirty: true });
    this.state.setSelection?.('engineeringQuality', this.getActiveSystem());
    this.state.notify?.();
  }


  showLiveSimulation() {
    const system = this.getActiveSystem();
    if (!system) {
      UiDialogService.alert('Keine Anlage vorhanden.');
      return;
    }
    this.calculate({ silent: true, keepDirty: true });
    this.state.setSelection?.('liveSimulation', system);
    this.state.notify?.();
  }

  showNetworkSchematic() {
    const system = this.getActiveSystem();
    if (!system) {
      UiDialogService.alert('Keine Anlage vorhanden.');
      return;
    }
    this.calculate({ silent: true, keepDirty: true });
    this.state.setSelection?.('networkSchematic', system);
    this.state.notify?.();
  }

}
