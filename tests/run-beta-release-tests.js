import { runBetaReleaseTests } from './phase21-beta-release.test.js';

const result = runBetaReleaseTests();
console.log(`Beta-Freigabestand-QS ${result.passed ? 'bestanden' : 'fehlgeschlagen'}: ${result.counts.passed} von ${result.counts.total} Einzelprüfungen bestanden.`);
if (!result.passed) {
  result.checks.filter(item => !item.passed).forEach(item => console.error(`✗ ${item.label}: ${item.error || 'Fehler'}`));
  process.exitCode = 1;
}
