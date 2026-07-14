import assert from 'node:assert/strict';
import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import { createDemoProject } from '../src/project/demoProject.js';

let checks = 0;
const match = (value, pattern, message) => { assert.match(value, pattern, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };

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
  setSelection() {},
  notify() {},
  selectSection() {},
};
workspace.networkSchematicZoom = 1;
workspace.networkSchematicMode = 'standard';
workspace.renderNetworkSchematic(system);

match(html, /Phase 29\.00/, 'Neue Anlagenanalyse-Phase wird angezeigt.');
match(html, /data-schema-mode-action="standard"/, 'Standardmodus ist vorhanden.');
match(html, /data-schema-mode-action="velocity"/, 'Geschwindigkeitsmodus ist vorhanden.');
match(html, /data-schema-mode-action="pressure"/, 'Druckverlustmodus ist vorhanden.');
match(html, /data-schema-mode="standard"/, 'Standardmodus wird an SVG-Elemente übergeben.');
match(html, /dp-schema-card-accent/, 'Teilstreckenkarten besitzen eine Analysemarkierung.');

workspace.networkSchematicMode = 'velocity';
workspace.renderNetworkSchematic(system);
match(html, /data-schema-mode-action="velocity"[^>]*|class="is-active" data-schema-mode-action="velocity"/, 'Geschwindigkeitsmodus kann aktiviert werden.');
match(html, /data-schema-mode="velocity"/, 'Geschwindigkeitsmodus wird auf Kanalzüge angewendet.');
match(html, /is-low|is-medium|is-high|is-critical/, 'Geschwindigkeitswerte erhalten eine Stufe.');

workspace.networkSchematicMode = 'pressure';
workspace.renderNetworkSchematic(system);
match(html, /class="is-active" data-schema-mode-action="pressure"/, 'Druckverlustmodus kann aktiviert werden.');
match(html, /data-schema-mode="pressure"/, 'Druckverlustmodus wird auf Kanalzüge angewendet.');

equal(workspace.getSchematicVisualLevel({ velocity: 2.5 }, 'velocity'), 'low', 'Niedrige Geschwindigkeit wird neutral markiert.');
equal(workspace.getSchematicVisualLevel({ velocity: 4.5 }, 'velocity'), 'medium', 'Mittlere Geschwindigkeit wird markiert.');
equal(workspace.getSchematicVisualLevel({ velocity: 6.2 }, 'velocity'), 'high', 'Hohe Geschwindigkeit wird markiert.');
equal(workspace.getSchematicVisualLevel({ velocity: 7.5 }, 'velocity'), 'critical', 'Sehr hohe Geschwindigkeit wird kritisch markiert.');
equal(workspace.getSchematicVisualLevel({ pressureLoss: 80 }, 'pressure', { maxPressureLoss: 100 }), 'critical', 'Dominanter Druckverlust wird hervorgehoben.');

console.log(`Phase 29.00 Anlagenanalyse UI: ${checks} Prüfungen bestanden.`);
