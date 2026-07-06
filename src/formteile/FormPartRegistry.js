import { calculateKreisBogen } from './calculators/kreisBogenCalculator.js';

const PARAMETER_PRESETS = Object.freeze({
  R: {
    label: 'Radius R [mm]',
    type: 'number',
    default: 110,
    step: 1,
  },
  d: {
    label: 'Durchmesser d [mm]',
    type: 'number',
    default: 125,
    step: 1,
  },
  alpha: {
    label: 'Winkel α [°]',
    type: 'select',
    options: [15, 30, 45, 60, 90],
    default: 90,
  },
  a: {
    label: 'Breite a [mm]',
    type: 'number',
    default: 500,
    step: 1,
  },
  b: {
    label: 'Höhe b [mm]',
    type: 'number',
    default: 300,
    step: 1,
  },
  A1: {
    label: 'Fläche A1 [m²]',
    type: 'number',
    default: 0,
    step: 0.001,
  },
  A2: {
    label: 'Fläche A2 [m²]',
    type: 'number',
    default: 0,
    step: 0.001,
  },
  LE: {
    label: 'Länge LE [mm]',
    type: 'number',
    default: 0,
    step: 1,
  },
  WD: {
    label: 'Volumenstrom Durchgang',
    type: 'number',
    default: 0,
    step: 0.001,
  },
  WA: {
    label: 'Volumenstrom Abzweig',
    type: 'number',
    default: 0,
    step: 0.001,
  },
  W: {
    label: 'Volumenstrom Gesamt',
    type: 'number',
    default: 0,
    step: 0.001,
  },
  wA: {
    label: 'Geschwindigkeit Abzweig',
    type: 'number',
    default: 0,
    step: 0.001,
  },
  w: {
    label: 'Geschwindigkeit Hauptkanal',
    type: 'number',
    default: 0,
    step: 0.001,
  },
  edge: {
    label: 'Kante / Ausführung',
    type: 'number',
    default: 0,
    step: 1,
  },
});

function normalizeParameter(parameter) {
  const id = typeof parameter === 'string'
    ? parameter
    : parameter?.id;

  if (!id) {
    throw new Error('Formteil-Parameter benötigt eine id.');
  }

  const preset = PARAMETER_PRESETS[id] || {};
  const custom = typeof parameter === 'object' && parameter !== null
    ? parameter
    : {};

  const normalized = {
    id,
    label: custom.label ?? preset.label ?? id,
    type: custom.type ?? preset.type ?? 'number',
    default: custom.default ?? preset.default ?? 0,
  };

  const step = custom.step ?? preset.step;
  if (step !== undefined) normalized.step = step;

  const options = custom.options ?? preset.options;
  if (Array.isArray(options)) normalized.options = [...options];

  return normalized;
}

function normalizeDefinition(definition = {}) {
  const parameters = Array.isArray(definition.parameters)
    ? definition.parameters.map(parameter => normalizeParameter(parameter))
    : [];

  return {
    ...definition,
    parameters,
  };
}

export class FormPartRegistry {
  constructor(definitions = []) {
    this.items = new Map();
    this.registerMany(definitions);
  }

  register(definition) {
    if (!definition?.id) throw new Error('Formteil benötigt eine id.');
    if (!definition?.name) throw new Error(`Formteil ${definition.id} benötigt einen Namen.`);

    const normalizedDefinition = normalizeDefinition(definition);

    this.items.set(normalizedDefinition.id, normalizedDefinition);
    return normalizedDefinition;
  }

  registerMany(definitions = []) {
    definitions.forEach(def => this.register(def));
  }

  get(id) {
    return this.items.get(id) || null;
  }

  getById(id) {
    return this.get(id);
  }

  all() {
    return [...this.items.values()];
  }

  getAll() {
    return this.all();
  }

  exists(id) {
    return this.items.has(id);
  }

  byCategory(category) {
    return this.all().filter(item => item.category === category);
  }

  getByCategory(category) {
    return this.byCategory(category);
  }

  categories() {
    return [...new Set(this.all().map(item => item.category))];
  }

  getCategories() {
    return this.categories();
  }

  search(text = '') {
    const q = String(text).toLowerCase().trim();

    if (!q) return this.all();

    return this.all().filter(item =>
      String(item.name || '').toLowerCase().includes(q) ||
      String(item.category || '').toLowerCase().includes(q) ||
      (item.keywords || []).some(keyword => String(keyword).toLowerCase().includes(q))
    );
  }

  getParameterDefinitions(id) {
    return this.get(id)?.parameters || [];
  }

  getDefaultValues(id) {
    return this.getParameterDefinitions(id).reduce((values, parameter) => {
      values[parameter.id] = parameter.default ?? 0;
      return values;
    }, {});
  }

  normalizeValues(id, values = {}) {
    const normalized = this.getDefaultValues(id);

    this.getParameterDefinitions(id).forEach(parameter => {
      const value = values[parameter.id];

      normalized[parameter.id] = value === undefined || value === null || value === ''
        ? parameter.default ?? 0
        : value;
    });

    return normalized;
  }

  calculate(id, values = {}) {
    const item = this.get(id);

    if (!item) throw new Error(`Formteil nicht gefunden: ${id}`);
    if (typeof item.calculate !== 'function') {
      throw new Error(`Formteil ${id} besitzt keine Berechnungsfunktion.`);
    }

    return item.calculate(this.normalizeValues(id, values));
  }
}

export const defaultFormParts = [
  {
    id: 'kreis_bogen',
    category: 'Rund',
    name: 'Kreisförmiger Bogen / Krümmer',
    image: 'assets/formteile/kreis_bogen.png',
    keywords: ['bogen', 'krümmer', 'rund'],
    parameters: [
      {
        id: 'R',
        label: 'Radius R [mm]',
        type: 'number',
        default: 110,
        step: 1,
      },
      {
        id: 'd',
        label: 'Durchmesser d [mm]',
        type: 'number',
        default: 125,
        step: 1,
      },
      {
        id: 'alpha',
        label: 'Winkel α [°]',
        type: 'select',
        options: [15, 30, 45, 60, 90],
        default: 90,
      },
    ],
    calculate: calculateKreisBogen,
  },
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

export function createDefaultFormPartRegistry() {
  return new FormPartRegistry(defaultFormParts);
}

export default FormPartRegistry;
