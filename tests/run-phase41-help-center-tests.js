import assert from 'node:assert/strict';
import HelpCenterEngine from '../src/help/HelpCenterEngine.js';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const categories = HelpCenterEngine.getCategories();
const topics = HelpCenterEngine.getTopics();
const tour = HelpCenterEngine.getTourSteps();
const shortcuts = HelpCenterEngine.getShortcuts();

check(categories.some(item => item.id === 'all'), 'Alle-Themen-Kategorie vorhanden.');
check(categories.some(item => item.id === 'calculation'), 'Berechnungskategorie vorhanden.');
check(categories.some(item => item.id === 'output'), 'Ausgabekategorie vorhanden.');
check(topics.length >= 12, 'Mindestens zwölf aktuelle Hilfethemen vorhanden.');
check(new Set(topics.map(item => item.id)).size === topics.length, 'Hilfethemen besitzen eindeutige IDs.');
check(topics.every(item => item.title && item.summary && item.category), 'Hilfethemen sind vollständig beschrieben.');
check(topics.every(item => Array.isArray(item.steps) && item.steps.length >= 3), 'Jedes Hilfethema enthält einen Ablauf.');

const formPartMatches = HelpCenterEngine.search('Formteil Bibliothek');
check(formPartMatches[0]?.id === 'form-parts', 'Formteilsuche priorisiert die Formteilhilfe.');
check(HelpCenterEngine.search('ubergabe').some(item => item.id === 'handover'), 'Suche normalisiert Umlaute.');
check(HelpCenterEngine.search('pdf', 'output').every(item => item.category === 'output'), 'Kategoriefilter begrenzt Treffer.');
check(HelpCenterEngine.search('unauffindbarer begriff').length === 0, 'Nicht passende Suche bleibt leer.');

check(HelpCenterEngine.getContextTopicId('section') === 'sections', 'Teilstrecke erhält kontextbezogene Hilfe.');
check(HelpCenterEngine.getContextTopicId('formPartPicker') === 'form-parts', 'Formteilbibliothek erhält kontextbezogene Hilfe.');
check(HelpCenterEngine.getContextTopicId('networkSchematic') === 'schematic', 'Anlagenschema erhält kontextbezogene Hilfe.');
check(HelpCenterEngine.getContextTopicId('projectHandover') === 'handover', 'Übergabe erhält kontextbezogene Hilfe.');
check(HelpCenterEngine.getContextTopicId('unbekannt') === 'first-steps', 'Unbekannte Ansicht fällt auf Erste Schritte zurück.');

check(tour.length === 10, 'Geführter Ablauf enthält zehn Schritte.');
check(tour[0].number === 1 && tour.at(-1).number === 10, 'Tour ist vollständig nummeriert.');
check(tour.every(step => step.action && step.topicId), 'Jeder Tourschritt besitzt Ziel und Hilfethema.');
check(shortcuts.some(item => item.keys.includes('F1')), 'F1 ist in der Tastaturübersicht dokumentiert.');
check(shortcuts.some(item => item.keys.includes('Ctrl + S')), 'Speichern ist in der Tastaturübersicht dokumentiert.');

const storage = new MemoryStorage();
let progress = HelpCenterEngine.loadProgress(storage);
check(progress.completedStepIds.length === 0, 'Neuer Fortschritt beginnt leer.');
progress = HelpCenterEngine.setStepCompleted(progress, 'project', true, storage);
check(progress.completedStepIds.includes('project'), 'Tourschritt kann abgeschlossen werden.');
progress = HelpCenterEngine.setStepCompleted(progress, 'sections', true, storage);
check(HelpCenterEngine.summarizeProgress(progress).completed === 2, 'Fortschritt zählt abgeschlossene Schritte.');
check(HelpCenterEngine.summarizeProgress(progress).percent === 20, 'Fortschritt berechnet Prozentwert korrekt.');
progress = HelpCenterEngine.setStepCompleted(progress, 'project', false, storage);
check(!progress.completedStepIds.includes('project'), 'Tourschritt kann wieder geöffnet werden.');

storage.setItem(HelpCenterEngine.storageKey, JSON.stringify({ completedStepIds: ['sections', 'ungültig', 'sections'] }));
progress = HelpCenterEngine.loadProgress(storage);
check(progress.completedStepIds.length === 1 && progress.completedStepIds[0] === 'sections', 'Gespeicherter Fortschritt wird bereinigt.');
progress = HelpCenterEngine.resetProgress(storage);
check(progress.completedStepIds.length === 0, 'Fortschritt kann zurückgesetzt werden.');
check(storage.getItem(HelpCenterEngine.storageKey) === null, 'Zurücksetzen entfernt Browser-Eintrag.');

console.log(`Phase 41.00 Hilfe-Center-Engine: ${checks} Prüfungen bestanden.`);
