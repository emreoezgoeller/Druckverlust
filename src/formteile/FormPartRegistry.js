import { calculateKreisBogen } from './calculators/kreisBogenCalculator.js';

function cleanAssetPath(path) {
  return String(path || '')
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .replace(/^\//, '');
}

function assetPath(path) {
  return cleanAssetPath(path);
}

function formPartImage(id, fileName = `${id}.png`) {
  return assetPath(`assets/formteile/${id}/${fileName}`);
}

function formPartExcel(id, fileName = `${id}.xlsx`) {
  return assetPath(`assets/formteile/${id}/${fileName}`);
}

function imageSources(...paths) {
  const sources = [];

  paths.flat().forEach(path => {
    if (!path) return;

    const cleanPath = cleanAssetPath(path);

    [cleanPath, `./${cleanPath}`, `/${cleanPath}`].forEach(source => {
      if (source && !sources.includes(source)) sources.push(source);
    });
  });

  return sources;
}

function formPartImageSources(id, fileName = `${id}.png`, extra = []) {
  return imageSources([
    `assets/formteile/${id}/${fileName}`,
    `assets/formteile/${id}/${id}.png`,
    `assets/formteile/${id}.png`,
    ...extra,
  ]);
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function roundTo(value, digits = 3) {
  const number = toNumber(value);
  const factor = 10 ** digits;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function rectangleAreaMm(widthMm, heightMm) {
  const width = toNumber(widthMm);
  const height = toNumber(heightMm);
  return width > 0 && height > 0 ? (width * height) / 1_000_000 : 0;
}

function circleAreaMm(diameterMm) {
  const diameter = toNumber(diameterMm);
  return diameter > 0 ? (Math.PI * diameter * diameter / 4) / 1_000_000 : 0;
}

function velocityFromAirflow(volumeFlowM3h, areaM2) {
  const q = toNumber(volumeFlowM3h);
  const area = toNumber(areaM2);
  return q > 0 && area > 0 ? q / (3600 * area) : 0;
}

function calculateHosenstueckGeometry(values = {}) {
  const bauform = String(values.bauform || 'Kanal');
  const isPipe = bauform === 'Rohr';

  const mainArea = isPipe
    ? circleAreaMm(values.A_d)
    : rectangleAreaMm(values.A_breite, values.A_hoehe);

  const branchArea = isPipe
    ? circleAreaMm(values.AA_d)
    : rectangleAreaMm(values.AA_breite, values.AA_hoehe);

  const w = velocityFromAirflow(values.W, mainArea);
  const wA = velocityFromAirflow(values.WA, branchArea);
  const velocityRatio = w > 0 ? wA / w : 0;

  return {
    w: roundTo(w, 3),
    wA: roundTo(wA, 3),
    A_area: roundTo(mainArea, 6),
    AA_area: roundTo(branchArea, 6),
    wA_w: roundTo(velocityRatio, 3),
  };
}

const PARAMETER_PRESETS = Object.freeze({
  R: {
    label: 'Radius R [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Geometrie',
    default: 110,
    step: 1,
    min: 0,
  },
  d: {
    label: 'Durchmesser d [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Geometrie',
    default: 125,
    step: 1,
    min: 0,
  },
  alpha: {
    label: 'Winkel α [°]',
    type: 'select',
    unit: '°',
    group: 'Auswahl',
    options: [15, 30, 45, 60, 90],
    default: 90,
    locked: true,
    help: 'Der Winkel α wird gewählt. Freie Eingaben sind bewusst gesperrt.',
  },
  beta: {
    label: 'Winkel β [°]',
    type: 'select',
    unit: '°',
    group: 'Auswahl',
    options: [10, 20, 30, 40, 50, 60],
    default: 30,
    locked: true,
    help: 'Der Winkel β wird gewählt. Freie Eingaben sind bewusst gesperrt.',
  },
  a: {
    label: 'Breite a [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Geometrie',
    default: 500,
    step: 1,
    min: 0,
  },
  b: {
    label: 'Höhe b [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Geometrie',
    default: 300,
    step: 1,
    min: 0,
  },
  A_breite: {
    label: 'Hauptanschluss A – Breite [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Hauptanschluss A / W / w',
    default: 500,
    step: 1,
    min: 0,
  },
  A_hoehe: {
    label: 'Hauptanschluss A – Höhe [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Hauptanschluss A / W / w',
    default: 300,
    step: 1,
    min: 0,
  },
  A_d: {
    label: 'Hauptanschluss A – Durchmesser [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Hauptanschluss A / W / w',
    default: 400,
    step: 1,
    min: 0,
  },
  AA_breite: {
    label: 'Abzweig AA – Breite [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Abzweig AA / WA / wA',
    default: 300,
    step: 1,
    min: 0,
  },
  AA_hoehe: {
    label: 'Abzweig AA – Höhe [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Abzweig AA / WA / wA',
    default: 200,
    step: 1,
    min: 0,
  },
  AA_d: {
    label: 'Abzweig AA – Durchmesser [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Abzweig AA / WA / wA',
    default: 250,
    step: 1,
    min: 0,
  },
  A1: {
    label: 'Fläche A1 [m²]',
    type: 'number',
    unit: 'm²',
    group: 'Geometrie',
    default: 0,
    step: 0.001,
    min: 0,
  },
  A2: {
    label: 'Fläche A2 [m²]',
    type: 'number',
    unit: 'm²',
    group: 'Geometrie',
    default: 0,
    step: 0.001,
    min: 0,
  },
  LE: {
    label: 'Länge LE [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Geometrie',
    default: 0,
    step: 1,
    min: 0,
  },
  WD: {
    label: 'Volumenstrom Durchgang WD [m³/h]',
    type: 'number',
    unit: 'm³/h',
    group: 'Volumenstrom',
    default: 0,
    step: 1,
    min: 0,
  },
  WA: {
    label: 'Abzweig WA – Luftmenge [m³/h]',
    type: 'number',
    unit: 'm³/h',
    group: 'Volumenstrom',
    default: 0,
    step: 1,
    min: 0,
  },
  W: {
    label: 'Hauptanschluss W – Luftmenge [m³/h]',
    type: 'number',
    unit: 'm³/h',
    group: 'Volumenstrom',
    default: 0,
    step: 1,
    min: 0,
  },
  wA: {
    label: 'Abzweig wA – Geschwindigkeit [m/s]',
    type: 'number',
    unit: 'm/s',
    group: 'Geschwindigkeit',
    default: 0,
    step: 0.001,
    min: 0,
  },
  w: {
    label: 'Hauptanschluss w – Geschwindigkeit [m/s]',
    type: 'number',
    unit: 'm/s',
    group: 'Geschwindigkeit',
    default: 0,
    step: 0.001,
    min: 0,
  },
  AA_A: {
    label: 'Flächenverhältnis AA/A',
    type: 'select',
    unit: '',
    group: 'Verhältniswerte',
    options: [0.1, 0.3, 0.5, 0.7, 1],
    default: 0.5,
    locked: true,
    help: 'Auswahlwert aus der hinterlegten Referenztabelle.',
  },
  A1_A2: {
    label: 'Flächenverhältnis A1/A2',
    type: 'number',
    unit: '',
    group: 'Verhältniswerte',
    default: 1,
    step: 0.001,
    min: 0,
  },
  curve: {
    label: 'Kurve / Ausführung',
    type: 'select',
    group: 'Ausführung',
    options: ['a', 'b'],
    default: 'a',
    locked: true,
    help: 'Auswahl der Tabellenkurve.',
  },
  edge: {
    label: 'Kante / Ausführung',
    type: 'number',
    group: 'Ausführung',
    default: 0,
    step: 1,
  },
});

const PARAMETER_META_FIELDS = [
  'group',
  'unit',
  'step',
  'min',
  'max',
  'options',
  'help',
  'locked',
  'placeholder',
  'source',
  'showWhen',
  'readOnly',
  'derived',
  'precision',
];

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function isNumericOptions(parameter) {
  return Array.isArray(parameter?.options)
    && parameter.options.length > 0
    && parameter.options.every(option => Number.isFinite(Number(option)));
}

function coerceParameterValue(parameter, value) {
  const fallback = parameter.default ?? 0;

  if (!hasValue(value)) return fallback;

  if (parameter.type === 'select' && Array.isArray(parameter.options) && parameter.options.length) {
    const match = parameter.options.find(option => String(option) === String(value));
    return match ?? fallback;
  }

  if (parameter.type === 'number' || isNumericOptions(parameter)) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  return value;
}

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

  PARAMETER_META_FIELDS.forEach(field => {
    const value = custom[field] ?? preset[field];

    if (value === undefined) return;

    normalized[field] = Array.isArray(value) ? [...value] : value;
  });

  normalized.default = coerceParameterValue(normalized, normalized.default);

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
      normalized[parameter.id] = coerceParameterValue(parameter, values[parameter.id]);
    });

    return normalized;
  }

  deriveValues(id, values = {}) {
    const item = this.get(id);
    const normalized = this.normalizeValues(id, values);

    if (!item || typeof item.derive !== 'function') return normalized;

    return {
      ...normalized,
      ...item.derive(normalized),
    };
  }

  calculate(id, values = {}) {
    const item = this.get(id);

    if (!item) throw new Error(`Formteil nicht gefunden: ${id}`);
    if (typeof item.calculate !== 'function') {
      throw new Error(`Formteil ${id} besitzt keine Berechnungsfunktion.`);
    }

    return item.calculate(this.deriveValues(id, values));
  }
}

