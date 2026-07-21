#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ReportEngine from '../src/report/ReportEngine.js';
import { createDefaultFormPartRegistry } from '../src/formteile/FormPartRegistry.js';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const equal = (actual, expected, message) => {
  assert.equal(actual, expected, message);
  checks += 1;
};
const includes = (text, needle, message) => {
  check(String(text).includes(needle), message);
};
const countMatches = (text, pattern) => (String(text).match(pattern) || []).length;
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const project = createDemoProject();
const system = project.systems[0];
project.name = '2026-053';
project.object = 'Stressprüfung Phase 53 – mehrseitiger Bericht';
project.author = 'Emre Özgöller';
project.report = {
  ...(project.report || {}),
  reportNumber: 'DP-53-STRESS',
  revision: '3',
  bearbeiter: 'Emre Özgöller',
};
project.calculationResult = ProjectCalculationService.calculate(project, system.id);

const model = ReportEngine.createReportModel(project, {
  system,
  registry: createDefaultFormPartRegistry(),
});

const baseSection = model.sections[0] || {
  position: 1,
  id: 'ts1',
  name: 'TS 1',
  description: 'Hauptkanal',
  type: 'Kanal',
  typeLabel: 'Rechteckkanal',
  width: 0.8,
  height: 0.45,
  length: 8.5,
  airflow: 3200,
  velocity: 2.47,
  roughnessMm: 0.15,
  frictionFactor: 0.018,
  frictionRate: 0.7,
  frictionLoss: 6,
  totalLoss: 12,
  reynoldsNumber: 150000,
  siaVelocity: { maximumVelocityMs: 4.2, status: 'ok' },
};

model.sections = Array.from({ length: 67 }, (_, index) => ({
  ...baseSection,
  position: index + 1,
  id: `stress-ts-${index + 1}`,
  name: `TS ${index + 1}`,
  description: `${index % 3 === 0 ? 'Hauptkanal ab Monobloc' : 'Verteilstrang'} mit ausführlicher Bezeichnung ${index + 1}`,
  airflow: 3200 - index * 23,
  velocity: 2.2 + (index % 7) * 0.35,
  frictionLoss: 3.2 + (index % 11) * 1.7,
  totalLoss: 7 + (index % 13) * 2.1,
  siaVelocity: {
    maximumVelocityMs: 4.4 - (index % 3) * 0.2,
    status: index % 11 === 0 ? 'exceeded' : index % 7 === 0 ? 'warning' : 'ok',
  },
}));
model.counts.sections = model.sections.length;

model.formPartsBySection = model.sections.slice(0, 30).map((section, sectionIndex) => ({
  section,
  formParts: Array.from({ length: 7 }, (_, index) => ({
    id: `fp-${sectionIndex}-${index}`,
    name: `Formteil ${index + 1}`,
    type: index % 2 ? 'Krümmerabzweig – Durchgang' : 'Kanalbogen 90°',
    category: 'Rechteckig',
    reference: 'Tabellenwert',
    zeta: 0.2 + index * 0.13,
    pressureLoss: 1.2 + index * 0.8,
    image: '',
    roughnessMm: 0.15,
    reynoldsNumber: 120000,
    frictionFactor: 0.018,
  })),
  sum: 25.2,
}));
model.counts.formParts = model.formPartsBySection.reduce((total, group) => total + group.formParts.length, 0);

model.formPartCatalog = Array.from({ length: 15 }, (_, index) => ({
  key: `cat-${index}`,
  name: `Formteiltyp ${index + 1} mit längerer Bezeichnung`,
  category: index % 2 ? 'Rund' : 'Rechteckig',
  image: '',
  reference: 'SIA / Tabellenreferenz',
  count: index + 1,
  zetaValues: [0.2, 0.5, 1.1],
  zetaMin: 0.2,
  zetaMax: 1.1,
  pressureLoss: 18 + index,
  sections: [`TS ${index + 1}`, `TS ${index + 2}`, `TS ${index + 3}`],
}));

model.specialComponents = Array.from({ length: 45 }, (_, index) => ({
  position: index + 1,
  id: `sp-${index}`,
  name: `Sonderbauteil ${index + 1}`,
  type: `Filter / Schalldämpfer mit ausführlicher Beschreibung ${index + 1}`,
  airflow: 1200 + index * 50,
  pressureLoss: 35 + index * 0.7,
}));
model.counts.specialComponents = model.specialComponents.length;

