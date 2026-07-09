import ProjectCalculationService from '../src/project/ProjectCalculationService.js';

const out = document.getElementById('out');
const lines = [];

function log(text = '') {
  lines.push(text);
  if (out) out.textContent = lines.join('\n');
  console.log(text);
}

function assertEqual(name, actual, expected) {
  const ok = actual === expected;
  log(`${ok ? '✔' : '✖'} ${name}: ${actual} | erwartet: ${expected}`);
  if (!ok) throw new Error(`${name} fehlgeschlagen`);
}

function assertClose(name, actual, expected, tolerance = 0.5) {
  const ok = Math.abs(actual - expected) <= tolerance;
  log(`${ok ? '✔' : '✖'} ${name}: ${actual.toFixed(3)} | erwartet: ${expected}`);
  if (!ok) throw new Error(`${name} fehlgeschlagen`);
}

async function run() {
  log('Starte ProjectCalculationService Referenztest...');
  log('');

  const response = await fetch('./reference/TEST-001.json');
  if (!response.ok) throw new Error(`TEST-001.json konnte nicht geladen werden. Status: ${response.status}`);

  const fixture = await response.json();

  const project = {
    settings: fixture.settings,
    sections: fixture.sections,
    formParts: fixture.formParts || [],
    systems: [{
      id: 'anlage-1',
      name: 'TEST-001',
      sections: fixture.sections,
      formParts: fixture.formParts || [],
      specialComponents: fixture.specialComponents || [],
    }],
  };

  const serviceResult = ProjectCalculationService.calculate(project);

  assertEqual('Service liefert Projekt', Boolean(serviceResult.project), true);
  assertEqual('Service liefert Validation', Boolean(serviceResult.validation), true);
  assertEqual('Service liefert Calculation', Boolean(serviceResult.calculation), true);

  const expected = fixture.expected.referenceTotalPaApprox;
  const actual = serviceResult.calculation.totals.totalRounded;

  assertClose('TEST-001 Gesamt gerundet', actual, expected, fixture.expected.tolerancePa ?? 0.5);

  log('');
  log('Validation:');
  log(`Warnings: ${serviceResult.validation.warnings.length}`);
  log(`Errors: ${serviceResult.validation.errors.length}`);

  log('');
  log('✅ PROJECT CALCULATION SERVICE TEST BESTANDEN');
}

run().catch(error => {
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(error?.stack || error?.message || String(error));
});