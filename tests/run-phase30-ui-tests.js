import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import LiveSimulationEngine from '../src/simulation/LiveSimulationEngine.js';
import ProjectCompletionEngine from '../src/closing/ProjectCompletionEngine.js';
import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';

let checks = 0;
const match = (value, pattern, message) => { assert.match(value, pattern, message); checks += 1; };
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const project = createDemoProject();
const system = project.systems[0];
project.object = 'UI-Testprojekt';
project.anlageNumber = '244';
project.author = 'UI Tester';
project.report = { ...(project.report || {}), reportNumber: 'UI-001', revision: '0', bearbeiter: 'UI Tester' };
project.calculationResult = ProjectCalculationService.calculate(project, system.id);
const simulation = LiveSimulationEngine.create(project, system.id, { airflowPercent: 110, dimensionPercent: 120 });
ProjectCompletionEngine.saveVariant(project, system.id, simulation, { name: 'UI Variante', includeInReport: true });
ProjectCompletionEngine.captureRevision(project, system.id, { revision: '0', author: 'UI Tester', change: 'UI Test' });

let html = '';
const root = {
  set innerHTML(value) { html = String(value); },
  get innerHTML() { return html; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
};
const workspace = Object.create(WorkspaceComponent.prototype);
workspace.root = root;
workspace.state = {
  project,
  selectedSystem: system,
  selectedSection: system.sections[0],
  isProjectDirty: false,
  isCalculationDirty: false,
  setSelection() {},
  notify() {},
  markProjectDirty() {},
};
workspace.liveSimulationOptions = { scope: 'all', sectionId: '', airflowPercent: 110, dimensionPercent: 120 };
workspace.liveSimulationVariantDraft = { name: '', note: '', includeInReport: true };
workspace.liveSimulationResult = null;
workspace.renderLiveSimulation(system);
match(html, /Variante dokumentieren/, 'Simulation enthält die Varianten-Dokumentation.');
match(html, /data-simulation-action="save-variant"/, 'Simulation enthält die Speichern-Aktion.');
match(html, /Variantenarchiv/, 'Simulation zeigt das Variantenarchiv.');
match(html, /UI Variante/, 'Gespeicherte Variante wird gerendert.');
match(html, /data-variant-action="report"/, 'Variante kann für den Bericht ausgewählt werden.');
match(html, /data-simulation-action="completion"/, 'Simulation verlinkt zum Projektabschluss.');

workspace.autoCalculateProject = () => project.calculationResult;
workspace.renderProjectCompletion(system);
match(html, /PHASE 31 · PROJEKTABSCHLUSS/, 'Projektabschluss besitzt den aktuellen Projektabschluss-Kopf.');
match(html, /Revisionen vergleichen und Prüfstand dokumentieren/, 'Projektabschluss erklärt den erweiterten Arbeitsbereich.');
match(html, /Revisionssnapshot/, 'Revisionssnapshot wird angeboten.');
match(html, /data-completion-action="capture-revision"/, 'Revisionsstand kann festgehalten werden.');
match(html, /Variante für Bericht auswählen/, 'Berichtsvariante ist im Abschluss sichtbar.');
match(html, /UI Variante/, 'Gespeicherte Variante erscheint im Projektabschluss.');

const ribbonSource = readFileSync(new URL('../src/ui/components/RibbonComponent.js', import.meta.url), 'utf8');
const actionSource = readFileSync(new URL('../src/ui/core/RibbonActions.js', import.meta.url), 'utf8');
const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/phase30_00.css', import.meta.url), 'utf8');
match(ribbonSource, /action: 'showProjectCompletion'/, 'Ribbon enthält Projektabschluss.');
match(ribbonSource, /selectionType === 'projectCompletion'/, 'Aktiver Projektabschluss wird markiert.');
match(actionSource, /showProjectCompletion\(\)/, 'Ribbon-Aktion öffnet den Projektabschluss.');
match(appHtml, /phase30_00\.css\?v=31\.00/, 'Phase-30-CSS wird mit aktueller Cache-Version geladen.');
match(css, /dp-completion-checks/, 'Abschluss-CSS enthält die Prüfkarte.');
match(css, /dp-variant-archive/, 'Abschluss-CSS enthält das Variantenarchiv.');
ok(html.length > 1000, 'Projektabschluss erzeugt eine vollständige Oberfläche.');

console.log(`Phase 30.00 UI: ${checks} Prüfungen bestanden.`);
