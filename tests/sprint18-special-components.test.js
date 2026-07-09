import ProjectCommands from '../src/app/ProjectCommands.js';

const output = document.getElementById('output');
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

const state = {
  project,
  selectedSystem: project.systems[0],
  selectedSection: project.systems[0].sections[0],
  setProject(value) { this.project = value; },
  setSelection(type, data) { this.selection = { type, data }; },
  selectSpecialComponent(component) { this.selectedSpecialComponent = component; this.selection = { type: 'specialComponent', data: component }; },
  selectSystem(system) { this.selectedSystem = system; this.selection = { type: 'system', data: system }; },
  markCalculationDirty() { this.calculationDirty = true; },
  markProjectDirty() { this.projectDirty = true; },
  notify() {},
};

try {
  const commands = new ProjectCommands(state);
  const library = commands.getSpecialComponentLibrary();
  assert(library.length >= 6, 'Bauteilbibliothek enthält mehrere Sonderbauteile');

  const filter = commands.addSpecialComponent('filter');
  assert(project.systems[0].specialComponents.length === 1, 'Sonderbauteil wird hinzugefügt');
  assert(filter.pressureLoss === filter.unitPressureLoss * filter.quantity, 'Gesamtdruckverlust wird aus Anzahl × Einzelverlust berechnet');

  filter.quantity = 2;
  filter.unitPressureLoss = 45;
  commands.normalizeSpecialComponent(filter);
  assert(filter.pressureLoss === 90, 'Normalisierung aktualisiert den Gesamtdruckverlust');

  const copy = commands.duplicateSpecialComponent(filter.id);
  assert(project.systems[0].specialComponents.length === 2, 'Sonderbauteil kann dupliziert werden');
  assert(copy.id !== filter.id, 'Duplikat erhält eine eigene ID');

  commands.moveSpecialComponent(copy.id, -1);
  assert(project.systems[0].specialComponents[0].id === copy.id, 'Sonderbauteil kann sortiert werden');

  commands.renumberSpecialComponents({ force: true });
  assert(project.systems[0].specialComponents.every(item => item.name), 'Sonderbauteile können neu nummeriert werden');

  commands.deleteSpecialComponent(copy.id);
  assert(project.systems[0].specialComponents.length === 1, 'Sonderbauteil kann gelöscht werden');

  output.innerHTML = `<span class="ok">OK</span>\n${log.join('\n')}`;
} catch (error) {
  output.innerHTML = `<span class="fail">FEHLER</span>\n${error.stack || error.message}`;
}
