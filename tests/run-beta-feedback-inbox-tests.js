import assert from 'node:assert/strict';
import {
  BETA_FEEDBACK_INBOX_KIND,
  createBetaFeedbackInbox,
  createBetaFeedbackInboxCsv,
  createBetaFeedbackInboxItem,
  createBetaFeedbackIssueText,
  deserializeBetaFeedbackInbox,
  filterBetaFeedbackInbox,
  parseBetaFeedbackInboxJson,
  removeBetaFeedbackInboxItem,
  serializeBetaFeedbackInbox,
  updateBetaFeedbackInboxItem,
} from '../src/testing/BetaFeedbackInbox.js';
import { createBetaFeedbackDraft, createBetaFeedbackJson } from '../src/testing/BetaFeedbackReport.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

const blocker = createBetaFeedbackDraft({
  id: 'beta-blocker-1',
  reporter: { name: 'Tester A', company: 'Planung AG' },
  issue: {
    category: 'calculation',
    severity: 'blocker',
    title: 'Gesamtdruckverlust falsch',
    description: 'Die Summe stimmt nach dem Öffnen nicht.',
    steps: 'Projekt öffnen und Bericht prüfen.',
    actual: '125 Pa',
    expected: '118 Pa',
    projectContext: 'Projekt A, Anlage 1',
  },
});

const idea = createBetaFeedbackDraft({
  id: 'beta-idea-1',
  reporter: { name: 'Tester B' },
  issue: {
    category: 'idea',
    severity: 'suggestion',
    title: 'Favoriten für Sonderbauteile',
    description: 'Sonderbauteile sollten als Favorit speicherbar sein.',
    steps: 'Bibliothek öffnen.',
    actual: 'Keine Favoriten.',
    expected: 'Favoriten verfügbar.',
  },
});

const duplicate = createBetaFeedbackDraft({
  id: 'beta-blocker-2',
  reporter: { name: 'Tester C' },
  issue: {
    category: 'calculation',
    severity: 'high',
    title: 'Gesamtdruckverlust falsch',
    description: 'Die Summe stimmt nach dem Öffnen nicht.',
    steps: 'Projekt öffnen und Bericht prüfen.',
    actual: '125 Pa',
    expected: '118 Pa',
    projectContext: 'Projekt B, Anlage 2',
  },
});

const inbox = createBetaFeedbackInbox([
  createBetaFeedbackInboxItem({ draft: idea }, 'idee.json'),
  createBetaFeedbackInboxItem({ draft: blocker }, 'blocker.json'),
  createBetaFeedbackInboxItem({ draft: duplicate }, 'duplicate.json'),
]);

check(inbox.kind === BETA_FEEDBACK_INBOX_KIND, 'Inbox-Kind muss gesetzt sein.');
check(inbox.counts.total === 3, 'Drei Rückmeldungen müssen enthalten sein.');
check(inbox.counts.open === 3, 'Neue Rückmeldungen müssen offen sein.');
check(inbox.counts.blocker === 1, 'Ein Blocker muss erkannt werden.');
check(inbox.status === 'blocked', 'Offener Blocker muss Inbox blockieren.');
check(inbox.entries[0].id === 'beta-blocker-1', 'Blocker muss zuerst sortiert werden.');
check(inbox.counts.duplicateCandidates === 2, 'Zwei Duplikat-Kandidaten müssen erkannt werden.');

const updatedEntries = updateBetaFeedbackInboxItem(inbox.entries, 'beta-blocker-1', {
  status: 'in_progress',
  assignee: 'Emre',
  targetVersion: '21.12',
  note: 'Rechenkern prüfen',
});
const updated = updatedEntries.find(item => item.id === 'beta-blocker-1');
check(updated.triage.status === 'in_progress', 'Status muss aktualisiert werden.');
check(updated.triage.assignee === 'Emre', 'Verantwortlicher muss aktualisiert werden.');
check(updated.triage.targetVersion === '21.12', 'Zielversion muss aktualisiert werden.');

