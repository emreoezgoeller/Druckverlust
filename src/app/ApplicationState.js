export default class ApplicationState {
  constructor() {
    this.project = null;
    this.selectedSystem = null;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = null;

    this.selection = {
      type: 'none',
      id: null,
      data: null
    };

    this.isCalculationDirty = false;
    this.isProjectDirty = false;
    this.lastCalculationAt = null;
    this.lastAutoCalculationError = null;

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

    this.clearSelection(false);
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

  selectFormPartPicker(data = null) {
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.selectedReport = null;

    this.setSelection('formPartPicker', data || this.selectedSystem);
    this.notify();
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