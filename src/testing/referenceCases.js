// Druckverlust Pro – feste Referenzfälle für den Rechenkern
//
// Die Sollwerte sind bewusst als feste Zahlen hinterlegt. Sie werden nicht
// zur Laufzeit mit dem Rechenkern erzeugt. Dadurch erkennen die Tests spätere
// unbeabsichtigte Änderungen an Formeln, Einheiten oder Rundungen.

const CORE_SETTINGS = Object.freeze({
  rho: 1.21,
  lambda: 0.025,
  frictionFactorMode: 'fixed',
  sectionRoundingStep: 0.5,
});

export const REFERENCE_CASES = Object.freeze([
  {
    id: 'REF-001',
    group: 'Kernformeln',
    title: 'Rechteckkanal mit ζ-Verlust',
    kind: 'section',
    referenceType: 'formula',
    source: 'Unabhängige Handrechnung: A = b·h, Dh = 2bh/(b+h), v = q/(3600A), p_dyn = ρv²/2, R = λp_dyn/Dh.',
    input: {
      section: {
        id: 'rect-001',
        type: 'duct',
        q: 1800,
        b: 0.6,
        h: 0.3,
        l: 12,
        zetaSum: 0.8,
      },
      options: { settings: CORE_SETTINGS },
    },
    expectations: [
      { label: 'Querschnitt A', path: 'area', expected: 0.18, tolerance: 1e-10, unit: 'm²' },
      { label: 'Hydraulischer Durchmesser', path: 'hydraulicDiameter', expected: 0.4, tolerance: 1e-10, unit: 'm' },
      { label: 'Geschwindigkeit', path: 'velocity', expected: 2.7777777778, tolerance: 1e-8, unit: 'm/s' },
      { label: 'Dynamischer Druck', path: 'dynamicPressure', expected: 4.6682098765, tolerance: 1e-8, unit: 'Pa' },
      { label: 'Reibungsgefälle', path: 'frictionRate', expected: 0.2917631173, tolerance: 1e-8, unit: 'Pa/m' },
      { label: 'Reibungsverlust', path: 'frictionLoss', expected: 3.5011574074, tolerance: 1e-8, unit: 'Pa' },
      { label: 'Formteilverlust', path: 'zetaLoss', expected: 3.7345679012, tolerance: 1e-8, unit: 'Pa' },
      { label: 'Total ungerundet', path: 'totalLoss', expected: 7.2357253086, tolerance: 1e-8, unit: 'Pa' },
      { label: 'Total auf 0.5 Pa aufgerundet', path: 'roundedTotalLoss', expected: 7.5, tolerance: 1e-10, unit: 'Pa' },
    ],
  },
  {
    id: 'REF-002',
    group: 'Kernformeln',
    title: 'Rundrohr mit ζ-Verlust',
    kind: 'section',
    referenceType: 'formula',
    source: 'Unabhängige Handrechnung mit Kreisfläche A = πd²/4 und Dh = d.',
    input: {
      section: {
        id: 'pipe-001',
        type: 'pipe',
        q: 2500,
        d: 0.5,
        l: 20,
        zetaSum: 0.45,
      },
      options: { settings: CORE_SETTINGS },
    },
    expectations: [
      { label: 'Querschnitt A', path: 'area', expected: 0.19634954084936207, tolerance: 1e-12, unit: 'm²' },
      { label: 'Geschwindigkeit', path: 'velocity', expected: 3.53677651315323, tolerance: 1e-10, unit: 'm/s' },
      { label: 'Dynamischer Druck', path: 'dynamicPressure', expected: 7.567816802915352, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Reibungsgefälle', path: 'frictionRate', expected: 0.3783908401457676, tolerance: 1e-10, unit: 'Pa/m' },
      { label: 'Reibungsverlust', path: 'frictionLoss', expected: 7.5678168029153525, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Formteilverlust', path: 'zetaLoss', expected: 3.405517561311908, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Total ungerundet', path: 'totalLoss', expected: 10.973334364227261, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Total auf 0.5 Pa aufgerundet', path: 'roundedTotalLoss', expected: 11, tolerance: 1e-10, unit: 'Pa' },
    ],
  },
  {
    id: 'REF-003',
    group: 'Summenbildung',
    title: 'Formteil ζ + Direktverlust + Sonderbauteil',
    kind: 'project',
    referenceType: 'formula',
    source: 'Feste Kontrollsumme aus Reibung, Σζ, direktem Formteilverlust und Sonderbauteil.',
    input: {
      settings: CORE_SETTINGS,
      sections: [
        {
          id: 'sum-ts-1',
          type: 'duct',
          q: 1800,
          b: 0.6,
          h: 0.3,
          l: 12,
          zetaSum: 0.2,
        },
      ],
      formParts: [
        { id: 'sum-fp-zeta', sectionId: 'sum-ts-1', zeta: 0.3 },
        { id: 'sum-fp-direct', sectionId: 'sum-ts-1', lossMode: 'direct', pressureLossPa: 12.5 },
      ],
      specialComponents: [
        { id: 'sum-special-1', name: 'Filter', pressureLoss: 40 },
      ],
    },
    expectations: [
      { label: 'Reibung total', path: 'totals.friction', expected: 3.5011574074074066, tolerance: 1e-10, unit: 'Pa' },
      { label: 'ζ-Verlust total', path: 'totals.zetaLoss', expected: 2.3341049382716044, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Direktverlust Formteile', path: 'totals.directFormPartLoss', expected: 12.5, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Sonderbauteile', path: 'totals.special', expected: 40, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Gesamtdruckverlust', path: 'totals.total', expected: 58.33526234567901, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Gesamtdruckverlust gerundet', path: 'totals.totalRounded', expected: 58.5, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Audit-Differenz', path: 'totals.audit.difference', expected: 0, tolerance: 1e-10, unit: 'Pa' },
      { label: 'Audit-Status', path: 'totals.audit.ok', expected: true, exact: true },
    ],
  },
  {
    id: 'REF-004',
    group: 'Rundung',
    title: 'Aufrundung auf 0.5 Pa',
    kind: 'utilityBatch',
    referenceType: 'formula',
    source: 'Definierte Projektregel: positive Teilstreckenwerte werden auf den nächsten 0.5-Pa-Schritt aufgerundet.',
    input: {
      operation: 'roundUpToStep',
      rows: [
        { value: 0, step: 0.5 },
        { value: 0.01, step: 0.5 },
        { value: 0.5, step: 0.5 },
        { value: 0.5000001, step: 0.5 },
        { value: 7.2357253086, step: 0.5 },
      ],
    },
    expectations: [
      { label: '0 Pa', path: '0', expected: 0, tolerance: 1e-10, unit: 'Pa' },
      { label: '0.01 Pa', path: '1', expected: 0.5, tolerance: 1e-10, unit: 'Pa' },
      { label: '0.5 Pa', path: '2', expected: 0.5, tolerance: 1e-10, unit: 'Pa' },
      { label: '0.5000001 Pa', path: '3', expected: 1, tolerance: 1e-10, unit: 'Pa' },
      { label: '7.2357 Pa', path: '4', expected: 7.5, tolerance: 1e-10, unit: 'Pa' },
    ],
  },
  {
    id: 'REF-005',
    group: 'Eingaben',
    title: 'Dezimalkomma und Typ-Erkennung',
    kind: 'inputNormalization',
    referenceType: 'formula',
    source: 'Definierte Eingaberegeln des Tools.',
    input: {
      numbers: ['1,21', '0,50', '', 'nicht-zahl'],
      sections: [
        { type: 'Rohr', d: 0.4 },
        { d: 0.4 },
        { type: 'Kanal', b: 0.5, h: 0.3 },
      ],
    },
    expectations: [
      { label: 'Dezimalkomma 1,21', path: 'numbers.0', expected: 1.21, tolerance: 1e-12 },
      { label: 'Dezimalkomma 0,50', path: 'numbers.1', expected: 0.5, tolerance: 1e-12 },
      { label: 'Leere Eingabe', path: 'numbers.2', expected: 0, tolerance: 1e-12 },
      { label: 'Ungültige Eingabe', path: 'numbers.3', expected: 0, tolerance: 1e-12 },
      { label: 'Explizites Rohr', path: 'types.0', expected: 'pipe', exact: true },
      { label: 'Automatisch erkanntes Rohr', path: 'types.1', expected: 'pipe', exact: true },
      { label: 'Expliziter Kanal', path: 'types.2', expected: 'duct', exact: true },
    ],
  },
  {
    id: 'TEST-001',
    group: 'Externe Referenz',
    title: '900 m³/h – Excel-Vergleich',
    kind: 'serviceProject',
    referenceType: 'external',
    source: 'Referenzwert 109.5 Pa aus Emres Excel-Screenshot; Toleranz 1.0 Pa bis zur Einzelvalidierung aller Formteile.',
    input: {
      project: {
        id: 'test-001-project',
        name: 'TEST-001',
        settings: { rho: 1.21, lambda: 0.025, sectionRoundingStep: 0.5 },
        systems: [
          {
            id: 'anlage-test-001',
            name: 'TEST-001',
            sections: [
              { id: 'ts1', type: 'duct', ts: 'TS1', description: 'Rechteckkanal 450 × 450', q: 900, b: 0.45, h: 0.45, l: 1.25, zetaSum: 0.33 },
              { id: 'ts2', type: 'duct', ts: 'TS2', description: 'Rechteckkanal 800 × 800', q: 900, b: 0.8, h: 0.8, l: 1.25, zetaSum: 0 },
              { id: 'mb1', type: 'special', description: 'Monoblock', pa: 100 },
              { id: 'ts3', type: 'pipe', ts: 'TS3', description: 'Rohr Ø500', q: 900, d: 0.5, l: 1.25, zetaSum: 2.36 },
              { id: 'ts4', type: 'pipe', ts: 'TS4', description: 'Rohr Ø300', q: 900, d: 0.3, l: 1.25, zetaSum: 0.59 },
              { id: 'ts5', type: 'pipe', ts: 'TS5', description: 'Rohr Ø400', q: 900, d: 0.4, l: 1.25, zetaSum: 0 },
            ],
            formParts: [],
            specialComponents: [],
          },
        ],
      },
    },
    expectations: [
      { label: 'Excel-Gesamtwert', path: 'calculation.totals.totalRounded', expected: 109.5, tolerance: 1, unit: 'Pa' },
      { label: 'Summenaudit', path: 'calculation.totals.audit.ok', expected: true, exact: true },
    ],
  },
]);

export default REFERENCE_CASES;
