#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ReleaseCandidateDiagnostics from '../src/diagnostics/ReleaseCandidateDiagnostics.js';
import { createSmallOfficePracticeProject } from '../src/project/officePracticeProjects.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import StorageEngine, { PROJECT_FILE_SCHEMA_VERSION } from '../src/storage/StorageEngine.js';
import { APP_ASSET_VERSION, APP_RELEASE, APP_VERSION } from '../src/core/appVersion.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0;

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function pass(condition, label, actual = '', expected = '') {
  assert.ok(condition, `${label}${actual !== '' || expected !== '' ? ` – Ist ${actual}, Soll ${expected}` : ''}`);
  checks += 1;
}

function equal(actual, expected, label) {
  assert.equal(actual, expected, `${label} – Ist ${actual}, Soll ${expected}`);
  checks += 1;
}

function includes(text, expected, label) {
  assert.ok(String(text).includes(expected), `${label} – „${expected}“ fehlt.`);
  checks += 1;
}

function walk(directory, extension = '.js') {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath, extension);
    return entry.name.endsWith(extension) ? [fullPath] : [];
  });
}

const packageJson = JSON.parse(read('package.json'));
const release = JSON.parse(read('release.json'));
const appVersionSource = read('src/core/appVersion.js');
const appHtml = read('app.html');
const mainSource = read('src/main.js');
const ribbonSource = read('src/ui/components/RibbonComponent.js');
const workspaceSource = read('src/ui/components/WorkspaceComponent.js');
const rcSource = read('src/diagnostics/ReleaseCandidateDiagnostics.js');
const releaseNotes = read('RELEASE_NOTES.md');
const roadmap = read('ROADMAP.md');
const changelog = read('CHANGELOG.md');

// Zentrale Versions- und Releasekonsistenz.
equal(APP_VERSION, '2.12.0', 'App-Version steht auf 2.12.0');
equal(APP_RELEASE, '57.00', 'App-Release steht auf Phase 57.00');
equal(APP_ASSET_VERSION, '57.00', 'Asset-Version steht auf Phase 57.00');
equal(packageJson.version, APP_VERSION, 'package.json entspricht der zentralen App-Version');
equal(release.version, APP_VERSION, 'release.json entspricht der zentralen App-Version');
equal(release.phase, APP_RELEASE, 'release.json entspricht dem zentralen Release');
equal(release.projectFileSchema, PROJECT_FILE_SCHEMA_VERSION, 'Release-Metadaten nennen das aktuelle Projektschema');
includes(appVersionSource, "APP_BUILD_LABEL", 'Zentrale Build-Bezeichnung bleibt vorhanden');
includes(mainSource, 'Phase 57.00', 'Hauptmodul nennt die aktuelle Phase');
includes(releaseNotes, 'Version 2.12.0 · Phase 57.00', 'Release Notes nennen den RC-Stand');
includes(roadmap, 'Phase 57.00 – Release Candidate und Fehlerbereinigung – abgeschlossen', 'Roadmap markiert Phase 57 als abgeschlossen');
includes(changelog, '2.12.0 – Phase 57.00', 'Changelog enthält Phase 57');

// Einheitliche Cachekennungen im Einstieg und in allen bereits versionierten Modulimporten.
const appAssets = [...appHtml.matchAll(/(?:href|src)="(src\/[^"]+)"/g)].map(match => match[1]);
pass(appAssets.length >= 40, 'App bindet den vollständigen lokalen Asset-Satz ein', appAssets.length, '>= 40');
pass(appAssets.every(asset => /\?v=57\.00$/.test(asset)), 'Alle App-Assets verwenden genau die Cachekennung 57.00');
pass(!appHtml.includes('&release='), 'App-Einstieg enthält keine zweite widersprüchliche Releasekennung');

const sourceFiles = walk(path.join(ROOT, 'src'));
const staticVersionedImports = [];
const staleImports = [];
sourceFiles.forEach(filePath => {
  const source = fs.readFileSync(filePath, 'utf8');
  for (const match of source.matchAll(/(?:from\s+|import\s+)["']([^"']+\.js\?v=([^"']+))["']/g)) {
    staticVersionedImports.push({ filePath, specifier: match[1], version: match[2] });
    if (match[2] !== '57.00') staleImports.push({ filePath, specifier: match[1] });
  }
});
pass(staticVersionedImports.length >= 90, 'Statisch versionierte Modulimporte werden vollständig geprüft', staticVersionedImports.length, '>= 90');
equal(staleImports.length, 0, 'Keine alte oder gemischte Import-Cachekennung ist mehr vorhanden');
pass(!sourceFiles.some(filePath => fs.readFileSync(filePath, 'utf8').includes('&release=')), 'Runtime-Quellen enthalten keine parallelen release-Querystrings');

