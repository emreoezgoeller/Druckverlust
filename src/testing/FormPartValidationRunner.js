// Druckverlust Pro – Formteilbibliothek- und Excel-Referenztest-Runner
// DOM-unabhängig; im Browser und mit Node.js ausführbar.

import { defaultFormParts } from '../formteile/FormPartRegistry.js?v=58.20';
import { FORM_PART_REFERENCE_CASES } from './formPartReferenceCases.js';

function getPath(source, path = '') {
  if (!path) return source;
  return String(path).split('.').reduce((value, key) => value?.[key], source);
}

function formatValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toPrecision(12)).toString() : String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
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
    expected,
    actual,
    expectedText: formatValue(expected),
    actualText: formatValue(actual),
    tolerance,
    exact,
    difference,
    passed,
  };
}

export function runFormPartReferenceCase(referenceCase = {}) {
  const startedAt = Date.now();

  try {
    const actualRoot = referenceCase.calculate?.(structuredCloneSafe(referenceCase.input || {}));
    if (!actualRoot) throw new Error('Berechnungsfunktion lieferte kein Ergebnis.');

    const checks = (referenceCase.expectations || []).map(expectation => compareExpectation(actualRoot, expectation));
    const failedChecks = checks.filter(check => !check.passed);

    return {
      id: referenceCase.id || 'UNKNOWN',
      partId: referenceCase.partId || '',
      title: referenceCase.title || referenceCase.id || 'Formteil-Referenzfall',
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
      partId: referenceCase.partId || '',
      title: referenceCase.title || referenceCase.id || 'Formteil-Referenzfall',
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

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function createStructureCheck(part, label, passed, detail = '') {
  return { partId: part?.id || '-', label, passed: Boolean(passed), detail };
}

function auditDefinition(part = {}) {
  const parameters = Array.isArray(part.parameters) ? part.parameters : [];
  const lockedSelects = parameters.filter(parameter => parameter?.type === 'select' && ['alpha', 'beta', 'curve', 'bedingung', 'bezug', 'kanalkante'].includes(parameter.id));

  return [
    createStructureCheck(part, 'ID und Name', Boolean(part.id && part.name), `${part.id || '-'} · ${part.name || '-'}`),
    createStructureCheck(part, 'Kategorie', Boolean(part.category), part.category || '-'),
    createStructureCheck(part, 'Berechnungsfunktion', typeof part.calculate === 'function'),
    createStructureCheck(part, 'Parameterdefinition', parameters.length > 0, `${parameters.length} Felder`),
    createStructureCheck(part, 'Bildpfad', String(part.image || '').startsWith('assets/formteile/'), part.image || '-'),
    createStructureCheck(part, 'Excel-Referenzpfad', String(part.referenceFile || '').startsWith('assets/formteile/'), part.referenceFile || '-'),
    ...lockedSelects.map(parameter => createStructureCheck(
      part,
      `Auswahlfeld ${parameter.id}`,
      parameter.locked === true && Array.isArray(parameter.options) && parameter.options.length > 0,
      `${parameter.options?.length || 0} Optionen · ${parameter.locked === true ? 'gesperrt' : 'freie Eingabe'}`,
    )),
  ];
}

export function runFormPartValidation({ definitions = defaultFormParts, cases = FORM_PART_REFERENCE_CASES } = {}) {
  const startedAt = new Date();
  const definitionIds = definitions.map(item => item.id);
  const duplicateIds = definitionIds.filter((id, index) => definitionIds.indexOf(id) !== index);
  const structureChecks = definitions.flatMap(auditDefinition);
  structureChecks.push({
    partId: 'Bibliothek',
    label: 'Eindeutige Formteil-IDs',
    passed: duplicateIds.length === 0,
    detail: duplicateIds.length ? duplicateIds.join(', ') : `${definitionIds.length} eindeutige IDs`,
  });

  const referenceResults = cases.map(runFormPartReferenceCase);
  const referenceChecks = referenceResults.flatMap(result => result.checks || []);
  const coveredPartIds = new Set(cases.map(item => item.partId));
  const uncovered = definitions.filter(item => !coveredPartIds.has(item.id)).map(item => item.id);
  const failedStructure = structureChecks.filter(check => !check.passed);
  const failedReferences = referenceResults.filter(result => !result.passed);
  const passedReferenceChecks = referenceChecks.filter(check => check.passed).length;
  const status = failedStructure.length || failedReferences.length || uncovered.length ? 'error' : 'ok';

  return {
    status,
    label: status === 'ok' ? 'Formteilbibliothek bestanden' : 'Formteilbibliothek mit Fehlern',
    summary: status === 'ok'
      ? `${definitions.length} Formteile sind strukturell vollständig; ${referenceResults.length} Excel-Referenzpunkte wurden bestanden.`
      : `${failedStructure.length} Strukturfehler, ${failedReferences.length} fehlgeschlagene Referenzfälle und ${uncovered.length} Formteile ohne Referenzfall.`,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    counts: {
      definitions: definitions.length,
      coveredDefinitions: definitions.length - uncovered.length,
      uncoveredDefinitions: uncovered.length,
      structureChecks: structureChecks.length,
      passedStructureChecks: structureChecks.length - failedStructure.length,
      failedStructureChecks: failedStructure.length,
      referenceCases: referenceResults.length,
      passedReferenceCases: referenceResults.length - failedReferences.length,
      failedReferenceCases: failedReferences.length,
      referenceChecks: referenceChecks.length,
      passedReferenceChecks,
      failedReferenceChecks: referenceChecks.length - passedReferenceChecks + referenceResults.filter(result => result.error).length,
    },
    uncovered,
    structureChecks,
    referenceResults,
  };
}

export function formatFormPartValidationReport(report = {}) {
  const lines = [
    'Druckverlust Pro – Formteil-QS',
    report.label || '-',
    report.summary || '',
    '',
    `Bibliothek: ${report.counts?.coveredDefinitions ?? 0}/${report.counts?.definitions ?? 0} Formteile abgedeckt`,
    `Struktur: ${report.counts?.passedStructureChecks ?? 0}/${report.counts?.structureChecks ?? 0} Prüfungen bestanden`,
    `Excel-Referenzfälle: ${report.counts?.passedReferenceCases ?? 0}/${report.counts?.referenceCases ?? 0} bestanden`,
    `Referenz-Einzelprüfungen: ${report.counts?.passedReferenceChecks ?? 0}/${report.counts?.referenceChecks ?? 0} bestanden`,
    '',
  ];

  (report.referenceResults || []).forEach(result => {
    lines.push(`${result.passed ? 'OK' : 'FEHLER'} ${result.id} – ${result.title}`);
    lines.push(`  Formteil: ${result.partId}`);
    lines.push(`  Excel: ${result.source || '-'}`);
    if (result.error) lines.push(`  Fehler: ${result.error}`);
    (result.checks || []).forEach(check => {
      const tolerance = check.exact ? 'exakt' : `± ${check.tolerance}`;
      lines.push(`  ${check.passed ? '✓' : '✗'} ${check.label}: Ist ${check.actualText} / Soll ${check.expectedText} (${tolerance})`);
    });
    lines.push('');
  });

  const failedStructure = (report.structureChecks || []).filter(check => !check.passed);
  if (failedStructure.length) {
    lines.push('Strukturfehler:');
    failedStructure.forEach(check => lines.push(`  ✗ ${check.partId} · ${check.label}: ${check.detail || '-'}`));
  }

  return lines.join('\n').trim();
}

export default runFormPartValidation;
