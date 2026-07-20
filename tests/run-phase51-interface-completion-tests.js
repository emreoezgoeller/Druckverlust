#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const appHtml = read('app.html');
const main = read('src/main.js');
const ribbon = read('src/ui/components/RibbonComponent.js');
const sidebar = read('src/ui/components/SidebarComponent.js');
const tooltip = read('src/ui/core/UiTooltipController.js');
const css = read('src/ui/phase51_00.css');
const version = read('src/core/appVersion.js');
const release = JSON.parse(read('release.json'));
const packageJson = JSON.parse(read('package.json'));

// Einzeilige Plattformleiste
check(ribbon.includes('Phase 51.00: einzeilige Plattformleiste'), 'Ribbon ist nicht als Phase-51-Plattformleiste dokumentiert.');
check(ribbon.includes('dp-ribbon-meta'), 'Ribbon besitzt keinen integrierten Status-/Legendenbereich.');
check(ribbon.includes('dp-ribbon-context'), 'Projektstatus fehlt in der Plattformleiste.');
check(ribbon.includes('data-ribbon-scroll-shell'), 'Bestehende Überlaufnavigation wurde nicht erhalten.');
check(ribbon.includes('data-ribbon-jump="${group.id}"'), 'Gruppen-Sprungnavigation wurde nicht erhalten.');
check(css.includes('--dp-ribbon-height: 76px'), 'Desktop-Ribbonhöhe ist nicht kompakt festgelegt.');
check(css.includes('grid-template-columns: var(--dp-ribbon-brand-width) minmax(0, 1fr)'), 'Logo und Werkzeuge liegen nicht in einer stabilen Zeile.');
check(css.includes('button.dp-ribbon-group-label--compact'), 'Kompakte Gruppenbezeichnung fehlt.');
check(css.includes('clip-path: inset(50%)'), 'Gruppenbezeichnungen erzeugen weiterhin eine sichtbare zweite Zeile.');
check(css.includes('.dp-ribbon-group.is-current-group'), 'Aktive Werkzeuggruppe ist nicht sichtbar markiert.');

// Symbollegende und verständliche Hilfe
check(ribbon.includes('data-ribbon-legend-toggle'), 'Schaltfläche für Symbollegende fehlt.');
check(ribbon.includes('data-ribbon-legend-panel'), 'Symbollegenden-Panel fehlt.');
check(ribbon.includes("renderLegendItem('route', 'Teilstrecke'"), 'Teilstrecken-Symbol wird nicht erklärt.');
check(ribbon.includes("renderLegendItem('elbow', 'Formteil'"), 'Formteil-Symbol wird nicht erklärt.');
check(ribbon.includes("renderLegendItem('component', 'Bauteil'"), 'Sonderbauteil-Symbol wird nicht erklärt.');
check(ribbon.includes("renderLegendItem('refresh', 'Berechnen'"), 'Berechnungssymbol wird nicht erklärt.');
check(ribbon.includes("renderLegendItem('report', 'Bericht'"), 'Berichtssymbol wird nicht erklärt.');
check(ribbon.includes('dp-ribbon-status-legend'), 'Statusfarben besitzen keine Legende.');
check(ribbon.includes('setLegendOpen(isOpen)'), 'Symbollegende kann nicht kontrolliert geöffnet und geschlossen werden.');
check(ribbon.includes("event.key !== 'Escape'"), 'Legende lässt sich nicht per Escape schliessen.');
check(css.includes('.dp-ribbon-legend-grid'), 'Symbollegende ist nicht gestaltet.');
check(css.includes('.dp-ribbon-status-legend i.is-unsaved'), 'Ungespeicherter Status ist nicht erklärt.');
check(css.includes('.dp-ribbon-status-legend i.is-check'), 'Prüfstatus ist nicht erklärt.');

// Sofort-Infotexte
check(fs.existsSync(new URL('../src/ui/core/UiTooltipController.js', import.meta.url)), 'Zentraler Tooltip-Controller fehlt.');
check(main.includes("UiTooltipController from './ui/core/UiTooltipController.js?v=51.00&release=51.00'"), 'Tooltip-Controller wird nicht cache-sicher geladen.');
check(main.includes('new UiTooltipController(document).install()'), 'Tooltip-Controller wird beim Start nicht installiert.');
check(ribbon.includes('data-ui-tooltip="${this.escapeAttribute(config.title)}"'), 'Ribbon-Aktionen besitzen keine sofortigen Infotexte.');
check(tooltip.includes("'.dp-sidebar button[title]'"), 'Sidebar-Symbole sind nicht in die Infotexte einbezogen.');
check(tooltip.includes("'.dp-workspace button[title]'"), 'Arbeitsbereich-Symbole sind nicht in die Infotexte einbezogen.');
check(tooltip.includes("target.removeAttribute('title')"), 'Verzögerte Browser- und Sofort-Tooltips können doppelt erscheinen.');
check(tooltip.includes("target.setAttribute('aria-describedby'"), 'Tooltip ist nicht barrierearm mit dem Auslöser verknüpft.');
check(tooltip.includes("event.key === 'Escape'"), 'Infotext lässt sich nicht per Escape schliessen.');
check(tooltip.includes('window.innerWidth - tooltipRect.width'), 'Infotext wird nicht innerhalb des sichtbaren Fensters gehalten.');
check(css.includes('.dp-ui-tooltip.is-visible'), 'Sofort-Infotext besitzt keinen sichtbaren Zustand.');

// Breiten- und Responsive-Schutz
check(css.includes('.dp-sidebar-content,'), 'Sidebar-Inhalte sind nicht gegen Überbreite geschützt.');
check(css.includes('.dp-tree .dp-tree-item'), 'Baumeinträge sind nicht explizit abgesichert.');
check(css.includes('overflow-x: clip'), 'Sidebar kann weiterhin horizontal überragen.');
check(css.includes('.dp-workspace > *'), 'Arbeitsbereichsinhalte sind nicht auf die verfügbare Breite begrenzt.');
check(css.includes('@media (max-width: 900px)'), 'Tablet-/Mobilansicht ist nicht geprüft.');
check(css.includes('.dp-ribbon-legend-panel {\n    position: fixed;'), 'Legende ist auf kleinen Bildschirmen nicht viewport-sicher.');
check(css.includes('@media (max-width: 560px)'), 'Smartphone-Darstellung fehlt.');
check(sidebar.includes('dp-tree-item-copy'), 'Sidebar verwendet nicht die abgesicherte Textstruktur.');

// Release-Integration
check(appHtml.includes('phase51_00.css?v=51.00&release=51.00'), 'Phase-51-Stylesheet wird nicht geladen.');
check(appHtml.includes('src/main.js?v=51.00'), 'Anwendung lädt nicht den Phase-51-Cache-Stand.');
check(version.includes("APP_VERSION = '2.6.0'") && version.includes("APP_RELEASE = '51.00'"), 'Versionsdaten stehen nicht auf 2.6.0 / Phase 51.00.');
check(packageJson.version === '2.6.0', 'package.json steht nicht auf Version 2.6.0.');
check(release.version === '2.6.0' && release.phase === '51.00', 'release.json steht nicht auf Version 2.6.0 / Phase 51.00.');
check(release.quality?.interfaceCompletionChecks === 48, 'Release-Manifest dokumentiert die Phase-51-Prüfungen nicht.');

console.log(`Phase 51.00 Oberflächen- und Ribbon-Abschluss: ${checks} Prüfungen bestanden.`);
