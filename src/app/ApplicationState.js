export default class ApplicationState {
  constructor() {
    this.project = null;
    this.selectedSystem = null;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;

    this.selection = {
      type: 'none',
      id: null,
      data: null
    };

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
  this.clearSelection(false);
  this.notify();
  }

  setSelection(type, data = null) {
    this.selection = {
      type,
      id: data?.id || null,
      data
    };
  }

  selectSystem(system) {
    this.selectedSystem = system;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;

    this.setSelection('system', system);
    this.notify();
  }

  selectSection(section) {
    this.selectedSection = section;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;

    this.setSelection('section', section);
    this.notify();
  }

  selectFormPart(formPart) {
    this.selectedFormPart = formPart;
    this.selectedSection = null;
    this.selectedSpecialComponent = null;

    this.setSelection('formPart', formPart);
    this.notify();
  }

  selectSpecialComponent(component) {
    this.selectedSpecialComponent = component;
    this.selectedSection = null;
    this.selectedFormPart = null;

    this.setSelection('specialComponent', component);
    this.notify();
  }

  clearSelection(notify = true) {
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;

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
    if (type === 'special' || type === 'specialComponent') {
      return this.selectedSpecialComponent?.id === id;
    }

    return false;
  }
}