model.engineeringQuality = {
  ...(model.engineeringQuality || {}),
  score: 74,
  status: 'warning',
  counts: { critical: 3, warning: 18, info: 10 },
  analyzedSectionCount: 67,
  profile: { name: 'Stressprüfung' },
  disclaimer: 'Automatisierte Plausibilitätsprüfung.',
  findings: Array.from({ length: 31 }, (_, index) => ({
    severity: index % 10 === 0 ? 'critical' : index % 3 === 0 ? 'warning' : 'info',
    code: `P53-${String(index + 1).padStart(2, '0')}`,
    title: `Feststellung ${index + 1}`,
    message: `Ausführliche technische Feststellung zur Teilstrecke ${index + 1}, die bewusst mehrzeilig dargestellt wird.`,
    recommendation: `Geometrie, Geschwindigkeit und Druckverlust der Teilstrecke ${index + 1} fachlich kontrollieren.`,
  })),
};

model.quality = {
  status: 'warning',
  errorCount: 4,
  warningCount: 36,
  errors: Array.from({ length: 4 }, (_, index) => ({
    type: 'Fehler',
    severity: 'error',
    source: `TS ${index + 1}`,
    message: `Fehlerhinweis ${index + 1} mit längerer Beschreibung.`,
  })),
  warnings: Array.from({ length: 36 }, (_, index) => ({
    type: 'Hinweis',
    severity: 'warning',
    source: `TS ${index + 5}`,
    message: `Prüfhinweis ${index + 1}: Eingabedaten, Zuordnung und Rechenergebnis kontrollieren.`,
  })),
};
model.totals = {
  ...model.totals,
  friction: 840.5,
  formParts: 425.2,
  special: 310,
  total: 1575.7,
  rawTotal: 1575.7,
};

const plan = ReportEngine.createPagePlan(model);
const entry = key => plan.entries.find(item => item.key === key);

// Sichere und nachvollziehbare Mehrseitenaufteilung.
equal(plan.totalPages, 43, 'Der Stressbericht wird auf 43 kontrollierte Seiten aufgeteilt.');
equal(plan.tocPage, 2, 'Das Inhaltsverzeichnis liegt auf Seite 2.');
equal(entry('mainNetwork')?.page, 8, 'Die Hauptberechnung beginnt auf Seite 8.');
equal(entry('mainNetwork')?.pageCount, 5, '67 Teilstrecken werden auf fünf Seiten verteilt.');
equal(entry('assignedFormParts')?.pageCount, 15, '210 Formteile werden mit vier Boxen je Seite sicher verteilt.');
equal(entry('specialComponents')?.pageCount, 3, '45 Sonderbauteile werden auf drei Seiten verteilt.');
equal(entry('engineeringQuality')?.pageCount, 3, '31 Engineering-Feststellungen werden auf drei Seiten verteilt.');
equal(entry('qualityProtocol')?.pageCount, 4, '40 QS-Hinweise werden auf vier Seiten verteilt.');
equal(entry('formPartCatalog')?.pageCount, 3, '15 Katalogeinträge werden auf drei Seiten verteilt.');
equal(entry('info')?.page, 43, 'Die Abschlussinformationen liegen auf der letzten Seite.');

const html = ReportEngine.createStandaloneHtml(model);

