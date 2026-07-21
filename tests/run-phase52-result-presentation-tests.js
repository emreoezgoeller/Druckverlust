#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  RESULT_GLOSSARY,
  RESULT_VIEW_MODES,
  createSectionPresentationRow,
  createSectionResultPresentation,
  createSystemResultPresentation,
  normalizeResultViewMode,
} from '../src/results/ResultPresentationEngine.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';

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

// Ansichtsmodi und Glossar
check(Array.isArray(RESULT_VIEW_MODES), 'Ansichtsmodi sind als Liste verfügbar.');
equal(RESULT_VIEW_MODES.length, 2, 'Genau Standard- und Profi-Ansicht sind vorhanden.');
equal(RESULT_VIEW_MODES[0].id, 'standard', 'Standard ist die erste und sichere Ansicht.');
equal(RESULT_VIEW_MODES[1].id, 'professional', 'Profi-Ansicht ist vorhanden.');
equal(normalizeResultViewMode('professional'), 'professional', 'Profi-Modus wird erkannt.');
equal(normalizeResultViewMode('STANDARD'), 'standard', 'Ansichtsmodus wird robust normalisiert.');
equal(normalizeResultViewMode('unbekannt'), 'standard', 'Ungültige Ansicht fällt auf Standard zurück.');
equal(RESULT_GLOSSARY.length, 5, 'Fünf technische Grundbegriffe werden erklärt.');
check(RESULT_GLOSSARY.some(item => item.symbol === 'Δp'), 'Δp wird erklärt.');
check(RESULT_GLOSSARY.some(item => item.symbol === 'λ'), 'λ wird erklärt.');
check(RESULT_GLOSSARY.some(item => item.symbol === 'ζ'), 'ζ wird erklärt.');
check(RESULT_GLOSSARY.some(item => item.symbol === 'k'), 'Rauigkeit k wird erklärt.');
check(RESULT_GLOSSARY.some(item => item.symbol === 'p_dyn'), 'Dynamischer Druck wird erklärt.');

const system = {
  id: 'phase52-system',
  name: 'Zuluft Test',
  siaVelocity: { roomUsageCode: '4.01', operationMode: 'two-stage' },
  sections: [
    { id: 'ts-1', name: 'TS 1', type: 'duct', q: 3200, b: 0.8, h: 0.45, l: 8.5, roughnessMm: 0.15 },
    { id: 'ts-2', name: 'TS 2 kritisch', type: 'pipe', q: 5000, d: 0.5, l: 30, roughnessMm: 0.15 },
    { id: 'ts-3', name: 'TS 3', type: 'duct', q: 1200, b: 0.5, h: 0.3, l: 4, roughnessMm: 0.15 },
  ],
  formParts: [
    { id: 'fp-1', name: 'Bogen 1', type: 'freier_zeta_wert', sectionId: 'ts-1', zeta: 1.2, parameters: { zeta: 1.2 } },
    { id: 'fp-2', name: 'Bogen 2', type: 'freier_zeta_wert', sectionId: 'ts-2', zeta: 3.5, parameters: { zeta: 3.5 } },
  ],
  specialComponents: [
    { id: 'sp-1', name: 'Filter', pressureLoss: 80, pa: 80, quantity: 1 },
  ],
};
const project = {
  id: 'phase52-project',
  name: 'Phase 52 Test',
  settings: { rho: 1.21, defaultRoughnessMm: 0.15, kinematicViscosity: 0.0000151, sectionRoundingStep: 0.5 },
  systems: [system],
};
const calculationResult = ProjectCalculationService.calculate(project, system.id);
const calculation = calculationResult.calculation;
const presentation = createSystemResultPresentation(system, calculation, {
  velocityCompliance: calculationResult.velocityCompliance,
  quality: calculationResult.quality,
});

