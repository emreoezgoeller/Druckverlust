import assert from 'node:assert/strict';
import EngineeringQualityEngine from '../src/quality/EngineeringQualityEngine.js';

const project = { systems: [{ id: 's1', name: 'Zuluft', sections: [], formParts: [], specialComponents: [] }] };
const system = project.systems[0];
const calculation = {
  results: [
    { id: 'ts1', input: { id: 'ts1', name: 'TS 1', q: 3000, l: 10 }, result: { velocity: 11.2, frictionRate: 3.4, totalLoss: 120 } },
    { id: 'ts2', input: { id: 'ts2', name: 'TS 2', q: 1000, l: 5 }, result: { velocity: 3.2, frictionRate: 0.8, totalLoss: 20 } },
  ],
  totals: { total: 140 },
};
system.sections = calculation.results.map(item => item.input);
const result = EngineeringQualityEngine.analyze(project, system, calculation);
assert.equal(result.status, 'critical');
assert.ok(result.score < 100);
assert.ok(result.findings.some(item => item.code === 'VELOCITY_CRITICAL'));
assert.ok(result.findings.some(item => item.code === 'FRICTION_CRITICAL'));
assert.ok(result.findings.some(item => item.code === 'LOSS_CONCENTRATION'));
assert.equal(result.analyzedSectionCount, 2);

const clean = EngineeringQualityEngine.analyze(
  { systems: [{ sections: [{ id: 'a', name: 'A', q: 1000, l: 10 }], formParts: [], specialComponents: [] }] },
  null,
  { results: [{ id: 'a', input: { id: 'a', name: 'A', q: 1000, l: 10 }, result: { velocity: 3, frictionRate: .7, totalLoss: 10 } }], totals: { total: 10 } },
);
assert.equal(clean.status, 'ok');
assert.equal(clean.score, 100);
console.log('EngineeringQualityEngine: 9 Prüfungen bestanden.');
