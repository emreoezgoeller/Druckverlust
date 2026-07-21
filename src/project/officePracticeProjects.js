// Druckverlust Pro – Phase 56.00
// Deterministische Büro- und Praxisprojekte für kleine, mittlere und grosse Netze.
// Die Projekte sind reine QS-Referenzen und keine reale Auslegung.

import createDefaultProject from './defaultProject.js';

const DUCT_SIZES = Object.freeze([
  [0.40, 0.20],
  [0.50, 0.25],
  [0.60, 0.30],
  [0.70, 0.35],
  [0.80, 0.40],
  [1.00, 0.50],
  [1.20, 0.60],
]);

const PIPE_DIAMETERS = Object.freeze([0.20, 0.25, 0.315, 0.355, 0.40, 0.50, 0.63]);
const ROUGHNESS_VALUES = Object.freeze([0.09, 0.15, 0.30]);

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function airflowForArea(areaM2, velocityMs) {
  return Math.max(1, Math.round(areaM2 * 3600 * velocityMs));
}

function createSection(systemId, position, options = {}) {
  const pipe = options.pipe ?? (position % 3 === 0);
  const velocity = Number(options.velocity ?? (2.15 + ((position - 1) % 8) * 0.34));
  const roughnessMm = Number(options.roughnessMm ?? ROUGHNESS_VALUES[(position - 1) % ROUGHNESS_VALUES.length]);
  const length = round(Number(options.length ?? (2.5 + ((position - 1) % 9) * 1.15)), 2);
  const id = `${systemId}-ts${position}`;
  const name = `TS-${String(position).padStart(3, '0')}`;

  if (pipe) {
    const diameter = Number(options.diameter ?? PIPE_DIAMETERS[(position - 1) % PIPE_DIAMETERS.length]);
    const area = Math.PI * diameter * diameter / 4;
    return {
      id,
      name,
      type: 'pipe',
      description: `Rundrohr Ø${Math.round(diameter * 1000)} mm · Phase-56-Praxisnetz`,
      q: airflowForArea(area, velocity),
      b: 0,
      h: 0,
      d: diameter,
      l: length,
      roughnessMm,
      zetaSum: position % 11 === 0 ? 0.08 : 0,
    };
  }

  const [width, height] = options.size ?? DUCT_SIZES[(position - 1) % DUCT_SIZES.length];
  return {
    id,
    name,
    type: 'duct',
    description: `Rechteckkanal ${Math.round(width * 1000)} × ${Math.round(height * 1000)} mm · Phase-56-Praxisnetz`,
    q: airflowForArea(width * height, velocity),
    b: width,
    h: height,
    d: 0,
    l: length,
    roughnessMm,
    zetaSum: position % 13 === 0 ? 0.06 : 0,
  };
}

function createSections(systemId, count, options = {}) {
  return Array.from({ length: count }, (_, index) => createSection(systemId, index + 1, {
    pipe: options.pattern === 'pipe-heavy'
      ? index % 2 === 0
      : options.pattern === 'duct-heavy'
        ? index % 4 === 3
        : index % 3 === 2,
    velocity: (options.baseVelocity ?? 2.15) + (index % (options.velocitySteps ?? 8)) * (options.velocityStep ?? 0.34),
    roughnessMm: ROUGHNESS_VALUES[(index + (options.roughnessOffset || 0)) % ROUGHNESS_VALUES.length],
  }));
}

function createFormParts(systemId, sections, density = 1) {
  const parts = [];
  let position = 1;

  sections.forEach((section, sectionIndex) => {
    const partCount = sectionIndex % 4 < density ? 2 : 1;
    for (let localIndex = 0; localIndex < partCount; localIndex += 1) {
      parts.push({
        id: `${systemId}-fp${position}`,
        name: `Freier ζ-Wert ${section.name}.${localIndex + 1}`,
        type: 'freier_zeta_wert',
        sectionId: section.id,
        sourceSectionId: section.id,
        zeta: round(0.08 + ((position - 1) % 9) * 0.045, 3),
        note: 'Deterministischer QS-Wert Phase 56.00',
      });
      position += 1;
    }
  });

  return parts;
}

