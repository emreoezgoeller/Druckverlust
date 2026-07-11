import { runReferenceTests } from '../src/testing/ReferenceTestRunner.js';

const report = runReferenceTests();
const summary = document.getElementById('summary');
const tbody = document.querySelector('#results tbody');
const details = document.getElementById('details');

summary.className = report.status === 'ok' ? 'ok' : 'error';
summary.textContent = report.summary;

tbody.innerHTML = report.results.map(result => `
  <tr class="${result.passed ? 'ok-row' : 'error-row'}">
    <td>${result.passed ? '✓' : '✗'}</td>
    <td><strong>${result.id}</strong></td>
    <td>${result.group}</td>
    <td>${result.title}</td>
    <td>${result.passedCheckCount}/${result.checkCount}</td>
    <td>${result.referenceType === 'external' ? 'Extern' : 'Formel'}</td>
  </tr>
`).join('');

details.innerHTML = report.results.map(result => `
  <article>
    <h2>${result.passed ? '✓' : '✗'} ${result.id} – ${result.title}</h2>
    <p><strong>Quelle:</strong> ${result.source}</p>
    ${result.error ? `<pre>${result.error}</pre>` : ''}
    <ul>
      ${(result.checks || []).map(check => `
        <li class="${check.passed ? 'ok' : 'error'}">
          ${check.passed ? '✓' : '✗'} ${check.label}: Ist ${check.actualText}${check.unit ? ` ${check.unit}` : ''} / Soll ${check.expectedText}${check.unit ? ` ${check.unit}` : ''}
        </li>
      `).join('')}
    </ul>
  </article>
`).join('');

if (report.status !== 'ok') {
  throw new Error(report.summary);
}
