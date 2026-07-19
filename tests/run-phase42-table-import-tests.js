import assert from 'node:assert/strict';
import ProjectTableImportEngine from '../src/import/ProjectTableImportEngine.js';
import StorageEngine from '../src/storage/StorageEngine.js';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const equal = (actual, expected, message) => {
  assert.equal(actual, expected, message);
  checks += 1;
};
const close = (actual, expected, tolerance, message) => {
  assert.ok(Math.abs(Number(actual) - Number(expected)) <= tolerance, `${message}: ${actual} statt ${expected}`);
  checks += 1;
};

const tabText = [
  'Teilstrecke\tBauform\tLuftmenge [m³/h]\tLänge [m]\tBreite [mm]\tHöhe [mm]\tDurchmesser [mm]\tBeschreibung',
  'Zuluft 01\tRechteckkanal\t3\'200\t12,5\t800\t450\t\tHauptkanal',
  'Zuluft 02\tRundrohr\t1200\t8\t\t\t500\tAbzweig',
].join('\n');

const emptySystem = { id: 'sys-import', name: 'Zuluft', sections: [], formParts: [], specialComponents: [] };

equal(ProjectTableImportEngine.detectDelimiter(tabText), '\t', 'Tabulator wird erkannt.');
equal(ProjectTableImportEngine.detectDelimiter('A;B;C\n1;2;3'), ';', 'Semikolon wird erkannt.');
equal(ProjectTableImportEngine.detectDelimiter('A,B,C\n1,2,3'), ',', 'Komma wird erkannt.');

close(ProjectTableImportEngine.parseNumber("3'200", { kind: 'airflow' }), 3200, 1e-12, 'Schweizer Tausendertrennzeichen wird gelesen.');
close(ProjectTableImportEngine.parseNumber('1,25', { kind: 'plain' }), 1.25, 1e-12, 'Dezimalkomma wird gelesen.');
close(ProjectTableImportEngine.parseNumber('800 mm', { kind: 'dimension', defaultUnit: 'mm' }), 0.8, 1e-12, 'Millimeter werden in Meter umgerechnet.');
close(ProjectTableImportEngine.parseNumber('80 cm', { kind: 'dimension', defaultUnit: 'mm' }), 0.8, 1e-12, 'Zentimeter werden in Meter umgerechnet.');
close(ProjectTableImportEngine.parseNumber('0.8 m', { kind: 'dimension', defaultUnit: 'mm' }), 0.8, 1e-12, 'Meter bleiben Meter.');
close(ProjectTableImportEngine.parseNumber('250 l/s', { kind: 'airflow' }), 900, 1e-12, 'Liter pro Sekunde werden in m³/h umgerechnet.');
close(ProjectTableImportEngine.parseNumber('1.2 m³/s', { kind: 'airflow' }), 4320, 1e-9, 'm³/s werden in m³/h umgerechnet.');

const parsed = ProjectTableImportEngine.parseTable(tabText);
check(parsed.hasHeader, 'Kopfzeile wird erkannt.');
equal(parsed.mapping[0], 'name', 'Teilstreckenspalte wird zugeordnet.');
equal(parsed.mapping[2], 'q', 'Luftmengenspalte wird zugeordnet.');
equal(parsed.rows.length, 2, 'Zwei Datenzeilen werden erkannt.');

const preview = ProjectTableImportEngine.createPreview(tabText, { system: emptySystem, mode: 'append' });
check(preview.canApply, 'Gültige Excel-Tabelle ist übernahmebereit.');
equal(preview.summary.total, 2, 'Vorschau enthält zwei Zeilen.');
equal(preview.summary.errors, 0, 'Gültige Vorschau enthält keine Fehler.');
equal(preview.summary.add, 2, 'Beide Zeilen werden ergänzt.');
equal(preview.rows[0].section.type, 'duct', 'Rechteckkanal wird erkannt.');
close(preview.rows[0].section.b, 0.8, 1e-12, 'Breite wird normalisiert.');
close(preview.rows[0].section.h, 0.45, 1e-12, 'Höhe wird normalisiert.');
equal(preview.rows[1].section.type, 'pipe', 'Rundrohr wird erkannt.');
close(preview.rows[1].section.d, 0.5, 1e-12, 'Durchmesser wird normalisiert.');

const semicolonPreview = ProjectTableImportEngine.createPreview([
  'TS;Typ;Volumenstrom;Länge;Breite;Höhe;Durchmesser;Bemerkung',
  'ts10;Kanal;900;1,25;450;450;;Quadratisch',
].join('\n'), { system: emptySystem, mode: 'append' });
check(semicolonPreview.canApply, 'Semikolon-CSV mit Dezimalkomma ist gültig.');
close(semicolonPreview.rows[0].section.l, 1.25, 1e-12, 'Länge mit Dezimalkomma wird korrekt gelesen.');

