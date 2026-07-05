// Druckverlust Pro – PropertiesComponent
// Zeigt Eigenschaften der aktuellen Auswahl aus dem ApplicationState.

export default class PropertiesComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('PropertiesComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;

    this.state.subscribe(() => this.render());
  }

  render() {
    const type = this.state.getSelectionType();

    if (type === 'section') {
      return this.renderSection(this.state.selectedSection);
    }

    if (type === 'formPart') {
      return this.renderFormPart(this.state.selectedFormPart);
    }

    if (type === 'specialComponent') {
      return this.renderSpecialComponent(this.state.selectedSpecialComponent);
    }

    if (type === 'system') {
      return this.renderSystem(this.state.selectedSystem);
    }

    this.root.innerHTML = `
      <h3>Eigenschaften</h3>
      <p class="dp-muted">Wähle links ein Element aus.</p>
    `;
  }

  renderSystem(system) {
    this.root.innerHTML = `
      <h3>Anlage</h3>
      <div class="property-grid">
        <label>Name</label><div>${system?.name || '-'}</div>
        <label>Typ</label><div>${system?.type || '-'}</div>
      </div>
    `;
  }

  renderSection(section) {
    this.root.innerHTML = `
      <h3>Teilstrecke</h3>
      <div class="property-grid">
        <label>ID</label><div>${section?.id || '-'}</div>
        <label>TS</label><div>${section?.ts || '-'}</div>
        <label>Typ</label><div>${section?.type || '-'}</div>
        <label>Beschreibung</label><div>${section?.description || '-'}</div>
        <label>Luftmenge</label><div>${Number(section?.q || 0).toFixed(1)} m³/h</div>
        <label>Breite</label><div>${Number(section?.b || 0).toFixed(3)} m</div>
        <label>Höhe</label><div>${Number(section?.h || 0).toFixed(3)} m</div>
        <label>Durchmesser</label><div>${Number(section?.d || 0).toFixed(3)} m</div>
        <label>Länge</label><div>${Number(section?.l || 0).toFixed(2)} m</div>
      </div>
    `;
  }

  renderFormPart(part) {
    this.root.innerHTML = `
      <h3>Formteil</h3>
      <div class="property-grid">
        <label>Name</label><div>${part?.name || '-'}</div>
        <label>Kategorie</label><div>${part?.category || '-'}</div>
        <label>Teilstrecke</label><div>${part?.sectionId || '-'}</div>
        <label>ζ-Wert</label><div>${Number(part?.zeta || 0).toFixed(3)}</div>
      </div>

      <h4>Parameter</h4>
      <pre class="property-json">${JSON.stringify(part?.parameters || part?.input || {}, null, 2)}</pre>

      <h4>Rechenweg</h4>
      <pre class="property-json">${JSON.stringify(part?.calculation || {}, null, 2)}</pre>
    `;
  }

  renderSpecialComponent(component) {
    this.root.innerHTML = `
      <h3>Sonderbauteil</h3>
      <div class="property-grid">
        <label>Name</label><div>${component?.name || '-'}</div>
        <label>Typ</label><div>${component?.type || '-'}</div>
        <label>Hersteller</label><div>${component?.manufacturer || '-'}</div>
        <label>Druckverlust</label><div>${Number(component?.pressureLoss || 0).toFixed(1)} Pa</div>
      </div>
    `;
  }
}