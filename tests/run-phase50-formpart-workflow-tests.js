#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import ApplicationState from '../src/app/ApplicationState.js';
import ProjectCommands from '../src/app/ProjectCommands.js';
import createDefaultProject from '../src/project/defaultProject.js';
import {
  getAdjacentSection,
  getConnectionAssignmentIssues,
  getFormPartPosition,
  getSuggestedConnectionSectionId,
  moveFormPartWithinSection,
  resolveFormPartContextSection,
} from '../src/formteile/FormPartWorkflowEngine.js';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const equal = (actual, expected, message) => {
  assert.equal(actual, expected, message);
  checks += 1;
};

const sections = [
  { id: 's1', name: 'TS 1', type: 'duct', q: 1000, b: 0.4, h: 0.25 },
  { id: 's2', name: 'TS 2', type: 'duct', q: 700, b: 0.35, h: 0.2 },
  { id: 's3', name: 'TS 3', type: 'pipe', q: 300, d: 0.25 },
];
const system = { id: 'sys', sections, formParts: [] };

// Kontextauflösung
 equal(resolveFormPartContextSection(system, { requestedSectionId: 's2' })?.id, 's2', 'Explizit gewählte Ziel-Teilstrecke hat Vorrang.');
 equal(resolveFormPartContextSection(system, { selectedSectionId: 's1', rememberedSectionId: 's3' })?.id, 's1', 'Aktuell geöffnete Teilstrecke wird als Kontext verwendet.');
 equal(resolveFormPartContextSection(system, { rememberedSectionId: 's2' })?.id, 's2', 'Gemerkte letzte Teilstrecke wird sicher verwendet.');
 equal(resolveFormPartContextSection(system, { requestedSectionId: 'fehlt' })?.id, 's3', 'Ungültiger Kontext fällt auf die letzte gültige Teilstrecke zurück.');
 equal(resolveFormPartContextSection({ sections: [] }), null, 'Ohne Teilstrecken bleibt die Formteilzuordnung leer.');

// Reale Befehlsfolge mit Picker-Kontext
const project = createDefaultProject({ projectId: 'phase50-project', systemId: 'phase50-system' });
const activeSystem = project.systems[0];
activeSystem.sections = sections.map(section => ({ ...section }));
activeSystem.formParts = [];
const state = new ApplicationState();
state.setProject(project);
state.selectSystem(activeSystem);
const commands = new ProjectCommands(state);

state.selectSection(activeSystem.sections[1]);
commands.openFormPartPicker('s2');
equal(state.formPartPickerSectionId, 's2', 'Picker übernimmt die vom Teilstreckeneditor ausdrücklich übergebene Teilstrecke.');
const contextualPart = commands.createFormPart('kreis_bogen');
equal(contextualPart.sectionId, 's2', 'Neues Formteil wird direkt im geöffneten Arbeitskontext erstellt.');

commands.openFormPartPicker('s1');
equal(state.formPartPickerSectionId, 's1', 'Ziel-Teilstrecke kann vor der Formteilwahl gewechselt werden.');
const explicitlyAssigned = commands.createFormPart('kreis_bogen');
equal(explicitlyAssigned.sectionId, 's1', 'Geänderte Picker-Zuordnung wird bei der Erstellung übernommen.');

state.selectSystem(activeSystem);
commands.openFormPartPicker();
equal(state.formPartPickerSectionId, 's3', 'Öffnen aus der Anlage verwendet wieder die zuletzt erstellte Teilstrecke statt alten Picker-Kontext.');

// Reihenfolge nur innerhalb derselben Teilstrecke
const interleaved = [
  { id: 'a1', sectionId: 's1' },
  { id: 'b1', sectionId: 's2' },
  { id: 'a2', sectionId: 's1' },
  { id: 'b2', sectionId: 's2' },
  { id: 'a3', sectionId: 's1' },
];
const moved = moveFormPartWithinSection(interleaved, 'a2', -1);
equal(moved?.id, 'a2', 'Formteil kann innerhalb seiner Teilstrecke verschoben werden.');
equal(interleaved.filter(part => part.sectionId === 's1').map(part => part.id).join(','), 'a2,a1,a3', 'Nur die Reihenfolge in TS 1 ändert sich.');
equal(interleaved.filter(part => part.sectionId === 's2').map(part => part.id).join(','), 'b1,b2', 'Reihenfolge einer anderen Teilstrecke bleibt unverändert.');
equal(moveFormPartWithinSection(interleaved, 'a2', -1), null, 'Verschieben über den Anfang der Teilstrecke wird verhindert.');
const position = getFormPartPosition(interleaved, interleaved.find(part => part.id === 'a1'));
equal(position.index, 1, 'Lokale Position wird innerhalb der Teilstrecke bestimmt.');
equal(position.total, 3, 'Lokale Gesamtzahl enthält nur Formteile derselben Teilstrecke.');

