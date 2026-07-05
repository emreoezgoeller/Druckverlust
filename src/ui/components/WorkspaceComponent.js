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

    if (selection.type === 'project') return this.renderProject(selection.data);
    if (selection.type === 'system') return this.renderSystem(selection.data);
    if (selection.type === 'section') return this.renderSection(selection.data);
    if (selection.type === 'formPart') return this.renderFormPart(selection.data);
    if (selection.type === 'specialComponent') return this.renderSpecialComponent(selection.data);

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
            ${results.map(item => {
              const result = item.result || {};
              const input = item.input || {};

              const name =
                input.name ??
                input.ts ??
                input.sectionNo ??
                input.id ??
                item.id ??
                '-';

              const volumeFlow =
                result.q ??
                result.airVolume ??
                result.volumeFlow ??
                input.q ??
                input.airVolume ??
                input.volumeFlow;

              const velocity =
                result.velocity ??
                result.airVelocity;

              const pressureLoss =
                result.roundedTotalLoss ??
                result.totalLoss ??
                result.totalPressureLoss ??
                result.pressureLoss ??
                result.dp;

              const zeta =
                item.zetaFromParts ??
                result.zetaSum ??
                input.zetaSum ??
                input.zeta;

              return `
                <tr>
                  <td>${name}</td>
                  <td>${this.formatNumber(volumeFlow)} m³/h</td>
                  <td>${this.formatNumber(velocity)} m/s</td>
                  <td>${this.formatNumber(pressureLoss)} Pa</td>
                  <td>${this.formatNumber(zeta)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  renderSection(section) {
  const calculationItem = this.getCalculationItemBySectionId(section?.id);
  const result = calculationItem?.result || null;

  this.root.innerHTML = `
    <h1>${section?.name ?? section?.id ?? 'Teilstrecke'}</h1>
    <p>Berechnungsansicht der Teilstrecke.</p>

    <table class="dp-table">
      <tbody>
        <tr>
          <th>Luftmenge</th>
          <td>${section?.q ?? section?.airVolume ?? section?.volumeFlow ?? 0} m³/h</td>
        </tr>
        <tr>
          <th>Länge</th>
          <td>${section?.l ?? section?.length ?? 0} m</td>
        </tr>
        <tr>
          <th>Typ</th>
          <td>${section?.type ?? '-'}</td>
        </tr>
      </tbody>
    </table>

    ${this.renderSectionResult(result, calculationItem)}
  `;
}

  renderFormPart(formPart) {
    const sectionName = this.getSectionNameById(formPart?.sectionId);

    this.root.innerHTML = `
      <h1>${formPart?.name ?? 'Formteil'}</h1>
      <p>Detailansicht des Formteils.</p>

      <table class="dp-table">
        <tbody>
          <tr>
            <th>Teilstrecke</th>
            <td>${sectionName}</td>
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
            <td>${component?.pressureLoss ?? component?.pa ?? 0} Pa</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  getSectionNameById(sectionId) {
    if (!sectionId) {
      return '-';
    }

    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const section = system?.sections?.find(item => item.id === sectionId);

    return section?.name ?? section?.ts ?? section?.sectionNo ?? section?.id ?? sectionId;
  }

renderSectionResult(result, item) {
  if (!result) {
    return `
      <section class="dp-result-panel">
        <h2>Berechnung</h2>
        <p>Noch keine Berechnung für diese Teilstrecke vorhanden.</p>
      </section>
    `;
  }

  return `
    <section class="dp-result-panel">
      <h2>Berechnungsergebnis</h2>

      <table class="dp-table">
        <tbody>
          <tr>
            <th>Geschwindigkeit</th>
            <td>${this.formatNumber(result.velocity)} m/s</td>
          </tr>
          <tr>
            <th>Dynamischer Druck</th>
            <td>${this.formatNumber(result.dynamicPressure)} Pa</td>
          </tr>
          <tr>
            <th>Reibungsverlust</th>
            <td>${this.formatNumber(result.frictionLoss)} Pa</td>
          </tr>
          <tr>
            <th>ζ Formteile</th>
            <td>${this.formatNumber(item?.zetaFromParts)}</td>
          </tr>
          <tr>
            <th>ζ-Verlust</th>
            <td>${this.formatNumber(result.zetaLoss)} Pa</td>
          </tr>
          <tr>
            <th>Gesamt</th>
            <td><strong>${this.formatNumber(result.roundedTotalLoss ?? result.totalLoss)} Pa</strong></td>
          </tr>
        </tbody>
      </table>
    </section>
  `;
}

getCalculationItemBySectionId(sectionId) {
  if (!sectionId) {
    return null;
  }

  const calculation = this.state.project?.calculationResult?.calculation;
  const results = calculation?.results || [];

  return results.find(item => item.id === sectionId || item.input?.id === sectionId) || null;
}

  formatNumber(value, digits = 2) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '-';
    }

    return Number(value).toFixed(digits);
  }
}