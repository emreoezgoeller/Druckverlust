import ProjectCalculationService from '../../src/project/ProjectCalculationService.js';
import { createDefaultFormPartRegistry } from '../../src/formteile/FormPartRegistry.js';

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

  const response = await fetch('./TEST-001.json');
  if (!response.ok) throw new Error(`TEST-001.json konnte nicht geladen werden. Status: ${response.status}`);

  const fixture = await response.json();

  const registry = createDefaultFormPartRegistry();

  const kreisBogen = registry.calculate('kreis_bogen', {
    R: 110,
    d: 125,
    alpha: 90
  });

  const project = {
    settings: fixture.settings,
    systems: [{
      id: 'anlage-1',
      name: 'TEST-001',
      sections: fixture.sections,
      formParts: [
        {
          ...kreisBogen,
          sectionId: 'ts1'
        }
      ],
      specialComponents: fixture.specialComponents || [],
    }],
  };

  const serviceResult = ProjectCalculationService.calculate(project);

  assertEqual('Service liefert Projekt', Boolean(serviceResult.project), true);
  assertEqual('Service liefert Anlage', Boolean(serviceResult.system), true);
  assertEqual('Service liefert Validation', Boolean(serviceResult.validation), true);
  assertEqual('Service liefert Calculation', Boolean(serviceResult.calculation), true);

  assertClose(
    'Kreisbogen ζ in TS1 übernommen',
    serviceResult.calculation.results[0].zetaFromParts,
    0.21,
    0.001
  );

  log('');
  log(`Gesamt exakt: ${serviceResult.calculation.totals.total.toFixed(3)} Pa`);
  log(`Gesamt Excel-Rundung: ${serviceResult.calculation.totals.totalRounded.toFixed(3)} Pa`);

  log('');
  log('✅ PROJECT CALCULATION SERVICE TEST BESTANDEN');
}

run().catch(error => {
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(error?.stack || error?.message || String(error));
});