// Druckverlust Pro – WorkspaceComponent
// Zeigt den Arbeitsbereich passend zur aktuellen Auswahl.

import ProjectCalculationService from '../../project/ProjectCalculationService.js';
import { calculateSection } from '../../core/CalculationEngine.js';
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
            <input data-field="q" type="number" step="1" value="${this.formatAirflowInput(section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0)}">
          </label>

          <label>
            <span>Typ</span>
            <select data-field="type">
            <option value="duct" ${this.isDuctSection(section) ? 'selected' : ''}>Rechteckkanal</option>
            <option value="pipe" ${this.isPipeSection(section) ? 'selected' : ''}>Rundrohr</option>
            </select>
          </label>

          <label>
            <span>Länge [m]</span>
            <input data-field="l" type="number" step="0.01" value="${section?.l ?? section?.length ?? 0}">
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

    this.ensureFormPartSection(formPart, sections);
    this.applyFormPartDefaults(formPart);
    this.deriveAndStoreFormPart(formPart);
    this.calculateAndStoreFormPart(formPart, { silent: true });

    this.root.innerHTML = `
      <h1>${this.escapeHtml(formPart?.name ?? 'Formteil')}</h1>
      ${this.renderDirtyHint()}
      ${this.renderFormPartOverview(formPart)}

      <section class="dp-editor-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Formteil bearbeiten</h2>
            <p>Die Eingabefelder werden automatisch aus der Formteilbibliothek erzeugt.</p>
          </div>
        </div>

        <div class="dp-editor-grid dp-formpart-main-grid">
          <label>
            <span>Name</span>
            <input data-field="name" value="${this.escapeAttribute(formPart?.name ?? '')}">
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
                <option value="${this.escapeAttribute(section.id)}" ${formPart?.sectionId === section.id ? 'selected' : ''}>
                  ${this.escapeHtml(section.name ?? section.ts ?? section.id)}
                </option>
              `).join('')}
            </select>
          </label>
        </div>

        ${this.renderFormPartParameters(formPart)}

        <div class="dp-editor-actions">
          <button data-action="calculate-formpart">Übernehmen und Projekt berechnen</button>
        </div>
      </section>

      ${this.renderFormPartResult(formPart)}
    `;

    this.bindFormPartEditor(formPart);
    this.bindFormPartImageFallbacks();
  }

  bindFormPartEditor(formPart) {
    this.root.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;

        formPart[field] = this.readFormPartFieldValue(formPart, field, input);

        if (field === 'type') {
          this.applyFormPartDefaults(formPart, { overwrite: true });
        }

        this.deriveAndStoreFormPart(formPart);
        this.calculateAndStoreFormPart(formPart, { silent: true });
        this.state.markCalculationDirty();
        this.renderFormPart(formPart);
      });
    });

    const button = this.root.querySelector('[data-action="calculate-formpart"]');

    if (button) {
      button.addEventListener('click', () => {
        try {
          this.deriveAndStoreFormPart(formPart);
          this.calculateAndStoreFormPart(formPart);

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
    const sectionInfo = this.getFormPartSectionCalculation(formPart);
    const sectionResult = sectionInfo?.result || null;
    const sectionName = sectionInfo?.sectionName || this.getSectionNameById(formPart?.sectionId);
    const dynamicPressure = sectionResult?.dynamicPressure ?? null;
    const zeta = Number(formPart?.zeta ?? formPart?.calculationResult?.zeta ?? 0);

    const pressureLoss =
      dynamicPressure !== null
        ? zeta * dynamicPressure
        : null;

    const formPartResult = formPart?.calculationResult || null;
    const warnings = [
      ...(formPartResult?.warnings || []),
      ...(sectionInfo?.warnings || []),
    ];

    return `
      <section class="dp-result-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Formteil-Ergebnis</h2>
            ${sectionInfo?.isLive ? '<p>Die Teilstreckenwerte werden aktuell direkt aus der zugewiesenen Teilstrecke berechnet.</p>' : ''}
          </div>
        </div>

        <table class="dp-table">
          <tbody>
            <tr>
              <th>Teilstrecke</th>
              <td>${this.escapeHtml(sectionName)}</td>
            </tr>
            ${sectionResult ? `
              <tr>
                <th>Luftmenge</th>
                <td>${this.formatAirflow(sectionResult.q)} m³/h</td>
              </tr>
              <tr>
                <th>Geschwindigkeit</th>
                <td>${this.formatNumber(sectionResult.velocity)} m/s</td>
              </tr>
            ` : ''}
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
            ${this.renderHosenstueckDerivedRows(formPart)}
            ${formPartResult?.calculation?.ratio !== undefined ? `
              <tr>
                <th>R/d</th>
                <td>${this.formatNumber(formPartResult.calculation.ratio, 3)}</td>
              </tr>
            ` : ''}
            ${formPartResult?.calculation?.rdValue !== undefined ? `
              <tr>
                <th>Tabellenwert R/d</th>
                <td>${this.formatNumber(formPartResult.calculation.rdValue, 3)}</td>
              </tr>
            ` : ''}
            ${formPartResult?.calculation?.angleFactor !== undefined ? `
              <tr>
                <th>Tabellenwert α</th>
                <td>${this.formatNumber(formPartResult.calculation.angleFactor, 3)}</td>
              </tr>
            ` : ''}
            ${formPartResult?.calculation?.formula ? `
              <tr>
                <th>Formel</th>
                <td>${this.escapeHtml(formPartResult.calculation.formula)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        ${warnings.length ? `
          <div class="dp-warning-list">
            ${warnings.map(warning => `<p>⚠ ${this.escapeHtml(warning)}</p>`).join('')}
          </div>
        ` : ''}
      </section>
    `;
  }

  renderFormPartParameters(formPart) {
    const entry = this.getRegistryEntry(formPart);

    if (!entry?.parameters?.length) {
      return `
        <fieldset class="dp-parameter-group">
          <legend>Manueller ζ-Wert</legend>
          <div class="dp-editor-grid dp-parameter-grid">
            <label>
              <span>ζ-Wert</span>
              <input data-field="zeta" type="number" step="0.001" value="${formPart?.zeta ?? 0}">
              <p class="dp-field-hint">Für dieses Formteil ist noch kein Fachrechner hinterlegt.</p>
            </label>
          </div>
        </fieldset>
      `;
    }

    const visibleParameters = entry.parameters.filter(parameter => this.isFormPartParameterVisible(formPart, parameter));

    return this.getGroupedParameters(visibleParameters).map(group => `
      <fieldset class="dp-parameter-group">
        <legend>${this.escapeHtml(group.name)}</legend>
        <div class="dp-editor-grid dp-parameter-grid">
          ${group.parameters.map(parameter => this.renderFormPartParameterField(formPart, parameter)).join('')}
        </div>
      </fieldset>
    `).join('');
  }

  isFormPartParameterVisible(formPart, parameter) {
    const condition = parameter?.showWhen;

    if (!condition) return true;

    return Object.entries(condition).every(([field, expected]) => {
      const actual = formPart?.[field];

      if (Array.isArray(expected)) {
        return expected.map(String).includes(String(actual));
      }

      return String(actual) === String(expected);
    });
  }

  renderFormPartParameterField(formPart, parameter) {
    const value = formPart?.[parameter.id] ?? parameter.default ?? 0;
    const fieldId = this.escapeAttribute(parameter.id);
    const label = this.escapeHtml(parameter.label ?? parameter.id);

    if (parameter.type === 'select') {
      const options = Array.isArray(parameter.options) ? parameter.options : [];

      return `
        <label class="dp-param-field dp-param-select">
          <span>${label}</span>
          <select data-field="${fieldId}">
            ${options.map(option => `
              <option value="${this.escapeAttribute(option)}" ${String(value) === String(option) ? 'selected' : ''}>
                ${this.escapeHtml(option)}${parameter.unit ? ` ${this.escapeHtml(parameter.unit)}` : ''}
              </option>
            `).join('')}
          </select>
          ${this.renderParameterHelp(parameter, 'Auswahlwert – freie Eingabe gesperrt.')}
        </label>
      `;
    }

    const displayValue = parameter.readOnly
      ? this.formatFormPartParameterValue(value, parameter)
      : value;
    const readOnlyAttributes = parameter.readOnly
      ? 'readonly aria-readonly="true"'
      : '';
    const readOnlyClass = parameter.readOnly ? ' dp-param-readonly' : '';

    return `
      <label class="dp-param-field${readOnlyClass}">
        <span>${label}</span>
        <input
          data-field="${fieldId}"
          type="number"
          step="${this.escapeAttribute(parameter.step ?? 0.001)}"
          ${parameter.min !== undefined ? `min="${this.escapeAttribute(parameter.min)}"` : ''}
          ${parameter.max !== undefined ? `max="${this.escapeAttribute(parameter.max)}"` : ''}
          ${readOnlyAttributes}
          value="${this.escapeAttribute(displayValue)}">
        ${this.renderParameterHelp(parameter)}
      </label>
    `;
  }

  readFormPartFieldValue(formPart, field, input) {
    const parameter = this.getFormPartParameter(formPart, field);

    if (parameter?.readOnly) {
      return formPart?.[field] ?? parameter.default ?? 0;
    }

    if (input.type === 'number' || parameter?.type === 'number' || this.hasNumericOptions(parameter)) {
      return Number(input.value);
    }

    return input.value;
  }

  hasNumericOptions(parameter) {
    return Array.isArray(parameter?.options) && parameter.options.every(option => Number.isFinite(Number(option)));
  }

  applyFormPartDefaults(formPart, options = {}) {
    const entry = this.getRegistryEntry(formPart);

    if (!formPart || !entry?.parameters?.length) return;

    const normalizedValues = this.registry.normalizeValues(entry.id, formPart);

    entry.parameters.forEach(parameter => {
      const hasValue = formPart[parameter.id] !== undefined && formPart[parameter.id] !== null && formPart[parameter.id] !== '';

      if (options.overwrite || !hasValue) {
        formPart[parameter.id] = parameter.default ?? 0;
        return;
      }

      formPart[parameter.id] = normalizedValues[parameter.id];
    });
  }

  deriveAndStoreFormPart(formPart) {
    const entry = this.getRegistryEntry(formPart);

    if (!formPart || !entry || typeof this.registry.deriveValues !== 'function') {
      return null;
    }

    const values = this.registry.deriveValues(entry.id, formPart);
    Object.assign(formPart, values);

    return values;
  }

  calculateAndStoreFormPart(formPart, options = {}) {
    const entry = this.getRegistryEntry(formPart);

    if (!formPart || !entry || typeof entry.calculate !== 'function') {
      return null;
    }

    try {
      const values = this.getFormPartParameterValues(formPart);
      const result = this.registry.calculate(entry.id, values);

      Object.assign(formPart, values);
      formPart.zeta = Number(result?.zeta ?? 0);
      formPart.calculationResult = result;

      return result;
    } catch (error) {
      if (!options.silent) throw error;

      formPart.calculationResult = {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        input: this.getFormPartParameterValues(formPart),
        calculation: {},
        zeta: Number(formPart?.zeta ?? 0),
        warnings: [error.message],
      };

      return null;
    }
  }

  getFormPartParameterValues(formPart) {
    const entry = this.getRegistryEntry(formPart);

    if (!entry) return {};

    return typeof this.registry.deriveValues === 'function'
      ? this.registry.deriveValues(entry.id, formPart)
      : this.registry.normalizeValues(entry.id, formPart);
  }

  getFormPartParameter(formPart, parameterId) {
    const entry = this.getRegistryEntry(formPart);

    return entry?.parameters?.find(parameter => parameter.id === parameterId) || null;
  }

  getRegistryEntry(formPart) {
    if (!formPart?.type) {
      return null;
    }

    return this.registry.get(formPart.type);
  }

  renderFormPartOverview(formPart) {
    const entry = this.getRegistryEntry(formPart);

    if (!entry) return '';

    const result = formPart?.calculationResult || null;
    const zeta = Number(formPart?.zeta ?? result?.zeta ?? 0);

    return `
      <section class="dp-formpart-overview">
        ${this.renderFormPartImage(entry)}

        <div class="dp-formpart-info">
          <div class="dp-formpart-meta">
            <span class="dp-chip">${this.escapeHtml(entry.category ?? 'Formteil')}</span>
            <span class="dp-chip dp-chip-soft">${this.escapeHtml(entry.id)}</span>
          </div>

          <h2>${this.escapeHtml(entry.name)}</h2>
          ${entry.description ? `<p>${this.escapeHtml(entry.description)}</p>` : ''}

          <div class="dp-formpart-kpis">
            <div>
              <small>aktueller ζ-Wert</small>
              <strong>${this.formatNumber(zeta, 3)}</strong>
            </div>
            <div>
              <small>Parameter</small>
              <strong>${entry.parameters?.length ?? 0}</strong>
            </div>
            <div>
              <small>Calculator</small>
              <strong>${typeof entry.calculate === 'function' ? 'aktiv' : 'manuell'}</strong>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderFormPartImage(entry) {
    const sources = this.getFormPartImageSources(entry);

    if (!sources.length) {
      return `
        <div class="dp-formpart-image dp-formpart-image-empty">
          <span>Keine Skizze vorhanden</span>
        </div>
      `;
    }

    const [src, ...fallbacks] = sources;

    return `
      <div class="dp-formpart-image">
        <img
          src="${this.escapeAttribute(src)}"
          alt="${this.escapeAttribute(entry.name)}"
          data-fallbacks="${this.escapeAttribute(fallbacks.join('|'))}">
        <div class="dp-image-missing" style="display:none;">Skizze konnte nicht geladen werden.</div>
      </div>
    `;
  }

  getFormPartImageSources(entry) {
    const sources = [];
    const add = source => {
      if (!source) return;
      const normalized = String(source).replaceAll('\\', '/');
      if (!sources.includes(normalized)) sources.push(normalized);
      if (!normalized.startsWith('./') && !normalized.startsWith('/') && !normalized.startsWith('data:')) {
        const relative = `./${normalized}`;
        if (!sources.includes(relative)) sources.push(relative);
      }
    };

    add(entry?.image);
    (entry?.imageFallbacks || []).forEach(add);

    if (entry?.id) {
      add(`assets/formteile/${entry.id}/${entry.id}.png`);
      add(`assets/formteile/${entry.id}.png`);
    }

    return sources;
  }

  bindFormPartImageFallbacks() {
    this.root.querySelectorAll('img[data-fallbacks]').forEach(img => {
      const fallbacks = String(img.dataset.fallbacks || '')
        .split('|')
        .map(item => item.trim())
        .filter(Boolean);

      img.addEventListener('error', () => {
        const next = fallbacks.shift();

        if (next) {
          img.src = next;
          return;
        }

        img.style.display = 'none';
        const missing = img.parentElement?.querySelector('.dp-image-missing');
        if (missing) missing.style.display = 'grid';
      });
    });
  }

  getGroupedParameters(parameters = []) {
    const groups = [];

    parameters.forEach(parameter => {
      const groupName = parameter.group || 'Parameter';
      let group = groups.find(item => item.name === groupName);

      if (!group) {
        group = { name: groupName, parameters: [] };
        groups.push(group);
      }

      group.parameters.push(parameter);
    });

    return groups;
  }

  formatFormPartParameterValue(value, parameter = {}) {
    if (value === null || value === undefined || value === '') return '';

    const number = Number(value);

    if (Number.isFinite(number)) {
      const precision = Number.isInteger(parameter.precision) ? parameter.precision : 3;
      return number.toFixed(precision).replace(/\.?0+$/, '');
    }

    return value;
  }

  renderHosenstueckDerivedRows(formPart) {
    if (formPart?.type !== 'hosenstueck') return '';

    return `
      <tr>
        <th>Hauptfläche A</th>
        <td>${this.formatNumber(formPart?.A_area, 6)} m²</td>
      </tr>
      <tr>
        <th>Abzweigfläche AA</th>
        <td>${this.formatNumber(formPart?.AA_area, 6)} m²</td>
      </tr>
      <tr>
        <th>Verhältnis wA/w</th>
        <td>${this.formatNumber(formPart?.wA_w, 3)}</td>
      </tr>
    `;
  }

  renderParameterHelp(parameter, fallback = '') {
    const help = parameter?.help || fallback;

    if (!help) return '';

    const lockedClass = parameter?.locked ? ' dp-field-hint-locked' : '';

    return `<p class="dp-field-hint${lockedClass}">${this.escapeHtml(help)}</p>`;
  }

  escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  escapeAttribute(value = '') {
    return this.escapeHtml(value);
  }

  renderFormPartTypeOptions(formPart) {
    return this.registry.all().map(item => `
      <option value="${this.escapeAttribute(item.id)}" ${formPart?.type === item.id ? 'selected' : ''}>
        ${this.escapeHtml(item.name)}
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
                  <td>${this.formatAirflow(volumeFlow)} m³/h</td>
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

  isPipeSection(section = {}) {
    const type = String(section?.type || section?.kind || '').toLowerCase();
    return ['pipe', 'rohr', 'round', 'rund', 'rundrohr'].includes(type);
  }

  isDuctSection(section = {}) {
    return !this.isPipeSection(section);
  }

  renderGeometryFields(section) {
  if (this.isPipeSection(section)) {
    return `
      <label>
        <span>Durchmesser [m]</span>
        <input data-field="d" type="number" step="0.001" value="${section?.d ?? section?.diameter ?? 0}">
      </label>
    `;
  }

  return `
    <label>
      <span>Breite [m]</span>
      <input data-field="b" type="number" step="0.001" value="${section?.b ?? section?.width ?? 0}">
    </label>

    <label>
      <span>Höhe [m]</span>
      <input data-field="h" type="number" step="0.001" value="${section?.h ?? section?.height ?? 0}">
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

  ensureFormPartSection(formPart, sections = []) {
    if (!formPart || !sections.length) return;

    const hasValidSection = sections.some(section => section.id === formPart.sectionId);

    if (!formPart.sectionId || !hasValidSection) {
      formPart.sectionId = sections[0].id;
    }
  }

  getSectionById(sectionId) {
    if (!sectionId) return null;

    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    return system?.sections?.find(section => section.id === sectionId) || null;
  }

  getFormPartSectionCalculation(formPart) {
    const section = this.getSectionById(formPart?.sectionId);

    if (!section) {
      return {
        section: null,
        sectionName: '-',
        result: null,
        isLive: true,
        warnings: ['Dem Formteil ist noch keine gültige Teilstrecke zugewiesen.'],
      };
    }

    const storedItem = this.getCalculationItemBySectionId(section.id);

    if (storedItem?.result) {
      return {
        section,
        sectionName: this.getSectionNameById(section.id),
        result: storedItem.result,
        isLive: false,
        warnings: [],
      };
    }

    const settings = this.state.project?.settings || {};
    let result = calculateSection(section, { settings });
    const warnings = [...(result?.warnings || [])];

    const q = Number(section.q ?? section.volumeFlow ?? section.airVolume ?? section.volumeFlowM3h ?? 0);
    const formPartDiameterMm = Number(formPart?.d ?? 0);

    if ((result?.dynamicPressure ?? 0) <= 0 && q > 0 && formPartDiameterMm > 0) {
      result = calculateSection({
        ...section,
        type: 'pipe',
        q,
        d: formPartDiameterMm / 1000,
      }, { settings });

      warnings.push('Für die Live-Anzeige wurde der Durchmesser d des Formteils als Rohrdurchmesser verwendet. Bitte Teilstrecke prüfen.');
    }

    return {
      section,
      sectionName: this.getSectionNameById(section.id),
      result,
      isLive: true,
      warnings,
    };
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

formatAirflow(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return String(Math.round(Number(value)));
}

formatAirflowInput(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return 0;
  }

  return Math.round(Number(value));
}

formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return Number(value).toFixed(digits);
}
}