const invalidPreview = ProjectTableImportEngine.createPreview([
  'Teilstrecke\tBauform\tLuftmenge [m³/h]\tLänge [m]\tBreite [mm]\tHöhe [mm]\tDurchmesser [mm]',
  'Fehler 1\tRechteckkanal\t0\t2\t800\t\t',
  'Fehler 2\tRundrohr\t1000\t-1\t\t\t0',
].join('\n'), { system: emptySystem, mode: 'append' });
check(!invalidPreview.canApply, 'Fehlerhafte Tabelle wird blockiert.');
check(invalidPreview.summary.errors >= 4, 'Mehrere fachliche Fehler werden erkannt.');
check(invalidPreview.rows[0].issues.some(issue => issue.code === 'AIRFLOW_INVALID'), 'Ungültige Luftmenge wird gemeldet.');
check(invalidPreview.rows[0].issues.some(issue => issue.code === 'DUCT_DIMENSION_INVALID'), 'Fehlende Kanalhöhe wird gemeldet.');
check(invalidPreview.rows[1].issues.some(issue => issue.code === 'LENGTH_INVALID'), 'Negative Länge wird gemeldet.');
check(invalidPreview.rows[1].issues.some(issue => issue.code === 'DIAMETER_INVALID'), 'Fehlender Durchmesser wird gemeldet.');

const duplicatePreview = ProjectTableImportEngine.createPreview([
  'TS\tTyp\tq\tl\tb\th\td',
  'ts1\tKanal\t900\t1\t450\t450\t',
  'ts1\tRohr\t900\t1\t\t\t400',
].join('\n'), { system: emptySystem, mode: 'append' });
check(!duplicatePreview.canApply, 'Doppelte Importbezeichnungen werden blockiert.');
check(duplicatePreview.rows[1].issues.some(issue => issue.code === 'DUPLICATE_IMPORT_NAME'), 'Doppelte Bezeichnung erhält Fehlercode.');

const existingSystem = {
  id: 'sys-existing',
  name: 'Abluft',
  sections: [{ id: 'old-ts1', name: 'ts1', type: 'duct', q: 500, l: 2, b: 0.4, h: 0.3, d: 0, description: '', zetaSum: 0 }],
  formParts: [],
  specialComponents: [],
};
const appendDuplicate = ProjectTableImportEngine.createPreview('TS\tTyp\tq\tl\tb\th\td\nts1\tKanal\t900\t1\t500\t300\t', { system: existingSystem, mode: 'append' });
check(!appendDuplicate.canApply, 'Anhängen blockiert bereits vorhandene Bezeichnung.');
check(appendDuplicate.rows[0].issues.some(issue => issue.code === 'DUPLICATE_EXISTING_NAME'), 'Bestehende Bezeichnung erhält Fehlercode.');

const updateText = [
  'TS\tTyp\tq\tl\tb\th\td\tBeschreibung',
  'ts1\tKanal\t1200\t3\t600\t350\t\tAktualisiert',
  'ts2\tRohr\t800\t4\t\t\t315\tNeu',
].join('\n');
const updatePreview = ProjectTableImportEngine.createPreview(updateText, { system: existingSystem, mode: 'update' });
check(updatePreview.canApply, 'Aktualisierungsvorschau ist gültig.');
equal(updatePreview.summary.update, 1, 'Eine bestehende Teilstrecke wird erkannt.');
equal(updatePreview.summary.add, 1, 'Eine neue Teilstrecke wird erkannt.');
const updateResult = ProjectTableImportEngine.applyPreview(existingSystem, updatePreview, { mode: 'update' });
equal(updateResult.updated, 1, 'Eine Teilstrecke wurde aktualisiert.');
equal(updateResult.added, 1, 'Eine Teilstrecke wurde ergänzt.');
equal(existingSystem.sections[0].id, 'old-ts1', 'ID der aktualisierten Teilstrecke bleibt stabil.');
close(existingSystem.sections[0].q, 1200, 1e-12, 'Luftmenge wurde aktualisiert.');
equal(existingSystem.sections.length, 2, 'Anlage enthält danach zwei Teilstrecken.');

