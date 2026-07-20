#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULT_TARGET_VELOCITY_MS,
  MAX_RECTANGULAR_ASPECT_RATIO,
  ROUND_STANDARD_DIAMETERS_MM,
  RECTANGULAR_STANDARD_DIMENSIONS_MM,
  applySectionSizingSuggestion,
  calculateSectionVelocityMs,
  createFollowingSectionTemplate,
  createSectionSizingResult,
  dimensionToMetres,
  dimensionToMillimetres,
  getSectionAreaM2,
  normalizeTargetVelocity,
} from '../src/sections/SectionSizingAssistant.js';

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const equal = (actual, expected, message) => {
  assert.equal(actual, expected, message);
  checks += 1;
};
const close = (actual, expected, tolerance, message) => {
  assert.ok(Math.abs(Number(actual) - Number(expected)) <= tolerance, `${message}: ${actual} statt ${expected}`);
  checks += 1;
};

// Zielwert und Einheiten
close(DEFAULT_TARGET_VELOCITY_MS, 3, 1e-12, 'Standard-Zielgeschwindigkeit beträgt 3,0 m/s.');
close(normalizeTargetVelocity(''), 3, 1e-12, 'Leerer Zielwert fällt sicher auf 3,0 m/s zurück.');
close(normalizeTargetVelocity('3,4'), 3.4, 1e-12, 'Kommawerte werden akzeptiert.');
close(normalizeTargetVelocity(0.1), 0.5, 1e-12, 'Zielwert wird nach unten begrenzt.');
close(normalizeTargetVelocity(20), 12, 1e-12, 'Zielwert wird nach oben begrenzt.');
close(dimensionToMetres(500), 0.5, 1e-12, 'Historische Millimeterwerte werden als Meter erkannt.');
close(dimensionToMetres(0.5), 0.5, 1e-12, 'Aktuelle Meterwerte bleiben unverändert.');
close(dimensionToMillimetres(0.5), 500, 1e-12, 'Meterwerte werden für die Oberfläche in Millimeter umgerechnet.');
close(dimensionToMillimetres(500), 500, 1e-12, 'Historische Millimeterwerte werden nicht nochmals skaliert.');
check(ROUND_STANDARD_DIAMETERS_MM.includes(315) && ROUND_STANDARD_DIAMETERS_MM.includes(1000), 'Neutrale Rohr-Nennweiten enthalten übliche Grössen.');
check(RECTANGULAR_STANDARD_DIMENSIONS_MM.includes(400) && RECTANGULAR_STANDARD_DIMENSIONS_MM.includes(1200), 'Neutrale Kanalabmessungen enthalten übliche Grössen.');
close(MAX_RECTANGULAR_ASPECT_RATIO, 4, 1e-12, 'Kanalvorschläge begrenzen das Seitenverhältnis auf 1:4.');

// Aktuelle Geometrie und Geschwindigkeit
const currentDuct = { type: 'duct', q: 1800, b: 0.5, h: 0.4 };
close(getSectionAreaM2(currentDuct), 0.2, 1e-12, 'Rechteckfläche wird korrekt berechnet.');
close(calculateSectionVelocityMs(currentDuct), 2.5, 1e-12, 'Kanalgeschwindigkeit wird korrekt berechnet.');
const currentPipe = { type: 'pipe', q: 1800, d: 0.5 };
close(getSectionAreaM2(currentPipe), Math.PI * 0.25 ** 2, 1e-12, 'Rohrfläche wird korrekt berechnet.');
close(calculateSectionVelocityMs(currentPipe), 0.5 / (Math.PI * 0.25 ** 2), 1e-12, 'Rohrgeschwindigkeit wird korrekt berechnet.');
close(calculateSectionVelocityMs({ type: 'duct', q: 0, b: 0.5, h: 0.4 }), 0, 1e-12, 'Ohne Luftmenge entsteht keine Schein-Geschwindigkeit.');
close(calculateSectionVelocityMs({ type: 'duct', q: 1000, b: 0, h: 0.4 }), 0, 1e-12, 'Ohne gültige Geometrie entsteht keine Schein-Geschwindigkeit.');

// Rechteck-Assistent
const duct = { id: 'duct', name: 'TS 1', type: 'duct', q: 1800, l: 8, b: 0.4, h: 0.3, roughnessMm: 0.15 };
const ductBefore = JSON.stringify(duct);
const ductSizing = createSectionSizingResult(duct, { targetVelocityMs: 3, limit: 4 });
equal(ductSizing.status, 'ready', 'Rechteck-Assistent liefert einen gültigen Status.');
equal(ductSizing.suggestions.length, 4, 'Rechteck-Assistent liefert vier übersichtliche Varianten.');
check(ductSizing.primary.kind === 'duct', 'Primärvorschlag bleibt ein Rechteckkanal.');
check(ductSizing.primary.velocityMs <= 3 + 1e-9, 'Primärvorschlag überschreitet den Zielwert nicht.');
check(ductSizing.primary.widthMm >= ductSizing.primary.heightMm, 'Rechteckvorschlag wird mit der grösseren Seite als Breite ausgegeben.');
check(ductSizing.primary.aspectRatio <= 4, 'Rechteckvorschlag hält das Seitenverhältnis ein.');
equal(JSON.stringify(duct), ductBefore, 'Vorschläge verändern die Teilstrecke noch nicht.');
check(ductSizing.suggestions.every(item => item.label.includes('×') && item.label.includes('mm')), 'Kanalvorschläge sind klar in Millimeter beschriftet.');

