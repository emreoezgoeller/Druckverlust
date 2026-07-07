import { createDefaultFormPartRegistry } from '../src/formteile/FormPartRegistry.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import StorageEngine from '../src/storage/StorageEngine.js';

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

function assertClose(name, actual, expected, tolerance = 0.05) {
  const a = Number(actual);
  const ok = Number.isFinite(a) && Math.abs(a - expected) <= tolerance;
  log(`${ok ? '✔' : '✖'} ${name}: ${Number.isFinite(a) ? a.toFixed(3) : actual} | erwartet: ${expected}`);
  if (!ok) throw new Error(`${name} fehlgeschlagen`);
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function createReferenceProject() {
  return {
    id: 'sprint16-final-reference',
    name: 'Sprint 16 Referenzprojekt',
    settings: {
      rho: 1.21,
      lambda: 0.025,
      sectionRoundingStep: 0.5,
    },
    systems: [
      {
        id: 'anlage-1',
        name: 'Referenzanlage',
        sections: [
          {
            id: 'ts1',
            name: 'ts1',
            type: 'duct',
            q: 900,
            l: 10,
            b: 0.5,
            h: 0.3,
            zetaSum: 0,
          },
        ],
        formParts: [
          {
            id: 'fp-kreisbogen',
            name: 'Kreis-Bogen Test',
            type: 'kreis_bogen',
            sectionId: 'ts1',
            R: 110,
            d: 125,
            alpha: 90,
          },
          {
            id: 'fp-hosenstueck',
            name: 'Hosenstück Test',
            type: 'hosenstueck',
            sectionId: 'ts1',
            bauform: 'Kanal',
            alpha: 45,
            A_breite: 500,
            A_hoehe: 300,
            W: 900,
            AA_breite: 300,
            AA_hoehe: 200,
            WA: 450,
          },
        ],
        specialComponents: [
          {
            id: 'filter-1',
            name: 'Filter Test',
            pressureLoss: 30,
          },
        ],
      },
    ],
  };
}

function runRegistryChecks() {
  const registry = createDefaultFormPartRegistry();
  const items = registry.all();

  assertTrue('Formteilbibliothek enthält 14 Formteile', items.length === 14, `${items.length} gefunden`);

  const missingCalculators = items.filter(item => typeof item.calculate !== 'function');
  assertTrue('Alle Formteile besitzen einen Calculator', missingCalculators.length === 0,
    missingCalculators.length ? missingCalculators.map(item => item.id).join(', ') : '14/14 aktiv');

  const missingImages = items.filter(item => !item.image && !(item.imageFallbacks || []).length);
  assertTrue('Alle Formteile besitzen eine Bildreferenz', missingImages.length === 0,
    missingImages.length ? missingImages.map(item => item.id).join(', ') : '14/14 mit Bildpfad');

  items.forEach(item => {
    const defaults = registry.getDefaultValues(item.id);
    const derived = registry.deriveValues(item.id, defaults);
    const result = registry.calculate(item.id, derived);

    assertTrue(`${item.id} liefert numerischen ζ-Wert`, isFiniteNumber(result.zeta), `ζ=${result.zeta}`);

    if (result?.calculation?.lossMode === 'direct') {
      assertTrue(`${item.id} liefert numerischen Direktdruckverlust`,
        isFiniteNumber(result.calculation.pressureLossPa),
        `Δp=${result.calculation.pressureLossPa} Pa`);
    }
  });
}

function runProjectChecks() {
  const project = createReferenceProject();
  const result = ProjectCalculationService.calculate(project);
  project.calculationResult = result;

  assertTrue('ProjectCalculationService liefert Validation', Boolean(result.validation));
  assertTrue('ProjectCalculationService liefert Quality', Boolean(result.quality));
  assertTrue('QS-Status ist OK', result.quality.status === 'ok', result.quality.status);

  const totals = result.calculation.totals;
  assertClose('Gesamttotal gerundet', totals.totalRounded, 32.5, 0.05);
  assertClose('Berechnungsprüfung Differenz', totals.audit.difference, 0, 0.001);
  assertTrue('Berechnungsprüfung OK', totals.audit.ok === true);

  assertTrue('Sonderbauteil wird in Total eingerechnet', totals.special === 30, `${totals.special} Pa`);
  assertTrue('Direktverlust Formteile wird ausgewiesen', isFiniteNumber(totals.directFormPartLoss), `${totals.directFormPartLoss} Pa`);

  const serialized = StorageEngine.serialize(project);
  assertTrue('Projekt lässt sich trotz calculationResult speichern', serialized.includes('DruckverlustPro'));
  assertTrue('Serialisierung enthält keine zyklische Struktur', serialized.length > 1000, `${serialized.length} Zeichen`);
}

try {
  log('Starte Sprint 16 Abschluss-Test...');
  log('');
  runRegistryChecks();
  log('');
  runProjectChecks();
  log('');
  log('✅ SPRINT 16 ABSCHLUSS-TEST BESTANDEN');
} catch (error) {
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(error?.stack || error?.message || String(error));
}
