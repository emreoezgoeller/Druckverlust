// Druckverlust Pro – WorkspaceComponent
// Zeigt den Arbeitsbereich passend zur aktuellen Auswahl.

import ProjectCalculationService from '../../project/ProjectCalculationService.js';
import { calculateSection } from '../../core/CalculationEngine.js';
import { createDefaultFormPartRegistry } from '../../formteile/FormPartRegistry.js';
import ProjectCommands from '../../app/ProjectCommands.js';

export default class WorkspaceComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('WorkspaceComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;
    this.registry = createDefaultFormPartRegistry();
    this.commands = new ProjectCommands(state);

    this.state.subscribe(() => this.render());
    this.render();
  }

  render() {
    const selection = this.state.getSelection();

    if (!selection || selection.type === 'none') return this.renderEmpty();

    if (selection.type === 'project') return this.renderProject(selection.data);
    if (selection.type === 'system') return this.renderSystem(selection.data);
    if (selection.type === 'section') return this.renderSection(selection.data);
    if (selection.type === 'formPartPicker') return this.renderFormPartPicker();
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
    const libraryItems = this.registry.all();
    const activeCalculators = libraryItems.filter(item => typeof item.calculate === 'function').length;

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

        <div class="dp-card">
          <strong>Formteilbibliothek</strong>
          <span>${activeCalculators}/${libraryItems.length} aktiv</span>
        </div>
      </div>

      ${this.renderCalculationSummary(total)}
      ${this.renderCalculationBreakdown(calculation)}
      ${this.renderCalculationAudit(calculation)}
      ${this.renderProjectValidationOverview(system)}
      ${this.renderCalculationTable(calculation)}
    `;
  }

  renderSection(section) {
    const calculationItem = this.getCalculationItemBySectionId(section?.id);
    const result = calculationItem?.result || null;

    this.root.innerHTML = `
      <h1>${section?.name ?? 'Teilstrecke'}</h1>
      ${this.renderDirtyHint()}
      ${this.renderValidationMessages(this.getSectionValidationWarnings(section))}

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

        <p class="dp-auto-calc-note">Änderungen werden automatisch übernommen und berechnet.</p>
      </section>

      ${this.renderSectionResult(result, calculationItem, section)}
      ${this.renderSectionFormParts(section)}
    `;

    this.bindSectionEditor(section);
  }

  bindSectionEditor(section) {
    this.root.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;

        section[field] = input.type === 'number'
          ? Number(input.value)
          : input.value;

        this.autoCalculateProject();
      });
    });
  }

  renderFormPartPicker() {
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const groups = this.getFormPartLibraryGroups();

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>Formteil auswählen</h1>
          <p>Wähle zuerst ein Formteil aus der Bibliothek. Danach öffnet sich automatisch der passende Editor.</p>
        </div>
      </div>

      ${!system?.sections?.length ? `
        <div class="dp-dirty-hint">
          Hinweis: Es ist noch keine Teilstrecke vorhanden. Das Formteil kann trotzdem erstellt werden, die Zuordnung erfolgt danach.
        </div>
      ` : ''}

      <section class="dp-formpart-library">
        ${groups.map(group => `
          <div class="dp-formpart-library-group">
            <div class="dp-formpart-library-heading">
              <h2>${this.escapeHtml(group.category)}</h2>
              <span>${group.items.length} Formteil${group.items.length === 1 ? '' : 'e'}</span>
            </div>

            <div class="dp-formpart-card-grid">
              ${group.items.map(item => this.renderFormPartPickerCard(item)).join('')}
            </div>
          </div>
        `).join('')}
      </section>
    `;

    this.bindFormPartPicker();
    this.bindFormPartImageFallbacks();
  }

  renderFormPartPickerCard(item) {
    return `
      <button class="dp-formpart-card" type="button" data-formpart-type="${this.escapeAttribute(item.id)}">
        <div class="dp-formpart-card-image">
          ${this.renderFormPartCardImage(item)}
        </div>
        <div class="dp-formpart-card-body">
          <span>${this.escapeHtml(item.category ?? 'Formteil')}</span>
          <strong>${this.escapeHtml(item.name)}</strong>
        </div>
      </button>
    `;
  }

  renderFormPartCardImage(item) {
    const sources = this.getFormPartImageSources(item);

    if (!sources.length) {
      return '<div class="dp-image-missing">Keine Skizze vorhanden</div>';
    }

    const [src, ...fallbacks] = sources;

    return `
      <img
        src="${this.escapeAttribute(src)}"
        alt="${this.escapeAttribute(item.name)}"
        data-fallbacks="${this.escapeAttribute(fallbacks.join('|'))}">
      <div class="dp-image-missing" style="display:none;">Skizze fehlt</div>
    `;
  }

  bindFormPartPicker() {
    this.root.querySelectorAll('[data-formpart-type]').forEach(button => {
      button.addEventListener('click', () => {
        try {
          const type = button.dataset.formpartType;
          this.commands.createFormPart(type);
          this.autoCalculateProject();
        } catch (error) {
          alert(`Formteil konnte nicht erstellt werden: ${error.message}`);
        }
      });
    });
  }

  getFormPartLibraryGroups() {
    const order = ['Rund', 'Rechteck', 'Übergänge', 'Spezial', 'Abzweige'];
    const groups = new Map();

    this.registry.all().forEach(item => {
      const category = item.category || 'Weitere';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(item);
    });

    return [...groups.entries()]
      .sort(([a], [b]) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);

        if (indexA !== -1 || indexB !== -1) {
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        }

        return a.localeCompare(b, 'de-CH');
      })
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => String(a.name).localeCompare(String(b.name), 'de-CH')),
      }));
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
      ${this.renderValidationMessages(this.getFormPartValidationWarnings(formPart))}
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

        <p class="dp-auto-calc-note">Änderungen werden automatisch übernommen und berechnet.</p>
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
        this.autoCalculateProject();
      });
    });
  }

  autoCalculateProject(options = {}) {
    const project = this.state.project;

    if (!project) return null;

    try {
      const result = ProjectCalculationService.calculate(project);
      project.calculationResult = result;

      if (options.notify === false) {
        this.state.isCalculationDirty = false;
        this.state.isProjectDirty = true;
        this.state.lastCalculationAt = new Date().toISOString();
      } else if (typeof this.state.markAutoCalculated === 'function') {
        this.state.markAutoCalculated();
      } else {
        this.state.lastCalculationAt = new Date().toISOString();
        this.state.markCalculationClean();
        this.state.markProjectDirty();
      }

      return result;
    } catch (error) {
      console.warn('Automatische Berechnung fehlgeschlagen:', error);

      if (options.notify === false) {
        this.state.isCalculationDirty = true;
        this.state.isProjectDirty = true;
      } else if (typeof this.state.markAutoCalculationFailed === 'function') {
        this.state.markAutoCalculationFailed(error);
      } else {
        this.state.markCalculationDirty();
      }

      return null;
    }
  }

  renderFormPartResult(formPart) {
    const sectionInfo = this.getFormPartSectionCalculation(formPart);
    const sectionResult = sectionInfo?.result || null;
    const sectionName = sectionInfo?.sectionName || this.getSectionNameById(formPart?.sectionId);
    const formPartResult = formPart?.calculationResult || null;
    const formPartCalculation = formPartResult?.calculation || {};
    const isDirectLoss = formPartCalculation.lossMode === 'direct';
    const dynamicPressure = isDirectLoss
      ? formPartCalculation.dynamicPressurePa ?? null
      : sectionResult?.dynamicPressure ?? null;
    const zeta = Number(formPart?.zeta ?? formPartResult?.zeta ?? 0);

    const pressureLoss = isDirectLoss
      ? formPartCalculation.pressureLossPa ?? null
      : dynamicPressure !== null
        ? zeta * dynamicPressure
        : null;

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
            ${sectionResult && !isDirectLoss ? `
              <tr>
                <th>Luftmenge</th>
                <td>${this.formatAirflow(sectionResult.q)} m³/h</td>
              </tr>
              <tr>
                <th>Geschwindigkeit</th>
                <td>${this.formatNumber(sectionResult.velocity)} m/s</td>
              </tr>
            ` : ''}
            ${this.renderFormPartReferenceRows(formPart, formPartResult)}
            <tr>
              <th>${isDirectLoss && formPartCalculation.pressureReference ? `Dynamischer Druck ${this.escapeHtml(formPartCalculation.pressureReference)}` : 'Dynamischer Druck'}</th>
              <td>${this.formatNumber(dynamicPressure)} Pa</td>
            </tr>
            ${isDirectLoss && formPartCalculation.pressureReference ? `
              <tr>
                <th>Bezugsgrösse</th>
                <td>bezogen auf ${this.escapeHtml(formPartCalculation.pressureReference)}</td>
              </tr>
            ` : ''}
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
            ${options.map(option => {
              const optionValue = this.getSelectOptionValue(option);
              const optionLabel = this.getSelectOptionLabel(parameter, option);

              return `
                <option value="${this.escapeAttribute(optionValue)}" ${String(value) === String(optionValue) ? 'selected' : ''}>
                  ${this.escapeHtml(optionLabel)}${parameter.unit ? ` ${this.escapeHtml(parameter.unit)}` : ''}
                </option>
              `;
            }).join('')}
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

  getSelectOptionValue(option) {
    if (option && typeof option === 'object' && 'value' in option) {
      return option.value;
    }

    return option;
  }

  getSelectOptionLabel(parameter, option) {
    const value = this.getSelectOptionValue(option);

    if (option && typeof option === 'object' && 'label' in option) {
      return option.label;
    }

    if (parameter?.optionLabels && parameter.optionLabels[value] !== undefined) {
      return parameter.optionLabels[value];
    }

    return value;
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
    return Array.isArray(parameter?.options)
      && parameter.options.every(option => Number.isFinite(Number(this.getSelectOptionValue(option))));
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

      const calculation = result?.calculation || {};
      const pressureLossPa = Number(calculation.pressureLossPa ?? 0);

      if (calculation.lossMode === 'direct' && Number.isFinite(pressureLossPa) && pressureLossPa !== 0) {
        formPart.lossMode = 'direct';
        formPart.pressureLossPa = pressureLossPa;
      } else {
        delete formPart.lossMode;
        delete formPart.pressureLossPa;
      }

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

  renderFormPartReferenceRows(formPart, formPartResult) {
    const rows = formPartResult?.calculation?.referenceRows;

    if (Array.isArray(rows) && rows.length) {
      return rows.map(row => {
        const label = this.escapeHtml(row?.label ?? 'Wert');
        const digits = Number.isInteger(row?.digits) ? row.digits : 2;
        const suffix = row?.suffix ? ` ${this.escapeHtml(row.suffix)}` : '';
        const rawValue = row?.value;
        const value = Number.isFinite(Number(rawValue))
          ? this.formatNumber(rawValue, digits)
          : this.escapeHtml(rawValue ?? '');

        return `
          <tr>
            <th>${label}</th>
            <td>${value}${suffix}</td>
          </tr>
        `;
      }).join('');
    }

    return this.renderHosenstueckReferenceRows(formPart, formPartResult);
  }

  renderHosenstueckReferenceRows(formPart, formPartResult) {
    if (formPart?.type !== 'hosenstueck' && formPartResult?.id !== 'hosenstueck') return '';

    const calculation = formPartResult?.calculation || {};

    const W = formPart?.W ?? formPartResult?.input?.W;
    const WA = formPart?.WA ?? formPartResult?.input?.WA;
    const w = calculation.w ?? formPart?.w;
    const wA = calculation.wA ?? formPart?.wA;

    return `
      <tr>
        <th>Hauptluftmenge W</th>
        <td>${this.formatAirflow(W)} m³/h</td>
      </tr>
      <tr>
        <th>Hauptgeschwindigkeit w</th>
        <td>${this.formatNumber(w)} m/s</td>
      </tr>
      <tr>
        <th>Abzweigluftmenge WA</th>
        <td><strong>${this.formatAirflow(WA)} m³/h</strong></td>
      </tr>
      <tr>
        <th>Abzweiggeschwindigkeit wA</th>
        <td><strong>${this.formatNumber(wA)} m/s</strong></td>
      </tr>
    `;
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

  renderHosenstueckCalculationRows(formPartResult) {
    if (formPartResult?.id !== 'hosenstueck') return '';

    const calculation = formPartResult?.calculation || {};

    return `
      ${calculation.ratioLookup !== undefined ? `
        <tr>
          <th>Tabellenwert wA/w</th>
          <td>${this.formatNumber(calculation.ratioLookup, 3)}</td>
        </tr>
      ` : ''}
      ${calculation.alphaLookup !== undefined ? `
        <tr>
          <th>Tabellenwert α</th>
          <td>${this.formatNumber(calculation.alphaLookup, 0)}°</td>
        </tr>
      ` : ''}
      ${calculation.pressureLossPa !== undefined ? `
        <tr>
          <th>Δp Hosenstück</th>
          <td>${this.formatNumber(calculation.pressureLossPa, 1)} Pa</td>
        </tr>
      ` : ''}
    `;
  }


  renderFormPartDisplayRows(formPartResult) {
    const rows = formPartResult?.calculation?.displayRows;

    if (!Array.isArray(rows) || rows.length === 0) return '';

    return rows.map(row => {
      const label = this.escapeHtml(row?.label ?? 'Wert');
      const digits = Number.isInteger(row?.digits) ? row.digits : 3;
      const suffix = row?.suffix ? ` ${this.escapeHtml(row.suffix)}` : '';
      const rawValue = row?.value;
      const value = Number.isFinite(Number(rawValue))
        ? this.formatNumber(rawValue, digits)
        : this.escapeHtml(rawValue ?? '');

      return `
        <tr>
          <th>${label}</th>
          <td>${value}${suffix}</td>
        </tr>
      `;
    }).join('');
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
    const groups = [];

    this.registry.all().forEach(item => {
      const category = item.category || 'Weitere';
      let group = groups.find(entry => entry.category === category);

      if (!group) {
        group = { category, items: [] };
        groups.push(group);
      }

      group.items.push(item);
    });

    return groups.map(group => `
      <optgroup label="${this.escapeAttribute(group.category)}">
        ${group.items.map(item => `
          <option value="${this.escapeAttribute(item.id)}" ${formPart?.type === item.id ? 'selected' : ''}>
            ${this.escapeHtml(item.name)}
          </option>
        `).join('')}
      </optgroup>
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
      <section class="dp-result-panel dp-total-panel">
        <h2>Berechnungsergebnis</h2>

        <div class="dp-result-value">
          <strong>${this.formatNumber(total, 1)} Pa</strong>
          <span>Gesamtdruckverlust</span>
        </div>
      </section>
    `;
  }

  renderCalculationBreakdown(calculation) {
    const results = calculation?.results || [];

    if (!results.length) return '';

    const totals = calculation?.totals || {};
    const frictionLoss = Number(totals.friction ?? 0);
    const zetaLoss = Number(totals.zetaLoss ?? results.reduce((sum, item) => sum + Number(item?.result?.zetaLoss ?? 0), 0));
    const directLoss = Number(totals.directFormPartLoss ?? results.reduce((sum, item) => sum + Number(item?.result?.directFormPartLoss ?? 0), 0));
    const specialLoss = Number(totals.special ?? 0);
    const totalLoss = Number(totals.totalRounded ?? totals.total ?? 0);

    return `
      <section class="dp-result-panel">
        <h2>Aufteilung Druckverlust</h2>

        <div class="dp-result-cards">
          <div class="dp-result-card">
            <span>Reibungsverlust</span>
            <strong>${this.formatNumber(frictionLoss)} Pa</strong>
          </div>
          <div class="dp-result-card">
            <span>ζ-Verlust Formteile</span>
            <strong>${this.formatNumber(zetaLoss)} Pa</strong>
          </div>
          <div class="dp-result-card ${directLoss < 0 ? 'dp-result-card-negative' : ''}">
            <span>Direktverlust Formteile</span>
            <strong>${this.formatNumber(directLoss)} Pa</strong>
          </div>
          <div class="dp-result-card">
            <span>Sonderbauteile</span>
            <strong>${this.formatNumber(specialLoss)} Pa</strong>
          </div>
          <div class="dp-result-card dp-result-card-total">
            <span>Gesamt gerundet</span>
            <strong>${this.formatNumber(totalLoss, 1)} Pa</strong>
          </div>
        </div>
      </section>
    `;
  }

  renderCalculationAudit(calculation) {
    const results = calculation?.results || [];

    if (!results.length && !(calculation?.specialComponentResults || []).length) return '';

    const totals = calculation?.totals || {};
    const audit = totals.audit || {};
    const frictionLoss = Number(totals.friction ?? 0);
    const zetaLoss = Number(totals.zetaLoss ?? results.reduce((sum, item) => sum + Number(item?.result?.zetaLoss ?? 0), 0));
    const directLoss = Number(totals.directFormPartLoss ?? results.reduce((sum, item) => sum + Number(item?.result?.directFormPartLoss ?? 0), 0));
    const specialLoss = Number(totals.special ?? 0);
    const componentTotal = Number(audit.componentTotal ?? frictionLoss + zetaLoss + directLoss + specialLoss);
    const rawTotal = Number(audit.rawTotal ?? totals.total ?? componentTotal);
    const roundedTotal = Number(audit.roundedTotal ?? totals.totalRounded ?? rawTotal);
    const difference = Number(audit.difference ?? rawTotal - componentTotal);
    const isOk = audit.ok !== undefined ? Boolean(audit.ok) : Math.abs(difference) <= 0.05;
    const hasNegativeDirectLoss = directLoss < 0 || Number(totals.negativeDirectLoss ?? 0) < 0;

    return `
      <section class="dp-result-panel dp-audit-panel ${isOk ? 'dp-audit-ok' : 'dp-audit-warning'}">
        <div class="dp-panel-header">
          <div>
            <h2>Berechnungsprüfung</h2>
            <p>Kontrolle, ob die Summe der Teilwerte mit dem Systemtotal übereinstimmt.</p>
          </div>
          <span class="dp-audit-badge">${isOk ? 'OK' : 'Prüfen'}</span>
        </div>

        <div class="dp-audit-grid">
          <div>
            <span>Summe aus Teilwerten</span>
            <strong>${this.formatNumber(componentTotal)} Pa</strong>
          </div>
          <div>
            <span>Systemtotal ungerundet</span>
            <strong>${this.formatNumber(rawTotal)} Pa</strong>
          </div>
          <div>
            <span>Differenz</span>
            <strong class="${!isOk ? 'dp-negative-value' : ''}">${this.formatNumber(difference, 3)} Pa</strong>
          </div>
          <div>
            <span>Systemtotal gerundet</span>
            <strong>${this.formatNumber(roundedTotal, 1)} Pa</strong>
          </div>
        </div>

        ${hasNegativeDirectLoss ? `
          <p class="dp-audit-note">Hinweis: Negative Direktverluste sind vorhanden. Das kann bei Druckrückgewinnung aus T-Abzweigen fachlich korrekt sein.</p>
        ` : ''}
      </section>
    `;
  }

  renderProjectValidationOverview(system = {}) {
    const result = this.state.project?.calculationResult || null;
    const quality = result?.quality || null;

    if (quality) {
      const errors = quality.errors || [];
      const warnings = quality.warnings || [];
      const hasProblems = errors.length || warnings.length;

      if (!hasProblems) {
        return `
          <section class="dp-result-panel dp-quality-panel dp-quality-ok">
            <div class="dp-panel-header">
              <div>
                <h2>Plausibilitätsstatus</h2>
                <p>Projektstruktur, Formteile und Berechnung sind ohne QS-Hinweis.</p>
              </div>
              <span class="dp-audit-badge">OK</span>
            </div>
          </section>
        `;
      }

      return `
        <section class="dp-result-panel dp-quality-panel ${errors.length ? 'dp-quality-error' : 'dp-quality-warning'}">
          <div class="dp-panel-header">
            <div>
              <h2>Plausibilitätsstatus</h2>
              <p>${errors.length} Fehler und ${warnings.length} Hinweis${warnings.length === 1 ? '' : 'e'} gefunden.</p>
            </div>
            <span class="dp-audit-badge">${errors.length ? 'Fehler' : 'Prüfen'}</span>
          </div>

          <div class="dp-quality-list">
            ${errors.map(error => `
              <div class="dp-quality-item dp-quality-item-error">
                <strong>Fehler</strong>
                <span>⛔ ${this.escapeHtml(error)}</span>
              </div>
            `).join('')}
            ${warnings.map(warning => `
              <div class="dp-quality-item">
                <strong>Hinweis</strong>
                <span>⚠ ${this.escapeHtml(warning)}</span>
              </div>
            `).join('')}
          </div>
        </section>
      `;
    }

    const sections = system?.sections || [];
    const formParts = system?.formParts || [];

    const sectionItems = sections
      .map(section => ({
        type: 'Teilstrecke',
        name: section?.name ?? section?.ts ?? section?.id ?? 'Teilstrecke',
        warnings: this.getSectionValidationWarnings(section),
      }))
      .filter(item => item.warnings.length);

    const formPartItems = formParts
      .map(formPart => ({
        type: 'Formteil',
        name: formPart?.name ?? this.getRegistryEntry(formPart)?.name ?? formPart?.type ?? 'Formteil',
        warnings: this.getFormPartValidationWarnings(formPart),
      }))
      .filter(item => item.warnings.length);

    const items = [...sectionItems, ...formPartItems];
    const warningCount = items.reduce((sum, item) => sum + item.warnings.length, 0);

    if (!items.length) {
      return `
        <section class="dp-result-panel dp-quality-panel dp-quality-ok">
          <div class="dp-panel-header">
            <div>
              <h2>Plausibilitätsstatus</h2>
              <p>Alle aktuell sichtbaren Teilstrecken und Formteile sind ohne Plausibilitätswarnung.</p>
            </div>
            <span class="dp-audit-badge">OK</span>
          </div>
        </section>
      `;
    }

    return `
      <section class="dp-result-panel dp-quality-panel dp-quality-warning">
        <div class="dp-panel-header">
          <div>
            <h2>Plausibilitätsstatus</h2>
            <p>${warningCount} Hinweis${warningCount === 1 ? '' : 'e'} in ${items.length} Element${items.length === 1 ? '' : 'en'} gefunden.</p>
          </div>
          <span class="dp-audit-badge">Prüfen</span>
        </div>

        <div class="dp-quality-list">
          ${items.map(item => `
            <div class="dp-quality-item">
              <strong>${this.escapeHtml(item.type)}: ${this.escapeHtml(item.name)}</strong>
              ${item.warnings.map(warning => `<span>⚠ ${this.escapeHtml(warning)}</span>`).join('')}
            </div>
          `).join('')}
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

        <table class="dp-table dp-calculation-table">
          <thead>
            <tr>
              <th>Teilstrecke</th>
              <th>Luftmenge</th>
              <th>Geschwindigkeit</th>
              <th>Reibung</th>
              <th>ζ-Verlust</th>
              <th>Direktverlust</th>
              <th>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(item => {
              const result = item.result || {};
              const input = item.input || {};
              const sectionId = input.id || item.id;

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

              const directLoss = Number(result.directFormPartLoss ?? item.directFormPartLoss ?? 0);
              const pressureLoss =
                result.roundedTotalLoss ??
                result.totalLoss ??
                result.totalPressureLoss ??
                result.pressureLoss ??
                result.dp;

              const assignedDetails = this.renderAssignedFormPartsCompact(sectionId, result);

              return `
                <tr>
                  <td><strong>${this.escapeHtml(name)}</strong></td>
                  <td>${this.formatAirflow(volumeFlow)} m³/h</td>
                  <td>${this.formatNumber(result.velocity)} m/s</td>
                  <td>${this.formatNumber(result.frictionLoss)} Pa</td>
                  <td>${this.formatNumber(result.zetaLoss)} Pa</td>
                  <td class="${directLoss < 0 ? 'dp-negative-value' : ''}">${this.formatNumber(directLoss)} Pa</td>
                  <td><strong>${this.formatNumber(pressureLoss)} Pa</strong></td>
                </tr>
                ${assignedDetails ? `
                  <tr class="dp-detail-row">
                    <td colspan="7">${assignedDetails}</td>
                  </tr>
                ` : ''}
              `;
            }).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  renderSectionFormParts(section = {}) {
    const formParts = this.getAssignedFormParts(section?.id);

    if (!formParts.length) return '';

    const calculationItem = this.getCalculationItemBySectionId(section?.id);

    return `
      <section class="dp-result-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Zugeordnete Formteile</h2>
            <p>Diese Formteile fliessen in die Berechnung dieser Teilstrecke ein.</p>
          </div>
        </div>

        ${this.renderAssignedFormPartsCompact(section?.id, calculationItem?.result || null)}
      </section>
    `;
  }

  renderAssignedFormPartsCompact(sectionId, sectionResult = null) {
    const formParts = this.getAssignedFormParts(sectionId);

    if (!formParts.length) return '';

    return `
      <div class="dp-assigned-formparts">
        ${formParts.map(part => this.renderAssignedFormPartItem(part, sectionResult)).join('')}
      </div>
    `;
  }

  renderAssignedFormPartItem(formPart = {}, sectionResult = null) {
    const entry = this.getRegistryEntry(formPart);
    const calculation = formPart?.calculationResult?.calculation || {};
    const isDirectLoss = formPart.lossMode === 'direct' || calculation.lossMode === 'direct';
    const zeta = Number(formPart?.zeta ?? formPart?.calculationResult?.zeta ?? 0);
    const dynamicPressure = isDirectLoss
      ? Number(calculation.dynamicPressurePa ?? 0)
      : Number(sectionResult?.dynamicPressure ?? 0);
    const pressureLoss = isDirectLoss
      ? Number(formPart.pressureLossPa ?? calculation.pressureLossPa ?? 0)
      : zeta * dynamicPressure;
    const reference = isDirectLoss && calculation.pressureReference
      ? `bezogen auf ${calculation.pressureReference}`
      : 'bezogen auf Teilstrecke';

    return `
      <div class="dp-assigned-formpart-item">
        <div>
          <strong>${this.escapeHtml(formPart?.name ?? entry?.name ?? 'Formteil')}</strong>
          <span>${this.escapeHtml(entry?.category ?? formPart?.type ?? 'Formteil')}</span>
        </div>
        <div>
          <small>ζ</small>
          <strong>${this.formatNumber(zeta, 3)}</strong>
        </div>
        <div>
          <small>Druckverlust</small>
          <strong class="${pressureLoss < 0 ? 'dp-negative-value' : ''}">${this.formatNumber(pressureLoss)} Pa</strong>
        </div>
        <em>${this.escapeHtml(reference)}</em>
      </div>
    `;
  }

  getAssignedFormParts(sectionId) {
    if (!sectionId) return [];

    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const formParts = system?.formParts || [];

    return formParts.filter(part =>
      part?.sectionId === sectionId ||
      part?.rowId === sectionId ||
      part?.targetSectionId === sectionId
    );
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

  renderSectionResult(result, item, section = null) {
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
            ${result.directFormPartLoss ? `
              <tr>
                <th>Formteil-Direktverlust</th>
                <td>${this.formatNumber(result.directFormPartLoss)} Pa</td>
              </tr>
            ` : ''}
            <tr>
              <th>Gesamt</th>
              <td><strong>${this.formatNumber(result.roundedTotalLoss ?? result.totalLoss)} Pa</strong></td>
            </tr>
          </tbody>
        </table>

        ${this.renderValidationMessages(result?.warnings || [])}
      </section>
    `;
  }

  renderValidationMessages(warnings = []) {
    const uniqueWarnings = [...new Set((warnings || [])
      .map(warning => String(warning || '').trim())
      .filter(Boolean))];

    if (!uniqueWarnings.length) return '';

    return `
      <div class="dp-validation-panel">
        <strong>Bitte Eingaben prüfen</strong>
        ${uniqueWarnings.map(warning => `<p>⚠ ${this.escapeHtml(warning)}</p>`).join('')}
      </div>
    `;
  }

  getSectionValidationWarnings(section = {}) {
    if (!section) return [];

    const warnings = [];
    const q = Number(section.q ?? section.volumeFlow ?? section.airVolume ?? 0);
    const length = Number(section.l ?? section.length ?? 0);

    if (!Number.isFinite(q) || q <= 0) {
      warnings.push('Luftmenge der Teilstrecke fehlt oder ist 0 m³/h.');
    }

    if (!Number.isFinite(length) || length < 0) {
      warnings.push('Länge der Teilstrecke darf nicht negativ sein.');
    }

    if (this.isPipeSection(section)) {
      const diameter = Number(section.d ?? section.diameter ?? 0);
      if (!Number.isFinite(diameter) || diameter <= 0) {
        warnings.push('Durchmesser der Rundrohr-Teilstrecke fehlt oder ist 0 m.');
      }
    } else {
      const width = Number(section.b ?? section.width ?? 0);
      const height = Number(section.h ?? section.height ?? 0);

      if (!Number.isFinite(width) || width <= 0) {
        warnings.push('Breite der Rechteckkanal-Teilstrecke fehlt oder ist 0 m.');
      }

      if (!Number.isFinite(height) || height <= 0) {
        warnings.push('Höhe der Rechteckkanal-Teilstrecke fehlt oder ist 0 m.');
      }
    }

    return warnings;
  }

  getFormPartValidationWarnings(formPart = {}) {
    if (!formPart) return [];

    const warnings = [];
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const sections = system?.sections || [];
    const sectionValid = formPart.sectionId && sections.some(section => section.id === formPart.sectionId);

    if (!sectionValid) {
      warnings.push('Dem Formteil ist noch keine gültige Teilstrecke zugewiesen.');
    }

    const entry = this.getRegistryEntry(formPart);

    if (!entry) {
      warnings.push('Formteiltyp ist nicht in der Bibliothek vorhanden.');
      return warnings;
    }

    const visibleParameters = (entry.parameters || []).filter(parameter => this.isFormPartParameterVisible(formPart, parameter));

    visibleParameters.forEach(parameter => {
      if (parameter.readOnly || parameter.derived) return;

      const value = formPart?.[parameter.id];
      const label = parameter.label || parameter.id;

      if (parameter.type === 'number') {
        const number = Number(value);

        if (!Number.isFinite(number)) {
          warnings.push(`${label} ist keine gültige Zahl.`);
          return;
        }

        const min = parameter.min !== undefined ? Number(parameter.min) : null;
        const max = parameter.max !== undefined ? Number(parameter.max) : null;

        if (min !== null && Number.isFinite(min) && number < min) {
          warnings.push(`${label} muss mindestens ${min} sein.`);
        }

        if (max !== null && Number.isFinite(max) && number > max) {
          warnings.push(`${label} darf maximal ${max} sein.`);
        }

        if ((parameter.unit === 'mm' || /\[mm\]/i.test(label)) && number <= 0) {
          warnings.push(`${label} fehlt oder ist 0 mm.`);
        }

        if ((parameter.unit === 'm³/h' || /Luftmenge/i.test(label)) && number < 0) {
          warnings.push(`${label} darf nicht negativ sein.`);
        }
      }
    });

    this.addFormPartRelationWarnings(formPart, warnings);

    return warnings;
  }

  addFormPartRelationWarnings(formPart = {}, warnings = []) {
    const type = String(formPart?.type || '');
    const W = Number(formPart?.W ?? 0);
    const WA = Number(formPart?.WA ?? 0);
    const WD = Number(formPart?.WD ?? 0);
    const w = Number(formPart?.w ?? 0);
    const wA = Number(formPart?.wA ?? 0);

    if ([
      'hosenstueck',
      'sattelstueck_mit_einstroemkonus',
      't_stueck_90',
      't_stueck_90_2',
      't_abzweig_durchgang_rund1',
      't_abzweig_durchgang_rund2',
      't_abzweig_rund1',
      't_abzweig_rund2',
    ].includes(type)) {
      if (W <= 0) warnings.push('Hauptluftmenge W fehlt oder ist 0 m³/h.');
      if (WA < 0) warnings.push('Abzweigluftmenge WA darf nicht negativ sein.');
      if (WA > W && W > 0) warnings.push('Abzweigluftmenge WA ist grösser als Hauptluftmenge W. Bitte Strömungsaufteilung prüfen.');
      if (w <= 0 && W > 0) warnings.push('Hauptgeschwindigkeit w konnte nicht berechnet werden. Bitte Hauptanschluss-Grösse prüfen.');
      if (wA <= 0 && WA > 0) warnings.push('Abzweiggeschwindigkeit wA konnte nicht berechnet werden. Bitte Abzweig-Grösse prüfen.');
    }

    if (type.startsWith('t_abzweig') && W > 0 && WA > 0 && WD > 0) {
      const balance = Math.abs(W - (WA + WD));
      if (balance > Math.max(1, W * 0.02)) {
        warnings.push('Bei diesem T-Abzweig sollte W ungefähr WA + WD entsprechen. Bitte Luftmengen prüfen.');
      }
    }

    if (type === 'uebergang_gross_klein' || type === 'uebergang_klein_gross') {
      const A1 = Number(formPart?.A1 ?? 0);
      const A2 = Number(formPart?.A2 ?? 0);

      if (A1 <= 0) warnings.push('Kleiner Querschnitt A1 konnte nicht berechnet werden. Bitte Anschlussgrösse prüfen.');
      if (A2 <= 0) warnings.push('Grosser Querschnitt A2 konnte nicht berechnet werden. Bitte Anschlussgrösse prüfen.');
      if (A1 > A2 && A2 > 0) warnings.push('A1 ist grösser als A2. Für die Übergangstabellen muss A1 der kleinere Querschnitt sein.');
    }

    return warnings;
  }

  renderDirtyHint() {
    if (!this.state.isCalculationDirty) return '';

    return `
      <div class="dp-dirty-hint">
        ● Automatische Berechnung konnte nicht vollständig aktualisiert werden – bitte Eingaben prüfen
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