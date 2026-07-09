import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';

const output = document.getElementById('output');
const root = document.getElementById('root');
const log = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
  log.push(`✓ ${message}`);
}

const project = {
  id: 'project-dashboard',
  name: 'Dashboard Test',
  systems: [
    {
      id: 'system-dashboard',
      name: 'Zuluftanlage',
      sections: [
        { id: 'section-1', name: 'ts1', type: 'duct', q: 900, l: 5, b: 0.45, h: 0.45 },
      ],
      formParts: [],
      specialComponents: [],
    },
  ],
  calculationResult: {
    calculation: {
      totals: { totalRounded: 42.5 },
    },
    quality: {
      errors: [],
      warnings: [],
    },
  },
  reportOptions: {
    toc: true,
    sections: true,
    formParts: true,
  },
};

const subscribers = [];
const state = {
  project,
  selectedSystem: project.systems[0],
  selection: { type: 'project', data: project },
  lastCalculationAt: '2026-07-08T12:00:00.000Z',
  subscribe(callback) { subscribers.push(callback); },
  notify() { subscribers.forEach(callback => callback()); },
  getSelection() { return this.selection; },
  setSelection(type, data) { this.selection = { type, data }; },
  selectSection(section) { this.selection = { type: 'section', data: section }; this.notify(); },
  selectFormPart(formPart) { this.selection = { type: 'formPart', data: formPart }; this.notify(); },
  selectSpecialComponent(component) { this.selection = { type: 'specialComponent', data: component }; this.notify(); },
  selectFormPartPicker(data) { this.selection = { type: 'formPartPicker', data }; this.notify(); },
  selectSystem(system) { this.selectedSystem = system; this.selection = { type: 'system', data: system }; this.notify(); },
  isSelected(type, id) { return this.selection?.type === type && this.selection?.data?.id === id; },
  markCalculationDirty() {},
  markProjectDirty() {},
  markAutoCalculated() {},
  markAutoCalculationFailed() {},
};

try {
  new WorkspaceComponent(root, state);

  assert(root.querySelector('.dp-workflow-dashboard'), 'Dashboard wird in der Projektansicht angezeigt');
  assert(root.textContent.includes('Projektfortschritt'), 'Dashboard zeigt Projektfortschritt');
  assert(root.textContent.includes('42.5 Pa'), 'Dashboard zeigt Gesamtdruckverlust');
  assert(root.textContent.includes('QS OK'), 'Dashboard zeigt QS-Status');

  root.querySelector('[data-workflow-action="add-formpart"]').click();
  assert(state.selection.type === 'formPartPicker', 'Schnellaktion + Formteil öffnet Formteilbibliothek');

  state.selection = { type: 'system', data: project.systems[0] };
  state.notify();
  assert(root.querySelector('.dp-workflow-dashboard'), 'Dashboard wird in der Anlagenansicht angezeigt');

  root.querySelector('[data-workflow-action="open-report"]').click();
  assert(state.selection.type === 'report', 'Schnellaktion Bericht öffnet Berichtansicht');

  output.innerHTML = `<span class="ok">OK</span>\n${log.join('\n')}`;
} catch (error) {
  output.innerHTML = `<span class="fail">FEHLER</span>\n${error.stack || error.message}`;
}
