#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import createDefaultProject from '../src/project/defaultProject.js';
import StorageEngine, {
  PROJECT_FILE_SCHEMA_VERSION,
  ProjectFileError,
  normalizeProjectForStorage,
} from '../src/storage/StorageEngine.js';
import ProjectMigrationEngine, {
  CURRENT_PROJECT_SCHEMA_VERSION,
  compareSchemaVersions,
} from '../src/storage/ProjectMigrationEngine.js';
import ProjectFileDiagnostics from '../src/diagnostics/ProjectFileDiagnostics.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const includes = (text, needle, message) => { check(String(text).includes(needle), message); };
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const expectProjectFileError = (fn, code, message) => {
  let caught = null;
  try { fn(); } catch (error) { caught = error; }
  check(caught instanceof ProjectFileError, `${message}: kein ProjectFileError.`);
  equal(caught?.code, code, `${message}: falscher Fehlercode.`);
  check(String(caught?.toUserMessage?.() || caught?.message || '').length > 20, `${message}: keine verständliche Benutzerinformation.`);
  return caught;
};

// Schema- und Versionslogik.
equal(PROJECT_FILE_SCHEMA_VERSION, '1.3.0', 'StorageEngine verwendet Schema 1.3.0.');
equal(CURRENT_PROJECT_SCHEMA_VERSION, '1.3.0', 'MigrationEngine verwendet Schema 1.3.0.');
equal(compareSchemaVersions('1.2.0', '1.3.0'), -1, 'Älteres Schema wird erkannt.');
equal(compareSchemaVersions('1.3', '1.3.0'), 0, 'Kurzform desselben Schemas wird erkannt.');
equal(compareSchemaVersions('2.0.0', '1.3.0'), 1, 'Neueres Schema wird erkannt.');
equal(ProjectMigrationEngine.compareVersions('1.10.0', '1.9.9'), 1, 'Versionen werden numerisch statt lexikalisch verglichen.');

// Aktuelles Projekt bleibt ohne Migration stabil.
const currentProject = createDefaultProject({
  projectId: 'phase55-current',
  systemId: 'phase55-system',
  projectNumber: 'P55-001',
  projectName: 'Aktuelles Projekt',
  siaRoomUsageCode: '4.01',
  siaOperationMode: 'two-stage',
});
currentProject.systems[0].formParts.push({
  id: 'fp-current',
  name: 'Aktueller Bogen',
  type: 'kreis_bogen',
  sectionId: 'phase55-system-ts1',
  branchSectionId: 'phase55-system-ts2',
  zeta: 0.4,
});
const currentText = StorageEngine.serialize(currentProject);
const currentPayload = JSON.parse(currentText);
equal(currentPayload.schemaVersion, '1.3.0', 'Neue Dateien werden mit Schema 1.3.0 gespeichert.');
equal(currentPayload.appVersion, '2.12.0', 'Neue Dateien enthalten Version 2.12.0.');
let currentBackupCalls = 0;
const currentReopened = StorageEngine.parse(currentText, {
  fileName: 'P55-001.dvp',
  onBeforeMigration: () => { currentBackupCalls += 1; },
});
equal(currentBackupCalls, 0, 'Aktuelle Datei erzeugt keine unnötige Migrationssicherung.');
equal(currentReopened._importInfo?.migrationRequired, false, 'Aktuelle Datei wird nicht als Migration markiert.');
equal(currentReopened.systems[0].formParts[0].sectionId, 'phase55-system-ts1', 'Aktuelle Hauptzuordnung bleibt erhalten.');
equal(currentReopened.systems[0].formParts[0].branchSectionId, 'phase55-system-ts2', 'Aktuelle Anschlusszuordnung bleibt erhalten.');
equal(currentReopened.systems[0].sections[0].roughnessMm, 0.15, 'Aktuelle Rauigkeit bleibt erhalten.');
equal(currentReopened.systems[0].siaVelocity.roomUsageCode, '4.01', 'Aktuelle SIA-Raumnutzung bleibt erhalten.');
equal(currentReopened.systems[0].siaVelocity.operationMode, 'two-stage', 'Aktuelle Betriebsart bleibt erhalten.');

