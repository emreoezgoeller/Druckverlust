#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import createDemoProject from '../src/project/demoProject.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ReportEngine from '../src/report/ReportEngine.js';
import ReportSchematicRenderer from '../src/report/ReportSchematicRenderer.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const includes = (text, needle, message) => { check(String(text).includes(needle), message); };
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const project = createDemoProject();
const system = project.systems[0];
project.calculationResult = ProjectCalculationService.calculate(project, system.id);
const model = ReportEngine.createReportModel(project, { system });
const schematic = model.networkSchematic;

// Fortlaufende, eindeutige Referenzen.
const index = ReportSchematicRenderer.createAttachmentIndex(schematic);
equal(index.counters.formPart, 5, 'Die Demoanlage enthält fünf referenzierte Formteile.');
equal(index.counters.special, 3, 'Die Demoanlage enthält drei referenzierte Sonderbauteile.');
equal(index.indexed[0].reference, 'F01', 'Das erste Formteil erhält F01.');
equal(index.indexed.find(item => item.kind === 'special')?.reference, 'S01', 'Das erste Sonderbauteil erhält S01.');
equal(new Set(index.indexed.map(item => item.reference)).size, index.indexed.length, 'Alle Schema-Referenzen sind eindeutig.');
check(index.indexed.every(item => item.icon), 'Jedes Bauteil besitzt ein aufgelöstes Symbol.');

// Adaptive, aber kontrollierte Seiteneinteilung.
const demoPages = ReportSchematicRenderer.paginate(schematic);
equal(demoPages.length, 1, 'Die Demoanlage bleibt auf einer Schemaseite.');
equal(demoPages[0].nodes.length, 5, 'Fünf Teilstrecken werden auf der Demoschemaseite dargestellt.');
equal(demoPages[0].startPosition, 0, 'Die erste Schemaseite beginnt lückenlos bei Position 0.');

const denseNodes = Array.from({ length: 10 }, (_, nodeIndex) => ({
  ...schematic.nodes[nodeIndex % schematic.nodes.length],
  id: `dense-ts-${nodeIndex + 1}`,
  label: `Sehr lange Teilstreckenbezeichnung Nummer ${nodeIndex + 1}`,
}));
const denseAttachments = denseNodes.flatMap((node, nodeIndex) => Array.from({ length: 6 }, (_, itemIndex) => ({
  ...schematic.attachments[itemIndex % schematic.attachments.length],
  id: `dense-att-${nodeIndex + 1}-${itemIndex + 1}`,
  sectionId: node.id,
  kind: itemIndex < 4 ? 'formPart' : 'special',
  icon: itemIndex % 2 ? 'transition' : 'bend',
  label: `Dichtes Bauteil ${nodeIndex + 1}.${itemIndex + 1} mit ausführlicher Bezeichnung`,
})));
const denseSchematic = { ...schematic, nodes: denseNodes, attachments: denseAttachments };
const densePages = ReportSchematicRenderer.paginate(denseSchematic);
equal(densePages.length, 3, 'Bauteilreiche zehn Teilstrecken werden adaptiv auf drei Seiten verteilt.');
check(densePages.every(page => page.nodes.length <= ReportSchematicRenderer.nodesPerPage), 'Keine adaptive Schemaseite überschreitet fünf Teilstrecken.');
equal(densePages.at(-1).startPosition + densePages.at(-1).nodes.length, denseNodes.length, 'Die adaptive Aufteilung endet lückenlos bei der letzten Teilstrecke.');

// Kollisionsgeschütztes Layout und Symbolgruppen.
const layout = ReportSchematicRenderer.createLayout(schematic, demoPages[0].nodes, {
  chunkIndex: 0,
  chunkCount: 1,
  startPosition: 0,
});
equal(ReportSchematicRenderer.auditLayout(layout, schematic, index).length, 0, 'Das Standardschema besitzt keine erkannten Karten- oder Symbolkollisionen.');
check(layout.positions.every((item, position) => position === 0 || item.cardX > layout.positions[position - 1].cardX + layout.cardWidth), 'Teilstreckenkarten sind horizontal getrennt.');

const denseFirst = densePages[0];
const denseLayout = ReportSchematicRenderer.createLayout(denseSchematic, denseFirst.nodes, {
  chunkIndex: 0,
  chunkCount: densePages.length,
  startPosition: denseFirst.startPosition,
});
equal(ReportSchematicRenderer.auditLayout(denseLayout, denseSchematic).length, 0, 'Auch der Dichtefall bleibt innerhalb der kollisionsgeschützten Zeichenbahnen.');