export const defaultFormParts = [
  {
    id: 'kreis_bogen',
    category: 'Rund',
    name: 'Kreisförmiger Bogen / Krümmer',
    image: formPartImage('kreis_bogen'),
    imageFallbacks: formPartImageSources('kreis_bogen'),
    referenceFile: formPartExcel('kreis_bogen'),
    keywords: ['bogen', 'krümmer', 'rund'],
    description: 'Runder Bogen/Krümmer mit Berechnung des ζ-Werts über R/d und Winkel α.',
    parameters: [
      {
        id: 'R',
        label: 'Radius R [mm]',
        type: 'number',
        group: 'Geometrie',
        unit: 'mm',
        default: 110,
        step: 1,
        min: 0,
        help: 'Radius des Bogens gemäss Skizze.',
      },
      {
        id: 'd',
        label: 'Durchmesser d [mm]',
        type: 'number',
        group: 'Geometrie',
        unit: 'mm',
        default: 125,
        step: 1,
        min: 0,
        help: 'Innendurchmesser des runden Kanals/Rohrs.',
      },
      {
        id: 'alpha',
        label: 'Winkel α [°]',
        type: 'select',
        group: 'Auswahl',
        unit: '°',
        options: [0, 20, 30, 45, 60, 75, 90, 110, 130, 150, 180],
        default: 90,
        locked: true,
        help: 'Der Winkel α wird gewählt. Freie Eingaben sind bewusst gesperrt.',
      },
    ],
    calculate: calculateKreisBogen,
  },
  {
    id: 'eckiger_bogen',
    category: 'Rechteck',
    name: 'Eckiger Kanalbogen',
    image: formPartImage('eckiger_bogen'),
    imageFallbacks: formPartImageSources('eckiger_bogen'),
    referenceFile: formPartExcel('eckiger_bogen'),
    keywords: ['bogen', 'rechteck', 'kanal'],
    parameters: ['R', 'a', 'b'],
  },
  {
    id: 'kanal_bogen_winkel',
    category: 'Rechteck',
    name: 'Kanal-Bogen mit Winkel',
    image: formPartImage('kanal_bogen_winkel'),
    imageFallbacks: formPartImageSources('kanal_bogen_winkel'),
    referenceFile: formPartExcel('kanal_bogen_winkel'),
    keywords: ['bogen', 'winkel', 'rechteck'],
    parameters: [
      {
        id: 'alpha',
        options: [20, 30, 45, 60, 75, 90],
        default: 90,
      },
      'a',
      'b',
    ],
  },
  {
    id: 'uebergang_gross_klein',
    category: 'Übergänge',
    name: 'Übergang gross → klein',
    image: formPartImage('uebergang_gross_klein'),
    imageFallbacks: formPartImageSources('uebergang_gross_klein', 'uebergang_klein.png', [
      'assets/formteile/uebergang_klein.png',
      'assets/formteile/uebergang_gross_klein.png',
    ]),
    referenceFile: formPartExcel('uebergang_gross_klein'),
    keywords: ['übergang', 'gross', 'klein', 'reduzierung'],
    parameters: [
      {
        id: 'beta',
        options: [10, 20, 30, 40, 50, 60],
        default: 30,
      },
      'A1',
      'A2',
    ],
  },
  {
    id: 'uebergang_klein_gross',
    category: 'Übergänge',
    name: 'Übergang klein → gross',
    image: formPartImage('uebergang_klein_gross'),
    imageFallbacks: formPartImageSources('uebergang_klein_gross', 'uebergang_gross.png', [
      'assets/formteile/uebergang_gross.png',
      'assets/formteile/uebergang_klein_gross.png',
    ]),
    referenceFile: formPartExcel('uebergang_klein_gross'),
    keywords: ['übergang', 'klein', 'gross', 'erweiterung'],
    parameters: [
      {
        id: 'beta',
        options: [3, 6, 8, 10, 12, 14, 16, 20, 24, 30, 40, 60],
        default: 30,
      },
      'A1',
      'A2',
    ],
  },
  {
    id: 'etage_45',
    category: 'Spezial',
    name: 'Etage 45°',
    image: formPartImage('etage_45'),
    imageFallbacks: formPartImageSources('etage_45'),
    referenceFile: formPartExcel('etage_45'),
    keywords: ['etage', 'versatz', '45'],
    parameters: ['LE', 'd'],
  },
  {
    id: 'hosenstueck',
    category: 'Abzweige',
    name: 'Hosenstück',
    image: formPartImage('hosenstueck'),
    imageFallbacks: formPartImageSources('hosenstueck'),
    referenceFile: formPartExcel('hosenstueck'),
    keywords: ['hosenstück', 'abzweig', 'verteiler', 'kanal', 'rohr'],
    description: 'Hosenstück mit Hauptanschluss A/W/w und Abzweig AA/WA/wA. Die Geschwindigkeiten werden aus Luftmenge und Grösse automatisch berechnet.',
    derive: calculateHosenstueckGeometry,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Kanal', 'Rohr'],
        default: 'Kanal',
        locked: true,
        help: 'Kanal = Breite/Höhe für A und AA. Rohr = Durchmesser für A und AA.',
      },
      {
        id: 'alpha',
        group: 'Auswahl',
        options: [5, 15, 30, 45, 60],
        default: 45,
        help: 'Winkel α gemäss Tabelle.',
      },
      {
        id: 'A_breite',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
        help: 'Breite des grösseren Hauptkanals A.',
      },
      {
        id: 'A_hoehe',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
        help: 'Höhe des grösseren Hauptkanals A.',
      },
      {
        id: 'A_d',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Rohr' },
        help: 'Durchmesser des grösseren Hauptrohrs A.',
      },
      {
        id: 'W',
        label: 'Hauptanschluss W – Luftmenge [m³/h]',
        group: 'Hauptanschluss A / W / w',
        default: 900,
        step: 1,
        help: 'Luftmenge im Hauptanschluss. Daraus wird w automatisch berechnet.',
      },
      {
        id: 'w',
        label: 'Hauptanschluss w – Geschwindigkeit [m/s]',
        group: 'Hauptanschluss A / W / w',
        default: 0,
        readOnly: true,
        derived: true,
        precision: 3,
        help: 'Wird automatisch aus W und der Hauptanschlussgrösse A berechnet.',
      },
      {
        id: 'AA_breite',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
        help: 'Breite des Abzweigkanals AA.',
      },
      {
        id: 'AA_hoehe',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
        help: 'Höhe des Abzweigkanals AA.',
      },
      {
        id: 'AA_d',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Rohr' },
        help: 'Durchmesser des Abzweigrohrs AA.',
      },
      {
        id: 'WA',
        label: 'Abzweig WA – Luftmenge [m³/h]',
        group: 'Abzweig AA / WA / wA',
        default: 450,
        step: 1,
        help: 'Luftmenge im Abzweig. Daraus wird wA automatisch berechnet.',
      },
      {
        id: 'wA',
        label: 'Abzweig wA – Geschwindigkeit [m/s]',
        group: 'Abzweig AA / WA / wA',
        default: 0,
        readOnly: true,
        derived: true,
        precision: 3,
        help: 'Wird automatisch aus WA und der Abzweiggrösse AA berechnet.',
      },
    ],
  },
  {
    id: 't_abzweig_durchgang_rund1',
    category: 'Abzweige',
    name: 'T-Abzweig Durchgang rund 1',
    image: formPartImage('t_abzweig_durchgang_rund1'),
    imageFallbacks: formPartImageSources('t_abzweig_durchgang_rund1'),
    referenceFile: formPartExcel('t_abzweig_durchgang_rund1'),
    keywords: ['t', 'abzweig', 'durchgang', 'rund'],
    parameters: ['WD', 'W'],
  },
  {
    id: 't_abzweig_durchgang_rund2',
    category: 'Abzweige',
    name: 'T-Abzweig Durchgang rund 2',
    image: formPartImage('t_abzweig_durchgang_rund2'),
    imageFallbacks: formPartImageSources('t_abzweig_durchgang_rund2'),
    referenceFile: formPartExcel('t_abzweig_durchgang_rund2'),
    keywords: ['t', 'abzweig', 'durchgang', 'rund'],
    parameters: [
      'wA',
      'w',
      {
        id: 'AA_A',
        options: [0.1, 0.3, 0.5, 0.7, 1],
        default: 0.5,
      },
      {
        id: 'alpha',
        options: [15, 30, 45, 60, 90],
        default: 90,
      },
    ],
  },
  {
    id: 't_abzweig_rund1',
    category: 'Abzweige',
    name: 'T-Abzweig rund 1',
    image: formPartImage('t_abzweig_rund1'),
    imageFallbacks: formPartImageSources('t_abzweig_rund1'),
    referenceFile: formPartExcel('t_abzweig_rund1'),
    keywords: ['t', 'abzweig', 'rund'],
    parameters: [
      'WD',
      'W',
      {
        id: 'alpha',
        options: [15, 30, 45, 60, 90],
        default: 90,
      },
    ],
  },
  {
    id: 't_abzweig_rund2',
    category: 'Abzweige',
    name: 'T-Abzweig rund 2',
    image: formPartImage('t_abzweig_rund2'),
    imageFallbacks: formPartImageSources('t_abzweig_rund2'),
    referenceFile: formPartExcel('t_abzweig_rund2'),
    keywords: ['t', 'abzweig', 'rund'],
    parameters: [
      'wA',
      'w',
      {
        id: 'AA_A',
        options: [0.1, 0.3, 0.5, 0.7, 1],
        default: 0.5,
      },
      {
        id: 'alpha',
        options: [15, 30, 45, 60, 90],
        default: 90,
      },
    ],
  },
  {
    id: 't_stueck_90',
    category: 'Abzweige',
    name: '90° T-Stück',
    image: formPartImage('t_stueck_90'),
    imageFallbacks: formPartImageSources('t_stueck_90'),
    referenceFile: formPartExcel('t_stueck_90'),
    keywords: ['t', 'stück', '90', 'abzweig'],
    parameters: ['wA', 'w'],
  },
  {
    id: 't_stueck_90_2',
    category: 'Abzweige',
    name: '90° T-Stück Variante 2',
    image: formPartImage('t_stueck_90_2'),
    imageFallbacks: formPartImageSources('t_stueck_90_2'),
    referenceFile: formPartExcel('t_stueck_90_2'),
    keywords: ['t', 'stück', '90', 'variante'],
    parameters: [
      'wA',
      'w',
      {
        id: 'AA_A',
        options: [0.5, 0.75, 1],
        default: 1,
      },
    ],
  },
  {
    id: 'sattelstueck_mit_einstroemkonus',
    category: 'Abzweige',
    name: 'Sattelstück mit Einströmkonus',
    image: formPartImage('sattelstueck_mit_einstroemkonus'),
    imageFallbacks: formPartImageSources('sattelstueck_mit_einstroemkonus', 'sattelstueck_mit_einstroemkonus.png', [
      'assets/formteile/sattelstueck_mit_einstroemkonus/sattelst#U00fcck_mit_einstroemkonus.png',
      'assets/formteile/sattelstueck_mit_einstroemkonus.png',
    ]),
    referenceFile: formPartExcel('sattelstueck_mit_einstroemkonus'),
    keywords: ['sattelstück', 'einströmkonus', 'abzweig'],
    parameters: [
      'wA',
      'w',
      {
        id: 'curve',
        options: ['a', 'b'],
        default: 'a',
        help: 'Kurve a oder b gemäss Ausführung auswählen.',
      },
    ],
  },
];

export function createDefaultFormPartRegistry() {
  return new FormPartRegistry(defaultFormParts);
}

export default FormPartRegistry;
