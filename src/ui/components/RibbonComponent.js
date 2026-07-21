// Druckverlust Pro – RibbonComponent
// Phase 51.00: einzeilige Plattformleiste mit Sofort-Infotexten und Symbollegende.

import RibbonActions from '../core/RibbonActions.js?v=58.00';

const RIBBON_GROUPS = [
  {
    id: 'project',
    label: 'Projekt',
    actions: [
      { action: 'showDashboard', label: 'Start', icon: 'home', title: 'Zur Projekt- und Anlagenübersicht (Alt+Home)' },
      { action: 'undoProjectChange', label: 'Rückgängig', icon: 'undo', title: 'Letzte Projektänderung rückgängig machen (Ctrl+Z)' },
      { action: 'redoProjectChange', label: 'Wiederholen', icon: 'redo', title: 'Rückgängig gemachte Änderung wiederholen (Ctrl+Y)' },
      { action: 'showProjectHistory', label: 'Verlauf', icon: 'history', title: 'Sitzungsverlauf und Wiederherstellungspunkte öffnen (Ctrl+Shift+H)' },
      { action: 'showProjectSearch', label: 'Suche', icon: 'search', title: 'Projektweit suchen, Querverweise und Sprungmarken öffnen (Ctrl+K)' },
      { action: 'showProjectDependencies', label: 'Struktur', icon: 'network', title: 'Abhängigkeiten, Änderungsfolgen und Strukturkonflikte öffnen (Strg+Umschalt+D)' },
      { action: 'showSystemManager', label: 'Anlagen', icon: 'layers', title: 'Anlagen anlegen, duplizieren, ordnen und vergleichen (Strg+Umschalt+A)' },
      { action: 'showProjectCockpit', label: 'Cockpit', icon: 'pulse', title: 'Projektweite QS, Risikomatrix und Dokumentationsstatus öffnen (Strg+Umschalt+Q)' },
      { action: 'showProjectQuickEntry', label: 'Schnellerfassung', icon: 'table', title: 'Teilstrecken aus Excel, CSV oder Zwischenablage übernehmen (Strg+Umschalt+E)' },
      { action: 'showProjectStandardization', label: 'Workflow', icon: 'sliders', title: 'Projektvorlagen, Prüfprofile und Massenbearbeitung öffnen (Strg+Umschalt+W)' },
      { action: 'showProjectTaskCenter', label: 'Aufgaben', icon: 'tasks', title: 'Projekt-Navigator, Favoriten und Aufgabenliste öffnen (Strg+Umschalt+T)' },
      { action: 'newProject', label: 'Neu', icon: 'filePlus', title: 'Neues Projekt erstellen (Strg+N)' },
      { action: 'openProject', label: 'Öffnen', icon: 'folder', title: 'Projektdatei öffnen (Strg+O)' },
      { action: 'saveProject', label: 'Speichern', icon: 'save', title: 'Projekt speichern (Strg+S)', emphasis: 'primary' },
      { action: 'showProjectSafety', label: 'Sicherung', icon: 'shieldCheck', title: 'Projektarchiv, lokale Sicherungen und Wiederherstellung öffnen' },
    ],
  },
  {
    id: 'insert',
    label: 'Einfügen',
    actions: [
      { action: 'addSection', label: 'Teilstrecke', icon: 'route', title: 'Neue Teilstrecke hinzufügen', emphasis: 'create' },
      { action: 'addFormPart', label: 'Formteil', icon: 'elbow', title: 'Formteil aus der Bibliothek hinzufügen', emphasis: 'create' },
      { action: 'addSpecialComponent', label: 'Bauteil', icon: 'component', title: 'Sonderbauteil hinzufügen', emphasis: 'create' },
    ],
  },
  {
    id: 'calculate',
    label: 'Berechnung',
    actions: [
      { action: 'calculate', label: 'Berechnen', icon: 'refresh', title: 'Berechnung aktualisieren (Strg+Enter)', emphasis: 'calculate' },
      { action: 'projectCheck', label: 'Projektcheck', icon: 'clipboardCheck', title: 'Projekt auf fehlende oder unplausible Angaben prüfen' },
      { action: 'calculationCheck', label: 'Rechen-QS', icon: 'shieldCheck', title: 'Berechnung fachlich kontrollieren' },
      { action: 'showEngineeringQuality', label: 'Engineering-QS', icon: 'pulse', title: 'Priorisierte, herstellerneutrale Engineering-Prüfung öffnen' },
      { action: 'showNetworkSchematic', label: 'Anlagenschema', icon: 'network', title: 'Schematische Anlagenansicht öffnen' },
      { action: 'showLiveSimulation', label: 'Simulation', icon: 'sliders', title: 'Live-Variantenvergleich für Luftmenge und Dimension öffnen' },
    ],
  },
  {
    id: 'output',
    label: 'Ausgabe',
    actions: [
      { action: 'showReport', label: 'Bericht', icon: 'report', title: 'Bericht und Druckansicht öffnen (Strg+B)', emphasis: 'report' },
      { action: 'showProjectCompletion', label: 'Abschluss', icon: 'clipboardCheck', title: 'Varianten, Revision und Projektabschluss prüfen' },
      { action: 'showProjectHandover', label: 'Übergabe', icon: 'package', title: 'Importkontrolle, Freigabestatus und Übergabepaket öffnen' },
      { action: 'releaseCandidateCheck', label: 'Finalprüfung', icon: 'shieldCheck', title: 'Technische Finalprüfung inklusive Integrität und Windows-Druckabnahme ausführen' },
    ],
  },
  {
    id: 'support',
    label: 'Hilfe',
    actions: [
      { action: 'loadDemoProject', label: 'Demo', icon: 'sparkles', title: 'Beispielprojekt laden' },
      { action: 'showShortcutHelp', label: 'Hilfe', icon: 'help', title: 'Kontextbezogenes Hilfe-Center öffnen (F1 oder Strg+/)' },
      { action: 'showAppInfo', label: 'Info', icon: 'info', title: 'Version und Projektstatus anzeigen' },
    ],
  },
];

