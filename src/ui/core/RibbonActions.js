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
        this.state.notify();

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

    StorageEngine.download(project);

    console.info('RibbonAction: Projekt gespeichert', project);
  }

  addSection() {
    try {
      const section = this.commands.addSection();
      console.info('RibbonAction: Teilstrecke hinzugefügt', section);
    } catch (error) {
      alert(error.message);
    }
  }

  addFormPart() {
    try {
      const formPart = this.commands.addFormPart();
      console.info('RibbonAction: Formteil hinzugefügt', formPart);
    } catch (error) {
      alert(error.message);
    }
  }

  calculate() {
    const project = this.state.project;

    if (!project) {
      alert('Kein Projekt vorhanden.');
      return;
    }

    try {
      const result = ProjectCalculationService.calculate(project);

      project.calculationResult = result;

      this.state.notify();

      console.info('RibbonAction: Berechnung abgeschlossen', result);
      alert('Berechnung abgeschlossen.');
    } catch (error) {
      console.error(error);
      alert(`Berechnung fehlgeschlagen: ${error.message}`);
    }
  }

  exportPdf() {
    console.info('RibbonAction: PDF Export');

    alert(
      'Der PDF-Export wird im späteren Sprint über eine eigene PDFEngine umgesetzt.'
    );
  }
}