const replaceSystem = {
  id: 'sys-replace',
  name: 'Fortluft',
  sections: [
    { id: 'old-a', name: 'A', type: 'duct', q: 1000, l: 2, b: 0.5, h: 0.4, d: 0 },
    { id: 'old-b', name: 'B', type: 'pipe', q: 500, l: 2, b: 0, h: 0, d: 0.315 },
  ],
  formParts: [
    { id: 'fp-a', name: 'Bogen A', sectionId: 'old-a' },
    { id: 'fp-b', name: 'Bogen B', sectionId: 'old-b' },
  ],
  specialComponents: [
    { id: 'sp-a', name: 'Filter A', sectionId: 'old-a' },
    { id: 'sp-b', name: 'Filter B', sectionId: 'old-b' },
  ],
};
const replacePreview = ProjectTableImportEngine.createPreview([
  'TS\tTyp\tq\tl\tb\th\td',
  'A\tKanal\t1400\t5\t700\t400\t',
  'C\tRohr\t600\t3\t\t\t355',
].join('\n'), { system: replaceSystem, mode: 'replace' });
check(replacePreview.canApply, 'Ersetzungsvorschau ist gültig.');
const replaceResult = ProjectTableImportEngine.applyPreview(replaceSystem, replacePreview, { mode: 'replace' });
equal(replaceResult.removed, 2, 'Zwei frühere Teilstrecken wurden ersetzt.');
equal(replaceSystem.sections.length, 2, 'Zwei neue Teilstrecken sind vorhanden.');
check(replaceSystem.formParts[0].sectionId && replaceSystem.formParts[0].sectionId !== 'old-a', 'Gleich benannte Zuordnung wird auf neue ID übertragen.');
equal(replaceSystem.formParts[1].sectionId, null, 'Nicht mehr vorhandenes Formteil wird entkoppelt.');
check(replaceSystem.specialComponents[0].sectionId && replaceSystem.specialComponents[0].sectionId !== 'old-a', 'Sonderbauteil mit gleicher Bezeichnung wird neu zugeordnet.');
equal(replaceSystem.specialComponents[1].sectionId, '', 'Nicht mehr vorhandenes Sonderbauteil wird entkoppelt.');
equal(replaceResult.unassignedFormParts, 1, 'Entkoppeltes Formteil wird gezählt.');
equal(replaceResult.unassignedSpecialComponents, 1, 'Entkoppeltes Sonderbauteil wird gezählt.');

const exportText = ProjectTableImportEngine.serializeSystem(replaceSystem, { delimiter: ';' });
check(exportText.startsWith('Teilstrecke;Bauform;Luftmenge [m³/h]'), 'CSV-Export enthält verständliche Kopfzeile.');
check(exportText.includes('Rechteckkanal'), 'CSV-Export enthält Bauform.');
const exportPreview = ProjectTableImportEngine.createPreview(exportText, { system: { ...emptySystem, sections: [] }, mode: 'append' });
check(exportPreview.canApply, 'Exportierte Tabelle kann wieder eingelesen werden.');
equal(exportPreview.summary.total, 2, 'Roundtrip erhält zwei Zeilen.');

const project = {};
for (let index = 0; index < 35; index += 1) {
  ProjectTableImportEngine.addImportLog(project, { id: `log-${index}`, createdAt: new Date().toISOString() });
}
equal(project.tableImportHistory.length, 30, 'Importprotokoll ist auf 30 Einträge begrenzt.');
equal(project.tableImportHistory[0].id, 'log-34', 'Neuester Import steht an erster Stelle.');

const log = ProjectTableImportEngine.createImportLogEntry({ mode: 'update', added: 2, updated: 3, totalSections: 10 }, { systemId: 'sys', systemName: 'Zuluft', actor: 'Emre', note: 'Excel' });
equal(log.mode, 'update', 'Importprotokoll speichert Modus.');
equal(log.added, 2, 'Importprotokoll speichert neue Teilstrecken.');
equal(log.updated, 3, 'Importprotokoll speichert aktualisierte Teilstrecken.');
equal(log.actor, 'Emre', 'Importprotokoll speichert Bearbeiter.');
check(ProjectTableImportEngine.createFileName({ name: 'Zuluft / EG' }).endsWith('.csv'), 'CSV-Dateiname wird sicher erzeugt.');

const storedProject = {
  id: 'project-import-history',
  name: 'IMP-001',
  object: 'Importprüfung',
  tableImportHistory: [log],
  systems: [{ ...replaceSystem }],
};
const reopenedProject = StorageEngine.parse(StorageEngine.serialize(storedProject), { fileName: 'IMP-001.dvp' });
equal(reopenedProject.tableImportHistory.length, 1, 'Importnachweis bleibt in der .dvp-Datei erhalten.');
equal(reopenedProject.tableImportHistory[0].actor, 'Emre', 'Bearbeiter bleibt nach Speicher-Roundtrip erhalten.');
equal(reopenedProject.tableImportHistory[0].note, 'Excel', 'Importvermerk bleibt nach Speicher-Roundtrip erhalten.');
equal(reopenedProject.systems[0].sections.length, 2, 'Importierte Teilstrecken bleiben nach Speicher-Roundtrip erhalten.');

console.log(`Phase 42.00 Tabellenimport-Engine: ${checks} Prüfungen bestanden.`);
