import FormPartEngine from '../../src/formteile/FormPartEngine.js';
import { createDefaultFormPartRegistry } from '../../src/formteile/FormPartRegistry.js';

const out = document.getElementById('out');
const lines = [];

function log(text = '') {
  lines.push(text);
  if (out) out.textContent = lines.join('\n');
  console.log(text);
}

function assertClose(name, actual, expected, tolerance = 0.0001) {
  const ok = Math.abs(actual - expected) <= tolerance;
  log(`${ok ? '✔' : '✖'} ${name}: ${actual} | erwartet: ${expected}`);

  if (!ok) {
    throw new Error(`${name} fehlgeschlagen: ${actual} statt ${expected}`);
  }
}

function assertEqual(name, actual, expected) {
  const ok = actual === expected;
  log(`${ok ? '✔' : '✖'} ${name}: ${actual} | erwartet: ${expected}`);

  if (!ok) {
    throw new Error(`${name} fehlgeschlagen`);
  }
}

function run() {
  log('Starte FormPartEngine Referenztest...');
  log('');

  const registry = createDefaultFormPartRegistry();
  const engine = new FormPartEngine();

  const kreisBogen = registry.calculate('kreis_bogen', {
    R: 110,
    d: 125,
    alpha: 90
  });

  engine.addFormPart({
    ...kreisBogen,
    sectionId: 'ts1'
  });

  engine.addFormPart({
    name: 'Manueller Übergang',
    sectionId: 'ts1',
    zeta: 0.275
  });

  const kreisBogenTs3 = registry.calculate('kreis_bogen', {
    R: 110,
    d: 50,
    alpha: 90
  });

  engine.addFormPart({
    ...kreisBogenTs3,
    sectionId: 'ts3'
  });

  assertClose('Σζ TS1', engine.sumZetaBySection('ts1'), 0.485);
  assertClose('Σζ TS3', engine.sumZetaBySection('ts3'), 0.15);

  assertEqual('Formteile TS1 Anzahl', engine.getBySection('ts1').length, 2);
  assertEqual('Formteile TS3 Anzahl', engine.getBySection('ts3').length, 1);

  log('');
  log('Gruppierung:');
  log(JSON.stringify(engine.getGroupedBySection(), null, 2));

  log('');
  log('Zusammenfassung:');
  log(JSON.stringify(engine.getSummary(), null, 2));

  log('');
  log('✅ FORM PART ENGINE TEST BESTANDEN');
}

try {
  run();
} catch (error) {
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(error?.stack || error?.message || String(error));
}