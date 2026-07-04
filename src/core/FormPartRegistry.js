/**
 * Druckverlust Pro – FormPartRegistry
 * Version 0.3.3
 *
 * Zentrale Verwaltung der Formteile.
 * Ziel: Neue Formteile später ergänzen, ohne die Hauptberechnung umzubauen.
 */
export class FormPartRegistry {
  constructor(items = []) {
    this.items = new Map();
    items.forEach(item => this.register(item));
  }

  register(item) {
    if (!item || !item.id) throw new Error('Formteil benötigt eine eindeutige id.');
    this.items.set(item.id, Object.freeze({ ...item }));
    return this;
  }

  get(id) {
    return this.items.get(id) || null;
  }

  all() {
    return [...this.items.values()];
  }

  byCategory(category) {
    return this.all().filter(item => item.category === category);
  }

  search(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return this.all();
    return this.all().filter(item => [item.name, item.category, item.keywords?.join(' ')].join(' ').toLowerCase().includes(q));
  }

  calculate(id, values = {}) {
    const item = this.get(id);
    if (!item) throw new Error(`Formteil nicht gefunden: ${id}`);
    if (typeof item.calculate !== 'function') {
      throw new Error(`Für ${item.name} ist noch keine Berechnungsformel hinterlegt.`);
    }
    return item.calculate(values);
  }
}
