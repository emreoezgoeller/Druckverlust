import FormPartEngine from '../../src/formteile/FormPartEngine.js';

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

function run() {
  log('Starte FormPartEngine Referenztest...');
  log('');

  const engine = new FormPartEngine();

  engine.addFormPart({
    name: 'Kreisförmiger Bogen / Krümmer',
    sectionId: 'ts1',
    zeta: 0.239
  });

  engine.addFormPart({
    name: 'Übergang gross auf klein',
    sectionId: 'ts1',
    zeta: 0.275
  });

  engine.addFormPart({
    name: 'Kreisförmiger Bogen / Krümmer',
    sectionId: 'ts3',
    zeta: 0.239
  });

  assertClose('Σζ TS1', engine.sumZetaBySection('ts1'), 0.514);
  assertClose('Σζ TS3', engine.sumZetaBySection('ts3'), 0.239);

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