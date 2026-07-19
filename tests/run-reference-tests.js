import { formatReferenceTestReport, runReferenceTests } from '../src/testing/ReferenceTestRunner.js';

const report = runReferenceTests();
console.log(formatReferenceTestReport(report));

if (report.status !== 'ok') {
  process.exitCode = 1;
}
