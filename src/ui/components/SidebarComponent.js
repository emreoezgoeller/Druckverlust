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
      ${this.escapeHtml(project.name ?? project.title ?? project.projectName ?? 'Unbenanntes Projekt')}
      </button>

      <button class="dp-tree-item ${this.state.isSelected('system', system.id) ? 'active' : ''}" data-type="system" data-id="${system.id}">
        ▼ ${this.escapeHtml(system.name || 'Anlage')}
      </button>

      <div class="dp-tree-group">
        <div class="dp-tree-heading">▼ Teilstrecken <span>${sections.length}</span></div>
        ${sections.length ? sections.map(section => `
          <button class="dp-tree-item indent ${this.state.isSelected('section', section.id) ? 'active' : ''}" data-type="section" data-id="${section.id}">
            ${this.escapeHtml(section.name || section.id)}
          </button>
        `).join('') : '<div class="dp-tree-empty">Keine Teilstrecke</div>'}
      </div>

      <div class="dp-tree-group">
        <div class="dp-tree-heading">▼ Formteile <span>${formParts.length}</span></div>
        ${this.renderFormPartsBySection(system, sections, formParts)}
      </div>

      <div class="dp-tree-group">
        <div class="dp-tree-heading">▼ Sonderbauteile <span>${specialComponents.length}</span></div>
        ${this.renderSpecialComponentsByCategory(specialComponents)}
      </div>

      <div class="dp-tree-group">
        <div class="dp-tree-heading">▼ Auswertung</div>
        <button class="dp-tree-item indent ${this.state.getSelectionType() === 'report' ? 'active' : ''}" data-type="report" data-id="report">
          Bericht / Druckansicht
        </button>
      </div>
    `;

    this.bindEvents(project, system);
  }


  renderFormPartsBySection(system = {}, sections = [], formParts = []) {
    if (!formParts.length) return '<div class="dp-tree-empty">Keine Formteile</div>';

    const groups = [];
    const assignedSectionIds = new Set(sections.map(section => section.id));

    sections.forEach(section => {
      const parts = formParts.filter(part => part?.sectionId === section.id);
      if (parts.length) {
        groups.push({
          title: section.name || section.id || 'Teilstrecke',
          parts,
        });
      }
    });

    const unassigned = formParts.filter(part => !part?.sectionId || !assignedSectionIds.has(part.sectionId));
    if (unassigned.length) {
      groups.push({
        title: 'Nicht zugeordnet',
        parts: unassigned,
      });
    }

    return groups.map(group => `
      <div class="dp-tree-subgroup">
        <div class="dp-tree-subheading">
          <span>${this.escapeHtml(group.title)}</span>
          <em>${group.parts.length}</em>
        </div>
        ${group.parts.map(formPart => `
          <button class="dp-tree-item indent ${this.state.isSelected('formPart', formPart.id) ? 'active' : ''}" data-type="formPart" data-id="${formPart.id}">
            <strong>${this.escapeHtml(formPart.name || 'Formteil')}</strong>
            <span>${this.escapeHtml(formPart.type || 'Formteil')}</span>
          </button>
        `).join('')}
      </div>
    `).join('');
  }


  renderSpecialComponentsByCategory(specialComponents = []) {
    if (!specialComponents.length) return '<div class="dp-tree-empty">Keine Sonderbauteile</div>';

    const groups = [];

    specialComponents.forEach(component => {
      const category = component?.category || component?.type || 'Sonderbauteile';
      let group = groups.find(item => item.category === category);

      if (!group) {
        group = { category, components: [] };
        groups.push(group);
      }

      group.components.push(component);
    });

    return groups.map(group => `
      <div class="dp-tree-subgroup">
        <div class="dp-tree-subheading">
          <span>${this.escapeHtml(group.category)}</span>
          <em>${group.components.length}</em>
        </div>
        ${group.components.map(component => {
          const pressureLoss = Number(component?.pressureLoss ?? component?.pa ?? 0);
          return `
            <button class="dp-tree-item indent ${this.state.isSelected('specialComponent', component.id) ? 'active' : ''}" data-type="specialComponent" data-id="${component.id}">
              <strong>${this.escapeHtml(component.name || 'Sonderbauteil')}</strong>
              <span>${this.escapeHtml(component.type || 'Komponente')} · ${Number.isFinite(pressureLoss) ? pressureLoss.toFixed(1) : '0.0'} Pa</span>
            </button>
          `;
        }).join('')}
      </div>
    `).join('');
  }

  escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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