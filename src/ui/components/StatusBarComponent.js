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

    this.root.innerHTML = `
      <span>Version 0.2.0 UI Foundation</span>
      <span>Auswahl: ${label}</span>
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