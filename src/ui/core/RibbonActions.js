// Druckverlust Pro – RibbonActions
// Zentrale Befehle für die Ribbon-Oberfläche.

import ProjectCommands from '../../app/ProjectCommands.js';
import StorageEngine from '../../storage/StorageEngine.js';
import ProjectCalculationService from '../../project/ProjectCalculationService.js';

export default class RibbonActions {
  constructor(state) {
    if (!state) {
      throw new Error('RibbonActions benötigt einen ApplicationState.');
    }

    this.state = state;
    this.commands = new ProjectCommands(state);
  }

  newProject() {
    this.commands.createProject('Neues Projekt');
    this.calculate({ silent: true, keepDirty: true });
    console.info('RibbonAction: Neues Projekt erstellt');
  }

  openProject() {
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
