import { calculateKreisBogen } from './calculators/kreisBogenCalculator.js';
import { calculateEckigerBogen } from './calculators/eckigerBogenCalculator.js';
import { calculateKanalBogenWinkel } from './calculators/kanalBogenWinkelCalculator.js';
import { calculateHosenstueck } from './calculators/hosenstueckCalculator.js';
import { calculateEtage45 } from './calculators/etage45Calculator.js';
import { calculateTStueck90, calculateTStueck90Variante2 } from './calculators/tStueck90Calculator.js';
import {
  calculateTAbzweigDurchgangRund1,
  calculateTAbzweigDurchgangRund2,
  calculateTAbzweigRund1,
  calculateTAbzweigRund2,
} from './calculators/tAbzweigCalculator.js';
import { calculateUebergangGrossKlein, calculateUebergangKleinGross } from './calculators/uebergangCalculator.js';
import { calculateSattelstueckMitEinstroemkonus } from './calculators/sattelstueckMitEinstroemkonusCalculator.js';
import { calculateFreierZetaWert } from './calculators/freierZetaWertCalculator.js';

function cleanAssetPath(path) {
  return String(path || '')
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .replace(/^\//, '');
}

function assetPath(path) {
  return cleanAssetPath(path);
}

function lookupText(value = '') {
  return String(value || '')
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isUsefulLookupValue(value) {
  const text = String(value ?? '').trim();
  return text && text !== '-' && text.toLowerCase() !== 'undefined' && text.toLowerCase() !== 'null';
}

function formPartImage(id, fileName = `${id}.png`) {
  return assetPath(`assets/formteile/${fileName}`);
}

function formPartExcel(id, fileName = `${id}.xlsx`) {
  return assetPath(`assets/formteile/${fileName}`);
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
    `assets/formteile/${fileName}`,
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
  const areaRatio = mainArea > 0 ? branchArea / mainArea : 0;

  return {
    w: roundTo(w, 3),
    wA: roundTo(wA, 3),
    A_area: roundTo(mainArea, 6),
    AA_area: roundTo(branchArea, 6),
    wA_w: roundTo(velocityRatio, 3),
    AA_A: roundTo(areaRatio, 3),
  };
}

function calculateSattelstueckGeometry(values = {}) {
  return calculateHosenstueckGeometry(values);
}

function transitionAreaByShape(values = {}, prefix = 'A1') {
  const shape = String(values[`${prefix}_bauform`] || 'Kanal');

  if (shape === 'Rohr') {
    return circleAreaMm(values[`${prefix}_d`]);
  }

  return rectangleAreaMm(values[`${prefix}_breite`], values[`${prefix}_hoehe`]);
}


function calculateTAbzweigGeometry(values = {}) {
  const bauform = String(values.bauform || 'Rohr');
  const isPipe = bauform === 'Rohr';

  const mainArea = isPipe
    ? circleAreaMm(values.A_d)
    : rectangleAreaMm(values.A_breite, values.A_hoehe);

  const branchArea = isPipe
    ? circleAreaMm(values.AA_d)
    : rectangleAreaMm(values.AA_breite, values.AA_hoehe);

  const throughArea = isPipe
    ? circleAreaMm(values.AD_d || values.A_d)
    : rectangleAreaMm(values.AD_breite || values.A_breite, values.AD_hoehe || values.A_hoehe);

  let W = toNumber(values.W);
  let WA = toNumber(values.WA);
  let WD = toNumber(values.WD);

  if (W > 0 && WA > 0 && WD <= 0) WD = Math.max(W - WA, 0);
  if (W > 0 && WD > 0 && WA <= 0) WA = Math.max(W - WD, 0);
  if (W <= 0 && (WA > 0 || WD > 0)) W = WA + WD;

  const w = velocityFromAirflow(W, mainArea);
  const wA = velocityFromAirflow(WA, branchArea);
  const wD = velocityFromAirflow(WD, throughArea);
  const velocityRatio = w > 0 ? wA / w : 0;
  const wdRatio = W > 0 ? WD / W : 0;
  const areaRatio = mainArea > 0 ? branchArea / mainArea : 0;
  const throughAreaRatio = mainArea > 0 ? throughArea / mainArea : 0;

  return {
    W: roundTo(W, 0),
    WA: roundTo(WA, 0),
    WD: roundTo(WD, 0),
    w: roundTo(w, 3),
    wA: roundTo(wA, 3),
    wD: roundTo(wD, 3),
    A_area: roundTo(mainArea, 6),
    AA_area: roundTo(branchArea, 6),
    AD_area: roundTo(throughArea, 6),
    wA_w: roundTo(velocityRatio, 3),
    WD_W: roundTo(wdRatio, 3),
    AA_A: roundTo(areaRatio, 3),
    AD_A: roundTo(throughAreaRatio, 3),
  };
}

function calculateTransitionGeometry(values = {}) {
  const area1 = transitionAreaByShape(values, 'A1');
  const area2 = transitionAreaByShape(values, 'A2');
  const ratio = area2 > 0 ? area1 / area2 : 0;

  return {
    A1: roundTo(area1, 6),
    A2: roundTo(area2, 6),
    A1_A2: roundTo(ratio, 3),
  };
}

function hydraulicDiameterRectangleMm(widthMm, heightMm) {
  const width = toNumber(widthMm);
  const height = toNumber(heightMm);

  return width > 0 && height > 0 ? (2 * width * height) / (width + height) : 0;
}

function calculateEtage45Geometry(values = {}) {
  const bauform = String(values.bauform || 'Rohr');
  const isPipe = bauform === 'Rohr';
  const diameter = isPipe
    ? toNumber(values.d)
    : hydraulicDiameterRectangleMm(values.a, values.b);
  const ratio = diameter > 0 ? toNumber(values.LE) / diameter : 0;

  return {
    dh: roundTo(diameter, 3),
    LE_dh: roundTo(ratio, 3),
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
  A1_bauform: {
    label: 'Kleiner Anschluss A1 – Bauform',
    type: 'select',
    group: 'Kleiner Anschluss A1',
    options: ['Kanal', 'Rohr'],
    default: 'Kanal',
    locked: true,
    help: 'Kanal oder Rohr für den kleineren Anschluss auswählen.',
  },
  A1_breite: {
    label: 'Kleiner Anschluss A1 – Breite [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Kleiner Anschluss A1',
    default: 300,
    step: 1,
    min: 0,
  },
  A1_hoehe: {
    label: 'Kleiner Anschluss A1 – Höhe [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Kleiner Anschluss A1',
    default: 200,
    step: 1,
    min: 0,
  },
  A1_d: {
    label: 'Kleiner Anschluss A1 – Durchmesser [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Kleiner Anschluss A1',
    default: 250,
    step: 1,
    min: 0,
  },
  A2_bauform: {
    label: 'Grosser Anschluss A2 – Bauform',
    type: 'select',
    group: 'Grosser Anschluss A2',
    options: ['Kanal', 'Rohr'],
    default: 'Kanal',
    locked: true,
    help: 'Kanal oder Rohr für den grösseren Anschluss auswählen. Damit ist auch Kanal → Rohr bzw. Rohr → Kanal möglich.',
  },
  A2_breite: {
    label: 'Grosser Anschluss A2 – Breite [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Grosser Anschluss A2',
    default: 500,
    step: 1,
    min: 0,
  },
  A2_hoehe: {
    label: 'Grosser Anschluss A2 – Höhe [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Grosser Anschluss A2',
    default: 300,
    step: 1,
    min: 0,
  },
  A2_d: {
    label: 'Grosser Anschluss A2 – Durchmesser [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Grosser Anschluss A2',
    default: 400,
    step: 1,
    min: 0,
  },
  berechnungsart: {
    label: 'Berechnungsart',
    type: 'select',
    group: 'Ausführung',
    options: ['Winkel β', 'Kanalkante'],
    default: 'Winkel β',
    locked: true,
    help: 'Winkel β = Übergangstabelle. Kanalkante = Kanten-/Abrundungstabelle für gross → klein.',
  },
  kanalkante: {
    label: 'Kanalkante / Abrundung',
    type: 'select',
    group: 'Ausführung',
    options: [1, 2, 3, 4],
    optionLabels: {
      1: '1 – scharfe Kante / ohne Abrundung',
      2: '2 – gebrochene Kante / gefaste Kante',
      3: '3 – gerundete Kante',
      4: '4 – glatte, gute Abrundung',
    },
    default: 1,
    locked: true,
    help: 'Kantenwahl: 1 = scharfe Kante / ohne Abrundung; 2 = gebrochene bzw. gefaste Kante; 3 = gerundete Kante; 4 = glatte, gute Abrundung.',
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
  AD_breite: {
    label: 'Durchgang AD – Breite [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Durchgang AD / WD / wD',
    default: 500,
    step: 1,
    min: 0,
  },
  AD_hoehe: {
    label: 'Durchgang AD – Höhe [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Durchgang AD / WD / wD',
    default: 300,
    step: 1,
    min: 0,
  },
  AD_d: {
    label: 'Durchgang AD – Durchmesser [mm]',
    type: 'number',
    unit: 'mm',
    group: 'Durchgang AD / WD / wD',
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
    label: 'Berechneter kleiner Querschnitt A1 [m²]',
    type: 'number',
    unit: 'm²',
    group: 'Berechnete Werte',
    default: 0,
    step: 0.001,
    min: 0,
    readOnly: true,
    derived: true,
    precision: 6,
    help: 'Wird automatisch aus der gewählten Bauform und Grösse berechnet.',
  },
  A2: {
    label: 'Berechneter grosser Querschnitt A2 [m²]',
    type: 'number',
    unit: 'm²',
    group: 'Berechnete Werte',
    default: 0,
    step: 0.001,
    min: 0,
    readOnly: true,
    derived: true,
    precision: 6,
    help: 'Wird automatisch aus der gewählten Bauform und Grösse berechnet.',
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
    label: 'Durchgang WD – Luftmenge [m³/h]',
    type: 'number',
    unit: 'm³/h',
    group: 'Durchgang AD / WD / wD',
    default: 450,
    step: 1,
    min: 0,
    help: 'Luftmenge im Durchgang. Falls leer, wird WD aus W - WA berechnet.',
  },
  wD: {
    label: 'Durchgang wD – Geschwindigkeit [m/s]',
    type: 'number',
    unit: 'm/s',
    group: 'Durchgang AD / WD / wD',
    default: 0,
    step: 0.001,
    min: 0,
  },
  WD_W: {
    label: 'Verhältnis WD/W',
    type: 'number',
    unit: '',
    group: 'Berechnete Werte',
    default: 0,
    step: 0.001,
    min: 0,
  },
  wA_w: {
    label: 'Verhältnis wA/w',
    type: 'number',
    unit: '',
    group: 'Berechnete Werte',
    default: 0,
    step: 0.001,
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
  bezug: {
    label: 'Berechnung bezogen auf',
    type: 'select',
    group: 'Ausführung',
    options: [
      { value: 'abzweig', label: 'Abzweig ζA – bezogen auf wA' },
      { value: 'durchgang', label: 'Durchgang ζ – bezogen auf w' },
    ],
    default: 'abzweig',
    locked: true,
    help: 'Für den Abzweig wird ζA mit pdyn(wA) gerechnet; für den Durchgang ζ mit pdyn(w).',
  },
  bedingung: {
    label: 'Bedingung der Strömungsaufteilung',
    type: 'select',
    group: 'Ausführung',
    options: [
      { value: 'ueber', label: 'AA + AD > A; AD = A' },
      { value: 'gleich', label: 'AA + AD = A' },
    ],
    default: 'ueber',
    locked: true,
    help: 'Auswahl der Tabellenbedingung gemäss Skizze/Referenztabelle.',
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
  'optionLabels',
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

function getOptionValue(option) {
  if (option && typeof option === 'object' && 'value' in option) {
    return option.value;
  }

  return option;
}

function isNumericOptions(parameter) {
  return Array.isArray(parameter?.options)
    && parameter.options.length > 0
    && parameter.options.every(option => Number.isFinite(Number(getOptionValue(option))));
}

function coerceParameterValue(parameter, value) {
  const fallback = parameter.default ?? 0;

  if (!hasValue(value)) return fallback;

  if (parameter.type === 'select' && Array.isArray(parameter.options) && parameter.options.length) {
    const match = parameter.options.find(option => String(getOptionValue(option)) === String(value));
    return match !== undefined ? getOptionValue(match) : fallback;
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


  resolveId(input) {
    if (!input) return null;

    const candidates = typeof input === 'string'
      ? [input]
      : [
          input.type,
          input.formPartType,
          input.formpartType,
          input.formType,
          input.libraryId,
          input.definitionId,
          input.partType,
          input.partId,
          input.key,
          input.variant,
        ];

    for (const candidate of candidates) {
      if (!isUsefulLookupValue(candidate)) continue;

      const value = String(candidate).trim();
      if (this.items.has(value)) return value;

      const normalized = cleanAssetPath(value).replace(/\.png$|\.xlsx$/i, '');
      if (this.items.has(normalized)) return normalized;
    }

    if (typeof input === 'object') {
      const texts = [input.name, input.title, input.label, input.description]
        .filter(isUsefulLookupValue)
        .map(lookupText)
        .filter(Boolean);

      if (texts.length) {
        const entry = this.all().find(item => {
          const itemTexts = [item.id, item.name, ...(item.keywords || [])]
            .filter(isUsefulLookupValue)
            .map(lookupText)
            .filter(Boolean);

          return itemTexts.some(itemText => texts.some(text => text === itemText || text.includes(itemText) || itemText.includes(text)));
        });

        if (entry) return entry.id;
      }
    }

    return null;
  }

  resolve(input) {
    const id = this.resolveId(input);
    return id ? this.get(id) : null;
  }

  normalizeFormPart(formPart = {}) {
    const entry = this.resolve(formPart);

    if (formPart && entry) {
      formPart.type = entry.id;
    }

    return entry;
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
    id: 'freier_zeta_wert',
    category: 'Spezial',
    name: 'Freier ζ-Wert',
    image: formPartImage('freier_zeta_wert'),
    imageFallbacks: formPartImageSources('freier_zeta_wert'),
    referenceFile: formPartExcel('freier_zeta_wert'),
    keywords: ['frei', 'zeta', 'zetawert', 'widerstandsbeiwert', 'manuell', 'druckverlust'],
    description: 'Herstellerneutrales Formteil mit frei einstellbarem ζ-Wert. Δp wird automatisch mit dem dynamischen Druck der zugeordneten Teilstrecke berechnet.',
    editorMode: 'zeta-only',
    parameters: [
      {
        id: 'zeta',
        label: 'ζ-Wert [-]',
        type: 'number',
        group: 'Widerstandsbeiwert',
        default: 0,
        step: 0.001,
        precision: 3,
        placeholder: 'z. B. 0,35',
        help: 'Widerstandsbeiwert des Formteils. Der Druckverlust wird automatisch als Δp = ζ × p_dyn der zugeordneten Teilstrecke berechnet.',
      },
    ],
    calculate: calculateFreierZetaWert,
  },
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
    description: 'Eckiger Kanalbogen mit ζ-Wert aus R/b und a/b.',
    calculate: calculateEckigerBogen,
    parameters: [
      {
        id: 'R',
        label: 'Radius R [mm]',
        group: 'Geometrie',
        help: 'Radius des eckigen Kanalbogens gemäss Skizze.',
      },
      {
        id: 'a',
        label: 'Breite a [mm]',
        group: 'Geometrie',
        help: 'Breite des rechteckigen Kanals.',
      },
      {
        id: 'b',
        label: 'Höhe b [mm]',
        group: 'Geometrie',
        help: 'Höhe des rechteckigen Kanals. Grundlage für R/b und a/b.',
      },
    ],
  },
  {
    id: 'kanal_bogen_winkel',
    category: 'Rechteck',
    name: 'Kanal-Bogen mit Winkel',
    image: formPartImage('kanal_bogen_winkel'),
    imageFallbacks: formPartImageSources('kanal_bogen_winkel'),
    referenceFile: formPartExcel('kanal_bogen_winkel'),
    keywords: ['bogen', 'winkel', 'rechteck'],
    description: 'Kanal-Bogen mit Winkel α und ζ-Wert aus α und a/b.',
    calculate: calculateKanalBogenWinkel,
    parameters: [
      {
        id: 'alpha',
        group: 'Auswahl',
        options: [20, 30, 45, 60, 75, 90],
        default: 90,
        help: 'Winkel α gemäss Tabelle auswählen. Freie Eingabe ist gesperrt.',
      },
      {
        id: 'a',
        label: 'Breite a [mm]',
        group: 'Geometrie',
        help: 'Breite des rechteckigen Kanals.',
      },
      {
        id: 'b',
        label: 'Höhe b [mm]',
        group: 'Geometrie',
        help: 'Höhe des rechteckigen Kanals. Grundlage für a/b.',
      },
    ],
  },
  {
    id: 'uebergang_gross_klein',
    category: 'Übergänge',
    name: 'Übergang gross → klein',
    image: formPartImage('uebergang_gross_klein'),
    imageFallbacks: formPartImageSources('uebergang_gross_klein'),
    referenceFile: formPartExcel('uebergang_gross_klein'),
    keywords: ['übergang', 'gross', 'klein', 'reduzierung', 'kanal', 'rohr', 'kanalkante'],
    description: 'Übergang von grossem auf kleinen Querschnitt. A1/A2 wird automatisch aus Kanal-/Rohrgrössen berechnet. Winkel β und Kanalkante werden gemeinsam berücksichtigt.',
    derive: calculateTransitionGeometry,
    calculate: calculateUebergangGrossKlein,
    parameters: [
      {
        id: 'beta',
        group: 'Ausführung',
        options: [10, 20, 30, 40, 50, 60],
        default: 30,
        help: 'Winkel β gemäss Tabelle auswählen. ≤ 10° wird als Tabellenwert 10° geführt.',
      },
      {
        id: 'kanalkante',
        group: 'Ausführung',
        help: 'Kantenwahl: 1 = scharfe Kante / ohne Abrundung; 2 = gebrochene bzw. gefaste Kante; 3 = gerundete Kante; 4 = glatte, gute Abrundung. Dieser Wert wird zusätzlich zum Winkel β berücksichtigt.',
      },
      {
        id: 'A2_bauform',
        group: 'Grosser Anschluss A2',
      },
      {
        id: 'A2_breite',
        group: 'Grosser Anschluss A2',
        showWhen: { A2_bauform: 'Kanal' },
      },
      {
        id: 'A2_hoehe',
        group: 'Grosser Anschluss A2',
        showWhen: { A2_bauform: 'Kanal' },
      },
      {
        id: 'A2_d',
        group: 'Grosser Anschluss A2',
        showWhen: { A2_bauform: 'Rohr' },
      },
      {
        id: 'A1_bauform',
        group: 'Kleiner Anschluss A1',
      },
      {
        id: 'A1_breite',
        group: 'Kleiner Anschluss A1',
        showWhen: { A1_bauform: 'Kanal' },
      },
      {
        id: 'A1_hoehe',
        group: 'Kleiner Anschluss A1',
        showWhen: { A1_bauform: 'Kanal' },
      },
      {
        id: 'A1_d',
        group: 'Kleiner Anschluss A1',
        showWhen: { A1_bauform: 'Rohr' },
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
    imageFallbacks: formPartImageSources('uebergang_klein_gross'),
    referenceFile: formPartExcel('uebergang_klein_gross'),
    keywords: ['übergang', 'klein', 'gross', 'erweiterung', 'kanal', 'rohr'],
    description: 'Übergang von kleinem auf grossen Querschnitt. A1/A2 wird automatisch aus Kanal-/Rohrgrössen berechnet.',
    derive: calculateTransitionGeometry,
    calculate: calculateUebergangKleinGross,
    parameters: [
      {
        id: 'beta',
        group: 'Ausführung',
        options: [3, 6, 8, 10, 12, 14, 16, 20, 24, 30, 40, 60, 90, 180],
        default: 30,
        help: 'Winkel β gemäss Tabelle auswählen.',
      },
      {
        id: 'A1_bauform',
        group: 'Kleiner Anschluss A1',
      },
      {
        id: 'A1_breite',
        group: 'Kleiner Anschluss A1',
        showWhen: { A1_bauform: 'Kanal' },
      },
      {
        id: 'A1_hoehe',
        group: 'Kleiner Anschluss A1',
        showWhen: { A1_bauform: 'Kanal' },
      },
      {
        id: 'A1_d',
        group: 'Kleiner Anschluss A1',
        showWhen: { A1_bauform: 'Rohr' },
      },
      {
        id: 'A2_bauform',
        group: 'Grosser Anschluss A2',
      },
      {
        id: 'A2_breite',
        group: 'Grosser Anschluss A2',
        showWhen: { A2_bauform: 'Kanal' },
      },
      {
        id: 'A2_hoehe',
        group: 'Grosser Anschluss A2',
        showWhen: { A2_bauform: 'Kanal' },
      },
      {
        id: 'A2_d',
        group: 'Grosser Anschluss A2',
        showWhen: { A2_bauform: 'Rohr' },
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
    keywords: ['etage', 'versatz', '45', 'kanal', 'rohr'],
    description: 'Etage mit 45° Versatz. Der Bezugsdurchmesser wird je nach Bauform als Rohrdurchmesser d oder hydraulischer Durchmesser dh berechnet.',
    derive: calculateEtage45Geometry,
    calculate: calculateEtage45,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Rohr', 'Kanal'],
        default: 'Rohr',
        locked: true,
        help: 'Rohr = Durchmesser d. Kanal = Breite a und Höhe b; daraus wird der hydraulische Durchmesser dh berechnet.',
      },
      {
        id: 'LE',
        label: 'Länge LE [mm]',
        type: 'number',
        group: 'Geometrie',
        unit: 'mm',
        default: 450,
        step: 1,
        min: 0,
        help: 'Länge des Versatzes gemäss Skizze.',
      },
      {
        id: 'd',
        label: 'Durchmesser d [mm]',
        type: 'number',
        group: 'Rohr',
        unit: 'mm',
        default: 250,
        step: 1,
        min: 0,
        showWhen: { bauform: 'Rohr' },
        help: 'Innendurchmesser des runden Kanals/Rohrs.',
      },
      {
        id: 'a',
        label: 'Breite a [mm]',
        type: 'number',
        group: 'Kanal',
        unit: 'mm',
        default: 500,
        step: 1,
        min: 0,
        showWhen: { bauform: 'Kanal' },
        help: 'Kanalbreite für die Berechnung des hydraulischen Durchmessers dh.',
      },
      {
        id: 'b',
        label: 'Höhe b [mm]',
        type: 'number',
        group: 'Kanal',
        unit: 'mm',
        default: 300,
        step: 1,
        min: 0,
        showWhen: { bauform: 'Kanal' },
        help: 'Kanalhöhe für die Berechnung des hydraulischen Durchmessers dh.',
      },
      {
        id: 'dh',
        label: 'Bezugsdurchmesser d/dh [mm]',
        type: 'number',
        group: 'Berechnete Werte',
        unit: 'mm',
        default: 250,
        readOnly: true,
        derived: true,
        precision: 1,
        help: 'Wird automatisch berechnet. Bei Rohr = d, bei Kanal = hydraulischer Durchmesser dh.',
      },
      {
        id: 'LE_dh',
        label: 'Verhältnis LE/d(dh)',
        type: 'number',
        group: 'Berechnete Werte',
        default: 1.8,
        readOnly: true,
        derived: true,
        precision: 3,
        help: 'Wird automatisch aus LE und d/dh berechnet und für die Tabelle verwendet.',
      },
    ],
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
    calculate: calculateHosenstueck,
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
    description: 'T-Abzweig Durchgang mit ζD aus WD/W. Die Geschwindigkeiten werden aus Luftmengen und Anschlussgrössen automatisch berechnet.',
    derive: calculateTAbzweigGeometry,
    calculate: calculateTAbzweigDurchgangRund1,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Rohr', 'Kanal'],
        default: 'Rohr',
        locked: true,
        help: 'Rohr = Durchmesser für A/AD/AA. Kanal = Breite/Höhe für A/AD/AA.',
      },
      {
        id: 'A_breite',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_hoehe',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_d',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'W',
        label: 'Hauptanschluss W – Luftmenge [m³/h]',
        group: 'Hauptanschluss A / W / w',
        default: 900,
        step: 1,
      },
      {
        id: 'w',
        label: 'Hauptanschluss w – Geschwindigkeit [m/s]',
        group: 'Hauptanschluss A / W / w',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AD_breite',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AD_hoehe',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AD_d',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'WD',
        group: 'Durchgang AD / WD / wD',
        default: 450,
        step: 1,
      },
      {
        id: 'wD',
        group: 'Durchgang AD / WD / wD',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'WD_W',
        label: 'Verhältnis WD/W',
        group: 'Berechnete Werte',
        readOnly: true,
        derived: true,
        precision: 3,
      },
    ],
  },
  {
    id: 't_abzweig_durchgang_rund2',
    category: 'Abzweige',
    name: 'T-Abzweig Durchgang rund 2',
    image: formPartImage('t_abzweig_durchgang_rund2'),
    imageFallbacks: formPartImageSources('t_abzweig_durchgang_rund2'),
    referenceFile: formPartExcel('t_abzweig_durchgang_rund2'),
    keywords: ['t', 'abzweig', 'durchgang', 'rund'],
    description: 'T-Abzweig Durchgang mit ζD aus AA/A, α und wA/w. Die Geschwindigkeiten werden automatisch berechnet.',
    derive: calculateTAbzweigGeometry,
    calculate: calculateTAbzweigDurchgangRund2,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Rohr', 'Kanal'],
        default: 'Rohr',
        locked: true,
      },
      'bedingung',
      {
        id: 'alpha',
        options: [15, 30, 45, 60, 90],
        default: 90,
      },
      {
        id: 'A_breite',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_hoehe',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_d',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'W',
        group: 'Hauptanschluss A / W / w',
        default: 900,
      },
      {
        id: 'w',
        group: 'Hauptanschluss A / W / w',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AD_breite',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AD_hoehe',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AD_d',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'WD',
        group: 'Durchgang AD / WD / wD',
        default: 450,
      },
      {
        id: 'wD',
        group: 'Durchgang AD / WD / wD',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AA_breite',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_hoehe',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_d',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'WA',
        group: 'Abzweig AA / WA / wA',
        default: 450,
      },
      {
        id: 'wA',
        group: 'Abzweig AA / WA / wA',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'wA_w',
        label: 'Verhältnis wA/w',
        group: 'Berechnete Werte',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AA_A',
        label: 'Flächenverhältnis AA/A',
        type: 'number',
        group: 'Berechnete Werte',
        readOnly: true,
        derived: true,
        precision: 3,
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
    description: 'T-Abzweig mit ζA aus α und WD/W. Die Geschwindigkeiten werden automatisch berechnet.',
    derive: calculateTAbzweigGeometry,
    calculate: calculateTAbzweigRund1,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Rohr', 'Kanal'],
        default: 'Rohr',
        locked: true,
      },
      'bedingung',
      {
        id: 'alpha',
        options: [15, 30, 45, 60, 90],
        default: 90,
      },
      {
        id: 'A_breite',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_hoehe',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_d',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'W',
        group: 'Hauptanschluss A / W / w',
        default: 900,
      },
      {
        id: 'w',
        group: 'Hauptanschluss A / W / w',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AD_breite',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AD_hoehe',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AD_d',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'WD',
        group: 'Durchgang AD / WD / wD',
        default: 450,
      },
      {
        id: 'wD',
        group: 'Durchgang AD / WD / wD',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AA_breite',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_hoehe',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_d',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'WA',
        group: 'Abzweig AA / WA / wA',
        default: 450,
      },
      {
        id: 'wA',
        group: 'Abzweig AA / WA / wA',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'WD_W',
        label: 'Verhältnis WD/W',
        group: 'Berechnete Werte',
        readOnly: true,
        derived: true,
        precision: 3,
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
    description: 'T-Abzweig mit ζA aus AA/A, α und wA/w. Die Geschwindigkeiten werden automatisch berechnet.',
    derive: calculateTAbzweigGeometry,
    calculate: calculateTAbzweigRund2,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Rohr', 'Kanal'],
        default: 'Rohr',
        locked: true,
      },
      'bedingung',
      {
        id: 'alpha',
        options: [15, 30, 45, 60, 90],
        default: 90,
      },
      {
        id: 'A_breite',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_hoehe',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_d',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'W',
        group: 'Hauptanschluss A / W / w',
        default: 900,
      },
      {
        id: 'w',
        group: 'Hauptanschluss A / W / w',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AD_breite',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AD_hoehe',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AD_d',
        group: 'Durchgang AD / WD / wD',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'WD',
        group: 'Durchgang AD / WD / wD',
        default: 450,
      },
      {
        id: 'wD',
        group: 'Durchgang AD / WD / wD',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AA_breite',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_hoehe',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_d',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'WA',
        group: 'Abzweig AA / WA / wA',
        default: 450,
      },
      {
        id: 'wA',
        group: 'Abzweig AA / WA / wA',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'wA_w',
        label: 'Verhältnis wA/w',
        group: 'Berechnete Werte',
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AA_A',
        label: 'Flächenverhältnis AA/A',
        type: 'number',
        group: 'Berechnete Werte',
        readOnly: true,
        derived: true,
        precision: 3,
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
    description: '90° T-Stück mit ζ oder ζA aus wA/w. Die Geschwindigkeiten werden aus Luftmenge und Anschlussgrössen automatisch berechnet.',
    derive: calculateHosenstueckGeometry,
    calculate: calculateTStueck90,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Kanal', 'Rohr'],
        default: 'Kanal',
        locked: true,
        help: 'Kanal = Breite/Höhe für Hauptanschluss A und Abzweig AA. Rohr = Durchmesser für A und AA.',
      },
      'bezug',
      {
        id: 'A_breite',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
        help: 'Breite des Hauptanschlusses A.',
      },
      {
        id: 'A_hoehe',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
        help: 'Höhe des Hauptanschlusses A.',
      },
      {
        id: 'A_d',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Rohr' },
        help: 'Durchmesser des Hauptanschlusses A.',
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
        help: 'Breite des Abzweigs AA.',
      },
      {
        id: 'AA_hoehe',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
        help: 'Höhe des Abzweigs AA.',
      },
      {
        id: 'AA_d',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Rohr' },
        help: 'Durchmesser des Abzweigs AA.',
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
    id: 't_stueck_90_2',
    category: 'Abzweige',
    name: '90° T-Stück Variante 2',
    image: formPartImage('t_stueck_90_2'),
    imageFallbacks: formPartImageSources('t_stueck_90_2'),
    referenceFile: formPartExcel('t_stueck_90_2'),
    keywords: ['t', 'stück', '90', 'variante'],
    description: '90° T-Stück Variante 2 mit ζA aus AA/A und wA/w. Die Geschwindigkeiten und das Flächenverhältnis werden automatisch aus den Grössen berechnet.',
    derive: calculateHosenstueckGeometry,
    calculate: calculateTStueck90Variante2,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Kanal', 'Rohr'],
        default: 'Kanal',
        locked: true,
        help: 'Kanal = Breite/Höhe für Hauptanschluss A und Abzweig AA. Rohr = Durchmesser für A und AA.',
      },
      {
        id: 'A_breite',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_hoehe',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_d',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'W',
        label: 'Hauptanschluss W – Luftmenge [m³/h]',
        group: 'Hauptanschluss A / W / w',
        default: 900,
        step: 1,
      },
      {
        id: 'w',
        label: 'Hauptanschluss w – Geschwindigkeit [m/s]',
        group: 'Hauptanschluss A / W / w',
        default: 0,
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AA_breite',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_hoehe',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_d',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Rohr' },
      },
      {
        id: 'WA',
        label: 'Abzweig WA – Luftmenge [m³/h]',
        group: 'Abzweig AA / WA / wA',
        default: 450,
        step: 1,
      },
      {
        id: 'wA',
        label: 'Abzweig wA – Geschwindigkeit [m/s]',
        group: 'Abzweig AA / WA / wA',
        default: 0,
        readOnly: true,
        derived: true,
        precision: 3,
      },
      {
        id: 'AA_A',
        label: 'Flächenverhältnis AA/A',
        type: 'number',
        group: 'Berechnete Werte',
        default: 0.5,
        readOnly: true,
        derived: true,
        precision: 3,
        help: 'Wird automatisch aus Hauptanschluss A und Abzweig AA berechnet.',
      },
    ],
  },
  {
    id: 'sattelstueck_mit_einstroemkonus',
    category: 'Abzweige',
    name: 'Sattelstück mit Einströmkonus',
    image: formPartImage('sattelstueck_mit_einstroemkonus'),
    imageFallbacks: formPartImageSources('sattelstueck_mit_einstroemkonus', 'sattelstueck_mit_einstroemkonus.png', [
      'assets/formteile/sattelstueck_mit_einstroemkonus.png',
    ]),
    referenceFile: formPartExcel('sattelstueck_mit_einstroemkonus'),
    keywords: ['sattelstück', 'einströmkonus', 'abzweig', 'sattel', 'konus'],
    description: 'Sattelstück mit Einströmkonus. Der ζ-Wert ist auf die Hauptgeschwindigkeit w bezogen; w und wA werden aus Luftmenge und Anschlussgrössen automatisch berechnet.',
    derive: calculateSattelstueckGeometry,
    calculate: calculateSattelstueckMitEinstroemkonus,
    parameters: [
      {
        id: 'bauform',
        label: 'Bauform',
        type: 'select',
        group: 'Ausführung',
        options: ['Rohr', 'Kanal'],
        default: 'Rohr',
        locked: true,
        help: 'Rohr = Durchmesser für Hauptanschluss A und Abzweig AA. Kanal = Breite/Höhe für A und AA.',
      },
      {
        id: 'curve',
        label: 'Einströmkonus / Höhe h',
        type: 'select',
        group: 'Ausführung',
        options: [
          { value: 'a', label: 'Kurve a – h ≈ dA/2' },
          { value: 'b', label: 'Kurve b – h ≈ 2dA' },
        ],
        default: 'a',
        locked: true,
        help: 'Ausführung des Einströmkonus gemäss Skizze auswählen.',
      },
      {
        id: 'A_breite',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_hoehe',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'A_d',
        group: 'Hauptanschluss A / W / w',
        showWhen: { bauform: 'Rohr' },
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
        readOnly: true,
        derived: true,
        precision: 3,
        help: 'Wird automatisch aus W und der Hauptanschlussgrösse A berechnet.',
      },
      {
        id: 'AA_breite',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_hoehe',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Kanal' },
      },
      {
        id: 'AA_d',
        group: 'Abzweig AA / WA / wA',
        showWhen: { bauform: 'Rohr' },
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
        readOnly: true,
        derived: true,
        precision: 3,
        help: 'Wird automatisch aus WA und der Abzweiggrösse AA berechnet.',
      },
      {
        id: 'wA_w',
        label: 'Verhältnis wA/w',
        group: 'Berechnete Werte',
        readOnly: true,
        derived: true,
        precision: 3,
      },
    ],
  },
];

export function createDefaultFormPartRegistry() {
  return new FormPartRegistry(defaultFormParts);
}

export default FormPartRegistry;
