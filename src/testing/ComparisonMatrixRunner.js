// Druckverlust Pro – fachliche Vergleichsmatrix Phase 21.04
// DOM-unabhängig; im Browser und mit Node.js ausführbar.

import { calculateProject, calculateSection } from '../core/CalculationEngine.js';
import { COMPARISON_MATRIX_CASES } from './comparisonMatrixCases.js';

function getPath(source, path = '') {
  return String(path || '').split('.').filter(Boolean).reduce((value, key) => value?.[key], source);
}

function formatValue(value, digits = 8) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value);
    return Number(value.toPrecision(digits)).toString();
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
}

function executeCase(testCase = {}) {
  if (testCase.kind === 'section') {
    return calculateSection(testCase.input?.section || {}, testCase.input?.options || {});
  }
  if (testCase.kind === 'project') {
    return calculateProject(testCase.input || {});
  }
  throw new Error(`Unbekannter Vergleichsfall-Typ: ${testCase.kind || '-'}`);
}

function compare(actualRoot, expectation = {}) {
  const actual = getPath(actualRoot, expectation.path);
  const expected = expectation.expected;
  const exact = expectation.exact === true || typeof expected !== 'number';
  const tolerance = Number(expectation.tolerance ?? 0);
  let difference = null;
  let passed = false;

  if (exact) {
    passed = Object.is(actual, expected);
  } else if (Number.isFinite(Number(actual)) && Number.isFinite(Number(expected))) {
    difference = Number(actual) - Number(expected);
    passed = Math.abs(difference) <= tolerance;
  }

  return {
    label: expectation.label || expectation.path || 'Prüfung',
    path: expectation.path || '',
    unit: expectation.unit || '',
    expected,
    actual,
    exact,
    tolerance,
    difference,
    passed,
    expectedText: formatValue(expected),
    actualText: formatValue(actual),
  };
}

export function runComparisonMatrixCase(testCase = {}) {
  const startedAt = Date.now();
  try {
    const actualRoot = executeCase(testCase);
    const checks = (testCase.expectations || []).map(expectation => compare(actualRoot, expectation));
    const failedChecks = checks.filter(check => !check.passed);

    return {
      id: testCase.id || 'UNKNOWN',
      group: testCase.group || 'Allgemein',
      title: testCase.title || testCase.id || 'Vergleichsfall',
      kind: testCase.kind || '',
      source: testCase.source || '',
      matrix: testCase.matrix || {},
      passed: checks.length > 0 && failedChecks.length === 0,
      checkCount: checks.length,
      passedCheckCount: checks.length - failedChecks.length,
      failedCheckCount: failedChecks.length,
      checks,
      actualRoot,
      error: null,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      id: testCase.id || 'UNKNOWN',
      group: testCase.group || 'Allgemein',
      title: testCase.title || testCase.id || 'Vergleichsfall',
      kind: testCase.kind || '',
      source: testCase.source || '',
      matrix: testCase.matrix || {},
      passed: false,
      checkCount: 0,
      passedCheckCount: 0,
      failedCheckCount: 1,
      checks: [],
      actualRoot: null,
      error: error?.stack || error?.message || String(error),
      durationMs: Date.now() - startedAt,
    };
  }
}

export function runComparisonMatrix(cases = COMPARISON_MATRIX_CASES) {
  const startedAt = new Date();
  const results = (cases || []).map(runComparisonMatrixCase);
  const checks = results.flatMap(result => result.checks || []);
  const passedCases = results.filter(result => result.passed).length;
  const failedCases = results.length - passedCases;
  const passedChecks = checks.filter(check => check.passed).length;
  const failedChecks = checks.length - passedChecks + results.filter(result => result.error).length;
  const groups = [...new Set(results.map(result => result.group))];

  return {
    status: failedCases ? 'error' : 'ok',
    label: failedCases ? 'Vergleichsmatrix mit Abweichungen' : 'Vergleichsmatrix vollständig bestanden',
    summary: failedCases
      ? `${failedCases} von ${results.length} Handrechnungen weichen von den festen Sollwerten ab.`
      : `${results.length} Handrechnungen mit ${checks.length} Einzelprüfungen stimmen mit dem Rechenkern überein.`,
    scope: 'Feste Handrechnungen für Geometrie, Geschwindigkeit, dynamischen Druck, Reibung, ζ-Verlust, Summenbildung und Rundung.',
    limitation: 'Die Matrix ist eine fachliche Regressions- und Plausibilitätsprüfung, jedoch keine externe Normenzertifizierung.',
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    counts: {
      cases: results.length,
      passedCases,
      failedCases,
      checks: checks.length,
      passedChecks,
      failedChecks,
      groups: groups.length,
    },
    groups,
    results,
  };
}

export function formatComparisonMatrixReport(report = {}) {
  const lines = [
    'Druckverlust Pro – Fachliche Vergleichsmatrix Phase 21.04',
    report.label || '-',
    report.summary || '',
    '',
    `Fälle: ${report.counts?.passedCases ?? 0}/${report.counts?.cases ?? 0} bestanden`,
    `Einzelprüfungen: ${report.counts?.passedChecks ?? 0}/${report.counts?.checks ?? 0} bestanden`,
    `Gruppen: ${report.counts?.groups ?? 0}`,
    '',
    report.scope || '',
    report.limitation || '',
    '',
  ];

  (report.results || []).forEach(result => {
    lines.push(`${result.passed ? 'OK' : 'FEHLER'} ${result.id} – ${result.title}`);
    lines.push(`  Gruppe: ${result.group}`);
    lines.push(`  Referenz: ${result.source || '-'}`);
    if (result.error) lines.push(`  Fehler: ${result.error}`);
    (result.checks || []).forEach(check => {
      const unit = check.unit ? ` ${check.unit}` : '';
      const tolerance = check.exact ? ' exakt' : ` ± ${check.tolerance}`;
      lines.push(`  ${check.passed ? '✓' : '✗'} ${check.label}: Ist ${check.actualText}${unit} / Soll ${check.expectedText}${unit}${tolerance}`);
    });
    lines.push('');
  });

  return lines.join('\n').trim();
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[;"\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createComparisonMatrixCsv(report = {}) {
  const rows = [[
    'Status', 'ID', 'Gruppe', 'Fall', 'Geometrie', 'Luftmenge m3/h', 'Länge m', 'Zeta',
    'Rho kg/m3', 'Lambda', 'Prüfung', 'Ist', 'Soll', 'Einheit', 'Toleranz',
  ]];

  (report.results || []).forEach(result => {
    (result.checks || []).forEach(check => {
      rows.push([
        check.passed ? 'OK' : 'FEHLER',
        result.id,
        result.group,
        result.title,
        result.matrix?.geometry ?? '',
        result.matrix?.q ?? '',
        result.matrix?.length ?? '',
        result.matrix?.zeta ?? '',
        result.matrix?.rho ?? '',
        result.matrix?.lambda ?? '',
        check.label,
        check.actualText,
        check.expectedText,
        check.unit || '',
        check.exact ? 'exakt' : check.tolerance,
      ]);
    });
  });

  return rows.map(row => row.map(csvEscape).join(';')).join('\n');
}

export default runComparisonMatrix;