// Historische 1.0-Hülle: numerische IDs, mm-Geometrien, fehlende Rauigkeit/SIA.
const legacyWrapped = {
  fileType: 'DruckverlustPro',
  version: '1.0.0',
  exportedAt: '2025-01-02T03:04:05.000Z',
  project: {
    projectNumber: 'ALT-100',
    projectName: 'Historisches Projekt',
    bearbeiter: 'Altbestand',
    settings: { rho: '1,21', lambda: '0,025' },
    systems: [{
      id: 77,
      anlage: 'Bestandsanlage',
      sections: [
        { id: 1, name: 'ts1', volumeFlow: '1800', length: '8,5', width: '800', height: '450' },
        { id: 2, name: 'ts2', airVolume: '900', length: 4, diameter: 315 },
      ],
      formParts: [
        { id: 'fp1', name: 'Bogen', formPartType: 'kreis_bogen', sectionId: 1, throughSectionId: 2 },
        { id: 'fp2', name: 'Defekt', formPartType: 'kreis_bogen', sectionId: 999 },
      ],
      specialComponents: [
        { id: 'sp1', name: 'Filter', count: 2, singlePressureLoss: '35', sectionId: 2 },
      ],
    }],
  },
};
let legacyBackup = null;
const legacyText = JSON.stringify(legacyWrapped, null, 2);
const migrated = StorageEngine.parse(legacyText, {
  fileName: 'ALT-100.dvp',
  onBeforeMigration: backup => { legacyBackup = backup; },
});
check(Boolean(legacyBackup), 'Vor der Migration wird eine Sicherung vorbereitet.');
equal(legacyBackup.text, legacyText, 'Die Sicherung enthält unverändert den Originaltext.');
equal(legacyBackup.fileName, 'ALT-100_Original-vor-Migration.dvp', 'Die Originalsicherung erhält einen eindeutigen Dateinamen.');
equal(legacyBackup.plan.sourceSchemaVersion, '1.0.0', 'Sicherungsplan dokumentiert das Quellschema.');
equal(migrated._importInfo?.migrationRequired, true, 'Historische Datei wird als Migration markiert.');
equal(migrated._importInfo?.sourceSchemaVersion, '1.0.0', 'Quellschema bleibt im Öffnungsprotokoll sichtbar.');
equal(migrated._importInfo?.targetSchemaVersion, '1.3.0', 'Zielschema bleibt im Öffnungsprotokoll sichtbar.');
equal(migrated._importInfo?.backupCreated, true, 'Erstellte Originalsicherung wird protokolliert.');
equal(migrated.name, 'ALT-100', 'Alte Projektnummer wird übernommen.');
equal(migrated.object, 'Historisches Projekt', 'Alter Projektname wird übernommen.');
equal(migrated.author, 'Altbestand', 'Alter Bearbeiter wird übernommen.');
equal(migrated.systems[0].id, '77', 'Numerische Anlagen-ID wird verlustfrei als String übernommen.');
equal(migrated.systems[0].sections[0].id, '1', 'Numerische Teilstrecken-ID wird als String übernommen.');
equal(migrated.systems[0].sections[0].b, 0.8, 'Historische Breite in mm wird in Meter umgerechnet.');
equal(migrated.systems[0].sections[0].h, 0.45, 'Historische Höhe in mm wird in Meter umgerechnet.');
equal(migrated.systems[0].sections[1].d, 0.315, 'Historischer Durchmesser in mm wird in Meter umgerechnet.');
equal(migrated.systems[0].sections[0].roughnessMm, 0.15, 'Fehlende Kanalrauigkeit wird mit 0,15 mm ergänzt.');
equal(migrated.systems[0].sections[1].roughnessMm, 0.15, 'Fehlende Rohrrauigkeit wird mit 0,15 mm ergänzt.');
equal(migrated.systems[0].siaVelocity.roomUsageCode, '', 'Fehlende SIA-Raumnutzung wird nicht erfunden.');
equal(migrated.systems[0].siaVelocity.operationMode, '', 'Fehlende Betriebsart wird nicht erfunden.');
equal(migrated.systems[0].formParts[0].sectionId, '1', 'Gültige historische Formteilzuordnung bleibt erhalten.');
equal(migrated.systems[0].formParts[0].throughSectionId, '2', 'Gültige historische Anschlusszuordnung bleibt erhalten.');
equal(migrated.systems[0].formParts[1].sectionId, null, 'Ungültige historische Formteilzuordnung wird kontrolliert gelöst.');
equal(migrated.systems[0].specialComponents[0].sectionId, '2', 'Gültige Sonderbauteilzuordnung bleibt erhalten.');
equal(migrated.systems[0].specialComponents[0].pressureLoss, 70, 'Historischer Sonderbauteilverlust wird korrekt normalisiert.');
check(migrated._importInfo.migrationStats.preservedAssignments >= 3, 'Erhaltene Zuordnungen werden gezählt.');
equal(migrated._importInfo.migrationStats.clearedAssignments, 1, 'Gelöste ungültige Zuordnung wird gezählt.');
equal(migrated._importInfo.migrationStats.defaultedRoughnessSections, 2, 'Ergänzte Rauigkeiten werden gezählt.');
equal(migrated._importInfo.migrationStats.defaultedSiaSystems, 1, 'Unvollständige SIA-Konfiguration wird gezählt.');
check(migrated._importInfo.normalizedWarnings.some(item => item.includes('0,15')), 'Öffnungsprotokoll erklärt die ergänzte Rauigkeit.');
check(migrated._importInfo.normalizedWarnings.some(item => item.includes('SIA-Raumnutzung')), 'Öffnungsprotokoll erklärt die fehlende SIA-Konfiguration.');

