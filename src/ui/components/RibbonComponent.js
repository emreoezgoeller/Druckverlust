// Druckverlust Pro – RibbonComponent
// Phase 22.01: gruppiertes Ribbon mit klarer Priorität, Statusanzeige und mobilem Menü.

import RibbonActions from '../core/RibbonActions.js?v=22.03';

const RIBBON_GROUPS = [
  {
    id: 'project',
    label: 'Projekt',
    actions: [
      { action: 'showDashboard', label: 'Start', icon: 'home', title: 'Zur Projekt- und Anlagenübersicht (Alt+Home)' },
      { action: 'newProject', label: 'Neu', icon: 'filePlus', title: 'Neues Projekt erstellen (Strg+N)' },
      { action: 'openProject', label: 'Öffnen', icon: 'folder', title: 'Projektdatei öffnen (Strg+O)' },
      { action: 'saveProject', label: 'Speichern', icon: 'save', title: 'Projekt speichern (Strg+S)', emphasis: 'primary' },
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
    ],
  },
  {
    id: 'output',
    label: 'Ausgabe',
    actions: [
      { action: 'showReport', label: 'Bericht', icon: 'report', title: 'Bericht und Druckansicht öffnen (Strg+B)', emphasis: 'report' },
    ],
  },
  {
    id: 'support',
    label: 'Hilfe',
    actions: [
      { action: 'loadDemoProject', label: 'Demo', icon: 'sparkles', title: 'Beispielprojekt laden' },
      { action: 'showShortcutHelp', label: 'Hilfe', icon: 'help', title: 'Tastaturkürzel und Bedienung anzeigen' },
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
        <div class="dp-ribbon-context" aria-live="polite">
          <span class="dp-ribbon-context-dot" aria-hidden="true"></span>
          <span data-ribbon-context-text>Projekt bereit</span>
        </div>

        <nav id="dp-ribbon-tools" class="dp-tabs dp-ribbon-groups" aria-label="Werkzeuge">
          ${RIBBON_GROUPS.map(group => this.renderGroup(group)).join('')}
        </nav>
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
        <span class="dp-ribbon-group-label">${group.label}</span>
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
        title="${config.title}"
        aria-label="${config.title}"
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
    const reportButton = this.root.querySelector('[data-action="showReport"]');
    const contextText = this.root.querySelector('[data-ribbon-context-text]');

    const hasUnsavedChanges = Boolean(this.state.isProjectDirty);
    const hasCalculationIssue = Boolean(this.state.isCalculationDirty || this.state.lastAutoCalculationError);

    this.root.classList.toggle('has-unsaved-changes', hasUnsavedChanges);
    this.root.classList.toggle('has-calculation-issue', hasCalculationIssue);

    saveButton?.classList.toggle('needs-attention', hasUnsavedChanges);
    calculateButton?.classList.toggle('needs-attention', hasCalculationIssue);

    this.root.querySelectorAll('.dp-ribbon-action.is-current').forEach(button => {
      button.classList.remove('is-current');
      button.removeAttribute('aria-current');
    });

    if (selectionType === 'report') {
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
  }

  setMenuOpen(isOpen) {
    this.root.classList.toggle('is-menu-open', Boolean(isOpen));
    const toggle = this.root.querySelector('[data-ribbon-menu-toggle]');
    toggle?.setAttribute('aria-expanded', String(Boolean(isOpen)));
  }

  handleDocumentClick(event) {
    if (!this.root.classList.contains('is-menu-open')) return;
    if (this.root.contains(event.target)) return;
    this.setMenuOpen(false);
  }

  handleDocumentKeydown(event) {
    if (event.key === 'Escape' && this.root.classList.contains('is-menu-open')) {
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
      sparkles: '<path d="m12 3 1.1 3.1L16 7.2l-2.9 1.1L12 11.5l-1.1-3.2L8 7.2l2.9-1.1zM6 13l.8 2.2L9 16l-2.2.8L6 19l-.8-2.2L3 16l2.2-.8zM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.9.5-1.3 1-1.3 2M12 17h.01"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 7h.01"/>',
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    };

    return `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">${icons[name] || icons.info}</svg>`;
  }
}
