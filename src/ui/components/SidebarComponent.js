// Druckverlust Pro – SidebarComponent
// Phase 22.01: durchsuchbare, einklappbare und klar gegliederte Projektstruktur.

import ProjectCalculationService from '../../project/ProjectCalculationService.js';

const STORAGE_KEY_GROUPS = 'druckverlust-pro.sidebar.groups';

export default class SidebarComponent {
  constructor(rootElement, state) {
    if (!rootElement) {
      throw new Error('SidebarComponent benötigt ein Root-Element.');
    }

    this.root = rootElement;
    this.state = state;
    this.query = '';
    this.collapsedGroups = this.loadCollapsedGroups();
    this.boundGlobalKeydown = event => this.handleGlobalKeydown(event);

    this.state.subscribe(() => this.render());
    document.addEventListener('keydown', this.boundGlobalKeydown, true);
    this.render();
  }

  render() {
    const project = this.state.project;
    const system = this.state.selectedSystem || project?.systems?.[0];

    if (!project || !system) {
      this.root.innerHTML = `
        ${this.renderHeader()}
        <div class="dp-sidebar-empty-state">
          ${this.icon('project')}
          <strong>Kein Projekt geladen</strong>
          <span>Erstelle ein neues Projekt oder öffne eine vorhandene DVP-Datei.</span>
        </div>
      `;
      this.bindEvents(project, system);
      return;
    }

    const sections = system.sections || [];
    const formParts = system.formParts || [];
    const specialComponents = system.specialComponents || [];
    const totalElements = sections.length + formParts.length + specialComponents.length;

    this.root.innerHTML = `
      ${this.renderHeader()}

      <div class="dp-sidebar-content">
        <div class="dp-sidebar-tools">
          <label class="dp-sidebar-search" title="Projektstruktur durchsuchen">
            <span class="dp-sidebar-search-icon" aria-hidden="true">${this.icon('search')}</span>
            <input
              type="search"
              data-sidebar-search
              value="${this.escapeAttribute(this.query)}"
              placeholder="Projekt durchsuchen"
              autocomplete="off"
              spellcheck="false"
              aria-label="Projektstruktur durchsuchen"
            />
            <button
              type="button"
              class="dp-sidebar-search-clear"
              data-sidebar-action="clearSearch"
              title="Suche löschen"
              aria-label="Suche löschen"
              ${this.query ? '' : 'hidden'}
            >×</button>
          </label>

          <div class="dp-sidebar-tool-row">
            <span class="dp-sidebar-result" data-sidebar-result>${totalElements} Elemente</span>
            <div class="dp-sidebar-tool-actions" aria-label="Baumdarstellung">
              <button type="button" data-sidebar-action="expandAll" title="Alle Bereiche öffnen" aria-label="Alle Bereiche öffnen">${this.icon('expand')}</button>
              <button type="button" data-sidebar-action="collapseAll" title="Alle Bereiche schliessen" aria-label="Alle Bereiche schliessen">${this.icon('collapse')}</button>
            </div>
          </div>
        </div>

        <div class="dp-tree" data-sidebar-tree>
          <div class="dp-tree-roots">
            ${this.renderRootItem({
              type: 'project',
              label: project.name ?? project.title ?? project.projectName ?? 'Unbenanntes Projekt',
              meta: project.object || project.meta?.object || project.meta?.anlageNumber || 'Projektangaben',
              icon: 'project',
              active: this.state.getSelectionType() === 'project',
            })}

            ${this.renderRootItem({
              type: 'projectSearch',
              id: 'project-search',
              label: 'Projektsuche',
              meta: 'Projektindex · Querverweise · Sprungmarken',
              icon: 'report',
              active: this.state.getSelectionType() === 'projectSearch',
            })}

            ${this.renderRootItem({
              type: 'projectHistory',
              id: 'project-history',
              label: 'Änderungsverlauf',
              meta: 'Rückgängig · Wiederholen · Sitzungsstände',
              icon: 'report',
              active: this.state.getSelectionType() === 'projectHistory',
            })}

            ${this.renderRootItem({
              type: 'projectDependencies',
              id: 'project-dependencies',
              label: 'Abhängigkeiten',
              meta: 'Änderungsfolgen · Struktur · Konflikte',
              icon: 'systems',
              active: this.state.getSelectionType() === 'projectDependencies',
            })}

            ${this.renderRootItem({
              type: 'projectCockpit',
              id: 'project-cockpit',
              label: 'Projektcockpit',
              meta: 'Projektweite QS · Risiken · Dokumentation',
              icon: 'report',
              active: this.state.getSelectionType() === 'projectCockpit',
            })}

            ${this.renderRootItem({
              type: 'projectStandardization',
              id: 'project-standardization',
              label: 'Projektworkflow',
              meta: 'Vorlagen · Prüfprofile · Massenänderung',
              icon: 'systems',
              active: this.state.getSelectionType() === 'projectStandardization',
            })}

            ${this.renderRootItem({
              type: 'projectTaskCenter',
              id: 'project-task-center',
              label: 'Aufgaben & Favoriten',
              meta: 'Projekt-Navigator · offene Punkte · Schnellzugriffe',
              icon: 'report',
              active: this.state.getSelectionType() === 'projectTaskCenter',
            })}

            ${this.renderRootItem({
              type: 'systemManager',
              id: 'system-manager',
              label: 'Anlagenmanager',
              meta: `${project.systems?.length || 0} Anlagen · projektweiter Vergleich`,
              icon: 'systems',
              active: this.state.getSelectionType() === 'systemManager',
            })}
          </div>

          ${this.renderGroup({
            id: 'systems',
            label: 'Anlagen',
            count: project.systems?.length || 0,
            icon: 'systems',
            content: (project.systems || []).map((item, index) => this.renderTreeItem({
              type: 'system',
              id: item.id,
              label: item.name || `Anlage ${index + 1}`,
              meta: `${item.type || 'Lüftungsanlage'} · ${(item.sections?.length || 0) + (item.formParts?.length || 0) + (item.specialComponents?.length || 0)} Elemente`,
              icon: 'system',
              active: this.state.isSelected('system', item.id),
            })).join('') || this.renderEmpty('Noch keine Anlage vorhanden.'),
          })}

          ${this.renderGroup({
            id: 'sections',
            label: 'Teilstrecken',
            count: sections.length,
            icon: 'section',
            content: sections.length
              ? sections.map(section => this.renderSectionItem(section)).join('')
              : this.renderEmpty('Noch keine Teilstrecke vorhanden.'),
          })}

          ${this.renderGroup({
            id: 'formParts',
            label: 'Formteile',
            count: formParts.length,
            icon: 'formPart',
            content: this.renderFormPartsBySection(system, sections, formParts),
          })}

          ${this.renderGroup({
            id: 'specialComponents',
            label: 'Sonderbauteile',
            count: specialComponents.length,
            icon: 'component',
            content: this.renderSpecialComponentsByCategory(specialComponents),
          })}

          ${this.renderGroup({
            id: 'report',
            label: 'Auswertung',
            count: null,
            icon: 'report',
            content: this.renderTreeItem({
              type: 'report',
              id: 'report',
              label: 'Bericht / Druckansicht',
              meta: 'Ergebnisse prüfen und ausgeben',
              icon: 'report',
              active: this.state.getSelectionType() === 'report',
            }),
          })}
        </div>
      </div>
    `;

    this.bindEvents(project, system);
    this.applyFilter();
    this.scrollActiveItemIntoView();
  }

