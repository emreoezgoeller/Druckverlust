// Druckverlust Pro – RibbonActions
// Zentrale Befehle für die Ribbon-Oberfläche.

import ProjectCommands from '../../app/ProjectCommands.js';
import StorageEngine from '../../storage/StorageEngine.js';
import ProjectCalculationService from '../../project/ProjectCalculationService.js';
import AutoSaveEngine from '../../storage/AutoSaveEngine.js';
import ProjectDiagnostics from '../../diagnostics/ProjectDiagnostics.js';
import DeploymentDiagnostics from '../../diagnostics/DeploymentDiagnostics.js';
import { APP_BUILD_LABEL, APP_RELEASE, createAppInfo } from '../../core/appVersion.js';

export default class RibbonActions {
  constructor(state) {
    if (!state) {
      throw new Error('RibbonActions benötigt einen ApplicationState.');
    }

    this.state = state;
    this.commands = new ProjectCommands(state);
  }

  confirmDiscardChanges(actionLabel = 'fortfahren') {
    if (!this.state.isProjectDirty) return true;
    return confirm(`Das aktuelle Projekt enthält ungespeicherte Änderungen. Trotzdem ${actionLabel}?`);
  }

  newProject() {
    if (!this.confirmDiscardChanges('ein neues Projekt erstellen')) return;

    this.commands.createProject({ projectNumber: 'Unbenannte Projektnummer' });
    this.calculate({ silent: true, keepDirty: false });
    this.state.markProjectClean();
    AutoSaveEngine.clear();
    console.info('RibbonAction: Neues Projekt erstellt');
  }

