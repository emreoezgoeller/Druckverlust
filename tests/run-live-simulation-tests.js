import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import LiveSimulationEngine from '../src/simulation/LiveSimulationEngine.js';

const project = createDemoProject();
const system = project.systems[0];
const original = JSON.stringify(project);

const neutral = LiveSimulationEngine.create(project, system.id, {
  scope: 'all',
  airflowPercent: 100,
  dimensionPercent: 100,
});
assert.equal(neutral.affectedCount, system.sections.length, 'Alle Teilstrecken werden im Anlagenvergleich erfasst.');
assert.ok(Math.abs(neutral.delta.totalLoss) < 1e-9, '100/100-Variante verändert den Gesamtdruckverlust nicht.');
assert.equal(JSON.stringify(project), original, 'Die Vorschau verändert das Originalprojekt nicht.');

const moreAir = LiveSimulationEngine.create(project, system.id, {
  scope: 'all',
  airflowPercent: 120,
  dimensionPercent: 100,
});
assert.ok(moreAir.scenario.totalLoss > moreAir.baseline.totalLoss, 'Mehr Luftmenge erhöht den Druckverlust.');
assert.ok(moreAir.scenario.maxVelocity > moreAir.baseline.maxVelocity, 'Mehr Luftmenge erhöht die Geschwindigkeit.');
assert.equal(JSON.stringify(project), original, 'Auch eine veränderte Variante bleibt nicht-destruktiv.');

const largerDuct = LiveSimulationEngine.create(project, system.id, {
  scope: 'all',
  airflowPercent: 100,
  dimensionPercent: 125,
});
assert.ok(largerDuct.scenario.totalLoss < largerDuct.baseline.totalLoss, 'Grössere Abmessungen reduzieren den Druckverlust.');
assert.ok(largerDuct.scenario.maxVelocity < largerDuct.baseline.maxVelocity, 'Grössere Abmessungen reduzieren die Geschwindigkeit.');

const selectedId = system.sections[0].id;
const selected = LiveSimulationEngine.create(project, system.id, {
  scope: 'selected',
  sectionId: selectedId,
  airflowPercent: 110,
  dimensionPercent: 110,
});
assert.deepEqual(selected.affectedSectionIds, [selectedId], 'Auswahlmodus verändert exakt eine Teilstrecke.');
const untouched = selected.rows.filter(row => row.id !== selectedId);
assert.ok(untouched.every(row => Math.abs(row.delta.pressureLoss) < 1e-9), 'Nicht ausgewählte Teilstrecken bleiben unverändert.');

const appliedProject = createDemoProject();
const appliedSystem = appliedProject.systems[0];
const beforeQ = Number(appliedSystem.sections[0].q);
const beforeB = Number(appliedSystem.sections[0].b || 0);
const applied = LiveSimulationEngine.applyToProject(appliedProject, appliedSystem.id, {
  scope: 'selected',
  sectionId: appliedSystem.sections[0].id,
  airflowPercent: 110,
  dimensionPercent: 120,
});
assert.equal(applied.affectedCount, 1, 'Übernahme meldet eine veränderte Teilstrecke.');
assert.equal(Number(appliedSystem.sections[0].q), Math.round(beforeQ * 1.1 * 10) / 10, 'Luftmenge wird korrekt übernommen.');
if (beforeB > 0) assert.equal(Number(appliedSystem.sections[0].b), Math.round(beforeB * 1.2 * 1000) / 1000, 'Kanalbreite wird korrekt übernommen.');

console.log(`Live-Simulation: ${neutral.rows.length} Teilstrecken, nicht-destruktive Vorschau und Übernahme geprüft.`);
