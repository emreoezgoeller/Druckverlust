import WorkspaceComponent from '../src/ui/components/WorkspaceComponent.js';

const output = document.getElementById('output');
const root = document.getElementById('root');
const log = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
  log.push(`✓ ${message}`);
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
  selectedSection: project.systems[0].sections[0],
  selectedSpecialComponent: null,
  selection: { type: 'system', data: project.systems[0] },
  subscribe(callback) { subscribers.push(callback); },
  notify() { subscribers.forEach(callback => callback()); },
  getSelection() { return this.selection; },
  setSelection(type, data) { this.selection = { type, data }; },
  selectSystem(system) { this.selectedSystem = system; this.selection = { type: 'system', data: system }; this.notify(); },
  selectSpecialComponent(component) { this.selectedSpecialComponent = component; this.selection = { type: 'specialComponent', data: component }; this.notify(); },
  isSelected(type, id) { return this.selection?.type === type && this.selection?.data?.id === id; },
  markCalculationDirty() { this.calculationDirty = true; },
  markProjectDirty() { this.projectDirty = true; },
  markAutoCalculated() { this.autoCalculated = true; },
  markAutoCalculationFailed() { this.autoCalculationFailed = true; },
};

try {
  new WorkspaceComponent(root, state);

  const cards = root.querySelectorAll('.dp-special-card');
  assert(cards.length >= 6, 'Sonderbauteilbibliothek rendert mehrere Kacheln');
  assert(root.querySelectorAll('.dp-special-library-group').length >= 4, 'Kacheln sind nach Kategorien gruppiert');
  assert(!root.querySelector('[data-special-library-select]'), 'alte Dropdown-Auswahl ist entfernt');

  const filterCard = [...cards].find(card => card.dataset.specialType === 'filter');
  assert(Boolean(filterCard), 'Filter-Kachel ist vorhanden');

  filterCard.click();
  assert(project.systems[0].specialComponents.length === 1, 'Klick auf Kachel erstellt ein Sonderbauteil');
  assert(state.selection?.type === 'specialComponent', 'nach dem Erstellen öffnet sich der Sonderbauteil-Editor');

  output.innerHTML = `<span class="ok">OK</span>\n${log.join('\n')}`;
} catch (error) {
  output.innerHTML = `<span class="fail">FEHLER</span>\n${error.stack || error.message}`;
}
