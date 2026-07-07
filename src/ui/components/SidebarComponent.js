// Druckverlust Pro – SidebarComponent
// Rendert den Projektbaum aus dem ApplicationState.

export default class SidebarComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('SidebarComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;

    this.state.subscribe(() => this.render());
    this.render();
  }

  render() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      this.root.innerHTML = `
        <h3>Projekt</h3>
        <div class="dp-empty">Kein Projekt geladen.</div>
      `;
      return;
    }

    const sections = system.sections || [];
    const formParts = system.formParts || [];
    const specialComponents = system.specialComponents || [];

    this.root.innerHTML = `
      <h3>Projekt</h3>

      <button class="dp-tree-item ${this.state.getSelectionType() === 'project' ? 'active' : ''}" data-type="project">
      ${project.name ?? project.title ?? project.projectName ?? 'Unbenanntes Projekt'}
      </button>

      <button class="dp-tree-item ${this.state.isSelected('system', system.id) ? 'active' : ''}" data-type="system" data-id="${system.id}">
        ▼ ${system.name}
      </button>

      <div class="dp-tree-group">
        <div class="dp-tree-heading">▼ Teilstrecken</div>
        ${sections.map(section => `
          <button class="dp-tree-item indent ${this.state.isSelected('section', section.id) ? 'active' : ''}" data-type="section" data-id="${section.id}">
            ${section.name || section.id}
          </button>
        `).join('')}
      </div>

      <div class="dp-tree-group">
        <div class="dp-tree-heading">▼ Formteile</div>
        ${formParts.map(formPart => `
          <button class="dp-tree-item indent ${this.state.isSelected('formPart', formPart.id) ? 'active' : ''}" data-type="formPart" data-id="${formPart.id}">
            ${formPart.name}
          </button>
        `).join('')}
      </div>



      <div class="dp-tree-group">
        <div class="dp-tree-heading">▼ Auswertung</div>
        <button class="dp-tree-item indent ${this.state.getSelectionType() === 'report' ? 'active' : ''}" data-type="report" data-id="report">
          Bericht / Druckansicht
        </button>
      </div>

      <div class="dp-tree-group">
        <div class="dp-tree-heading">▼ Sonderbauteile</div>
        ${specialComponents.map(component => `
          <button class="dp-tree-item indent ${this.state.isSelected('specialComponent', component.id) ? 'active' : ''}" data-type="specialComponent" data-id="${component.id}">
            ${component.name} · ${component.pressureLoss?.toFixed?.(1) ?? component.pressureLoss ?? 0} Pa
          </button>
        `).join('')}
      </div>
    `;

    this.bindEvents(project, system);
  }

  bindEvents(project, system) {
    this.root.querySelectorAll('.dp-tree-item').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.type;
        const id = button.dataset.id;

        if (type === 'project') {
          this.state.setSelection('project', project);
          this.state.notify();
          return;
        }

        if (type === 'system') {
          this.state.selectSystem(system);
          return;
        }

        if (type === 'section') {
          const section = system.sections?.find(item => item.id === id);
          this.state.selectSection(section);
          return;
        }

        if (type === 'formPart') {
          const formPart = system.formParts?.find(item => item.id === id);
          this.state.selectFormPart(formPart);
          return;
        }

        if (type === 'report') {
          if (typeof this.state.selectReport === 'function') {
            this.state.selectReport(system);
          } else {
            this.state.setSelection('report', system);
            this.state.notify();
          }
          return;
        }

        if (type === 'specialComponent') {
          const component = system.specialComponents?.find(item => item.id === id);
          this.state.selectSpecialComponent(component);
        }
      });
    });
  }
}