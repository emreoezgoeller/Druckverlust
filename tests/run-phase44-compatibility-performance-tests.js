import { performance } from 'node:perf_hooks';
import { createDefaultProject } from '../src/project/defaultProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ReportEngine from '../src/report/ReportEngine.js?v=57.00';
import StorageEngine, { normalizeProjectForStorage } from '../src/storage/StorageEngine.js';

let checks = 0;
const failures = [];
function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function makeSection(systemId, index) {
  const pipe = index % 3 === 0;
  const q = 500 + (index % 12) * 125;
  return {
    id: `${systemId}-ts${index + 1}`,
    name: `ts${index + 1}`,
    type: pipe ? 'pipe' : 'duct',
    description: pipe ? 'Lasttest Rundrohr' : 'Lasttest Rechteckkanal',
    q,
    l: 2 + (index % 7),
    b: pipe ? 0 : 0.35 + (index % 5) * 0.05,
    h: pipe ? 0 : 0.25 + (index % 4) * 0.05,
    d: pipe ? 0.25 + (index % 5) * 0.05 : 0,
    zetaSum: (index % 4) * 0.1,
  };
}

function makeLargeProject(systemCount, sectionsPerSystem) {
  const project = createDefaultProject({
    projectId: 'release-load-project',
    projectNumber: 'REL-200',
    projectName: 'Release-Lastprüfung',
    bearbeiter: 'Release-QS',
    company: 'EO Engineering',
    anlage: 'Anlage 1',
  });
  project.systems = Array.from({ length: systemCount }, (_, systemIndex) => {
    const id = `release-system-${systemIndex + 1}`;
    return {
      id,
      name: `Anlage ${systemIndex + 1}`,
      type: ['Zuluft','Abluft','Aussenluft','Fortluft'][systemIndex % 4],
      sections: Array.from({ length: sectionsPerSystem }, (_, index) => makeSection(id, index)),
      formParts: [],
      specialComponents: [],
    };
  });
  return project;
}

// Legacy raw project with old field names and broken references.
const legacyRaw = {
  id: 'legacy-project',
  projectNumber: 'ALT-001',
  projectName: 'Altes Projekt',
  bearbeiter: 'Altbestand',
  settings: { rho: '1,21', lambda: '0,025' },
  systems: [{
    id: 'legacy-system',
    anlage: 'Bestandsanlage',
    sections: [
      { id: 'dup', name: 'ts1', volumeFlow: '900', length: '5', width: '0,5', height: '0,3' },
      { id: 'dup', name: 'ts2', airVolume: '700', length: '4', diameter: '0,315' },
    ],
    formParts: [{ id: 'fp1', name: 'Bogen', formPartType: 'kreis_bogen', sectionId: 'nicht-vorhanden' }],
    specialComponents: [{ id: 'sp1', name: 'Filter', count: 2, singlePressureLoss: '35', sectionId: 'nicht-vorhanden' }],
  }],
};
const legacyNormalized = normalizeProjectForStorage(legacyRaw, { schemaVersion: 'legacy-test' });
check(legacyNormalized.project.name === 'ALT-001', 'Alter Projektname/Projektnummer wurde nicht übernommen.');
check(legacyNormalized.project.object === 'Altes Projekt', 'Alter Projektname wurde nicht auf object migriert.');
check(legacyNormalized.project.systems[0].sections.length === 2, 'Alte Teilstrecken wurden nicht übernommen.');
check(new Set(legacyNormalized.project.systems[0].sections.map(item => item.id)).size === 2, 'Doppelte alte Teilstrecken-IDs wurden nicht korrigiert.');
check(legacyNormalized.project.systems[0].formParts[0].sectionId === null, 'Ungültiger Formteilverweis wurde nicht gelöst.');
check(legacyNormalized.project.systems[0].specialComponents[0].sectionId === '', 'Ungültiger Sonderbauteilverweis wurde nicht gelöst.');
check(legacyNormalized.project.systems[0].specialComponents[0].pressureLoss === 70, 'Alter Sonderbauteilverlust wurde nicht normalisiert.');
check(legacyNormalized.warnings.length >= 3, 'Migration erzeugt keine nachvollziehbaren Hinweise.');