  renderHeader() {
    const isCollapsed = Boolean(this.root.closest?.('.dp-shell')?.classList.contains('sidebar-collapsed'));
    const label = isCollapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen';

    return `
      <div class="dp-sidebar-header">
        <div class="dp-sidebar-heading">
          <span>Navigation</span>
          <h3>Projektstruktur</h3>
        </div>
        <button
          type="button"
          class="dp-sidebar-collapse-button"
          data-shell-action="toggleSidebar"
          title="${label}"
          aria-label="${label}"
          aria-expanded="${String(!isCollapsed)}"
        >
          ${this.icon('sidebar')}
        </button>
      </div>
    `;
  }

  renderRootItem(config) {
    return this.renderTreeItem({ ...config, root: true });
  }

  renderSectionItem(section) {
    const airflow = Number(section?.q ?? section?.airflow ?? 0);
    const description = section?.description || this.sectionGeometryLabel(section);
    const meta = [description, airflow > 0 ? `${this.formatNumber(airflow, 0)} m³/h` : '']
      .filter(Boolean)
      .join(' · ');

    return this.renderTreeItem({
      type: 'section',
      id: section.id,
      label: section.name || section.id || 'Teilstrecke',
      meta,
      icon: 'section',
      active: this.state.isSelected('section', section.id),
    });
  }