// Rund-Assistent
const pipe = { id: 'pipe', name: 'TS 2', type: 'pipe', q: 1800, l: 8, d: 0.4, roughnessMm: 0.15 };
const pipeSizing = createSectionSizingResult(pipe, { targetVelocityMs: 3, limit: 4 });
equal(pipeSizing.status, 'ready', 'Rohr-Assistent liefert einen gültigen Status.');
equal(pipeSizing.suggestions.length, 4, 'Rohr-Assistent liefert vier Varianten.');
check(pipeSizing.primary.kind === 'pipe', 'Primärvorschlag bleibt ein Rundrohr.');
check(pipeSizing.primary.velocityMs <= 3 + 1e-9, 'Rohrvorschlag überschreitet den Zielwert nicht.');
check(ROUND_STANDARD_DIAMETERS_MM.includes(pipeSizing.primary.diameterMm), 'Rohrvorschlag stammt aus der neutralen Standardreihe.');
check(pipeSizing.suggestions.every(item => item.label.startsWith('Ø ') && item.label.endsWith(' mm')), 'Rohrvorschläge sind eindeutig beschriftet.');

// Anwenden und Folge-Teilstrecke
const appliedDuct = { ...duct };
applySectionSizingSuggestion(appliedDuct, ductSizing.primary);
close(appliedDuct.b, ductSizing.primary.widthMm / 1000, 1e-12, 'Kanalbreite wird intern in Meter übernommen.');
close(appliedDuct.h, ductSizing.primary.heightMm / 1000, 1e-12, 'Kanalhöhe wird intern in Meter übernommen.');
close(appliedDuct.d, 0, 1e-12, 'Nicht verwendeter Rohrdurchmesser wird zurückgesetzt.');
const appliedPipe = { ...pipe, b: 0.5, h: 0.3 };
applySectionSizingSuggestion(appliedPipe, pipeSizing.primary);
close(appliedPipe.d, pipeSizing.primary.diameterMm / 1000, 1e-12, 'Rohrdurchmesser wird intern in Meter übernommen.');
close(appliedPipe.b, 0, 1e-12, 'Nicht verwendete Kanalbreite wird zurückgesetzt.');
close(appliedPipe.h, 0, 1e-12, 'Nicht verwendete Kanalhöhe wird zurückgesetzt.');
const following = createFollowingSectionTemplate({ ...appliedDuct, description: 'Alt', note: 'Alt', l: 12 });
close(following.q, appliedDuct.q, 1e-12, 'Folge-Teilstrecke übernimmt die Luftmenge.');
close(following.b, appliedDuct.b, 1e-12, 'Folge-Teilstrecke übernimmt die Abmessung.');
close(following.l, 0, 1e-12, 'Folge-Teilstrecke startet bewusst mit 0 m Länge.');
equal(following.description, '', 'Folge-Teilstrecke übernimmt keine alte Beschreibung.');

// Fehlende und aussergewöhnlich grosse Eingaben
const missing = createSectionSizingResult({ type: 'duct', q: 0, b: 0.4, h: 0.3 });
equal(missing.status, 'missing-airflow', 'Fehlende Luftmenge wird verständlich erkannt.');
equal(missing.suggestions.length, 0, 'Ohne Luftmenge werden keine irreführenden Vorschläge angezeigt.');
const huge = createSectionSizingResult({ type: 'pipe', q: 500000 }, { targetVelocityMs: 2 });
equal(huge.status, 'limit-exceeded', 'Extremwerte werden kontrolliert als ausserhalb des Standardbereichs gemeldet.');
check(huge.message.includes('Standardbereich'), 'Grenzfall enthält einen verständlichen Hinweis.');

// UI- und Integrationsschutz
const workspace = fs.readFileSync(new URL('../src/ui/components/WorkspaceComponent.js', import.meta.url), 'utf8');
const appHtml = fs.readFileSync(new URL('../app.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/ui/phase49_00.css', import.meta.url), 'utf8');
check(workspace.includes('Dimensionierungsassistent'), 'Teilstreckeneditor enthält den Dimensionierungsassistenten.');
check(workspace.includes('data-section-sizing-target="${value}"') && workspace.includes('data-section-sizing-custom'), 'Voreinstellungen und freier Zielwert sind eingebunden.');
check(workspace.includes('Ohne Klick auf einen Abmessungsvorschlag werden keine Kanal- oder Rohrmasse verändert.'), 'Oberfläche erklärt die sichere Bestätigung.');
check(workspace.includes('+ nächste TS mit gleicher Grösse'), 'Schnellfunktion für die folgende Teilstrecke ist vorhanden.');
check(workspace.includes('data-field-unit="mm"') && workspace.includes("numericValue / 1000"), 'Geometriefelder zeigen Millimeter und speichern weiterhin Meter.');
check(workspace.includes('<th>Breite<br>[mm]</th>') && workspace.includes('<th>Ø<br>[mm]</th>'), 'Schnellerfassung verwendet ebenfalls Millimeter.');
check(appHtml.includes('phase49_00.css?v=49.00&release=51.00'), 'Phase-49-Stylesheet wird cache-sicher geladen.');
check(css.includes('@media (max-width: 820px)') && css.includes('grid-template-columns: 1fr'), 'Assistent besitzt eine robuste mobile Darstellung.');

console.log(`Phase 49.00 vereinfachte Teilstreckenerfassung: ${checks} Prüfungen bestanden.`);
