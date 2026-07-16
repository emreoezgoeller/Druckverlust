import assert from 'node:assert/strict';
import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';
import { readFileSync } from 'node:fs';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import { createDemoProject } from '../src/project/demoProject.js';

const project = createDemoProject();
project.calculationResult = ProjectCalculationService.calculate(project);
const system = project.systems[0];
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
  setSelection() {},
  notify() {},
  selectSection() {},
};
workspace.liveSimulationOptions = { scope: 'all', sectionId: '', airflowPercent: 120, dimensionPercent: 110 };
workspace.liveSimulationResult = null;
workspace.renderLiveSimulation(system);

assert.match(html, /PHASE 28 · LIVE-SIMULATION/);
assert.match(html, /Neutraler Variantenvergleich/);
assert.match(html, /Nicht-destruktive Vorschau/);
assert.match(html, /data-simulation-field="scope"/);
assert.match(html, /data-simulation-field="sectionId"/);
assert.match(html, /data-simulation-field="airflowPercent"/);
assert.match(html, /data-simulation-field="dimensionPercent"/);
assert.match(html, /data-simulation-action="reset"/);
assert.match(html, /data-simulation-action="apply"/);
assert.match(html, /Gesamtdruckverlust/);
assert.match(html, /Max\. Geschwindigkeit/);
assert.match(html, /Kritische Teilstrecke/);
assert.match(html, /Bestand und Variante/);
assert.match(html, /Teilstreckenvergleich/);
assert.match(html, /Werte in Projekt übernehmen/);
assert.equal((html.match(/data-simulation-section=/g) || []).length, system.sections.length);
assert.equal((html.match(/data-simulation-open-section=/g) || []).length, system.sections.length);
assert.ok(workspace.liveSimulationResult?.scenario?.totalLoss > 0);
assert.equal(workspace.liveSimulationResult?.affectedCount, system.sections.length);

const ribbonSource = readFileSync(new URL('../src/ui/components/RibbonComponent.js', import.meta.url), 'utf8');
const ribbonActionsSource = readFileSync(new URL('../src/ui/core/RibbonActions.js', import.meta.url), 'utf8');
const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');

assert.match(ribbonSource, /action: 'showLiveSimulation'/);
assert.match(ribbonSource, /label: 'Simulation'/);
assert.match(ribbonSource, /selectionType === 'liveSimulation'/);
assert.match(ribbonActionsSource, /showLiveSimulation\(\)/);
assert.match(appHtml, /phase26_28\.css\?v=31\.00/);
assert.match(appHtml, /phase29_00\.css\?v=31\.00/);

console.log('Live-Simulation UI: 24 Prüfungen bestanden.');
