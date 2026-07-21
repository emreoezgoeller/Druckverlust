#!/usr/bin/env node

import { runOfficePracticeTestValidation } from '../src/testing/OfficePracticeTestRunner.js';

const report = runOfficePracticeTestValidation();

console.log(`\n${report.label}`);
console.log(report.summary);
console.log(`Projekte: ${report.totals.projects}`);
console.log(`Anlagen: ${report.totals.systems}`);
console.log(`Teilstrecken: ${report.totals.sections}`);
console.log(`Formteile: ${report.totals.formParts}`);
console.log(`Sonderbauteile: ${report.totals.specialComponents}`);
console.log(`Geplante Berichtseiten: ${report.totals.reportPages}`);
console.log(`Prüfungen: ${report.totals.passed}/${report.totals.checks} bestanden\n`);

report.scenarios.forEach(scenario => {
  console.log(`${scenario.label}`);
  console.log(`  ${scenario.counts.systems} Anlage(n), ${scenario.counts.sections} TS, ${scenario.counts.formParts} Formteile, ${scenario.counts.specialComponents} Sonderbauteile, ${scenario.counts.reportPages} Berichtseiten`);
  console.log(`  Rechnen ${scenario.timings.calculationMs.toFixed(1)} ms · Bericht ${scenario.timings.reportMs.toFixed(1)} ms · Datei ${scenario.timings.storageMs.toFixed(1)} ms`);
});

if (report.failedChecks.length) {
  console.error('\nFehlgeschlagene Prüfungen:');
  report.failedChecks.forEach(check => console.error(`- ${check.label}: ${check.actual} (Soll ${check.expected})`));
  process.exitCode = 1;
}