// Anlagenmodell
check(presentation.hasCalculation, 'Berechnetes System wird erkannt.');
equal(presentation.counts.sections, 3, 'Teilstreckenanzahl stimmt.');
equal(presentation.counts.calculatedSections, 3, 'Alle Teilstrecken sind berechnet.');
equal(presentation.counts.formParts, 2, 'Formteilanzahl stimmt.');
equal(presentation.counts.specialComponents, 1, 'Sonderbauteilanzahl stimmt.');
equal(presentation.rows.length, 3, 'Drei Ergebniszeilen werden erzeugt.');
equal(presentation.topSections.length, 3, 'Topliste enthält alle verfügbaren Teilstrecken.');
check(presentation.criticalSection, 'Kritische Teilstrecke wird bestimmt.');
equal(presentation.criticalSection.id, presentation.topSections[0].id, 'Kritische Teilstrecke ist die erste der sortierten Topliste.');
check(presentation.criticalSection.totalLossPa >= presentation.topSections[1].totalLossPa, 'Kritische Teilstrecke besitzt den höchsten Verlust.');
close(presentation.totals.frictionLossPa, calculation.totals.friction, 1e-9, 'Reibungsverlust wird unverändert übernommen.');
close(presentation.totals.zetaLossPa, calculation.totals.zetaLoss, 1e-9, 'ζ-Verlust wird unverändert übernommen.');
close(presentation.totals.directLossPa, calculation.totals.directFormPartLoss, 1e-9, 'Direktverlust wird unverändert übernommen.');
close(presentation.totals.formPartLossPa, calculation.totals.zetaLoss + calculation.totals.directFormPartLoss, 1e-9, 'Formteilverluste werden korrekt zusammengefasst.');
close(presentation.totals.specialLossPa, calculation.totals.special, 1e-9, 'Sonderbauteilverlust wird übernommen.');
close(presentation.totals.totalRawPa, calculation.totals.total, 1e-9, 'Ungereundetes Total stimmt.');
close(presentation.totals.totalRoundedPa, calculation.totals.totalRounded, 1e-9, 'Gerundetes Total stimmt.');
check(presentation.totals.shares.friction >= 0, 'Reibungsanteil ist nicht negativ.');
check(presentation.totals.shares.formParts >= 0, 'Formteilanteil ist nicht negativ.');
check(presentation.totals.shares.special >= 0, 'Sonderbauteilanteil ist nicht negativ.');
check(presentation.rows.every(row => row.systemSharePercent >= 0), 'Systemanteile aller Teilstrecken sind gültig.');
check(presentation.rows.find(row => row.id === 'ts-1')?.formPartCount === 1, 'Zugeordnete Formteile werden je Teilstrecke gezählt.');
check(presentation.rows.find(row => row.id === 'ts-3')?.formPartCount === 0, 'Teilstrecke ohne Formteil bleibt bei 0.');
check(presentation.velocity.total === 3, 'SIA-Prüfstatus enthält alle Teilstrecken.');
check(['critical', 'warning', 'ok', 'not-applicable', 'not-configured'].includes(presentation.velocity.status), 'SIA-Anlagenstatus ist ein definierter Zustand.');

// Teilstreckenmodell
const firstItem = calculation.results.find(item => item.id === 'ts-1');
const firstRow = createSectionPresentationRow(system.sections[0], firstItem, calculation.totals.totalRounded, 1);
equal(firstRow.id, 'ts-1', 'Teilstrecken-ID bleibt erhalten.');
equal(firstRow.name, 'TS 1', 'Teilstreckenname bleibt erhalten.');
equal(firstRow.formPartCount, 1, 'Formteilanzahl wird im Einzelmodell übernommen.');
check(firstRow.airflowM3h > 0, 'Luftmenge ist vorhanden.');
check(firstRow.velocityMs > 0, 'Geschwindigkeit ist vorhanden.');
check(firstRow.dynamicPressurePa > 0, 'Dynamischer Druck ist vorhanden.');
close(firstRow.roughnessMm, 0.15, 1e-12, 'Rauigkeit wird korrekt dargestellt.');
check(firstRow.frictionFactor > 0, 'Reibungszahl ist vorhanden.');
check(firstRow.reynoldsNumber > 0, 'Reynolds-Zahl ist vorhanden.');
check(firstRow.frictionRatePaM > 0, 'Reibungsgefälle ist vorhanden.');
close(firstRow.formPartLossPa, firstRow.zetaLossPa + firstRow.directLossPa, 1e-12, 'Formteilverlust besteht aus ζ- und Direktverlust.');
check(firstRow.totalLossPa >= firstRow.frictionLossPa, 'Gesamtverlust enthält mindestens die Reibung.');
check(firstRow.systemSharePercent > 0, 'Teilstrecke besitzt einen Systemanteil.');

