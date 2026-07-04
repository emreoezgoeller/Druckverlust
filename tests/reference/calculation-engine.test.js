import {
  calcDuctArea,
  calcHydraulicDiameter,
  calcPipeArea,
  calculateProject,
  round
} from '../../src/core/CalculationEngine.js';

const out = document.getElementById('out');
const lines = [];

function log(text = '') {
  lines.push(text);
  if (out) out.textContent = lines.join('\n');
  console.log(text);
}

function fail(error) {
  const msg = error?.stack || error?.message || String(error);
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(msg);
}

function assertClose(name, actual, expected, tolerance = 0.0001) {
  const ok = Math.abs(actual - expected) <= tolerance;
  log(`${ok ? '✔' : '✖'} ${name}: ${round(actual, 6)} | erwartet: ${expected}`);

  if (!ok) {
    throw new Error(`${name} fehlgeschlagen: ${actual} statt ${expected}`);
  }
}

async function run() {
  log('Starte CalculationEngine Referenztest...');
  log('');

  assertClose('Kanalfläche 450×450', calcDuctArea(0.45, 0.45), 0.2025);
  assertClose('Hydraulischer Durchmesser 450×450', calcHydraulicDiameter(0.45, 0.45), 0.45);
  assertClose('Rohrfläche Ø500', calcPipeArea(0.5), Math.PI * 0.25 / 4);

  log('');
  log('Lade TEST-001.json...');

  const response = await fetch('./TEST-001.json');

  if (!response.ok) {
    throw new Error(`TEST-001.json konnte nicht geladen werden. Status: ${response.status}`);
  }

  const fixture = await response.json();

  const project = {
    settings: fixture.settings,
    sections: fixture.sections,
    formParts: fixture.formParts || []
  };

  const result = calculateProject(project);

  const expected = fixture.expected.referenceTotalPaApprox;
  const tolerance = fixture.expected.tolerancePa ?? 0.5;

  log('');
  log(`TEST-001 Ergebnis exakt: ${round(result.totals.total, 3)} Pa`);
log(`TEST-001 Ergebnis Excel-Rundung: ${round(result.totals.totalRounded, 3)} Pa`);
  log(`Excel-Referenz: ca. ${expected} Pa`);
  log(`Toleranz: ±${tolerance} Pa`);

  if (Math.abs(result.totals.totalRounded - expected) <= tolerance) {
    log('');
    log('✅ TEST-001 BESTANDEN');
  } else {
    log('');
    log('⚠ TEST-001 AUSSERHALB DER TOLERANZ');
  }

  log('');
  log('Detailwerte:');

  result.results.forEach(item => {
    log(
      `${item.id}: ` +
      `v=${round(item.result.velocity, 3)} m/s | ` +
      `Pdyn=${round(item.result.dynamicPressure, 3)} Pa | ` +
      `R×L=${round(item.result.frictionLoss, 3)} Pa | ` +
      `Z=${round(item.result.zetaLoss, 3)} Pa | ` +
      `Total=${round(item.result.totalLoss, 3)} Pa`
    );
  });
}

run().catch(fail);