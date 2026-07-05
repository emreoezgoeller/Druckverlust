// Druckverlust Pro – RibbonComponent
// Menüband der Professional-Oberfläche.

export default class RibbonComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('RibbonComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;
  }

  render() {
    this.root.innerHTML = `
      <div class="dp-brand">
        <strong>Druckverlust Pro</strong>
        <span>Professional</span>
      </div>

      <div class="ribbon-groups">
        <div class="ribbon-group">
          <div class="ribbon-label">Datei</div>
          <button data-action="new">Neu</button>
          <button data-action="open">Öffnen</button>
          <button data-action="save">Speichern</button>
        </div>

        <div class="ribbon-group">
          <div class="ribbon-label">Projekt</div>
          <button data-action="add-section">+ Teilstrecke</button>
          <button data-action="add-formpart">+ Formteil</button>
          <button data-action="add-special">+ Sonderbauteil</button>
        </div>

        <div class="ribbon-group">
          <div class="ribbon-label">Berechnung</div>
          <button data-action="calculate">Berechnen</button>
          <button data-action="validate">Prüfen</button>
        </div>

        <div class="ribbon-group">
          <div class="ribbon-label">Export</div>
          <button data-action="pdf">PDF</button>
        </div>
      </div>
    `;
  }
}