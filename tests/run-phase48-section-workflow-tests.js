#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import ApplicationState from '../src/app/ApplicationState.js';
import ProjectCommands from '../src/app/ProjectCommands.js';
import createDefaultProject from '../src/project/defaultProject.js';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const equal = (actual, expected, message) => {
  assert.equal(actual, expected, message);
  checks += 1;
};

const project = createDefaultProject({ projectId: 'phase48-project', systemId: 'phase48-system' });
const system = project.systems[0];
system.sections = [];
system.formParts = [];
system.specialComponents = [];

const state = new ApplicationState();
state.setProject(project);
state.selectSystem(system);
const commands = new ProjectCommands(state);

const first = commands.addSection();
first.name = 'TS 1';
const second = commands.addSection();
second.name = 'TS 2';
const latest = commands.addSection();
latest.name = 'TS 3';

equal(state.getLastCreatedSection(system)?.id, latest.id, 'Die zuletzt erstellte Teilstrecke wird im Zustand gemerkt.');

state.selectSection(first);
commands.openFormPartPicker();
check(state.selectedSection === null, 'Der Formteil-Picker darf die normale Elementauswahl weiterhin zurücksetzen.');
equal(state.getLastCreatedSection(system)?.id, latest.id, 'Die Standard-Zuordnung bleibt trotz geöffnetem Picker erhalten.');

const firstPart = commands.createFormPart('kreis_bogen');
equal(firstPart.sectionId, latest.id, 'Ein neues Formteil wird der zuletzt erstellten Teilstrecke zugeordnet.');

commands.moveSection(latest.id, -1);
equal(state.getLastCreatedSection(system)?.id, latest.id, 'Eine spätere Sortierung ändert nicht, welche Teilstrecke zuletzt erstellt wurde.');
const reorderedPart = commands.createFormPart('kreis_bogen');
equal(reorderedPart.sectionId, latest.id, 'Auch nach dem Verschieben bleibt die zuletzt erstellte Teilstrecke die Vorgabe.');

firstPart.sectionId = first.id;
equal(firstPart.sectionId, first.id, 'Die Formteil-Zuordnung bleibt manuell änderbar.');
const nextPart = commands.createFormPart('kreis_bogen');
equal(nextPart.sectionId, latest.id, 'Eine manuelle Änderung an einem vorhandenen Formteil beeinflusst neue Formteile nicht.');

const duplicate = commands.duplicateSection(first.id);
equal(state.getLastCreatedSection(system)?.id, duplicate.id, 'Eine duplizierte Teilstrecke gilt als neu erstellte Teilstrecke.');
const duplicatePart = commands.createFormPart('kreis_bogen');
equal(duplicatePart.sectionId, duplicate.id, 'Neue Formteile folgen der zuletzt duplizierten Teilstrecke.');

commands.deleteSection(duplicate.id);
const fallbackSection = state.getLastCreatedSection(system);
check(Boolean(fallbackSection), 'Nach dem Löschen der zuletzt erstellten Teilstrecke wird eine gültige Ersatzzuordnung bestimmt.');
const fallbackPart = commands.createFormPart('kreis_bogen');
equal(fallbackPart.sectionId, fallbackSection.id, 'Nach dem Löschen wird kein Formteil auf eine ungültige Teilstrecke gesetzt.');

system.sections = [];
const unassignedPart = commands.createFormPart('kreis_bogen');
equal(unassignedPart.sectionId, null, 'Ohne Teilstrecke wird ein Formteil kontrolliert ohne Zuordnung erstellt.');

const secondProject = createDefaultProject({ projectId: 'phase48-load', systemId: 'phase48-load-system' });
const secondState = new ApplicationState();
secondState.setProject(secondProject);
const loadedSystem = secondProject.systems[0];
equal(
  secondState.getLastCreatedSection(loadedSystem)?.id,
  loadedSystem.sections.at(-1)?.id,
  'Bei geladenen Altprojekten dient die letzte vorhandene Teilstrecke als sichere Vorgabe.',
);
const importedSection = { ...loadedSystem.sections.at(-1), id: 'phase48-imported', name: 'TS Import' };
loadedSystem.sections.push(importedSection);
equal(
  secondState.getLastCreatedSection(loadedSystem)?.id,
  importedSection.id,
  'Auch ausserhalb der Einzelanlage angehängte Import-Teilstrecken werden als neueste Teilstrecke erkannt.',
);

const workspace = fs.readFileSync(new URL('../src/ui/components/WorkspaceComponent.js', import.meta.url), 'utf8');
const editorStart = workspace.indexOf('<div class="dp-editor-grid dp-section-input-grid">');
const editorEnd = workspace.indexOf('<label class="dp-field-card dp-project-meta-wide">', editorStart);
const editor = workspace.slice(editorStart, editorEnd);
const positions = {
  name: editor.indexOf('data-field="name"'),
  airflow: editor.indexOf('data-field="q"'),
  roughness: editor.indexOf('data-field="roughnessMm"'),
  type: editor.indexOf('data-field="type"'),
  geometry: editor.indexOf('${this.renderGeometryFields(section)}'),
  length: editor.indexOf('data-field="l"'),
};
check(Object.values(positions).every(position => position >= 0), 'Alle geforderten Teilstreckenfelder sind im Editor vorhanden.');
check(
  positions.name < positions.airflow
    && positions.airflow < positions.roughness
    && positions.roughness < positions.type
    && positions.type < positions.geometry
    && positions.geometry < positions.length,
  'Feldreihenfolge ist Name, Luftmenge, Rauigkeit, Querschnitt, Geometrie und Länge.',
);
check(workspace.includes('Standard-Zuordnung für neue Formteile'), 'Der Formteil-Picker erklärt die automatische Standard-Zuordnung.');
check(workspace.includes('im Formteil weiterhin änderbar'), 'Der Picker weist auf die weiterhin mögliche manuelle Änderung hin.');
check(workspace.includes('getDefaultFormPartSection(system)'), 'Picker und Filter verwenden dieselbe sichere Standard-Zuordnung.');

const projectCommandsSource = fs.readFileSync(new URL('../src/app/ProjectCommands.js', import.meta.url), 'utf8');
check(projectCommandsSource.includes('this.getDefaultFormPartSection(system)'), 'Die Formteilerstellung verwendet die zentrale Standard-Zuordnung.');
const createFormPartBlock = projectCommandsSource.slice(projectCommandsSource.indexOf('createFormPart(type'), projectCommandsSource.indexOf('duplicateFormPart(', projectCommandsSource.indexOf('createFormPart(type')));
check(!createFormPartBlock.includes('this.state.selectedSection || system.sections?.[0]'), 'Der alte Rückfall auf Teilstrecke 1 ist aus der Formteilerstellung entfernt.');

console.log(`Phase 48.00 Teilstrecken-Workflow: ${checks} Prüfungen bestanden.`);
