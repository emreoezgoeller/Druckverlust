// Druckverlust Pro – WorkspaceComponent
// Zeigt den Arbeitsbereich passend zur aktuellen Auswahl.

import ProjectCalculationService from '../../project/ProjectCalculationService.js';
import { createDefaultFormPartRegistry } from '../../formteile/FormPartRegistry.js';

export default class WorkspaceComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('WorkspaceComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;
    this.registry = createDefaultFormPartRegistry();

    this.state.subscribe(() => this.render());
    this.render();
  }

  render() {
    const selection = this.state.getSelection();

    if (!selection || selection.type === 'none') return this.renderEmpty();

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

    const calculation = this.state.project?.calculationResult?.calculation || null;
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

  renderSection(section) {
    const calculationItem = this.getCalculationItemBySectionId(section?.id);
    const result = calculationItem?.result || null;

    this.root.innerHTML = `
      <h1>${section?.name ?? 'Teilstrecke'}</h1>
      ${this.renderDirtyHint()}

      <section class="dp-editor-panel">
        <h2>Eingabedaten</h2>

        <div class="dp-editor-grid">
          <label>
            <span>Luftmenge [m³/h]</span>
            <input data-field="q" type="number" value="${section?.q ?? 0}">
          </label>

          <label>
            <span>Typ</span>
            <select data-field="type">
            <option value="duct" ${section?.type === 'duct' ? 'selected' : ''}>Rechteckkanal</option>
            <option value="pipe" ${section?.type === 'pipe' ? 'selected' : ''}>Rundrohr</option>
            </select>
          </label>

          <label>
            <span>Länge [m]</span>
            <input data-field="l" type="number" step="0.01" value="${section?.l ?? 0}">
          </label>

          ${this.renderGeometryFields(section)}

        <div class="dp-editor-actions">
          <button data-action="calculate-section">Berechnen</button>
        </div>
      </section>

      ${this.renderSectionResult(result, calculationItem)}
    `;

    this.bindSectionEditor(section);
  }

  bindSectionEditor(section) {
    this.root.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;

        section[field] =
          input.type === 'number'
          ? Number(input.value)
          : input.value;

        if (field === 'type') {
            this.state.markCalculationDirty();
            return;
}

        this.state.markCalculationDirty();
      });
    });

    const calculateButton = this.root.querySelector('[data-action="calculate-section"]');

    if (calculateButton) {
      calculateButton.addEventListener('click', () => {
        try {
          const project = this.state.project;
          const result = ProjectCalculationService.calculate(project);

          project.calculationResult = result;

          this.state.lastCalculationAt = new Date().toISOString();
          this.state.markCalculationClean();
        } catch (error) {
          alert(`Berechnung fehlgeschlagen: ${error.message}`);
        }
      });
    }
  }

  renderFormPart(formPart) {
  const system = this.state.selectedSystem || this.state.project?.systems?.[0];
  const sections = system?.sections || [];

  this.root.innerHTML = `
    <h1>${formPart?.name ?? 'Formteil'}</h1>
    ${this.renderDirtyHint()}

    <section class="dp-editor-panel">
      <h2>Formteil bearbeiten</h2>

      <div class="dp-editor-grid">
        <label>
          <span>Name</span>
          <input data-field="name" value="${formPart?.name ?? ''}">
        </label>

        <label>
          <span>Formteiltyp</span>
          <select data-field="type">
          ${this.renderFormPartTypeOptions(formPart)}
          </select>
        </label>

        <label>
          <span>Teilstrecke</span>
          <select data-field="sectionId">
            ${sections.map(section => `
              <option value="${section.id}" ${formPart?.sectionId === section.id ? 'selected' : ''}>
                ${section.name ?? section.ts ?? section.id}
              </option>
            `).join('')}
          </select>
        </label>

        ${this.renderFormPartParameters(formPart)}

      <div class="dp-editor-actions">
        <button data-action="calculate-formpart">Übernehmen</button>
      </div>
    </section>

    ${this.renderFormPartResult(formPart)}
  `;

  this.bindFormPartEditor(formPart);
}

bindFormPartEditor(formPart) {
  this.root.querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('change', () => {
      const field = input.dataset.field;

      formPart[field] =
        input.type === 'number'
          ? Number(input.value)
          : input.value;

      this.state.markCalculationDirty();
    });
  });

  const button = this.root.querySelector('[data-action="calculate-formpart"]');

  if (button) {
    button.addEventListener('click', () => {
      try {
        const project = this.state.project;
        const result = ProjectCalculationService.calculate(project);

        project.calculationResult = result;

        this.state.lastCalculationAt = new Date().toISOString();
        this.state.markCalculationClean();
      } catch (error) {
        alert(`Berechnung fehlgeschlagen: ${error.message}`);
      }
    });
  }
}