// Alte deutsche Feldstruktur direkt auf Projektebene.
const germanRaw = {
  projektnummer: 'DE-ALT-1',
  projektname: 'Deutsche Altstruktur',
  firma: 'EO Test',
  anlage: 'Zuluft Alt',
  siaRoomUsageCode: '4.01',
  siaOperationMode: 'one-stage',
  teilstrecken: [
    { teilstreckeId: 'ts-a', bezeichnung: 'Hauptkanal', querschnittstyp: 'Rechteckkanal', luftmenge: '3200', breite: 800, hoehe: 450, laenge: 8.5, rauigkeit: '0,20' },
    { teilstreckeId: 'ts-b', bezeichnung: 'Rohr', querschnittstyp: 'Rundrohr', volumenstrom: 900, durchmesser: 315, laenge: 4 },
  ],
  formteile: [
    { formteilId: 'fa', bezeichnung: 'Abzweig', formteiltyp: 't_abzweig', teilstreckeId: 'ts-a', abzweigTeilstreckeId: 'ts-b' },
  ],
  sonderbauteile: [
    { bauteilId: 'sa', bezeichnung: 'Schalldämpfer', anzahl: 1, druckverlust: 22, teilstreckeId: 'ts-b' },
  ],
};
const germanMigrated = StorageEngine.parse(JSON.stringify(germanRaw), { fileName: 'de-alt.dvp' });
equal(germanMigrated.name, 'DE-ALT-1', 'Deutsche Projektnummer wird erkannt.');
equal(germanMigrated.object, 'Deutsche Altstruktur', 'Deutscher Projektname wird erkannt.');
equal(germanMigrated.systems.length, 1, 'Einzelanlage auf Projektebene wird aufgebaut.');
equal(germanMigrated.systems[0].sections.length, 2, 'Deutsche Teilstreckenliste wird übernommen.');
equal(germanMigrated.systems[0].sections[0].q, 3200, 'Deutsche Luftmenge wird übernommen.');
equal(germanMigrated.systems[0].sections[0].roughnessMm, 0.2, 'Bestehende historische Rauigkeit bleibt erhalten.');
equal(germanMigrated.systems[0].formParts[0].sectionId, 'ts-a', 'Deutsche Hauptzuordnung wird übernommen.');
equal(germanMigrated.systems[0].formParts[0].branchSectionId, 'ts-b', 'Deutsche Abzweigzuordnung wird übernommen.');
equal(germanMigrated.systems[0].specialComponents[0].sectionId, 'ts-b', 'Deutsche Sonderbauteilzuordnung wird übernommen.');
equal(germanMigrated.systems[0].siaVelocity.roomUsageCode, '4.01', 'Alte SIA-Raumnutzung auf Projektebene wird übernommen.');
equal(germanMigrated.systems[0].siaVelocity.operationMode, 'one-stage', 'Alte Betriebsart auf Projektebene wird übernommen.');