// Deckblatt, Inhaltsverzeichnis, Seitennummerierung und Berichtsumfang.
includes(html, 'class="report-page report-cover-page"', 'Das weisse Deckblatt wird ausgegeben.');
includes(html, 'class="report-cover-watermark"', 'Das grosse dezente Logo-Wasserzeichen ist integriert.');
includes(html, 'Technischer Berechnungsnachweis', 'Das Deckblatt enthält die Dokumentkarte.');
includes(html, 'Raumnutzung', 'Die SIA-Raumnutzung erscheint auf dem Deckblatt.');
includes(html, 'Betriebsart', 'Die Betriebsart erscheint auf dem Deckblatt.');
includes(html, 'Elektro-Vollaststunden', 'Die Elektro-Vollaststunden erscheinen auf dem Deckblatt.');
includes(html, 'Berichtsumfang', 'Der Seitenumfang erscheint auf dem Deckblatt.');
includes(html, '43 Seiten', 'Das Deckblatt nennt den dynamisch ermittelten Seitenumfang.');
includes(html, 'Inhaltsverzeichnis', 'Das dynamische Inhaltsverzeichnis wird ausgegeben.');
includes(html, 'Hauptberechnung – Luftnetz', 'Die Hauptberechnung steht im Bericht.');
includes(html, 'Seite 43 / 43', 'Die letzte Seitennummer ist vollständig.');
equal(countMatches(html, /<section class="report-page/g), 43, 'Die gerenderten Berichtsseiten entsprechen exakt dem Seitenplan.');
equal(countMatches(html, /class="report-footer"/g), 43, 'Jede Berichtsseite besitzt eine Fusszeile.');
check(!html.includes('__REPORT_TOTAL_PAGES__'), 'Es bleibt kein Platzhalter für die Gesamtseitenzahl zurück.');

// Lückenlose Fortsetzungsseiten und letzte Datensätze.
includes(html, 'Übersicht aller Teilstrecken (1–15 von 67)', 'Die erste Teilstreckenseite weist den korrekten Bereich aus.');
includes(html, 'Übersicht aller Teilstrecken (16–30 von 67)', 'Die zweite Teilstreckenseite schliesst lückenlos an.');
includes(html, 'Übersicht aller Teilstrecken (61–67 von 67)', 'Die letzte Teilstreckenseite weist den Restbereich aus.');
includes(html, '>TS 67<', 'Die letzte Teilstrecke ist im Bericht enthalten.');
includes(html, 'Sonderbauteil 45', 'Das letzte Sonderbauteil ist im Bericht enthalten.');
includes(html, 'Feststellung 31', 'Die letzte Engineering-Feststellung ist im Bericht enthalten.');
includes(html, 'Prüfhinweis 36', 'Der letzte QS-Hinweis ist im Bericht enthalten.');
includes(html, 'Formteiltyp 15', 'Der letzte Katalogeintrag ist im Bericht enthalten.');
includes(html, 'Fortsetzung der Teilstrecken auf der nächsten Seite.', 'Fortsetzungsseiten der Teilstrecken werden gekennzeichnet.');
includes(html, 'Fortsetzung der Formteile auf der nächsten Seite.', 'Fortsetzungsseiten der Formteile werden gekennzeichnet.');
includes(html, 'Fortsetzung der Sonderbauteile auf der nächsten Seite.', 'Fortsetzungsseiten der Sonderbauteile werden gekennzeichnet.');
includes(html, 'Fortsetzung der Engineering-QS auf der nächsten Seite.', 'Fortsetzungsseiten der Engineering-QS werden gekennzeichnet.');
includes(html, 'Fortsetzung des QS-Prüfprotokolls auf der nächsten Seite.', 'Fortsetzungsseiten des QS-Protokolls werden gekennzeichnet.');

// Druckvorbereitung und automatische Layoutprüfung.
includes(html, 'window.__druckverlustPrintReady', 'Die Druckbereitschaft kann automatisiert abgefragt werden.');
includes(html, 'window.__druckverlustLayoutAudit', 'Das Ergebnis der Layoutprüfung wird bereitgestellt.');
includes(html, 'data-layout-status', 'Jede Seite erhält einen Layoutstatus.');
includes(html, 'report-layout-status', 'Der Druckdialog zeigt den Layoutstatus an.');
includes(html, 'auditPageLayout', 'Die automatische Überlaufprüfung ist integriert.');
includes(html, 'scrollHeight', 'Die vertikale Überfüllung wird technisch geprüft.');
includes(html, 'scrollWidth', 'Die horizontale Überfüllung wird technisch geprüft.');
includes(html, 'Layout geprüft', 'Eine erfolgreiche Layoutprüfung wird verständlich bestätigt.');
includes(html, 'Seite(n) mit Überlauf erkannt.', 'Eine erkannte Überfüllung wird verständlich gemeldet.');

// CSS- und A4-Druckhärtung.
includes(html, '@page{size:A4 portrait;margin:0}', 'Das PDF verwendet ein festes A4-Hochformat.');
includes(html, 'background:#fff;isolation:isolate', 'Der Deckblatthintergrund ist weiss.');
includes(html, '.report-cover-watermark{position:absolute', 'Das Wasserzeichen ist kontrolliert positioniert.');
includes(html, 'opacity:.055', 'Das Wasserzeichen bleibt bewusst dezent.');
includes(html, 'font-size:17px;line-height:1.12', 'Seitentitel sind drucksicher verkleinert.');
includes(html, 'height:calc(297mm - 12mm - 15mm - 36mm);min-height:0;overflow:hidden', 'Der Seiteninhalt bleibt kontrolliert innerhalb der A4-Seite.');
includes(html, 'page-break-after:always', 'Jede Berichtsseite erhält einen festen Seitenumbruch.');
includes(html, 'break-inside:avoid', 'Kritische Berichtselemente werden gegen innere Seitenumbrüche geschützt.');
includes(html, '@media print', 'Eigene Druckregeln sind vorhanden.');

// Versions-, Dokumentations- und Testintegration.
const reportSource = read('src/report/ReportEngine.js');
const versionSource = read('src/core/appVersion.js');
const appHtml = read('app.html');
const mainSource = read('src/main.js');
const packageJson = JSON.parse(read('package.json'));
const release = JSON.parse(read('release.json'));
const roadmap = read('ROADMAP.md');
const changelog = read('CHANGELOG.md');
const releaseNotes = read('RELEASE_NOTES.md');
const testPlan = read('docs/TESTPLAN.md');

includes(reportSource, 'const MAIN_NETWORK_ROWS_PER_PAGE = 15;', 'Teilstreckenseiten sind auf 15 drucksichere Zeilen begrenzt.');
includes(reportSource, 'const FORMPART_BOXES_PER_PAGE = 4;', 'Formteilseiten sind auf vier Boxen begrenzt.');
includes(reportSource, 'const QUALITY_FIRST_PAGE_ROWS = 8;', 'Die erste QS-Seite berücksichtigt den zusätzlichen Überblick.');
includes(reportSource, 'const ENGINEERING_FIRST_PAGE_ROWS = 8;', 'Die erste Engineering-Seite berücksichtigt den zusätzlichen Überblick.');
includes(versionSource, "APP_VERSION = '3.0.0'", 'App-Version steht auf dem aktuellen Stand 3.0.0.');
includes(versionSource, "APP_RELEASE = '58.00'", 'App-Release steht auf dem aktuellen Stand Phase 56.00.');
equal(packageJson.version, '3.0.0', 'package.json steht auf Version 3.0.0.');
equal(release.version, '3.0.0', 'release.json steht auf Version 3.0.0.');
equal(release.phase, '58.00', 'release.json steht auf Phase 56.00.');
check(Number(release.quality?.reportCompletionChecks) > 0, 'release.json dokumentiert die Phase-53-Prüfungen.');
includes(appHtml, 'phase52_00.css?v=58.00', 'Das Phase-52-Stylesheet bleibt fachlich versioniert und erhält die neue Releasekennung.');
includes(appHtml, 'src/main.js?v=58.00', 'Das Main-Modul wird mit Phase-53-Kennung geladen.');
includes(mainSource, 'WorkspaceComponent.js?v=58.00', 'Der Workspace wird cache-sicher mit Phase 53 geladen.');
includes(roadmap, 'Phase 53.00 – PDF- und Berichtsabschluss – abgeschlossen', 'Die Roadmap markiert Phase 53 als abgeschlossen.');
includes(roadmap, 'Phase 54.00 – Anlagenschema im Bericht – abgeschlossen', 'Die Roadmap dokumentiert Phase 54 als abgeschlossen.');
includes(changelog, '## 2.8.0 – Phase 53.00', 'Der Changelog enthält den Phase-53-Eintrag.');
includes(releaseNotes, 'Version 3.0.0', 'Die Release Notes nennen Version 3.0.0.');
includes(releaseNotes, 'Phase 58.00', 'Die Release Notes nennen den aktuellen Stand Phase 56.00.');
includes(testPlan, 'npm run test:phase53', 'Der Testplan dokumentiert die neue Phase-53-Testsuite.');

console.log(`Phase 53.00 PDF- und Berichtsabschluss: ${checks} Prüfungen bestanden.`);