const sectionPresentation = createSectionResultPresentation(system.sections[0], firstItem, {
  systemTotalPa: calculation.totals.totalRounded,
  formPartCount: 1,
  velocityCheck: { status: 'ok', maximumVelocityMs: 5, utilizationPercent: 62 },
});
equal(sectionPresentation.velocityStatus, 'ok', 'SIA-Einzelstatus wird übernommen.');
close(sectionPresentation.maximumVelocityMs, 5, 1e-12, 'SIA-Maximalgeschwindigkeit wird übernommen.');
close(sectionPresentation.velocityUtilizationPercent, 62, 1e-12, 'SIA-Auslastung wird übernommen.');
equal(sectionPresentation.glossary.length, 5, 'Glossar steht auch im Teilstreckenergebnis bereit.');

const emptyPresentation = createSystemResultPresentation({ sections: [], formParts: [], specialComponents: [] }, {});
check(!emptyPresentation.hasCalculation, 'Leeres System erhält kontrollierten Leerzustand.');
equal(emptyPresentation.criticalSection, null, 'Leeres System besitzt keine kritische Teilstrecke.');
equal(emptyPresentation.rows.length, 0, 'Leeres System besitzt keine Ergebniszeilen.');

// UI-, CSS- und Release-Integration
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const workspace = read('src/ui/components/WorkspaceComponent.js');
const css = read('src/ui/phase52_00.css');
const appHtml = read('app.html');
const main = read('src/main.js');
const version = read('src/core/appVersion.js');
const release = JSON.parse(read('release.json'));
const packageJson = JSON.parse(read('package.json'));
const roadmap = read('ROADMAP.md');
const changelog = read('CHANGELOG.md');

check(workspace.includes('renderSystemResultCockpit'), 'Anlagen-Cockpit ist integriert.');
check(workspace.includes('renderResultViewSwitch'), 'Ansichtsschalter ist integriert.');
check(workspace.includes('renderProfessionalResultPreview'), 'Profi-Schnellkontrolle ist integriert.');
check(workspace.includes('renderTechnicalResultDetails'), 'Technische Anlagendetails sind einklappbar.');
check(workspace.includes('dp-section-technical-details'), 'Technische Teilstreckendetails sind einklappbar.');
check(workspace.includes('data-result-action="open-critical"'), 'Kritische Teilstrecke kann direkt geöffnet werden.');
check(workspace.includes('druckverlust-pro-result-view-mode'), 'Ansichtsmodus wird lokal gespeichert.');
check(workspace.includes('Was bedeuten Δp, λ, ζ, k'), 'Glossar ist sichtbar eingebunden.');
check(css.includes('.dp-result-cockpit'), 'Ergebnis-Cockpit ist gestaltet.');
check(css.includes('.dp-result-view-switch'), 'Ansichtsschalter ist gestaltet.');
check(css.includes('.dp-result-hero-grid'), 'Hauptergebnisse sind als klare Karten gestaltet.');
check(css.includes('.dp-result-breakdown-grid'), 'Verlustarten sind getrennt gestaltet.');
check(css.includes('.dp-technical-results'), 'Technische Details sind gestaltet.');
check(css.includes('@media (max-width: 620px)'), 'Mobile Darstellung ist abgesichert.');
check(appHtml.includes('phase52_00.css?v=52.00&release=53.00'), 'Phase-52-Stylesheet wird cache-sicher geladen.');
check(appHtml.includes('src/main.js?v=53.00&release=53.00'), 'Main-Modul wird mit Phase-52-Kennung geladen.');
check(main.includes('WorkspaceComponent.js?v=53.00&release=53.00'), 'Workspace wird cache-sicher geladen.');
check(version.includes("APP_VERSION = '2.8.0'"), 'App-Version steht auf 2.7.0.');
check(version.includes("APP_RELEASE = '53.00'"), 'Release steht auf Phase 52.00.');
equal(packageJson.version, '2.8.0', 'package.json steht auf Version 2.7.0.');
equal(release.version, '2.8.0', 'release.json steht auf Version 2.7.0.');
equal(release.phase, '53.00', 'release.json steht auf Phase 52.00.');
check(release.quality?.resultPresentationChecks > 0, 'Release-Manifest dokumentiert die Phase-52-Prüfungen.');
check(roadmap.includes('Phase 52.00 – Vereinfachte Ergebnisdarstellung – abgeschlossen'), 'Roadmap markiert Phase 52 als abgeschlossen.');
check(changelog.includes('## 2.7.0 – Phase 52.00'), 'Changelog enthält den Phase-52-Eintrag.');

console.log(`Phase 52.00 vereinfachte Ergebnisdarstellung: ${checks} Prüfungen bestanden.`);
