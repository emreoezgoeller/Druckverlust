/*
 * Manuelle Browser-Testdatei für CalculationEngine.
 * Später kann diese Datei mit Vitest/Jest automatisiert werden.
 */
import { calcDuctArea, calcHydraulicDiameter, calcPipeArea, calcProject } from '../../src/core/CalculationEngine.js';

function assertClose(name, actual, expected, tolerance = 0.0001) {
  const ok = Math.abs(actual - expected) <= tolerance;
  console.log(`${ok ? '✔' : '✖'} ${name}:`, actual, 'erwartet:', expected);
  if (!ok) throw new Error(`${name} fehlgeschlagen`);
}

assertClose('Kanalfläche 450x450', calcDuctArea(0.45, 0.45), 0.2025);
assertClose('Hydraulischer Durchmesser 450x450', calcHydraulicDiameter(0.45, 0.45), 0.45);
assertClose('Rohrfläche Ø500', calcPipeArea(0.5), Math.PI * 0.25 / 4);

const project = {
  settings: { rho: 1.21, lambda: 0.025 },
  sections: [
    { id:'ts1', type:'duct', q:900, b:0.45, h:0.45, l:1.25 },
    { id:'mb1', type:'special', pa:100 }
  ],
  formParts: []
};

console.log('TEST Projekt:', calcProject(project));
