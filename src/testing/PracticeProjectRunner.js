// Druckverlust Pro – Praxisprojekt-Runner Phase 21.02
// Prüft Grossprojekt, Speicher-Roundtrip und mehrseitigen Bericht deterministisch.

import createPracticeProject from '../project/practiceProject.js';
import ProjectCalculationService from '../project/ProjectCalculationService.js';
import ReportEngine from '../report/ReportEngine.js';
import StorageEngine from '../storage/StorageEngine.js';

function makeCheck(id, label, passed, actual, expected, detail = '') {
  return {
    id,
    label,
    passed: Boolean(passed),
    actual,
    expected,
    detail,
  };
}

function countReportPages(html = '') {
  return (String(html).match(/<section class="report-page(?:\s|\")/g) || []).length;
}

function uniqueCount(items = []) {
  return new Set(items.filter(Boolean)).size;
}

function numberText(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : String(value ?? '-');
}

export function runPracticeProjectValidation() {
  const startedAt = new Date().toISOString();
  const project = createPracticeProject();
  const system = project.systems[0];
  const expected = project.practice.expected;

  const calculationResult = ProjectCalculationService.calculate(project, system.id);
  project.calculationResult = calculationResult;

  const registry = ProjectCalculationService.getFormPartRegistry();
  const reportModel = ReportEngine.createReportModel(project, { system, registry });
  const pagePlan = ReportEngine.createPagePlan(reportModel);
  const reportHtml = ReportEngine.renderReportBody(reportModel, {
    generatedLabel: 'Praxisprojekt Phase 21.02',
  });
  const renderedPages = countReportPages(reportHtml);
  const exportChecklist = ReportEngine.createExportChecklist(reportModel);

  const serialized = StorageEngine.serialize(project);
  const parsedProject = StorageEngine.parse(serialized, { fileName: 'Praxisprojekt_Phase_21_02.dvp' });
  const parsedSystem = parsedProject.systems?.[0] || {};

  const total = Number(calculationResult.calculation?.totals?.totalRounded ?? calculationResult.calculation?.totals?.total);
  const mainEntry = pagePlan.entries?.find(entry => entry.key === 'mainNetwork');
  const formPartEntry = pagePlan.entries?.find(entry => entry.key === 'assignedFormParts');
  const specialEntry = pagePlan.entries?.find(entry => entry.key === 'specialComponents');
  const orphanParts = system.formParts.filter(part => !part.sectionId || !system.sections.some(section => section.id === part.sectionId));

  const checks = [
    makeCheck('section-count', '48 Teilstrecken vorhanden', system.sections.length === expected.sections, system.sections.length, expected.sections),
    makeCheck('formpart-count', '36 Formteile vorhanden', system.formParts.length === expected.formParts, system.formParts.length, expected.formParts),
    makeCheck('special-count', '26 Sonderbauteile vorhanden', system.specialComponents.length === expected.specialComponents, system.specialComponents.length, expected.specialComponents),
    makeCheck('section-ids', 'Teilstrecken-IDs sind eindeutig', uniqueCount(system.sections.map(item => item.id)) === system.sections.length, uniqueCount(system.sections.map(item => item.id)), system.sections.length),
    makeCheck('formpart-ids', 'Formteil-IDs sind eindeutig', uniqueCount(system.formParts.map(item => item.id)) === system.formParts.length, uniqueCount(system.formParts.map(item => item.id)), system.formParts.length),
    makeCheck('special-ids', 'Sonderbauteil-IDs sind eindeutig', uniqueCount(system.specialComponents.map(item => item.id)) === system.specialComponents.length, uniqueCount(system.specialComponents.map(item => item.id)), system.specialComponents.length),
    makeCheck('formpart-links', 'Alle Formteile sind zugeordnet', orphanParts.length === 0, orphanParts.length, 0),
    makeCheck('calculation-errors', 'Berechnung ohne Fehler', (calculationResult.quality?.errorCount || 0) === 0, calculationResult.quality?.errorCount || 0, 0, calculationResult.quality?.errors?.join(' | ') || ''),
    makeCheck('calculation-total', 'Gesamtdruckverlust ist positiv', Number.isFinite(total) && total > 0, numberText(total), '> 0 Pa'),
    makeCheck('report-sections', 'Bericht enthält alle Teilstrecken', reportModel.counts.sections === expected.sections, reportModel.counts.sections, expected.sections),
    makeCheck('report-formparts', 'Bericht enthält alle Formteile', reportModel.counts.formParts === expected.formParts, reportModel.counts.formParts, expected.formParts),
    makeCheck('report-specials', 'Bericht enthält alle Sonderbauteile', reportModel.counts.specialComponents === expected.specialComponents, reportModel.counts.specialComponents, expected.specialComponents),
    makeCheck('main-pages', 'Teilstreckentabelle hat mehrere Seiten', Number(mainEntry?.pageCount || 0) >= 2, mainEntry?.pageCount || 0, '≥ 2'),
    makeCheck('formpart-pages', 'Formteile haben mehrere Berichtseiten', Number(formPartEntry?.pageCount || 0) >= 8, formPartEntry?.pageCount || 0, '≥ 8'),
    makeCheck('special-pages', 'Sonderbauteile haben mehrere Berichtseiten', Number(specialEntry?.pageCount || 0) >= 2, specialEntry?.pageCount || 0, '≥ 2'),
    makeCheck('report-page-count', 'Bericht erreicht den Grossprojektumfang', pagePlan.totalPages >= expected.minimumReportPages, pagePlan.totalPages, `≥ ${expected.minimumReportPages}`),
    makeCheck('rendered-pages', 'Gerenderte Seiten entsprechen dem Seitenplan', renderedPages === pagePlan.totalPages, renderedPages, pagePlan.totalPages),
    makeCheck('first-section-html', 'Erste Teilstrecke ist im Bericht', reportHtml.includes('TS-01'), reportHtml.includes('TS-01') ? 'vorhanden' : 'fehlt', 'vorhanden'),
    makeCheck('last-section-html', 'Letzte Teilstrecke ist im Bericht', reportHtml.includes('TS-48'), reportHtml.includes('TS-48') ? 'vorhanden' : 'fehlt', 'vorhanden'),
    makeCheck('last-page-footer', 'Letzte Seitenzahl ist im Bericht', reportHtml.includes(`Seite ${pagePlan.totalPages} / ${pagePlan.totalPages}`), reportHtml.includes(`Seite ${pagePlan.totalPages} / ${pagePlan.totalPages}`) ? 'vorhanden' : 'fehlt', 'vorhanden'),
    makeCheck('export-errors', 'Export-QS ohne blockierende Fehler', exportChecklist.errorCount === 0, exportChecklist.errorCount, 0),
    makeCheck('pdf-name', 'PDF-Dateiname wird erzeugt', exportChecklist.pdfFileName?.endsWith('.pdf'), exportChecklist.pdfFileName || '-', '*.pdf'),
    makeCheck('html-name', 'HTML-Dateiname wird erzeugt', exportChecklist.htmlFileName?.endsWith('.html'), exportChecklist.htmlFileName || '-', '*.html'),
    makeCheck('csv-name', 'CSV-Dateiname wird erzeugt', exportChecklist.csvFileName?.endsWith('.csv'), exportChecklist.csvFileName || '-', '*.csv'),
    makeCheck('storage-sections', 'Speicher-Roundtrip erhält Teilstrecken', parsedSystem.sections?.length === expected.sections, parsedSystem.sections?.length || 0, expected.sections),
    makeCheck('storage-formparts', 'Speicher-Roundtrip erhält Formteile', parsedSystem.formParts?.length === expected.formParts, parsedSystem.formParts?.length || 0, expected.formParts),
    makeCheck('storage-specials', 'Speicher-Roundtrip erhält Sonderbauteile', parsedSystem.specialComponents?.length === expected.specialComponents, parsedSystem.specialComponents?.length || 0, expected.specialComponents),
    makeCheck('storage-first-id', 'Speicher-Roundtrip erhält erste ID', parsedSystem.sections?.[0]?.id === system.sections[0].id, parsedSystem.sections?.[0]?.id || '-', system.sections[0].id),
    makeCheck('storage-last-id', 'Speicher-Roundtrip erhält letzte ID', parsedSystem.sections?.at?.(-1)?.id === system.sections.at(-1).id, parsedSystem.sections?.at?.(-1)?.id || '-', system.sections.at(-1).id),
  ];

  const failedChecks = checks.filter(check => !check.passed);
  const status = failedChecks.length ? 'error' : 'ok';

  return {
    id: 'PRACTICE-21-02',
    label: status === 'ok' ? 'Praxisprojekt bestanden' : 'Praxisprojekt fehlgeschlagen',
    status,
    summary: status === 'ok'
      ? `${checks.length} von ${checks.length} Prüfungen bestanden. Grossprojekt, Speicher-Roundtrip und ${pagePlan.totalPages}-seitiger Bericht sind konsistent.`
      : `${failedChecks.length} von ${checks.length} Prüfungen fehlgeschlagen.`,
    startedAt,
    finishedAt: new Date().toISOString(),
    counts: {
      checks: checks.length,
      passed: checks.length - failedChecks.length,
      failed: failedChecks.length,
      sections: system.sections.length,
      formParts: system.formParts.length,
      specialComponents: system.specialComponents.length,
      reportPages: pagePlan.totalPages,
      reportWarnings: exportChecklist.warningCount,
    },
    totals: {
      friction: calculationResult.calculation?.totals?.friction || 0,
      formParts: (calculationResult.calculation?.totals?.zetaLoss || 0) + (calculationResult.calculation?.totals?.directFormPartLoss || 0),
      special: calculationResult.calculation?.totals?.special || 0,
      total,
    },
    checks,
    failedChecks,
    project,
    reportModel,
    pagePlan,
    exportChecklist,
    storageBytes: serialized.length,
    reportHtmlLength: reportHtml.length,
  };
}

export default runPracticeProjectValidation;
