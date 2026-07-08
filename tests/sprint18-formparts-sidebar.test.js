import ApplicationState from '../src/app/ApplicationState.js';
import ProjectCommands from '../src/app/ProjectCommands.js';

const resultElement = document.getElementById('result');
const logElement = document.getElementById('log');
const log = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
  log.push(`✓ ${message}`);
}

try {
  const state = new ApplicationState();
  const commands = new ProjectCommands(state);

  const project = commands.createProject('Sprint 18 Test');
  const system = project.systems[0];

  const ts1 = commands.addSection({ name: 'ts1', type: 'duct', q: 900, l: 5, b: 0.45, h: 0.45 });
  const ts2 = commands.addSection({ name: 'ts2', type: 'pipe', q: 450, l: 3, d: 0.25 });

  const formPart = commands.createFormPart('kreis_bogen');
  formPart.sectionId = ts1.id;

  assert(system.formParts.length === 1, 'Formteil kann erstellt werden');
  assert(state.selectedFormPart?.id === formPart.id, 'erstelltes Formteil wird selektiert');

  const copy = commands.duplicateFormPart(formPart.id);
  copy.sectionId = ts2.id;

  assert(system.formParts.length === 2, 'Formteil kann dupliziert werden');
  assert(copy.id !== formPart.id, 'Duplikat erhält neue ID');
  assert(copy.name.includes('Kopie'), 'Duplikat wird als Kopie gekennzeichnet');

  commands.moveFormPart(copy.id, -1);
  assert(system.formParts[0].id === copy.id, 'Formteil kann nach oben verschoben werden');

  commands.renumberFormParts({ force: true });
  assert(system.formParts.every(part => part.name), 'Formteile können neu nummeriert werden');

  commands.deleteFormPart(formPart.id);
  assert(system.formParts.length === 1, 'Formteil kann gelöscht werden');
  assert(state.selectedFormPart || state.getSelectionType() === 'system', 'Auswahl bleibt nach Löschen gültig');

  resultElement.className = 'ok';
  resultElement.textContent = 'OK – Sprint 18 Formteilverwaltung funktioniert.';
  logElement.textContent = log.join('\n');
} catch (error) {
  resultElement.className = 'fail';
  resultElement.textContent = `Fehler: ${error.message}`;
  logElement.textContent = [...log, error.stack || error.message].join('\n');
}
