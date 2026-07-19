// Druckverlust Pro – Praxisprojekt Phase 21.02
// Deterministisches Grossprojekt für Rechen-, Speicher- und Berichtstests.

import createDefaultProject from './defaultProject.js';

const DUCT_SIZES = Object.freeze([
  [1.20, 0.60],
  [1.00, 0.50],
  [0.80, 0.40],
  [0.63, 0.35],
  [0.50, 0.30],
  [0.40, 0.25],
]);

const PIPE_DIAMETERS = Object.freeze([0.63, 0.56, 0.50, 0.45, 0.40, 0.355]);

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function createDuctSection(systemId, position, sizeIndex = 0) {
  const [width, height] = DUCT_SIZES[sizeIndex % DUCT_SIZES.length];
  const velocityTarget = 2.7 + ((position - 1) % 5) * 0.25;
  const airflow = round(width * height * 3600 * velocityTarget, 0);

  return {
    id: `${systemId}-ts${position}`,
    name: `TS-${String(position).padStart(2, '0')}`,
    type: 'duct',
    description: `Rechteckkanal ${round(width * 1000)} × ${round(height * 1000)} mm – Praxisnetz`,
    q: airflow,
    b: width,
    h: height,
    d: 0,
    l: round(4.5 + ((position - 1) % 7) * 1.35, 2),
    zetaSum: 0,
  };
}

function createPipeSection(systemId, position, diameterIndex = 0) {
  const diameter = PIPE_DIAMETERS[diameterIndex % PIPE_DIAMETERS.length];
  const area = Math.PI * diameter * diameter / 4;
  const velocityTarget = 2.8 + ((position - 1) % 4) * 0.3;
  const airflow = round(area * 3600 * velocityTarget, 0);

  return {
    id: `${systemId}-ts${position}`,
    name: `TS-${String(position).padStart(2, '0')}`,
    type: 'pipe',
    description: `Rundrohr Ø${round(diameter * 1000)} mm – Praxisnetz`,
    q: airflow,
    b: 0,
    h: 0,
    d: diameter,
    l: round(5.25 + ((position - 1) % 6) * 1.45, 2),
    zetaSum: 0,
  };
}

function createSections(systemId) {
  const sections = [];

  for (let position = 1; position <= 24; position += 1) {
    sections.push(createDuctSection(systemId, position, Math.floor((position - 1) / 4)));
  }

  for (let position = 25; position <= 36; position += 1) {
    sections.push(createPipeSection(systemId, position, position - 25));
  }

  for (let position = 37; position <= 48; position += 1) {
    sections.push(createDuctSection(systemId, position, position - 37));
  }

  return sections;
}

function createFormParts(systemId, sections) {
  const parts = [];
  let partPosition = 1;

  sections.slice(0, 18).forEach((section, index) => {
    const width = round(section.b * 1000);
    const height = round(section.h * 1000);
    const isRadiusBend = index % 2 === 0;

    parts.push({
      id: `${systemId}-fp${partPosition}`,
      name: isRadiusBend
        ? `Kanalbogen ${section.name}`
        : `Winkelbogen ${section.name}`,
      type: isRadiusBend ? 'eckiger_bogen' : 'kanal_bogen_winkel',
      sectionId: section.id,
      sourceSectionId: section.id,
      R: Math.max(height, 250),
      a: width,
      b: height,
      alpha: isRadiusBend ? 90 : [30, 45, 60, 90][index % 4],
    });

    partPosition += 1;
  });

  sections.slice(24, 36).forEach((section, index) => {
    const diameter = round(section.d * 1000);

    parts.push({
      id: `${systemId}-fp${partPosition}`,
      name: `Rundbogen ${section.name}`,
      type: 'kreis_bogen',
      sectionId: section.id,
      sourceSectionId: section.id,
      R: diameter * (index % 3 === 0 ? 1.5 : 1),
      d: diameter,
      alpha: [45, 60, 90][index % 3],
    });

    partPosition += 1;
  });

  sections.slice(36, 42).forEach((section, index) => {
    const width = round(section.b * 1000);
    const height = round(section.h * 1000);

    parts.push({
      id: `${systemId}-fp${partPosition}`,
      name: `Endbogen ${section.name}`,
      type: 'kanal_bogen_winkel',
      sectionId: section.id,
      sourceSectionId: section.id,
      alpha: [30, 45, 60, 75, 90, 45][index],
      a: width,
      b: height,
    });

    partPosition += 1;
  });

  return parts;
}

