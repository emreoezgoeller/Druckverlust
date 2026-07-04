import ProjectEngine from '../../src/project/ProjectEngine.js';

const out = document.getElementById('out');
const lines = [];

function log(text = '') {
  lines.push(text);
  if (out) out.textContent = lines.join('\n');
  console.log(text);
}

function assertEqual(name, actual, expected) {
  const ok = actual === expected;
  log(`${ok ? '✔' : '✖'} ${name}: ${actual} | erwartet: ${expected}`);

  if (!ok) {
    throw new Error(`${name} fehlgeschlagen: ${actual} statt ${expected}`);
  }
}

function run() {
  log('Starte ProjectEngine Referenztest...');
  log('');

  const engine = new ProjectEngine();
  const system = engine.getSystem();

  assertEqual('Standardsystem vorhanden', Boolean(system), true);
  assertEqual('Start Teilstrecken', system.sections.length, 0);
  assertEqual('Start Formteile', system.formParts.length, 0);
  assertEqual('Start Sonderbauteile', system.specialComponents.length, 0);

  const ts1 = engine.addSection(null, {
    type: 'duct',
    ts: 'TS1',
    description: 'Rechteckkanal 450 × 450 mm',
    q: 900,
    b: 0.45,
    h: 0.45,
    l: 1.25,
  });

  const part1 = engine.addFormPart(null, {
    sectionId: ts1.id,
    name: 'Kreisförmiger Bogen / Krümmer',
    zeta: 0.239,
  });

  const special1 = engine.addSpecialComponent(null, {
    name: 'Monoblock',
    q: 900,
    pressureLoss: 100,
  });

  assertEqual('Nach Hinzufügen Teilstrecken', system.sections.length, 1);
  assertEqual('Nach Hinzufügen Formteile', system.formParts.length, 1);
  assertEqual('Nach Hinzufügen Sonderbauteile', system.specialComponents.length, 1);

  assertEqual('Formteil gehört zu TS1', system.formParts[0].sectionId, ts1.id);
  assertEqual('Sonderbauteil Druckverlust', system.specialComponents[0].pressureLoss, 100);

  engine.removeFormPart(null, part1.id);
  engine.removeSpecialComponent(null, special1.id);
  engine.removeSection(null, ts1.id);

  assertEqual('Nach Löschen Teilstrecken', system.sections.length, 0);
  assertEqual('Nach Löschen Formteile', system.formParts.length, 0);
  assertEqual('Nach Löschen Sonderbauteile', system.specialComponents.length, 0);

  log('');
  log('✅ PROJECT ENGINE TEST BESTANDEN');
}

try {
  run();
} catch (error) {
  log('');
  log('❌ TEST ABGEBROCHEN');
  log(error?.stack || error?.message || String(error));
}