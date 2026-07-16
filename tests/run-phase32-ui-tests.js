import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  app: await readFile(new URL('../app.html', import.meta.url), 'utf8'),
  ribbon: await readFile(new URL('../src/ui/components/RibbonComponent.js', import.meta.url), 'utf8'),
  actions: await readFile(new URL('../src/ui/core/RibbonActions.js', import.meta.url), 'utf8'),
  workspace: await readFile(new URL('../src/ui/components/WorkspaceComponent.js', import.meta.url), 'utf8'),
  css: await readFile(new URL('../src/ui/phase32_00.css', import.meta.url), 'utf8'),
  version: await readFile(new URL('../src/core/appVersion.js', import.meta.url), 'utf8'),
  diagnostics: await readFile(new URL('../src/diagnostics/DeploymentDiagnostics.js', import.meta.url), 'utf8'),
};

const expectations = [
  [files.app.includes('phase32_00.css?v=38.00'), 'Phase-32-CSS ist eingebunden.'],
  [files.app.includes('src/main.js?v=38.00'), 'Main-Modul verwendet Cache-Version 38.00.'],
  [files.ribbon.includes("action: 'showProjectSafety'"), 'Ribbon enthält Projektsicherheit.'],
  [files.ribbon.includes("selectionType === 'projectSafety'"), 'Ribbon markiert die aktive Sicherheitsansicht.'],
  [files.actions.includes('showProjectSafety()'), 'RibbonActions öffnet die Sicherheitsansicht.'],
  [files.actions.includes("'before-open-project'"), 'Vor dem Öffnen wird eine Sicherheitssicherung erstellt.'],
  [files.actions.includes("'manual-save'"), 'Beim Dateiexport wird eine Sicherung erstellt.'],
  [files.workspace.includes("selection.type === 'projectSafety'"), 'Workspace routet die Sicherheitsansicht.'],
  [files.workspace.includes('renderProjectSafety(system = null)'), 'Sicherheitsansicht wird gerendert.'],
  [files.workspace.includes('Projektpaket exportieren'), 'Projektpaket-Export ist sichtbar.'],
  [files.workspace.includes('data-safety-backup-action="restore"'), 'Lokale Wiederherstellung ist angebunden.'],
  [files.workspace.includes('Notfallsicherung vor Wiederherstellung'), 'Wiederherstellung erzeugt eine Notfallsicherung.'],
  [files.css.includes('.dp-safety-backup-list'), 'Sicherungshistorie ist gestaltet.'],
  [files.css.includes('@media (max-width:760px)'), 'Responsive Sicherheitsansicht ist vorhanden.'],
  [files.version.includes("APP_RELEASE = '38.00'"), 'Release ist 38.00.'],
  [files.version.includes("APP_VERSION = '1.15.0'"), 'App-Version ist 1.15.0.'],
  [files.diagnostics.includes('ProjectSafetyEngine.js'), 'Deployment-QS prüft die Sicherheitsengine.'],
  [files.diagnostics.includes("'showProjectSafety'"), 'Deployment-QS erwartet den neuen Ribbon-Befehl.'],
];

expectations.forEach(([condition, message]) => assert.ok(condition, message));
console.log(`Phase 32.00 UI: ${expectations.length} Prüfungen bestanden.`);