const fixedEntries = updateBetaFeedbackInboxItem(updatedEntries, 'beta-blocker-1', { status: 'fixed' });
const fixedInbox = createBetaFeedbackInbox(fixedEntries);
check(fixedInbox.counts.open === 2, 'Behobene Rückmeldung darf nicht offen bleiben.');
check(fixedInbox.status === 'attention', 'Offene hohe Rückmeldung muss Aufmerksamkeit auslösen.');

const openFiltered = filterBetaFeedbackInbox(fixedInbox, { status: 'open' });
check(openFiltered.length === 2, 'Offen-Filter muss zwei Einträge liefern.');
const ideaFiltered = filterBetaFeedbackInbox(fixedInbox, { category: 'idea', status: 'all' });
check(ideaFiltered.length === 1 && ideaFiltered[0].id === 'beta-idea-1', 'Kategorie-Filter muss funktionieren.');
const searchFiltered = filterBetaFeedbackInbox(fixedInbox, { search: 'Favoriten', status: 'all' });
check(searchFiltered.length === 1, 'Suchfilter muss funktionieren.');

const serialized = serializeBetaFeedbackInbox(fixedInbox.entries);
const parsedSerialized = JSON.parse(serialized);
check(parsedSerialized.kind === BETA_FEEDBACK_INBOX_KIND, 'Export muss Inbox-Kind enthalten.');
const restored = deserializeBetaFeedbackInbox(serialized);
check(restored.length === 3, 'Speicher-Roundtrip muss alle Einträge erhalten.');
check(restored.find(item => item.id === 'beta-blocker-1').triage.status === 'fixed', 'Triage muss im Roundtrip erhalten bleiben.');

const importedSingle = parseBetaFeedbackInboxJson(createBetaFeedbackJson(idea), 'single.json');
check(importedSingle.length === 1, 'Einzelnes Feedback muss importierbar sein.');
check(importedSingle[0].draft.issue.title.includes('Favoriten'), 'Einzelimport muss Titel erhalten.');
const importedInbox = parseBetaFeedbackInboxJson(serialized, 'inbox.json');
check(importedInbox.length === 3, 'Inbox-Export muss wieder importierbar sein.');

const csv = createBetaFeedbackInboxCsv(fixedInbox);
check(csv.includes('Zielversion'), 'CSV muss Triage-Spalten enthalten.');
check(csv.includes('Gesamtdruckverlust falsch'), 'CSV muss Rückmeldung enthalten.');
const issueText = createBetaFeedbackIssueText(updated);
check(issueText.includes('## Gesamtdruckverlust falsch'), 'Issue-Text muss Titel enthalten.');
check(issueText.includes('Verantwortlich: Emre'), 'Issue-Text muss Verantwortlichen enthalten.');

const removed = removeBetaFeedbackInboxItem(fixedInbox.entries, 'beta-idea-1');
check(removed.length === 2, 'Eintrag muss entfernt werden können.');

const duplicateIdInbox = createBetaFeedbackInbox([
  createBetaFeedbackInboxItem({ draft: blocker, triage: { status: 'confirmed' } }, 'alt.json'),
  createBetaFeedbackInboxItem({ draft: { ...blocker, updatedAt: '2099-01-01T00:00:00.000Z' }, triage: { assignee: 'Emre' } }, 'neu.json'),
]);
check(duplicateIdInbox.counts.total === 1, 'Gleiche Meldungs-ID darf nur einmal vorkommen.');
check(duplicateIdInbox.entries[0].triage.assignee === 'Emre', 'Neuere Triage-Daten müssen übernommen werden.');
check(duplicateIdInbox.entries[0].triage.status === 'confirmed', 'Bestehender bearbeiteter Status darf nicht verloren gehen.');

console.log(`Phase 21.11 Beta-Feedback-Auswertung: ${checks}/${checks} Prüfungen bestanden.`);
