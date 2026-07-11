// Druckverlust Pro – WorkspaceComponent
// Zeigt den Arbeitsbereich passend zur aktuellen Auswahl.

import ProjectCalculationService from '../../project/ProjectCalculationService.js';
import { calculateSection } from '../../core/CalculationEngine.js';
import { createDefaultFormPartRegistry } from '../../formteile/FormPartRegistry.js';
import ProjectCommands from '../../app/ProjectCommands.js';
import ReportEngine from '../../report/ReportEngine.js?v=19.11';
import ProjectDiagnostics from '../../diagnostics/ProjectDiagnostics.js';
import DeploymentDiagnostics from '../../diagnostics/DeploymentDiagnostics.js';
import CalculationDiagnostics from '../../diagnostics/CalculationDiagnostics.js';
import ProjectFileDiagnostics from '../../diagnostics/ProjectFileDiagnostics.js';
import ReleaseCandidateDiagnostics from '../../diagnostics/ReleaseCandidateDiagnostics.js';
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
    this.formPartLibraryFit = 'all';
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

    if (selection.type === 'help') return this.renderHelp(selection.data);
    if (selection.type === 'project') return this.renderProject(selection.data);
    if (selection.type === 'system') return this.renderSystem(selection.data);
    if (selection.type === 'section') return this.renderSection(selection.data);
    if (selection.type === 'formPartPicker') return this.renderFormPartPicker();
    if (selection.type === 'report') return this.renderReport();
    if (selection.type === 'deploymentCheck') return this.renderDeploymentCheck(selection.data || this.state.deploymentCheck);
    if (selection.type === 'calculationCheck') return this.renderCalculationCheck(selection.data || this.state.calculationCheck);
    if (selection.type === 'projectFileCheck') return this.renderProjectFileCheck(selection.data || this.state.projectFileCheck);
    if (selection.type === 'releaseCandidateCheck') return this.renderReleaseCandidateCheck(selection.data || this.state.releaseCandidateCheck);
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


  renderHelp(context = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0] || null;
    const sectionCount = system?.sections?.length || 0;
    const formPartCount = system?.formParts?.length || 0;
    const specialCount = system?.specialComponents?.length || 0;
    const isDemo = Boolean(project?.demo?.isDemoProject);

    this.root.innerHTML = `
      <div class="workspace-header dp-help-header">
        <div>
          <span class="dp-overline">Bedienungsanleitung</span>
          <h1>Druckverlust Pro richtig benutzen</h1>
          <p>Kurzer Leitfaden für Projektstart, Teilstrecken, Formteile, Sonderbauteile, QS und Bericht – mit Demo und Beispielwerten.</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-help-action="project">Projekt öffnen</button>
          <button type="button" data-help-action="demo">Demo laden</button>
          <button type="button" data-help-action="demo-report">Beispielbericht</button>
        </div>
      </div>

      <section class="dp-help-hero">
        <div>
          <h2>Schnellstart in 4 Schritten</h2>
          <p>Arbeite von links nach rechts: Projektdaten → Teilstrecken → Formteile/Sonderbauteile → Bericht. Die Berechnung läuft automatisch im Hintergrund.</p>
        </div>
        <div class="dp-help-status">
          <span>${isDemo ? 'Demo-Projekt aktiv' : 'Aktueller Stand'}</span>
          <strong>${this.escapeHtml(sectionCount)} TS · ${this.escapeHtml(formPartCount)} Formteile · ${this.escapeHtml(specialCount)} Sonderbauteile</strong>
        </div>
      </section>

      <section class="dp-help-grid" aria-label="Kurzanleitung">
        <article>
          <span>01</span>
          <h3>Projekt erfassen</h3>
          <p>Projektnummer, Projektname, BKP-Nummer und Anlage eintragen. Diese Angaben erscheinen im Bericht und im Dateinamen.</p>
          <button type="button" data-help-action="project">Zu den Projektangaben</button>
        </article>
        <article>
          <span>02</span>
          <h3>Teilstrecken eingeben</h3>
          <p>Kanal oder Rohr wählen, Luftmenge, Länge und Abmessungen erfassen. Geschwindigkeit und Reibungsverlust werden automatisch berechnet.</p>
          <button type="button" data-help-action="system">Zur Anlagenübersicht</button>
        </article>
        <article>
          <span>03</span>
          <h3>Formteile ergänzen</h3>
          <p>Formteil auswählen und Teilstrecke zuordnen. Grössen und Luftmengen können automatisch aus den Teilstrecken übernommen werden.</p>
          <button type="button" data-help-action="formparts">Formteil-Assistent öffnen</button>
        </article>
        <article>
          <span>04</span>
          <h3>Bericht erstellen</h3>
          <p>Berechnung prüfen, Projekt-QS kontrollieren und danach den Bericht öffnen. Im Bericht kann über Drucken / PDF gespeichert werden.</p>
          <button type="button" data-help-action="report">Bericht öffnen</button>
        </article>
      </section>

      <section class="dp-help-panel dp-help-demo-panel">
        <div>
          <span class="dp-overline">Demo / Beispielnachweis</span>
          <h2>Erst testen, dann eigenes Projekt aufbauen</h2>
          <p>Das Demo-Projekt enthält eine kleine Zuluftanlage mit Hauptkanal, Übergang, Rundrohr, Abzweig, Sonderbauteilen und Berichtsdaten. Damit kannst du die Bedienung und den PDF-Nachweis direkt prüfen.</p>
        </div>
        <div class="dp-help-demo-actions">
          <button type="button" data-help-action="demo">Demo-Projekt laden</button>
          <button type="button" data-help-action="demo-report">Demo-Bericht öffnen</button>
        </div>
      </section>

      <section class="dp-help-panel">
        <div>
          <span class="dp-overline">Beispielwerte</span>
          <h2>Typische Eingaben im Tool</h2>
        </div>
        <div class="dp-help-example-grid" aria-label="Beispielwerte">
          <article><strong>Kanal-Teilstrecke</strong><span>q 3’200 m³/h · L 8.5 m · b/h 800 × 450 mm</span></article>
          <article><strong>Rohr-Teilstrecke</strong><span>q 1’200 m³/h · L 9.0 m · Ø 500 mm</span></article>
          <article><strong>Formteil</strong><span>Bogen / Übergang / Abzweig mit ζ-Wert und p_dyn</span></article>
          <article><strong>Sonderbauteil</strong><span>z. B. Filter 80 Pa oder Schalldämpfer 25 Pa</span></article>
        </div>
      </section>

      <section class="dp-help-panel">
        <div>
          <span class="dp-overline">Wichtige Eingaben</span>
          <h2>Was muss wo eingetragen werden?</h2>
        </div>
        <div class="dp-help-table" role="table" aria-label="Eingabefelder und Bedeutung">
          <div role="row"><strong role="cell">Teilstrecke</strong><span role="cell">Luftmenge m³/h, Länge m, Kanal b/h oder Rohr Ø. Die Eingabe erfolgt in m; Formteile übernehmen daraus mm-Werte.</span></div>
          <div role="row"><strong role="cell">Formteil</strong><span role="cell">Typ, zugehörige Teilstrecke, ζ-/Auswahlwerte und bei Bedarf Anschlussgrössen. Manuelle Anpassungen bleiben möglich.</span></div>
          <div role="row"><strong role="cell">Sonderbauteil</strong><span role="cell">Hersteller/Typ und bekannter Druckverlust in Pa. Dieser Wert wird direkt in die Gesamtsumme übernommen.</span></div>
          <div role="row"><strong role="cell">Bericht</strong><span role="cell">Bericht-Nr., Revision, Umfang und PDF-Druck über Browserdialog. Empfohlen: A4 Hochformat, 100 %, Hintergrundgrafiken aktivieren.</span></div>
        </div>
      </section>

      <section class="dp-help-panel dp-help-two-col">
        <div>
          <span class="dp-overline">Rechenverständnis</span>
          <h2>Was bedeutet welcher Druckverlust?</h2>
          <ul>
            <li><strong>Δp Kanal/Rohr</strong> = Reibungsverlust der geraden Teilstrecke.</li>
            <li><strong>Δp Formteil</strong> = ζ × p_dyn des zugeordneten Formteils.</li>
            <li><strong>Sonderbauteile</strong> = fixer Hersteller- oder Vorgabewert in Pa.</li>
            <li><strong>Gesamt</strong> = Teilstrecken + Formteile + Sonderbauteile.</li>
          </ul>
        </div>
        <div>
          <span class="dp-overline">QS</span>
          <h2>Vor dem Export kurz prüfen</h2>
          <ul>
            <li>Projektangaben vollständig?</li>
            <li>Alle Teilstrecken mit Luftmenge und Geometrie?</li>
            <li>Formteile den richtigen Teilstrecken zugeordnet?</li>
            <li>Sonderbauteile mit realistischem Pa-Wert?</li>
            <li>Gesamtdruckverlust im Bericht nachvollziehbar?</li>
          </ul>
        </div>
      </section>

      <section class="dp-help-panel dp-help-two-col">
        <div>
          <span class="dp-overline">PDF / Bericht</span>
          <h2>Sauber als PDF speichern</h2>
          <ul>
            <li>Bericht öffnen.</li>
            <li>Im Bericht auf <strong>Drucken / PDF</strong> klicken.</li>
            <li>A4 Hochformat und Skalierung 100 % wählen.</li>
            <li>Hintergrundgrafiken aktivieren, damit Logo und Tabellen sauber wirken.</li>
          </ul>
        </div>
        <div>
          <span class="dp-overline">Kurzbefehle</span>
          <h2>Schneller arbeiten</h2>
          <ul>
            <li><strong>Ctrl + S</strong> speichern</li>
            <li><strong>Ctrl + N</strong> neues Projekt</li>
            <li><strong>Ctrl + Enter</strong> neu berechnen</li>
            <li><strong>Ctrl + B / Ctrl + P</strong> Bericht öffnen</li>
            <li><strong>Alt + Home</strong> Startübersicht</li>
          </ul>
          <button type="button" data-help-action="copy-shortcuts">Kurzbefehle kopieren</button>
        </div>
      </section>

      <section class="dp-help-panel dp-help-note">
        <strong>Hinweis:</strong>
        <span>Die Autosicherung läuft lokal im Browser. Für die echte Ablage trotzdem regelmässig als <code>.dvp</code>-Datei speichern.</span>
      </section>
    `;

    this.bindHelpActions(context);
  }

  bindHelpActions(context = null) {
    this.root.querySelectorAll('[data-help-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.helpAction;
        const project = this.state.project;
        const system = this.state.selectedSystem || project?.systems?.[0] || null;

        if (action === 'project') {
          this.state.setSelection?.('project', project);
          this.state.notify?.();
          return;
        }

        if (action === 'system') {
          if (system && typeof this.state.selectSystem === 'function') this.state.selectSystem(system);
          else {
            this.state.setSelection?.('system', system || project);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'formparts') {
          if (typeof this.state.selectFormPartPicker === 'function') this.state.selectFormPartPicker(system);
          else {
            this.state.setSelection?.('formPartPicker', system);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'report') {
          this.autoCalculateProject({ notify: false });
          this.state.setSelection?.('report', system || project);
          this.state.notify?.();
          return;
        }

        if (action === 'demo') {
          window.location.href = 'app.html?demo=1';
          return;
        }

        if (action === 'demo-report') {
          window.location.href = 'app.html?demo=1&report=1';
          return;
        }

        if (action === 'copy-shortcuts') {
          const text = [
            'Druckverlust Pro – Tastaturkürzel',
            '',
            'Ctrl + S: Projekt speichern',
            'Ctrl + O: Projekt öffnen',
            'Ctrl + N: Neues Projekt',
            'Ctrl + Enter: Neu berechnen',
            'Ctrl + B oder Ctrl + P: Bericht öffnen',
            'Ctrl + D: ausgewähltes Element duplizieren',
            'Entf: ausgewähltes Element löschen',
            'Ctrl + Alt + ↑/↓: ausgewähltes Element verschieben',
            'Alt + Home: Startübersicht',
            'Esc: zurück zur Anlagenübersicht',
          ].join('\n');

          if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => alert('Kurzbefehle wurden kopiert.')).catch(() => alert(text));
          } else {
            alert(text);
          }
        }
      });
    });
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

  renderUiGuidancePanel(project = null, system = null, context = 'system') {
    if (!project) return '';

    const activeSystem = system || this.state.selectedSystem || project?.systems?.[0] || null;
    const steps = this.createUiGuidanceSteps(project, activeSystem, context);
    const nextOpen = steps.find(step => step.status !== 'ok') || steps[steps.length - 1];

    return `
      <section class="dp-editor-panel dp-ui-guide-panel dp-ui-guide-${this.escapeAttribute(context)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Bedienführung</span>
            <h2>Was als Nächstes?</h2>
            <p>${this.escapeHtml(nextOpen?.hint || 'Projekt Schritt für Schritt fertigstellen.')}</p>
          </div>
          <span class="dp-ui-guide-badge ${this.escapeAttribute(nextOpen?.status || 'ok')}">${this.escapeHtml(nextOpen?.badge || 'OK')}</span>
        </div>

        <div class="dp-ui-guide-grid">
          ${steps.map(step => `
            <button type="button" class="dp-ui-guide-step ${this.escapeAttribute(step.status)}" data-ui-guide-action="${this.escapeAttribute(step.action)}">
              <span class="dp-ui-guide-number">${this.escapeHtml(step.number)}</span>
              <strong>${this.escapeHtml(step.title)}</strong>
              <em>${this.escapeHtml(step.detail)}</em>
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  createUiGuidanceSteps(project = null, system = null, context = 'system') {
    const meta = this.ensureProjectMeta(project, system);
    const sections = system?.sections || [];
    const formParts = system?.formParts || [];
    const specialComponents = system?.specialComponents || [];
    const calculation = project?.calculationResult?.calculation || null;
    const requiredFields = this.getProjectRequiredFields(meta);
    const missingRequired = requiredFields.filter(field => field.missing);
    const relevantSections = sections.filter(section => this.isSectionRelevant(section));
    const assignedFormParts = formParts.filter(part => part?.sectionId && sections.some(section => section.id === part.sectionId));
    const formPartWarnings = formParts.filter(part => this.getFormPartValidationWarnings(part).length).length;
    const projectCheck = ProjectDiagnostics.create(project, { system });
    const calcCheck = CalculationDiagnostics.create(project, { system });
    const fileCheck = ProjectFileDiagnostics.create(project);

    const stepStatus = (isOk, isWarning = false) => isOk ? 'ok' : (isWarning ? 'warning' : 'open');

    return [
      {
        number: '1',
        action: 'project',
        title: 'Projektangaben',
        status: stepStatus(!missingRequired.length, missingRequired.length && missingRequired.length <= 2),
        badge: missingRequired.length ? `${missingRequired.length} offen` : 'OK',
        detail: missingRequired.length ? `${missingRequired.map(field => field.label).slice(0, 2).join(', ')} ergänzen` : 'Pflichtfelder vollständig',
        hint: missingRequired.length ? 'Zuerst Projektnummer, Projektname, BKP-Nummer und Anlage sauber eintragen.' : 'Projektangaben sind sauber erfasst.',
      },
      {
        number: '2',
        action: 'sections',
        title: 'Teilstrecken',
        status: stepStatus(relevantSections.length > 0, sections.length > 0),
        badge: `${relevantSections.length}/${sections.length}`,
        detail: sections.length ? `${relevantSections.length} berechnungsrelevant` : 'erste Teilstrecke erfassen',
        hint: 'Als Nächstes die Teilstrecken mit Luftmenge, Länge und Geometrie vollständig erfassen.',
      },
      {
        number: '3',
        action: 'formparts',
        title: 'Formteile',
        status: stepStatus(formParts.length > 0 && !formPartWarnings, formParts.length > 0),
        badge: formPartWarnings ? `${formPartWarnings} prüfen` : `${assignedFormParts.length}/${formParts.length}`,
        detail: formParts.length ? `${assignedFormParts.length} zugeordnet` : 'Formteile ergänzen',
        hint: 'Danach Formteile über die Bibliothek ergänzen und den passenden Teilstrecken zuordnen.',
      },
      {
        number: '4',
        action: 'checks',
        title: 'QS prüfen',
        status: stepStatus(projectCheck.status !== 'error' && calcCheck.status !== 'error' && fileCheck.status !== 'error', projectCheck.status === 'warning' || calcCheck.status === 'warning' || fileCheck.status === 'warning'),
        badge: [projectCheck.status, calcCheck.status, fileCheck.status].includes('error') ? 'Fehler' : ([projectCheck.status, calcCheck.status, fileCheck.status].includes('warning') ? 'Hinweis' : 'OK'),
        detail: 'Projekt-, Rechen- und Datei-QS',
        hint: 'Vor dem Bericht die QS-Prüfungen ausführen und Hinweise sauber abarbeiten.',
      },
      {
        number: '5',
        action: 'report',
        title: 'Bericht',
        status: stepStatus(Boolean(calculation) && projectCheck.status !== 'error' && calcCheck.status !== 'error', Boolean(calculation)),
        badge: calculation ? 'bereit' : 'offen',
        detail: specialComponents.length ? `${specialComponents.length} Sonderbauteil(e) enthalten` : 'PDF/Druck prüfen',
        hint: 'Zum Schluss Bericht öffnen, Druckpaket prüfen und PDF erzeugen.',
      },
    ];
  }

  getProjectRequiredFields(meta = {}) {
    return [
      { key: 'name', label: 'Projektnummer', value: meta.name, placeholders: ['Unbenannte Projektnummer', 'Unbenanntes Projekt'] },
      { key: 'object', label: 'Projektname', value: meta.object, placeholders: ['Projekt', 'Objekt'] },
      { key: 'anlageNumber', label: 'BKP-Nummer', value: meta.anlageNumber, placeholders: [] },
      { key: 'anlage', label: 'Anlage', value: meta.anlage, placeholders: ['Anlage'] },
    ].map(field => ({
      ...field,
      missing: this.isProjectRequiredValueMissing(field.value, field.placeholders),
    }));
  }

  isProjectRequiredValueMissing(value = '', placeholders = []) {
    const text = String(value ?? '').trim();
    if (!text) return true;
    return placeholders.some(placeholder => text.toLowerCase() === String(placeholder).toLowerCase());
  }

  renderRequiredMarker(value = '', placeholders = []) {
    const missing = this.isProjectRequiredValueMissing(value, placeholders);
    return `<em class="dp-required-marker ${missing ? 'missing' : 'ok'}">${missing ? 'Pflichtfeld' : 'OK'}</em>`;
  }

  getRequiredFieldClass(value = '', placeholders = []) {
    return `dp-required-field ${this.isProjectRequiredValueMissing(value, placeholders) ? 'missing' : 'ok'}`;
  }

  bindUiGuidancePanel(project = null, system = null) {
    this.root.querySelectorAll('[data-ui-guide-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.uiGuideAction;
        const activeProject = project || this.state.project;
        const activeSystem = system || this.state.selectedSystem || activeProject?.systems?.[0] || null;

        if (action === 'project') {
          this.state.setSelection?.('project', activeProject);
          this.state.notify?.();
          return;
        }

        if (action === 'sections') {
          if (activeSystem && typeof this.state.selectSystem === 'function') {
            this.state.selectSystem(activeSystem);
          } else if (activeSystem) {
            this.state.setSelection?.('system', activeSystem);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'formparts') {
          if (typeof this.state.selectFormPartPicker === 'function') {
            this.state.selectFormPartPicker(activeSystem);
          } else {
            this.state.setSelection?.('formPartPicker', activeSystem);
            this.state.notify?.();
          }
          return;
        }

        if (action === 'checks') {
          this.autoCalculateProject({ notify: false });
          const check = CalculationDiagnostics.create(activeProject, { system: activeSystem });
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'report') {
          this.autoCalculateProject({ notify: false });
          this.state.setSelection?.('report', activeSystem || activeProject);
          this.state.notify?.();
        }
      });
    });
  }

  renderProjectFilePanel(project = null) {
    const check = ProjectFileDiagnostics.create(project);
    const visibleItems = check.items.filter(item => item.status !== 'ok').slice(0, 5);
    const okCount = check.counts?.ok ?? 0;
    const sizeKb = Math.round((check.jsonSizeBytes || 0) / 1024);

    return `
      <section class="dp-editor-panel dp-file-check-panel dp-file-check-${this.escapeAttribute(check.status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Datei-QS</span>
            <h2>Projektdatei und Übergabeformat</h2>
            <p>${this.escapeHtml(check.summary)}</p>
          </div>
          <span class="dp-project-check-badge ${this.escapeAttribute(check.status)}">${this.escapeHtml(check.label)}</span>
        </div>

        <div class="dp-file-check-meta">
          <div>
            <span>Dateiname</span>
            <strong>${this.escapeHtml(check.fileName || '-')}</strong>
          </div>
          <div>
            <span>Schema</span>
            <strong>${this.escapeHtml(check.schemaVersion || '-')}</strong>
          </div>
          <div>
            <span>Grösse</span>
            <strong>${this.escapeHtml(sizeKb)} kB</strong>
          </div>
          <button type="button" data-file-check-action="open">Details öffnen</button>
        </div>

        ${visibleItems.length ? `
          <div class="dp-project-check-list compact">
            ${visibleItems.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-project-check-list compact">
            <div class="dp-project-check-item ok">
              <strong>OK-Punkte</strong>
              <span>${this.escapeHtml(okCount)} Prüfpunkt(e) ohne Hinweis.</span>
            </div>
          </div>
        `}
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

      ${this.renderUiGuidancePanel(project, activeSystem, 'project')}
      ${this.renderWorkflowDashboard(project, activeSystem, 'project')}
      ${this.renderProjectCheckPanel(project, activeSystem)}
      ${this.renderProjectFilePanel(project)}

      <section class="dp-editor-panel dp-project-meta-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Projektangaben</h2>
            <p>Diese Angaben werden zentral gespeichert und für Bericht, Export und Dateinamen verwendet.</p>
          </div>
          <span class="dp-chip">Phase 18</span>
        </div>

        <div class="dp-editor-grid dp-project-meta-grid">
          <label class="${this.getRequiredFieldClass(meta.name, ['Unbenannte Projektnummer', 'Unbenanntes Projekt'])}">
            <span>Projektnummer ${this.renderRequiredMarker(meta.name, ['Unbenannte Projektnummer', 'Unbenanntes Projekt'])}</span>
            <input data-project-field="name" value="${this.escapeAttribute(meta.name)}" aria-required="true">
          </label>

          <label class="${this.getRequiredFieldClass(meta.object, ['Projekt', 'Objekt'])}">
            <span>Projektname ${this.renderRequiredMarker(meta.object, ['Projekt', 'Objekt'])}</span>
            <input data-project-field="object" value="${this.escapeAttribute(meta.object)}" aria-required="true">
          </label>

          <label class="${this.getRequiredFieldClass(meta.anlageNumber)}">
            <span>BKP-Nummer ${this.renderRequiredMarker(meta.anlageNumber)}</span>
            <input data-project-field="anlageNumber" value="${this.escapeAttribute(meta.anlageNumber)}" aria-required="true">
          </label>

          <label class="${this.getRequiredFieldClass(meta.anlage, ['Anlage'])}">
            <span>Anlage ${this.renderRequiredMarker(meta.anlage, ['Anlage'])}</span>
            <input data-project-field="anlage" value="${this.escapeAttribute(meta.anlage)}" aria-required="true">
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
    this.bindUiGuidancePanel(project, activeSystem);
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

      ${this.renderUiGuidancePanel(this.state.project, system, 'system')}
      ${this.renderWorkflowDashboard(this.state.project, system, 'system')}
      ${this.renderProjectCheckPanel(this.state.project, system)}
      ${this.renderProjectFilePanel(this.state.project)}

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
      ${this.renderSectionQuickEditPanel(system)}
      ${this.renderFormPartManagement(system)}
      ${this.renderSpecialComponentManagement(system)}
      ${this.renderCalculationSummary(total)}
      ${this.renderCalculationBreakdown(calculation)}
      ${this.renderSectionResultDetailPanel(calculation)}
      ${this.renderCalculationAudit(calculation)}
      ${this.renderCalculationDiagnosticsPanel(calculation, system)}
      ${this.renderProjectValidationOverview(system)}
      ${this.renderCalculationTable(calculation)}
    `;

    this.bindUiGuidancePanel(this.state.project, system);
    this.bindWorkflowDashboard(this.state.project, system);
    this.bindProjectCheckPanel(this.state.project, system);
    this.bindCalculationDiagnosticsPanel(system);
    this.bindSectionManagement();
    this.bindSectionQuickEdit();
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
      ${this.renderSectionInputQuality(section)}

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
    this.bindSectionFormPartActions(section);
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

        this.syncAssignedFormPartsForSection(section);
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


  renderSectionQuickEditPanel(system = {}) {
    const sections = system?.sections || [];

    return `
      <section class="dp-editor-panel dp-section-quick-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Schnellerfassung</span>
            <h2>Teilstrecken kompakt bearbeiten</h2>
            <p>Luftmenge, Länge und Geometrie direkt in der Anlagenübersicht anpassen. Zugeordnete Formteile werden automatisch mitgeführt.</p>
          </div>
        </div>

        ${sections.length ? `
          <div class="dp-quick-table-wrap">
            <table class="dp-table dp-section-quick-table">
              <thead>
                <tr>
                  <th>TS</th>
                  <th>Typ</th>
                  <th>Luftmenge<br>[m³/h]</th>
                  <th>Länge<br>[m]</th>
                  <th>Breite<br>[m]</th>
                  <th>Höhe<br>[m]</th>
                  <th>Ø<br>[m]</th>
                  <th>v<br>[m/s]</th>
                  <th>Δp TS<br>[Pa]</th>
                </tr>
              </thead>
              <tbody>
                ${sections.map(section => this.renderSectionQuickEditRow(section)).join('')}
              </tbody>
            </table>
          </div>
          <p class="dp-auto-calc-note">Änderungen werden sofort berechnet. Bei zugeordneten Formteilen wird die Grössenübernahme automatisch aktualisiert, ausser das Formteil wurde bewusst manuell überschrieben.</p>
        ` : `
          <div class="dp-empty-state">Noch keine Teilstrecke vorhanden.</div>
        `}
      </section>
    `;
  }

  renderSectionQuickEditRow(section = {}) {
    const calculationItem = this.getCalculationItemBySectionId(section?.id);
    const result = calculationItem?.result || null;
    const isPipe = this.isPipeSection(section);
    const totalLoss = this.getSectionLossBreakdown(section?.id, result).totalLoss;
    const linked = this.getAssignedFormParts(section?.id).length;

    return `
      <tr class="dp-section-quick-row ${this.state.isSelected('section', section?.id) ? 'active' : ''}" data-section-id="${this.escapeAttribute(section?.id)}">
        <td>
          <button type="button" class="dp-link-button" data-section-action="select" data-section-id="${this.escapeAttribute(section?.id)}">
            ${this.escapeHtml(section?.name || section?.id || 'TS')}
          </button>
          ${linked ? `<span class="dp-quick-sync-chip">${linked} FT</span>` : ''}
        </td>
        <td>
          <select data-section-quick-field="type" data-section-id="${this.escapeAttribute(section?.id)}" aria-label="Typ ${this.escapeAttribute(section?.name || section?.id || '')}">
            <option value="duct" ${!isPipe ? 'selected' : ''}>Kanal</option>
            <option value="pipe" ${isPipe ? 'selected' : ''}>Rohr</option>
          </select>
        </td>
        <td><input data-section-quick-field="q" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="1" value="${this.formatAirflowInput(section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0)}"></td>
        <td><input data-section-quick-field="l" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="0.01" value="${this.escapeAttribute(section?.l ?? section?.length ?? 0)}"></td>
        <td><input data-section-quick-field="b" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="0.001" value="${this.escapeAttribute(section?.b ?? section?.width ?? 0)}" ${isPipe ? 'disabled' : ''}></td>
        <td><input data-section-quick-field="h" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="0.001" value="${this.escapeAttribute(section?.h ?? section?.height ?? 0)}" ${isPipe ? 'disabled' : ''}></td>
        <td><input data-section-quick-field="d" data-section-id="${this.escapeAttribute(section?.id)}" type="number" step="0.001" value="${this.escapeAttribute(section?.d ?? section?.diameter ?? 0)}" ${isPipe ? '' : 'disabled'}></td>
        <td>${result ? this.formatNumber(result.velocity, 2) : '-'}</td>
        <td><strong>${Number.isFinite(totalLoss) ? this.formatNumber(totalLoss, 1) : '-'}</strong></td>
      </tr>
    `;
  }

  bindSectionQuickEdit() {
    this.root.querySelectorAll('[data-section-quick-field]').forEach(input => {
      input.addEventListener('change', () => {
        const sectionId = input.dataset.sectionId;
        const field = input.dataset.sectionQuickField;
        const section = this.getSectionById(sectionId);

        if (!section || !field) return;

        if (field === 'type') {
          section.type = input.value === 'pipe' ? 'pipe' : 'duct';
        } else if (field === 'q') {
          section.q = Math.round(Number(input.value || 0));
        } else {
          section[field] = Number(input.value || 0);
        }

        this.syncAssignedFormPartsForSection(section);
        this.autoCalculateProject();
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
          this.formPartLibraryFit = 'all';
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
    const selectedSection = this.state.selectedSection || system?.sections?.[0] || null;
    const allGroups = this.getFormPartLibraryGroups({ ignoreFilters: true });
    const groups = this.getFormPartLibraryGroups();
    const filteredCount = groups.reduce((sum, group) => sum + group.items.length, 0);
    const audit = this.getFormPartLibraryAudit(allGroups);

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <h1>Formteil auswählen</h1>
          <p>Wähle zuerst ein Formteil aus der Bibliothek. Danach öffnet sich automatisch der passende Editor.</p>
          <p class="dp-library-context">Aktive Teilstrecke: <strong>${this.escapeHtml(selectedSection ? this.getSectionNameById(selectedSection.id) : 'keine')}</strong>${selectedSection ? ` · ${this.escapeHtml(this.getSectionShapeLabel(selectedSection))}` : ''}</p>
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

        ${this.renderFormPartLibrarySmartFilters(selectedSection)}

        ${this.renderFormPartLibraryAudit(audit)}

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

        ${groups.length ? groups.map(group => {
          const meta = this.getFormPartCategoryMeta(group.category);
          return `
          <div class="dp-formpart-library-group dp-formpart-library-group-${this.escapeAttribute(meta.key)}">
            <div class="dp-formpart-library-heading">
              <div>
                <h2><span aria-hidden="true">${this.escapeHtml(meta.icon)}</span> ${this.escapeHtml(meta.label)}</h2>
                <p>${this.escapeHtml(meta.description)}</p>
              </div>
              <span>${group.items.length} Formteil${group.items.length === 1 ? '' : 'e'}</span>
            </div>

            <div class="dp-formpart-card-grid">
              ${group.items.map(item => this.renderFormPartPickerCard(item, selectedSection)).join('')}
            </div>
          </div>
        `}).join('') : `
          <div class="dp-empty-state dp-library-empty">
            Keine Formteile zur aktuellen Suche gefunden. Passe Suche oder Kategorie an.
          </div>
        `}
      </section>
    `;

    this.bindFormPartPicker();
    this.bindFormPartImageFallbacks();
  }

  renderFormPartLibrarySmartFilters(selectedSection = null) {
    const active = this.formPartLibraryFit || 'all';
    const filters = [
      { id: 'all', label: 'Alle Formteile', help: 'Bibliothek ohne Zusatzfilter anzeigen.' },
      { id: 'section', label: 'Passend zur Teilstrecke', help: selectedSection ? `Filtert nach ${this.getSectionShapeLabel(selectedSection)}.` : 'Bitte zuerst eine Teilstrecke wählen.' },
      { id: 'alpha', label: 'mit α/β-Auswahl', help: 'Zeigt Formteile mit gesperrter Winkel-Auswahl statt freier Eingabe.' },
      { id: 'sync', label: 'mit Grössen-Sync', help: 'Zeigt Formteile, die Grössen/Luftmengen aus Teilstrecken übernehmen.' },
    ];

    return `
      <div class="dp-formpart-smartfilter">
        <div>
          <span class="dp-overline">Formteil-Assistent</span>
          <strong>Auswahl eingrenzen</strong>
          <p>${selectedSection ? `Auswahl bezogen auf ${this.escapeHtml(this.getSectionNameById(selectedSection.id))}.` : 'Ohne aktive Teilstrecke werden alle Formteile angezeigt.'}</p>
        </div>
        <div class="dp-formpart-smartfilter-buttons">
          ${filters.map(filter => `
            <button
              type="button"
              class="${active === filter.id ? 'active' : ''}"
              data-formpart-fit="${this.escapeAttribute(filter.id)}"
              title="${this.escapeAttribute(filter.help)}">
              ${this.escapeHtml(filter.label)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderFormPartLibraryAudit(audit = {}) {
    const warnings = audit.warnings || [];

    return `
      <div class="dp-formpart-audit">
        <div>
          <span class="dp-overline">Bibliotheks-QS</span>
          <strong>${this.escapeHtml(audit.total || 0)} Formteile · ${this.escapeHtml(audit.categories || 0)} Kategorien</strong>
          <p>${warnings.length ? `${warnings.length} Hinweis${warnings.length === 1 ? '' : 'e'} prüfen.` : 'Bilder, Auswahlfelder und Sync-Metadaten wirken vollständig.'}</p>
        </div>
        <div class="dp-formpart-audit-grid">
          <span><b>${this.escapeHtml(audit.withImages || 0)}</b> Bilder</span>
          <span><b>${this.escapeHtml(audit.withLockedAngles || 0)}</b> α/β-Auswahl</span>
          <span><b>${this.escapeHtml(audit.withAutoSync || 0)}</b> Auto-Sync</span>
          <span><b>${this.escapeHtml(audit.withConnections || 0)}</b> Anschluss-Sync</span>
        </div>
        ${warnings.length ? `
          <details class="dp-formpart-audit-details">
            <summary>Hinweise anzeigen</summary>
            <ul>${warnings.map(warning => `<li>${this.escapeHtml(warning)}</li>`).join('')}</ul>
          </details>
        ` : ''}
      </div>
    `;
  }

  getFormPartLibraryAudit(groups = []) {
    const items = groups.flatMap(group => group.items || []);
    const warnings = [];

    items.forEach(item => {
      if (!this.getFormPartImageSources(item).length) warnings.push(`${item.name || item.id}: keine Skizze hinterlegt.`);
      if (!Array.isArray(item.parameters) || !item.parameters.length) warnings.push(`${item.name || item.id}: keine Parameterdefinition hinterlegt.`);
    });

    return {
      total: items.length,
      categories: new Set(items.map(item => item.category || 'Weitere')).size,
      withImages: items.filter(item => this.getFormPartImageSources(item).length).length,
      withLockedAngles: items.filter(item => this.hasLockedAngleSelection(item)).length,
      withAutoSync: items.filter(item => this.supportsFormPartAutoSync(item)).length,
      withConnections: items.filter(item => this.getFormPartConnectionDefinitions({ type: item.id }).length).length,
      warnings,
    };
  }

  getFormPartCardMeta(item = {}, selectedSection = null) {
    const compatible = this.isFormPartCompatibleWithSection(item, selectedSection);
    const badges = [];

    badges.push({
      label: compatible ? 'passt zur TS' : 'andere Bauform',
      className: compatible ? 'ok' : 'muted',
    });

    if (this.hasLockedAngleSelection(item)) badges.push({ label: 'α/β Dropdown', className: 'ok' });
    if (this.supportsFormPartAutoSync(item)) badges.push({ label: 'Grössen-Sync', className: 'ok' });
    if (this.getFormPartConnectionDefinitions({ type: item.id }).length) badges.push({ label: 'Anschluss-Sync', className: 'ok' });
    if (this.getFormPartImageSources(item).length) badges.push({ label: 'Bild', className: 'soft' });

    return { compatible, badges };
  }

  getFormPartCategoryMeta(category = '') {
    const value = String(category || 'Weitere');
    const map = {
      Rund: { key: 'round', label: 'Rund / Rohr', icon: '◯', description: 'Bögen und Formteile für runde Rohre.' },
      Rechteck: { key: 'rect', label: 'Rechteck / Kanal', icon: '▭', description: 'Bögen und Formteile für rechteckige Kanäle.' },
      'Übergänge': { key: 'transition', label: 'Übergänge', icon: '⇄', description: 'Reduzierungen und Erweiterungen mit zwei Anschlussseiten.' },
      Abzweige: { key: 'branch', label: 'Abzweige / T-Stücke', icon: '┬', description: 'T-Stücke, Hosenstücke und Sattelstücke mit Haupt-/Abzweiganschlüssen.' },
      Spezial: { key: 'special', label: 'Spezialformteile', icon: '◆', description: 'Spezielle Formteile und Versätze.' },
    };

    return map[value] || { key: 'other', label: value, icon: '•', description: 'Weitere Formteile.' };
  }

  hasLockedAngleSelection(item = {}) {
    return (item.parameters || []).some(parameter => {
      const id = String(parameter?.id || parameter || '').toLowerCase();
      return ['alpha', 'beta'].includes(id) && parameter?.type === 'select' && Array.isArray(parameter.options) && parameter.options.length;
    });
  }

  supportsFormPartAutoSync(item = {}) {
    const ids = new Set((item.parameters || []).map(parameter => String(parameter?.id || parameter || '')));
    const direct = ['d', 'a', 'b', 'A_d', 'A_breite', 'A_hoehe', 'W'];
    const transition = ['A1_bauform', 'A2_bauform'];
    return direct.some(id => ids.has(id)) || transition.some(id => ids.has(id));
  }

  isFormPartCompatibleWithSection(item = {}, section = null) {
    if (!section) return true;

    const isPipe = this.isPipeSection(section);
    const category = String(item?.category || '');
    const ids = new Set((item.parameters || []).map(parameter => String(parameter?.id || parameter || '')));
    const hasShapeSelector = ids.has('bauform') || ids.has('A1_bauform') || ids.has('A2_bauform');

    if (hasShapeSelector) return true;
    if (isPipe) return category === 'Rund' || category === 'Übergänge' || category === 'Abzweige' || category === 'Spezial';
    return category === 'Rechteck' || category === 'Übergänge' || category === 'Abzweige' || category === 'Spezial';
  }

  getSectionShapeLabel(section = {}) {
    const geometry = this.getSectionGeometryForFormPart(section);
    if (geometry.isPipe) return `Rohr Ø ${this.formatNumber(geometry.diameterMm, 0)} mm · ${this.formatAirflow(geometry.q)} m³/h`;
    return `Kanal ${this.formatNumber(geometry.widthMm, 0)} × ${this.formatNumber(geometry.heightMm, 0)} mm · ${this.formatAirflow(geometry.q)} m³/h`;
  }

  truncateText(value = '', maxLength = 120) {
    const text = String(value || '').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
  }

  renderFormPartPickerCard(item, selectedSection = null) {
    const favorite = this.isLibraryFavorite('formpart', item.id);
    const cardMeta = this.getFormPartCardMeta(item, selectedSection);
    const description = String(item?.description || '').trim();

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
        <button class="dp-formpart-card ${cardMeta.compatible ? 'dp-formpart-card-compatible' : 'dp-formpart-card-muted'}" type="button" data-formpart-type="${this.escapeAttribute(item.id)}">
          <div class="dp-formpart-card-image">
            ${this.renderFormPartCardImage(item)}
          </div>
          <div class="dp-formpart-card-body">
            <span>${this.escapeHtml(item.category ?? 'Formteil')}</span>
            <strong>${this.escapeHtml(item.name)}</strong>
            ${description ? `<p>${this.escapeHtml(this.truncateText(description, 110))}</p>` : ''}
            <div class="dp-formpart-card-badges">
              ${cardMeta.badges.map(badge => `<em class="${this.escapeAttribute(badge.className || '')}">${this.escapeHtml(badge.label)}</em>`).join('')}
            </div>
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

    this.root.querySelectorAll('[data-formpart-fit]').forEach(button => {
      button.addEventListener('click', () => {
        this.formPartLibraryFit = button.dataset.formpartFit || 'all';
        this.render();
      });
    });

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
    const order = ['Rund', 'Rechteck', 'Übergänge', 'Abzweige', 'Spezial'];
    const groups = new Map();
    const search = options.ignoreFilters ? '' : String(this.formPartLibrarySearch || '').toLowerCase().trim();
    const selectedCategory = options.ignoreFilters ? 'all' : String(this.formPartLibraryCategory || 'all');
    const fitFilter = options.ignoreFilters ? 'all' : String(this.formPartLibraryFit || 'all');
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const selectedSection = this.state.selectedSection || system?.sections?.[0] || null;

    this.registry.all()
      .filter(item => {
        const category = item.category || 'Weitere';
        if (selectedCategory !== 'all' && category !== selectedCategory) return false;

        if (fitFilter === 'section' && !this.isFormPartCompatibleWithSection(item, selectedSection)) return false;
        if (fitFilter === 'alpha' && !this.hasLockedAngleSelection(item)) return false;
        if (fitFilter === 'sync' && !this.supportsFormPartAutoSync(item) && !this.getFormPartConnectionDefinitions({ type: item.id }).length) return false;

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
    const connectionAutoSizeResult = this.applyConnectionSectionsToFormPart(formPart);
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

        ${this.renderFormPartConnectionPanel(formPart, sections, connectionAutoSizeResult)}

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
          this.applyConnectionSectionsToFormPart(formPart);
        } else if (this.isFormPartConnectionSelectorField(field)) {
          this.applyConnectionSectionsToFormPart(formPart, { force: true, clearManualOverride: true });
        } else if (this.isFormPartAutoSizeField(field)) {
          formPart.autoSizeManualOverride = true;

          if (this.isFormPartConnectionAutoSizeField(field)) {
            formPart.connectionAutoSizeManualOverride = true;
          }
        }

        this.deriveAndStoreFormPart(formPart);
        this.calculateAndStoreFormPart(formPart, { silent: true });
        this.autoCalculateProject();
      });
    });

    this.root.querySelectorAll('[data-formpart-size-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.formpartSizeAction;

        let result = null;

        if (action === 'apply-section') {
          result = this.applySectionDimensionsToFormPart(formPart, { force: true, clearManualOverride: true });

          if (!result?.applied) {
            alert(result?.message || 'Es konnten keine Grössen aus der Teilstrecke übernommen werden.');
            return;
          }
        } else if (action === 'apply-connections') {
          result = this.applyConnectionSectionsToFormPart(formPart, { force: true, clearManualOverride: true });

          if (!result?.applied) {
            alert(result?.summary || result?.message || 'Es konnten keine zusätzlichen Anschlussgrössen übernommen werden.');
            return;
          }
        } else {
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

  renderFormPartConnectionPanel(formPart, sections = [], autoSizeResult = null) {
    const connections = this.getFormPartConnectionDefinitions(formPart);

    if (!connections.length) return '';

    const status = autoSizeResult?.status || formPart?.connectionAutoSize?.status || 'idle';
    const statusClass = this.escapeAttribute(status);
    const summary = autoSizeResult?.summary || formPart?.connectionAutoSize?.summary || 'Zusätzliche Anschlussgrössen können aus weiteren Teilstrecken übernommen werden.';
    const manual = Boolean(formPart?.connectionAutoSizeManualOverride);

    return `
      <section class="dp-formpart-connection-panel dp-connection-${statusClass}">
        <div class="dp-panel-header compact">
          <div>
            <span class="dp-overline">Anschluss-Synchronisation</span>
            <h3>Weitere Teilstrecken zuordnen</h3>
            <p>Für Übergänge, Abzweige und Hosenstücke können zusätzliche Anschlussseiten direkt aus anderen Teilstrecken übernommen werden.</p>
          </div>
        </div>

        <div class="dp-editor-grid dp-connection-grid">
          ${connections.map(connection => `
            <label>
              <span>${this.escapeHtml(connection.label)}</span>
              <select data-field="${this.escapeAttribute(connection.field)}">
                <option value="">manuell erfassen</option>
                ${sections.map(section => `
                  <option value="${this.escapeAttribute(section.id)}" ${formPart?.[connection.field] === section.id ? 'selected' : ''}>
                    ${this.escapeHtml(this.getSectionNameById(section.id))}
                  </option>
                `).join('')}
              </select>
              <p class="dp-field-hint">${this.escapeHtml(connection.help)}</p>
            </label>
          `).join('')}
        </div>

        <div class="dp-connection-summary">
          <span>${this.escapeHtml(summary)}${manual ? ' · manuell angepasst' : ''}</span>
          <button type="button" data-formpart-size-action="apply-connections">Anschlüsse übernehmen</button>
        </div>
      </section>
    `;
  }

  getFormPartConnectionDefinitions(formPart) {
    const entry = this.getRegistryEntry(formPart);
    const type = String(entry?.id || formPart?.type || '').toLowerCase();
    const connections = [];

    if (!entry) return connections;

    if (type.includes('uebergang_gross_klein')) {
      connections.push({
        field: 'transitionOtherSectionId',
        target: 'A1',
        label: 'Kleiner Anschluss A1 aus Teilstrecke',
        help: 'A2 kommt aus der Haupt-Teilstrecke. A1 kann optional aus einer zweiten Teilstrecke übernommen werden.',
      });
    } else if (type.includes('uebergang_klein_gross')) {
      connections.push({
        field: 'transitionOtherSectionId',
        target: 'A2',
        label: 'Grosser Anschluss A2 aus Teilstrecke',
        help: 'A1 kommt aus der Haupt-Teilstrecke. A2 kann optional aus einer zweiten Teilstrecke übernommen werden.',
      });
    }

    if (
      type.includes('hosenstueck') ||
      type.includes('t_abzweig') ||
      type.includes('t_stueck') ||
      type.includes('sattelstueck')
    ) {
      if (type.includes('durchgang')) {
        connections.push({
          field: 'throughSectionId',
          target: 'AD',
          airflow: 'WD',
          label: 'Durchgang AD/WD aus Teilstrecke',
          help: 'Grösse AD und Luftmenge WD werden aus der gewählten Durchgangs-Teilstrecke übernommen.',
        });
      }

      connections.push({
        field: 'branchSectionId',
        target: 'AA',
        airflow: 'WA',
        label: 'Abzweig AA/WA aus Teilstrecke',
        help: 'Grösse AA und Luftmenge WA werden aus der gewählten Abzweig-Teilstrecke übernommen.',
      });
    }

    return connections;
  }

  applyConnectionSectionsToFormPart(formPart, options = {}) {
    const entry = this.getRegistryEntry(formPart);

    if (!formPart || !entry) {
      return { applied: false, status: 'missing', message: 'Formteiltyp nicht gefunden.' };
    }

    const connections = this.getFormPartConnectionDefinitions(formPart);

    if (!connections.length) {
      return { applied: false, status: 'empty', message: 'Für diesen Formteiltyp sind keine zusätzlichen Anschluss-Teilstrecken vorgesehen.' };
    }

    const force = Boolean(options.force);
    const selected = connections.filter(connection => formPart?.[connection.field]);

    if (!selected.length) {
      formPart.connectionAutoSize = {
        status: 'idle',
        signature: '',
        fields: [],
        summary: 'Keine zusätzliche Anschluss-Teilstrecke gewählt.',
      };
      return { applied: false, status: 'idle', summary: formPart.connectionAutoSize.summary };
    }

    const signature = selected.map(connection => {
      const section = this.getSectionById(formPart?.[connection.field]);
      return `${connection.field}:${connection.target}:${this.getSectionAutoSizeSignature(section || {})}`;
    }).join('|');

    if (formPart.connectionAutoSizeManualOverride && !force) {
      return {
        applied: false,
        status: 'manual',
        summary: 'Zusätzliche Anschlussgrössen wurden manuell angepasst. Automatische Übernahme pausiert.',
      };
    }

    if (!force && formPart.connectionAutoSize?.signature === signature) {
      return {
        applied: false,
        status: 'unchanged',
        summary: formPart.connectionAutoSize?.summary || '',
        fields: formPart.connectionAutoSize?.fields || [],
      };
    }

    const fields = [];
    const missing = [];

    selected.forEach(connection => {
      const section = this.getSectionById(formPart?.[connection.field]);

      if (!section) {
        missing.push(connection.label);
        return;
      }

      const appliedFields = this.applySectionToFormPartConnection(formPart, entry, section, connection);
      fields.push(...appliedFields);
    });

    if (options.clearManualOverride !== false) {
      delete formPart.connectionAutoSizeManualOverride;
    }

    const uniqueFields = [...new Set(fields)];
    const connectionLabels = selected
      .map(connection => connection.target)
      .filter(Boolean)
      .join(', ');

    formPart.connectionAutoSize = {
      status: missing.length ? 'warning' : uniqueFields.length ? 'applied' : 'empty',
      signature,
      appliedAt: new Date().toISOString(),
      fields: uniqueFields,
      summary: uniqueFields.length
        ? `Übernommen: ${connectionLabels} (${uniqueFields.map(field => this.getFormPartAutoSizeFieldLabel(field)).join(', ')})`
        : 'Es wurden keine passenden Anschlussfelder gefunden.',
      missing,
    };

    return {
      applied: uniqueFields.length > 0,
      status: formPart.connectionAutoSize.status,
      fields: uniqueFields,
      summary: formPart.connectionAutoSize.summary,
      missing,
    };
  }

  applySectionToFormPartConnection(formPart, entry, section, connection) {
    const parameterIds = new Set((entry?.parameters || []).map(parameter => parameter.id));
    const geometry = this.getSectionGeometryForFormPart(section);
    const fields = [];
    const has = field => parameterIds.has(field);
    const set = (field, value) => {
      if (!has(field)) return;
      if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return;
      formPart[field] = value;
      fields.push(field);
    };
    const setShape = (prefix = '') => {
      const bauformField = prefix ? `${prefix}_bauform` : 'bauform';
      const widthField = prefix ? `${prefix}_breite` : 'a';
      const heightField = prefix ? `${prefix}_hoehe` : 'b';
      const diameterField = prefix ? `${prefix}_d` : 'd';

      if (has(bauformField)) {
        formPart[bauformField] = geometry.bauform;
        fields.push(bauformField);
      }

      if (geometry.isPipe) {
        set(diameterField, geometry.diameterMm);
        return;
      }

      set(widthField, geometry.widthMm);
      set(heightField, geometry.heightMm);
    };

    setShape(connection.target);

    if (connection.airflow) {
      set(connection.airflow, geometry.q);
    }

    return fields;
  }

  isFormPartConnectionSelectorField(field = '') {
    return new Set(['transitionOtherSectionId', 'branchSectionId', 'throughSectionId']).has(field);
  }

  isFormPartConnectionAutoSizeField(field = '') {
    return new Set([
      'A1_bauform', 'A1_breite', 'A1_hoehe', 'A1_d',
      'A2_bauform', 'A2_breite', 'A2_hoehe', 'A2_d',
      'AD_breite', 'AD_hoehe', 'AD_d',
      'AA_breite', 'AA_hoehe', 'AA_d',
      'WD', 'WA',
    ]).has(field);
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

    const formulaText = isDirectLoss
      ? 'Direktwert aus Formteil / Herstellerangabe'
      : `ζ ${this.formatNumber(zeta, 3)} × p_dyn ${this.formatNumber(dynamicPressure, 2)} Pa`;

    return `
      <section class="dp-result-panel dp-formpart-result-panel">
        <div class="dp-panel-header">
          <div>
            <h2>Formteil-Ergebnis</h2>
            ${sectionInfo?.isLive ? '<p>Die Teilstreckenwerte werden aktuell direkt aus der zugewiesenen Teilstrecke berechnet.</p>' : ''}
          </div>
        </div>

        <div class="dp-result-cards dp-formpart-result-cards">
          <div class="dp-result-card">
            <span>Dynamischer Druck</span>
            <strong>${this.formatNumber(dynamicPressure, 2)} Pa</strong>
            <em>${this.escapeHtml(sectionName)}</em>
          </div>
          <div class="dp-result-card">
            <span>ζ / Modus</span>
            <strong>${isDirectLoss ? 'Direkt' : this.formatNumber(zeta, 3)}</strong>
            <em>${this.escapeHtml(formulaText)}</em>
          </div>
          <div class="dp-result-card dp-result-card-total ${pressureLoss < 0 ? 'dp-result-card-negative' : ''}">
            <span>Δp Formteil</span>
            <strong>${this.formatNumber(pressureLoss, 2)} Pa</strong>
            <em>${isDirectLoss && formPartCalculation.pressureReference ? `bezogen auf ${this.escapeHtml(formPartCalculation.pressureReference)}` : 'bezogen auf Teilstrecke'}</em>
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


  renderProjectFileCheck(check = null) {
    const result = check || this.state.projectFileCheck || ProjectFileDiagnostics.create(this.state.project);
    const statusLabel = result.status === 'ok'
      ? 'Datei-QS OK'
      : result.status === 'error'
        ? 'Datei-QS Fehler'
        : 'Datei-QS mit Hinweisen';
    const checkedAt = result.checkedAt ? new Date(result.checkedAt).toLocaleString('de-CH') : '-';
    const sizeKb = Math.round((result.jsonSizeBytes || 0) / 1024);

    this.root.innerHTML = `
      <section class="dp-editor-panel dp-check-detail dp-file-check-detail">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Projektdatei</span>
            <h1>.dvp-Datei-QS</h1>
            <p>${this.escapeHtml(result.summary || 'Prüft Speichern, Öffnen, IDs, Zuordnungen und Dateiformat.')}</p>
          </div>
          <span class="dp-report-export-status ${this.escapeAttribute(result.status)}">${this.escapeHtml(statusLabel)}</span>
        </div>

        <div class="dp-file-check-meta detail">
          <div>
            <span>Dateiname</span>
            <strong>${this.escapeHtml(result.fileName || '-')}</strong>
          </div>
          <div>
            <span>Schema</span>
            <strong>${this.escapeHtml(result.schemaVersion || '-')}</strong>
          </div>
          <div>
            <span>Version</span>
            <strong>${this.escapeHtml(result.appRelease || APP_RELEASE)}</strong>
          </div>
          <div>
            <span>Projektgrösse</span>
            <strong>${this.escapeHtml(sizeKb)} kB</strong>
          </div>
          <div>
            <span>Geprüft</span>
            <strong>${this.escapeHtml(checkedAt)}</strong>
          </div>
        </div>

        <div class="dp-project-check-stats">
          <div><span>Fehler</span><strong>${this.escapeHtml(result.counts?.error || 0)}</strong></div>
          <div><span>Hinweise</span><strong>${this.escapeHtml(result.counts?.warning || 0)}</strong></div>
          <div><span>OK</span><strong>${this.escapeHtml(result.counts?.ok || 0)}</strong></div>
        </div>

        <div class="dp-workflow-actions">
          <button type="button" data-file-check-action="run">Neu prüfen</button>
          <button type="button" data-file-check-action="copy">Datei-QS kopieren</button>
          <button type="button" data-file-check-action="project">Projektangaben</button>
        </div>

        <div class="dp-project-check-list">
          ${(result.items || []).map(item => `
            <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
              <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
              <span>${this.escapeHtml(item.message)}</span>
              ${item.details ? `<em>${this.escapeHtml(item.details)}</em>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `;

    this.bindProjectFileCheckActions();
  }

  bindProjectFileCheckActions() {
    this.root.querySelectorAll('[data-file-check-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.fileCheckAction;

        if (action === 'project') {
          this.state.setSelection?.('project', this.state.project);
          this.state.notify?.();
          return;
        }

        if (action === 'open') {
          const check = ProjectFileDiagnostics.create(this.state.project);
          this.state.projectFileCheck = check;
          this.state.setSelection?.('projectFileCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'run') {
          const check = ProjectFileDiagnostics.create(this.state.project);
          this.state.projectFileCheck = check;
          this.state.setSelection?.('projectFileCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = ProjectFileDiagnostics.toText(this.state.projectFileCheck || ProjectFileDiagnostics.create(this.state.project));
          try {
            await navigator.clipboard.writeText(text);
            button.textContent = 'Kopiert ✓';
            setTimeout(() => { button.textContent = 'Datei-QS kopieren'; }, 1400);
          } catch {
            alert(text);
          }
        }
      });
    });
  }

  renderReleaseCandidateCheck(check = null) {
    const result = check || this.state.releaseCandidateCheck;
    const hasResult = !!result;
    const status = result?.status || 'warning';
    const counts = result?.counts || { ok: 0, warning: 0, error: 0 };
    const finishedAt = result?.finishedAt ? new Date(result.finishedAt) : null;
    const finishedLabel = finishedAt && !Number.isNaN(finishedAt.getTime())
      ? finishedAt.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'medium' })
      : '-';

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">Release Candidate / Schlussprüfung</span>
          <h1>Phase ${this.escapeHtml(APP_RELEASE)} – RC-Check</h1>
          <p>${this.escapeHtml(result?.summary || 'Führt Projektcheck, Rechen-QS, Datei-QS, Bericht, Demo-Projekt und Deployment-QS zusammen.')}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-rc-action="run">Neu prüfen</button>
          <button type="button" data-rc-action="copy" ${hasResult ? '' : 'disabled'}>RC-Protokoll kopieren</button>
          <button type="button" data-rc-action="project">Zurück zum Projekt</button>
        </div>
      </div>

      <section class="dp-editor-panel dp-rc-panel dp-rc-${this.escapeAttribute(status)}">
        <div class="dp-panel-header">
          <div>
            <h2>${this.escapeHtml(result?.label || 'Noch nicht geprüft')}</h2>
            <p>${this.escapeHtml(result?.nextRecommendation || 'Klicke auf „Neu prüfen“, um den aktuellen Stand als Release Candidate zu bewerten.')}</p>
          </div>
          <span class="dp-project-check-badge ${this.escapeAttribute(status)}">${this.escapeHtml(result?.label || 'offen')}</span>
        </div>

        <div class="dp-project-check-stats dp-rc-stats">
          <div><span>OK</span><strong>${this.escapeHtml(counts.ok)}</strong></div>
          <div><span>Hinweise</span><strong>${this.escapeHtml(counts.warning)}</strong></div>
          <div><span>Fehler</span><strong>${this.escapeHtml(counts.error)}</strong></div>
        </div>

        <div class="dp-deploy-meta-grid dp-rc-meta">
          <div>
            <span>Version</span>
            <strong>${this.escapeHtml(result?.release || APP_RELEASE)}</strong>
          </div>
          <div>
            <span>Projekt</span>
            <strong>${this.escapeHtml(result?.projectName || this.state.project?.name || '-')}</strong>
          </div>
          <div>
            <span>Anlage</span>
            <strong>${this.escapeHtml(result?.systemName || this.state.selectedSystem?.name || '-')}</strong>
          </div>
          <div>
            <span>Geprüft</span>
            <strong>${this.escapeHtml(finishedLabel)}</strong>
          </div>
        </div>

        ${hasResult ? `
          <div class="dp-project-check-list dp-rc-list">
            ${(result.items || []).map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}</span>
                ${item.details ? `<em>${this.escapeHtml(item.details)}</em>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-empty-state">
            Noch keine Schlussprüfung vorhanden. Der RC-Check ist der letzte technische Sammeltest von Phase 18.
          </div>
        `}
      </section>
    `;

    this.bindReleaseCandidateCheckActions();
  }

  bindReleaseCandidateCheckActions() {
    this.root.querySelectorAll('[data-rc-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.rcAction;

        if (action === 'project') {
          this.state.setSelection?.('project', this.state.project);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = ReleaseCandidateDiagnostics.toText(this.state.releaseCandidateCheck || {});
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
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
            const check = await ReleaseCandidateDiagnostics.run({
              state: this.state,
              project: this.state.project,
              system: this.state.selectedSystem || this.state.project?.systems?.[0],
              registry: this.registry,
            });
            this.state.releaseCandidateCheck = check;
            this.state.setSelection?.('releaseCandidateCheck', check);
            this.state.notify?.();
          } catch (error) {
            alert(`RC-Check konnte nicht ausgeführt werden: ${error.message}`);
          } finally {
            button.disabled = false;
            button.textContent = originalText;
          }
        }
      });
    });
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
          <p>Prüft Startdateien, GitHub-Pages-Pfade, Cache-Versionen, Pflichtbilder, UI-Layout und Basiszustand.</p>
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
            <span class="dp-overline">Phase ${this.escapeHtml(APP_RELEASE)}</span>
            <h2>GitHub Pages / Deployment- und UI-Prüfung</h2>
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


  renderPdfPrintGuidance(model) {
    const checklist = ReportEngine.createExportChecklist(model);
    const guidance = checklist.printGuidance || ReportEngine.createPrintGuidance(model, checklist.pdfFileName);

    return `
      <div class="dp-report-print-guidance">
        <div class="dp-report-print-guidance-head">
          <div>
            <strong>PDF-Druckpaket</strong>
            <span>${this.escapeHtml(guidance.totalPages)} Seite(n) · vorgeschlagener Name: ${this.escapeHtml(guidance.fileName)}</span>
          </div>
        </div>
        <div class="dp-report-print-guidance-grid">
          ${(guidance.rows || []).map(row => `
            <div>
              <span>${this.escapeHtml(row[0])}</span>
              <strong>${this.escapeHtml(row[1])}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
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
    const pageCount = checklist.pagePlan?.totalPages ?? '-';
    const activeAreas = checklist.pagePlan?.entries?.length ?? '-';

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

        <div class="dp-report-export-meta">
          <div>
            <span>Dokumenttitel</span>
            <strong>${this.escapeHtml(checklist.documentTitle)}</strong>
          </div>
          <div>
            <span>PDF-Seiten</span>
            <strong>${this.escapeHtml(pageCount)}</strong>
          </div>
          <div>
            <span>Aktive Bereiche</span>
            <strong>${this.escapeHtml(activeAreas)}</strong>
          </div>
          <button type="button" data-report-action="copy-check">Export-QS kopieren</button>
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
            <strong>${this.escapeHtml(checklist.htmlFileName || `${checklist.fileBaseName}_Bericht.html`)}</strong>
          </div>
          <div>
            <span>Dateiname PDF/Druck</span>
            <strong>${this.escapeHtml(checklist.pdfFileName || `${checklist.fileBaseName}_Bericht.pdf`)}</strong>
          </div>
          <div>
            <span>Dateiname Datenexport</span>
            <strong>${this.escapeHtml(checklist.csvFileName || `${checklist.fileBaseName}_Datenexport.csv`)}</strong>
          </div>
        </div>
        ${this.renderPdfPrintGuidance(model)}
        <p class="dp-report-export-note">HTML-Berichte werden mit eingebetteten Bildern gespeichert und können dadurch auch ausserhalb des Projektordners geöffnet werden. Für PDF wird der Browser-Druckdialog genutzt; der vorgeschlagene PDF-Name ist in der Dateivorschau ersichtlich.</p>
      </section>
    `;
  }


  renderReportCompletionSummary(model) {
    const completion = ReportEngine.createReportCompletionSummary(model);
    const statusLabel = completion.status === 'ok'
      ? 'Bericht abgabebereit'
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

        if (action === 'copy-check') {
          const text = ReportEngine.createExportChecklistText(model);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'QS kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            alert(text);
          }
          return;
        }

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


  createCalculationDiagnostics(system = null) {
    const project = this.state.project;

    if (!project) return null;

    try {
      return CalculationDiagnostics.create(project, { system: system || this.state.selectedSystem || project?.systems?.[0] || null });
    } catch (error) {
      return {
        status: 'error',
        label: 'Fehler',
        summary: `Rechen-QS konnte nicht erstellt werden: ${error?.message || String(error)}`,
        items: [],
        counts: { error: 1, warning: 0, ok: 0, total: 1 },
        totals: {},
      };
    }
  }

  renderCalculationDiagnosticsPanel(calculation = null, system = null) {
    if (!calculation) return '';

    const check = this.createCalculationDiagnostics(system);
    if (!check) return '';

    const visibleItems = (check.items || [])
      .filter(item => item.status !== 'ok')
      .slice(0, 5);
    const okCount = check.counts?.ok ?? 0;

    return `
      <section class="dp-result-panel dp-calculation-check-panel dp-calculation-check-${this.escapeAttribute(check.status)}">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Rechen-QS</span>
            <h2>Fachliche Rechenkontrolle</h2>
            <p>${this.escapeHtml(check.summary)}</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(check.label)}</span>
        </div>

        <div class="dp-project-check-stats">
          <div>
            <span>Fehler</span>
            <strong>${this.escapeHtml(check.counts?.error ?? 0)}</strong>
          </div>
          <div>
            <span>Hinweise</span>
            <strong>${this.escapeHtml(check.counts?.warning ?? 0)}</strong>
          </div>
          <div>
            <span>OK-Punkte</span>
            <strong>${this.escapeHtml(okCount)}</strong>
          </div>
        </div>

        <div class="dp-audit-grid dp-calculation-total-grid">
          <div>
            <span>Reibung</span>
            <strong>${this.formatNumber(check.totals?.friction, 1)} Pa</strong>
          </div>
          <div>
            <span>Formteile</span>
            <strong>${this.formatNumber((Number(check.totals?.zetaLoss ?? 0) + Number(check.totals?.directFormPartLoss ?? 0)), 1)} Pa</strong>
          </div>
          <div>
            <span>Sonderbauteile</span>
            <strong>${this.formatNumber(check.totals?.special, 1)} Pa</strong>
          </div>
          <div>
            <span>Total gerundet</span>
            <strong>${this.formatNumber(check.totals?.totalRounded, 1)} Pa</strong>
          </div>
        </div>

        ${visibleItems.length ? `
          <div class="dp-project-check-list">
            ${visibleItems.map(item => `
              <div class="dp-project-check-item ${this.escapeAttribute(item.status)}">
                <strong>${this.escapeHtml(item.area)} · ${this.escapeHtml(item.label)}</strong>
                <span>${this.escapeHtml(item.message)}${item.detail ? ` · ${this.escapeHtml(item.detail)}` : ''}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="dp-project-check-ready">
            <strong>Rechnung stimmig.</strong>
            <span>Summen, Einheiten, p_dyn und Rundungen sind plausibel.</span>
          </div>
        `}

        <div class="dp-project-check-actions">
          <button type="button" data-calculation-check-action="open">Details öffnen</button>
          <button type="button" data-calculation-check-action="copy">Rechen-QS kopieren</button>
        </div>
      </section>
    `;
  }

  bindCalculationDiagnosticsPanel(system = null) {
    this.root.querySelectorAll('[data-calculation-check-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.calculationCheckAction;
        const check = this.createCalculationDiagnostics(system);

        if (!check) return;

        if (action === 'open') {
          this.state.calculationCheck = check;
          this.state.setSelection?.('calculationCheck', check);
          this.state.notify?.();
          return;
        }

        if (action === 'copy') {
          const text = CalculationDiagnostics.toText(check);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'Rechen-QS kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            alert(text);
          }
        }
      });
    });
  }

  renderCalculationCheck(check = null) {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0] || null;
    const current = check || this.createCalculationDiagnostics(system);

    if (!current) {
      this.root.innerHTML = `
        <h1>Rechen-QS</h1>
        <p>Kein Projekt vorhanden.</p>
      `;
      return;
    }

    this.root.innerHTML = `
      <div class="workspace-header">
        <div>
          <span class="dp-overline">QS / Nachweis</span>
          <h1>Rechen-QS</h1>
          <p>${this.escapeHtml(current.summary)}</p>
        </div>
        <div class="workspace-actions">
          <button type="button" data-calculation-detail-action="recheck">Neu prüfen</button>
          <button type="button" data-calculation-detail-action="copy">QS kopieren</button>
          <button type="button" data-calculation-detail-action="system">Zur Anlage</button>
        </div>
      </div>

      <section class="dp-result-panel dp-calculation-check-panel dp-calculation-check-${this.escapeAttribute(current.status)}">
        <div class="dp-panel-header">
          <div>
            <h2>Rechenstatus</h2>
            <p>Kontrolliert werden Summenbildung, Reibung, Formteilverluste, Sonderbauteile, p_dyn, Einheiten und Rundungen.</p>
          </div>
          <span class="dp-audit-badge">${this.escapeHtml(current.label)}</span>
        </div>

        <div class="dp-project-check-stats">
          <div><span>Fehler</span><strong>${this.escapeHtml(current.counts?.error ?? 0)}</strong></div>
          <div><span>Hinweise</span><strong>${this.escapeHtml(current.counts?.warning ?? 0)}</strong></div>
          <div><span>OK-Punkte</span><strong>${this.escapeHtml(current.counts?.ok ?? 0)}</strong></div>
        </div>

        <div class="dp-audit-grid dp-calculation-total-grid">
          <div><span>Reibung</span><strong>${this.formatNumber(current.totals?.friction, 1)} Pa</strong></div>
          <div><span>ζ-Formteile</span><strong>${this.formatNumber(current.totals?.zetaLoss, 1)} Pa</strong></div>
          <div><span>Direkt-Formteile</span><strong>${this.formatNumber(current.totals?.directFormPartLoss, 1)} Pa</strong></div>
          <div><span>Sonderbauteile</span><strong>${this.formatNumber(current.totals?.special, 1)} Pa</strong></div>
          <div><span>Total ungerundet</span><strong>${this.formatNumber(current.totals?.total, 1)} Pa</strong></div>
          <div><span>Total gerundet</span><strong>${this.formatNumber(current.totals?.totalRounded, 1)} Pa</strong></div>
        </div>
      </section>

      <section class="dp-result-panel dp-calculation-detail-list">
        <h2>Detailprüfung</h2>
        <table class="dp-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Bereich</th>
              <th>Prüfung</th>
              <th>Ergebnis</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${(current.items || []).map(item => `
              <tr class="dp-calculation-row-${this.escapeAttribute(item.status)}">
                <td><span class="dp-calculation-status ${this.escapeAttribute(item.status)}">${this.escapeHtml(item.status)}</span></td>
                <td>${this.escapeHtml(item.area)}</td>
                <td><strong>${this.escapeHtml(item.label)}</strong></td>
                <td>${this.escapeHtml(item.message)}</td>
                <td>${this.escapeHtml(item.detail || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;

    this.bindCalculationCheckDetail(current, system);
  }

  bindCalculationCheckDetail(check = null, system = null) {
    this.root.querySelectorAll('[data-calculation-detail-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.dataset.calculationDetailAction;

        if (action === 'recheck') {
          this.autoCalculateProject();
          const next = this.createCalculationDiagnostics(system);
          this.state.calculationCheck = next;
          this.state.setSelection?.('calculationCheck', next);
          this.state.notify?.();
          return;
        }

        if (action === 'system') {
          this.state.selectSystem?.(system || this.state.selectedSystem || this.state.project?.systems?.[0]);
          return;
        }

        if (action === 'copy') {
          const text = CalculationDiagnostics.toText(check);
          try {
            await navigator.clipboard.writeText(text);
            const original = button.textContent;
            button.textContent = 'QS kopiert ✓';
            setTimeout(() => { button.textContent = original; }, 1400);
          } catch {
            alert(text);
          }
        }
      });
    });
  }


  renderSectionResultDetailPanel(calculation) {
    const rows = this.getSectionResultDetailRows(calculation);

    if (!rows.length) return '';

    const critical = rows.reduce((max, row) => row.totalLoss > max.totalLoss ? row : max, rows[0]);
    const formPartLossTotal = rows.reduce((sum, row) => sum + row.formPartLoss, 0);
    const sectionLossTotal = rows.reduce((sum, row) => sum + row.totalLoss, 0);

    return `
      <section class="dp-result-panel dp-result-detail-panel">
        <div class="dp-panel-header">
          <div>
            <span class="dp-overline">Ergebnisdetails</span>
            <h2>Teilstrecken- und Formteilaufteilung</h2>
            <p>Verdichtete Kontrolle: Kanal/Rohr, zugeordnete Formteile und Summe je Teilstrecke.</p>
          </div>
          <span class="dp-result-detail-badge">kritisch: ${this.escapeHtml(critical?.name || '-')}</span>
        </div>

        <div class="dp-result-cards dp-result-detail-cards">
          <div class="dp-result-card">
            <span>kritische Teilstrecke</span>
            <strong>${this.escapeHtml(critical?.name || '-')}</strong>
            <em>${this.formatNumber(critical?.totalLoss, 1)} Pa · ${this.formatNumber(critical?.share, 1)} %</em>
          </div>
          <div class="dp-result-card">
            <span>Formteile gesamt</span>
            <strong>${this.formatNumber(formPartLossTotal, 1)} Pa</strong>
            <em>ζ- und Direktverluste</em>
          </div>
          <div class="dp-result-card dp-result-card-total">
            <span>TS + Formteile</span>
            <strong>${this.formatNumber(sectionLossTotal, 1)} Pa</strong>
            <em>ohne Sonderbauteile</em>
          </div>
        </div>

        <table class="dp-table dp-result-detail-table">
          <thead>
            <tr>
              <th>TS</th>
              <th>q</th>
              <th>v</th>
              <th>Kanal/Rohr</th>
              <th>Formteile</th>
              <th>Summe TS</th>
              <th>Anteil</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => this.renderSectionResultDetailRow(row, critical?.id)).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  renderSectionResultDetailRow(row = {}, criticalId = '') {
    const formPartLabel = row.formPartCount
      ? `${this.formatNumber(row.formPartLoss, 1)} Pa · ${row.formPartCount} Stk.`
      : `${this.formatNumber(row.formPartLoss, 1)} Pa`;

    return `
      <tr class="${row.id === criticalId ? 'dp-critical-row' : ''}">
        <td><strong>${this.escapeHtml(row.name)}</strong>${row.id === criticalId ? '<span class="dp-critical-chip">max</span>' : ''}</td>
        <td>${this.formatAirflow(row.airflow)} m³/h</td>
        <td>${this.formatNumber(row.velocity, 2)} m/s</td>
        <td>${this.formatNumber(row.frictionLoss, 1)} Pa</td>
        <td class="${row.formPartLoss < 0 ? 'dp-negative-value' : ''}">${formPartLabel}</td>
        <td><strong>${this.formatNumber(row.totalLoss, 1)} Pa</strong></td>
        <td>${this.formatNumber(row.share, 1)} %</td>
      </tr>
    `;
  }

  getSectionResultDetailRows(calculation = null) {
    const system = this.state.selectedSystem || this.state.project?.systems?.[0];
    const sections = system?.sections || [];
    const resultItems = calculation?.results || this.state.project?.calculationResult?.calculation?.results || [];
    const total = Number(calculation?.totals?.totalRounded ?? calculation?.totals?.total ?? this.state.project?.calculationResult?.calculation?.totals?.totalRounded ?? 0);

    return sections
      .map((section, index) => {
        const item = resultItems.find(result => result?.id === section.id || result?.input?.id === section.id) || null;
        const result = item?.result || null;
        if (!result) return null;

        const breakdown = this.getSectionLossBreakdown(section.id, result);
        const formPartCount = this.getAssignedFormParts(section.id).length;

        return {
          id: section.id,
          position: index + 1,
          name: section?.name ?? section?.ts ?? section?.sectionNo ?? section?.id ?? `TS ${index + 1}`,
          airflow: result.q ?? section.q ?? section.volumeFlow ?? section.airVolume,
          velocity: Number(result.velocity ?? 0),
          frictionLoss: breakdown.frictionLoss,
          formPartLoss: breakdown.formPartLoss,
          totalLoss: breakdown.totalLoss,
          share: total > 0 ? (breakdown.totalLoss / total) * 100 : 0,
          formPartCount,
        };
      })
      .filter(Boolean)
      .filter(row => row.airflow > 0 || row.totalLoss !== 0 || row.formPartCount > 0);
  }

  getSectionLossBreakdown(sectionId, result = null) {
    const item = this.getCalculationItemBySectionId(sectionId);
    const sectionResult = result || item?.result || {};
    const frictionLoss = Number(sectionResult.frictionLoss ?? 0);
    const zetaLoss = Number(sectionResult.zetaLoss ?? 0);
    const directLoss = Number(sectionResult.directFormPartLoss ?? 0);
    const formPartLoss = zetaLoss + directLoss;
    const totalLoss = Number(sectionResult.roundedTotalLoss ?? sectionResult.totalLoss ?? frictionLoss + formPartLoss);

    return {
      frictionLoss: Number.isFinite(frictionLoss) ? frictionLoss : 0,
      zetaLoss: Number.isFinite(zetaLoss) ? zetaLoss : 0,
      directLoss: Number.isFinite(directLoss) ? directLoss : 0,
      formPartLoss: Number.isFinite(formPartLoss) ? formPartLoss : 0,
      totalLoss: Number.isFinite(totalLoss) ? totalLoss : 0,
    };
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

  renderSectionInputQuality(section = {}) {
    const q = Number(section?.q ?? section?.volumeFlow ?? section?.airVolume ?? 0);
    const l = Number(section?.l ?? section?.length ?? 0);
    const isPipe = this.isPipeSection(section);
    const b = Number(section?.b ?? section?.width ?? 0);
    const h = Number(section?.h ?? section?.height ?? 0);
    const d = Number(section?.d ?? section?.diameter ?? 0);
    const linkedFormParts = this.getAssignedFormParts(section?.id);
    const sync = this.getSectionFormPartSyncSummary(section, linkedFormParts);

    const items = [
      {
        status: q > 0 ? 'ok' : 'warning',
        label: 'Luftmenge',
        value: q > 0 ? `${this.formatAirflow(q)} m³/h` : 'fehlt',
      },
      {
        status: l > 0 ? 'ok' : 'warning',
        label: 'Länge',
        value: l > 0 ? `${this.formatNumber(l, 2)} m` : 'fehlt',
      },
      {
        status: isPipe ? (d > 0 ? 'ok' : 'warning') : (b > 0 && h > 0 ? 'ok' : 'warning'),
        label: 'Geometrie',
        value: isPipe
          ? (d > 0 ? `Ø ${this.formatNumber(this.toMillimetres(d), 0)} mm` : 'Ø fehlt')
          : (b > 0 && h > 0 ? `${this.formatNumber(this.toMillimetres(b), 0)} × ${this.formatNumber(this.toMillimetres(h), 0)} mm` : 'Breite/Höhe fehlt'),
      },
      {
        status: sync.status,
        label: 'Formteil-Sync',
        value: sync.label,
      },
    ];

    return `
      <section class="dp-section-qs-panel" aria-label="Teilstrecken-Eingabecheck">
        <div class="dp-section-qs-head">
          <div>
            <span class="dp-overline">Eingabe-QS</span>
            <h2>Teilstreckencheck</h2>
          </div>
          <small>${this.escapeHtml(sync.hint)}</small>
        </div>
        <div class="dp-section-qs-grid">
          ${items.map(item => this.renderSectionInputQualityItem(item)).join('')}
        </div>
      </section>
    `;
  }

  renderSectionInputQualityItem(item = {}) {
    const status = item.status || 'warning';

    return `
      <div class="dp-section-qs-item ${this.escapeAttribute(status)}">
        <span>${this.escapeHtml(item.label || '')}</span>
        <strong>${this.escapeHtml(item.value || '-')}</strong>
      </div>
    `;
  }

  getSectionFormPartSyncSummary(section = {}, formParts = null) {
    const linked = Array.isArray(formParts) ? formParts : this.getAssignedFormParts(section?.id);

    if (!linked.length) {
      return {
        status: 'idle',
        label: 'keine Formteile',
        hint: 'Wenn Formteile zugeordnet werden, ziehen sie die Grössen automatisch aus dieser Teilstrecke.',
      };
    }

    const signature = this.getSectionAutoSizeSignature(section);
    let synced = 0;
    let manual = 0;
    let open = 0;

    linked.forEach(part => {
      if (part?.autoSizeManualOverride) {
        manual += 1;
        return;
      }

      if (part?.autoSize?.sectionId === section?.id && part?.autoSize?.signature === signature) {
        synced += 1;
        return;
      }

      open += 1;
    });

    if (open > 0) {
      return {
        status: 'warning',
        label: `${open} offen / ${linked.length}`,
        hint: 'Einige zugeordnete Formteile haben noch nicht die aktuelle Teilstrecken-Grösse. Beim Speichern der Teilstrecke wird automatisch synchronisiert.',
      };
    }

    if (manual > 0) {
      return {
        status: 'manual',
        label: `${manual} manuell / ${linked.length}`,
        hint: 'Manuell angepasste Formteile werden nicht ungefragt überschrieben. Über „Grössen synchronisieren“ kannst du sie bewusst neu übernehmen.',
      };
    }

    return {
      status: 'ok',
      label: `${synced}/${linked.length} aktuell`,
      hint: 'Alle zugeordneten Formteile sind mit dieser Teilstrecke synchronisiert.',
    };
  }

  syncAssignedFormPartsForSection(section = {}, options = {}) {
    const formParts = this.getAssignedFormParts(section?.id);
    const summary = {
      total: formParts.length,
      applied: 0,
      unchanged: 0,
      manual: 0,
      empty: 0,
      missing: 0,
      failed: 0,
    };

    formParts.forEach(formPart => {
      try {
        const result = this.applySectionDimensionsToFormPart(formPart, {
          force: Boolean(options.force),
          clearManualOverride: Boolean(options.force),
        });

        const status = result?.status || (result?.applied ? 'applied' : 'missing');

        if (result?.applied) {
          summary.applied += 1;
          this.deriveAndStoreFormPart(formPart);
          this.calculateAndStoreFormPart(formPart, { silent: true });
          return;
        }

        if (status === 'unchanged') summary.unchanged += 1;
        else if (status === 'manual') summary.manual += 1;
        else if (status === 'empty') summary.empty += 1;
        else summary.missing += 1;
      } catch (error) {
        summary.failed += 1;
        console.warn('Formteil-Grössenübernahme fehlgeschlagen:', error);
      }
    });

    return summary;
  }

  bindSectionFormPartActions(section = {}) {
    this.root.querySelectorAll('[data-section-formpart-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.sectionFormpartAction;

        if (action !== 'sync') return;

        const summary = this.syncAssignedFormPartsForSection(section, { force: true });
        this.autoCalculateProject();

        if (!summary.total) {
          alert('Dieser Teilstrecke sind noch keine Formteile zugeordnet.');
          return;
        }

        if (summary.failed) {
          alert(`Grössenübernahme teilweise fehlgeschlagen. Aktualisiert: ${summary.applied}, Fehler: ${summary.failed}.`);
        }
      });
    });
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
          <div class="dp-panel-actions">
            <button type="button" data-section-formpart-action="sync" data-section-id="${this.escapeAttribute(section?.id)}">Grössen synchronisieren</button>
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
    const formula = isDirectLoss
      ? 'Direktwert'
      : `ζ × p_dyn = ${this.formatNumber(zeta, 3)} × ${this.formatNumber(dynamicPressure, 1)}`;

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
          <small>p_dyn</small>
          <strong>${this.formatNumber(dynamicPressure, 1)} Pa</strong>
        </div>
        <div>
          <small>Druckverlust</small>
          <strong class="${pressureLoss < 0 ? 'dp-negative-value' : ''}">${this.formatNumber(pressureLoss)} Pa</strong>
        </div>
        <em>${this.escapeHtml(reference)} · ${this.escapeHtml(formula)}</em>
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

    const breakdown = this.getSectionLossBreakdown(section?.id, result);
    const total = Number(this.state.project?.calculationResult?.calculation?.totals?.totalRounded ?? this.state.project?.calculationResult?.calculation?.totals?.total ?? 0);
    const share = total > 0 ? (breakdown.totalLoss / total) * 100 : 0;

    return `
      <section class="dp-result-panel dp-section-result-panel">
        <h2>Berechnungsergebnis</h2>

        <div class="dp-result-cards dp-section-result-cards">
          <div class="dp-result-card">
            <span>Kanal/Rohr</span>
            <strong>${this.formatNumber(breakdown.frictionLoss, 1)} Pa</strong>
            <em>nur Reibung</em>
          </div>
          <div class="dp-result-card ${breakdown.formPartLoss < 0 ? 'dp-result-card-negative' : ''}">
            <span>Formteile</span>
            <strong>${this.formatNumber(breakdown.formPartLoss, 1)} Pa</strong>
            <em>ζ ${this.formatNumber(breakdown.zetaLoss, 1)} Pa · Direkt ${this.formatNumber(breakdown.directLoss, 1)} Pa</em>
          </div>
          <div class="dp-result-card dp-result-card-total">
            <span>Summe TS</span>
            <strong>${this.formatNumber(breakdown.totalLoss, 1)} Pa</strong>
            <em>${this.formatNumber(share, 1)} % vom Systemtotal</em>
          </div>
        </div>

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