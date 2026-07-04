import { calculateKreisBogen } from '../../src/formteile/calculators/kreisBogenCalculator.js';

const out = document.getElementById('out');
const lines = [];

function log(text = '') {
  lines.push(text);
  out.textContent = lines.join('\n');
}

function assertClose(name, actual, expected, tolerance = 0.001) {
  const ok = Math.abs(actual - expected) <= tolerance;
  log(`${ok ? '✔' : '✖'} ${name}: ${actual.toFixed(3)} | erwartet: ${expected}`);

  if (!ok) {
    throw new Error(`${name} fehlgeschlagen`);
  }
}

function run() {
  log('Starte Kreisbogen Referenztest...');
  log('');

  const result1 = calculateKreisBogen({
    R: 110,
    d: 125,
    alpha: 90,
  });

  assertClose('Excel-Beispiel R=110 d=125 α=90', result1.zeta, 0.21);

  const result2 = calculateKreisBogen({
    R: 110,
    d: 50,
    alpha: 90,
  });

  assertClose('Excel-Beispiel R=110 d=50 α=90', result2.zeta, 0.15);

  const result3 = calculateKreisBogen({
    R: 50,
    d: 100,
    alpha: 45,
  });

  assertClose('R/d=0.5 α=45', result3.zeta, 0.708);

  log('');
  log('Detail Beispiel 1:');
  log(JSON.stringify(result1, null, 2));

  log('');
  log('✅ KREISBOGEN TEST BESTANDEN');
}

try {
  run();
} catch (error) {
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(error?.stack || error?.message || String(error));
}