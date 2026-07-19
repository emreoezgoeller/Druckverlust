import assert from 'node:assert/strict';
import ExpertTestDiagnostics from '../src/diagnostics/ExpertTestDiagnostics.js';
import { APP_RELEASE } from '../src/core/appVersion.js';
import {
  EXPERT_TEST_CHECKS,
  createExpertTestCsv,
  createExpertTestDraft,
  createExpertTestFilename,
  formatExpertTestProtocol,
  summarizeExpertTestDraft,
  validateExpertTestDraft,
} from '../src/testing/ExpertTestProtocol.js';

const mockAutomated = {
  status: 'ok',
  label: 'Automatischer Vorabcheck bestanden',
  counts: { suites: 5, passedSuites: 5, failedSuites: 0, checks: 329, passedChecks: 329, failedChecks: 0 },
  suites: [{ passed: true, label: 'Mock-QS', summary: 'Bestanden' }],
};

const empty = createExpertTestDraft({
  createdAt: '2026-07-11T10:00:00.000Z',
  updatedAt: '2026-07-11T10:00:00.000Z',
  environment: { browser: 'Testbrowser', platform: 'Node', viewport: '1280 × 800px' },
});

assert.equal(empty.checks.length, EXPERT_TEST_CHECKS.length, 'Alle Fachtest-Prüfpunkte müssen im Entwurf vorhanden sein.');
assert.equal(summarizeExpertTestDraft(empty).notTested, EXPERT_TEST_CHECKS.length, 'Neue Prüfpunkte müssen ungeprüft sein.');
assert.equal(validateExpertTestDraft(empty).complete, false, 'Leeres Protokoll darf nicht vollständig sein.');

const completed = createExpertTestDraft({
  ...empty,
  tester: { name: 'Fachtester', company: 'Planungsbüro', role: 'Lüftungsplaner', email: 'test@example.invalid' },
  checks: empty.checks.map(item => ({ ...item, status: 'ok', note: 'Geprüft.' })),
  overall: {
    rating: 'Sehr gut',
    recommendation: 'release',
    strengths: 'Nachvollziehbare Berechnung',
    improvements: 'Keine blockierenden Punkte',
    notes: 'Test abgeschlossen',
  },
});

const summary = summarizeExpertTestDraft(completed);
assert.equal(summary.ok, EXPERT_TEST_CHECKS.length, 'Alle manuellen Prüfpunkte müssen als OK gezählt werden.');
assert.equal(summary.completionPercent, 100, 'Vollständiges Protokoll muss 100 % erreichen.');
assert.equal(validateExpertTestDraft(completed).complete, true, 'Vollständig ausgefülltes Protokoll muss komplett sein.');

const report = ExpertTestDiagnostics.create(completed, mockAutomated);
assert.equal(report.status, 'ready', 'Vollständiger Fachtest mit bestandenem Vorabcheck muss bereit sein.');
assert.match(formatExpertTestProtocol(completed, mockAutomated), /Fachtester-Protokoll/);
assert.match(formatExpertTestProtocol(completed, mockAutomated), /Automatischer Vorabcheck/);
assert.match(createExpertTestCsv(completed, mockAutomated), /Prüfpunkt/);
assert.equal(createExpertTestFilename(completed, 'txt'), `Druckverlust-Pro_${APP_RELEASE}_Fachtester_2026-07-11.txt`);

const blocked = createExpertTestDraft({
  ...completed,
  checks: completed.checks.map((item, index) => ({ ...item, status: index === 0 ? 'error' : 'ok' })),
  overall: { ...completed.overall, recommendation: 'blocked' },
});
assert.equal(ExpertTestDiagnostics.create(blocked, mockAutomated).status, 'blocked', 'Manueller Fehler muss Fachtest blockieren.');

console.log(`Druckverlust Pro – Fachtester-Protokoll ${APP_RELEASE}`);
console.log(`✓ ${EXPERT_TEST_CHECKS.length} strukturierte manuelle Prüfpunkte`);
console.log('✓ Fortschritt, Validierung, Text-, CSV- und Dateinamenausgabe');
console.log('✓ Freigabe- und Blockierstatus korrekt');