// Legacy-Wrapper projectData und gültige SIA-Angaben.
const projectDataWrapped = {
  projectData: {
    name: 'WRAP-1',
    object: 'Legacy Wrapper',
    systems: [{
      id: 'wrap-system',
      name: 'Abluft',
      siaRoomUsageCode: '12.09',
      siaOperationMode: 'variable',
      sections: [{ id: 'wrap-ts', name: 'ts1', q: 5000, b: 1, h: 0.5, l: 3, roughnessMm: 0.31 }],
      formParts: [],
      specialComponents: [],
    }],
  },
};
const wrapperPlan = StorageEngine.prepareImport(JSON.stringify(projectDataWrapped), { fileName: 'wrapper.dvp' }).plan;
equal(wrapperPlan.format, 'legacy-wrapper:projectData', 'Legacy-Hülle projectData wird erkannt.');
check(wrapperPlan.requiresMigration, 'Legacy-Hülle projectData benötigt Migration.');
const wrapperMigrated = StorageEngine.parse(JSON.stringify(projectDataWrapped), { fileName: 'wrapper.dvp' });
equal(wrapperMigrated.systems[0].siaVelocity.roomUsageCode, '12.09', 'Gültige alte SIA-Raumnutzung bleibt erhalten.');
equal(wrapperMigrated.systems[0].siaVelocity.operationMode, 'variable', 'Gültige alte Betriebsart bleibt erhalten.');
equal(wrapperMigrated.systems[0].sections[0].roughnessMm, 0.31, 'Vorhandene Rauigkeit wird nicht überschrieben.');

// Ungültige SIA-Werte erzeugen keine falsche Normprüfung.
const invalidSia = createDefaultProject({ projectNumber: 'SIA-FEHLER' });
invalidSia.systems[0].siaVelocity = { roomUsageCode: '99.99', operationMode: 'turbo' };
const invalidSiaNormalized = normalizeProjectForStorage(invalidSia);
equal(invalidSiaNormalized.project.systems[0].siaVelocity.roomUsageCode, '', 'Unbekannte SIA-Raumnutzung wird sicher deaktiviert.');
equal(invalidSiaNormalized.project.systems[0].siaVelocity.operationMode, '', 'Unbekannte Betriebsart wird sicher deaktiviert.');
equal(invalidSiaNormalized.stats.invalidSiaValues, 2, 'Ungültige SIA-Werte werden protokolliert.');
check(invalidSiaNormalized.warnings.some(item => item.includes('99.99')), 'Ungültige Raumnutzung wird verständlich gemeldet.');
check(invalidSiaNormalized.warnings.some(item => item.includes('turbo')), 'Ungültige Betriebsart wird verständlich gemeldet.');

// Doppelte IDs werden kontrolliert korrigiert, gültige eindeutige Zuordnungen bleiben stabil.
const duplicateIds = {
  systems: [{
    id: 'dup-system',
    sections: [
      { id: 'dup-ts', q: 100, b: 0.2, h: 0.2, l: 1 },
      { id: 'dup-ts', q: 100, b: 0.2, h: 0.2, l: 1 },
    ],
    formParts: [{ id: 'dup-fp', sectionId: 'dup-ts' }],
    specialComponents: [],
  }],
};
const duplicateMigrated = StorageEngine.parse(JSON.stringify(duplicateIds));
equal(new Set(duplicateMigrated.systems[0].sections.map(item => item.id)).size, 2, 'Doppelte Teilstrecken-IDs werden eindeutig gemacht.');
equal(duplicateMigrated.systems[0].formParts[0].sectionId, 'dup-ts', 'Eindeutig auflösbare bestehende Zuordnung bleibt auf der ursprünglichen ID.');
check(duplicateMigrated._importInfo.migrationStats.correctedDuplicateIds >= 1, 'Korrigierte IDs werden protokolliert.');

