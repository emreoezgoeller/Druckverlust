// Druckverlust Pro – PropertiesComponent
// Zeigt Eigenschaften zur aktuellen Auswahl.

export default class PropertiesComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('PropertiesComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;

    this.state.subscribe(() => this.render());
    this.render();
  }

  render() {
    const selection = this.state.getSelection();

    if (!selection || selection.type === 'none') {
      this.root.innerHTML = `
        <h3>Eigenschaften</h3>
        <p>Keine Auswahl vorhanden.</p>
      `;
      return;
    }

    if (selection.type === 'project') {
      this.renderProject(selection.data);
      return;
    }

    if (selection.type === 'system') {
      this.renderSystem(selection.data);
      return;
    }

    if (selection.type === 'section') {
      this.renderSection(selection.data);
      return;
    }

    if (selection.type === 'formPart') {
      this.renderFormPart(selection.data);
      return;
    }

    if (selection.type === 'specialComponent') {
      this.renderSpecialComponent(selection.data);
      return;
    }

    this.root.innerHTML = `
      <h3>Eigenschaften</h3>
      <p>Unbekannte Auswahl.</p>
    `;
  }

  renderProject(project) {
    this.root.innerHTML = `
      <h3>Projekt</h3>
      <dl class="dp-properties-list">
        <dt>Name</dt>
        <dd>${project?.name ?? '-'}</dd>

        <dt>Anlagen</dt>
        <dd>${project?.systems?.length ?? 0}</dd>
      </dl>
    `;
  }

  renderSystem(system) {
    this.root.innerHTML = `
      <h3>Anlage</h3>
      <dl class="dp-properties-list">
        <dt>Name</dt>
        <dd>${system?.name ?? '-'}</dd>

        <dt>Teilstrecken</dt>
        <dd>${system?.sections?.length ?? 0}</dd>

        <dt>Formteile</dt>
        <dd>${system?.formParts?.length ?? 0}</dd>

        <dt>Sonderbauteile</dt>
        <dd>${system?.specialComponents?.length ?? 0}</dd>
      </dl>
    `;
  }

  renderSection(section) {
  this.root.innerHTML = `
    <h3>Teilstrecke</h3>

    <div class="dp-form">
      <label>
        <span>Name</span>
        <input data-field="name" value="${section?.name ?? section?.id ?? ''}">
      </label>

      <label>
        <span>Typ</span>
        <select data-field="type">
          <option value="duct" ${section?.type === 'duct' ? 'selected' : ''}>Rechteckkanal</option>
          <option value="pipe" ${section?.type === 'pipe' ? 'selected' : ''}>Rundrohr</option>
        </select>
      </label>

      <label>
        <span>Luftmenge m³/h</span>
        <input data-field="q" type="number" step="1" value="${section?.q ?? section?.airVolume ?? section?.volumeFlow ?? 0}">
      </label>

      <label>
        <span>Länge m</span>
        <input data-field="l" type="number" step="0.01" value="${section?.l ?? section?.length ?? 0}">
      </label>

      <label>
        <span>Breite m</span>
        <input data-field="b" type="number" step="0.001" value="${section?.b ?? section?.width ?? 0}">
      </label>

      <label>
        <span>Höhe m</span>
        <input data-field="h" type="number" step="0.001" value="${section?.h ?? section?.height ?? 0}">
      </label>

      <label>
        <span>Durchmesser m</span>
        <input data-field="d" type="number" step="0.001" value="${section?.d ?? section?.diameter ?? 0}">
      </label>
    </div>
  `;

  this.bindSectionInputs(section);
}
bindSectionInputs(section) {
  this.root.querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('change', () => {
      const field = input.dataset.field;
      const value = input.type === 'number'
        ? Number(input.value)
        : input.value;

      section[field] = value;

      this.state.markCalculationDirty();
    });
  });
}

  renderFormPart(formPart) {
    this.root.innerHTML = `
      <h3>Formteil</h3>
      <dl class="dp-properties-list">
        <dt>Name</dt>
        <dd>${formPart?.name ?? '-'}</dd>

        <dt>Teilstrecke</dt>
        <dd>${formPart?.sectionId ?? '-'}</dd>

        <dt>Zeta</dt>
        <dd>${formPart?.zeta ?? '-'}</dd>
      </dl>
    `;
  }

  renderSpecialComponent(component) {
    this.root.innerHTML = `
      <h3>Sonderbauteil</h3>
      <dl class="dp-properties-list">
        <dt>Name</dt>
        <dd>${component?.name ?? '-'}</dd>

        <dt>Typ</dt>
        <dd>${component?.type ?? '-'}</dd>

        <dt>Hersteller</dt>
        <dd>${component?.manufacturer ?? '-'}</dd>

        <dt>Druckverlust</dt>
        <dd>${component?.pressureLoss ?? 0} Pa</dd>
      </dl>
    `;
  }
}