import ReportEngine from '../src/report/ReportEngine.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';

const output = document.getElementById('output');

function createFixtureProject() {
  return {
    id: 'project-report-test',
    name: 'Sprint 17 Testprojekt',
    systems: [
      {
        id: 'system-1',
        name: 'Zuluftanlage Test',
        sections: [
          {
            id: 'section-1',
            name: 'ts1',
            type: 'duct',
            q: 900,
            l: 10,
            b: 0.5,
            h: 0.3,
          },
        ],
        formParts: [
          {
            id: 'formpart-1',
            name: 'Kreisförmiger Bogen / Krümmer',
            type: 'kreis_bogen',
            sectionId: 'section-1',
            R: 110,
            d: 125,
            alpha: 90,
          },
        ],
        specialComponents: [
          {
            id: 'special-1',
            name: 'Filter',
            type: 'Filter',
            pressureLoss: 35,
          },
        ],
      },
    ],
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const project = createFixtureProject();
  project.calculationResult = ProjectCalculationService.calculate(project);

  const model = ReportEngine.createReportModel(project, { system: project.systems[0] });
  const html = ReportEngine.createStandaloneHtml(model);

  assert(model.project.name === 'Sprint 17 Testprojekt', 'Projektname fehlt im Modell.');
  assert(model.system.name === 'Zuluftanlage Test', 'Anlagenname fehlt im Modell.');
  assert(model.sections.length === 1, 'Teilstrecke fehlt im Berichtmodell.');
  assert(model.formParts.length === 1, 'Formteil fehlt im Berichtmodell.');
  assert(model.specialComponents.length === 1, 'Sonderbauteil fehlt im Berichtmodell.');
  assert(Number.isFinite(model.totals.total), 'Gesamttotal ist nicht numerisch.');
  assert(html.includes('Druckverlustbericht'), 'HTML enthält keinen Berichttitel.');
  assert(html.includes('Sprint 17 Testprojekt'), 'HTML enthält keinen Projektnamen.');

  output.innerHTML = '<p class="ok">✅ Sprint 17 Report Test bestanden.</p><pre>' +
    JSON.stringify({ total: model.totals.total, sections: model.sections.length, formParts: model.formParts.length }, null, 2) +
    '</pre>';
} catch (error) {
  output.innerHTML = '<p class="fail">❌ Sprint 17 Report Test fehlgeschlagen.</p><pre>' + error.stack + '</pre>';
  throw error;
}
