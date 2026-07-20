// Druckverlust Pro – KeyboardShortcuts
// Zentrale Tastaturbedienung für schnelle Projektarbeit.

import RibbonActions from './RibbonActions.js?v=42.00&release=46.00';

export default class KeyboardShortcuts {
  constructor(state, options = {}) {
    if (!state) {
      throw new Error('KeyboardShortcuts benötigt einen ApplicationState.');
    }

    this.state = state;
    this.actions = options.actions || new RibbonActions(state);
    this.isInstalled = false;
    this.boundHandleKeydown = event => this.handleKeydown(event);
  }

  install() {
    if (this.isInstalled || typeof document === 'undefined') return;

    document.addEventListener('keydown', this.boundHandleKeydown, true);
    this.isInstalled = true;
  }

  uninstall() {
    if (!this.isInstalled || typeof document === 'undefined') return;

    document.removeEventListener('keydown', this.boundHandleKeydown, true);
    this.isInstalled = false;
  }

  handleKeydown(event) {
    if (!event) return;
    if (typeof document !== 'undefined' && document.querySelector('.dp-dialog-layer')) return;

    const key = String(event.key || '').toLowerCase();
    const hasModifier = event.ctrlKey || event.metaKey;

    if (event.key === 'F1' || (hasModifier && key === '/')) return this.run(event, 'showShortcutHelp');

    if (event.altKey && key === 'home') return this.run(event, 'showDashboard');
    if (hasModifier && event.shiftKey && key === 'u') return this.run(event, 'showProjectHandover');
    if (hasModifier && event.shiftKey && key === 'a') return this.run(event, 'showSystemManager');
    if (hasModifier && event.shiftKey && key === 'q') return this.run(event, 'showProjectCockpit');
    if (hasModifier && event.shiftKey && key === 'w') return this.run(event, 'showProjectStandardization');
    if (hasModifier && event.shiftKey && key === 'e') return this.run(event, 'showProjectQuickEntry');
    if (hasModifier && event.shiftKey && key === 't') return this.run(event, 'showProjectTaskCenter');
    if (hasModifier && event.shiftKey && key === 'd') return this.run(event, 'showProjectDependencies');
    if (hasModifier && event.shiftKey && key === 'h') return this.run(event, 'showProjectHistory');
    if (hasModifier && (key === 'k' || (event.shiftKey && key === 'f'))) return this.run(event, 'showProjectSearch');

    if (hasModifier && !this.isEditableTarget(event.target)) {
      if (key === 'z' && event.shiftKey) return this.run(event, 'redoProjectChange');
      if (key === 'z') return this.run(event, 'undoProjectChange');
      if (key === 'y') return this.run(event, 'redoProjectChange');
    }

    if (hasModifier) {
      if (key === 's') return this.run(event, 'saveProject');
      if (key === 'o') return this.run(event, 'openProject');
      if (key === 'n') return this.run(event, 'newProject');
      if (key === 'enter') return this.run(event, 'calculate');
      if (key === 'b' || key === 'p') return this.run(event, 'showReport');
      if (key === 'd') return this.run(event, 'duplicateSelected');
      if (event.altKey && key === 'arrowup') return this.run(event, 'moveSelectedUp');
      if (event.altKey && key === 'arrowdown') return this.run(event, 'moveSelectedDown');
    }

    if (key === 'escape' && !this.isEditableTarget(event.target)) {
      return this.run(event, 'selectActiveSystem');
    }

    if ((key === 'delete' || key === 'backspace') && !this.isEditableTarget(event.target)) {
      return this.run(event, 'deleteSelected');
    }
  }

  run(event, actionName) {
    const action = this.actions?.[actionName];

    if (typeof action !== 'function') return;

    event.preventDefault();
    event.stopPropagation();
    action.call(this.actions);
  }

  isEditableTarget(target) {
    if (!target) return false;

    const tagName = String(target.tagName || '').toLowerCase();
    return tagName === 'input'
      || tagName === 'textarea'
      || tagName === 'select'
      || Boolean(target.isContentEditable)
      || Boolean(target.closest?.('[contenteditable="true"]'));
  }
}
