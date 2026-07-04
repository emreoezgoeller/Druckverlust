import {
  calcDuctArea,
  calcHydraulicDiameter,
  calcPipeArea,
  calculateProject,
  round
} from '../../src/core/CalculationEngine.js';

const out = document.getElementById('out');
const lines = [];
function log(text){ lines.push(text); if(out) out.textContent = lines.join('\n'); console.log(text); }
function assertClose(name, actual, expected, tolerance = 0.0001) {
  const ok = Math.abs(actual - expected) <= tolerance;
  log(`${ok ? '✔' : '✖'} ${name}: ${round(actual, 6)} | erwartet: ${expected}`);
  if (!ok) throw new Error(`${name} fehlgeschlagen`);
}

assertClose('Kanalfläche 450×450', calcDuctArea(0.45, 0.45), 0.2025);
assertClose('Hydraulischer Durchmesser 450×450', calcHydraulicDiameter(0.45, 0.45), 0.45);
assertClose('Rohrfläche Ø500', calcPipeArea(0.5), Math.PI * 0.25 / 4);

const response = await fetch('./TEST-001.json');
const fixture = await response.json();
const project = {
  settings: fixture.settings,
  sections: fixture.sections,
  formParts: []
};
const result = calculateProject(project);
const expected = fixture.expected.referenceTotalPaApprox;
const tolerance = fixture.expected.tolerancePa;

log('');
log(`TEST-001 Total: ${round(result.totals.total, 3)} Pa | Excel-Referenz ca. ${expected} Pa`);
if (Math.abs(result.totals.total - expected) <= tolerance) {
  log('✔ TEST-001 innerhalb der aktuellen Toleranz.');
} else {
  log('⚠ TEST-001 ausserhalb der Toleranz. Bitte Zeta-/Excelwerte genauer validieren.');
}

log('');
log('Detailwerte:');
result.results.forEach(item => {
  log(`${item.id}: v=${round(item.result.velocity, 3)} m/s | Pdyn=${round(item.result.dynamicPressure, 3)} Pa | R×L=${round(item.result.frictionLoss, 3)} Pa | Z=${round(item.result.zetaLoss, 3)} Pa | Total=${round(item.result.totalLoss, 3)} Pa`);
});
