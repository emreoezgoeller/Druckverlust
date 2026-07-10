// Druckverlust Pro – RibbonComponent
// Rendert das Ribbon und verbindet UI-Befehle mit RibbonActions.

import RibbonActions from '../core/RibbonActions.js';

export default class RibbonComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('RibbonComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;
    this.actions = new RibbonActions(state);
  }

  render() {
    this.root.innerHTML = `
      <div class="dp-brand">
        <img
          class="dp-brand-logo dp-protected-image"
          src="assets/logo/eo-logo.png"
          alt="EO Logo"
          draggable="false"
        />
        <div class="dp-brand-text">
          <strong>Druckverlust Pro</strong>
          <span>Professional</span>
        </div>
      </div>

      <nav class="dp-tabs">
        <button data-action="showDashboard" title="Zur Projekt-/Anlagenübersicht">Start</button>
        <button data-action="newProject">Neu</button>
        <button data-action="loadDemoProject" title="Beispielprojekt mit Teilstrecken, Formteilen und Sonderbauteilen laden">Demo</button>
        <button data-action="openProject">Öffnen</button>
        <button data-action="saveProject">Speichern</button>
        <button data-action="addSection">+ Teilstrecke</button>
        <button data-action="addFormPart">+ Formteil</button>
        <button data-action="addSpecialComponent">+ Sonderbauteil</button>
        <button data-action="calculate">Neu berechnen</button>
        <button data-action="projectCheck">Projekt prüfen</button>
        <button data-action="calculationCheck">Rechen-QS</button>
        <button data-action="showReport">Bericht</button>
        <button data-action="showShortcutHelp" title="Tastaturkürzel anzeigen">Hilfe</button>
        <button data-action="showAppInfo" title="Version und Projektstatus anzeigen">Info</button>
      </nav>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.root.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const actionName = button.dataset.action;

        if (typeof this.actions[actionName] === 'function') {
          this.actions[actionName]();
        }
      });
    });
  }
}