// Beschädigte, unvollständige und fremde Dateien werden verständlich abgewiesen.
const invalidJsonError = expectProjectFileError(() => StorageEngine.parse('{"fileType":'), 'INVALID_JSON', 'Beschädigtes JSON');
includes(invalidJsonError.toUserMessage(), 'beschädigt', 'JSON-Fehler erklärt die Beschädigung.');
expectProjectFileError(() => StorageEngine.parse('   '), 'EMPTY_FILE', 'Leere Datei');
expectProjectFileError(() => StorageEngine.parse('[]'), 'INVALID_ROOT', 'Falsche Root-Struktur');
expectProjectFileError(() => StorageEngine.parse(JSON.stringify({ fileType: 'Fremdformat', project: { systems: [] } })), 'INVALID_FILE_TYPE', 'Fremder Dateityp');
expectProjectFileError(() => StorageEngine.parse(JSON.stringify({ fileType: 'DruckverlustPro', project: null })), 'MISSING_PROJECT_DATA', 'Fehlender Projektinhalt');
const futureError = expectProjectFileError(() => StorageEngine.parse(JSON.stringify({
  fileType: 'DruckverlustPro',
  schemaVersion: '9.0.0',
  project: { name: 'Zukunft', systems: [] },
})), 'FUTURE_SCHEMA', 'Zukünftiges Schema');
includes(futureError.toUserMessage(), 'neueren Version', 'Zukunftsfehler nennt die notwendige neuere Programmversion.');
includes(futureError.toUserMessage(), 'Schema 9.0.0', 'Zukunftsfehler nennt das gefundene Schema.');

// Migration ohne Callback verändert die Originaldatei nicht und protokolliert keine behauptete Sicherung.
const noBackupMigration = StorageEngine.parse(legacyText, { fileName: 'ohne-callback.dvp' });
equal(noBackupMigration._importInfo.backupCreated, false, 'Ohne Download-Callback wird keine Sicherung behauptet.');
equal(noBackupMigration._importInfo.backupFileName, 'ohne-callback_Original-vor-Migration.dvp', 'Vorgeschlagener Sicherungsname bleibt trotzdem verfügbar.');

// Speicher-Roundtrip nach Migration ist verlustfrei und im neuen Schema stabil.
const migratedSerialized = StorageEngine.serialize(migrated);
const migratedPayload = JSON.parse(migratedSerialized);
equal(migratedPayload.schemaVersion, '1.3.0', 'Migriertes Projekt wird im neuen Schema gespeichert.');
check(!migratedSerialized.includes('_importInfo'), 'Temporäres Öffnungsprotokoll wird nicht in .dvp gespeichert.');
check(!migratedSerialized.includes('_migrationSource'), 'Temporäre Migrationsmarker werden nicht gespeichert.');
const migratedReopened = StorageEngine.parse(migratedSerialized, { fileName: 'ALT-100-neu.dvp' });
equal(migratedReopened._importInfo.migrationRequired, false, 'Neu gespeicherter Migrationsstand benötigt keine zweite Migration.');
equal(migratedReopened.systems[0].sections.length, 2, 'Roundtrip erhält alle Teilstrecken.');
equal(migratedReopened.systems[0].formParts.length, 2, 'Roundtrip erhält alle Formteile.');
equal(migratedReopened.systems[0].formParts[0].sectionId, '1', 'Roundtrip erhält die Formteilzuordnung.');
equal(migratedReopened.systems[0].formParts[0].throughSectionId, '2', 'Roundtrip erhält die Anschlusszuordnung.');
equal(migratedReopened.systems[0].specialComponents[0].sectionId, '2', 'Roundtrip erhält die Sonderbauteilzuordnung.');

// Datei-QS zeigt Migration, Schema und Originalsicherung.
const fileCheck = ProjectFileDiagnostics.create(migrated);
check(fileCheck.items.some(item => item.area === 'Migration'), 'Datei-QS enthält einen eigenen Migrationspunkt.');
includes(ProjectFileDiagnostics.toText(fileCheck), 'Migration: 1.0.0 → 1.3.0', 'Datei-QS-Text nennt Quell- und Zielschema.');
includes(ProjectFileDiagnostics.toText(fileCheck), 'ALT-100_Original-vor-Migration.dvp', 'Datei-QS-Text nennt die Originalsicherung.');

