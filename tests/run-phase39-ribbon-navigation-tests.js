import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [appHtml, main, ribbon, css] = await Promise.all([
  read('app.html'),
  read('src/main.js'),
  read('src/ui/components/RibbonComponent.js'),
  read('src/ui/phase39_03.css'),
]);

const checks = [
  [appHtml.includes('phase39_03.css?v=39.03'), 'Phase-39.03-CSS ist eingebunden.'],
  [appHtml.includes('src/main.js?v=42.00'), 'Main-Modul verwendet den aktuellen Cache-Stand.'],
  [main.includes('RibbonComponent.js?v=42.00'), 'RibbonComponent wird cache-sicher geladen.'],
  [ribbon.includes('data-ribbon-scroll-shell'), 'Scroll-Shell ist vorhanden.'],
  [ribbon.includes('data-ribbon-scroll="previous"'), 'Linke Überlaufnavigation ist vorhanden.'],
  [ribbon.includes('data-ribbon-scroll="next"'), 'Rechte Überlaufnavigation ist vorhanden.'],
  [ribbon.includes('data-ribbon-jump="${group.id}"'), 'Gruppen-Sprungmarken werden gerendert.'],
  [ribbon.includes('scrollGroupIntoView(groupId)'), 'Gruppen können gezielt eingeblendet werden.'],
  [ribbon.includes('updateScrollControls()'), 'Überlaufzustand wird dynamisch aktualisiert.'],
  [ribbon.includes("classList.toggle('has-ribbon-overflow'"), 'Überlaufklasse wird gesetzt.'],
  [ribbon.includes("classList.toggle('can-scroll-ribbon-previous'"), 'Linker Scrollzustand wird gesetzt.'],
  [ribbon.includes("classList.toggle('can-scroll-ribbon-next'"), 'Rechter Scrollzustand wird gesetzt.'],
  [ribbon.includes('new ResizeObserver'), 'Breitenänderungen werden beobachtet.'],
  [ribbon.includes("event.key === 'ArrowRight'"), 'Pfeil-rechts-Navigation ist vorhanden.'],
  [ribbon.includes("event.key === 'ArrowLeft'"), 'Pfeil-links-Navigation ist vorhanden.'],
  [ribbon.includes("event.key === 'Home'"), 'Pos1-Navigation ist vorhanden.'],
  [ribbon.includes("event.key === 'End'"), 'Ende-Navigation ist vorhanden.'],
  [ribbon.includes('updateCurrentGroup()'), 'Aktive Werkzeuggruppe wird aktualisiert.'],
  [ribbon.includes('revealCurrentAction(selectionType)'), 'Aktives Werkzeug wird automatisch sichtbar gemacht.'],
  [css.includes('.dp-ribbon-scroll-shell'), 'Scroll-Shell ist gestaltet.'],
  [css.includes('.dp-ribbon-scroll-button'), 'Scrollschaltflächen sind gestaltet.'],
  [css.includes('.dp-ribbon-group.is-current-group'), 'Aktive Gruppe ist gestaltet.'],
  [css.includes('button.dp-ribbon-group-label:hover'), 'Gruppenbezeichnungen sind interaktiv gestaltet.'],
  [css.includes('@media (max-width: 900px)'), 'Mobile Darstellung ist abgesichert.'],
  [css.includes('display: contents'), 'Mobile Menüstruktur bleibt kompatibel.'],
];

checks.forEach(([condition, message]) => assert.ok(condition, message));
console.log(`Phase 39.03 Registerführung: ${checks.length} Prüfungen bestanden.`);
