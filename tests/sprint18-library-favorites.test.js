import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';

const output = document.getElementById('output');
const root = document.getElementById('root');
const log = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
  log.push(`✓ ${message}`);
}

try {
  localStorage.removeItem('druckverlust-pro-library-favorites');
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

  assert(!root.querySelector('[data-library-favorites="formpart"]'), 'Formteil-Favoriten sind anfangs leer');
  root.querySelector('[data-library-favorite-toggle="formpart"][data-library-item-id="kreis_bogen"]').click();
  assert(root.querySelector('[data-library-favorites="formpart"]'), 'Formteil-Favoriten erscheinen nach Markierung');
  assert(root.textContent.includes('Favorisierte Formteile'), 'Formteil-Favoriten haben Titel');

  root.querySelector('[data-library-favorites-clear="formpart"]').click();
  assert(!root.querySelector('[data-library-favorites="formpart"]'), 'Formteil-Favoriten lassen sich leeren');

  state.selection = { type: 'system', data: project.systems[0] };
  workspace.render();
  assert(!root.querySelector('[data-library-favorites="special"]'), 'Sonderbauteil-Favoriten sind anfangs leer');
  root.querySelector('[data-library-favorite-toggle="special"][data-library-item-id="filter"]').click();
  assert(root.querySelector('[data-library-favorites="special"]'), 'Sonderbauteil-Favoriten erscheinen nach Markierung');
  assert(root.textContent.includes('Favorisierte Sonderbauteile'), 'Sonderbauteil-Favoriten haben Titel');

  root.querySelector('[data-library-favorite-toggle="special"][data-library-item-id="filter"]').click();
  assert(!root.querySelector('[data-library-favorites="special"]'), 'Sonderbauteil-Favorit lässt sich direkt deaktivieren');

  output.innerHTML = `<span class="ok">OK</span>\n${log.join('\n')}`;
} catch (error) {
  output.innerHTML = `<span class="fail">FEHLER</span>\n${error.stack || error.message}`;
}
