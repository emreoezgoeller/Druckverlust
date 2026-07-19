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

const workspace = read('src/ui/components/WorkspaceComponent.js');
const actions = read('src/ui/core/RibbonActions.js');
const keyboard = read('src/ui/core/KeyboardShortcuts.js');
const ribbon = read('src/ui/components/RibbonComponent.js');
const css = read('src/ui/phase41_00.css');
const html = read('app.html');
const main = read('src/main.js');
const version = read('src/core/appVersion.js');
const packageJson = JSON.parse(read('package.json'));

check(workspace.includes("HelpCenterEngine from '../../help/HelpCenterEngine.js?v=42.00'"), 'Workspace lädt die Hilfe-Engine cache-sicher.');
check(workspace.includes('renderHelp(context = null)'), 'Workspace besitzt das neue Hilfe-Center.');
check(workspace.includes('data-help-search'), 'Hilfe-Center besitzt eine Suche.');
check(workspace.includes('data-help-category'), 'Hilfe-Center besitzt Kategorien.');
check(workspace.includes('data-help-topic'), 'Hilfethemen sind auswählbar.');
check(workspace.includes('data-help-tour-open'), 'Geführte Schritte öffnen passende Bereiche.');
check(workspace.includes('data-help-tour-toggle'), 'Geführte Schritte können markiert werden.');
check(workspace.includes('data-help-reset-progress'), 'Hilfe-Fortschritt kann zurückgesetzt werden.');
check(workspace.includes('openHelpTarget(action'), 'Kontextziele werden zentral geöffnet.');
check(workspace.includes('restoreHelpContext(context'), 'Vorherige Ansicht kann wiederhergestellt werden.');
check(workspace.includes('copyHelpShortcuts()'), 'Tastaturübersicht kann kopiert werden.');
check(workspace.includes('Herstellerneutral'), 'Herstellerneutralität wird im Hilfe-Center erklärt.');

check(actions.includes('HelpCenterEngine.getContextTopicId(selection.type)'), 'Ribbon öffnet kontextbezogene Hilfe.');
check(actions.includes('previousSelectionType'), 'Vorherige Ansicht wird für den Rücksprung gespeichert.');
check(ribbon.includes("title: 'Kontextbezogenes Hilfe-Center öffnen (F1 oder Strg+/)'"), 'Ribbon erklärt den Hilfe-Aufruf.');
check(keyboard.includes("event.key === 'F1'"), 'F1 öffnet das Hilfe-Center.');
check(keyboard.includes("key === '/'"), 'Ctrl+/ öffnet das Hilfe-Center.');

check(css.includes('.dp-help-center-layout'), 'Phase-41-CSS gestaltet das Hilfe-Center.');
check(css.includes('.dp-help-progress-ring'), 'Fortschrittsring ist gestaltet.');
check(css.includes('.dp-help-tour-grid'), 'Geführter Ablauf ist gestaltet.');
check(css.includes('.dp-help-shortcut-groups'), 'Tastaturgruppen sind gestaltet.');
check(css.includes('@media (max-width: 560px)'), 'Hilfe-Center besitzt Smartphone-Regeln.');
check(css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduzierte Animationen werden berücksichtigt.');

check(html.includes('phase41_00.css?v=41.00'), 'App lädt das Phase-41-Stylesheet.');
check(html.includes('src/main.js?v=42.00'), 'App lädt Main mit Phase-41-Cache-Stand.');
check(main.includes('WorkspaceComponent.js?v=42.00'), 'Main lädt Workspace mit Phase-41-Cache-Stand.');
check(main.includes('resolveHelpStartupTopic(helpSection)'), 'Startlinks öffnen das passende Hilfethema.');
check(main.includes("report: 'report'"), 'Berichtslink wird auf die aktuelle Berichtshilfe abgebildet.');
check(version.includes("APP_RELEASE = '42.00'"), 'Release ist Phase 41.00.');
check(version.includes("APP_VERSION = '1.19.0'"), 'App-Version ist 1.18.0.');
check(packageJson.version === '1.19.0', 'Paketversion ist 1.18.0.');
check(packageJson.scripts['test:phase41']?.includes('run-phase41-help-center-tests.js'), 'Phase-41-Testskript ist registriert.');
check(packageJson.scripts.test.startsWith('node tests/run-phase42-table-import-tests.js'), 'Gesamttest startet mit der aktuellen Phase.');

console.log(`Phase 41.00 Hilfe-Center UI/Integration: ${checks} Prüfungen bestanden.`);
