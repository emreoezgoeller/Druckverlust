import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ReportEngine from '../src/report/ReportEngine.js';
import ReportSchematicRenderer from '../src/report/ReportSchematicRenderer.js';

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };

const project = createDemoProject();
const system = project.systems[0];
project.calculationResult = ProjectCalculationService.calculate(project, system.id);
project.reportOptions = {
  includeToc: true,
  includeExecutiveSummary: true,
  includeNetworkSchematic: true,
  includeLossAnalysis: true,
  includeEngineeringQuality: true,
  includeMainNetwork: true,
  includeAssignedFormParts: true,
  includeSpecialComponents: true,
  includeSummary: true,
  includeQualityProtocol: true,
  includeFormPartCatalog: true,
  includeApproval: true,
  includeInfo: true,
};

const model = ReportEngine.createReportModel(project, { system });
const chunks = ReportSchematicRenderer.chunk(model.networkSchematic.nodes);
equal(ReportSchematicRenderer.nodesPerPage, 5, 'PDF-Schema verwendet fünf Teilstrecken je Seite.');
equal(chunks.length, 1, 'Demoanlage passt auf eine Schemaseite.');
equal(chunks[0].length, 5, 'Alle fünf Demo-Teilstrecken werden dargestellt.');

const layout = ReportSchematicRenderer.createLayout(model.networkSchematic, chunks[0], {
  chunkIndex: 0,
  chunkCount: 1,
  startPosition: 0,
});
ok(layout.positions[0].cardX > 90, 'Einlassbereich überlagert die erste Teilstreckenkarte nicht.');
ok(layout.positions.at(-1).cardX + layout.cardWidth < 650, 'Anlagenende überlagert die letzte Teilstreckenkarte nicht.');
ok(layout.ductPolygon.length >= 8, 'Durchgehender Kanalzug wird als Polygon aufgebaut.');
ok(layout.positions.every(item => item.cardX >= 0 && item.cardY >= 0), 'Alle Karten liegen innerhalb der Zeichenfläche.');

const svg = ReportSchematicRenderer.render(model.networkSchematic, chunks[0], {
  chunkIndex: 0,
  chunkCount: 1,
  startPosition: 0,
});
assert.match(svg, /report-schematic-duct/, 'PDF enthält einen echten Kanalzug.'); checks += 1;
assert.match(svg, /ANLAGENABSCHNITT 1\/1/, 'PDF kennzeichnet den Anlagenabschnitt.'); checks += 1;
assert.match(svg, /LUFTSTROM/, 'PDF enthält den getrennten Einlassbereich.'); checks += 1;
assert.match(svg, /ANLAGENENDE/, 'PDF enthält den getrennten Endbereich.'); checks += 1;
equal((svg.match(/class="report-schematic-node"/g) || []).length, 5, 'Fünf Teilstreckenkarten werden gerendert.');
assert.doesNotMatch(svg, /report-schematic-flowline/, 'Die alte breite Hintergrundlinie wird nicht mehr verwendet.'); checks += 1;

const longNodes = Array.from({ length: 12 }, (_, index) => ({
  ...model.networkSchematic.nodes[index % model.networkSchematic.nodes.length],
  id: `long-${index + 1}`,
  label: `TS ${index + 1}`,
}));
const longChunks = ReportSchematicRenderer.chunk(longNodes);
equal(longChunks.length, 3, 'Zwölf Teilstrecken werden auf drei lesbare Schemaseiten verteilt.');
equal(longChunks[0].length, 5, 'Erste Schemaseite enthält fünf Teilstrecken.');
equal(longChunks[1].length, 5, 'Zweite Schemaseite enthält fünf Teilstrecken.');
equal(longChunks[2].length, 2, 'Letzte Schemaseite enthält die verbleibenden Teilstrecken.');

const continuation = ReportSchematicRenderer.render({ ...model.networkSchematic, nodes: longNodes }, longChunks[1], {
  chunkIndex: 1,
  chunkCount: 3,
  startPosition: 5,
});
assert.match(continuation, /ab TS 6/, 'Fortsetzungsseite benennt den Startpunkt.'); checks += 1;
assert.match(continuation, /weiter mit TS 11/, 'Fortsetzungsseite benennt den Folgeabschnitt.'); checks += 1;
assert.match(continuation, /TS 6-10 von 12/, 'Fortsetzungsseite zeigt den korrekten Bereich.'); checks += 1;

const reportHtml = ReportEngine.renderReportBody(model);
assert.match(reportHtml, /is-five-columns/, 'PDF-Kennwertleiste wurde auf fünf Kennwerte erweitert.'); checks += 1;
assert.match(reportHtml, /Kanalhöhen und Übergänge werden schematisch dargestellt/, 'PDF enthält den präzisierten Schemahinweis.'); checks += 1;
assert.match(reportHtml, /report-schematic-node-accent/, 'PDF-Teilstreckenkarten besitzen eine klare optische Führung.'); checks += 1;

console.log(`Phase 29.00 PDF-Anlagenschema: ${checks} Prüfungen bestanden.`);
