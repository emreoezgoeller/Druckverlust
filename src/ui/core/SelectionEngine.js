// Druckverlust Pro – SelectionEngine
// Zentrale Auswahlverwaltung für UI-Komponenten.

export default class SelectionEngine {
  constructor() {
    this.selection = {
      type: null,
      id: null,
      data: null
    };

    this.listeners = [];
  }

  select(type, id, data = null) {
    this.selection = {
      type,
      id,
      data
    };

    this.notify();
  }

  clear() {
    this.selection = {
      type: null,
      id: null,
      data: null
    };

    this.notify();
  }

  getSelection() {
    return this.selection;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('SelectionEngine.subscribe erwartet eine Funktion.');
    }

    this.listeners.push(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.selection);
    }
  }
}