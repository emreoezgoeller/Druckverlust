import assert from 'node:assert/strict';
import { runComparisonMatrix } from '../src/testing/ComparisonMatrixRunner.js';

const report = runComparisonMatrix();
assert.equal(report.status, 'ok', report.summary);
assert.equal(report.counts.cases, 10);
assert.equal(report.counts.passedCases, 10);
assert.equal(report.counts.failedChecks, 0);
assert.equal(report.counts.checks, 92);
