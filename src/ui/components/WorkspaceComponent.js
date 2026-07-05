// Druckverlust Pro – WorkspaceComponent
// Zeigt den Arbeitsbereich passend zur aktuellen Auswahl.

export default class WorkspaceComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('WorkspaceComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;

    this.state.subscribe(() => this.render());
    this.render();
  }

  render() {
    const selection = this.state.getSelection();

    if (!selection || selection.type === 'none') {
      this.renderEmpty();
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

    this.renderEmpty();
  }

  renderEmpty() {
    this.root.innerHTML = `
      <h1>Arbeitsbereich</h1>
      <p>Bitte wähle links ein Element aus.</p>
    `;
  }

  renderProject(project) {
    this.root.innerHTML = `
      <h1>${project?.name ?? 'Projekt'}</h1>
      <p>Projektübersicht der Druckverlustberechnung.</p>

      <div class="dp-cards">
        <div class="dp-card">
          <strong>Anlagen</strong>
          <span>${project?.systems?.length ?? 0}</span>
        </div>
      </div>
    `;
  }

  renderSystem(system) {
    const sections = system?.sections || [];
    const formParts = system?.formParts || [];
    const specialComponents = system?.specialComponents || [];

    const calculationResult = this.state.project?.calculationResult;
    const calculation = calculationResult?.calculation || null;
    const total = calculation?.totals?.totalRounded ?? calculation?.totals?.total ?? null;

    this.root.innerHTML = `
      <h1>${system?.name ?? 'Anlage'}</h1>
      <p>Übersicht der gewählten Anlage.</p>

      <div class="dp-cards">
        <div class="dp-card">
          <strong>Teilstrecken</strong>
          <span>${sections.length}</span>
        </div>

        <div class="dp-card">
          <strong>Formteile</strong>
          <span>${formParts.length}</span>
        </div>

        <div class="dp-card">
          <strong>Sonderbauteile</strong>
          <span>${specialComponents.length}</span>
        </div>
      </div>

      ${this.renderCalculationSummary(total)}
      ${this.renderCalculationTable(calculation)}
    `;
  }

  renderCalculationSummary(total) {
    if (total === null || total === undefined) {
      return `
        <section class="dp-result-panel">
          <h2>Berechnung</h2>
          <p>Noch keine Berechnung durchgeführt.</p>
        </section>
      `;
    }

    return `
      <section class="dp-result-panel">
        <h2>Berechnungsergebnis</h2>

        <div class="dp-result-value">
          <strong>${Number(total).toFixed(1)} Pa</strong>
          <span>Gesamtdruckverlust</span>
        </div>
      </section>
    `;
  }

  renderCalculationTable(calculation) {
    const results = calculation?.results || [];

    if (!results.length) {
      return '';
    }

    return `
      <section class="dp-result-panel">
        <h2>Teilstrecken-Ergebnisse</h2>

        <table class="dp-table">
          <thead>
            <tr>
              <th>Teilstrecke</th>
              <th>Luftmenge</th>
              <th>Geschwindigkeit</th>
              <th>Druckverlust</th>
              <th>ζ Formteile</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(result => `
              <tr>
                <td>${result.id ?? result.name ?? '-'}</td>
                <td>${this.formatNumber(result.airVolume)} m³/h</td>
                <td>${this.formatNumber(result.velocity)} m/s</td>
                <td>${this.formatNumber(result.totalPressureLoss ?? result.pressureLoss)} Pa</td>
                <td>${this.formatNumber(result.zetaFromParts)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  renderSection(section) {
    this.root.innerHTML = `
      <h1>${section?.name ?? section?.id ?? 'Teilstrecke'}</h1>
      <p>Berechnungsansicht der Teilstrecke.</p>

      <table class="dp-table">
        <tbody>
          <tr>
            <th>Luftmenge</th>
            <td>${section?.airVolume ?? 0} m³/h</td>
          </tr>
          <tr>
            <th>Länge</th>
            <td>${section?.length ?? 0} m</td>
          </tr>
          <tr>
            <th>Typ</th>
            <td>${section?.type ?? '-'}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  renderFormPart(formPart) {
    this.root.innerHTML = `
      <h1>${formPart?.name ?? 'Formteil'}</h1>
      <p>Detailansicht des Formteils.</p>

      <table class="dp-table">
        <tbody>
          <tr>
            <th>Teilstrecke</th>
            <td>${formPart?.sectionId ?? '-'}</td>
          </tr>
          <tr>
            <th>Zeta</th>
            <td>${formPart?.zeta ?? '-'}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  renderSpecialComponent(component) {
    this.root.innerHTML = `
      <h1>${component?.name ?? 'Sonderbauteil'}</h1>
      <p>Detailansicht des Sonderbauteils.</p>

      <table class="dp-table">
        <tbody>
          <tr>
            <th>Typ</th>
            <td>${component?.type ?? '-'}</td>
          </tr>
          <tr>
            <th>Hersteller</th>
            <td>${component?.manufacturer ?? '-'}</td>
          </tr>
          <tr>
            <th>Druckverlust</th>
            <td>${component?.pressureLoss ?? 0} Pa</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  formatNumber(value, digits = 2) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '-';
    }

    return Number(value).toFixed(digits);
  }
}