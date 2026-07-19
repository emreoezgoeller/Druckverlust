// Druckverlust Pro – automatischer Referenztest-Runner
// DOM-unabhängig und sowohl im Browser als auch mit Node.js ausführbar.

import {
  calculateProject,
  calculateSection,
  normalizeType,
  roundUpToStep,
  toNumber,
} from '../core/CalculationEngine.js';
import ProjectCalculationService from '../project/ProjectCalculationService.js';
import { REFERENCE_CASES } from './referenceCases.js';

function getPath(source, path = '') {
  if (path === '' || path === null || path === undefined) return source;

  return String(path)
    .split('.')
    .reduce((value, key) => value?.[key], source);
}

function formatValue(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Number(value.toPrecision(12)).toString() : String(value);
  }

  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
}

function executeUtilityBatch(input = {}) {
  const rows = Array.isArray(input.rows) ? input.rows : [];

  if (input.operation === 'roundUpToStep') {
    return rows.map(row => roundUpToStep(row?.value, row?.step));
  }

  throw new Error(`Unbekannte Utility-Operation: ${input.operation || '-'}`);
}

function executeInputNormalization(input = {}) {
  return {
    numbers: (input.numbers || []).map(value => toNumber(value)),
    types: (input.sections || []).map(section => normalizeType(section)),
  };
}

export function executeReferenceCase(referenceCase = {}) {
  switch (referenceCase.kind) {
    case 'section':
      return calculateSection(referenceCase.input?.section || {}, referenceCase.input?.options || {});

    case 'project':
      return calculateProject(referenceCase.input || {});

    case 'serviceProject':
      return ProjectCalculationService.calculate(structuredCloneSafe(referenceCase.input?.project || {}));

    case 'utilityBatch':
      return executeUtilityBatch(referenceCase.input || {});

    case 'inputNormalization':
      return executeInputNormalization(referenceCase.input || {});

    default:
      throw new Error(`Unbekannter Referenzfall-Typ: ${referenceCase.kind || '-'}`);
  }
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function compareExpectation(actualRoot, expectation = {}) {
  const actual = getPath(actualRoot, expectation.path);
  const expected = expectation.expected;
  const exact = expectation.exact === true || typeof expected !== 'number';
  const tolerance = Number(expectation.tolerance ?? 0);

  let passed = false;
  let difference = null;

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
    tolerance,
    exact,
    difference,
    passed,
    expectedText: formatValue(expected),
    actualText: formatValue(actual),
  };
}

export function runReferenceCase(referenceCase = {}) {
  const startedAt = Date.now();

  try {
    const actualRoot = executeReferenceCase(referenceCase);
    const checks = (referenceCase.expectations || []).map(expectation => compareExpectation(actualRoot, expectation));
    const failedChecks = checks.filter(check => !check.passed);

    return {
      id: referenceCase.id || 'UNKNOWN',
      group: referenceCase.group || 'Allgemein',
      title: referenceCase.title || referenceCase.id || 'Referenzfall',
      kind: referenceCase.kind || '',
      referenceType: referenceCase.referenceType || 'formula',
      source: referenceCase.source || '',
      passed: failedChecks.length === 0 && checks.length > 0,
      checkCount: checks.length,
      passedCheckCount: checks.length - failedChecks.length,
      failedCheckCount: failedChecks.length,
      checks,
      error: null,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      id: referenceCase.id || 'UNKNOWN',
      group: referenceCase.group || 'Allgemein',
      title: referenceCase.title || referenceCase.id || 'Referenzfall',
      kind: referenceCase.kind || '',
      referenceType: referenceCase.referenceType || 'formula',
      source: referenceCase.source || '',
      passed: false,
      checkCount: 0,
      passedCheckCount: 0,
      failedCheckCount: 1,
      checks: [],
      error: error?.stack || error?.message || String(error),
      durationMs: Date.now() - startedAt,
    };
  }
}

export function runReferenceTests(cases = REFERENCE_CASES) {
  const startedAt = new Date();
  const results = (cases || []).map(runReferenceCase);
  const checks = results.flatMap(result => result.checks || []);
  const passedCases = results.filter(result => result.passed).length;
  const failedCases = results.length - passedCases;
  const passedChecks = checks.filter(check => check.passed).length;
  const failedChecks = checks.length - passedChecks + results.filter(result => result.error).length;
  const externalCases = results.filter(result => result.referenceType === 'external').length;

  return {
    status: failedCases ? 'error' : 'ok',
    label: failedCases ? 'Referenztests fehlgeschlagen' : 'Alle Referenztests bestanden',
    summary: failedCases
      ? `${failedCases} von ${results.length} Referenzfällen sind fehlgeschlagen.`
      : `${results.length} Referenzfälle mit ${checks.length} Einzelprüfungen wurden bestanden.`,
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
      externalCases,
      formulaCases: results.length - externalCases,
    },
    results,
  };
}

export function formatReferenceTestReport(report = {}) {
  const lines = [
    `Druckverlust Pro – Referenztests`,
    report.label || '-',
    report.summary || '',
    '',
    `Fälle: ${report.counts?.passedCases ?? 0}/${report.counts?.cases ?? 0} bestanden`,
    `Einzelprüfungen: ${report.counts?.passedChecks ?? 0}/${report.counts?.checks ?? 0} bestanden`,
    `Formelreferenzen: ${report.counts?.formulaCases ?? 0}`,
    `Externe Referenzen: ${report.counts?.externalCases ?? 0}`,
    '',
  ];

  (report.results || []).forEach(result => {
    lines.push(`${result.passed ? 'OK' : 'FEHLER'} ${result.id} – ${result.title}`);
    lines.push(`  Quelle: ${result.source || '-'}`);

    if (result.error) {
      lines.push(`  Fehler: ${result.error}`);
    }

    (result.checks || []).forEach(check => {
      const unit = check.unit ? ` ${check.unit}` : '';
      const tolerance = check.exact ? '' : ` ± ${check.tolerance}`;
      lines.push(
        `  ${check.passed ? '✓' : '✗'} ${check.label}: Ist ${check.actualText}${unit} / Soll ${check.expectedText}${unit}${tolerance}`,
      );
    });

    lines.push('');
  });

  return lines.join('\n').trim();
}

export default runReferenceTests;
