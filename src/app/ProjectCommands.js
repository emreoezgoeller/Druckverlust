// Druckverlust Pro – ProjectCommands
// Zentrale Projektbefehle für UI, Ribbon und spätere Dialoge.

export default class ProjectCommands {
  constructor(state) {
    if (!state) {
      throw new Error('ProjectCommands benötigt einen ApplicationState.');
    }

    this.state = state;
  }

  createProject(name = 'Neues Projekt') {
    const now = Date.now();

    const project = {
      id: `project-${now}`,
      name,
      systems: [
        {
          id: `system-${now}`,
          name: 'Zuluftanlage',
          sections: [],
          formParts: [],
          specialComponents: []
        }
      ]
    };

    this.state.setProject(project);
    this.state.setSelection('project', project);
    this.state.markCalculationDirty();

    return project;
  }

  addSection() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.sections = system.sections || [];

    const number = system.sections.length + 1;

    const section = {
      id: `section-${Date.now()}`,
      name: `ts${number}`,
      type: 'rectangular',
      airVolume: 0,
      length: 0,
      width: 0,
      height: 0
    };

    system.sections.push(section);
    this.state.selectSection(section);
    this.state.markCalculationDirty();

    return section;
  }

  addFormPart() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      throw new Error('Es ist kein Projekt oder keine Anlage vorhanden.');
    }

    system.formParts = system.formParts || [];

    const number = system.formParts.length + 1;
    const selectedSection = this.state.selectedSection || system.sections?.[0] || null;

    const formPart = {
  id: `formpart-${Date.now()}`,
  name: `Formteil ${number}`,
  type: 'kreis_bogen',
  sectionId: selectedSection?.id || null,
  radius: 0.75,
  angle: 90,
  zeta: 0.21
};

    system.formParts.push(formPart);
    this.state.selectFormPart(formPart);
    this.state.markCalculationDirty();

    return formPart;
  }
}