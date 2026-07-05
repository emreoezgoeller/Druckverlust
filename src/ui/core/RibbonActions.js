// Druckverlust Pro – RibbonActions
// Zentrale Befehle für die Ribbon-Oberfläche.

import ProjectCommands from '../../app/ProjectCommands.js';
import StorageEngine from '../../storage/StorageEngine.js';

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

    console.info('RibbonAction: Berechnung gestartet', project);

    alert(
      'Die Berechnungsfunktion wird im nächsten Sprint mit der CalculationEngine verbunden.'
    );
  }

  exportPdf() {
    console.info('RibbonAction: PDF Export');

    alert(
      'Der PDF-Export wird im späteren Sprint über eine eigene PDFEngine umgesetzt.'
    );
  }
}