// Navigation und sichere Vorschläge
 equal(getAdjacentSection(sections, 's2', -1)?.id, 's1', 'Vorherige Teilstrecke wird korrekt gefunden.');
 equal(getAdjacentSection(sections, 's2', 1)?.id, 's3', 'Nächste Teilstrecke wird korrekt gefunden.');
 equal(getAdjacentSection(sections, 's3', 1), null, 'Am Ende wird keine erfundene nächste Teilstrecke geliefert.');

const branchPart = { sectionId: 's1' };
equal(getSuggestedConnectionSectionId(branchPart, { field: 'throughSectionId' }, sections), 's2', 'Durchgang schlägt die nächste Teilstrecke vor.');
equal(getSuggestedConnectionSectionId(branchPart, { field: 'branchSectionId' }, sections), 's3', 'Abzweig schlägt bei freiem Durchgang die zweite folgende Teilstrecke vor.');
branchPart.throughSectionId = 's2';
equal(getSuggestedConnectionSectionId(branchPart, { field: 'branchSectionId' }, sections), 's3', 'Bereits belegter Durchgang wird beim Abzweigvorschlag ausgeschlossen.');
branchPart.branchSectionId = 's3';
equal(getSuggestedConnectionSectionId(branchPart, { field: 'transitionOtherSectionId' }, sections), '', 'Es wird keine bereits verwendete Teilstrecke doppelt vorgeschlagen.');

const connectionDefinitions = [
  { field: 'throughSectionId', label: 'Durchgang' },
  { field: 'branchSectionId', label: 'Abzweig' },
];
const sameIssue = getConnectionAssignmentIssues({ sectionId: 's1', throughSectionId: 's1' }, connectionDefinitions, sections);
check(sameIssue.some(issue => issue.includes('dieselbe Teilstrecke')), 'Widersprüchliche Haupt-/Zusatzzuordnung wird gemeldet.');
const missingIssue = getConnectionAssignmentIssues({ sectionId: 's1', branchSectionId: 'geloescht' }, connectionDefinitions, sections);
check(missingIssue.some(issue => issue.includes('nicht mehr vorhanden')), 'Gelöschte Anschluss-Teilstrecke wird verständlich gemeldet.');
equal(getConnectionAssignmentIssues({ sectionId: 's1', throughSectionId: 's2', branchSectionId: 's3' }, connectionDefinitions, sections).length, 0, 'Gültige getrennte Anschlusszuordnungen bleiben warnungsfrei.');

// UI- und Integrationsschutz
const workspace = fs.readFileSync(new URL('../src/ui/components/WorkspaceComponent.js', import.meta.url), 'utf8');
const commandsSource = fs.readFileSync(new URL('../src/app/ProjectCommands.js', import.meta.url), 'utf8');
const stateSource = fs.readFileSync(new URL('../src/app/ApplicationState.js', import.meta.url), 'utf8');
const appHtml = fs.readFileSync(new URL('../app.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/ui/phase50_00.css', import.meta.url), 'utf8');
const version = fs.readFileSync(new URL('../src/core/appVersion.js', import.meta.url), 'utf8');

check(workspace.includes('Ziel-Teilstrecke für neue Formteile') && workspace.includes('data-formpart-picker-section'), 'Picker zeigt eine änderbare Ziel-Teilstrecke.');
check(workspace.includes('data-section-action="add-formpart"'), 'Formteil kann direkt aus einer geöffneten Teilstrecke erstellt werden.');
check(workspace.includes('Einbauposition im Kanalstrang') && workspace.includes('data-formpart-workflow-action="next-section"'), 'Formteilarbeitsplatz besitzt eine verständliche Strangnavigation.');
check(workspace.includes('Manuelle Werte geschützt') && workspace.includes('preserveManualValues: true'), 'Manuelle Anschlusswerte werden beim Teilstreckenwechsel geschützt.');
check(workspace.includes('Vorschlag übernehmen') && workspace.includes('getSuggestedConnectionSectionId'), 'Abzweig- und Übergangsanschlüsse bieten bestätigbare Vorschläge.');
check(workspace.includes('moveFormPartWithinSection') && commandsSource.includes('moveFormPartWithinSectionInCollection'), 'Sortierung arbeitet teilsteckenbezogen statt global.');
check(workspace.includes('Ungültige Altzuordnungen werden bewusst nicht still auf TS 1 umgebogen.'), 'Ungültige Altzuordnungen bleiben sichtbar und werden nicht still verfälscht.');
check(stateSource.includes('formPartPickerSectionId') && stateSource.includes('setFormPartPickerSection'), 'Anwendungszustand führt den Picker-Kontext zentral.');
check(appHtml.includes('phase50_00.css?v=50.00&release=51.10'), 'Phase-50-Stylesheet wird cache-sicher geladen.');
check(css.includes('@media (max-width: 850px)') && css.includes('.dp-formpart-workflow-panel'), 'Neuer Formteil-Workflow ist responsiv ausgelegt.');
check(version.includes("APP_VERSION = '2.6.1'") && version.includes("APP_RELEASE = '51.10'"), 'Versionsdaten stehen auf dem aktuellen Release 2.6.1 / Phase 51.10.');

console.log(`Phase 50.00 intelligenter Formteil-Workflow: ${checks} Prüfungen bestanden.`);