function createSpecialComponents(systemId, sections, every = 4) {
  const labels = [
    ['filter', 'Filter'],
    ['schalldaempfer', 'Schalldämpfer'],
    ['brandschutzklappe', 'Brandschutzklappe'],
    ['volumenstromregler', 'Volumenstromregler'],
  ];

  return sections
    .filter((_, index) => index % every === 0)
    .map((section, index) => {
      const [componentType, label] = labels[index % labels.length];
      const pressureLoss = 10 + (index % 7) * 6;
      return {
        id: `${systemId}-sp${index + 1}`,
        name: `${label} ${String(index + 1).padStart(2, '0')}`,
        componentType,
        type: label,
        category: 'Phase-56-Praxisprojekt',
        sectionId: section.id,
        q: section.q,
        airflow: section.q,
        quantity: 1,
        unitPressureLoss: pressureLoss,
        pressureLoss,
        pa: pressureLoss,
        note: 'Deterministischer Prüfwert für Büro- und Praxistest.',
      };
    });
}

function createSystem({
  id,
  name,
  type,
  roomUsageCode,
  operationMode,
  sectionCount,
  pattern = 'mixed',
  baseVelocity = 2.15,
  velocityStep = 0.34,
  velocitySteps = 8,
  formPartDensity = 1,
  specialEvery = 4,
  roughnessOffset = 0,
}) {
  const sections = createSections(id, sectionCount, {
    pattern,
    baseVelocity,
    velocityStep,
    velocitySteps,
    roughnessOffset,
  });

  return {
    id,
    name,
    type,
    siaVelocity: { roomUsageCode, operationMode },
    sections,
    formParts: createFormParts(id, sections, formPartDensity),
    specialComponents: createSpecialComponents(id, sections, specialEvery),
  };
}

function buildProject({
  projectId,
  projectNumber,
  projectName,
  systems,
  primarySystemId,
  label,
  date = '2026-07-21',
}) {
  const firstSystem = systems[0];
  const project = createDefaultProject({
    projectId,
    systemId: firstSystem.id,
    projectNumber,
    projectName,
    anlageNumber: 'BKP 244',
    anlage: firstSystem.name,
    bearbeiter: 'Phase 56 Büro-QS',
    company: 'Druckverlust Pro',
    address: 'Referenzobjekt, Kanton Bern',
    note: `${label}. Deterministischer Teststand; nicht als reale Auslegung verwenden.`,
    datum: date,
  });

  project.systems = systems;
  project.report = {
    ...project.report,
    reportNumber: `DP-P56-${projectNumber}`,
    revision: 'R0',
    checkedBy: 'Büro-QS',
    approvedBy: 'Release-QS',
    approvalDate: date,
    datum: date,
    hinweis: `${label}: Rechen-, SIA-, Speicher-, Bericht- und Performanceprüfung.`,
  };
  project.revisionHistory = [{
    revision: 'R0',
    date,
    author: 'Phase 56 Büro-QS',
    change: `${label} angelegt`,
  }];
  project.phase56Practice = {
    label,
    primarySystemId,
    expected: {
      systems: systems.length,
      sections: systems.reduce((sum, system) => sum + system.sections.length, 0),
      formParts: systems.reduce((sum, system) => sum + system.formParts.length, 0),
      specialComponents: systems.reduce((sum, system) => sum + system.specialComponents.length, 0),
    },
  };

  return project;
}

export function createSmallOfficePracticeProject() {
  const system = createSystem({
    id: 'p56-small-abl',
    name: 'Abluft WC / Nebenräume',
    type: 'Abluft',
    roomUsageCode: '12.07',
    operationMode: 'two-stage',
    sectionCount: 8,
    pattern: 'pipe-heavy',
    baseVelocity: 1.8,
    velocityStep: 0.24,
    velocitySteps: 6,
    formPartDensity: 1,
    specialEvery: 3,
  });

  return buildProject({
    projectId: 'p56-small-project',
    projectNumber: 'P56-KLEIN',
    projectName: 'Kleines Büro-Praxisprojekt',
    systems: [system],
    primarySystemId: system.id,
    label: 'Kleines gemischtes Lüftungsnetz',
  });
}