const denseNodeAttachments = ReportSchematicRenderer.getNodeAttachments(denseSchematic, denseFirst.nodes[0].id);
const denseCluster = ReportSchematicRenderer.createClusterLayout(
  denseLayout.positions[0],
  denseNodeAttachments.filter(item => item.kind === 'formPart'),
  'top',
);
equal(denseCluster.visibleItems.length, 3, 'Maximal drei Formteilsymbole werden je Bahn direkt dargestellt.');
equal(denseCluster.overflow, 1, 'Weitere Formteile werden kontrolliert als +n zusammengefasst.');

// SVG, Zuordnung und Symbollegende.
const rendered = ReportSchematicRenderer.render(schematic, demoPages[0].nodes, {
  chunkIndex: 0,
  chunkCount: 1,
  startPosition: 0,
  attachmentIndex: index,
});
includes(rendered, 'report-schematic-attachment-symbol is-formpart', 'Formteilsymbole werden als eigene Vektorgruppe gerendert.');
includes(rendered, 'report-schematic-attachment-symbol is-special', 'Sonderbauteile werden als eigene Vektorgruppe gerendert.');
includes(rendered, '>F01<', 'Die Referenz F01 erscheint direkt im Schema.');
includes(rendered, '>S01<', 'Die Referenz S01 erscheint direkt im Schema.');
includes(rendered, 'report-schematic-assignment-table', 'Jeder Schemaabschnitt enthält eine Bauteil-Zuordnung.');
includes(rendered, 'Kanalbogen 90° Hauptkanal', 'Die Formteilbezeichnung wird in der Zuordnung nachvollziehbar ausgegeben.');
includes(rendered, 'Filterstufe F7', 'Die Sonderbauteilbezeichnung wird in der Zuordnung nachvollziehbar ausgegeben.');
includes(rendered, 'report-schematic-symbol-legend', 'Eine dynamische Symbollegende wird ausgegeben.');
includes(rendered, 'Bogen / Krümmer', 'Die Symbollegende erklärt das Bogensymbol.');
includes(rendered, 'Ü = Geometrie- oder Querschnittswechsel', 'Geometriewechsel werden verständlich erklärt.');
includes(rendered, 'data-schema-layout-status="ok"', 'Das kollisionsfreie Schema kennzeichnet seinen Layoutstatus.');
check(!rendered.includes('report-schematic-count'), 'Die alten unklaren reinen Zählkreise werden nicht mehr verwendet.');

const denseRendered = ReportSchematicRenderer.render(denseSchematic, denseFirst.nodes, {
  chunkIndex: 0,
  chunkCount: densePages.length,
  startPosition: denseFirst.startPosition,
});
includes(denseRendered, '>+1<', 'Der Dichtefall zeigt den kontrollierten Symbolüberlauf.');
includes(denseRendered, 'Sehr lange Tei…', 'Lange Bezeichnungen werden im SVG gekürzt.');
includes(denseRendered, 'Sehr lange Teilstreckenbeze…', 'Die Zuordnungstabelle führt die längere Teilstreckenbezeichnung nachvollziehbar fort.');

// Mehrseitenfortsetzung und Berichtsintegration.
const longNodes = Array.from({ length: 12 }, (_, nodeIndex) => ({
  ...schematic.nodes[nodeIndex % schematic.nodes.length],
  id: `long-ts-${nodeIndex + 1}`,
  label: `TS ${nodeIndex + 1}`,
}));
const longSchematic = { ...schematic, nodes: longNodes, attachments: [] };
const longPages = ReportSchematicRenderer.paginate(longSchematic);
equal(longPages.length, 3, 'Zwölf Teilstrecken werden weiterhin auf drei Schemaabschnitte verteilt.');
const continuation = ReportSchematicRenderer.render(longSchematic, longPages[1].nodes, {
  chunkIndex: 1,
  chunkCount: longPages.length,
  startPosition: longPages[1].startPosition,
});
includes(continuation, 'ab TS 6', 'Die Fortsetzungsseite nennt ihren eindeutigen Startpunkt.');
includes(continuation, 'weiter mit TS 11', 'Die Fortsetzungsseite nennt den nächsten Abschnitt.');
includes(continuation, 'TS 6-10 von 12', 'Der dargestellte Teilstreckenbereich ist lückenlos.');
includes(continuation, 'report-schematic-progress', 'Der Abschnittsfortschritt wird grafisch angezeigt.');

