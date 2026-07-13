// Druckverlust Pro – ApplicationShell
// Phase 22.01: Grundlayout mit einklappbarer und anpassbarer Sidebar.

const SIDEBAR_WIDTH_KEY = 'druckverlust-pro.sidebar.width';
const SIDEBAR_COLLAPSED_KEY = 'druckverlust-pro.sidebar.collapsed';
const DEFAULT_SIDEBAR_WIDTH = 304;
const MIN_SIDEBAR_WIDTH = 238;
const MAX_SIDEBAR_WIDTH = 440;

export default class ApplicationShell {
  constructor(rootElement) {
    if (!rootElement) {
      throw new Error('ApplicationShell benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.shell = null;
    this.resizer = null;
    this.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
    this.isSidebarCollapsed = false;
    this.boundPointerMove = event => this.handlePointerMove(event);
    this.boundPointerUp = event => this.handlePointerUp(event);
  }

  render() {
    this.root.innerHTML = `
      <div class="dp-shell">
        <header class="dp-ribbon"></header>

        <aside class="dp-sidebar" aria-label="Projektstruktur"></aside>
        <div
          class="dp-sidebar-resizer"
          role="separator"
          aria-label="Breite der Projektstruktur ändern"
          aria-orientation="vertical"
          aria-valuemin="${MIN_SIDEBAR_WIDTH}"
          aria-valuemax="${MAX_SIDEBAR_WIDTH}"
          aria-valuenow="${DEFAULT_SIDEBAR_WIDTH}"
          tabindex="0"
        ></div>

        <main class="dp-workspace"></main>

        <footer class="dp-status"></footer>
      </div>
    `;

    this.shell = this.root.querySelector('.dp-shell');
    this.resizer = this.root.querySelector('.dp-sidebar-resizer');

    this.restoreLayoutPreferences();
    this.bindLayoutEvents();
    this.applyLayoutState();
  }

  bindLayoutEvents() {
    this.root.addEventListener('click', event => {
      const button = event.target.closest?.('[data-shell-action="toggleSidebar"]');
      if (!button) return;
      this.setSidebarCollapsed(!this.isSidebarCollapsed);
    });

    this.resizer?.addEventListener('pointerdown', event => this.handlePointerDown(event));
    this.resizer?.addEventListener('dblclick', () => this.setSidebarWidth(DEFAULT_SIDEBAR_WIDTH));
    this.resizer?.addEventListener('keydown', event => this.handleResizerKeydown(event));
  }

  handlePointerDown(event) {
    if (this.isSidebarCollapsed || event.button !== 0) return;

    event.preventDefault();
    this.resizer?.setPointerCapture?.(event.pointerId);
    this.shell?.classList.add('is-resizing-sidebar');
    document.body.classList.add('dp-is-resizing-sidebar');

    window.addEventListener('pointermove', this.boundPointerMove, true);
    window.addEventListener('pointerup', this.boundPointerUp, true);
    window.addEventListener('pointercancel', this.boundPointerUp, true);
  }

  handlePointerMove(event) {
    if (!this.shell?.classList.contains('is-resizing-sidebar')) return;
    this.setSidebarWidth(event.clientX, { persist: false });
  }

  handlePointerUp(event) {
    this.resizer?.releasePointerCapture?.(event.pointerId);
    this.shell?.classList.remove('is-resizing-sidebar');
    document.body.classList.remove('dp-is-resizing-sidebar');

    window.removeEventListener('pointermove', this.boundPointerMove, true);
    window.removeEventListener('pointerup', this.boundPointerUp, true);
    window.removeEventListener('pointercancel', this.boundPointerUp, true);

    this.persistSidebarWidth();
  }

  handleResizerKeydown(event) {
    if (this.isSidebarCollapsed) return;

    const step = event.shiftKey ? 24 : 10;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.setSidebarWidth(this.sidebarWidth - step);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.setSidebarWidth(this.sidebarWidth + step);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.setSidebarWidth(MIN_SIDEBAR_WIDTH);
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.setSidebarWidth(MAX_SIDEBAR_WIDTH);
    }
  }

  setSidebarWidth(value, options = {}) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;

    this.sidebarWidth = Math.round(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, numericValue)));
    this.shell?.style.setProperty('--dp-sidebar-width', `${this.sidebarWidth}px`);
    this.resizer?.setAttribute('aria-valuenow', String(this.sidebarWidth));

    if (options.persist !== false) this.persistSidebarWidth();
  }

  setSidebarCollapsed(isCollapsed) {
    this.isSidebarCollapsed = Boolean(isCollapsed);
    this.applyLayoutState();

    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(this.isSidebarCollapsed));
    } catch {
      // Blockierter Speicher darf die Bedienung nicht verhindern.
    }
  }

  applyLayoutState() {
    this.shell?.classList.toggle('sidebar-collapsed', this.isSidebarCollapsed);
    this.shell?.style.setProperty('--dp-sidebar-width', `${this.sidebarWidth}px`);
    this.resizer?.setAttribute('aria-hidden', String(this.isSidebarCollapsed));
    this.updateSidebarToggleButtons();
  }

  updateSidebarToggleButtons() {
    this.root.querySelectorAll('[data-shell-action="toggleSidebar"]').forEach(button => {
      const label = this.isSidebarCollapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen';
      button.setAttribute('title', label);
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-expanded', String(!this.isSidebarCollapsed));
    });
  }

  restoreLayoutPreferences() {
    try {
      const storedWidth = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
      if (Number.isFinite(storedWidth) && storedWidth > 0) {
        this.sidebarWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, storedWidth));
      }

      this.isSidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      this.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      this.isSidebarCollapsed = false;
    }
  }

  persistSidebarWidth() {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(this.sidebarWidth));
    } catch {
      // Blockierter Speicher darf die Bedienung nicht verhindern.
    }
  }
}