const serializedLegacy = StorageEngine.serialize(legacyNormalized.project);
const parsedLegacy = StorageEngine.parse(serializedLegacy, { fileName: 'ALT-001.dvp' });
check(parsedLegacy.systems.length === 1 && parsedLegacy.systems[0].sections.length === 2, 'Legacy-Speicher-Roundtrip ist unvollständig.');
check(parsedLegacy._importInfo?.fileName === 'ALT-001.dvp', 'Importinformation der alten Datei fehlt.');

// 100-section active-system calculation and report planning.
const hundred = makeLargeProject(1, 100);
let started = performance.now();
const hundredResult = ProjectCalculationService.calculate(hundred, hundred.systems[0].id);
const hundredMs = performance.now() - started;
hundred.calculationResult = hundredResult;
check(hundredResult.quality.errorCount === 0, '100-Teilstrecken-Projekt erzeugt Berechnungsfehler.');
check(hundredResult.calculation.results.length === 100, '100-Teilstrecken-Projekt berechnet nicht alle Teilstrecken.');
check(hundredResult.calculation.totals.totalRounded > 0, '100-Teilstrecken-Projekt besitzt keine positive Summe.');
check(hundredMs < 10000, `100-Teilstrecken-Berechnung ist zu langsam (${hundredMs.toFixed(0)} ms).`);
const reportModel = ReportEngine.createReportModel(hundred, { system: hundred.systems[0] });
const pagePlan = ReportEngine.createPagePlan(reportModel);
check(reportModel.counts.sections === 100, 'Berichtmodell enthält nicht alle 100 Teilstrecken.');
check(pagePlan.totalPages >= 10, 'Berichtplanung für 100 Teilstrecken ist unplausibel kurz.');
const reportHtml = ReportEngine.createStandaloneHtml(reportModel);
check(reportHtml.includes('ts100'), 'Bericht-HTML enthält die letzte Teilstrecke nicht.');

// Four-system / 200-section load and storage roundtrip.
const twoHundred = makeLargeProject(4, 50);
started = performance.now();
const results = twoHundred.systems.map(system => ProjectCalculationService.calculate(twoHundred, system.id));
const twoHundredMs = performance.now() - started;
check(results.every(result => result.quality.errorCount === 0), '200-Teilstrecken-Mehranlagenprojekt erzeugt Berechnungsfehler.');
check(results.reduce((sum, result) => sum + result.calculation.results.length, 0) === 200, 'Mehranlagen-Lasttest berechnet nicht alle 200 Teilstrecken.');
check(twoHundredMs < 15000, `200-Teilstrecken-Berechnung ist zu langsam (${twoHundredMs.toFixed(0)} ms).`);
const twoHundredText = StorageEngine.serialize(twoHundred);
check(twoHundredText.length < 5_000_000, '200-Teilstrecken-Projektdatei ist unerwartet gross.');
const twoHundredParsed = StorageEngine.parse(twoHundredText, { fileName: 'REL-200.dvp' });
check(twoHundredParsed.systems.length === 4, 'Mehranlagen-Speicher-Roundtrip verliert Anlagen.');
check(twoHundredParsed.systems.reduce((sum, system) => sum + system.sections.length, 0) === 200, 'Mehranlagen-Speicher-Roundtrip verliert Teilstrecken.');

if (failures.length) {
  console.error(`Phase 44.00 Kompatibilität/Lastprüfung fehlgeschlagen: ${failures.length} von ${checks} Prüfungen.`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log(`Phase 44.00 Kompatibilität/Lastprüfung: ${checks} Prüfungen bestanden (100 TS ${hundredMs.toFixed(0)} ms, 200 TS ${twoHundredMs.toFixed(0)} ms).`);
