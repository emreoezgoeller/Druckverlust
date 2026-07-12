import { runReleaseDecisionTests } from './phase21-release-decision.test.js';

const report = runReleaseDecisionTests();
console.log(`Freigabeentscheidungs-QS ${report.passed ? 'bestanden' : 'fehlgeschlagen'}: ${report.counts.passed} von ${report.counts.total} Einzelprüfungen bestanden.`);
report.checks.filter(item => !item.passed).forEach(item => console.error(`✗ ${item.label}: ${item.error}`));
if (!report.passed) process.exitCode = 1;
