export default class ApplicationState {
  constructor() {
    this.project = null;
    this.selectedSystem = null;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = null;
    this.formPartPickerSectionId = null;
    this.lastCreatedSectionIds = new Map();
    this.lastKnownSectionCounts = new Map();

    this.selection = {
      type: 'none',
      id: null,
      data: null
    };

    this.isCalculationDirty = false;
    this.isProjectDirty = false;
    this.lastCalculationAt = null;
    this.lastAutoCalculationError = null;
    this.historyEngine = null;

    this.listeners = [];
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('subscribe benötigt eine Funktion.');
    }

    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this));
  }

  setProject(project) {
    this.project = {
      name: project?.name ?? project?.title ?? project?.projectName ?? 'Unbenanntes Projekt',
      ...project
    };

    this.selectedSystem = this.project?.systems?.[0] ?? null;
    this.isCalculationDirty = false;
    this.isProjectDirty = false;
    this.lastCalculationAt = null;
    this.lastAutoCalculationError = null;
    this.formPartPickerSectionId = null;
    this.lastCreatedSectionIds = new Map(
      (this.project?.systems || [])
        .map(system => [system?.id, Array.isArray(system?.sections) ? system.sections.at(-1)?.id : null])
        .filter(([systemId, sectionId]) => systemId && sectionId)
    );
    this.lastKnownSectionCounts = new Map(
      (this.project?.systems || [])
        .filter(system => system?.id)
        .map(system => [system.id, Array.isArray(system.sections) ? system.sections.length : 0])
    );

    this.clearSelection(false);

    if (this.historyEngine && !this.historyEngine.isApplying) {
      this.historyEngine.reset(this.project, {
        label: 'Projektstand geladen',
        selection: {
          type: 'project',
          id: this.project?.id || null,
          systemId: this.selectedSystem?.id || null,
        },
      });
    }

    this.notify();
  }

  setSelection(type, data = null) {
    const resolvedData = type === 'project' ? this.project : data;

    this.selection = {
      type,
      id: resolvedData?.id || null,
      data: resolvedData
    };
  }

  markCalculationDirty() {
    this.isCalculationDirty = true;
    this.isProjectDirty = true;
    this.notify();
  }

  markCalculationClean() {
    this.isCalculationDirty = false;
    this.notify();
  }

  markAutoCalculated(timestamp = new Date().toISOString()) {
    this.isCalculationDirty = false;
    this.isProjectDirty = true;
    this.lastCalculationAt = timestamp;
    this.lastAutoCalculationError = null;
    this.notify();
  }

  markAutoCalculationFailed(error = null) {
    this.isCalculationDirty = true;
    this.isProjectDirty = true;
    this.lastAutoCalculationError = error?.message || String(error || 'Automatische Berechnung fehlgeschlagen.');
    this.notify();
  }

  markProjectDirty() {
    this.isProjectDirty = true;
    this.notify();
  }

  markProjectClean() {
    this.isProjectDirty = false;
    this.notify();
  }

  selectSystem(system) {
    this.selectedSystem = system;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = null;

    this.setSelection('system', system);
    this.notify();
  }

  selectSection(section) {
    this.selectedSection = section;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = null;

    this.setSelection('section', section);
    this.notify();
  }

  selectFormPart(formPart) {
    this.selectedFormPart = formPart;
    this.selectedSection = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = null;

    this.setSelection('formPart', formPart);
    this.notify();
  }

  selectSpecialComponent(component) {
    this.selectedSpecialComponent = component;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedReport = null;

    this.setSelection('specialComponent', component);
    this.notify();
  }

  selectFormPartPicker(data = null, options = {}) {
    const system = data || this.selectedSystem || this.project?.systems?.[0] || null;
    const sections = Array.isArray(system?.sections) ? system.sections : [];
    const requestedSectionId = options?.sectionId || this.selectedSection?.id || this.formPartPickerSectionId || null;
    const validContext = requestedSectionId
      ? sections.find(section => section?.id === requestedSectionId)
      : null;

    this.formPartPickerSectionId = validContext?.id || null;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = null;

    this.setSelection('formPartPicker', system);
    this.notify();
  }

  setFormPartPickerSection(sectionId = null, system = null) {
    const activeSystem = system || this.selectedSystem || this.project?.systems?.[0] || null;
    const sections = Array.isArray(activeSystem?.sections) ? activeSystem.sections : [];
    const section = sections.find(item => item?.id === sectionId) || null;

    this.formPartPickerSectionId = section?.id || null;
    this.notify();
    return section;
  }


  rememberCreatedSection(section, system = null) {
    const activeSystem = system || this.selectedSystem || this.project?.systems?.[0] || null;

    if (!activeSystem?.id || !section?.id) return null;

    this.lastCreatedSectionIds.set(activeSystem.id, section.id);
    this.lastKnownSectionCounts.set(activeSystem.id, Array.isArray(activeSystem.sections) ? activeSystem.sections.length : 0);
    return section;
  }

  getLastCreatedSection(system = null) {
    const activeSystem = system || this.selectedSystem || this.project?.systems?.[0] || null;
    const sections = Array.isArray(activeSystem?.sections) ? activeSystem.sections : [];

    if (!sections.length) return null;

    const rememberedId = activeSystem?.id
      ? this.lastCreatedSectionIds.get(activeSystem.id)
      : null;
    const rememberedCount = activeSystem?.id
      ? this.lastKnownSectionCounts.get(activeSystem.id)
      : undefined;

    // Werden Teilstrecken ausserhalb von ProjectCommands angehängt, etwa per
    // Schnellerfassung, gilt die neue letzte Zeile ebenfalls als zuletzt erstellt.
    if (Number.isInteger(rememberedCount) && sections.length > rememberedCount) {
      const appended = sections[sections.length - 1] || null;
      if (activeSystem?.id && appended?.id) {
        this.lastCreatedSectionIds.set(activeSystem.id, appended.id);
        this.lastKnownSectionCounts.set(activeSystem.id, sections.length);
      }
      return appended;
    }

    const remembered = rememberedId
      ? sections.find(section => section?.id === rememberedId)
      : null;

    if (remembered) {
      if (activeSystem?.id) this.lastKnownSectionCounts.set(activeSystem.id, sections.length);
      return remembered;
    }

    const fallback = sections[sections.length - 1] || null;
    if (activeSystem?.id && fallback?.id) {
      this.lastCreatedSectionIds.set(activeSystem.id, fallback.id);
      this.lastKnownSectionCounts.set(activeSystem.id, sections.length);
    }

    return fallback;
  }

  forgetCreatedSection(sectionId, system = null) {
    const activeSystem = system || this.selectedSystem || this.project?.systems?.[0] || null;

    if (!activeSystem?.id || this.lastCreatedSectionIds.get(activeSystem.id) !== sectionId) {
      return;
    }

    this.lastCreatedSectionIds.delete(activeSystem.id);
    this.lastKnownSectionCounts.delete(activeSystem.id);
    this.getLastCreatedSection(activeSystem);
  }

  selectReport(data = null) {
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = data || this.selectedSystem || this.project?.systems?.[0] || this.project || null;

    this.setSelection('report', this.selectedReport);
    this.notify();
  }

  clearSelection(notify = true) {
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = null;

    this.selection = {
      type: this.selectedSystem ? 'system' : 'none',
      id: this.selectedSystem?.id || null,
      data: this.selectedSystem || null
    };

    if (notify) {
      this.notify();
    }
  }

  getSelection() {
    return this.selection;
  }

  getSelectionType() {
    return this.selection.type;
  }

  isSelected(type, id) {
    if (type === 'system') return this.selectedSystem?.id === id;
    if (type === 'section') return this.selectedSection?.id === id;
    if (type === 'formPart') return this.selectedFormPart?.id === id;
    if (type === 'report') return this.selection?.type === 'report';
    if (type === 'special' || type === 'specialComponent') {
      return this.selectedSpecialComponent?.id === id;
    }

    return false;
  }
}