  renderTreeItem(config) {
    const activeClass = config.active ? ' active' : '';
    const rootClass = config.root ? ' dp-tree-root-item' : '';
    const idAttribute = config.id ? ` data-id="${this.escapeAttribute(config.id)}"` : '';
    const searchText = `${config.label || ''} ${config.meta || ''}`.trim();

    return `
      <button
        type="button"
        class="dp-tree-item${activeClass}${rootClass}"
        data-type="${this.escapeAttribute(config.type)}"
        ${idAttribute}
        data-search-text="${this.escapeAttribute(searchText)}"
        title="${this.escapeAttribute(config.label || '')}"
      >
        <span class="dp-tree-item-icon" aria-hidden="true">${this.icon(config.icon || 'item')}</span>
        <span class="dp-tree-item-copy">
          <strong>${this.escapeHtml(config.label || 'Eintrag')}</strong>
          ${config.meta ? `<span>${this.escapeHtml(config.meta)}</span>` : ''}
        </span>
        <span class="dp-tree-active-marker" aria-hidden="true"></span>
      </button>
    `;
  }

  renderGroup({ id, label, count = null, icon = 'item', content = '' }) {
    const isCollapsed = this.collapsedGroups.has(id);
    const countMarkup = count === null
      ? '<span class="dp-tree-count dp-tree-count-empty" aria-hidden="true"></span>'
      : `<span class="dp-tree-count">${count}</span>`;

    return `
      <section class="dp-tree-group${isCollapsed ? ' is-collapsed' : ''}" data-sidebar-group="${this.escapeAttribute(id)}">
        <button
          type="button"
          class="dp-tree-heading"
          data-sidebar-group-toggle="${this.escapeAttribute(id)}"
          aria-expanded="${String(!isCollapsed)}"
        >
          <span class="dp-tree-heading-icon" aria-hidden="true">${this.icon(icon)}</span>
          <span class="dp-tree-heading-label">${this.escapeHtml(label)}</span>
          ${countMarkup}
          <span class="dp-tree-chevron" aria-hidden="true">${this.icon('chevron')}</span>
        </button>
        <div class="dp-tree-group-body">
          ${content}
        </div>
      </section>
    `;
  }

  renderFormPartsBySection(system = {}, sections = [], formParts = []) {
    if (!formParts.length) return this.renderEmpty('Noch keine Formteile vorhanden.');

    const groups = [];
    const assignedSectionIds = new Set(sections.map(section => section.id));

    sections.forEach(section => {
      const parts = formParts.filter(part => part?.sectionId === section.id);
      if (parts.length) {
        groups.push({
          title: section.name || section.id || 'Teilstrecke',
          parts,
        });
      }
    });

    const unassigned = formParts.filter(part => !part?.sectionId || !assignedSectionIds.has(part.sectionId));
    if (unassigned.length) {
      groups.push({
        title: 'Nicht zugeordnet',
        parts: unassigned,
      });
    }

    return groups.map(group => `
      <div class="dp-tree-subgroup" data-search-text="${this.escapeAttribute(group.title)}">
        <div class="dp-tree-subheading">
          <span>${this.escapeHtml(group.title)}</span>
          <em>${group.parts.length}</em>
        </div>
        ${group.parts.map(formPart => this.renderTreeItem({
          type: 'formPart',
          id: formPart.id,
          label: formPart.name || 'Formteil',
          meta: this.formatType(formPart.type || 'Formteil'),
          icon: 'formPart',
          active: this.state.isSelected('formPart', formPart.id),
        })).join('')}
      </div>
    `).join('');
  }