export function createMediumOfficePracticeProject() {
  const systems = [
    createSystem({
      id: 'p56-medium-zul',
      name: 'Zuluft Schulzimmer',
      type: 'Zuluft',
      roomUsageCode: '4.01',
      operationMode: 'two-stage',
      sectionCount: 28,
      pattern: 'duct-heavy',
      baseVelocity: 2.2,
      velocityStep: 0.30,
      velocitySteps: 8,
      formPartDensity: 2,
      specialEvery: 4,
    }),
    createSystem({
      id: 'p56-medium-abl',
      name: 'Abluft Schulhaus',
      type: 'Abluft',
      roomUsageCode: '4.01',
      operationMode: 'two-stage',
      sectionCount: 24,
      pattern: 'mixed',
      baseVelocity: 2.0,
      velocityStep: 0.28,
      velocitySteps: 8,
      formPartDensity: 1,
      specialEvery: 5,
      roughnessOffset: 1,
    }),
    createSystem({
      id: 'p56-medium-neben',
      name: 'Abluft Nebenräume',
      type: 'Abluft',
      roomUsageCode: '12.04',
      operationMode: 'variable',
      sectionCount: 20,
      pattern: 'pipe-heavy',
      baseVelocity: 1.9,
      velocityStep: 0.26,
      velocitySteps: 7,
      formPartDensity: 1,
      specialEvery: 5,
      roughnessOffset: 2,
    }),
  ];

  return buildProject({
    projectId: 'p56-medium-project',
    projectNumber: 'P56-MITTEL',
    projectName: 'Mittleres Schulhaus-Praxisprojekt',
    systems,
    primarySystemId: systems[0].id,
    label: 'Mittleres Mehranlagenprojekt mit Schulnutzung',
  });
}

export function createLargeOfficePracticeProject() {
  const systems = [
    createSystem({
      id: 'p56-large-zul',
      name: 'Zuluft Grossraumbüro – kritischer Strang',
      type: 'Zuluft',
      roomUsageCode: '3.02',
      operationMode: 'two-stage',
      sectionCount: 108,
      pattern: 'mixed',
      baseVelocity: 2.35,
      velocityStep: 0.31,
      velocitySteps: 10,
      formPartDensity: 3,
      specialEvery: 4,
    }),
    createSystem({
      id: 'p56-large-abl',
      name: 'Abluft Büro / Sitzungszimmer',
      type: 'Abluft',
      roomUsageCode: '3.03',
      operationMode: 'variable',
      sectionCount: 24,
      pattern: 'duct-heavy',
      baseVelocity: 2.1,
      velocityStep: 0.28,
      velocitySteps: 8,
      formPartDensity: 2,
      specialEvery: 4,
      roughnessOffset: 1,
    }),
    createSystem({
      id: 'p56-large-aul',
      name: 'Aussenluft Hauptstrang',
      type: 'Aussenluft',
      roomUsageCode: '3.02',
      operationMode: 'two-stage',
      sectionCount: 18,
      pattern: 'duct-heavy',
      baseVelocity: 2.6,
      velocityStep: 0.30,
      velocitySteps: 8,
      formPartDensity: 2,
      specialEvery: 3,
      roughnessOffset: 2,
    }),
  ];

  return buildProject({
    projectId: 'p56-large-project',
    projectNumber: 'P56-GROSS',
    projectName: 'Grosses Büro-Praxisprojekt',
    systems,
    primarySystemId: systems[0].id,
    label: 'Grossprojekt mit über 100 Teilstrecken im kritischen Strang',
  });
}

export function createPhase56PracticePortfolio() {
  return [
    createSmallOfficePracticeProject(),
    createMediumOfficePracticeProject(),
    createLargeOfficePracticeProject(),
  ];
}

export default createPhase56PracticePortfolio;
