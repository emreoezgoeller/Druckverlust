// Druckverlust Pro – StatusBarComponent
// Zeigt Statusinformationen der Anwendung.

export default class StatusBarComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('StatusBarComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;

    this.state.subscribe(() => this.render());
    this.render();
  }

  render() {
    const selection = this.state.getSelection();
    const label = this.getSelectionLabel(selection);

    const calculationDirty = this.state.isCalculationDirty;
    const projectDirty = this.state.isProjectDirty;

    this.root.innerHTML = `
      <div class="dp-status-left">
        Druckverlust Pro v1.0
      </div>

      <div class="dp-status-center">
        Auswahl: ${label}
      </div>

      <div class="dp-status-right">
        ${
          projectDirty
            ? '<span class="dp-status-warning">● Projekt geändert</span>'
            : '<span class="dp-status-ok">● Projekt gespeichert</span>'
        }

        ${
          calculationDirty
            ? '<span class="dp-status-warning">● Berechnung veraltet</span>'
            : '<span class="dp-status-ok">● Berechnet</span>'
        }
      </div>
    `;
  }

  getSelectionLabel(selection) {
    if (!selection || selection.type === 'none') {
      return 'Keine';
    }

    if (selection.type === 'project') {
      return `Projekt – ${selection.data?.name ?? '-'}`;
    }

    if (selection.type === 'system') {
      return `Anlage – ${selection.data?.name ?? '-'}`;
    }

    if (selection.type === 'section') {
      return `Teilstrecke – ${selection.data?.name ?? selection.data?.id ?? '-'}`;
    }

    if (selection.type === 'formPart') {
      return `Formteil – ${selection.data?.name ?? '-'}`;
    }

    if (selection.type === 'specialComponent') {
      return `Sonderbauteil – ${selection.data?.name ?? '-'}`;
    }

    return 'Unbekannt';
  }
}