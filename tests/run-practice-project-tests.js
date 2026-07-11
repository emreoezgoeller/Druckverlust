import { runPracticeProjectValidation } from '../src/testing/PracticeProjectRunner.js';

const report = runPracticeProjectValidation();

console.log(`\n${report.label}`);
console.log(report.summary);
console.log(`Teilstrecken: ${report.counts.sections}`);
console.log(`Formteile: ${report.counts.formParts}`);
console.log(`Sonderbauteile: ${report.counts.specialComponents}`);
console.log(`Berichtseiten: ${report.counts.reportPages}`);
console.log(`Prüfungen: ${report.counts.passed}/${report.counts.checks} bestanden\n`);

report.checks.forEach(check => {
  console.log(`${check.passed ? '✓' : '✗'} ${check.label}: ${check.actual} (Soll ${check.expected})`);
});

if (report.status !== 'ok') {
  process.exitCode = 1;
}
