import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';

const output = document.getElementById('output');
const root = document.getElementById('root');
const log = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
  log.push(`✓ ${message}`);
}

try {
  localStorage.removeItem('druckverlust-pro-library-recent');
} catch (error) {
  // Test läuft auch ohne LocalStorage weiter.
}

const project = {
  id: 'project-test',
  name: 'Testprojekt',
  systems: [
    {
      id: 'system-test',
      name: 'Zuluftanlage',
      sections: [
        { id: 'section-1', name: 'ts1', type: 'duct', q: 900, l: 5, b: 0.45, h: 0.45 },
      ],
      formParts: [],
      specialComponents: [],
    },
  ],
};

const subscribers = [];
const state = {
  project,
  selectedSystem: project.systems[0],
  selection: { type: 'formPartPicker', data: null },
  subscribe(callback) { subscribers.push(callback); },
  notify() { subscribers.forEach(callback => callback()); },
  getSelection() { return this.selection; },
  selectFormPart(formPart) { this.selection = { type: 'formPart', data: formPart }; this.notify(); },
  selectSpecialComponent(component) { this.selection = { type: 'specialComponent', data: component }; this.notify(); },
  selectSystem(system) { this.selection = { type: 'system', data: system }; this.selectedSystem = system; this.notify(); },
  isSelected(type, id) { return this.selection?.type === type && this.selection?.data?.id === id; },
  markCalculationDirty() {},
  markProjectDirty() {},
  markAutoCalculated() {},
  markAutoCalculationFailed() {},
};

try {
  const workspace = new WorkspaceComponent(root, state);

  assert(!root.querySelector('[data-library-recent="formpart"]'), 'Formteil-Schnellzugriff ist anfangs leer');
  root.querySelector('[data-formpart-type="kreis_bogen"]').click();
  state.selection = { type: 'formPartPicker', data: null };
  workspace.render();
  assert(root.querySelector('[data-library-recent="formpart"]'), 'Formteil-Schnellzugriff erscheint nach Nutzung');
  assert(root.textContent.includes('Zuletzt verwendete Formteile'), 'Formteil-Schnellzugriff hat Titel');

  root.querySelector('[data-library-recent-clear="formpart"]').click();
  assert(!root.querySelector('[data-library-recent="formpart"]'), 'Formteil-Schnellzugriff lässt sich leeren');

  state.selection = { type: 'system', data: project.systems[0] };
  workspace.render();
  assert(!root.querySelector('[data-library-recent="special"]'), 'Sonderbauteil-Schnellzugriff ist anfangs leer');
  root.querySelector('[data-special-type="filter"]').click();
  state.selection = { type: 'system', data: project.systems[0] };
  workspace.render();
  assert(root.querySelector('[data-library-recent="special"]'), 'Sonderbauteil-Schnellzugriff erscheint nach Nutzung');
  assert(root.textContent.includes('Zuletzt verwendete Sonderbauteile'), 'Sonderbauteil-Schnellzugriff hat Titel');

  output.innerHTML = `<span class="ok">OK</span>\n${log.join('\n')}`;
} catch (error) {
  output.innerHTML = `<span class="fail">FEHLER</span>\n${error.stack || error.message}`;
}