export default class RibbonComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('RibbonComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;
    this.actions = new RibbonActions(state);
    this.unsubscribe = null;
    this.boundDocumentClick = event => this.handleDocumentClick(event);
    this.boundDocumentKeydown = event => this.handleDocumentKeydown(event);
    this.boundRibbonScroll = () => this.updateScrollControls();
    this.boundRibbonResize = () => this.updateScrollControls();
    this.boundHistoryChange = () => this.updateState();
    this.resizeObserver = null;
    this.lastSelectionType = null;
    this.isLegendOpen = false;
  }

  render() {
    this.root.innerHTML = `
      <div class="dp-brand">
        <button
          type="button"
          class="dp-brand-home"
          data-action="showDashboard"
          title="Zur Projektübersicht"
          aria-label="Zur Projektübersicht"
        >
          <img
            class="dp-brand-logo dp-protected-image"
            src="assets/logo/eo-logo.png"
            alt="EO Logo"
            draggable="false"
          />
          <span class="dp-brand-text">
            <strong>Druckverlust Pro</strong>
            <span>Professional</span>
          </span>
        </button>

        <button
          type="button"
          class="dp-ribbon-menu-toggle"
          data-ribbon-menu-toggle
          aria-expanded="false"
          aria-controls="dp-ribbon-tools"
        >
          ${this.icon('menu')}
          <span>Werkzeuge</span>
        </button>
      </div>

      <div class="dp-ribbon-content">
        <div class="dp-ribbon-scroll-shell" data-ribbon-scroll-shell>
          <button
            type="button"
            class="dp-ribbon-scroll-button dp-ribbon-scroll-button--previous"
            data-ribbon-scroll="previous"
            title="Werkzeugleiste nach links bewegen"
            aria-label="Werkzeugleiste nach links bewegen"
          >
            ${this.icon('chevronLeft')}
          </button>

          <nav id="dp-ribbon-tools" class="dp-tabs dp-ribbon-groups" aria-label="Werkzeuge">
            ${RIBBON_GROUPS.map(group => this.renderGroup(group)).join('')}
          </nav>

          <button
            type="button"
            class="dp-ribbon-scroll-button dp-ribbon-scroll-button--next"
            data-ribbon-scroll="next"
            title="Werkzeugleiste nach rechts bewegen"
            aria-label="Werkzeugleiste nach rechts bewegen"
          >
            ${this.icon('chevronRight')}
          </button>
        </div>

        <div class="dp-ribbon-meta">
          <div class="dp-ribbon-context" aria-live="polite">
            <span class="dp-ribbon-context-dot" aria-hidden="true"></span>
            <span data-ribbon-context-text>Projekt bereit</span>
          </div>

          <button
            type="button"
            class="dp-ribbon-legend-toggle"
            data-ribbon-legend-toggle
            data-ui-tooltip="Symbol- und Statuslegende öffnen"
            title="Symbol- und Statuslegende öffnen"
            aria-label="Symbol- und Statuslegende öffnen"
            aria-expanded="false"
            aria-controls="dp-ribbon-legend"
          >
            ${this.icon('info')}
            <span>Legende</span>
          </button>

          <aside id="dp-ribbon-legend" class="dp-ribbon-legend-panel" data-ribbon-legend-panel aria-label="Symbol- und Statuslegende" hidden>
            <div class="dp-ribbon-legend-head">
              <span><small>ORIENTIERUNG</small><strong>Symbole & Status</strong></span>
              <button type="button" data-ribbon-legend-close data-ui-tooltip="Legende schliessen" title="Legende schliessen" aria-label="Legende schliessen">×</button>
            </div>
            <div class="dp-ribbon-legend-grid">
              ${this.renderLegendItem('route', 'Teilstrecke', 'Neuen Kanal- oder Rohrabschnitt anlegen.')}
              ${this.renderLegendItem('elbow', 'Formteil', 'Formteil der aktuellen Teilstrecke zuordnen.')}
              ${this.renderLegendItem('component', 'Bauteil', 'Freies Sonderbauteil ergänzen.')}
              ${this.renderLegendItem('refresh', 'Berechnen', 'Geänderte Eingaben neu berechnen.')}
              ${this.renderLegendItem('report', 'Bericht', 'Auswertung und Druckansicht öffnen.')}
              ${this.renderLegendItem('help', 'Infotext', 'Maus oder Tastaturfokus zeigt die genaue Funktion.')}
            </div>
            <div class="dp-ribbon-status-legend">
              <span><i class="is-ready"></i> aktuell</span>
              <span><i class="is-unsaved"></i> ungespeichert</span>
              <span><i class="is-check"></i> prüfen</span>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.bindEvents();
    this.installStateSubscription();
    this.updateState();
  }

  renderGroup(group) {
    return `
      <section class="dp-ribbon-group" data-ribbon-group="${group.id}" aria-label="${group.label}">
        <div class="dp-ribbon-group-actions">
          ${group.actions.map(action => this.renderAction(action)).join('')}
        </div>
        <button
          type="button"
          class="dp-ribbon-group-label dp-ribbon-group-label--compact"
          data-ribbon-jump="${group.id}"
          title="Zur Werkzeuggruppe ${group.label} springen"
          aria-label="Zur Werkzeuggruppe ${group.label} springen"
        >${group.label}</button>
      </section>
    `;
  }

  renderAction(config) {
    const emphasis = config.emphasis ? ` data-emphasis="${config.emphasis}"` : '';

    return `
      <button
        type="button"
        class="dp-ribbon-action"
        data-action="${config.action}"
        data-ui-tooltip="${this.escapeAttribute(config.title)}"
        title="${this.escapeAttribute(config.title)}"
        aria-label="${this.escapeAttribute(config.title)}"
        ${emphasis}
      >
        <span class="dp-ribbon-action-icon" aria-hidden="true">${this.icon(config.icon)}</span>
        <span class="dp-ribbon-action-label">${config.label}</span>
        <span class="dp-ribbon-action-indicator" aria-hidden="true"></span>
      </button>
    `;
  }

  bindEvents() {
    this.root.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const actionName = button.dataset.action;

        if (typeof this.actions[actionName] === 'function') {
          this.actions[actionName]();
        }

        if (window.matchMedia?.('(max-width: 900px)').matches) {
          this.setMenuOpen(false);
        }
      });
    });

    this.root.querySelector('[data-ribbon-menu-toggle]')?.addEventListener('click', event => {
      event.stopPropagation();
      this.setMenuOpen(!this.root.classList.contains('is-menu-open'));
    });

    this.root.querySelector('[data-ribbon-legend-toggle]')?.addEventListener('click', event => {
      event.stopPropagation();
      this.setLegendOpen(!this.isLegendOpen);
    });

    this.root.querySelector('[data-ribbon-legend-close]')?.addEventListener('click', () => {
      this.setLegendOpen(false);
      this.root.querySelector('[data-ribbon-legend-toggle]')?.focus();
    });

    this.root.querySelectorAll('[data-ribbon-scroll]').forEach(button => {
      button.addEventListener('click', () => this.scrollRibbon(button.dataset.ribbonScroll));
    });

    this.root.querySelectorAll('[data-ribbon-jump]').forEach(button => {
      button.addEventListener('click', () => this.scrollGroupIntoView(button.dataset.ribbonJump));
    });

    const ribbonNav = this.getRibbonNav();
    ribbonNav?.removeEventListener('scroll', this.boundRibbonScroll);
    ribbonNav?.addEventListener('scroll', this.boundRibbonScroll, { passive: true });
    ribbonNav?.addEventListener('keydown', event => this.handleRibbonNavigationKeydown(event));

    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver !== 'undefined' && ribbonNav) {
      this.resizeObserver = new ResizeObserver(this.boundRibbonResize);
      this.resizeObserver.observe(ribbonNav);
    } else {
      window.removeEventListener?.('resize', this.boundRibbonResize);
      window.addEventListener?.('resize', this.boundRibbonResize, { passive: true });
    }

    requestAnimationFrame(() => this.updateScrollControls());

    window.removeEventListener?.('druckverlust:history-change', this.boundHistoryChange);
    window.addEventListener?.('druckverlust:history-change', this.boundHistoryChange);

    document.removeEventListener('click', this.boundDocumentClick, true);
    document.addEventListener('click', this.boundDocumentClick, true);

    document.removeEventListener('keydown', this.boundDocumentKeydown, true);
    document.addEventListener('keydown', this.boundDocumentKeydown, true);
  }

  installStateSubscription() {
    if (this.unsubscribe) return;
    this.unsubscribe = this.state.subscribe(() => this.updateState());
  }

  updateState() {
    const selectionType = this.state.getSelectionType?.() || this.state.selection?.type || 'none';
    const saveButton = this.root.querySelector('[data-action="saveProject"]');
    const calculateButton = this.root.querySelector('[data-action="calculate"]');
    const dashboardButton = this.root.querySelector('.dp-ribbon-groups [data-action="showDashboard"]');
    const undoButton = this.root.querySelector('[data-action="undoProjectChange"]');
    const redoButton = this.root.querySelector('[data-action="redoProjectChange"]');
    const historyButton = this.root.querySelector('[data-action="showProjectHistory"]');
    const reportButton = this.root.querySelector('[data-action="showReport"]');
    const systemManagerButton = this.root.querySelector('[data-action="showSystemManager"]');
    const projectCockpitButton = this.root.querySelector('[data-action="showProjectCockpit"]');
    const projectQuickEntryButton = this.root.querySelector('[data-action="showProjectQuickEntry"]');
    const projectStandardizationButton = this.root.querySelector('[data-action="showProjectStandardization"]');
    const projectTaskCenterButton = this.root.querySelector('[data-action="showProjectTaskCenter"]');
    const projectSearchButton = this.root.querySelector('[data-action="showProjectSearch"]');
    const projectDependenciesButton = this.root.querySelector('[data-action="showProjectDependencies"]');
    const qualityButton = this.root.querySelector('[data-action="showEngineeringQuality"]');
    const schematicButton = this.root.querySelector('[data-action="showNetworkSchematic"]');
    const simulationButton = this.root.querySelector('[data-action="showLiveSimulation"]');
    const completionButton = this.root.querySelector('[data-action="showProjectCompletion"]');
    const safetyButton = this.root.querySelector('[data-action="showProjectSafety"]');
    const handoverButton = this.root.querySelector('[data-action="showProjectHandover"]');
    const releaseCandidateButton = this.root.querySelector('[data-action="releaseCandidateCheck"]');
    const contextText = this.root.querySelector('[data-ribbon-context-text]');

    const hasUnsavedChanges = Boolean(this.state.isProjectDirty);
    const hasCalculationIssue = Boolean(this.state.isCalculationDirty || this.state.lastAutoCalculationError);

    this.root.classList.toggle('has-unsaved-changes', hasUnsavedChanges);
    this.root.classList.toggle('has-calculation-issue', hasCalculationIssue);

    saveButton?.classList.toggle('needs-attention', hasUnsavedChanges);
    calculateButton?.classList.toggle('needs-attention', hasCalculationIssue);

    const historyState = this.state.historyEngine?.getState?.() || { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 };
    if (undoButton) {
      undoButton.disabled = !historyState.canUndo;
      const undoTitle = historyState.canUndo
        ? `Letzte Projektänderung rückgängig machen (${historyState.undoCount} verfügbar)`
        : 'Keine Projektänderung zum Rückgängigmachen vorhanden';
      undoButton.title = undoTitle;
      undoButton.dataset.uiTooltip = undoTitle;
    }
    if (redoButton) {
      redoButton.disabled = !historyState.canRedo;
      const redoTitle = historyState.canRedo
        ? `Projektänderung wiederholen (${historyState.redoCount} verfügbar)`
        : 'Keine Projektänderung zum Wiederholen vorhanden';
      redoButton.title = redoTitle;
      redoButton.dataset.uiTooltip = redoTitle;
    }

    this.root.querySelectorAll('.dp-ribbon-action.is-current').forEach(button => {
      button.classList.remove('is-current');
      button.removeAttribute('aria-current');
    });

    if (selectionType === 'projectHistory') {
      historyButton?.classList.add('is-current');
      historyButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectSearch') {
      projectSearchButton?.classList.add('is-current');
      projectSearchButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectDependencies') {
      projectDependenciesButton?.classList.add('is-current');
      projectDependenciesButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectTaskCenter') {
      projectTaskCenterButton?.classList.add('is-current');
      projectTaskCenterButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectQuickEntry') {
      projectQuickEntryButton?.classList.add('is-current');
      projectQuickEntryButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectStandardization') {
      projectStandardizationButton?.classList.add('is-current');
      projectStandardizationButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectCockpit') {
      projectCockpitButton?.classList.add('is-current');
      projectCockpitButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'systemManager') {
      systemManagerButton?.classList.add('is-current');
      systemManagerButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectHandover') {
      handoverButton?.classList.add('is-current');
      handoverButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'releaseCandidateCheck') {
      releaseCandidateButton?.classList.add('is-current');
      releaseCandidateButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectSafety') {
      safetyButton?.classList.add('is-current');
      safetyButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'engineeringQuality') {
      qualityButton?.classList.add('is-current');
      qualityButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'networkSchematic') {
      schematicButton?.classList.add('is-current');
      schematicButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'liveSimulation') {
      simulationButton?.classList.add('is-current');
      simulationButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'projectCompletion') {
      completionButton?.classList.add('is-current');
      completionButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'report') {
      reportButton?.classList.add('is-current');
      reportButton?.setAttribute('aria-current', 'page');
    } else if (selectionType === 'project' || selectionType === 'system') {
      dashboardButton?.classList.add('is-current');
      dashboardButton?.setAttribute('aria-current', 'page');
    }

    if (contextText) {
      if (this.state.lastAutoCalculationError) {
        contextText.textContent = 'Berechnung prüfen';
      } else if (hasCalculationIssue) {
        contextText.textContent = 'Neuberechnung erforderlich';
      } else if (hasUnsavedChanges) {
        contextText.textContent = 'Ungespeicherte Änderungen';
      } else {
        contextText.textContent = 'Projekt gespeichert und aktuell';
      }
    }

    this.updateCurrentGroup();
    this.revealCurrentAction(selectionType);
    requestAnimationFrame(() => this.updateScrollControls());
  }

  getRibbonNav() {
    return this.root.querySelector('#dp-ribbon-tools');
  }

  scrollRibbon(direction) {
    const ribbonNav = this.getRibbonNav();
    if (!ribbonNav) return;

    const distance = Math.max(280, Math.round(ribbonNav.clientWidth * 0.72));
    const multiplier = direction === 'previous' ? -1 : 1;
    ribbonNav.scrollBy({ left: distance * multiplier, behavior: 'smooth' });
  }

  scrollGroupIntoView(groupId) {
    const group = this.root.querySelector(`[data-ribbon-group="${groupId}"]`);
    if (!group) return;

    group.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    const firstAction = group.querySelector('.dp-ribbon-action');
    requestAnimationFrame(() => firstAction?.focus({ preventScroll: true }));
  }

  updateScrollControls() {
    const ribbonNav = this.getRibbonNav();
    if (!ribbonNav) return;

    const maxScrollLeft = Math.max(0, ribbonNav.scrollWidth - ribbonNav.clientWidth);
    const hasOverflow = maxScrollLeft > 2;
    const canScrollPrevious = hasOverflow && ribbonNav.scrollLeft > 2;
    const canScrollNext = hasOverflow && ribbonNav.scrollLeft < maxScrollLeft - 2;

    this.root.classList.toggle('has-ribbon-overflow', hasOverflow);
    this.root.classList.toggle('can-scroll-ribbon-previous', canScrollPrevious);
    this.root.classList.toggle('can-scroll-ribbon-next', canScrollNext);

    const previousButton = this.root.querySelector('[data-ribbon-scroll="previous"]');
    const nextButton = this.root.querySelector('[data-ribbon-scroll="next"]');

    if (previousButton) previousButton.disabled = !canScrollPrevious;
    if (nextButton) nextButton.disabled = !canScrollNext;
  }

  updateCurrentGroup() {
    this.root.querySelectorAll('.dp-ribbon-group.is-current-group').forEach(group => {
      group.classList.remove('is-current-group');
    });

    const currentAction = this.root.querySelector('.dp-ribbon-action.is-current');
    currentAction?.closest('.dp-ribbon-group')?.classList.add('is-current-group');
  }

  revealCurrentAction(selectionType) {
    if (selectionType === this.lastSelectionType) return;
    this.lastSelectionType = selectionType;

    const currentAction = this.root.querySelector('.dp-ribbon-action.is-current');
    if (!currentAction || window.matchMedia?.('(max-width: 900px)').matches) return;

    requestAnimationFrame(() => {
      currentAction.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    });
  }

  handleRibbonNavigationKeydown(event) {
    const current = event.target.closest?.('.dp-ribbon-action');
    if (!current) return;

    const actions = [...this.root.querySelectorAll('.dp-ribbon-action:not(:disabled)')];
    const index = actions.indexOf(current);
    if (index < 0) return;

    let target = null;
    if (event.key === 'ArrowRight') target = actions[(index + 1) % actions.length];
    if (event.key === 'ArrowLeft') target = actions[(index - 1 + actions.length) % actions.length];
    if (event.key === 'Home') target = actions[0];
    if (event.key === 'End') target = actions.at(-1);
    if (!target) return;

    event.preventDefault();
    target.focus();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }

  renderLegendItem(icon, label, description) {
    return `
      <div class="dp-ribbon-legend-item">
        <span class="dp-ribbon-legend-icon" aria-hidden="true">${this.icon(icon)}</span>
        <span><strong>${this.escapeHtml(label)}</strong><small>${this.escapeHtml(description)}</small></span>
      </div>
    `;
  }

  setLegendOpen(isOpen) {
    this.isLegendOpen = Boolean(isOpen);
    const panel = this.root.querySelector('[data-ribbon-legend-panel]');
    const toggle = this.root.querySelector('[data-ribbon-legend-toggle]');

    if (panel) panel.hidden = !this.isLegendOpen;
    toggle?.setAttribute('aria-expanded', String(this.isLegendOpen));
    toggle?.classList.toggle('is-active', this.isLegendOpen);
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  escapeAttribute(value) {
    return this.escapeHtml(value).replaceAll('`', '&#096;');
  }

  setMenuOpen(isOpen) {
    this.root.classList.toggle('is-menu-open', Boolean(isOpen));
    const toggle = this.root.querySelector('[data-ribbon-menu-toggle]');
    toggle?.setAttribute('aria-expanded', String(Boolean(isOpen)));
    requestAnimationFrame(() => this.updateScrollControls());
  }

  handleDocumentClick(event) {
    if (!this.root.contains(event.target)) {
      if (this.root.classList.contains('is-menu-open')) this.setMenuOpen(false);
      if (this.isLegendOpen) this.setLegendOpen(false);
      return;
    }

    if (this.isLegendOpen && !event.target.closest?.('[data-ribbon-legend-panel], [data-ribbon-legend-toggle]')) {
      this.setLegendOpen(false);
    }
  }

  handleDocumentKeydown(event) {
    if (event.key !== 'Escape') return;

    if (this.isLegendOpen) {
      this.setLegendOpen(false);
      this.root.querySelector('[data-ribbon-legend-toggle]')?.focus();
      return;
    }

    if (this.root.classList.contains('is-menu-open')) {
      this.setMenuOpen(false);
      this.root.querySelector('[data-ribbon-menu-toggle]')?.focus();
    }
  }

  icon(name) {
    const icons = {
      home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
      filePlus: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/><path d="M9 13h6M12 10v6"/>',
      folder: '<path d="M3 6h7l2 2h9v11H3z"/><path d="M3 10h18"/>',
      save: '<path d="M5 3h12l3 3v15H4V3z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
      route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3h-1"/>',
      elbow: '<path d="M4 4h8v5a3 3 0 0 0 3 3h5v8h-6a10 10 0 0 1-10-10z"/><path d="M9 4v6a5 5 0 0 0 5 5h6"/>',
      component: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 2v4M16 2v4M8 18v4M16 18v4M2 10h2M20 10h2M2 14h2M20 14h2"/>',
      refresh: '<path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/>',
      clipboardCheck: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8.5 13l2.2 2.2 4.8-5"/>',
      shieldCheck: '<path d="M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
      report: '<path d="M6 2h9l4 4v16H6z"/><path d="M15 2v5h5M9 11h6M9 15h6M9 19h4"/>',
      package: '<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="M4 7.5 12 12l8-4.5M12 12v9M8 5.2l8 4.5"/>',
      sparkles: '<path d="m12 3 1.1 3.1L16 7.2l-2.9 1.1L12 11.5l-1.1-3.2L8 7.2l2.9-1.1zM6 13l.8 2.2L9 16l-2.2.8L6 19l-.8-2.2L3 16l2.2-.8zM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.9.5-1.3 1-1.3 2M12 17h.01"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 7h.01"/>',
      pulse: '<path d="M3 12h4l2-6 4 12 2-6h6"/><circle cx="12" cy="12" r="10"/>',
      network: '<rect x="2" y="8" width="6" height="8" rx="1"/><rect x="16" y="3" width="6" height="8" rx="1"/><rect x="16" y="13" width="6" height="8" rx="1"/><path d="M8 12h4c2 0 2-5 4-5M12 12c2 0 2 5 4 5"/>',
      sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',
      layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
      tasks: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/><path d="m7 8 .8.8L9.5 7"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
      undo: '<path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6v1"/>',
      redo: '<path d="m15 7 5 5-5 5"/><path d="M19 12h-8a6 6 0 0 0-6 6v1"/>',
      history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="M12 7v5l3 2"/>',
      table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16M15 4v16M3 14h18"/>',
      chevronLeft: '<path d="m15 18-6-6 6-6"/>',
      chevronRight: '<path d="m9 18 6-6-6-6"/>',
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    };

    return `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">${icons[name] || icons.info}</svg>`;
  }
}
