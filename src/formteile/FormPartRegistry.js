export class FormPartRegistry {
  constructor() {
    this.items = new Map();
  }

  register(definition) {
    if (!definition?.id) throw new Error('Formteil benötigt eine id.');
    if (!definition?.name) throw new Error(`Formteil ${definition.id} benötigt einen Namen.`);
    this.items.set(definition.id, definition);
    return definition;
  }

  registerMany(definitions = []) {
    definitions.forEach(def => this.register(def));
  }

  get(id) {
    return this.items.get(id);
  }

  all() {
    return [...this.items.values()];
  }

  byCategory(category) {
    return this.all().filter(item => item.category === category);
  }

  calculate(id, values = {}) {
    const item = this.get(id);
    if (!item) throw new Error(`Formteil nicht gefunden: ${id}`);
    if (typeof item.calculate !== 'function') throw new Error(`Formteil ${id} besitzt keine Berechnungsfunktion.`);
    return Number(item.calculate(values));
  }
}

export const defaultFormParts = [
  { id: 'kreis_bogen', category: 'Rund', name: 'Kreisförmiger Bogen / Krümmer', image: 'assets/formteile/kreis_bogen.png', parameters: ['R', 'd', 'alpha'] },
  { id: 'eckiger_bogen', category: 'Rechteck', name: 'Eckiger Kanalbogen', image: 'assets/formteile/eckiger_bogen.png', parameters: ['R', 'a', 'b'] },
  { id: 'kanal_bogen_winkel', category: 'Rechteck', name: 'Kanal-Bogen Winkel', image: 'assets/formteile/kanal_bogen_winkel.png', parameters: ['alpha', 'a', 'b'] },
  { id: 'uebergang_klein_gross', category: 'Übergänge', name: 'Übergang klein → gross', image: 'assets/formteile/uebergang_klein.png', parameters: ['alpha', 'A1', 'A2'] },
  { id: 'uebergang_gross_klein', category: 'Übergänge', name: 'Übergang gross → klein', image: 'assets/formteile/uebergang_gross.png', parameters: ['A1', 'A2'] },
  { id: 'etage_45', category: 'Spezial', name: 'Etage 45°', image: 'assets/formteile/etage_45.png', parameters: ['LE', 'd'] },
  { id: 't_abzweig_durchgang_1', category: 'Abzweige', name: 'T-Abzweig Durchgang Variante 1', image: 'assets/formteile/t_abzweig_durchgang_rund1.png', parameters: ['WD', 'W'] },
  { id: 't_abzweig_durchgang_2', category: 'Abzweige', name: 'T-Abzweig Durchgang Variante 2', image: 'assets/formteile/t_abzweig_durchgang_rund2.png', parameters: ['WA', 'W', 'alpha'] },
  { id: 't_abzweig_1', category: 'Abzweige', name: 'T-Abzweig Variante 1', image: 'assets/formteile/t_abzweig_rund1.png', parameters: ['WD', 'W', 'alpha'] },
  { id: 't_abzweig_2', category: 'Abzweige', name: 'T-Abzweig Variante 2', image: 'assets/formteile/t_abzweig_rund2.png', parameters: ['wA', 'w', 'alpha'] },
  { id: 't_stueck_90', category: 'Abzweige', name: '90° T-Stück', image: 'assets/formteile/t_stueck_90.png', parameters: ['wA', 'w'] }
];

export default FormPartRegistry;
