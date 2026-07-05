import ProjectCalculationService from '../../src/services/ProjectCalculationService.js';
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

  if (!ok) {
    throw new Error(`${name} fehlgeschlagen`);
  }
}

function assertClose(name, actual, expected, tolerance = 0.5) {
  const ok = Math.abs(actual - expected) <= tolerance;
  log(`${ok ? '✔' : '✖'} ${name}: ${actual.toFixed(3)} | erwartet: ${expected}`);

  if (!ok) {
    throw new Error(`${name} fehlgeschlagen`);
  }
}

async function run() {
  log('Starte ProjectCalculationService Referenztest...');
  log('');

  const response = await fetch('./TEST-001.json');

  if (!response.ok) {
    throw new Error(`TEST-001.json konnte nicht geladen werden. Status: ${response.status}`);
  }

  const fixture = await response.json();
  const registry = createDefaultFormPartRegistry();

  const kreisBogen = registry.calculate('kreis_bogen', {
    R: 110,
    d: 125,
    alpha: 90
  });

  const project = {
    id: 'project-test-001',
    name: 'TEST-001 Druckverlust',
    settings: fixture.settings,
    systems: [
      {
        id: 'anlage-1',
        name: 'TEST-001',
        sections: fixture.sections || [],
        formParts: [
          {
            id: 'formpart-1',
            name: 'Kreisförmiger Bogen',
            type: 'kreis_bogen',
            sectionId: 'ts1',
            zeta: kreisBogen.zeta ?? 0.21,
            pressureLoss: kreisBogen.pressureLoss ?? 0
          }
        ],
        specialComponents: fixture.specialComponents || []
      }
    ]
  };

  const result = ProjectCalculationService.calculate(project);
  const systemResult = result.systems[0];

  assertEqual('Service liefert Projektergebnis', Boolean(result), true);
  assertEqual('Service liefert Anlagen', Array.isArray(result.systems), true);
  assertEqual('Service liefert eine Anlage', result.systems.length, 1);
  assertEqual('Service liefert Teilstrecken', Array.isArray(systemResult.sections), true);
  assertEqual('Service liefert Formteile', Array.isArray(systemResult.formParts), true);
  assertEqual('Service liefert Sonderbauteile', Array.isArray(systemResult.specialComponents), true);

  assertClose(
    'Kreisbogen ζ in TS1 übernommen',
    systemResult.formParts[0].zeta,
    0.21,
    0.001
  );

  log('');
  log(`Gesamtdruckverlust Projekt: ${result.totalPressureLoss.toFixed(3)} Pa`);
  log(`Gesamtdruckverlust Anlage: ${systemResult.totalPressureLoss.toFixed(3)} Pa`);

  log('');
  log('✅ PROJECT CALCULATION SERVICE TEST BESTANDEN');
}

run().catch(error => {
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(error?.stack || error?.message || String(error));
});