const modelWithLongSchema = { ...model, networkSchematic: longSchematic };
const plan = ReportEngine.createPagePlan(modelWithLongSchema);
equal(plan.entries.find(item => item.key === 'networkSchematic')?.pageCount, 3, 'Der Seitenplan verwendet dieselbe adaptive Schemapaginierung wie der Bericht.');

const reportHtml = ReportEngine.createStandaloneHtml(model);
includes(reportHtml, 'F- und S-Referenzen verbinden die Symbole eindeutig', 'Der Bericht erklärt das Referenzsystem.');
includes(reportHtml, 'report-schematic-assignment-table', 'Die Zuordnungstabelle ist im vollständigen Bericht enthalten.');
includes(reportHtml, 'report-schematic-symbol-legend', 'Die Symbollegende ist im vollständigen Bericht enthalten.');
includes(reportHtml, 'report-schematic-transition-marker', 'Querschnittswechsel sind im vollständigen Bericht markiert.');
includes(reportHtml, '.report-schematic-attachment-symbol.is-formpart', 'Die Formteil-Symbolsprache besitzt druckfähige CSS-Regeln.');
includes(reportHtml, '.report-schematic-assignment-table', 'Die Bauteil-Zuordnung besitzt druckfähige CSS-Regeln.');

// Versions-, Dokumentations- und Releaseintegration.
const rendererSource = read('src/report/ReportSchematicRenderer.js');
const reportSource = read('src/report/ReportEngine.js');
const versionSource = read('src/core/appVersion.js');
const packageJson = JSON.parse(read('package.json'));
const release = JSON.parse(read('release.json'));
const appHtml = read('app.html');
const mainSource = read('src/main.js');
const roadmap = read('ROADMAP.md');
const changelog = read('CHANGELOG.md');
const releaseNotes = read('RELEASE_NOTES.md');
const testPlan = read('docs/TESTPLAN.md');

includes(rendererSource, '// Druckverlust Pro – Phase 54.00', 'Der Schema-Renderer ist fachlich als Phase 54 gekennzeichnet.');
includes(rendererSource, 'createAttachmentIndex', 'Der Renderer enthält die zentrale Referenzbildung.');
includes(rendererSource, 'auditLayout', 'Der Renderer enthält die automatische Kollisionsprüfung.');
includes(reportSource, 'ReportSchematicRenderer.paginate', 'Seitenplan und Bericht verwenden die adaptive Schemaseitenteilung.');
includes(versionSource, "APP_VERSION = '2.12.0'", 'App-Version steht auf dem aktuellen Stand 2.12.0.');
includes(versionSource, "APP_RELEASE = '57.00'", 'App-Release steht auf dem aktuellen Stand Phase 56.00.');
equal(packageJson.version, '2.12.0', 'package.json steht auf Version 2.12.0.');
equal(release.version, '2.12.0', 'release.json steht auf Version 2.12.0.');
equal(release.phase, '57.00', 'release.json steht auf Phase 56.00.');
check(Number(release.quality?.reportSchematicChecks) >= 0, 'release.json besitzt das Qualitätsfeld der Phase 54.');
includes(appHtml, 'src/main.js?v=57.00', 'Das Main-Modul wird mit Phase-54-Kennung geladen.');
includes(mainSource, 'WorkspaceComponent.js?v=57.00', 'Der Workspace wird cache-sicher mit Phase 54 geladen.');
includes(roadmap, 'Phase 54.00 – Anlagenschema im Bericht – abgeschlossen', 'Die Roadmap markiert Phase 54 als abgeschlossen.');
includes(roadmap, 'Phase 55.00 – Projektdateien und Rückwärtskompatibilität – abgeschlossen', 'Die Roadmap markiert Phase 55 als abgeschlossen.');
includes(changelog, '## 2.9.0 – Phase 54.00', 'Der Changelog enthält den Phase-54-Eintrag.');
includes(releaseNotes, 'Version 2.12.0', 'Die Release Notes nennen Version 2.12.0.');
includes(releaseNotes, 'Phase 57.00', 'Die Release Notes nennen den aktuellen Stand Phase 56.00.');
includes(testPlan, 'npm run test:phase54', 'Der Testplan dokumentiert die Phase-54-Testsuite.');

console.log(`Phase 54.00 Anlagenschema im Bericht: ${checks} Prüfungen bestanden.`);
