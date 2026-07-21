import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const engine = read('src/import/ProjectTableImportEngine.js');
const workspace = read('src/ui/components/WorkspaceComponent.js');
const actions = read('src/ui/core/RibbonActions.js');
const keyboard = read('src/ui/core/KeyboardShortcuts.js');
const ribbon = read('src/ui/components/RibbonComponent.js');
const sidebar = read('src/ui/components/SidebarComponent.js');
const statusbar = read('src/ui/components/StatusBarComponent.js');
const help = read('src/help/HelpCenterEngine.js');
const diagnostics = read('src/diagnostics/DeploymentDiagnostics.js');
const css = read('src/ui/phase42_00.css');
const html = read('app.html');
const main = read('src/main.js');
const landing = read('index.html');
const version = read('src/core/appVersion.js');
const packageJson = JSON.parse(read('package.json'));

check(workspace.includes("ProjectTableImportEngine from '../../import/ProjectTableImportEngine.js?v=42.00"), 'Workspace lädt die Import-Engine cache-sicher.');
check(workspace.includes("selection.type === 'projectQuickEntry'"), 'Schnellerfassung besitzt eine eigene Ansicht.');
check(workspace.includes('renderProjectQuickEntry(projectInput = null)'), 'Workspace rendert die Schnellerfassung.');
check(workspace.includes('bindProjectQuickEntryEvents(project, activeSystem, preview)'), 'Schnellerfassung bindet ihre Bedienaktionen.');
check(workspace.includes('data-quick-entry-mode'), 'Importmodus ist auswählbar.');
check(workspace.includes('data-quick-entry-text'), 'Tabelleninhalt kann eingefügt werden.');
check(workspace.includes('data-quick-entry-action="preview"'), 'Geprüfte Vorschau ist vorgesehen.');
check(workspace.includes('data-quick-entry-action="apply"'), 'Kontrollierte Übernahme ist vorgesehen.');
check(workspace.includes("createSafetyBackup('Vor Tabellenübernahme'"), 'Vor der Übernahme wird eine lokale Sicherung angelegt.');
check(workspace.includes('helpRibbonActions.calculate({ silent: true, keepDirty: true })'), 'Nach der Übernahme wird neu berechnet.');
check(workspace.includes('ProjectTableImportEngine.addImportLog'), 'Import wird im Projekt protokolliert.');
check(workspace.includes('unassignedFormParts') && workspace.includes('unassignedSpecialComponents'), 'Gelöste Bauteilzuordnungen werden sichtbar gemeldet.');

check(actions.includes('showProjectQuickEntry()'), 'RibbonActions öffnet die Schnellerfassung.');
check(actions.includes("setSelection?.('projectQuickEntry'"), 'Schnellerfassung wird zentral ausgewählt.');
check(ribbon.includes("action: 'showProjectQuickEntry'"), 'Ribbon enthält die Schnellerfassung.');
check(ribbon.includes("label: 'Schnellerfassung'"), 'Ribbon zeigt die vollständige Bezeichnung.');
check(ribbon.includes("table: '<rect"), 'Ribbon besitzt ein neutrales Tabellensymbol.');
check(sidebar.includes("type: 'projectQuickEntry'"), 'Sidebar verlinkt die Schnellerfassung.');
check(statusbar.includes("selection.type === 'projectQuickEntry'") && statusbar.includes("return 'Schnellerfassung'"), 'Statusleiste benennt die Schnellerfassung.');
check(keyboard.includes("event.shiftKey && key === 'e'"), 'Ctrl+Shift+E öffnet die Schnellerfassung.');
check(keyboard.includes('showProjectQuickEntry'), 'Tastenkürzel nutzt die zentrale Ribbon-Aktion.');

check(help.includes("id: 'quick-entry'"), 'Hilfe-Center enthält ein Schnellerfassungs-Thema.');
check(help.includes("projectQuickEntry: 'quick-entry'"), 'Schnellerfassung erhält kontextbezogene Hilfe.');
check(help.includes("keys: 'Ctrl + Shift + E'"), 'Tastenkürzel ist im Hilfe-Center dokumentiert.');
check(main.includes("schnellerfassung: 'quick-entry'"), 'Startlink kann direkt die Importhilfe öffnen.');
check(main.includes("excel: 'quick-entry'"), 'Excel-Hilfelink wird korrekt aufgelöst.');

check(engine.includes('static detectDelimiter'), 'Import-Engine erkennt Trennzeichen.');
check(engine.includes('static createPreview'), 'Import-Engine erzeugt eine Prüfvorschau.');
check(engine.includes('static applyPreview'), 'Import-Engine übernimmt nur geprüfte Daten.');
check(engine.includes("['append', 'update', 'replace']"), 'Drei sichere Importmodi sind vorhanden.');
check(engine.includes('replacementByName'), 'Ersetzen ordnet bestehende Bauteile anhand der Teilstreckenbezeichnung neu zu.');
check(engine.includes('static serializeSystem'), 'Aktive Anlage kann als Tabelle exportiert werden.');
check(engine.includes('static createTemplate'), 'Eine neutrale CSV-Vorlage ist enthalten.');
check(engine.includes('tableImportHistory'), 'Importhistorie wird projektbezogen gespeichert.');

check(css.includes('.dp-quick-entry-mode-grid'), 'Phase-42-CSS gestaltet die Importmodi.');
check(css.includes('.dp-quick-entry-editor-card'), 'Tabelleneditor ist gestaltet.');
check(css.includes('.dp-quick-entry-table'), 'Prüfvorschau ist als technische Tabelle gestaltet.');
check(css.includes('.dp-quick-entry-history-card'), 'Importhistorie ist gestaltet.');
check(css.includes('@media (max-width: 820px)'), 'Schnellerfassung besitzt responsive Regeln.');
check(css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduzierte Animationen werden berücksichtigt.');

check(html.includes('phase42_00.css?v=42.00'), 'App lädt das Phase-42-Stylesheet.');
check(html.includes('src/main.js?v=52.00'), 'App lädt Main mit Phase-42-Cache-Stand.');
check(main.includes('WorkspaceComponent.js?v=52.00'), 'Main lädt Workspace cache-sicher.');
check(diagnostics.includes("ProjectTableImportEngine.js?v=${version}"), 'Deployment-QS kontrolliert die Import-Engine.');
check(diagnostics.includes("phase42_00.css?v=${version}"), 'Deployment-QS kontrolliert das Import-Stylesheet.');
check(version.includes("APP_RELEASE = '52.00'"), 'Release ist Phase 42.00.');
check(version.includes("APP_VERSION = '2.7.0'"), 'App-Version ist 1.19.0.');
check(packageJson.version === '2.7.0', 'Paketversion ist 1.19.0.');
check(packageJson.scripts['test:phase42']?.includes('run-phase42-table-import-tests.js'), 'Phase-42-Testskript ist registriert.');
check(packageJson.scripts.test.startsWith('node tests/run-phase52-result-presentation-tests.js'), 'Gesamttest startet mit Phase 42.');
check(landing.includes('Release 2.7.0 · Phase 52.00'), 'Index-Hauptseite nennt den aktuellen Stand.');
check(landing.includes('Excel') && landing.includes('CSV'), 'Index-Hauptseite erklärt die Schnellerfassung.');

console.log(`Phase 42.00 Schnellerfassung UI/Integration: ${checks} Prüfungen bestanden.`);
