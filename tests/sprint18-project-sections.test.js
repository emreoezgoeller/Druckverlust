import ApplicationState from '../src/app/ApplicationState.js';
import ProjectCommands from '../src/app/ProjectCommands.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const state = new ApplicationState();
const commands = new ProjectCommands(state);

const project = commands.createProject('Sprint 18 Testprojekt');
project.meta = {
  name: 'Sprint 18 Testprojekt',
  object: 'Objekt A',
  anlage: 'Zuluftanlage 01',
  anlageNumber: 'L-001',
  bearbeiter: 'Test',
  company: 'Druckverlust Pro',
  address: 'Bern',
  note: 'Automatischer Sprint-18-Test',
};

const sectionA = commands.addSection();
Object.assign(sectionA, { q: 900, l: 8, b: 0.4, h: 0.3, name: 'ts1' });

const sectionB = commands.duplicateSection(sectionA.id);
Object.assign(sectionB, { q: 1200, name: 'ts2' });

commands.moveSection(sectionB.id, -1);
commands.renumberSections({ force: true });

assert(state.selectedSystem.sections.length === 2, 'Es müssen zwei Teilstrecken vorhanden sein.');
assert(state.selectedSystem.sections[0].name === 'ts1', 'Neu nummerieren muss ts1 erzeugen.');
assert(state.selectedSystem.sections[1].name === 'ts2', 'Neu nummerieren muss ts2 erzeugen.');

const result = ProjectCalculationService.calculate(project);
assert(result?.calculation?.results?.length === 2, 'Berechnung muss beide Teilstrecken enthalten.');

commands.deleteSection(state.selectedSystem.sections[0].id);
assert(state.selectedSystem.sections.length === 1, 'Löschen muss eine Teilstrecke entfernen.');

if (typeof document !== 'undefined') {
  const target = document.getElementById('result');
  if (target) {
    target.textContent = 'Sprint 18 Projektangaben + Teilstreckenverwaltung: OK';
    target.className = 'ok';
  }
}
