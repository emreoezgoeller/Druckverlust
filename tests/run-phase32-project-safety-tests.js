import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ProjectSafetyEngine, {
  PROJECT_ARCHIVE_FILE_TYPE,
  PROJECT_ARCHIVE_EXTENSION,
  MAX_LOCAL_BACKUPS,
} from '../src/safety/ProjectSafetyEngine.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const storage = new MemoryStorage();
const project = createDemoProject();
project.calculationResult = ProjectCalculationService.calculate(project);
const system = project.systems[0];

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const health = ProjectSafetyEngine.createHealth(project, { system, storage, isProjectDirty: false });
check(['ok', 'warning'].includes(health.status), 'Gesundheitsprüfung liefert einen nutzbaren Status.');
check(Number.isFinite(health.score) && health.score >= 0 && health.score <= 100, 'Sicherheits-Score liegt zwischen 0 und 100.');
check(Boolean(health.checksum), 'Projekt-Prüfsumme ist vorhanden.');
check(health.fileName.endsWith('.dvp'), 'Standard-Projektdatei bleibt .dvp.');
check(health.items.length > 10, 'Datei-, Projekt- und Rechenprüfung sind zusammengeführt.');

const archive = ProjectSafetyEngine.createArchive(project, {
  system,
  storage,
  label: 'QS-Sicherung',
  note: 'Phase-32-Test',
  reason: 'test',
  health,
});
check(archive.fileType === PROJECT_ARCHIVE_FILE_TYPE, 'Archiv-Dateityp ist korrekt.');
check(archive.projectFile?.fileType === 'DruckverlustPro', 'Normale .dvp-Nutzdaten sind im Archiv enthalten.');
check(archive.diagnostics?.items?.length === health.items.length, 'Vollständige Diagnose ist im Archiv enthalten.');
check(archive.checksum === health.checksum, 'Archiv-Prüfsumme stimmt mit dem stabilen Projektfingerabdruck überein.');

const archiveText = ProjectSafetyEngine.serializeArchive(archive);
const parsed = ProjectSafetyEngine.parseArchive(archiveText);
check(parsed.project.systems.length === project.systems.length, 'Archiv-Roundtrip erhält Anlagen.');
check(parsed.project.systems[0].sections.length === system.sections.length, 'Archiv-Roundtrip erhält Teilstrecken.');
check(parsed.archive.checksum === archive.checksum, 'Archiv-Roundtrip erhält Prüfsumme.');

const corrupted = JSON.parse(archiveText);
corrupted.projectFile.project.name = 'Manipuliert';
assert.throws(
  () => ProjectSafetyEngine.parseArchive(JSON.stringify(corrupted)),
  /Prüfsumme/,
  'Beschädigtes Archiv muss abgewiesen werden.',
);
checks += 1;

const archiveName = ProjectSafetyEngine.createArchiveFileName(project, '2026-07-16T10:30:00.000Z');
check(archiveName.endsWith(PROJECT_ARCHIVE_EXTENSION), 'Archivdateiname verwendet .dvpa.');
check(!archiveName.includes(' '), 'Archivdateiname ist dateisystemfreundlich.');

const firstBackup = ProjectSafetyEngine.saveLocalBackup(project, {
  system,
  storage,
  label: 'Erste Sicherung',
  note: 'Teststand',
  reason: 'manual',
});
check(Boolean(firstBackup?.id), 'Lokale Sicherung wurde gespeichert.');
check(ProjectSafetyEngine.listLocalBackups({ storage }).length === 1, 'Eine lokale Sicherung ist vorhanden.');

ProjectSafetyEngine.saveLocalBackup(project, {
  system,
  storage,
  label: 'Identischer Stand aktualisiert',
  reason: 'manual',
});
check(ProjectSafetyEngine.listLocalBackups({ storage }).length === 1, 'Identischer Stand wird nicht doppelt gespeichert.');

for (let index = 0; index < MAX_LOCAL_BACKUPS + 4; index += 1) {
  project.systems[0].sections[0].q = 3200 + index;
  project.calculationResult = ProjectCalculationService.calculate(project);
  ProjectSafetyEngine.saveLocalBackup(project, {
    system,
    storage,
    label: `Sicherung ${index + 1}`,
    reason: 'limit-test',
    allowDuplicate: true,
  });
}
const backups = ProjectSafetyEngine.listLocalBackups({ storage });
check(backups.length === MAX_LOCAL_BACKUPS, 'Lokale Historie wird auf acht Stände begrenzt.');
check(backups[0].label === `Sicherung ${MAX_LOCAL_BACKUPS + 4}`, 'Neueste Sicherung steht oben.');

const restored = ProjectSafetyEngine.restoreLocalBackup(backups[0].id, { storage });
check(restored.project.systems[0].sections.length === system.sections.length, 'Lokale Wiederherstellung erhält Teilstrecken.');
check(Boolean(restored.archive.checksum), 'Lokale Wiederherstellung prüft das Archiv.');

const removed = ProjectSafetyEngine.deleteLocalBackup(backups[0].id, { storage });
check(removed === true, 'Einzelne Sicherung kann gelöscht werden.');
check(ProjectSafetyEngine.listLocalBackups({ storage }).length === MAX_LOCAL_BACKUPS - 1, 'Historie wurde nach Löschen aktualisiert.');

const csv = ProjectSafetyEngine.toDiagnosticsCsv(health);
check(csv.includes('Druckverlust Pro Sicherheitsdiagnose'), 'Diagnose-CSV enthält Titel.');
check(csv.includes('Prüfsumme'), 'Diagnose-CSV enthält Prüfsumme.');
check(csv.includes('Bereich'), 'Diagnose-CSV enthält Prüfzeilen.');

ProjectSafetyEngine.clearLocalBackups({ storage });
check(ProjectSafetyEngine.listLocalBackups({ storage }).length === 0, 'Lokale Historie kann vollständig geleert werden.');

console.log(`Phase 32.00 Projektsicherheit: ${checks} Prüfungen bestanden.`);
