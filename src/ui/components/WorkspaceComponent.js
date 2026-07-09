// Druckverlust Pro – WorkspaceComponent
// Zeigt den Arbeitsbereich passend zur aktuellen Auswahl.

import ProjectCalculationService from '../../project/ProjectCalculationService.js';
import { calculateSection } from '../../core/CalculationEngine.js';
import { createDefaultFormPartRegistry } from '../../formteile/FormPartRegistry.js';
import ProjectCommands from '../../app/ProjectCommands.js';
<<<<<<< HEAD
import ReportEngine from '../../report/ReportEngine.js?v=18.20a';
=======
import ReportEngine from '../../report/ReportEngine.js?v=18.18';
>>>>>>> 3878efa18540cddce73e78696fad3fd1d4470a0d
import ProjectDiagnostics from '../../diagnostics/ProjectDiagnostics.js';
import DeploymentDiagnostics from '../../diagnostics/DeploymentDiagnostics.js';
import { APP_RELEASE } from '../../core/appVersion.js';

export default class WorkspaceComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('WorkspaceComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;
    this.registry = createDefaultFormPartRegistry();
    this.commands = new ProjectCommands(state);
    this.formPartLibrarySearch = '';
    this.formPartLibraryCategory = 'all';
    this.specialLibrarySearch = '';
    this.specialLibraryCategory = 'all';
    this.libraryRecent = this.loadLibraryRecent();
    this.libraryFavorites = this.loadLibraryFavorites();

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
    if (selection.type === 'report') return this.renderReport();
    if (selection.type === 'deploymentCheck') return this.renderDeploymentCheck(selection.data || this.state.deploymentCheck);
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

  renderWorkflowDashboard(project = null, system = null, context = 'system') {
    if (!project || !system) return '';

    const sections = system?.sections || [];
    const formParts = system?.formParts || [];
    const specialComponents = system?.specialComponents || [];
    const calculation = project?.calculationResult?.calculation || null;
    const totals = calculation?.totals || {};
    const total = totals.totalRounded ?? totals.total ?? null;
    const quality = project?.calculationResult?.quality || null;
    const errorCount = quality?.errors?.length || 0;
    const warningCount = quality?.warnings?.length || 0;
    const qsLabel = errorCount ? 'Fehler' : warningCount ? 'Prüfen' : calculation ? 'OK' : 'Offen';
    const qsClass = errorCount ? 'error' : warningCount ? 'warning' : calculation ? 'ok' : 'idle';
    const lastCalculation = this.state.lastCalculationAt
      ? new Date(this.state.lastCalculationAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })
      : 'noch nicht berechnet';
    const relevantSections = sections.filter(section => this.isSectionRelevant(section)).length;
    const specialLoss = specialComponents.reduce((sum, component) => sum + Number(component?.pressureLoss ?? 0), 0);
    const nextSteps = this.getWorkflowNextSteps({ sections, formParts, specialComponents, calculation, errorCount, warningCount });

    return `
      <section class="dp-workflow-dashboard ${context === 'project' ? 'project' : 'system'}">
        <div class="dp-workflow-head">
          <div>
            <span class="dp-overline">Arbeitsdashboard</span>
            <h2>${context === 'project' ? 'Projektfortschritt' : 'Anlagenfortschritt'}</h2>
            <p>Schnellübersicht für Eingabe, Berechnung, Kontrolle und Bericht.</p>
          </div>
          <span class="dp-workflow-status ${this.escapeAttribute(qsClass)}">QS ${this.escapeHtml(qsLabel)}</span>
        </div>

        <div class="dp-workflow-grid">
          <div class="dp-workflow-kpi">
            <span>Gesamt</span>
            <strong>${total === null ? '-' : `${this.formatNumber(total, 1)} Pa`}</strong>
            <em>aktueller Druckverlust</em>
          </div>
          <div class="dp-workflow-kpi">
            <span>Teilstrecken</span>
            <strong>${relevantSections}/${sections.length}</strong>
            <em>berechnungsrelevant / total</em>
          </div>
          <div class="dp-workflow-kpi">
            <span>Formteile</span>
            <strong>${formParts.length}</strong>
            <em>zugeordnet oder offen</em>
          </div>
          <div class="dp-workflow-kpi">
            <span>Sonderbauteile</span>
            <strong>${this.formatNumber(specialLoss, 1)} Pa</strong>
            <em>${specialComponents.length} Komponente${specialComponents.length === 1 ? '' : 'n'}</em>
          </div>
        </div>

        <div class="dp-workflow-actions">
          <button type="button" data-workflow-action="add-section">+ Teilstrecke</button>
          <button type="button" data-workflow-action="add-formpart">+ Formteil</button>
          <button type="button" data-workflow-action="add-special">+ Sonderbauteil</button>
          <button type="button" data-workflow-action="open-report">Bericht öffnen</button>
        </div>

        <div class="dp-workflow-bottom">
          <div class="dp-workflow-next">
            <h3>Nächste Schritte</h3>
            <ul>
              ${nextSteps.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}
            </ul>
          </div>
          <div class="dp-workflow-meta">
            <span>Letzte Berechnung</span>
            <strong>${this.escapeHtml(lastCalculation)}</strong>
            <span>Berichtsumfang</span>
            <strong>${this.getReportOptionSummary(project)}</strong>
          </div>
        </div>
      </section>
    `;
  }

  renderProjectCheckPanel(project = null, system = null) {
    const check = ProjectDiagnostics.create(project, { system });
    const visibleItems = check.items.filter(item => item.status !== 'ok').slice(0, 8);
    const okCount = check.counts?.ok ?? 0;
    const hasProblems = visibleItems.length > 0;

    return `
      <section class="dp-editor-panel dp-project-check-panel dp-project-check-${this.escapeAttribute(check.status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Projektcheck</span>
            <h2>Abgabe- und Plausibilitätscheck</h2>
            <p>${this.escapeHtml(check.summary)}</p>
          </div>
          <span class="dp-project-check-badge ${this.escapeAttribute(check.status)}">${this.escapeHtml(check.label)}</span>
        </div>

        <div class="dp-project-check-stats">
          <div>
            <span>Fehler</span>
            <strong>${this.escapeHtml(check.counts.error)}</strong>
          </div>
          <div>
            <span>Hinweise</span>
            <strong>${this.escapeHtml(check.counts.warning)}</strong>
          </div>
          <div>
            <span>OK-Punkte</span>
            <strong>${this.escapeHtml(okCount)}</strong>
          </div>
        </div>

        ${hasProblems ? `
          <div class="dp-project-check-list">
            ${visibleItems.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-project-check-ready">
            <strong>Alles sauber.</strong>
            <span>Der aktuelle Stand ist bereit für Bericht, Export und Speicherung.</span>
          </div>
        `}

        <div class="dp-project-check-actions">
          <button type="button" data-project-check-action="recalculate">Neu prüfen</button>
          <button type="button" data-project-check-action="project">Projektangaben</button>
          <button type="button" data-project-check-action="report">Bericht öffnen</button>
        </div>
      </section>
    `;
  }

  bindProjectCheckPanel(project = null, system = null) {
    this.root.querySelectorAll('[data-project-check-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.projectCheckAction;

        if (action === 'recalculate') {
          this.autoCalculateProject();
          return;
        }

        if (action === 'project') {
          this.state.setSelection?.('project', project || this.state.project);
          this.state.notify?.();
          return;
        }

        if (action === 'report') {
          if (typeof this.state.selectReport === 'function') {
            this.state.selectReport(system || this.state.selectedSystem || project || this.state.project);
          } else {
            this.state.setSelection?.('report', system || this.state.selectedSystem || project || this.state.project);
            this.state.notify?.();
          }
        }
      });
    });
  }

  getWorkflowNextSteps({ sections = [], formParts = [], specialComponents = [], calculation = null, errorCount = 0, warningCount = 0 } = {}) {
    const steps = [];

    if (!sections.length) steps.push('Erste Teilstrecke erfassen.');
    if (sections.length && !sections.some(section => this.isSectionRelevant(section))) steps.push('Mindestens eine Teilstrecke mit Luftmenge und Geometrie vollständig ausfüllen.');
    if (sections.length && !formParts.length) steps.push('Formteile über die Kachelbibliothek ergänzen.');
    if (!specialComponents.length) steps.push('Sonderbauteile wie Filter, Schalldämpfer oder BSK ergänzen.');
    if (!calculation) steps.push('Eingaben prüfen – die automatische Berechnung erstellt danach den aktuellen Anlagenwert.');
    if (errorCount) steps.push(`${errorCount} QS-Fehler beheben, bevor der Bericht freigegeben wird.`);
    if (!errorCount && warningCount) steps.push(`${warningCount} QS-Hinweis${warningCount === 1 ? '' : 'e'} prüfen.`);

    if (!steps.length) steps.push('Projekt ist bereit für Bericht / Export.');
    return steps.slice(0, 4);
  }

  isSectionRelevant(section = {}) {
    const q = Number(section.q ?? section.volumeFlow ?? section.airVolume ?? 0);
    const l = Number(section.l ?? section.length ?? 0);
    const b = Number(section.b ?? section.width ?? 0);
    const h = Number(section.h ?? section.height ?? 0);
    const d = Number(section.d ?? section.diameter ?? 0);
    const isPipe = this.isPipeSection(section);

    return q > 0 && (l > 0 || section.formParts?.length) && (isPipe ? d > 0 : b > 0 && h > 0);
  }

  getReportOptionSummary(project = null) {
    const options = project?.reportOptions || {};
    const keys = Object.keys(options);

    if (!keys.length) return 'Standardumfang';

    const active = keys.filter(key => options[key] !== false).length;
    return `${active}/${keys.length} Bereiche aktiv`;
  }

  bindWorkflowDashboard(project = null, system = null) {
    this.root.querySelectorAll('[data-workflow-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.workflowAction;
        const activeSystem = system || this.state.selectedSystem || project?.systems?.[0] || null;

        if (action === 'add-section') {
          this.commands.addSection();
          return;
        }

        if (action === 'add-formpart') {
          if (typeof this.state.selectFormPartPicker === 'function') {
            this.state.selectFormPartPicker(activeSystem);
          } else {
            this.state.setSelection?.('formPartPicker', activeSystem);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'add-special') {
          if (typeof this.commands.addSpecialComponent === 'function') {
            this.commands.addSpecialComponent('freie_komponente');
          }
          return;
        }

        if (action === 'open-report') {
          this.state.setSelection?.('report', project || this.state.project);
          this.state.notify?.();
        }
      });
    });
  }

  renderProject(project) {
    const meta = this.ensureProjectMeta(project);
    const systems = project?.systems || [];
    const activeSystem = this.state.selectedSystem || systems[0] || null;
    const sections = activeSystem?.sections || [];
    const formParts = activeSystem?.formParts || [];
    const specialComponents = activeSystem?.specialComponents || [];

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>${this.escapeHtml(meta.object || meta.name || 'Projekt')}</h1>
          <p>Projektangaben und Grunddaten für Berechnung, Speicherung und Bericht.</p>
        </div>
      </div>

      ${this.renderWorkflowDashboard(project, activeSystem, 'project')}
      ${this.renderProjectCheckPanel(project, activeSystem)}

      <section class="dp-editor-panel dp-project-meta-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Projektangaben</h2>
            <p>Diese Angaben werden zentral gespeichert und für Bericht, Export und Dateinamen verwendet.</p>
          </div>
          <span class="dp-chip">Phase 18</span>
        </div>

        <div class="dp-editor-grid dp-project-meta-grid">
          <label>
            <span>Projektnummer</span>
            <input data-project-field="name" value="${this.escapeAttribute(meta.name)}">
          </label>

          <label>
            <span>Projektname</span>
            <input data-project-field="object" value="${this.escapeAttribute(meta.object)}">
          </label>

          <label>
            <span>BKP-Nummer</span>
            <input data-project-field="anlageNumber" value="${this.escapeAttribute(meta.anlageNumber)}">
          </label>

          <label>
            <span>Anlage</span>
            <input data-project-field="anlage" value="${this.escapeAttribute(meta.anlage)}">
          </label>

          <label>
            <span>Bearbeiter</span>
            <input data-project-field="bearbeiter" value="${this.escapeAttribute(meta.bearbeiter)}">
          </label>

          <label>
            <span>Firma</span>
            <input data-project-field="company" value="${this.escapeAttribute(meta.company)}">
          </label>

          <label class="dp-project-meta-wide">
            <span>Adresse / Standort</span>
            <input data-project-field="address" value="${this.escapeAttribute(meta.address)}">
          </label>

          <label class="dp-project-meta-wide">
            <span>Bemerkungen</span>
            <textarea data-project-field="note" rows="3">${this.escapeHtml(meta.note)}</textarea>
          </label>
        </div>

        <p class="dp-auto-save-hint">Änderungen werden automatisch im Projekt und Bericht übernommen.</p>
      </section>

      <section class="dp-result-panel">
        <h2>Projektstatus</h2>
        <div class="dp-result-cards">
          <div class="dp-result-card">
            <span>Anlagen</span>
            <strong>${systems.length}</strong>
          </div>
          <div class="dp-result-card">
            <span>Teilstrecken</span>
            <strong>${sections.length}</strong>
          </div>
          <div class="dp-result-card">
            <span>Formteile</span>
            <strong>${formParts.length}</strong>
          </div>
          <div class="dp-result-card">
            <span>Sonderbauteile</span>
            <strong>${specialComponents.length}</strong>
          </div>
        </div>
      </section>
    `;

    this.bindProjectMetaEditor(project, activeSystem);
    this.bindWorkflowDashboard(project, activeSystem);
    this.bindProjectCheckPanel(project, activeSystem);
  }

  ensureProjectMeta(project = null, system = null) {
    if (!project) return {};

    const activeSystem = system || this.state.selectedSystem || project?.systems?.[0] || null;
    const report = project.report && typeof project.report === 'object' ? project.report : {};
    project.report = report;

    const meta = project.meta && typeof project.meta === 'object' ? project.meta : {};
    project.meta = meta;

    meta.name = meta.name ?? project.name ?? project.title ?? project.projectName ?? 'Unbenanntes Projekt';
    meta.object = meta.object ?? project.object ?? project.objekt ?? report.object ?? '';
    meta.anlage = meta.anlage ?? activeSystem?.name ?? project.anlage ?? report.anlage ?? 'Anlage';
    meta.anlageNumber = meta.anlageNumber ?? project.anlageNumber ?? project.systemNumber ?? report.anlageNumber ?? '';
    meta.bearbeiter = meta.bearbeiter ?? project.author ?? project.bearbeiter ?? report.bearbeiter ?? '';
    meta.company = meta.company ?? project.company ?? project.firma ?? report.company ?? '';
    meta.address = meta.address ?? project.address ?? project.adresse ?? report.address ?? '';
    meta.note = meta.note ?? project.note ?? report.hinweis ?? '';

    project.name = meta.name || 'Unbenanntes Projekt';
    project.object = meta.object;
    project.anlageNumber = meta.anlageNumber;
    project.author = meta.bearbeiter;
    project.company = meta.company;
    project.address = meta.address;
    project.note = meta.note;

    if (activeSystem && meta.anlage) {
      activeSystem.name = meta.anlage;
    }

    report.project = report.project ?? meta.name;
    report.object = report.object ?? meta.object;
    report.anlage = report.anlage ?? meta.anlage;
    report.bearbeiter = report.bearbeiter ?? meta.bearbeiter;
    report.company = report.company ?? meta.company;
    report.address = report.address ?? meta.address;
    report.anlageNumber = report.anlageNumber ?? meta.anlageNumber;
    report.hinweis = report.hinweis ?? meta.note;

    return meta;
  }

  bindProjectMetaEditor(project = null, system = null) {
    if (!project) return;

    this.root.querySelectorAll('[data-project-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.projectField;
        const value = input.value;
        const meta = this.ensureProjectMeta(project, system);

        meta[field] = value;

        if (field === 'name') {
          project.name = value || 'Unbenanntes Projekt';
          project.report.project = project.name;
        }

        if (field === 'object') {
          project.object = value;
          project.report.object = value;
        }

        if (field === 'anlage') {
          project.anlage = value;
          project.report.anlage = value;
          if (system) system.name = value || 'Anlage';
        }

        if (field === 'anlageNumber') {
          project.anlageNumber = value;
          project.report.anlageNumber = value;
        }

        if (field === 'bearbeiter') {
          project.author = value;
          project.report.bearbeiter = value;
        }

        if (field === 'company') {
          project.company = value;
          project.report.company = value;
        }

        if (field === 'address') {
          project.address = value;
          project.report.address = value;
        }

        if (field === 'note') {
          project.note = value;
          project.report.hinweis = value;
        }

        this.state.markProjectDirty();
        this.render();
      });
    });
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

      ${this.renderWorkflowDashboard(this.state.project, system, 'system')}
      ${this.renderProjectCheckPanel(this.state.project, system)}

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

      ${this.renderSectionManagement(system)}
      ${this.renderFormPartManagement(system)}
      ${this.renderSpecialComponentManagement(system)}
      ${this.renderCalculationSummary(total)}
      ${this.renderCalculationBreakdown(calculation)}
      ${this.renderCalculationAudit(calculation)}
      ${this.renderProjectValidationOverview(system)}
      ${this.renderCalculationTable(calculation)}
    `;

    this.bindWorkflowDashboard(this.state.project, system);
    this.bindProjectCheckPanel(this.state.project, system);
    this.bindSectionManagement();
    this.bindFormPartManagement();
    this.bindSpecialComponentManagement();
  }

  renderSection(section) {
    const calculationItem = this.getCalculationItemBySectionId(section?.id);
    const result = calculationItem?.result || null;
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const sections = system?.sections || [];
    const index = sections.findIndex(item => item.id === section?.id);

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>${this.escapeHtml(section?.name ?? 'Teilstrecke')}</h1>
          <p>Teilstrecke bearbeiten, duplizieren, löschen oder innerhalb der Anlage verschieben.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-section-action="duplicate" data-section-id="${this.escapeAttribute(section?.id)}">Duplizieren</button>
          <button type="button" data-section-action="up" data-section-id="${this.escapeAttribute(section?.id)}" ${index <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-section-action="down" data-section-id="${this.escapeAttribute(section?.id)}" ${index < 0 || index >= sections.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="danger" data-section-action="delete" data-section-id="${this.escapeAttribute(section?.id)}">Löschen</button>
        </div>
      </div>
      ${this.renderDirtyHint()}
      ${this.renderValidationMessages(this.getSectionValidationWarnings(section))}

      <section class="dp-editor-panel">
        <h2>Eingabedaten</h2>

        <div class="dp-editor-grid">
          <label>
            <span>Name / Nummer</span>
            <input data-field="name" value="${this.escapeAttribute(section?.name ?? '')}">
          </label>

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

          <label class="dp-project-meta-wide">
            <span>Beschreibung / Hinweis</span>
            <input data-field="description" value="${this.escapeAttribute(section?.description ?? section?.note ?? '')}">
          </label>
        </div>

        <p class="dp-auto-calc-note">Änderungen werden automatisch übernommen und berechnet.</p>
      </section>

      ${this.renderSectionResult(result, calculationItem, section)}
      ${this.renderSectionFormParts(section)}
    `;

    this.bindSectionEditor(section);
    this.bindSectionManagement();
  }

  bindSectionEditor(section) {
    this.root.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;

        section[field] = input.type === 'number'
          ? Number(input.value)
          : input.value;

        if (field === 'description') {
          section.note = input.value;
        }

        this.autoCalculateProject();
      });
    });
  }

  renderSectionManagement(system = {}) {
    const sections = system?.sections || [];

    return `
      <section class="dp-editor-panel dp-section-management-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Teilstreckenverwaltung</h2>
            <p>Teilstrecken duplizieren, löschen, sortieren und automatisch nummerieren.</p>
          </div>
          <div class="dp-panel-actions">
            <button type="button" data-section-action="add">+ Teilstrecke</button>
            <button type="button" data-section-action="renumber">TS neu nummerieren</button>
          </div>
        </div>

        ${sections.length ? `
          <div class="dp-section-list">
            ${sections.map((section, index) => this.renderSectionManagementRow(section, index, sections.length)).join('')}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch keine Teilstrecke vorhanden. Lege oben eine erste Teilstrecke an.
          </div>
        `}
      </section>
    `;
  }

  renderSectionManagementRow(section = {}, index = 0, total = 0) {
    const calculationItem = this.getCalculationItemBySectionId(section?.id);
    const result = calculationItem?.result || null;
    const typeLabel = this.isPipeSection(section) ? 'Rundrohr' : 'Rechteckkanal';
    const q = section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0;
    const totalLoss = result?.roundedTotalLoss ?? result?.totalLoss ?? null;

    return `
      <div class="dp-section-row ${this.state.isSelected('section', section?.id) ? 'active' : ''}">
        <button type="button" class="dp-section-row-main" data-section-action="select" data-section-id="${this.escapeAttribute(section?.id)}">
          <strong>${this.escapeHtml(section?.name ?? section?.id ?? `TS ${index + 1}`)}</strong>
          <span>${this.escapeHtml(typeLabel)} · ${this.formatAirflow(q)} m³/h${totalLoss !== null ? ` · ${this.formatNumber(totalLoss)} Pa` : ''}</span>
        </button>
        <div class="dp-section-row-actions">
          <button type="button" data-section-action="up" data-section-id="${this.escapeAttribute(section?.id)}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-section-action="down" data-section-id="${this.escapeAttribute(section?.id)}" ${index === total - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-section-action="duplicate" data-section-id="${this.escapeAttribute(section?.id)}">Duplizieren</button>
          <button type="button" class="danger" data-section-action="delete" data-section-id="${this.escapeAttribute(section?.id)}">Löschen</button>
        </div>
      </div>
    `;
  }

  bindSectionManagement() {
    this.root.querySelectorAll('[data-section-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.sectionAction;
        const sectionId = button.dataset.sectionId;
        const system = this.state.selectedSystem || this.state.project?.systems?.[0];

        try {
          if (action === 'add') {
            this.commands.addSection();
            this.autoCalculateProject();
            return;
          }

          if (action === 'select') {
            const section = system?.sections?.find(item => item.id === sectionId);
            if (section) this.state.selectSection(section);
            return;
          }

          if (action === 'duplicate') {
            this.commands.duplicateSection(sectionId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'delete') {
            const section = system?.sections?.find(item => item.id === sectionId);
            const name = section?.name || 'diese Teilstrecke';
            if (!confirm(`Teilstrecke „${name}“ wirklich löschen? Zugeordnete Formteile werden der nächsten verfügbaren Teilstrecke zugewiesen.`)) return;
            this.commands.deleteSection(sectionId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'up' || action === 'down') {
            this.commands.moveSection(sectionId, action === 'up' ? -1 : 1);
            this.autoCalculateProject();
            return;
          }

          if (action === 'renumber') {
            if (!confirm('Alle Teilstrecken neu als ts1, ts2, ts3 ... nummerieren? Manuelle Namen werden überschrieben.')) return;
            this.commands.renumberSections({ force: true });
            this.autoCalculateProject();
          }
        } catch (error) {
          alert(error.message);
        }
      });
    });
  }


  renderFormPartManagement(system = {}) {
    const formParts = system?.formParts || [];
    const sections = system?.sections || [];

    return `
      <section class="dp-editor-panel dp-formpart-management-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Formteilverwaltung</h2>
            <p>Formteile duplizieren, löschen, sortieren und einer Teilstrecke zuweisen.</p>
          </div>
          <div class="dp-panel-actions">
            <button type="button" data-formpart-action="add">+ Formteil</button>
            <button type="button" data-formpart-action="renumber" ${formParts.length ? '' : 'disabled'}>Formteile neu nummerieren</button>
          </div>
        </div>

        ${formParts.length ? `
          <div class="dp-formpart-management-groups">
            ${this.renderFormPartManagementGroups(formParts, sections)}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch kein Formteil vorhanden. Über „+ Formteil“ öffnest du die Formteilbibliothek.
          </div>
        `}
      </section>
    `;
  }

  renderFormPartManagementGroups(formParts = [], sections = []) {
    const groups = [];
    const assignedSectionIds = new Set(sections.map(section => section.id));

    sections.forEach(section => {
      const parts = formParts.filter(part => part?.sectionId === section.id);
      if (parts.length) {
        groups.push({
          id: section.id,
          title: section.name || section.id || 'Teilstrecke',
          subtitle: `${parts.length} Formteil${parts.length === 1 ? '' : 'e'}`,
          parts,
        });
      }
    });

    const unassigned = formParts.filter(part => !part?.sectionId || !assignedSectionIds.has(part.sectionId));
    if (unassigned.length) {
      groups.push({
        id: 'unassigned',
        title: 'Nicht zugeordnet',
        subtitle: `${unassigned.length} Formteil${unassigned.length === 1 ? '' : 'e'}`,
        parts: unassigned,
      });
    }

    if (!groups.length && formParts.length) {
      groups.push({
        id: 'all',
        title: 'Formteile',
        subtitle: `${formParts.length} Formteil${formParts.length === 1 ? '' : 'e'}`,
        parts: formParts,
      });
    }

    return groups.map(group => `
      <div class="dp-formpart-management-group">
        <div class="dp-formpart-management-heading">
          <strong>${this.escapeHtml(group.title)}</strong>
          <span>${this.escapeHtml(group.subtitle)}</span>
        </div>
        <div class="dp-formpart-list">
          ${group.parts.map(part => this.renderFormPartManagementRow(part, formParts)).join('')}
        </div>
      </div>
    `).join('');
  }

  renderFormPartManagementRow(formPart = {}, allFormParts = []) {
    const entry = this.getRegistryEntry(formPart);
    const index = allFormParts.findIndex(item => item.id === formPart?.id);
    const total = allFormParts.length;
    const pressureLoss = this.getFormPartPressureLoss(formPart);
    const sectionName = this.getSectionNameById(formPart?.sectionId);
    const category = entry?.category || formPart?.category || 'Formteil';
    const name = formPart?.name || entry?.name || formPart?.type || 'Formteil';

    return `
      <div class="dp-formpart-row ${this.state.isSelected('formPart', formPart?.id) ? 'active' : ''}">
        <button type="button" class="dp-formpart-row-main" data-formpart-action="select" data-formpart-id="${this.escapeAttribute(formPart?.id)}">
          <strong>${this.escapeHtml(name)}</strong>
          <span>${this.escapeHtml(category)} · ${this.escapeHtml(sectionName)}${pressureLoss !== null ? ` · ${this.formatNumber(pressureLoss)} Pa` : ''}</span>
        </button>
        <div class="dp-formpart-row-actions">
          <button type="button" data-formpart-action="up" data-formpart-id="${this.escapeAttribute(formPart?.id)}" ${index <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-formpart-action="down" data-formpart-id="${this.escapeAttribute(formPart?.id)}" ${index < 0 || index >= total - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-formpart-action="duplicate" data-formpart-id="${this.escapeAttribute(formPart?.id)}">Duplizieren</button>
          <button type="button" class="danger" data-formpart-action="delete" data-formpart-id="${this.escapeAttribute(formPart?.id)}">Löschen</button>
        </div>
      </div>
    `;
  }

  bindFormPartManagement() {
    this.root.querySelectorAll('[data-formpart-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.formpartAction;
        const formPartId = button.dataset.formpartId;
        const system = this.state.selectedSystem || this.state.project?.systems?.[0];

        try {
          if (action === 'add') {
            this.commands.openFormPartPicker();
            return;
          }

          if (action === 'select') {
            const formPart = system?.formParts?.find(item => item.id === formPartId);
            if (formPart) this.state.selectFormPart(formPart);
            return;
          }

          if (action === 'duplicate') {
            this.commands.duplicateFormPart(formPartId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'delete') {
            const formPart = system?.formParts?.find(item => item.id === formPartId);
            const name = formPart?.name || 'dieses Formteil';
            if (!confirm(`Formteil „${name}“ wirklich löschen?`)) return;
            this.commands.deleteFormPart(formPartId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'up' || action === 'down') {
            this.commands.moveFormPart(formPartId, action === 'up' ? -1 : 1);
            this.autoCalculateProject();
            return;
          }

          if (action === 'renumber') {
            if (!confirm('Alle Formteile neu durchnummerieren? Manuelle Formteilnamen werden überschrieben.')) return;
            this.commands.renumberFormParts({ force: true });
            this.autoCalculateProject();
          }
        } catch (error) {
          alert(error.message);
        }
      });
    });
  }

  getFormPartPressureLoss(formPart = {}) {
    const calculation = formPart?.calculationResult?.calculation || {};
    const isDirectLoss = formPart.lossMode === 'direct' || calculation.lossMode === 'direct';

    if (isDirectLoss) {
      const value = Number(formPart.pressureLossPa ?? calculation.pressureLossPa ?? 0);
      return Number.isFinite(value) ? value : null;
    }

    const sectionInfo = this.getFormPartSectionCalculation(formPart);
    const dynamicPressure = Number(sectionInfo?.result?.dynamicPressure ?? 0);
    const zeta = Number(formPart?.zeta ?? formPart?.calculationResult?.zeta ?? 0);

    if (!Number.isFinite(dynamicPressure) || !Number.isFinite(zeta)) return null;
    return zeta * dynamicPressure;
  }


  renderSpecialComponentManagement(system = {}) {
    const specialComponents = system?.specialComponents || [];
    const allGroups = this.getSpecialComponentLibraryGroups({ ignoreFilters: true });
    const groups = this.getSpecialComponentLibraryGroups();
    const filteredCount = groups.reduce((sum, group) => sum + group.items.length, 0);

    return `
      <section class="dp-editor-panel dp-special-management-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Sonderbauteile / Bauteilbibliothek</h2>
            <p>Wähle ein Sonderbauteil aus der Bibliothek. Danach öffnet sich automatisch der passende Editor.</p>
          </div>
          <div class="dp-panel-actions dp-special-add-actions">
            <button type="button" data-special-action="renumber" ${specialComponents.length ? '' : 'disabled'}>Neu nummerieren</button>
          </div>
        </div>

        ${this.renderLibraryFilterToolbar({
          type: 'special',
          search: this.specialLibrarySearch,
          category: this.specialLibraryCategory,
          groups: allGroups,
          total: allGroups.reduce((sum, group) => sum + group.items.length, 0),
          filtered: filteredCount,
          placeholder: 'Sonderbauteil suchen, z. B. Filter, BSK, Schalldämpfer…',
        })}

        ${this.renderLibraryFavoritesSection({
          type: 'special',
          title: 'Favorisierte Sonderbauteile',
          items: this.getFavoriteLibraryItems('special', this.getSpecialComponentLibrary()),
          renderCard: item => this.renderSpecialComponentLibraryCard(item),
        })}

        ${this.renderLibraryRecentSection({
          type: 'special',
          title: 'Zuletzt verwendete Sonderbauteile',
          items: this.getRecentLibraryItems('special', this.getSpecialComponentLibrary()),
          renderCard: item => this.renderSpecialComponentLibraryCard(item),
        })}

        <div class="dp-special-library">
          ${groups.length ? groups.map(group => `
            <div class="dp-special-library-group">
              <div class="dp-special-library-heading">
                <h3>${this.escapeHtml(group.category)}</h3>
                <span>${group.items.length} Bauteil${group.items.length === 1 ? '' : 'e'}</span>
              </div>
              <div class="dp-special-card-grid">
                ${group.items.map(item => this.renderSpecialComponentLibraryCard(item)).join('')}
              </div>
            </div>
          `).join('') : `
            <div class="dp-empty-state dp-library-empty">
              Keine Sonderbauteile zur aktuellen Suche gefunden. Passe Suche oder Kategorie an.
            </div>
          `}
        </div>

        ${specialComponents.length ? `
          <div class="dp-special-management-summary">
            <div>
              <span>Anzahl</span>
              <strong>${specialComponents.length}</strong>
            </div>
            <div>
              <span>Summe Druckverlust</span>
              <strong>${this.formatNumber(this.sumSpecialComponentLoss(specialComponents), 1)} Pa</strong>
            </div>
          </div>

          <div class="dp-special-list-title">
            <h3>Erfasste Sonderbauteile</h3>
            <span>${specialComponents.length} Eintrag${specialComponents.length === 1 ? '' : 'e'}</span>
          </div>

          <div class="dp-special-list">
            ${specialComponents.map((component, index) => this.renderSpecialComponentManagementRow(component, index, specialComponents.length)).join('')}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch kein Sonderbauteil vorhanden. Wähle oben eine Bauteilkachel aus der Bibliothek.
          </div>
        `}
      </section>
    `;
  }

  getSpecialComponentLibrary() {
    return typeof this.commands.getSpecialComponentLibrary === 'function'
      ? this.commands.getSpecialComponentLibrary()
      : [];
  }

  getSpecialComponentLibraryGroups(options = {}) {
    const library = this.getSpecialComponentLibrary();
    const order = ['Gerät', 'Luftaufbereitung', 'Schall', 'Regelung', 'Brandschutz', 'Raumluft', 'Aussenluft / Fortluft', 'Manuell'];
    const groups = new Map();
    const search = options.ignoreFilters ? '' : String(this.specialLibrarySearch || '').toLowerCase().trim();
    const selectedCategory = options.ignoreFilters ? 'all' : String(this.specialLibraryCategory || 'all');

    library
      .filter(item => {
        const category = item.category || 'Weitere';
        if (selectedCategory !== 'all' && category !== selectedCategory) return false;

        if (!search) return true;

        return [
          item.id,
          item.name,
          item.type,
          item.category,
          item.description,
          item.note,
        ].some(value => String(value || '').toLowerCase().includes(search));
      })
      .forEach(item => {
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

        return String(a).localeCompare(String(b), 'de-CH');
      })
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => String(a.name || a.type).localeCompare(String(b.name || b.type), 'de-CH')),
      }));
  }

  renderLibraryFilterToolbar({ type, search, category, groups, total, filtered, placeholder }) {
    const categories = groups.map(group => group.category);
    const normalizedCategory = category || 'all';

    return `
      <div class="dp-library-filter" data-library-filter="${this.escapeAttribute(type)}">
        <label class="dp-library-search">
          <span>Suchen</span>
          <input
            type="search"
            data-library-search="${this.escapeAttribute(type)}"
            value="${this.escapeAttribute(search || '')}"
            placeholder="${this.escapeAttribute(placeholder || 'Suchen…')}">
        </label>

        <div class="dp-library-categories" role="group" aria-label="Kategorien filtern">
          ${this.renderLibraryCategoryChip(type, 'all', 'Alle', normalizedCategory === 'all')}
          ${categories.map(item => this.renderLibraryCategoryChip(type, item, item, normalizedCategory === item)).join('')}
        </div>

        <div class="dp-library-filter-summary">
          <strong>${filtered}</strong> von ${total} sichtbar
          ${(search || normalizedCategory !== 'all') ? `
            <button type="button" data-library-reset="${this.escapeAttribute(type)}">Filter zurücksetzen</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderLibraryCategoryChip(type, value, label, active = false) {
    return `
      <button
        type="button"
        class="dp-library-chip ${active ? 'active' : ''}"
        data-library-category="${this.escapeAttribute(type)}"
        data-library-category-value="${this.escapeAttribute(value)}">
        ${this.escapeHtml(label)}
      </button>
    `;
  }

  loadLibraryRecent() {
    const fallback = { formpart: [], special: [] };

    try {
      const raw = localStorage.getItem('druckverlust-pro-library-recent');
      const parsed = raw ? JSON.parse(raw) : fallback;

      return {
        formpart: Array.isArray(parsed.formpart) ? parsed.formpart.slice(0, 8) : [],
        special: Array.isArray(parsed.special) ? parsed.special.slice(0, 8) : [],
      };
    } catch (error) {
      return fallback;
    }
  }

  saveLibraryRecent() {
    try {
      localStorage.setItem('druckverlust-pro-library-recent', JSON.stringify(this.libraryRecent));
    } catch (error) {
      // LocalStorage kann in manchen Test-/Privatmodi gesperrt sein. Die App soll trotzdem weiterlaufen.
    }
  }

  recordLibraryUse(type, id) {
    if (!type || !id) return;

    const key = type === 'special' ? 'special' : 'formpart';
    const current = Array.isArray(this.libraryRecent?.[key]) ? this.libraryRecent[key] : [];
    this.libraryRecent[key] = [id, ...current.filter(item => item !== id)].slice(0, 8);
    this.saveLibraryRecent();
  }

  clearLibraryRecent(type) {
    const key = type === 'special' ? 'special' : 'formpart';
    this.libraryRecent[key] = [];
    this.saveLibraryRecent();
    this.render();
  }

  getRecentLibraryItems(type, library = []) {
    const key = type === 'special' ? 'special' : 'formpart';
    const recentIds = Array.isArray(this.libraryRecent?.[key]) ? this.libraryRecent[key] : [];
    const map = new Map(library.map(item => [item.id, item]));

    return recentIds
      .map(id => map.get(id))
      .filter(Boolean)
      .slice(0, 4);
  }

  loadLibraryFavorites() {
    const fallback = { formpart: [], special: [] };

    try {
      const raw = localStorage.getItem('druckverlust-pro-library-favorites');
      const parsed = raw ? JSON.parse(raw) : fallback;

      return {
        formpart: Array.isArray(parsed.formpart) ? parsed.formpart.slice(0, 12) : [],
        special: Array.isArray(parsed.special) ? parsed.special.slice(0, 12) : [],
      };
    } catch (error) {
      return fallback;
    }
  }

  saveLibraryFavorites() {
    try {
      localStorage.setItem('druckverlust-pro-library-favorites', JSON.stringify(this.libraryFavorites));
    } catch (error) {
      // LocalStorage kann gesperrt sein. Favoriten sind Komfortdaten und dürfen die App nicht blockieren.
    }
  }

  isLibraryFavorite(type, id) {
    const key = type === 'special' ? 'special' : 'formpart';
    return Array.isArray(this.libraryFavorites?.[key]) && this.libraryFavorites[key].includes(id);
  }

  toggleLibraryFavorite(type, id) {
    if (!type || !id) return;

    const key = type === 'special' ? 'special' : 'formpart';
    const current = Array.isArray(this.libraryFavorites?.[key]) ? this.libraryFavorites[key] : [];

    this.libraryFavorites[key] = current.includes(id)
      ? current.filter(item => item !== id)
      : [id, ...current].slice(0, 12);

    this.saveLibraryFavorites();
    this.render();
  }

  clearLibraryFavorites(type) {
    const key = type === 'special' ? 'special' : 'formpart';
    this.libraryFavorites[key] = [];
    this.saveLibraryFavorites();
    this.render();
  }

  getFavoriteLibraryItems(type, library = []) {
    const key = type === 'special' ? 'special' : 'formpart';
    const favoriteIds = Array.isArray(this.libraryFavorites?.[key]) ? this.libraryFavorites[key] : [];
    const map = new Map(library.map(item => [item.id, item]));

    return favoriteIds
      .map(id => map.get(id))
      .filter(Boolean);
  }

  renderLibraryFavoritesSection({ type, title, items = [], renderCard }) {
    if (!items.length || typeof renderCard !== 'function') return '';

    return `
      <div class="dp-library-favorites" data-library-favorites="${this.escapeAttribute(type)}">
        <div class="dp-library-recent-header">
          <div>
            <h3>${this.escapeHtml(title || 'Favoriten')}</h3>
            <p>Fest angeheftete Einträge für den schnellen Zugriff.</p>
          </div>
          <button type="button" data-library-favorites-clear="${this.escapeAttribute(type)}">Favoriten leeren</button>
        </div>
        <div class="dp-formpart-card-grid dp-library-recent-grid">
          ${items.map(item => renderCard(item)).join('')}
        </div>
      </div>
    `;
  }

  renderLibraryRecentSection({ type, title, items = [], renderCard }) {
    if (!items.length || typeof renderCard !== 'function') return '';

    return `
      <div class="dp-library-recent" data-library-recent="${this.escapeAttribute(type)}">
        <div class="dp-library-recent-header">
          <div>
            <h3>${this.escapeHtml(title || 'Zuletzt verwendet')}</h3>
            <p>Schnellzugriff auf die zuletzt eingefügten Bibliothekseinträge.</p>
          </div>
          <button type="button" data-library-recent-clear="${this.escapeAttribute(type)}">Leeren</button>
        </div>
        <div class="dp-formpart-card-grid dp-library-recent-grid">
          ${items.map(item => renderCard(item)).join('')}
        </div>
      </div>
    `;
  }

  bindLibraryFilterControls() {
    this.root.querySelectorAll('[data-library-search]').forEach(input => {
      input.addEventListener('input', () => {
        const type = input.dataset.librarySearch;
        if (type === 'formpart') this.formPartLibrarySearch = input.value || '';
        if (type === 'special') this.specialLibrarySearch = input.value || '';
        this.render();
      });
    });

    this.root.querySelectorAll('[data-library-category]').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.libraryCategory;
        const value = button.dataset.libraryCategoryValue || 'all';
        if (type === 'formpart') this.formPartLibraryCategory = value;
        if (type === 'special') this.specialLibraryCategory = value;
        this.render();
      });
    });

    this.root.querySelectorAll('[data-library-reset]').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.libraryReset;
        if (type === 'formpart') {
          this.formPartLibrarySearch = '';
          this.formPartLibraryCategory = 'all';
        }
        if (type === 'special') {
          this.specialLibrarySearch = '';
          this.specialLibraryCategory = 'all';
        }
        this.render();
      });
    });

    this.root.querySelectorAll('[data-library-recent-clear]').forEach(button => {
      button.addEventListener('click', () => {
        this.clearLibraryRecent(button.dataset.libraryRecentClear);
      });
    });

    this.root.querySelectorAll('[data-library-favorites-clear]').forEach(button => {
      button.addEventListener('click', () => {
        this.clearLibraryFavorites(button.dataset.libraryFavoritesClear);
      });
    });

    this.root.querySelectorAll('[data-library-favorite-toggle]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        this.toggleLibraryFavorite(button.dataset.libraryFavoriteToggle, button.dataset.libraryItemId);
      });
    });
  }

  renderSpecialComponentLibraryCard(item = {}) {
    const favorite = this.isLibraryFavorite('special', item.id);

    return `
      <div class="dp-library-card-shell">
        <button
          class="dp-library-favorite-toggle ${favorite ? 'active' : ''}"
          type="button"
          data-library-favorite-toggle="special"
          data-library-item-id="${this.escapeAttribute(item.id)}"
          title="${favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}"
          aria-label="${favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
          ${favorite ? '★' : '☆'}
        </button>
        <button class="dp-special-card" type="button" data-special-action="add" data-special-type="${this.escapeAttribute(item.id)}">
          <div class="dp-special-card-icon" aria-hidden="true">
            ${this.renderSpecialComponentIcon(item)}
          </div>
          <div class="dp-special-card-body">
            <span>${this.escapeHtml(item.category || 'Sonderbauteil')}</span>
            <strong>${this.escapeHtml(item.name || item.type || 'Sonderbauteil')}</strong>
            <em>${this.formatNumber(item.unitPressureLoss ?? 0, 1)} Pa Ansatz</em>
          </div>
        </button>
      </div>
    `;
  }

  renderSpecialComponentIcon(item = {}) {
    const id = String(item.id || '').toLowerCase();
    const label = id.includes('filter') ? 'F'
      : id.includes('schall') ? 'SD'
      : id.includes('volumen') ? 'VSR'
      : id.includes('brand') ? 'BSK'
      : id.includes('luftdurchlass') ? 'LD'
      : id.includes('monoblock') ? 'MB'
      : id.includes('wetter') ? 'WG'
      : '+';

    return `
      <svg viewBox="0 0 96 64" role="img" focusable="false">
        <rect x="8" y="16" width="80" height="32" rx="5"></rect>
        <line x1="18" y1="24" x2="78" y2="24"></line>
        <line x1="18" y1="40" x2="78" y2="40"></line>
        <text x="48" y="36" text-anchor="middle">${this.escapeHtml(label)}</text>
      </svg>
    `;
  }

  renderSpecialComponentManagementRow(component = {}, index = 0, total = 0) {
    const loss = this.getSpecialComponentTotalLoss(component);
    const q = component?.q ?? component?.airflow ?? component?.volumeFlow ?? component?.airVolume ?? 0;
    const type = component?.type || component?.category || 'Sonderbauteil';
    const sectionName = component?.sectionId ? this.getSectionNameById(component.sectionId) : 'Anlage';

    return `
      <div class="dp-special-row ${this.state.isSelected('specialComponent', component?.id) ? 'active' : ''}">
        <button type="button" class="dp-special-row-main" data-special-action="select" data-special-id="${this.escapeAttribute(component?.id)}">
          <strong>${this.escapeHtml(component?.name || 'Sonderbauteil')}</strong>
          <span>${this.escapeHtml(type)} · ${this.escapeHtml(sectionName)} · ${this.formatAirflow(q)} m³/h · ${this.formatNumber(loss, 1)} Pa</span>
        </button>
        <div class="dp-special-row-actions">
          <button type="button" data-special-action="up" data-special-id="${this.escapeAttribute(component?.id)}" ${index <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-special-action="down" data-special-id="${this.escapeAttribute(component?.id)}" ${index >= total - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-special-action="duplicate" data-special-id="${this.escapeAttribute(component?.id)}">Duplizieren</button>
          <button type="button" class="danger" data-special-action="delete" data-special-id="${this.escapeAttribute(component?.id)}">Löschen</button>
        </div>
      </div>
    `;
  }

  bindSpecialComponentManagement() {
    this.bindLibraryFilterControls();

    this.root.querySelectorAll('[data-special-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.specialAction;
        const componentId = button.dataset.specialId;
        const specialType = button.dataset.specialType;
        const system = this.state.selectedSystem || this.state.project?.systems?.[0];

        try {
          if (action === 'add') {
            const type = specialType || 'freie_komponente';
            this.recordLibraryUse('special', type);
            this.commands.addSpecialComponent(type);
            this.autoCalculateProject();
            return;
          }

          if (action === 'select') {
            const component = system?.specialComponents?.find(item => item.id === componentId);
            if (component) this.state.selectSpecialComponent(component);
            return;
          }

          if (action === 'duplicate') {
            this.commands.duplicateSpecialComponent(componentId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'delete') {
            const component = system?.specialComponents?.find(item => item.id === componentId);
            const name = component?.name || 'dieses Sonderbauteil';
            if (!confirm(`Sonderbauteil „${name}“ wirklich löschen?`)) return;
            this.commands.deleteSpecialComponent(componentId);
            this.autoCalculateProject();
            return;
          }

          if (action === 'up' || action === 'down') {
            this.commands.moveSpecialComponent(componentId, action === 'up' ? -1 : 1);
            this.autoCalculateProject();
            return;
          }

          if (action === 'renumber') {
            if (!confirm('Alle Sonderbauteile neu nummerieren? Manuelle Namen können überschrieben werden.')) return;
            this.commands.renumberSpecialComponents({ force: true });
            this.autoCalculateProject();
          }
        } catch (error) {
          alert(error.message);
        }
      });
    });
  }

  renderFormPartPicker() {
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const allGroups = this.getFormPartLibraryGroups({ ignoreFilters: true });
    const groups = this.getFormPartLibraryGroups();
    const filteredCount = groups.reduce((sum, group) => sum + group.items.length, 0);

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
        ${this.renderLibraryFilterToolbar({
          type: 'formpart',
          search: this.formPartLibrarySearch,
          category: this.formPartLibraryCategory,
          groups: allGroups,
          total: allGroups.reduce((sum, group) => sum + group.items.length, 0),
          filtered: filteredCount,
          placeholder: 'Formteil suchen, z. B. Bogen, Übergang, T-Stück…',
        })}

        ${this.renderLibraryFavoritesSection({
          type: 'formpart',
          title: 'Favorisierte Formteile',
          items: this.getFavoriteLibraryItems('formpart', this.registry.all()),
          renderCard: item => this.renderFormPartPickerCard(item),
        })}

        ${this.renderLibraryRecentSection({
          type: 'formpart',
          title: 'Zuletzt verwendete Formteile',
          items: this.getRecentLibraryItems('formpart', this.registry.all()),
          renderCard: item => this.renderFormPartPickerCard(item),
        })}

        ${groups.length ? groups.map(group => `
          <div class="dp-formpart-library-group">
            <div class="dp-formpart-library-heading">
              <h2>${this.escapeHtml(group.category)}</h2>
              <span>${group.items.length} Formteil${group.items.length === 1 ? '' : 'e'}</span>
            </div>

            <div class="dp-formpart-card-grid">
              ${group.items.map(item => this.renderFormPartPickerCard(item)).join('')}
            </div>
          </div>
        `).join('') : `
          <div class="dp-empty-state dp-library-empty">
            Keine Formteile zur aktuellen Suche gefunden. Passe Suche oder Kategorie an.
          </div>
        `}
      </section>
    `;

    this.bindFormPartPicker();
    this.bindFormPartImageFallbacks();
  }

  renderFormPartPickerCard(item) {
    const favorite = this.isLibraryFavorite('formpart', item.id);

    return `
      <div class="dp-library-card-shell">
        <button
          class="dp-library-favorite-toggle ${favorite ? 'active' : ''}"
          type="button"
          data-library-favorite-toggle="formpart"
          data-library-item-id="${this.escapeAttribute(item.id)}"
          title="${favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}"
          aria-label="${favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">
          ${favorite ? '★' : '☆'}
        </button>
        <button class="dp-formpart-card" type="button" data-formpart-type="${this.escapeAttribute(item.id)}">
          <div class="dp-formpart-card-image">
            ${this.renderFormPartCardImage(item)}
          </div>
          <div class="dp-formpart-card-body">
            <span>${this.escapeHtml(item.category ?? 'Formteil')}</span>
            <strong>${this.escapeHtml(item.name)}</strong>
          </div>
        </button>
      </div>
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
        draggable="false"
        loading="lazy"
        decoding="async"
        data-fallbacks="${this.escapeAttribute(fallbacks.join('|'))}">
      <div class="dp-image-missing" style="display:none;">Skizze fehlt</div>
    `;
  }

  bindFormPartPicker() {
    this.bindLibraryFilterControls();

    this.root.querySelectorAll('[data-formpart-type]').forEach(button => {
      button.addEventListener('click', () => {
        try {
          const type = button.dataset.formpartType;
          this.recordLibraryUse('formpart', type);
          this.commands.createFormPart(type);
          this.autoCalculateProject();
        } catch (error) {
          alert(`Formteil konnte nicht erstellt werden: ${error.message}`);
        }
      });
    });
  }

  getFormPartLibraryGroups(options = {}) {
    const order = ['Rund', 'Rechteck', 'Übergänge', 'Spezial', 'Abzweige'];
    const groups = new Map();
    const search = options.ignoreFilters ? '' : String(this.formPartLibrarySearch || '').toLowerCase().trim();
    const selectedCategory = options.ignoreFilters ? 'all' : String(this.formPartLibraryCategory || 'all');

    this.registry.all()
      .filter(item => {
        const category = item.category || 'Weitere';
        if (selectedCategory !== 'all' && category !== selectedCategory) return false;

        if (!search) return true;

        return [
          item.id,
          item.name,
          item.category,
          item.description,
          ...(item.keywords || []),
        ].some(value => String(value || '').toLowerCase().includes(search));
      })
      .forEach(item => {
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

        return String(a).localeCompare(String(b), 'de-CH');
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
    const autoSizeResult = this.applySectionDimensionsToFormPart(formPart);
    this.deriveAndStoreFormPart(formPart);
    this.calculateAndStoreFormPart(formPart, { silent: true });

    const formPartIndex = system?.formParts?.findIndex(item => item.id === formPart?.id) ?? -1;

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>${this.escapeHtml(formPart?.name ?? 'Formteil')}</h1>
          <p>Formteil bearbeiten, duplizieren, löschen oder innerhalb der Formteilliste verschieben.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-formpart-action="duplicate" data-formpart-id="${this.escapeAttribute(formPart?.id)}">Duplizieren</button>
          <button type="button" data-formpart-action="up" data-formpart-id="${this.escapeAttribute(formPart?.id)}" ${formPartIndex <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-formpart-action="down" data-formpart-id="${this.escapeAttribute(formPart?.id)}" ${formPartIndex < 0 || formPartIndex >= (system?.formParts?.length || 0) - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="danger" data-formpart-action="delete" data-formpart-id="${this.escapeAttribute(formPart?.id)}">Löschen</button>
        </div>
      </div>
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

        ${this.renderFormPartAutoSizePanel(formPart, autoSizeResult)}

        ${this.renderFormPartParameters(formPart)}

        <p class="dp-auto-calc-note">Änderungen werden automatisch übernommen und berechnet.</p>
      </section>

      ${this.renderFormPartResult(formPart)}
    `;

    this.bindFormPartEditor(formPart);
    this.bindFormPartManagement();
    this.bindFormPartImageFallbacks();
  }

  bindFormPartEditor(formPart) {
    this.root.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;

        formPart[field] = this.readFormPartFieldValue(formPart, field, input);

        if (field === 'type') {
          const entry = this.getRegistryEntry(formPart);
          this.applyFormPartDefaults(formPart, { overwrite: true });

          if (entry && (!formPart.name || /^Formteil\s+\d+$/i.test(String(formPart.name)))) {
            formPart.name = entry.name;
          }

          this.applySectionDimensionsToFormPart(formPart, { force: true, clearManualOverride: true });
        }

        if (field === 'sectionId') {
          this.applySectionDimensionsToFormPart(formPart, { force: true, clearManualOverride: true });
        } else if (this.isFormPartAutoSizeField(field)) {
          formPart.autoSizeManualOverride = true;
        }

        this.deriveAndStoreFormPart(formPart);
        this.calculateAndStoreFormPart(formPart, { silent: true });
        this.autoCalculateProject();
      });
    });

    this.root.querySelectorAll('[data-formpart-size-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.formpartSizeAction;

        if (action !== 'apply-section') return;

        const result = this.applySectionDimensionsToFormPart(formPart, { force: true, clearManualOverride: true });

        if (!result?.applied) {
          alert(result?.message || 'Es konnten keine Grössen aus der Teilstrecke übernommen werden.');
          return;
        }

        this.deriveAndStoreFormPart(formPart);
        this.calculateAndStoreFormPart(formPart, { silent: true });
        this.autoCalculateProject();
      });
    });
  }

  renderFormPartAutoSizePanel(formPart, autoSizeResult = null) {
    const section = this.getSectionById(formPart?.sectionId);
    const status = autoSizeResult?.status || formPart?.autoSize?.status || 'idle';
    const statusClass = this.escapeAttribute(status);
    const sectionName = section
      ? this.getSectionNameById(section.id)
      : 'keine Teilstrecke gewählt';
    const lastSummary = formPart?.autoSize?.summary || autoSizeResult?.summary || '';
    const fieldSummary = autoSizeResult?.fields?.length
      ? autoSizeResult.fields.map(field => this.getFormPartAutoSizeFieldLabel(field)).join(', ')
      : lastSummary || 'Noch keine automatische Grössenübernahme durchgeführt.';
    const manual = Boolean(formPart?.autoSizeManualOverride);

    return `
      <section class="dp-autosize-panel dp-autosize-${statusClass}">
        <div>
          <span class="dp-overline">Automatische Grössenübernahme</span>
          <h3>Grössen aus Teilstrecke</h3>
          <p>
            Gewählte Teilstrecke: <strong>${this.escapeHtml(sectionName)}</strong>.
            ${section ? 'Kanal-/Rohrgrösse und Hauptluftmenge werden beim Anwählen automatisch übernommen.' : 'Bitte zuerst eine Teilstrecke zuordnen.'}
          </p>
          <small>${this.escapeHtml(fieldSummary)}${manual ? ' · manuell angepasst' : ''}</small>
        </div>
        <button type="button" data-formpart-size-action="apply-section" ${section ? '' : 'disabled'}>
          Grössen übernehmen
        </button>
      </section>
    `;
  }

  applySectionDimensionsToFormPart(formPart, options = {}) {
    const entry = this.getRegistryEntry(formPart);
    const section = this.getSectionById(formPart?.sectionId);

    if (!formPart || !entry) {
      return { applied: false, status: 'missing', message: 'Formteiltyp nicht gefunden.' };
    }

    if (!section) {
      return { applied: false, status: 'missing', message: 'Keine Teilstrecke zugeordnet.' };
    }

    const force = Boolean(options.force);
    const signature = this.getSectionAutoSizeSignature(section);

    if (formPart.autoSizeManualOverride && !force) {
      return {
        applied: false,
        status: 'manual',
        section,
        message: 'Die Grössen wurden manuell angepasst. Automatische Übernahme pausiert.',
      };
    }

    if (!force && formPart.autoSize?.sectionId === section.id && formPart.autoSize?.signature === signature) {
      return {
        applied: false,
        status: 'unchanged',
        section,
        summary: formPart.autoSize?.summary || '',
        fields: formPart.autoSize?.fields || [],
      };
    }

    const values = this.getFormPartSectionDimensionValues(formPart, entry, section);
    const fields = Object.keys(values).filter(field => values[field] !== undefined && values[field] !== null && values[field] !== '');

    if (!fields.length) {
      formPart.autoSize = {
        sectionId: section.id,
        signature,
        status: 'empty',
        appliedAt: new Date().toISOString(),
        fields: [],
        summary: 'Für diesen Formteiltyp wurden keine passenden Grössenfelder gefunden.',
      };
      return {
        applied: false,
        status: 'empty',
        section,
        message: formPart.autoSize.summary,
      };
    }

    fields.forEach(field => {
      formPart[field] = values[field];
    });

    if (options.clearManualOverride !== false) {
      delete formPart.autoSizeManualOverride;
    }

    const summary = fields
      .map(field => this.getFormPartAutoSizeFieldLabel(field))
      .join(', ');

    formPart.autoSize = {
      sectionId: section.id,
      sectionName: this.getSectionNameById(section.id),
      signature,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      fields,
      summary: `Übernommen: ${summary}`,
    };

    return {
      applied: true,
      status: 'applied',
      section,
      fields,
      summary: formPart.autoSize.summary,
    };
  }

  getFormPartSectionDimensionValues(formPart, entry, section) {
    const parameterIds = new Set((entry?.parameters || []).map(parameter => parameter.id));
    const values = {};
    const geometry = this.getSectionGeometryForFormPart(section);
    const type = String(entry?.id || formPart?.type || '').toLowerCase();
    const has = field => parameterIds.has(field);
    const set = (field, value) => {
      if (!has(field)) return;
      if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return;
      values[field] = value;
    };
    const setShape = (prefix = '') => {
      const bauformField = prefix ? `${prefix}_bauform` : 'bauform';
      const widthField = prefix ? `${prefix}_breite` : 'a';
      const heightField = prefix ? `${prefix}_hoehe` : 'b';
      const diameterField = prefix ? `${prefix}_d` : 'd';

      if (has(bauformField)) values[bauformField] = geometry.bauform;

      if (geometry.isPipe) {
        set(diameterField, geometry.diameterMm);
        return;
      }

      set(widthField, geometry.widthMm);
      set(heightField, geometry.heightMm);
    };

    // Einfache Bögen / Etagen übernehmen die direkte Rohr- oder Kanalgrösse.
    setShape('');

    // Übergänge: die zugewiesene Teilstrecke wird auf die Anschlussseite gelegt,
    // die zur Strömungsrichtung des Formteils passt. Die zweite Seite bleibt frei/manuell.
    if (type.includes('uebergang_gross_klein')) {
      setShape('A2');
    } else if (type.includes('uebergang_klein_gross')) {
      setShape('A1');
    }

    // Abzweige / Hosenstück / T-Stück / Sattelstück: zugewiesene Teilstrecke = Hauptanschluss.
    if (
      type.includes('hosenstueck') ||
      type.includes('t_abzweig') ||
      type.includes('t_stueck') ||
      type.includes('sattelstueck')
    ) {
      setShape('A');
      set('W', geometry.q);
    }

    // Durchgangsvarianten bekommen zusätzlich den Durchgang AD/WD aus der Teilstrecke.
    if (type.includes('durchgang')) {
      setShape('AD');
      set('WD', geometry.q);
    }

    return values;
  }

  getSectionGeometryForFormPart(section = {}) {
    const isPipe = this.isPipeSection(section);
    return {
      isPipe,
      bauform: isPipe ? 'Rohr' : 'Kanal',
      q: Math.round(Number(section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0)),
      widthMm: this.toMillimetres(section?.b ?? section?.width ?? 0),
      heightMm: this.toMillimetres(section?.h ?? section?.height ?? 0),
      diameterMm: this.toMillimetres(section?.d ?? section?.diameter ?? 0),
    };
  }

  toMillimetres(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return 0;

    // Teilstrecken arbeiten aktuell in Meter. Falls alte Projektdaten bereits mm enthalten,
    // werden Werte ab 10 als Millimeter interpretiert.
    return Math.round(number < 10 ? number * 1000 : number);
  }

  getSectionAutoSizeSignature(section = {}) {
    const geometry = this.getSectionGeometryForFormPart(section);
    return [
      section?.id || '',
      geometry.bauform,
      geometry.q,
      geometry.widthMm,
      geometry.heightMm,
      geometry.diameterMm,
    ].join('|');
  }

  isFormPartAutoSizeField(field = '') {
    return new Set([
      'd', 'a', 'b',
      'A1_bauform', 'A1_breite', 'A1_hoehe', 'A1_d',
      'A2_bauform', 'A2_breite', 'A2_hoehe', 'A2_d',
      'A_breite', 'A_hoehe', 'A_d',
      'AD_breite', 'AD_hoehe', 'AD_d',
      'AA_breite', 'AA_hoehe', 'AA_d',
      'W', 'WD', 'WA',
      'bauform',
    ]).has(field);
  }

  getFormPartAutoSizeFieldLabel(field = '') {
    const labels = {
      d: 'd',
      a: 'Breite a',
      b: 'Höhe b',
      bauform: 'Bauform',
      W: 'W',
      WD: 'WD',
      WA: 'WA',
      A1_bauform: 'A1-Bauform',
      A1_breite: 'A1-Breite',
      A1_hoehe: 'A1-Höhe',
      A1_d: 'A1-Durchmesser',
      A2_bauform: 'A2-Bauform',
      A2_breite: 'A2-Breite',
      A2_hoehe: 'A2-Höhe',
      A2_d: 'A2-Durchmesser',
      A_breite: 'A-Breite',
      A_hoehe: 'A-Höhe',
      A_d: 'A-Durchmesser',
      AD_breite: 'AD-Breite',
      AD_hoehe: 'AD-Höhe',
      AD_d: 'AD-Durchmesser',
      AA_breite: 'AA-Breite',
      AA_hoehe: 'AA-Höhe',
      AA_d: 'AA-Durchmesser',
    };

    return labels[field] || field;
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
    if (!formPart) return null;

    if (typeof this.registry.normalizeFormPart === 'function') {
      return this.registry.normalizeFormPart(formPart);
    }

    if (!formPart?.type) return null;

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
          draggable="false"
          loading="lazy"
          decoding="async"
          data-fallbacks="${this.escapeAttribute(fallbacks.join('|'))}">
        <div class="dp-image-missing" style="display:none;">Skizze konnte nicht geladen werden.</div>
      </div>
    `;
  }

  getFormPartImageSources(entry) {
    const sources = [];
    const add = source => {
      if (!source) return;

      const normalized = String(source)
        .replaceAll('\\', '/')
        .replace(/^\.\//, '')
        .replace(/^\//, '');

      if (!normalized || sources.includes(normalized)) return;

      this.getAssetSourceCandidates(normalized).forEach(candidate => {
        if (candidate && !sources.includes(candidate)) sources.push(candidate);
      });
    };

    add(entry?.image);
    (entry?.imageFallbacks || []).forEach(add);

    if (entry?.id) {
      add(`assets/formteile/${entry.id}/${entry.id}.png`);
      add(`assets/formteile/${entry.id}.png`);
    }

    return sources;
  }

  getAssetSourceCandidates(path) {
    const cleanPath = String(path || '')
      .replaceAll('\\', '/')
      .replace(/^\.\//, '')
      .replace(/^\//, '');

    if (!cleanPath) return [];
    if (/^(data:|https?:|blob:)/i.test(cleanPath)) return [cleanPath];

    const candidates = [];
    const add = candidate => {
      if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
    };

    const pathname = window?.location?.pathname || '';

    if (pathname.includes('/tests/reference/')) {
      add(`../../${cleanPath}`);
    } else if (pathname.includes('/tests/')) {
      add(`../${cleanPath}`);
    } else {
      add(cleanPath);
      add(`./${cleanPath}`);
    }

    add(`/${cleanPath}`);
    add(cleanPath);
    add(`./${cleanPath}`);

    return candidates;
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


  renderDeploymentCheck(check = null) {
    const result = check || this.state.deploymentCheck;
    const hasResult = !!result;
    const status = result?.status || 'warning';
    const label = result?.label || 'Noch nicht geprüft';
    const counts = result?.counts || { ok: 0, warning: 0, error: 0 };
    const items = result?.items || [];
    const location = result?.location || {};
    const finishedAt = result?.finishedAt ? new Date(result.finishedAt) : null;
    const finishedLabel = finishedAt && !Number.isNaN(finishedAt.getTime())
      ? finishedAt.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'medium' })
      : '-';

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>Deployment-QS</h1>
          <p>Prüft Startdateien, GitHub-Pages-Pfade, Cache-Versionen, Pflichtbilder und Basiszustand.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-deploy-action="run">Neu prüfen</button>
          <button type="button" data-deploy-action="copy" ${hasResult ? '' : 'disabled'}>Zusammenfassung kopieren</button>
          <button type="button" data-deploy-action="project">Zurück zum Projekt</button>
        </div>
      </div>

      <section class="dp-editor-panel dp-deploy-check-panel dp-deploy-${this.escapeAttribute(status)}">
        <div class="dp-panel-header">
          <div>
<<<<<<< HEAD
            <span class="dp-overline">Phase ${this.escapeHtml(APP_RELEASE)}</span>
=======
            <span class="dp-overline">Phase 18.18</span>
>>>>>>> 3878efa18540cddce73e78696fad3fd1d4470a0d
            <h2>GitHub Pages / Deployment-Prüfung</h2>
            <p>${this.escapeHtml(result?.summary || 'Noch keine Prüfung ausgeführt. Klicke auf „Neu prüfen“.')}</p>
          </div>
          <span class="dp-project-check-badge ${this.escapeAttribute(status)}">${this.escapeHtml(label)}</span>
        </div>

        <div class="dp-project-check-stats dp-deploy-stats">
          <div>
            <span>OK</span>
            <strong>${this.escapeHtml(counts.ok)}</strong>
          </div>
          <div>
            <span>Hinweise</span>
            <strong>${this.escapeHtml(counts.warning)}</strong>
          </div>
          <div>
            <span>Fehler</span>
            <strong>${this.escapeHtml(counts.error)}</strong>
          </div>
        </div>

        <div class="dp-deploy-meta-grid">
          <div>
            <span>Aktuelle Adresse</span>
            <strong>${this.escapeHtml(location.href || '-')}</strong>
          </div>
          <div>
            <span>Erwarteter Pfad</span>
            <strong>${this.escapeHtml(location.expectedBasePath || './')}</strong>
          </div>
          <div>
            <span>Version</span>
            <strong>${this.escapeHtml(result?.version || APP_RELEASE)}</strong>
          </div>
          <div>
            <span>Geprüft</span>
            <strong>${this.escapeHtml(finishedLabel)}</strong>
          </div>
        </div>

        ${items.length ? `
          <div class="dp-project-check-list dp-deploy-check-list">
            ${items.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}</span>
                ${item.details ? `<em>${this.escapeHtml(item.details)}</em>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch keine Deployment-Prüfung vorhanden.
          </div>
        `}
      </section>
    `;

    this.bindDeploymentCheckActions();
  }

  bindDeploymentCheckActions() {
    this.root.querySelectorAll('[data-deploy-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.deployAction;

        if (action === 'project') {
          this.state.setSelection?.('project', this.state.project);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = DeploymentDiagnostics.toText(this.state.deploymentCheck || {});
          try {
            await navigator.clipboard.writeText(text);
            button.textContent = 'Kopiert ✓';
            setTimeout(() => { button.textContent = 'Zusammenfassung kopieren'; }, 1400);
          } catch {
            alert(text);
          }
          return;
        }

        if (action === 'run') {
          const originalText = button.textContent;
          button.disabled = true;
          button.textContent = 'Prüfung läuft…';

          try {
            const check = await DeploymentDiagnostics.run({ project: this.state.project, version: APP_RELEASE });
            this.state.deploymentCheck = check;
            this.state.setSelection?.('deploymentCheck', check);
            this.state.notify?.();
          } catch (error) {
            alert(`Deployment-QS konnte nicht ausgeführt werden: ${error.message}`);
          } finally {
            button.disabled = false;
            button.textContent = originalText;
          }
        }
      });
    });
  }


  renderReportExportCheck(model) {
    const checklist = ReportEngine.createExportChecklist(model);
    const statusLabel = checklist.status === 'ok'
      ? 'Bereit'
      : checklist.status === 'error'
        ? 'Gesperrt'
        : 'Mit Hinweisen';
    const recommendationTitle = checklist.status === 'ok'
      ? 'Export bereit'
      : checklist.status === 'error'
        ? 'Export nicht bereit'
        : 'Export möglich, aber prüfen';
    const recommendationText = checklist.status === 'ok'
      ? 'Alle Pflichtpunkte sind erfüllt. PDF, HTML und CSV können ohne Rückfrage erstellt werden.'
      : checklist.status === 'error'
        ? 'Mindestens ein Pflichtpunkt ist fehlerhaft. Der Export wird gesperrt, bis die roten Punkte korrigiert sind.'
        : 'Es gibt gelbe Hinweise. Der Export bleibt möglich, aber vor der Ausgabe erscheint eine Bestätigung.';

    return `
      <section class="dp-editor-panel dp-report-export-check no-print">
        <div class="dp-panel-header">
          <div>
            <h2>Exportprüfung</h2>
            <p>Kontrolle vor PDF-, HTML- und CSV-Ausgabe.</p>
          </div>
          <span class="dp-report-export-status ${this.escapeAttribute(checklist.status)}">${this.escapeHtml(statusLabel)}</span>
        </div>

        <div class="dp-report-export-recommendation ${this.escapeAttribute(checklist.status)}">
          <strong>${this.escapeHtml(recommendationTitle)}</strong>
          <span>${this.escapeHtml(recommendationText)}</span>
        </div>

        <div class="dp-report-export-grid">
          ${checklist.items.map(item => `
            <div class="dp-report-export-item ${this.escapeAttribute(item.status)}">
              <strong>${this.escapeHtml(item.label)}</strong>
              <span>${this.escapeHtml(item.status === 'ok' ? item.message : item.warning)}</span>
            </div>
          `).join('')}
        </div>

        <div class="dp-report-file-preview">
          <div>
            <span>Dateiname Bericht</span>
            <strong>${this.escapeHtml(checklist.fileBaseName)}_Bericht.html</strong>
          </div>
          <div>
            <span>Dateiname Datenexport</span>
            <strong>${this.escapeHtml(checklist.fileBaseName)}_Datenexport.csv</strong>
          </div>
        </div>
        <p class="dp-report-export-note">HTML-Berichte werden mit eingebetteten Bildern gespeichert und können dadurch auch ausserhalb des Projektordners geöffnet werden.</p>
      </section>
    `;
  }


  renderReportCompletionSummary(model) {
    const completion = ReportEngine.createReportCompletionSummary(model);
    const statusLabel = completion.status === 'ok'
      ? 'Phase 17 abgeschlossen'
      : completion.status === 'error'
        ? 'Abschluss blockiert'
        : 'Abschluss mit Hinweisen';

    return `
      <section class="dp-editor-panel dp-report-completion no-print">
        <div class="dp-panel-header">
          <div>
            <h2>Berichtsabschluss</h2>
            <p>Finale Kontrolle für PDF, HTML und CSV vor der Abgabe.</p>
          </div>
          <span class="dp-report-export-status ${this.escapeAttribute(completion.status)}">${this.escapeHtml(statusLabel)}</span>
        </div>

        <div class="dp-report-completion-grid">
          <div>
            <span>PDF-Seiten</span>
            <strong>${this.escapeHtml(completion.totalPages)}</strong>
          </div>
          <div>
            <span>Inhaltsbereiche</span>
            <strong>${this.escapeHtml(completion.activeSections)}</strong>
          </div>
          <div>
            <span>Ausgeblendete leere Einträge</span>
            <strong>${this.escapeHtml(completion.hiddenSections + completion.hiddenFormParts + completion.hiddenSpecialComponents)}</strong>
          </div>
          <div>
            <span>Dateibasis</span>
            <strong>${this.escapeHtml(completion.fileBaseName)}</strong>
          </div>
        </div>

        <p class="dp-report-completion-note">
          Aktive Seiten: ${this.escapeHtml(completion.activeSectionNames.join(' · ') || 'Deckblatt')}
        </p>
      </section>
    `;
  }

  renderReport() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0] || null;

    if (!project || !system) {
      this.root.innerHTML = `
        <h1>Bericht</h1>
        <p>Kein Projekt oder keine Anlage vorhanden.</p>
      `;
      return;
    }

    if (!project.calculationResult || this.state.isCalculationDirty) {
      this.autoCalculateProject({ notify: false });
    }

    const model = ReportEngine.createReportModel(project, { system, registry: this.registry });
    const generatedAt = new Date(model.generatedAt);
    const generatedLabel = Number.isNaN(generatedAt.getTime())
      ? '-'
      : generatedAt.toLocaleString('de-CH');

    this.root.innerHTML = `
      <div class="workspace-header dp-report-toolbar no-print">
        <div>
          <h1>Bericht / Druckansicht</h1>
          <p>Zusammenfassung der Anlage mit Teilstrecken, Formteilen, Sonderbauteilen und QS-Status.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-report-action="print">Drucken / PDF</button>
          <button type="button" data-report-action="html">HTML speichern</button>
          <button type="button" data-report-action="csv">CSV Export</button>
        </div>
      </div>

      ${this.renderReportSettingsEditor(project, system)}
      ${this.renderReportExportCheck(model)}
      ${this.renderReportCompletionSummary(model)}

      <article class="dp-report-preview">
        ${ReportEngine.renderReportBody(model, { generatedLabel })}
      </article>
    `;

    this.bindReportSettingsEditor(project);
    this.bindReportActions(model);
  }

  ensureReportData(project, system = null) {
    if (!project.report || typeof project.report !== 'object') {
      project.report = {};
    }

    const report = project.report;
    report.project = report.project ?? project.name ?? 'Unbenanntes Projekt';
    report.object = report.object ?? project.object ?? project.objekt ?? '-';
    report.anlage = report.anlage ?? system?.name ?? project.plant ?? project.anlage ?? 'Anlage';
    report.anlageNumber = report.anlageNumber ?? project.anlageNumber ?? project.systemNumber ?? project.meta?.anlageNumber ?? '';
    report.bearbeiter = report.bearbeiter ?? project.author ?? project.bearbeiter ?? '-';
    report.datum = report.datum ?? project.date ?? project.datum ?? new Date().toLocaleDateString('de-CH');
    report.hinweis = report.hinweis ?? project.note ?? '';

    const todayCompact = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    report.reportNumber = report.reportNumber ?? report.berichtNr ?? project.reportNumber ?? project.berichtNr ?? `DP-${todayCompact}-001`;
    report.revision = report.revision ?? report.rev ?? project.revision ?? project.rev ?? '0';
    report.checkedBy = report.checkedBy ?? report.geprueftVon ?? project.checkedBy ?? project.geprueftVon ?? '';
    report.approvedBy = report.approvedBy ?? report.freigegebenVon ?? project.approvedBy ?? project.freigegebenVon ?? '';
    report.approvalDate = report.approvalDate ?? report.freigabeDatum ?? project.approvalDate ?? project.freigabeDatum ?? '';
    if (!Array.isArray(report.revisionHistory)) {
      report.revisionHistory = Array.isArray(project.revisionHistory)
        ? project.revisionHistory
        : [{
            revision: report.revision ?? '0',
            date: report.datum ?? report.date ?? new Date().toLocaleDateString('de-CH'),
            author: report.bearbeiter ?? report.author ?? project.author ?? '',
            change: 'Erstausgabe',
          }];
    }

    if (!project.settings || typeof project.settings !== 'object') {
      project.settings = {};
    }

    project.settings.rho = project.settings.rho ?? 1.21;
    project.settings.lambda = project.settings.lambda ?? 0.025;

    if (!project.reportOptions || typeof project.reportOptions !== 'object') {
      project.reportOptions = {};
    }

    this.getDefaultReportOptions().forEach(option => {
      project.reportOptions[option.id] = project.reportOptions[option.id] ?? option.default;
    });

    return report;
  }

  getDefaultReportOptions() {
    return [
      { id: 'includeToc', label: 'Inhaltsverzeichnis', default: true },
      { id: 'includeMainNetwork', label: 'Hauptberechnung – Luftnetz', default: true },
      { id: 'includeAssignedFormParts', label: 'Zugeordnete Formteile', default: true },
      { id: 'includeSpecialComponents', label: 'Sonderbauteile', default: true },
      { id: 'includeSummary', label: 'Gesamtzusammenfassung', default: true },
      { id: 'includeQualityProtocol', label: 'QS-Prüfprotokoll', default: true },
      { id: 'includeFormPartCatalog', label: 'Anhang – Formteilübersicht', default: true },
      { id: 'includeApproval', label: 'Prüfung / Freigabe', default: true },
      { id: 'includeInfo', label: 'Anlageninformationen / Hinweise', default: true },
    ];
  }


  getReportOptionPresets() {
    return [
      {
        id: 'full',
        title: 'Vollbericht',
        description: 'Alle Seiten inkl. QS, Anhang und Freigabe.',
        options: {
          includeToc: true,
          includeMainNetwork: true,
          includeAssignedFormParts: true,
          includeSpecialComponents: true,
          includeSummary: true,
          includeQualityProtocol: true,
          includeFormPartCatalog: true,
          includeApproval: true,
          includeInfo: true,
        },
      },
      {
        id: 'calculation',
        title: 'Berechnungsnachweis',
        description: 'Technischer Nachweis mit Haupttabellen und Zusammenfassung.',
        options: {
          includeToc: true,
          includeMainNetwork: true,
          includeAssignedFormParts: true,
          includeSpecialComponents: true,
          includeSummary: true,
          includeQualityProtocol: false,
          includeFormPartCatalog: false,
          includeApproval: false,
          includeInfo: true,
        },
      },
      {
        id: 'short',
        title: 'Kurzbericht',
        description: 'Kompakte Abgabe mit Deckblatt, Zusammenfassung und Freigabe.',
        options: {
          includeToc: false,
          includeMainNetwork: false,
          includeAssignedFormParts: false,
          includeSpecialComponents: false,
          includeSummary: true,
          includeQualityProtocol: false,
          includeFormPartCatalog: false,
          includeApproval: true,
          includeInfo: true,
        },
      },
      {
        id: 'qs',
        title: 'QS intern',
        description: 'Für interne Kontrolle mit Prüfprotokoll und Anhang.',
        options: {
          includeToc: true,
          includeMainNetwork: true,
          includeAssignedFormParts: true,
          includeSpecialComponents: true,
          includeSummary: true,
          includeQualityProtocol: true,
          includeFormPartCatalog: true,
          includeApproval: false,
          includeInfo: false,
        },
      },
    ];
  }

  getActiveReportPreset(project) {
    const options = this.getDefaultReportOptions().reduce((result, option) => {
      result[option.id] = project?.reportOptions?.[option.id] !== false;
      return result;
    }, {});

    return this.getReportOptionPresets().find(preset =>
      Object.entries(preset.options).every(([key, value]) => Boolean(options[key]) === Boolean(value))
    )?.id || 'custom';
  }

  renderReportPresetButtons(project) {
    const activePreset = this.getActiveReportPreset(project);

    return `
      <div class="dp-report-preset-grid">
        ${this.getReportOptionPresets().map(preset => `
          <button
            type="button"
            class="dp-report-preset ${activePreset === preset.id ? 'active' : ''}"
            data-report-preset="${this.escapeAttribute(preset.id)}">
            <strong>${this.escapeHtml(preset.title)}</strong>
            <span>${this.escapeHtml(preset.description)}</span>
          </button>
        `).join('')}
        ${activePreset === 'custom' ? `
          <div class="dp-report-preset dp-report-preset-custom active">
            <strong>Benutzerdefiniert</strong>
            <span>Der Berichtsumfang wurde manuell angepasst.</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderReportOptionCheckbox(option, project) {
    const checked = project.reportOptions?.[option.id] !== false;

    return `
      <label class="dp-report-option">
        <input type="checkbox" data-report-option="${this.escapeAttribute(option.id)}" ${checked ? 'checked' : ''}>
        <span>${this.escapeHtml(option.label)}</span>
      </label>
    `;
  }


  getReportRevisionHistoryRows(report = {}) {
    const rows = Array.isArray(report.revisionHistory) ? report.revisionHistory : [];
    const normalized = rows.map(row => ({
      revision: row?.revision ?? row?.rev ?? '',
      date: row?.date ?? row?.datum ?? '',
      author: row?.author ?? row?.bearbeiter ?? '',
      change: row?.change ?? row?.description ?? row?.comment ?? '',
    }));

    while (normalized.length < 4) {
      normalized.push({ revision: '', date: '', author: '', change: '' });
    }

    return normalized.slice(0, 6);
  }

  renderRevisionHistoryEditor(report = {}) {
    const rows = this.getReportRevisionHistoryRows(report);

    return `
      <div class="dp-report-revision-editor">
        <div class="dp-report-revision-head">
          <strong>Revisionsverlauf</strong>
          <span>Diese Tabelle erscheint auf der Seite „Prüfung / Freigabe“.</span>
        </div>
        <div class="dp-report-revision-table-wrap">
          <table class="dp-report-revision-table">
            <thead>
              <tr><th>Revision</th><th>Datum</th><th>Bearbeiter</th><th>Änderung / Bemerkung</th></tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr>
                  <td><input data-report-revision-index="${index}" data-report-revision-field="revision" value="${this.escapeAttribute(row.revision)}"></td>
                  <td><input data-report-revision-index="${index}" data-report-revision-field="date" value="${this.escapeAttribute(row.date)}"></td>
                  <td><input data-report-revision-index="${index}" data-report-revision-field="author" value="${this.escapeAttribute(row.author)}"></td>
                  <td><input data-report-revision-index="${index}" data-report-revision-field="change" value="${this.escapeAttribute(row.change)}"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderReportSettingsEditor(project, system = null) {
    const report = this.ensureReportData(project, system);
    const settings = project.settings || {};

    return `
      <section class="dp-editor-panel dp-report-settings no-print">
        <div class="dp-panel-header">
          <div>
            <h2>Berichtsangaben</h2>
            <p>Diese Angaben erscheinen auf dem Deckblatt und in den Anlageninformationen.</p>
          </div>
        </div>

        <div class="dp-report-settings-group">
          <h3>Projekt / Anlage</h3>
          <div class="dp-editor-grid dp-report-settings-grid">
            <label>
              <span>Projektnummer</span>
              <input data-report-field="project" value="${this.escapeAttribute(report.project)}">
            </label>

            <label>
              <span>Projektname</span>
              <input data-report-field="object" value="${this.escapeAttribute(report.object)}">
            </label>

            <label>
              <span>BKP-Nummer</span>
              <input data-report-field="anlageNumber" value="${this.escapeAttribute(report.anlageNumber)}">
            </label>

            <label>
              <span>Anlage</span>
              <input data-report-field="anlage" value="${this.escapeAttribute(report.anlage)}">
            </label>

            <label>
              <span>Bearbeiter</span>
              <input data-report-field="bearbeiter" value="${this.escapeAttribute(report.bearbeiter)}">
            </label>

            <label>
              <span>Datum</span>
              <input data-report-field="datum" value="${this.escapeAttribute(report.datum)}">
            </label>
          </div>
        </div>

        <div class="dp-report-settings-group">
          <h3>Prüfung / Freigabe</h3>
          <div class="dp-editor-grid dp-report-settings-grid">
            <label>
              <span>Bericht-Nr.</span>
              <input data-report-field="reportNumber" value="${this.escapeAttribute(report.reportNumber)}">
            </label>

            <label>
              <span>Revision</span>
              <input data-report-field="revision" value="${this.escapeAttribute(report.revision)}">
            </label>

            <label>
              <span>Geprüft von</span>
              <input data-report-field="checkedBy" value="${this.escapeAttribute(report.checkedBy)}">
            </label>

            <label>
              <span>Freigegeben von</span>
              <input data-report-field="approvedBy" value="${this.escapeAttribute(report.approvedBy)}">
            </label>

            <label>
              <span>Freigabedatum</span>
              <input data-report-field="approvalDate" value="${this.escapeAttribute(report.approvalDate)}">
            </label>
          </div>
          ${this.renderRevisionHistoryEditor(report)}
        </div>

        <div class="dp-report-settings-group">
          <h3>Berechnungsgrundlagen / Hinweis</h3>
          <div class="dp-editor-grid dp-report-settings-grid">
            <label>
              <span>Luftdichte ρ [kg/m³]</span>
              <input data-report-setting="rho" type="number" step="0.01" value="${this.escapeAttribute(settings.rho ?? 1.21)}">
            </label>

            <label>
              <span>Reibungszahl λ [-]</span>
              <input data-report-setting="lambda" type="number" step="0.001" value="${this.escapeAttribute(settings.lambda ?? 0.025)}">
            </label>

            <label class="dp-report-settings-wide">
              <span>Bemerkung / Hinweis</span>
              <textarea data-report-field="hinweis" rows="3">${this.escapeHtml(report.hinweis)}</textarea>
            </label>
          </div>
        </div>

        <div class="dp-report-settings-group">
          <h3>Berichtsumfang</h3>
          <p class="dp-report-settings-note">Wähle eine Vorlage oder stelle die Seiten manuell zusammen. Das Deckblatt bleibt immer aktiv.</p>
          ${this.renderReportPresetButtons(project)}
          <div class="dp-report-options-grid">
            ${this.getDefaultReportOptions().map(option => this.renderReportOptionCheckbox(option, project)).join('')}
          </div>
        </div>

        <p class="dp-auto-save-hint">Änderungen werden automatisch gespeichert und im Bericht aktualisiert.</p>
      </section>
    `;
  }

  bindReportSettingsEditor(project) {
    if (!project) return;

    this.root.querySelectorAll('[data-report-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.reportField;
        const value = input.value;

        if (!project.report || typeof project.report !== 'object') project.report = {};
        project.report[field] = value;

        if (field === 'project') project.name = value || 'Unbenanntes Projekt';
        if (field === 'object') project.object = value;
        if (field === 'anlageNumber') project.anlageNumber = value;
        if (field === 'anlage' && this.state.selectedSystem) this.state.selectedSystem.name = value || 'Anlage';
        if (field === 'bearbeiter') project.author = value;
        if (field === 'datum') project.date = value;
        if (field === 'hinweis') project.note = value;
        if (field === 'reportNumber') project.reportNumber = value;
        if (field === 'revision') project.revision = value;
        if (field === 'checkedBy') project.checkedBy = value;
        if (field === 'approvedBy') project.approvedBy = value;
        if (field === 'approvalDate') project.approvalDate = value;

        this.state.markProjectDirty();
        this.render();
      });
    });

    this.root.querySelectorAll('[data-report-revision-index]').forEach(input => {
      input.addEventListener('change', () => {
        const index = Number(input.dataset.reportRevisionIndex);
        const field = input.dataset.reportRevisionField;

        if (!Number.isInteger(index) || !field) return;
        if (!project.report || typeof project.report !== 'object') project.report = {};
        if (!Array.isArray(project.report.revisionHistory)) project.report.revisionHistory = [];
        if (!project.report.revisionHistory[index]) {
          project.report.revisionHistory[index] = { revision: '', date: '', author: '', change: '' };
        }

        project.report.revisionHistory[index][field] = input.value;
        project.report.revisionHistory = project.report.revisionHistory.filter(row =>
          ['revision', 'date', 'author', 'change'].some(key => String(row?.[key] ?? '').trim())
        );

        project.revisionHistory = project.report.revisionHistory;
        this.state.markProjectDirty();
        this.render();
      });
    });

    this.root.querySelectorAll('[data-report-preset]').forEach(button => {
      button.addEventListener('click', () => {
        const presetId = button.dataset.reportPreset;
        const preset = this.getReportOptionPresets().find(item => item.id === presetId);

        if (!preset) return;
        if (!project.reportOptions || typeof project.reportOptions !== 'object') {
          project.reportOptions = {};
        }

        this.getDefaultReportOptions().forEach(option => {
          project.reportOptions[option.id] = preset.options[option.id] !== false;
        });

        project.reportPreset = preset.id;
        this.state.markProjectDirty();
        this.render();
      });
    });

    this.root.querySelectorAll('[data-report-option]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.reportOption;

        if (!project.reportOptions || typeof project.reportOptions !== 'object') {
          project.reportOptions = {};
        }

        project.reportOptions[field] = input.checked;
        project.reportPreset = this.getActiveReportPreset(project);
        this.state.markProjectDirty();
        this.render();
      });
    });

    this.root.querySelectorAll('[data-report-setting]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.reportSetting;
        const number = Number(String(input.value).replace(',', '.'));

        if (!Number.isFinite(number)) return;
        if (!project.settings || typeof project.settings !== 'object') project.settings = {};

        project.settings[field] = number;
        this.autoCalculateProject({ notify: false });
        this.state.markProjectDirty();
        this.render();
      });
    });
  }

  getReportActionLabel(action) {
    if (action === 'print') return 'PDF/Druck';
    if (action === 'html') return 'HTML-Bericht';
    if (action === 'csv') return 'CSV-Datenexport';
    return 'Export';
  }

  confirmReportExport(model, action) {
    const checklist = ReportEngine.createExportChecklist(model);
    const actionLabel = this.getReportActionLabel(action);

    if (checklist.status === 'ok') return true;

    const failedItems = checklist.items
      .filter(item => item.status !== 'ok')
      .map(item => `• ${item.label}: ${item.warning}`)
      .join('\n');

    if (checklist.status === 'error') {
      alert(`Der Export „${actionLabel}“ wurde gesperrt.\n\nBitte zuerst korrigieren:\n${failedItems}`);
      return false;
    }

    return confirm(`Der Export „${actionLabel}“ enthält noch Hinweise.\n\n${failedItems}\n\nTrotzdem fortfahren?`);
  }

  bindReportActions(model) {
    this.root.querySelectorAll('[data-report-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.reportAction;

        if (!this.confirmReportExport(model, action)) return;

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = action === 'html' ? 'HTML wird erstellt…' : originalText;

        try {
          if (action === 'print') {
            ReportEngine.openPrintWindow(model);
            return;
          }

          if (action === 'html') {
            await ReportEngine.downloadHtml(model);
            return;
          }

          if (action === 'csv') {
            ReportEngine.downloadCsv(model);
          }
        } catch (error) {
          alert(error.message);
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  renderSpecialComponent(component) {
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const components = system?.specialComponents || [];
    const index = components.findIndex(item => item.id === component?.id);
    const library = typeof this.commands.getSpecialComponentLibrary === 'function'
      ? this.commands.getSpecialComponentLibrary()
      : [];
    const normalized = typeof this.commands.normalizeSpecialComponent === 'function'
      ? this.commands.normalizeSpecialComponent(component)
      : component;
    const totalLoss = this.getSpecialComponentTotalLoss(normalized);
    const unitLoss = Number(normalized?.unitPressureLoss ?? normalized?.pressureLoss ?? normalized?.pa ?? 0);
    const quantity = Number(normalized?.quantity ?? 1) || 1;

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>${this.escapeHtml(normalized?.name ?? 'Sonderbauteil')}</h1>
          <p>Sonderbauteil bearbeiten, einer Teilstrecke zuweisen und den Druckverlust erfassen.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-special-action="duplicate" data-special-id="${this.escapeAttribute(normalized?.id)}">Duplizieren</button>
          <button type="button" data-special-action="up" data-special-id="${this.escapeAttribute(normalized?.id)}" ${index <= 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-special-action="down" data-special-id="${this.escapeAttribute(normalized?.id)}" ${index < 0 || index >= components.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="danger" data-special-action="delete" data-special-id="${this.escapeAttribute(normalized?.id)}">Löschen</button>
        </div>
      </div>

      ${this.renderSpecialComponentWarnings(normalized)}

      <section class="dp-editor-panel dp-special-editor-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Eingabedaten</h2>
            <p>Druckverlust wird automatisch aus Anzahl × Druckverlust je Stück berechnet.</p>
          </div>
          <span class="dp-chip">Sonderbauteil</span>
        </div>

        <div class="dp-editor-grid">
          <label>
            <span>Name</span>
            <input data-special-field="name" value="${this.escapeAttribute(normalized?.name ?? '')}">
          </label>

          <label>
            <span>Bauteiltyp</span>
            <select data-special-field="componentType">
              ${library.map(item => `
                <option value="${this.escapeAttribute(item.id)}" ${normalized?.componentType === item.id ? 'selected' : ''}>${this.escapeHtml(item.name)}</option>
              `).join('')}
            </select>
          </label>

          <label>
            <span>Kategorie</span>
            <input data-special-field="category" value="${this.escapeAttribute(normalized?.category ?? '')}">
          </label>

          <label>
            <span>Typ / Beschreibung</span>
            <input data-special-field="type" value="${this.escapeAttribute(normalized?.type ?? '')}">
          </label>

          <label>
            <span>Zugeordnete Teilstrecke</span>
            <select data-special-field="sectionId">
              <option value="" ${!normalized?.sectionId ? 'selected' : ''}>Anlage / nicht zugeordnet</option>
              ${(system?.sections || []).map(section => `
                <option value="${this.escapeAttribute(section.id)}" ${normalized?.sectionId === section.id ? 'selected' : ''}>${this.escapeHtml(section.name || section.id)}</option>
              `).join('')}
            </select>
          </label>

          <label>
            <span>Luftmenge [m³/h]</span>
            <input data-special-field="q" type="number" step="1" value="${this.formatAirflowInput(normalized?.q ?? 0)}">
          </label>

          <label>
            <span>Anzahl</span>
            <input data-special-field="quantity" type="number" step="1" min="1" value="${this.escapeAttribute(quantity)}">
          </label>

          <label>
            <span>Druckverlust je Stück [Pa]</span>
            <input data-special-field="unitPressureLoss" type="number" step="0.1" value="${this.escapeAttribute(unitLoss)}">
          </label>

          <label>
            <span>Hersteller</span>
            <input data-special-field="manufacturer" value="${this.escapeAttribute(normalized?.manufacturer ?? '')}">
          </label>

          <label>
            <span>Modell / Typ-Nr.</span>
            <input data-special-field="model" value="${this.escapeAttribute(normalized?.model ?? '')}">
          </label>

          <label class="dp-project-meta-wide">
            <span>Bemerkung / Datenblatt-Hinweis</span>
            <textarea data-special-field="note" rows="3">${this.escapeHtml(normalized?.note ?? '')}</textarea>
          </label>
        </div>

        <p class="dp-auto-calc-note">Änderungen werden automatisch übernommen und in Bericht sowie Gesamtberechnung berücksichtigt.</p>
      </section>

      <section class="dp-result-panel dp-special-result-panel">
        <h2>Ergebnis Sonderbauteil</h2>
        <div class="dp-result-cards">
          <div class="dp-result-card">
            <span>Luftmenge</span>
            <strong>${this.formatAirflow(normalized?.q ?? 0)} m³/h</strong>
          </div>
          <div class="dp-result-card">
            <span>Anzahl</span>
            <strong>${quantity}</strong>
          </div>
          <div class="dp-result-card">
            <span>je Stück</span>
            <strong>${this.formatNumber(unitLoss, 1)} Pa</strong>
          </div>
          <div class="dp-result-card dp-result-card-total">
            <span>Gesamt</span>
            <strong>${this.formatNumber(totalLoss, 1)} Pa</strong>
          </div>
        </div>
      </section>
    `;

    this.bindSpecialComponentEditor(normalized);
    this.bindSpecialComponentManagement();
  }

  renderSpecialComponentWarnings(component = {}) {
    const warnings = [];
    const q = Number(component?.q ?? 0);
    const quantity = Number(component?.quantity ?? 1);
    const unitLoss = Number(component?.unitPressureLoss ?? component?.pressureLoss ?? 0);

    if (!component?.name) warnings.push('Name des Sonderbauteils fehlt.');
    if (!(q > 0)) warnings.push('Luftmenge fehlt oder ist 0 m³/h.');
    if (!(quantity > 0)) warnings.push('Anzahl muss grösser 0 sein.');
    if (!(unitLoss >= 0)) warnings.push('Druckverlust je Stück darf nicht negativ sein.');

    if (!warnings.length) return '';

    return `
      <div class="dp-validation-box warning">
        <strong>Hinweise prüfen</strong>
        <ul>${warnings.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
      </div>
    `;
  }

  bindSpecialComponentEditor(component = {}) {
    this.root.querySelectorAll('[data-special-field]').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.specialField;
        const value = input.type === 'number' ? Number(input.value) : input.value;

        if (field === 'componentType') {
          const preset = this.commands.getSpecialComponentLibrary?.().find(item => item.id === value);
          component.componentType = value;

          if (preset) {
            component.type = preset.type;
            component.category = preset.category;
            if (!component.name || component.name === 'Sonderbauteil' || /Kopie$/.test(component.name)) {
              component.name = preset.name;
            }
            if (!Number(component.unitPressureLoss)) {
              component.unitPressureLoss = Number(preset.unitPressureLoss ?? 0);
            }
            if (!component.note) component.note = preset.note || '';
          }
        } else {
          component[field] = value;
        }

        this.updateSpecialComponentPressureLoss(component);
        this.autoCalculateProject();
      });
    });
  }

  updateSpecialComponentPressureLoss(component = {}) {
    const quantity = Math.max(1, Number(component.quantity ?? 1) || 1);
    const unitLoss = Math.max(0, Number(component.unitPressureLoss ?? component.singlePressureLoss ?? component.pressureLoss ?? component.pa ?? 0) || 0);

    component.quantity = quantity;
    component.unitPressureLoss = unitLoss;
    component.pressureLoss = unitLoss * quantity;
    component.pa = component.pressureLoss;
    component.q = Number(component.q ?? component.airflow ?? 0) || 0;
    component.airflow = component.q;

    return component;
  }

  getSpecialComponentTotalLoss(component = {}) {
    if (!component) return 0;
    const quantity = Math.max(1, Number(component.quantity ?? 1) || 1);
    const unitLoss = Number(component.unitPressureLoss ?? component.singlePressureLoss);

    if (Number.isFinite(unitLoss)) return unitLoss * quantity;

    return Number(component.pressureLoss ?? component.pa ?? component.totalPressureLoss ?? 0) || 0;
  }

  sumSpecialComponentLoss(components = []) {
    return components.reduce((sum, component) => sum + this.getSpecialComponentTotalLoss(component), 0);
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