// RC-Prüfung ist sichtbar erreichbar und nicht mehr als historische Phase 18 beschriftet.
includes(ribbonSource, "action: 'releaseCandidateCheck'", 'Ribbon enthält die sichtbare RC-Prüfung');
includes(ribbonSource, "label: 'RC-Prüfung'", 'Ribbon beschriftet die Schlussprüfung verständlich');
includes(ribbonSource, "selectionType === 'releaseCandidateCheck'", 'Aktive RC-Seite wird im Ribbon markiert');
includes(workspaceSource, 'technische Schlussprüfung von Phase 57', 'Leerseite erklärt den aktuellen RC-Zweck');
pass(!rcSource.includes('Phase 18'), 'RC-Diagnostik enthält keine veraltete Phase-18-Beschriftung');
includes(rcSource, 'calculateAllSystems', 'RC-Diagnostik berechnet alle Anlagen');
includes(rcSource, '.dvp-Roundtrip', 'RC-Diagnostik enthält den echten Projektdatei-Roundtrip');
includes(rcSource, 'Büro-Referenz', 'RC-Diagnostik enthält einen deterministischen Praxis-Smoketest');
includes(rcSource, 'RC-Zeitbudget', 'RC-Diagnostik bewertet die Laufzeiten');

// Funktionaler RC-Sammeltest an einem reproduzierbaren Mehrkomponentenprojekt.
const project = createSmallOfficePracticeProject();
const activeSystem = project.systems[0];
project.calculationResult = ProjectCalculationService.calculate(project, activeSystem.id);
const state = {
  project,
  selectedSystem: activeSystem,
  isProjectDirty: false,
  isCalculationDirty: true,
  lastAutoCalculationError: null,
};
const result = await ReleaseCandidateDiagnostics.run({
  state,
  project,
  system: activeSystem,
  registry: ProjectCalculationService.getFormPartRegistry(),
  includeDeployment: false,
});

pass(result.status !== 'error', 'RC-Sammeltest ist nicht blockiert', result.status, 'ok oder warning');
equal(result.release, APP_RELEASE, 'RC-Ergebnis verwendet die aktuelle Phase');
equal(result.version, APP_VERSION, 'RC-Ergebnis verwendet die aktuelle Version');
equal(result.schemaVersion, PROJECT_FILE_SCHEMA_VERSION, 'RC-Ergebnis nennt das aktuelle Dateischema');
equal(result.projectCounts.systems, project.systems.length, 'RC-Ergebnis zählt alle Anlagen');
equal(result.projectCounts.sections, project.systems.flatMap(system => system.sections || []).length, 'RC-Ergebnis zählt alle Teilstrecken');
pass(result.metrics.calculationMs >= 0, 'RC-Ergebnis enthält eine Berechnungslaufzeit');
pass(result.metrics.reportMs >= 0, 'RC-Ergebnis enthält eine Berichtslaufzeit');
pass(result.metrics.storageMs >= 0, 'RC-Ergebnis enthält eine Datei-Roundtrip-Laufzeit');
pass(result.metrics.reportPages > 0, 'RC-Ergebnis enthält geplante Berichtseiten', result.metrics.reportPages, '> 0');
pass(result.items.some(item => item.label === 'Alle Anlagen' && item.area === 'Berechnung' && item.status === 'ok'), 'Alle Anlagen werden im RC-Check erfolgreich berechnet');
pass(result.items.some(item => item.label === '.dvp-Roundtrip' && item.status === 'ok'), 'Projektdatei-Roundtrip besteht den RC-Check');
pass(result.items.some(item => item.label === 'Büro-Referenz' && item.status === 'ok'), 'Praxis-Smoketest besteht den RC-Check');
pass(result.items.some(item => item.label === 'RC-Zeitbudget'), 'Performancebewertung ist im RC-Ergebnis vorhanden');
pass(state.isCalculationDirty === false && state.lastAutoCalculationError === null, 'RC-Lauf aktualisiert den Berechnungsstatus ohne Fehler');

const protocol = ReleaseCandidateDiagnostics.toText(result);
includes(protocol, `Release Candidate Phase ${APP_RELEASE}`, 'RC-Protokoll nennt die aktuelle Phase');
includes(protocol, 'Umfang:', 'RC-Protokoll enthält den Projektumfang');
includes(protocol, 'Laufzeiten:', 'RC-Protokoll enthält die gemessenen Laufzeiten');
includes(protocol, 'Prüfpunkte:', 'RC-Protokoll enthält die Einzelprüfungen');

// Unabhängiger Speichertest der verwendeten RC-Referenz.
const serialized = StorageEngine.serialize(project);
const envelope = JSON.parse(serialized);
equal(envelope.appVersion, APP_VERSION, '.dvp-Hülle enthält die RC-App-Version');
equal(envelope.appRelease, APP_RELEASE, '.dvp-Hülle enthält die RC-Phase');
equal(envelope.schemaVersion, PROJECT_FILE_SCHEMA_VERSION, '.dvp-Hülle enthält das aktuelle Schema');
pass(StorageEngine.parse(serialized, { fileName: 'Phase57-RC.dvp' }).systems.length === project.systems.length, 'RC-Projekt lässt sich erneut öffnen');

// Testkette und Browser-/PDF-Abnahme bleiben explizit erreichbar.
pass(packageJson.scripts.test.startsWith('node tests/run-phase57-release-candidate-tests.js'), 'Gesamttest startet mit der aktuellen Phase 57');
includes(packageJson.scripts['test:phase57'], 'run-phase57-release-candidate-tests.js', 'Eigener Phase-57-Testbefehl ist vorhanden');
includes(packageJson.scripts['test:phase57:browser'], 'run-phase57-browser-print-tests.js', 'Browser-/PDF-Abnahmetest ist im RC-Release weiterhin vorhanden');

console.log(`Phase 57 Release-Candidate-QS: ${checks}/${checks} Prüfungen bestanden.`);
