import { createDefaultFormPartRegistry } from '../src/formteile/FormPartRegistry.js';

const out = document.getElementById('out');
const lines = [];

function log(text = '') {
  lines.push(text);
  if (out) out.textContent = lines.join('\n');
  console.log(text);
}

function assertTrue(name, condition, details = '') {
  const ok = Boolean(condition);
  log(`${ok ? '✔' : '✖'} ${name}${details ? ` – ${details}` : ''}`);
  if (!ok) throw new Error(`${name} fehlgeschlagen${details ? `: ${details}` : ''}`);
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function run() {
  log('Starte Formteilbibliothek Smoke-Test...');
  log('');

  const registry = createDefaultFormPartRegistry();
  const items = registry.all();

  assertTrue('Registry enthält Formteile', items.length > 0, `${items.length} gefunden`);

  const missingCalculators = items.filter(item => typeof item.calculate !== 'function');
  assertTrue('Alle Formteile besitzen einen Calculator', missingCalculators.length === 0,
    missingCalculators.length ? missingCalculators.map(item => item.id).join(', ') : `${items.length}/${items.length} aktiv`);

  const missingImages = items.filter(item => !item.image && !(item.imageFallbacks || []).length);
  assertTrue('Alle Formteile besitzen eine Bildreferenz', missingImages.length === 0,
    missingImages.length ? missingImages.map(item => item.id).join(', ') : `${items.length}/${items.length} mit Bildpfad`);

  log('');
  log('Berechnung mit Defaultwerten:');

  items.forEach(item => {
    const defaults = registry.getDefaultValues(item.id);
    const derived = typeof registry.deriveValues === 'function'
      ? registry.deriveValues(item.id, defaults)
      : defaults;
    const result = registry.calculate(item.id, derived);

    assertTrue(`${item.name} liefert ein Ergebnis`, Boolean(result));
    assertTrue(`${item.name} ζ-Wert ist numerisch`, isFiniteNumber(result.zeta), `ζ=${result.zeta}`);

    if (result?.calculation?.lossMode === 'direct') {
      assertTrue(`${item.name} Direktdruckverlust ist numerisch`,
        isFiniteNumber(result.calculation.pressureLossPa),
        `Δp=${result.calculation.pressureLossPa} Pa`);
    }
  });

  log('');
  log('✅ FORMTEILBIBLIOTHEK SMOKE-TEST BESTANDEN');
}

try {
  run();
} catch (error) {
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(error?.stack || error?.message || String(error));
}
