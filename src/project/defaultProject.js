// Druckverlust Pro – DefaultProject
// Zentraler Projektstarter für App-Start, Neu-Button und spätere Imports.

const DEFAULT_SETTINGS = Object.freeze({
  rho: 1.21,
  defaultRoughnessMm: 0.15,
  kinematicViscosity: 0.0000151,
  sectionRoundingStep: 0.5,
});

function createDefaultSections(systemId) {
  return [
    {
      id: `${systemId}-ts1`,
      name: 'ts1',
      type: 'duct',
      description: 'Rechteckkanal 450 × 450 mm',
      q: 900,
      b: 0.45,
      h: 0.45,
      d: 0,
      l: 1.25,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
    {
      id: `${systemId}-ts2`,
      name: 'ts2',
      type: 'duct',
      description: 'Rechteckkanal 800 × 800 mm',
      q: 900,
      b: 0.8,
      h: 0.8,
      d: 0,
      l: 1.25,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
    {
      id: `${systemId}-ts3`,
      name: 'ts3',
      type: 'pipe',
      description: 'Rundrohr Ø500 mm',
      q: 900,
      b: 0,
      h: 0,
      d: 0.5,
      l: 1.25,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
    {
      id: `${systemId}-ts4`,
      name: 'ts4',
      type: 'pipe',
      description: 'Rundrohr Ø300 mm',
      q: 900,
      b: 0,
      h: 0,
      d: 0.3,
      l: 1.25,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
    {
      id: `${systemId}-ts5`,
      name: 'ts5',
      type: 'pipe',
      description: 'Rundrohr Ø400 mm',
      q: 900,
      b: 0,
      h: 0,
      d: 0.4,
      l: 1.25,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
  ];
}

function normalizeDate(value = null) {
  if (value) return value;
  return new Date().toISOString().slice(0, 10);
}

export function createDefaultProject(options = {}) {
  const now = Date.now();
  const systemId = options.systemId || `system-${now}`;
  const projectId = options.projectId || `project-${now}`;

  const projectNumber = options.projectNumber ?? options.name ?? 'Unbenannte Projektnummer';
  const projectName = options.projectName ?? options.object ?? '';
  const anlageNumber = options.anlageNumber ?? '';
  const anlage = options.anlage ?? 'Zuluftanlage';
  const bearbeiter = options.bearbeiter ?? options.author ?? '';
  const company = options.company ?? '';
  const address = options.address ?? '';
  const note = options.note ?? '';
  const datum = normalizeDate(options.datum ?? options.date);

  return {
    id: projectId,
    name: projectNumber,
    object: projectName,
    anlageNumber,
    author: bearbeiter,
    company,
    address,
    note,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(options.settings || {}),
    },
    meta: {
      name: projectNumber,
      object: projectName,
      anlageNumber,
      anlage,
      bearbeiter,
      company,
      address,
      note,
    },
    report: {
      project: projectNumber,
      object: projectName,
      anlageNumber,
      anlage,
      bearbeiter,
      company,
      address,
      hinweis: note,
      datum,
    },
    systems: [
      {
        id: systemId,
        name: anlage,
        type: options.systemType || 'Zuluft',
        sections: createDefaultSections(systemId),
        formParts: [],
        specialComponents: [],
      },
    ],
  };
}

export default createDefaultProject;