  renderSpecialComponentsByCategory(specialComponents = []) {
    if (!specialComponents.length) return this.renderEmpty('Noch keine Sonderbauteile vorhanden.');

    const groups = [];

    specialComponents.forEach(component => {
      const category = component?.category || component?.type || 'Sonderbauteile';
      let group = groups.find(item => item.category === category);

      if (!group) {
        group = { category, components: [] };
        groups.push(group);
      }

      group.components.push(component);
    });

    return groups.map(group => `
      <div class="dp-tree-subgroup" data-search-text="${this.escapeAttribute(group.category)}">
        <div class="dp-tree-subheading">
          <span>${this.escapeHtml(group.category)}</span>
          <em>${group.components.length}</em>
        </div>
        ${group.components.map(component => {
          const pressureLoss = Number(component?.pressureLoss ?? component?.pa ?? 0);
          const type = component.type || component.componentType || 'Komponente';
          const meta = `${this.formatType(type)} · ${Number.isFinite(pressureLoss) ? this.formatNumber(pressureLoss, 1) : '0,0'} Pa`;

          return this.renderTreeItem({
            type: 'specialComponent',
            id: component.id,
            label: component.name || 'Sonderbauteil',
            meta,
            icon: 'component',
            active: this.state.isSelected('specialComponent', component.id),
          });
        }).join('')}
      </div>
    `).join('');
  }

  renderEmpty(message) {
    return `<div class="dp-tree-empty" data-search-text="">${this.escapeHtml(message)}</div>`;
  }

