import { formatComparisonMatrixReport, runComparisonMatrix } from '../src/testing/ComparisonMatrixRunner.js';

const report = runComparisonMatrix();
console.log(formatComparisonMatrixReport(report));

if (report.status !== 'ok') {
  process.exitCode = 1;
}
