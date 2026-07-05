// Druckverlust Pro – StatusBarComponent
// Untere Statusleiste der Professional-Oberfläche.

export default class StatusBarComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('StatusBarComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;

    this.state.subscribe(() => this.render());
  }

  render() {
    const projectName = this.state.project?.project?.name || 'Kein Projekt';
    const selectionType = this.state.getSelectionType();

    this.root.innerHTML = `
      <span>Druckverlust Pro · Version 0.2.0 UI Foundation</span>
      <span>Projekt: ${projectName}</span>
      <span>Auswahl: ${selectionType}</span>
      <span>Status: Bereit</span>
    `;
  }
}