  bindEvents(project, system) {
    this.root.querySelectorAll('.dp-tree-item').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.type;
        const id = button.dataset.id;

        if (type === 'project') {
          this.state.setSelection('project', project);
          this.state.notify();
          return;
        }

        if (type === 'projectSearch') {
          this.state.setSelection('projectSearch', project);
          this.state.notify();
          return;
        }

        if (type === 'projectHistory') {
          this.state.historyEngine?.flush?.();
          this.state.setSelection('projectHistory', project);
          this.state.notify();
          return;
        }

        if (type === 'projectDependencies') {
          this.state.dependencyTargetHint = { type: 'project', id: project.id || null, updatedAt: Date.now() };
          this.state.setSelection('projectDependencies', project);
          this.state.notify();
          return;
        }

        if (type === 'projectCockpit') {
          this.state.setSelection('projectCockpit', project);
          this.state.notify();
          return;
        }

        if (type === 'projectStandardization') {
          this.state.setSelection('projectStandardization', project);
          this.state.notify();
          return;
        }

        if (type === 'projectTaskCenter') {
          this.state.setSelection('projectTaskCenter', project);
          this.state.notify();
          return;
        }

        if (type === 'systemManager') {
          this.state.setSelection('systemManager', project);
          this.state.notify();
          return;
        }

        if (type === 'system') {
          const selectedSystem = project?.systems?.find(item => item.id === id) || system;
          this.state.selectSystem(selectedSystem);

          try {
            const result = ProjectCalculationService.calculate(project, selectedSystem?.id || null);
            project.calculationResult = result;
            this.state.lastCalculationAt = result.timestamp;
            this.state.isCalculationDirty = false;
            this.state.lastAutoCalculationError = null;
            this.state.notify();
          } catch (error) {
            if (typeof this.state.markAutoCalculationFailed === 'function') {
              this.state.markAutoCalculationFailed(error);
            } else {
              this.state.isCalculationDirty = true;
              this.state.lastAutoCalculationError = error?.message || String(error || 'Berechnung fehlgeschlagen.');
              this.state.notify();
            }
          }
          return;
        }

        if (type === 'section') {
          const section = system.sections?.find(item => item.id === id);
          this.state.selectSection(section);
          return;
        }

        if (type === 'formPart') {
          const formPart = system.formParts?.find(item => item.id === id);
          this.state.selectFormPart(formPart);
          return;
        }

        if (type === 'report') {
          if (typeof this.state.selectReport === 'function') {
            this.state.selectReport(system);
          } else {
            this.state.setSelection('report', system);
            this.state.notify();
          }
          return;
        }

        if (type === 'specialComponent') {
          const component = system.specialComponents?.find(item => item.id === id);
          this.state.selectSpecialComponent(component);
        }
      });
    });

    this.root.querySelectorAll('[data-sidebar-group-toggle]').forEach(button => {
      button.addEventListener('click', () => this.toggleGroup(button.dataset.sidebarGroupToggle));
    });

    const searchInput = this.root.querySelector('[data-sidebar-search]');
    searchInput?.addEventListener('input', event => {
      this.query = event.target.value || '';
      this.applyFilter();
    });

    this.root.querySelectorAll('[data-sidebar-action]').forEach(button => {
      button.addEventListener('click', () => this.handleSidebarAction(button.dataset.sidebarAction));
    });
  }

  handleSidebarAction(action) {
    if (action === 'clearSearch') {
      this.query = '';
      const input = this.root.querySelector('[data-sidebar-search]');
      if (input) input.value = '';
      this.applyFilter();
      input?.focus();
      return;
    }

    const groupIds = Array.from(this.root.querySelectorAll('[data-sidebar-group]'))
      .map(group => group.dataset.sidebarGroup)
      .filter(Boolean);

    if (action === 'expandAll') {
      groupIds.forEach(id => this.collapsedGroups.delete(id));
      this.persistCollapsedGroups();
      this.updateGroupStates();
      return;
    }

    if (action === 'collapseAll') {
      groupIds.forEach(id => this.collapsedGroups.add(id));
      this.persistCollapsedGroups();
      this.updateGroupStates();
    }
  }

  toggleGroup(groupId) {
    if (!groupId) return;

    if (this.collapsedGroups.has(groupId)) {
      this.collapsedGroups.delete(groupId);
    } else {
      this.collapsedGroups.add(groupId);
    }

    this.persistCollapsedGroups();
    this.updateGroupStates();
  }

  updateGroupStates() {
    this.root.querySelectorAll('[data-sidebar-group]').forEach(group => {
      const id = group.dataset.sidebarGroup;
      const isCollapsed = this.collapsedGroups.has(id);
      group.classList.toggle('is-collapsed', isCollapsed);
      group.querySelector('[data-sidebar-group-toggle]')?.setAttribute('aria-expanded', String(!isCollapsed));
    });
  }

  applyFilter() {
    const query = this.normalizeSearch(this.query);
    const tree = this.root.querySelector('[data-sidebar-tree]');
    const clearButton = this.root.querySelector('[data-sidebar-action="clearSearch"]');
    const result = this.root.querySelector('[data-sidebar-result]');

    tree?.classList.toggle('is-searching', Boolean(query));
    if (clearButton) clearButton.hidden = !query;

    let visibleItems = 0;

    this.root.querySelectorAll('.dp-tree-item').forEach(item => {
      const searchText = this.normalizeSearch(item.dataset.searchText || item.textContent || '');
      const isVisible = !query || searchText.includes(query);
      item.hidden = !isVisible;
      if (isVisible) visibleItems += 1;
    });

    this.root.querySelectorAll('.dp-tree-subgroup').forEach(subgroup => {
      const headingText = this.normalizeSearch(subgroup.dataset.searchText || subgroup.querySelector('.dp-tree-subheading')?.textContent || '');
      const visibleChildren = Array.from(subgroup.querySelectorAll('.dp-tree-item')).some(item => !item.hidden);
      subgroup.hidden = Boolean(query) && !headingText.includes(query) && !visibleChildren;
    });

    this.root.querySelectorAll('[data-sidebar-group]').forEach(group => {
      const headingText = this.normalizeSearch(group.querySelector('.dp-tree-heading-label')?.textContent || '');
      const visibleChildren = Array.from(group.querySelectorAll('.dp-tree-item, .dp-tree-subgroup')).some(item => !item.hidden);
      group.hidden = Boolean(query) && !headingText.includes(query) && !visibleChildren;
    });

    this.root.querySelectorAll('.dp-tree-empty').forEach(empty => {
      empty.hidden = Boolean(query);
    });

    if (result) {
      result.textContent = query
        ? `${visibleItems} Treffer`
        : `${Math.max(0, visibleItems - 2)} Elemente`;
    }
  }

  scrollActiveItemIntoView() {
    if (this.query) return;
    window.requestAnimationFrame?.(() => {
      const activeItem = this.root.querySelector('.dp-tree-item.active');
      activeItem?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
  }

  handleGlobalKeydown(event) {
    const tagName = String(event.target?.tagName || '').toLowerCase();
    const editable = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || event.target?.isContentEditable;

    if (event.key === '/' && !editable && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const input = this.root.querySelector('[data-sidebar-search]');
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
      return;
    }

    if (event.key === 'Escape' && event.target?.matches?.('[data-sidebar-search]')) {
      if (this.query) {
        event.preventDefault();
        this.query = '';
        event.target.value = '';
        this.applyFilter();
      } else {
        event.target.blur();
      }
    }
  }

  sectionGeometryLabel(section = {}) {
    if (section.type === 'pipe' || Number(section.d) > 0) {
      const diameter = Number(section.d || 0) * 1000;
      return diameter > 0 ? `Rundrohr Ø${this.formatNumber(diameter, 0)} mm` : 'Rundrohr';
    }

    const width = Number(section.b || 0) * 1000;
    const height = Number(section.h || 0) * 1000;
    return width > 0 && height > 0
      ? `Kanal ${this.formatNumber(width, 0)} × ${this.formatNumber(height, 0)} mm`
      : 'Rechteckkanal';
  }

  formatType(value = '') {
    return String(value)
      .replaceAll('_', ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  formatNumber(value, decimals = 0) {
    return Number(value || 0).toLocaleString('de-CH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  normalizeSearch(value = '') {
    return String(value)
      .toLocaleLowerCase('de-CH')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  loadCollapsedGroups() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY_GROUPS) || '[]');
      return new Set(Array.isArray(value) ? value : []);
    } catch {
      return new Set();
    }
  }

  persistCollapsedGroups() {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(Array.from(this.collapsedGroups)));
    } catch {
      // Private Browsing oder blockierter Speicher: Darstellung bleibt dennoch funktionsfähig.
    }
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
    return this.escapeHtml(value).replaceAll('`', '&#096;');
  }

  icon(name) {
    const icons = {
      search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
      project: '<path d="M4 5h6l2 2h8v12H4z"/><path d="M4 10h16"/>',
      systems: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
      system: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5M8 17h8"/>',
      section: '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h10"/>',
      formPart: '<path d="M4 5h7v4a4 4 0 0 0 4 4h5v6h-5A10 10 0 0 1 5 9V5z"/>',
      component: '<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3"/>',
      report: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6M9 19h4"/>',
      item: '<circle cx="12" cy="12" r="4"/>',
      chevron: '<path d="m8 10 4 4 4-4"/>',
      sidebar: '<path d="M4 4h16v16H4zM9 4v16"/><path d="m7 9-2 3 2 3"/>',
      expand: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
      collapse: '<path d="M8 8H3V3M16 8h5V3M8 16H3v5M16 16h5v5"/>',
    };

    return `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">${icons[name] || icons.item}</svg>`;
  }
}
