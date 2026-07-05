export default class ApplicationState {
  constructor() {
    this.project = null;
    this.selectedSystem = null;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
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
    this.project = project;
    this.selectedSystem = project?.systems?.[0] ?? null;
    this.clearSelection(false);
    this.notify();
  }

  selectSystem(system) {
    this.selectedSystem = system;
    this.clearSelection(false);
    this.notify();
  }

  selectSection(section) {
    this.selectedSection = section;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;
    this.notify();
  }

  selectFormPart(formPart) {
    this.selectedFormPart = formPart;
    this.selectedSection = null;
    this.selectedSpecialComponent = null;
    this.notify();
  }

  selectSpecialComponent(component) {
    this.selectedSpecialComponent = component;
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.notify();
  }

  clearSelection(notify = true) {
    this.selectedSection = null;
    this.selectedFormPart = null;
    this.selectedSpecialComponent = null;

    if (notify) {
      this.notify();
    }
  }

  getSelectionType() {
    if (this.selectedSection) return 'section';
    if (this.selectedFormPart) return 'formPart';
    if (this.selectedSpecialComponent) return 'specialComponent';
    if (this.selectedSystem) return 'system';
    return 'none';
  }

  isSelected(type, id) {
    if (type === 'section') return this.selectedSection?.id === id;
    if (type === 'formPart') return this.selectedFormPart?.id === id;
    if (type === 'special') return this.selectedSpecialComponent?.id === id;
    return false;
  }
}