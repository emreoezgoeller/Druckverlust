import { runFeedbackRoundTests } from './phase21-feedback-round.test.js';

const report = runFeedbackRoundTests();
console.log(`${report.label}: ${report.summary}`);
report.checks.filter(item => !item.passed).forEach(item => {
  console.error(`✗ ${item.label} – Ist: ${item.actual} / Soll: ${item.expected}`);
});
if (report.status !== 'ok') process.exitCode = 1;
