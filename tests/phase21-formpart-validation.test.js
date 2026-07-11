import { runFormPartValidation } from '../src/testing/FormPartValidationRunner.js';

const report = runFormPartValidation();

if (report.status !== 'ok') {
  console.error(JSON.stringify(report, null, 2));
  throw new Error(report.summary || 'Formteil-QS fehlgeschlagen.');
}

console.log(`Formteil-QS: ${report.counts.definitions} Formteile, ${report.counts.referenceCases} Referenzfälle, ${report.counts.referenceChecks} Einzelprüfungen bestanden.`);
