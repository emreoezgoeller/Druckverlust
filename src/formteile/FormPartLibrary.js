// Druckverlust Pro – FormPartLibrary
// Zentrale Bibliothek für verfügbare Formteile.

export const FORM_PARTS = [
  {
    id: 'kreis_bogen_kruemmer',
    name: 'Kreisförmiger Bogen / Krümmer',
    category: 'Rundrohr',
    image: 'assets/formteile/kreis_bogen_kruemmer.png',
    parameters: ['R', 'd', 'alpha'],
    result: 'zeta',
  },
  {
    id: 'eckiger_kanal_bogen',
    name: 'Eckiger Kanal-Bogen',
    category: 'Rechteckkanal',
    image: 'assets/formteile/eckiger_kanal_bogen.png',
    parameters: ['R', 'a', 'b'],
    result: 'zeta',
  },
  {
    id: 'kanal_bogen_winkel',
    name: 'Kanal-Bogen Winkel',
    category: 'Rechteckkanal',
    image: 'assets/formteile/kanal_bogen_winkel.png',
    parameters: ['alpha', 'a', 'b'],
    result: 'zeta',
  },
  {
    id: 'uebergang_klein_gross',
    name: 'Übergang klein auf gross',
    category: 'Übergang',
    image: 'assets/formteile/uebergang_klein_gross.png',
    parameters: ['alpha', 'A1', 'A2'],
    result: 'zeta',
  },
  {
    id: 'uebergang_gross_klein',
    name: 'Übergang gross auf klein',
    category: 'Übergang',
    image: 'assets/formteile/uebergang_gross_klein.png',
    parameters: ['kante', 'A1', 'A2'],
    result: 'zeta',
  },
  {
    id: 'etage_45',
    name: 'Etage mit 45°',
    category: 'Spezialformteil',
    image: 'assets/formteile/etage_45.png',
    parameters: ['Le', 'dh'],
    result: 'zeta',
  },
  {
    id: 't_abzweig_durchgang_1',
    name: 'T-Abzweig – Durchgang',
    category: 'Abzweig',
    image: 'assets/formteile/t_abzweig_durchgang_1.png',
    parameters: ['WD', 'W'],
    result: 'zeta',
  },
  {
    id: 't_abzweig_durchgang_2',
    name: 'T-Abzweig – Durchgang Variante 2',
    category: 'Abzweig',
    image: 'assets/formteile/t_abzweig_durchgang_2.png',
    parameters: ['WA', 'W', 'alpha', 'AA', 'AD', 'A'],
    result: 'zeta',
  },
  {
    id: 't_abzweig_1',
    name: 'T-Abzweig',
    category: 'Abzweig',
    image: 'assets/formteile/t_abzweig_1.png',
    parameters: ['WD', 'W', 'alpha', 'A', 'AA', 'AD'],
    result: 'zeta',
  },
  {
    id: 't_abzweig_2',
    name: 'T-Abzweig Variante 2',
    category: 'Abzweig',
    image: 'assets/formteile/t_abzweig_2.png',
    parameters: ['wA', 'w', 'alpha', 'AA', 'AD', 'A'],
    result: 'zeta',
  },
  {
    id: 't_stueck_90',
    name: '90° T-Stück',
    category: 'T-Stück',
    image: 'assets/formteile/t_stueck_90.png',
    parameters: ['wA', 'w'],
    result: 'zeta',
  },
];

export class FormPartLibrary {
  constructor(items = FORM_PARTS) {
    this.items = items;
  }

  getAll() {
    return this.items;
  }

  getById(id) {
    return this.items.find(item => item.id === id) || null;
  }

  getCategories() {
    return [...new Set(this.items.map(item => item.category))];
  }

  getByCategory(category) {
    return this.items.filter(item => item.category === category);
  }

  search(query = '') {
    const q = query.toLowerCase().trim();

    if (!q) return this.items;

    return this.items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }
}

export default FormPartLibrary;