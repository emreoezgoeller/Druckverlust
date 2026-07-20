// Druckverlust Pro – DemoProject
// Fachlich plausible Beispielvorlage für Vorführungen, Tests und Schulungen.

import createDefaultProject from './defaultProject.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function createDemoProject(options = {}) {
  const systemId = options.systemId || 'demo-zuluft-244-1';
  const project = createDefaultProject({
    projectId: options.projectId || 'demo-druckverlust-pro',
    systemId,
    projectNumber: options.projectNumber || 'DEMO-244.1',
    projectName: options.projectName || 'Beispielprojekt Druckverlust Pro',
    anlageNumber: options.anlageNumber || 'BKP 244.1',
    anlage: options.anlage || 'Zuluftanlage Demo',
    bearbeiter: options.bearbeiter || 'Demo-Benutzer',
    company: options.company || 'Emre Özgöller',
    address: options.address || 'Beispieladresse 1, 3000 Bern',
    note: options.note || 'Demo-Projekt für Bedienung, Rechen-QS, Formteil-Sync und Beispielbericht. Werte sind bewusst praxisnah, aber nicht projektspezifisch verbindlich.',
    datum: options.datum || today(),
    settings: {
      rho: 1.21,
      defaultRoughnessMm: 0.15,
      kinematicViscosity: 0.0000151,
      sectionRoundingStep: 0.5,
      ...(options.settings || {}),
    },
  });

  const system = project.systems[0];

  system.type = 'Zuluft';
  system.sections = [
    {
      id: `${systemId}-ts1`,
      name: 'ts1',
      type: 'duct',
      description: 'Hauptkanal ab Monoblock',
      q: 3200,
      b: 0.8,
      h: 0.45,
      d: 0,
      l: 8.5,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
    {
      id: `${systemId}-ts2`,
      name: 'ts2',
      type: 'duct',
      description: 'Reduzierter Hauptkanal nach Übergang',
      q: 2400,
      b: 0.63,
      h: 0.35,
      d: 0,
      l: 12,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
    {
      id: `${systemId}-ts3`,
      name: 'ts3',
      type: 'pipe',
      description: 'Rundrohr Verteilung Zone A',
      q: 1200,
      b: 0,
      h: 0,
      d: 0.5,
      l: 9,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
    {
      id: `${systemId}-ts4`,
      name: 'ts4',
      type: 'pipe',
      description: 'Rundrohr Abzweig Zone B',
      q: 650,
      b: 0,
      h: 0,
      d: 0.315,
      l: 7.5,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
    {
      id: `${systemId}-ts5`,
      name: 'ts5',
      type: 'duct',
      description: 'Endkanal vor Auslassgruppe',
      q: 550,
      b: 0.4,
      h: 0.25,
      d: 0,
      l: 6,
      roughnessMm: 0.15,
      zetaSum: 0,
    },
  ];

  system.formParts = [
    {
      id: `${systemId}-fp1`,
      name: 'Kanalbogen 90° Hauptkanal',
      type: 'eckiger_bogen',
      sectionId: `${systemId}-ts1`,
      R: 250,
      a: 800,
      b: 450,
    },
    {
      id: `${systemId}-fp2`,
      name: 'Übergang 800×450 auf 630×350',
      type: 'uebergang_gross_klein',
      sectionId: `${systemId}-ts2`,
      beta: 30,
      kanalkante: 1,
      A2_bauform: 'Kanal',
      A2_breite: 800,
      A2_hoehe: 450,
      A2_d: 0,
      A1_bauform: 'Kanal',
      A1_breite: 630,
      A1_hoehe: 350,
      A1_d: 0,
      sourceSectionId: `${systemId}-ts2`,
      connectionSectionId: `${systemId}-ts1`,
    },
    {
      id: `${systemId}-fp3`,
      name: 'Rundbogen Ø500 / 90°',
      type: 'kreis_bogen',
      sectionId: `${systemId}-ts3`,
      R: 500,
      d: 500,
      alpha: 90,
    },
    {
      id: `${systemId}-fp4`,
      name: 'T-Abzweig Rund 1200 / 650 m³/h',
      type: 't_abzweig_rund2',
      sectionId: `${systemId}-ts4`,
      bauform: 'Rohr',
      alpha: 45,
      A_d: 500,
      A_breite: 0,
      A_hoehe: 0,
      AA_d: 315,
      AA_breite: 0,
      AA_hoehe: 0,
      AD_d: 400,
      AD_breite: 0,
      AD_hoehe: 0,
      W: 1200,
      WA: 650,
      WD: 550,
      sourceSectionId: `${systemId}-ts3`,
      branchSectionId: `${systemId}-ts4`,
    },
    {
      id: `${systemId}-fp5`,
      name: 'Endbogen Kanal 45°',
      type: 'kanal_bogen_winkel',
      sectionId: `${systemId}-ts5`,
      alpha: 45,
      a: 400,
      b: 250,
    },
  ];

  system.specialComponents = [
    {
      id: `${systemId}-sp1`,
      name: 'Filterstufe F7',
      componentType: 'filter',
      type: 'Filter',
      category: 'Luftaufbereitung',
      sectionId: `${systemId}-ts1`,
      manufacturer: 'Demo',
      model: 'F7',
      q: 3200,
      airflow: 3200,
      quantity: 1,
      unitPressureLoss: 80,
      pressureLoss: 80,
      pa: 80,
      note: 'Herstellerwert prüfen.',
    },
    {
      id: `${systemId}-sp2`,
      name: 'Schalldämpfer Hauptkanal',
      componentType: 'schalldaempfer',
      type: 'Schalldämpfer',
      category: 'Schall',
      sectionId: `${systemId}-ts2`,
      manufacturer: 'Demo',
      model: 'SD 630×350',
      q: 2400,
      airflow: 2400,
      quantity: 1,
      unitPressureLoss: 25,
      pressureLoss: 25,
      pa: 25,
      note: 'Druckverlust gemäss Schalldämpferauslegung kontrollieren.',
    },
    {
      id: `${systemId}-sp3`,
      name: 'Luftdurchlass Gruppe',
      componentType: 'luftdurchlass',
      type: 'Luftdurchlass / Gitter',
      category: 'Raumluft',
      sectionId: `${systemId}-ts5`,
      manufacturer: 'Demo',
      model: 'Auslassgruppe',
      q: 550,
      airflow: 550,
      quantity: 2,
      unitPressureLoss: 18,
      pressureLoss: 36,
      pa: 36,
      note: '2 Stück à 18 Pa.',
    },
  ];

  project.demo = {
    isDemoProject: true,
    createdBy: 'Druckverlust Pro',
    purpose: 'Vorführung, Bedienung, QS und Beispielnachweis',
    quickStart: [
      'Anlagenübersicht öffnen und Teilstrecken prüfen.',
      'Formteile anklicken und Grössen-/Anschlussübernahme ansehen.',
      'Bericht öffnen und Druckverlust-Aufteilung prüfen.',
    ],
  };

  project.report = {
    ...project.report,
    reportNumber: 'DP-DEMO-001',
    revision: 'R0',
    hinweis: 'Beispielnachweis für Demo: Druckverluste getrennt nach Kanal/Rohr, Formteilen und Sonderbauteilen prüfen.',
    datum: options.datum || today(),
  };

  return project;
}

export default createDemoProject;
