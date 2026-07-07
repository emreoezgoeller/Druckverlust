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
    const quality = this.getQualityStatus();
    const lastCalculation = this.getLastCalculationLabel();

    this.root.innerHTML = `
      <div class="dp-status-left">
        Druckverlust Pro v1.0
      </div>

      <div class="dp-status-center">
        Auswahl: ${label}
        ${lastCalculation ? `<span class="dp-status-muted"> · ${lastCalculation}</span>` : ''}
      </div>

      <div class="dp-status-right">
        ${
          projectDirty
            ? '<span class="dp-status-warning">● Projekt geändert</span>'
            : '<span class="dp-status-ok">● Projekt gespeichert</span>'
        }

        ${
          calculationDirty
            ? '<span class="dp-status-warning">● Berechnung prüfen</span>'
            : '<span class="dp-status-ok">● Automatisch berechnet</span>'
        }

        <span class="${quality.className}">● QS ${quality.label}</span>
      </div>
    `;
  }

  getQualityStatus() {
    const result = this.state.project?.calculationResult;
    const quality = result?.quality;
    const errors = Number(quality?.errorCount ?? result?.validation?.errors?.length ?? 0);
    const warnings = Number(quality?.warningCount ?? result?.validation?.warnings?.length ?? 0);

    if (errors > 0) {
      return { label: `${errors} Fehler`, className: 'dp-status-danger' };
    }

    if (warnings > 0) {
      return { label: `${warnings} Hinweis${warnings === 1 ? '' : 'e'}`, className: 'dp-status-warning' };
    }

    if (this.state.lastAutoCalculationError) {
      return { label: 'Prüfen', className: 'dp-status-warning' };
    }

    return { label: 'OK', className: 'dp-status-ok' };
  }

  getLastCalculationLabel() {
    const timestamp = this.state.lastCalculationAt || this.state.project?.calculationResult?.timestamp;

    if (!timestamp) return '';

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return '';

    return `zuletzt ${date.toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
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

    if (selection.type === 'formPartPicker') {
      return 'Formteilbibliothek';
    }

    if (selection.type === 'formPart') {
      return `Formteil – ${selection.data?.name ?? '-'}`;
    }

    if (selection.type === 'report') {
      return `Bericht – ${selection.data?.name ?? this.state.selectedSystem?.name ?? '-'}`;
    }

    if (selection.type === 'specialComponent') {
      return `Sonderbauteil – ${selection.data?.name ?? '-'}`;
    }

    return 'Unbekannt';
  }
}
