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

    this.root.innerHTML = `
      <h3>Projekt</h3>

      <div class="dp-tree">
        <div class="tree-item tree-root">
          ${project.project?.name || 'Unbenanntes Projekt'}
        </div>

        <div class="tree-group">
          <div class="tree-title">▼ ${system.name || 'Anlage 1'}</div>

          <div class="tree-title indent">▼ Teilstrecken</div>
          ${(system.sections || []).map(section => `
            <button class="tree-button indent-2" data-type="section" data-id="${section.id}">
              ${section.ts || section.id || 'Teilstrecke'}
            </button>
          `).join('')}

          <div class="tree-title indent">▼ Formteile</div>
          ${(system.formParts || []).map(part => `
            <button class="tree-button indent-2" data-type="formPart" data-id="${part.id}">
              ${part.name || 'Formteil'} · ζ ${Number(part.zeta || 0).toFixed(3)}
            </button>
          `).join('')}

          <div class="tree-title indent">▼ Sonderbauteile</div>
          ${(system.specialComponents || []).map(item => `
            <button class="tree-button indent-2" data-type="special" data-id="${item.id}">
              ${item.name || 'Sonderbauteil'} · ${Number(item.pressureLoss || 0).toFixed(1)} Pa
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.bindEvents(system);
  }

  bindEvents(system) {
    this.root.querySelectorAll('.tree-button').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.type;
        const id = button.dataset.id;

        if (type === 'section') {
          const section = system.sections.find(item => item.id === id);
          this.state.selectSection(section);
        }

        if (type === 'formPart') {
          const part = system.formParts.find(item => item.id === id);
          this.state.selectFormPart(part);
        }

        if (type === 'special') {
          const item = system.specialComponents.find(item => item.id === id);
          this.state.selectSpecialComponent(item);
        }
      });
    });
  }
}