function createSpecialComponents(systemId, sections) {
  const componentTypes = [
    ['brandschutzklappe', 'Brandschutzklappe'],
    ['schalldaempfer', 'Schalldämpfer'],
    ['volumenstromregler', 'Volumenstromregler'],
    ['luftdurchlass', 'Luftdurchlass / Gitter'],
    ['filter', 'Filter'],
    ['freie_komponente', 'Freie Komponente'],
  ];

  return sections.slice(0, 26).map((section, index) => {
    const [componentType, type] = componentTypes[index % componentTypes.length];
    const quantity = index % 7 === 0 ? 2 : 1;
    const unitPressureLoss = 8 + (index % 6) * 4;

    return {
      id: `${systemId}-sp${index + 1}`,
      name: `${type} ${String(index + 1).padStart(2, '0')}`,
      componentType,
      type,
      category: 'Praxisprojekt',
      sectionId: section.id,
      manufacturer: 'Praxis-QS',
      model: `P-${String(index + 1).padStart(2, '0')}`,
      q: section.q,
      airflow: section.q,
      quantity,
      unitPressureLoss,
      pressureLoss: unitPressureLoss * quantity,
      pa: unitPressureLoss * quantity,
      note: 'Deterministischer Prüfwert für Speicher- und Berichtstest.',
    };
  });
}

export function createPracticeProject(options = {}) {
  const systemId = options.systemId || 'praxis-zuluft-244-1';
  const project = createDefaultProject({
    projectId: options.projectId || 'praxisprojekt-phase-21-02',
    systemId,
    projectNumber: options.projectNumber || 'PRA-2026-021',
    projectName: options.projectName || 'Praxisprojekt Druckverlust Pro',
    anlageNumber: options.anlageNumber || 'BKP 244.1',
    anlage: options.anlage || 'Zuluftanlage Praxis-QS',
    bearbeiter: options.bearbeiter || 'Emre Özgöller',
    company: options.company || 'Druckverlust Pro',
    address: options.address || 'Referenzobjekt, 3000 Bern',
    note: options.note || 'Grossprojekt für Rechen-, Speicher-, Seitenumbruch- und Berichtstests. Nicht als reale Auslegung verwenden.',
    datum: options.datum || '2026-07-11',
    settings: {
      rho: 1.21,
      lambda: 0.025,
      sectionRoundingStep: 0.5,
      ...(options.settings || {}),
    },
  });

  const system = project.systems[0];
  const sections = createSections(systemId);

  system.type = 'Zuluft';
  system.sections = sections;
  system.formParts = createFormParts(systemId, sections);
  system.specialComponents = createSpecialComponents(systemId, sections);

  project.practice = {
    isPracticeProject: true,
    phase: '21.02',
    purpose: 'Praxis-, Speicher-, Seitenumbruch- und Berichtstest',
    expected: {
      sections: 48,
      formParts: 36,
      specialComponents: 26,
      minimumReportPages: 18,
    },
  };

  project.report = {
    ...project.report,
    reportNumber: 'DP-PRA-2102',
    revision: 'R0',
    checkedBy: 'QS Referenztest',
    approvedBy: 'Projektleitung',
    approvalDate: '2026-07-11',
    hinweis: 'Praxisnachweis Phase 21.02: 48 Teilstrecken, 36 Formteile und 26 Sonderbauteile mit mehrseitigem Bericht.',
    datum: options.datum || '2026-07-11',
  };

  project.revisionHistory = [
    {
      revision: 'R0',
      date: '2026-07-11',
      author: 'Emre Özgöller',
      change: 'Praxisprojekt und mehrseitiger Berichtstest Phase 21.02',
    },
  ];

  return project;
}

export default createPracticeProject;