// Versions-, UI-, Dokumentations- und Releaseintegration.
const migrationSource = read('src/storage/ProjectMigrationEngine.js');
const storageSource = read('src/storage/StorageEngine.js');
const ribbonActions = read('src/ui/core/RibbonActions.js');
const workspace = read('src/ui/components/WorkspaceComponent.js');
const diagnostics = read('src/diagnostics/ProjectFileDiagnostics.js');
const versionSource = read('src/core/appVersion.js');
const appHtml = read('app.html');
const mainSource = read('src/main.js');
const packageJson = JSON.parse(read('package.json'));
const releaseJson = JSON.parse(read('release.json'));
const roadmap = read('ROADMAP.md');
const changelog = read('CHANGELOG.md');
const releaseNotes = read('RELEASE_NOTES.md');
const migrationDocs = read('docs/MIGRATION.md');
const testPlan = read('docs/TESTPLAN.md');

includes(migrationSource, '// Druckverlust Pro – Phase 55.00', 'MigrationEngine ist als Phase 55 gekennzeichnet.');
includes(migrationSource, 'ProjectFileError', 'MigrationEngine besitzt verständliche strukturierte Dateifehler.');
includes(migrationSource, 'adaptLegacyProjectShape', 'MigrationEngine besitzt eine explizite Legacy-Transformation.');
includes(storageSource, "PROJECT_FILE_SCHEMA_VERSION = CURRENT_PROJECT_SCHEMA_VERSION", 'StorageEngine verwendet das zentrale aktuelle Schema.');
includes(storageSource, 'onBeforeMigration', 'StorageEngine unterstützt eine Sicherung vor der Migration.');
includes(storageSource, 'preservedAssignments', 'StorageEngine protokolliert erhaltene Zuordnungen.');
includes(ribbonActions, 'Original-vor-Migration', 'Öffnungsworkflow informiert über die Originalsicherung.');
includes(ribbonActions, 'onBeforeMigration', 'Öffnungsworkflow erstellt die Originalsicherung vor der Übernahme.');
includes(workspace, 'Migriert von', 'Datei-QS zeigt das Quellschema in der Oberfläche.');
includes(diagnostics, 'Rückwärtskompatibilität', 'Datei-QS bewertet die Rückwärtskompatibilität.');
includes(versionSource, "APP_VERSION = '2.12.0'", 'App-Version steht auf 2.12.0.');
includes(versionSource, "APP_RELEASE = '57.00'", 'App-Release steht auf Phase 56.00.');
equal(packageJson.version, '2.12.0', 'package.json steht auf Version 2.12.0.');
includes(packageJson.scripts['test:phase55'], 'run-phase55-project-migration-tests.js', 'package.json enthält die Phase-55-Testsuite.');
equal(releaseJson.version, '2.12.0', 'release.json steht auf Version 2.12.0.');
equal(releaseJson.phase, '57.00', 'release.json steht auf Phase 56.00.');
equal(releaseJson.projectFileSchema, '1.3.0', 'release.json nennt Schema 1.3.0.');
check(Number(releaseJson.quality?.projectMigrationChecks) >= 0, 'release.json enthält das Phase-55-Qualitätsfeld.');
includes(appHtml, 'src/main.js?v=57.00', 'Anwendung lädt Main cache-sicher für Phase 55.');
includes(mainSource, 'WorkspaceComponent.js?v=57.00', 'Main lädt den Phase-55-Workspace cache-sicher.');
includes(roadmap, 'Phase 55.00 – Projektdateien und Rückwärtskompatibilität – abgeschlossen', 'Roadmap markiert Phase 55 als abgeschlossen.');
includes(roadmap, 'Phase 57.00 – Release Candidate und Fehlerbereinigung – abgeschlossen', 'Roadmap markiert Phase 56 als abgeschlossen.');
includes(changelog, '## 2.10.0 – Phase 55.00', 'Changelog enthält Phase 55.');
includes(releaseNotes, 'Version 2.12.0', 'Release Notes nennen Version 2.12.0.');
includes(releaseNotes, 'Phase 57.00', 'Release Notes nennen den aktuellen Stand Phase 56.');
includes(migrationDocs, 'Schema 1.3.0', 'Migrationsdokumentation erklärt das neue Schema.');
includes(migrationDocs, 'Original-vor-Migration', 'Migrationsdokumentation erklärt die Originalsicherung.');
includes(testPlan, 'npm run test:phase55', 'Testplan dokumentiert die Phase-55-Testsuite.');

console.log(`Phase 55.00 Projektdateien und Rückwärtskompatibilität: ${checks} Prüfungen bestanden.`);
