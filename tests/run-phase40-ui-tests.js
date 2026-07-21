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

const main = read('src/main.js');
const appState = read('src/app/ApplicationState.js');
const ribbon = read('src/ui/components/RibbonComponent.js');
const actions = read('src/ui/core/RibbonActions.js');
const keyboard = read('src/ui/core/KeyboardShortcuts.js');
const workspace = read('src/ui/components/WorkspaceComponent.js');
const sidebar = read('src/ui/components/SidebarComponent.js');
const status = read('src/ui/components/StatusBarComponent.js');
const css = read('src/ui/phase40_00.css');
const html = read('app.html');
const packageJson = JSON.parse(read('package.json'));

check(main.includes('ProjectHistoryEngine'), 'Main bindet die History-Engine ein.');
check(main.includes('state.historyEngine = history'), 'History-Engine wird am ApplicationState verfügbar gemacht.');
check(main.includes('history.install()'), 'History-Engine wird beim Start installiert.');
check(appState.includes('this.historyEngine = null'), 'ApplicationState kennt die History-Engine.');
check(appState.includes("label: 'Projektstand geladen'"), 'Projektwechsel setzt den Sitzungsverlauf zurück.');

for (const action of ['undoProjectChange', 'redoProjectChange', 'showProjectHistory']) {
  check(ribbon.includes(`action: '${action}'`), `Ribbon enthält ${action}.`);
  check(actions.includes(`${action}()`), `RibbonActions implementiert ${action}.`);
}
check(ribbon.includes("label: 'Rückgängig'"), 'Rückgängig ist vollständig beschriftet.');
check(ribbon.includes("label: 'Wiederholen'"), 'Wiederholen ist vollständig beschriftet.');
check(ribbon.includes("label: 'Verlauf'"), 'Verlauf ist vollständig beschriftet.');
check(ribbon.includes('historyState.canUndo'), 'Ribbon deaktiviert Rückgängig zustandsabhängig.');
check(ribbon.includes('historyState.canRedo'), 'Ribbon deaktiviert Wiederholen zustandsabhängig.');

check(keyboard.includes("key === 'z'"), 'Ctrl+Z ist eingebunden.');
check(keyboard.includes("key === 'y'"), 'Ctrl+Y ist eingebunden.');
check(keyboard.includes("showProjectHistory"), 'Ctrl+Shift+H öffnet den Verlauf.');
check(keyboard.includes('!this.isEditableTarget(event.target)'), 'Native Texteingabe-Undo-Funktion bleibt geschützt.');

check(workspace.includes("selection.type === 'projectHistory'"), 'Workspace rendert den Änderungsverlauf.');
check(workspace.includes('renderProjectHistory()'), 'Workspace besitzt eine eigene Verlaufsansicht.');
check(workspace.includes('data-history-action="undo"'), 'Verlaufsansicht enthält Rückgängig.');
check(workspace.includes('data-history-action="checkpoint"'), 'Verlaufsansicht unterstützt Wiederherstellungspunkte.');
check(workspace.includes('data-history-restore'), 'Einzelne Sitzungsstände können wiederhergestellt werden.');
check(workspace.includes('data-history-filter'), 'Verlauf kann gefiltert werden.');
check(workspace.includes('history.downloadCsv'), 'Verlauf kann als CSV exportiert werden.');

check(sidebar.includes("type: 'projectHistory'"), 'Sidebar enthält den Änderungsverlauf.');
check(status.includes("selection.type === 'projectHistory'"), 'Statusleiste benennt die Verlaufsansicht.');
check(status.includes('Ctrl+Z rückgängig'), 'Statusleiste dokumentiert Ctrl+Z.');

check(css.includes('.dp-history-timeline'), 'Phase-40-CSS gestaltet die Zeitleiste.');
check(css.includes('.dp-history-entry.is-current'), 'Aktueller Stand wird optisch markiert.');
check(css.includes('@media (max-width: 760px)'), 'Verlaufsansicht ist responsiv.');
check(css.includes('.dp-ribbon-action:disabled'), 'Nicht verfügbare Undo-/Redo-Schaltflächen sind sichtbar deaktiviert.');

check(html.includes('phase40_00.css?v=57.00'), 'App lädt das neue Phase-40-Stylesheet.');
check(html.includes('src/main.js?v=57.00'), 'App lädt Main mit neuem Cache-Stand.');
check(packageJson.version === '2.12.0', 'Paketversion wurde auf 1.19.0 erhöht.');
check(packageJson.scripts['test:phase40']?.includes('run-phase40-project-history-tests.js'), 'Phase-40-Testskript ist registriert.');

console.log(`Phase 40.00 UI/Integration: ${checks} Prüfungen bestanden.`);
