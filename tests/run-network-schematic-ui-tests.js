import assert from 'node:assert/strict';
import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';
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
  setSelection() {},
  notify() {},
  selectSection() {},
};
workspace.networkSchematicZoom = 1;
workspace.renderNetworkSchematic(system);

assert.match(html, /Technische Anlagenansicht/);
assert.match(html, /Phase 24\.10/);
assert.match(html, /800 × 450 mm/);
assert.doesNotMatch(html, /0\.8 × 0\.45 mm/);
assert.match(html, /Gesamtdruckverlust/);
assert.match(html, /Gesamtluftmenge Einlass/);
assert.match(html, /Max\. Geschwindigkeit/);
assert.match(html, /data-schema-action="zoom-in"/);
assert.match(html, /data-schema-action="fit"/);
assert.match(html, /dp-schema-transition/);
assert.match(html, /dp-schema-attachment is-formpart/);
assert.match(html, /dp-schema-attachment is-special/);
assert.match(html, /dp-schema-terminal is-start/);
assert.match(html, /dp-schema-terminal is-end/);
assert.match(html, /Kanalzügen, Bauteilen und Live-Kennwerten/);
assert.equal((html.match(/data-schema-section=/g) || []).length, 5);
assert.equal((html.match(/data-schema-attachment=/g) || []).length, 8);
assert.equal((html.match(/class="dp-schema-card"/g) || []).length, 5);

console.log('Anlagenzeichnung-Pro UI: 18 Prüfungen bestanden.');
