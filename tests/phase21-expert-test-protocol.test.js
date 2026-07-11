import ExpertTestDiagnostics from '../src/diagnostics/ExpertTestDiagnostics.js';
import { createExpertTestDraft, validateExpertTestDraft } from '../src/testing/ExpertTestProtocol.js';

const draft = createExpertTestDraft({
  tester: { name: 'Browser-Fachtest', role: 'Lüftungsplanung' },
  checks: Array.from({ length: 10 }, (_, index) => ({
    id: [
      'project-start', 'rectangular-section', 'round-section', 'formpart-selection', 'formpart-sync',
      'special-component', 'project-roundtrip', 'report-pdf', 'plausibility', 'usability',
    ][index],
    status: 'ok',
    note: 'Browserprüfung bestanden.',
  })),
  overall: { rating: 'Gut', recommendation: 'release', strengths: 'Strukturiert' },
});

const automated = {
  status: 'ok',
  label: 'Automatischer Vorabcheck bestanden',
  counts: { suites: 5, passedSuites: 5, checks: 329, passedChecks: 329 },
  suites: [],
};
const validation = validateExpertTestDraft(draft);
const report = ExpertTestDiagnostics.create(draft, automated);

if (!validation.complete || report.status !== 'ready') {
  throw new Error('Fachtester-Protokoll wurde nicht als vollständig erkannt.');
}

document.getElementById('summary').textContent = `${draft.checks.length} von ${draft.checks.length} Prüfpunkten bestanden · Export und Freigabelogik OK`;
document.getElementById('rows').innerHTML = draft.checks.map((item, index) => `
  <tr><td>${index + 1}</td><td>${item.area}</td><td>${item.title}</td><td>✓ OK</td></tr>
`).join('');