renderFormPartResult(formPart) {
  const sectionResult = this.getCalculationItemBySectionId(formPart?.sectionId);
  const dynamicPressure = sectionResult?.result?.dynamicPressure ?? null;
  const zeta = Number(formPart?.zeta ?? 0);

  const pressureLoss =
    dynamicPressure !== null
      ? zeta * dynamicPressure
      : null;

  return `
    <section class="dp-result-panel">
      <h2>Formteil-Ergebnis</h2>

      <table class="dp-table">
        <tbody>
          <tr>
            <th>Teilstrecke</th>
            <td>${this.getSectionNameById(formPart?.sectionId)}</td>
          </tr>
          <tr>
            <th>Dynamischer Druck</th>
            <td>${this.formatNumber(dynamicPressure)} Pa</td>
          </tr>
          <tr>
            <th>ζ-Wert</th>
            <td>${this.formatNumber(zeta, 3)}</td>
          </tr>
          <tr>
            <th>Druckverlust Formteil</th>
            <td><strong>${this.formatNumber(pressureLoss)} Pa</strong></td>
          </tr>
        </tbody>
      </table>
    </section>
  `;
}

renderFormPartParameters(formPart) {
  const entry = this.getRegistryEntry(formPart);

  if (!entry?.parameters?.length) {
    return `
      <label>
        <span>ζ-Wert</span>
        <input data-field="zeta" type="number" step="0.001" value="${formPart?.zeta ?? 0}">
      </label>
    `;
  }

  return entry.parameters.map(parameter => `
    <label>
      <span>${this.getParameterLabel(parameter)}</span>
      <input
        data-field="${parameter}"
        type="number"
        step="0.001"
        value="${formPart?.[parameter] ?? this.getDefaultParameterValue(parameter)}">
    </label>
  `).join('');
}

getParameterLabel(parameter) {
  const labels = {
    R: 'Radius R [mm]',
    d: 'Durchmesser d [mm]',
    alpha: 'Winkel α [°]',
    a: 'Breite a [mm]',
    b: 'Höhe b [mm]',
    A1: 'Fläche A1 [m²]',
    A2: 'Fläche A2 [m²]',
    LE: 'Länge LE [mm]',
    WD: 'Volumenstrom Durchgang',
    WA: 'Volumenstrom Abzweig',
    W: 'Volumenstrom Gesamt',
    wA: 'Geschwindigkeit Abzweig',
    w: 'Geschwindigkeit Hauptkanal'
  };

  return labels[parameter] ?? parameter;
}

getDefaultParameterValue(parameter) {
  const defaults = {
    R: 110,
    d: 125,
    alpha: 90,
    a: 500,
    b: 300,
    A1: 0,
    A2: 0,
    LE: 0,
    WD: 0,
    WA: 0,
    W: 0,
    wA: 0,
    w: 0
  };

  return defaults[parameter] ?? 0;
}

getRegistryEntry(formPart) {
  if (!formPart?.type) {
    return null;
  }

  return this.registry.get(formPart.type);
}

renderFormPartTypeOptions(formPart) {
  return this.registry.all().map(item => `
    <option value="${item.id}" ${formPart?.type === item.id ? 'selected' : ''}>
      ${item.name}
    </option>
  `).join('');
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

    if (!results.length) return '';

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

  renderGeometryFields(section) {
  const type = section?.type ?? 'duct';

  if (type === 'pipe') {
    return `
      <label>
        <span>Durchmesser [m]</span>
        <input data-field="d" type="number" step="0.001" value="${section?.d ?? 0}">
      </label>
    `;
  }

  return `
    <label>
      <span>Breite [m]</span>
      <input data-field="b" type="number" step="0.001" value="${section?.b ?? 0}">
    </label>

    <label>
      <span>Höhe [m]</span>
      <input data-field="h" type="number" step="0.001" value="${section?.h ?? 0}">
    </label>
  `;
}

  renderSectionResult(result, item) {
    if (!result) {
      return `
        <section class="dp-result-panel">
          <h2>Berechnung</h2>
          ${this.renderCalculationTimestamp()}
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

  renderDirtyHint() {
    if (!this.state.isCalculationDirty) return '';

    return `
      <div class="dp-dirty-hint">
        ● Berechnung veraltet – bitte neu berechnen
      </div>
    `;
  }

  getCalculationItemBySectionId(sectionId) {
    if (!sectionId) return null;

    const calculation = this.state.project?.calculationResult?.calculation;
    const results = calculation?.results || [];

    return results.find(item =>
      item.id === sectionId ||
      item.input?.id === sectionId
    ) || null;
  }

  getSectionNameById(sectionId) {
    if (!sectionId) return '-';

    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const section = system?.sections?.find(item => item.id === sectionId);

    return section?.name ?? section?.ts ?? section?.sectionNo ?? section?.id ?? sectionId;
  }

  renderCalculationTimestamp() {
  if (!this.state.lastCalculationAt) {
    return '';
  }

  const date = new Date(this.state.lastCalculationAt);

  return `
    <p class="dp-result-meta">
      Zuletzt berechnet: ${date.toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}
    </p>
  `;
}

formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return Number(value).toFixed(digits);
}
}