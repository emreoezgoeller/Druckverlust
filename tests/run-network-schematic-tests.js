import assert from 'node:assert/strict';
import NetworkSchematicEngine from '../src/schematic/NetworkSchematicEngine.js';

let checks = 0;
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const system = {
  sections: [
    { id: 'a', name: 'TS A', type: 'duct', b: 0.5, h: 0.3, q: 1200 },
    { id: 'b', name: 'TS B', type: 'pipe', d: 0.315, q: 700 },
    { id: 'c', name: 'TS C', type: 'duct', b: 300, h: 200, q: 400 },
  ],
  formParts: [
    { id: 'f1', name: 'Kanalbogen 90°', type: 'eckiger_bogen', sectionId: 'b', zeta: 0.42 },
    { id: 'f2', name: 'Übergang', type: 'uebergang_gross_klein', sectionId: 'c' },
  ],
  specialComponents: [
    { id: 'x1', name: 'Filter', componentType: 'filter', sectionId: 'a', pressureLoss: 45 },
    { id: 'x2', name: 'Schalldämpfer', componentType: 'schalldaempfer', sectionId: 'b', pa: 18 },
  ],
};

const calc = {
  results: system.sections.map((input, index) => ({
    id: input.id,
    input,
    result: {
      velocity: index + 2,
      totalLoss: index * 10 + 4.6,
      roundedTotalLoss: index * 10 + 5,
    },
  })),
  totals: { total: 43.8, totalRounded: 44 },
};

const schema = NetworkSchematicEngine.create(system, calc);

equal(schema.nodes.length, 3, 'Drei Teilstrecken');
equal(schema.edges.length, 2, 'Zwei kompatible Kanten');
equal(schema.transitions.length, 2, 'Zwei Übergänge');
equal(schema.attachments.length, 4, 'Vier Bauteile');
equal(schema.nodes[0].dimension, '500 × 300 mm', 'Meterwerte werden als Millimeter formatiert');
equal(schema.nodes[1].dimension, 'Ø 315 mm', 'Rundrohr wird korrekt formatiert');
equal(schema.nodes[2].dimension, '300 × 200 mm', 'Importierte Millimeter bleiben erhalten');
equal(schema.nodes[0].type, 'duct', 'Rechtecktyp erkannt');
equal(schema.nodes[1].type, 'round', 'Rundtyp erkannt');
ok(schema.nodes[1].x > schema.nodes[0].x, 'Reihenfolge ist linear');
ok(schema.nodes[0].ductHeight > schema.nodes[1].ductHeight, 'Grössere Dimension wird optisch höher');
ok(schema.transitions[0].changesGeometry, 'Formwechsel wird als Übergang markiert');
equal(schema.summary.totalLoss, 44, 'Gerundeter Gesamtverlust übernommen');
equal(schema.summary.inletAirflow, 1200, 'Einlassluftmenge');
equal(schema.summary.outletAirflow, 400, 'Auslassluftmenge');
equal(schema.summary.maxVelocity, 4, 'Maximale Geschwindigkeit');
equal(schema.summary.sectionCount, 3, 'Teilstreckenzähler');
equal(schema.summary.formPartCount, 2, 'Formteilzähler');
equal(schema.summary.specialCount, 2, 'Sonderbauteilzähler');
equal(schema.attachments.find(item => item.id === 'f1')?.icon, 'bend', 'Bogentyp erhält Bogensymbol');
equal(schema.attachments.find(item => item.id === 'f2')?.icon, 'transition', 'Übergang erhält Übergangssymbol');
equal(schema.attachments.find(item => item.id === 'x1')?.icon, 'filter', 'Filter erhält Filtersymbol');
equal(schema.attachments.find(item => item.id === 'x2')?.icon, 'silencer', 'Schalldämpfer erhält Symbol');
equal(schema.attachments.find(item => item.id === 'x1')?.pressureLoss, 45, 'Bauteildruckverlust übernommen');
equal(schema.attachments.find(item => item.id === 'f1')?.zeta, 0.42, 'Zeta übernommen');
ok(schema.start?.x < schema.nodes[0].x, 'Einlass liegt vor der ersten Teilstrecke');
ok(schema.end?.arrowX > schema.nodes.at(-1).x, 'Auslass liegt hinter der letzten Teilstrecke');
ok(schema.width >= 1080, 'Mindestbreite für professionelle Ansicht');
equal(schema.height, 590, 'Definierte Zeichenhöhe');
equal(schema.isLinearSchematic, true, 'Lineares Schema');
equal(schema.isProfessionalSchematic, true, 'Professional-Schema-Kennung');

const manySections = Array.from({ length: 48 }, (_, index) => ({
  id: `long-${index + 1}`,
  name: `TS ${index + 1}`,
  type: index % 3 === 0 ? 'pipe' : 'duct',
  d: index % 3 === 0 ? 0.4 : 0,
  b: index % 3 === 0 ? 0 : 0.6,
  h: index % 3 === 0 ? 0 : 0.35,
  q: 3000 - index * 40,
}));
const longSchema = NetworkSchematicEngine.create({ sections: manySections }, null);
equal(longSchema.nodes.length, 48, 'Grossprojekt enthält alle Teilstrecken');
equal(longSchema.transitions.length, 47, 'Grossprojekt enthält alle Übergänge');
ok(longSchema.width > 12000, 'Grossprojekt erhält ausreichend Zeichenbreite');
ok(longSchema.nodes.every(node => Number.isFinite(node.cardX) && Number.isFinite(node.cardY)), 'Alle Kartenpositionen sind gültig');
ok(longSchema.nodes.every(node => node.ductHeight >= 48 && node.ductHeight <= 94), 'Alle Kanalhöhen bleiben im Darstellungsbereich');

const empty = NetworkSchematicEngine.create({}, null);
equal(empty.nodes.length, 0, 'Leeres Projekt bleibt leer');
equal(empty.attachments.length, 0, 'Leeres Projekt hat keine Bauteile');
equal(empty.summary.totalLoss, 0, 'Leeres Projekt hat keinen Druckverlust');
ok(empty.width >= 1080, 'Leere Ansicht bleibt stabil dimensioniert');

console.log(`NetworkSchematicEngine Phase 24.10: ${checks} Prüfungen bestanden.`);