  openProject() {
    if (!this.confirmDiscardChanges('ein anderes Projekt öffnen')) return;

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

        this.state.setProject(project);
        this.state.setSelection('project', project);
        this.calculate({ silent: true, keepDirty: false });
        this.state.markProjectClean();
        AutoSaveEngine.clear();

        console.info('RibbonAction: Projekt geöffnet', project);
      } catch (error) {
        alert(error.message);
      }
    });

    input.click();
  }

  saveProject() {
    const project = this.state.project;

    if (!project) {
      alert('Kein Projekt zum Speichern vorhanden.');
      return;
    }

    try {
      this.calculate({ silent: true, keepDirty: true });
      StorageEngine.download(project);
      this.state.markProjectClean();
      AutoSaveEngine.clear();
      console.info('RibbonAction: Projekt gespeichert', project);
    } catch (error) {
      alert(`Projekt konnte nicht gespeichert werden: ${error.message}`);
    }
  }

  addSection() {
    try {
      const section = this.commands.addSection();
      this.calculate({ silent: true, keepDirty: true });
      console.info('RibbonAction: Teilstrecke hinzugefügt', section);
    } catch (error) {
      alert(error.message);
    }
  }

  addFormPart() {
    try {
      const formPart = this.commands.addFormPart();
      console.info('RibbonAction: Formteil-Auswahl geöffnet', formPart);
    } catch (error) {
      alert(error.message);
    }
  }

  addSpecialComponent() {
    try {
      const component = this.commands.addSpecialComponent('freie_komponente');
      this.calculate({ silent: true, keepDirty: true });
      console.info('RibbonAction: Sonderbauteil hinzugefügt', component);
    } catch (error) {
      alert(error.message);
    }
  }

  calculate(options = {}) {
    const project = this.state.project;

    if (!project) {
      if (!options.silent) alert('Kein Projekt vorhanden.');
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
        alert(`Berechnung fehlgeschlagen: ${error.message}`);
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
      alert(error.message);
    }
  }

  deleteSelected() {
    const selection = this.getSelection();
    const system = this.getActiveSystem();

    try {
      if (selection?.type === 'section') {
        const section = system?.sections?.find(item => item.id === selection.id);
        const name = section?.name || 'diese Teilstrecke';
        if (!confirm(`Teilstrecke „${name}“ wirklich löschen? Zugeordnete Formteile werden der nächsten verfügbaren Teilstrecke zugewiesen.`)) return;
        this.commands.deleteSection(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      if (selection?.type === 'formPart') {
        const formPart = system?.formParts?.find(item => item.id === selection.id);
        const name = formPart?.name || 'dieses Formteil';
        if (!confirm(`Formteil „${name}“ wirklich löschen?`)) return;
        this.commands.deleteFormPart(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      if (selection?.type === 'specialComponent') {
        const component = system?.specialComponents?.find(item => item.id === selection.id);
        const name = component?.name || 'dieses Sonderbauteil';
        if (!confirm(`Sonderbauteil „${name}“ wirklich löschen?`)) return;
        this.commands.deleteSpecialComponent(selection.id);
        this.calculate({ silent: true, keepDirty: true });
        return;
      }

      console.info('RibbonAction: Keine löschbare Auswahl vorhanden.');
    } catch (error) {
      alert(error.message);
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
      alert(error.message);
    }
  }

  projectCheck() {
    const project = this.state.project;
    const system = this.getActiveSystem();

    if (!project) {
      alert('Kein Projekt vorhanden.');
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
    alert(text || 'Projektcheck abgeschlossen.');
  }


  async deploymentCheck() {
    const project = this.state.project;

    if (!project) {
      alert('Kein Projekt vorhanden.');
      return;
    }

    this.calculate({ silent: true, keepDirty: true });

    try {
      const check = await DeploymentDiagnostics.run({ project, version: APP_RELEASE });
      this.state.deploymentCheck = check;
      this.state.setSelection?.('deploymentCheck', check);
      this.state.notify?.();

      if (check.status === 'error') {
        console.warn(DeploymentDiagnostics.toText(check));
      } else {
        console.info(DeploymentDiagnostics.toText(check));
      }
    } catch (error) {
      alert(`Deployment-QS konnte nicht ausgeführt werden: ${error.message}`);
    }
  }

  showShortcutHelp() {
    alert([
      `Tastaturkürzel ${APP_BUILD_LABEL}`,
      '',
      'Ctrl + S: Projekt speichern',
      'Ctrl + O: Projekt öffnen',
      'Ctrl + N: Neues Projekt',
      'Ctrl + Enter: Neu berechnen',
      'Projekt prüfen: über Ribbon-Schaltfläche „Projekt prüfen“',
      `Deploy prüfen: prüft GitHub-Pages-Pfade, Cache-Version ?v=${APP_RELEASE} und Pflichtdateien`,
      'Ctrl + B oder Ctrl + P: Bericht öffnen',
      'Ctrl + D: ausgewähltes Element duplizieren',
      'Entf: ausgewähltes Element löschen',
      'Ctrl + Alt + ↑/↓: ausgewähltes Element verschieben',
      'Esc: zurück zur Anlagenübersicht',
      '',
      'Autosicherung: Ungespeicherte Änderungen werden lokal im Browser gesichert.',
      'Nach dem Speichern wird diese lokale Sicherung automatisch gelöscht.',
    ].join('\n'));
  }


  showAppInfo() {
    const info = createAppInfo();
    const project = this.state.project;
    const system = this.getActiveSystem();
    const sections = system?.sections?.length || 0;
    const formParts = system?.formParts?.length || 0;
    const specialComponents = system?.specialComponents?.length || 0;

    alert([
      APP_BUILD_LABEL,
      '',
      `Cache-Version: ?v=${APP_RELEASE}`,
      `Adresse: ${info.href || 'lokal / unbekannt'}`,
      '',
      `Aktuelles Projekt: ${project?.name || project?.meta?.name || 'kein Projekt'}`,
      `Aktive Anlage: ${system?.name || 'keine Anlage'}`,
      `Teilstrecken: ${sections}`,
      `Formteile: ${formParts}`,
      `Sonderbauteile: ${specialComponents}`,
      '',
      'Hinweis: Nach dem Hochladen auf GitHub Pages bitte Ctrl+F5 drücken, damit die neue Cache-Version geladen wird.',
    ].join('\n'));
  }

  showReport() {
    const project = this.state.project;

    if (!project) {
      alert('Kein Projekt vorhanden.');
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
}
