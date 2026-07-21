#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SIA_OPERATION_MODES,
  SIA_ROOM_USAGES,
  analyzeSystemVelocityCompliance,
  calculateRectangularReductionFactor,
  calculateRoundVelocityLimit,
  evaluateSectionVelocityCompliance,
  getSiaRoomUsage,
  normalizeSiaVelocityConfig,
} from '../src/standards/SiaVelocityCompliance.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import StorageEngine from '../src/storage/StorageEngine.js';
import ReportEngine from '../src/report/ReportEngine.js';

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

// Raum- und Betriebsdaten
check(SIA_ROOM_USAGES.length === 45, 'Alle 45 Raumnutzungen aus Tabelle 13 sind hinterlegt.');
check(SIA_OPERATION_MODES.length === 3, 'Drei Betriebsarten sind hinterlegt.');
const expectedRoomHours = [
  ['1.01', 'Wohnen MFH', 8760, 6440, 5100],
  ['1.02', 'Wohnen EFH', 8760, 6440, 5100],
  ['2.01', 'Hotelzimmer', 7300, 5440, 4330],
  ['2.02', 'Empfang, Lobby', 8760, 4340, 3690],
  ['3.01', 'Einzel-, Gruppenbüro', 3900, 2740, 1780],
  ['3.02', 'Grossraumbüro', 3900, 2740, 1780],
  ['3.03', 'Sitzungszimmer', 3120, 1800, 1090],
  ['3.04', 'Schalterhalle, Empfang', 3900, 2740, 1780],
  ['4.01', 'Schulzimmer', 3585, 2520, 1720],
  ['4.02', 'Lehrerzimmer', 3585, 1450, 1200],
  ['4.03', 'Bibliothek', 3585, 1450, 1200],
  ['4.04', 'Hörsaal', 3585, 2520, 1720],
  ['4.05', 'Schulfachraum (Spezialraum)', 3585, 2520, 1720],
  ['5.01', 'Lebensmittelverkauf', 6260, 3670, 2440],
  ['5.02', 'Fachgeschäft', 6260, 3670, 2440],
  ['5.03', 'Verkauf Möbel, Bau, Garten', 6260, 3670, 2440],
  ['6.01', 'Restaurant', 6260, 3270, 1650],
  ['6.02', 'Selbstbedienungsrestaurant', 3443, 1450, 860],
  ['6.03', 'Küche zu Restaurant', 5947, 3750, 2580],
  ['6.04', 'Küche zu Selbstbedienungsrest.', 4069, 2280, 1470],
  ['7.01', 'Vorstellungsraum', 5008, 3810, 2190],
  ['7.02', 'Mehrzweckhalle', 6260, 4670, 3060],
  ['7.03', 'Ausstellungshalle', 6260, 4670, 3060],
  ['8.01', 'Bettenzimmer', 8760, 8760, 8760],
  ['8.02', 'Stationszimmer', 8760, 5740, 3140],
  ['8.03', 'Behandlungsraum', 4695, 3300, 2140],
  ['9.01', 'Produktion (grobe Arbeit)', 6240, 4090, 3200],
  ['9.02', 'Produktion (feine Arbeit)', 3900, 2740, 1780],
  ['9.03', 'Laborraum', 3900, 2740, 1780],
  ['10.01', 'Lagerhalle', 6240, 4090, 3200],
  ['11.01', 'Turnhalle', 4780, 3410, 2640],
  ['11.02', 'Fitnessraum', 6260, 4470, 3460],
  ['11.03', 'Schwimmhalle', 6260, 4470, 3460],
  ['12.01', 'Verkehrsfläche', 4420, 1610, 920],
  ['12.02', 'Verkehrsfläche 24 h', 6240, 2270, 1150],
  ['12.03', 'Treppenhaus', 4420, 1610, 920],
  ['12.04', 'Nebenraum', 4420, 1610, 920],
  ['12.05', 'Küche, Teeküche', 3900, 1910, 1090],
  ['12.06', 'WC, Bad, Dusche', 3900, 2410, 1380],
  ['12.07', 'WC', 3900, 2410, 1380],
  ['12.08', 'Garderobe, Dusche', 3900, 2410, 1380],
  ['12.09', 'Parkhaus', 5475, 3380, 1930],
  ['12.10', 'Wasch- und Trockenraum', 3900, 2410, 1380],
  ['12.11', 'Kühlraum', 0, 0, 0],
  ['12.12', 'Serverraum', 5475, 3380, 1930],
];
expectedRoomHours.forEach(([code, label, oneStage, twoStage, variable]) => {
  const row = getSiaRoomUsage(code);
  equal(row?.label, label, `${code} Bezeichnung.`);
  equal(row?.hours['one-stage'], oneStage, `${code} 1-stufig.`);
  equal(row?.hours['two-stage'], twoStage, `${code} 2-stufig.`);
  equal(row?.hours.variable, variable, `${code} stufenlos.`);
});
equal(getSiaRoomUsage('4.01')?.label, 'Schulzimmer', 'Schulzimmer ist vorhanden.');
equal(getSiaRoomUsage('4.01')?.hours['one-stage'], 3585, 'Schulzimmer 1-stufig.');
equal(getSiaRoomUsage('4.01')?.hours['two-stage'], 2520, 'Schulzimmer 2-stufig.');
equal(getSiaRoomUsage('4.01')?.hours.variable, 1720, 'Schulzimmer stufenlos.');
equal(getSiaRoomUsage('3.02')?.hours['two-stage'], 2740, 'Grossraumbüro 2-stufig.');
equal(getSiaRoomUsage('8.01')?.hours.variable, 8760, 'Bettenzimmer stufenlos.');
equal(getSiaRoomUsage('12.11')?.hours.variable, 0, 'Kühlraum besitzt 0 Elektro-Vollaststunden.');
equal(getSiaRoomUsage('12.12')?.hours['two-stage'], 3380, 'Serverraum 2-stufig.');

const config = normalizeSiaVelocityConfig({ siaVelocity: { roomUsageCode: '4.01', operationMode: 'two-stage' } });
check(config.complete, 'Vollständige SIA-Konfiguration wird erkannt.');
equal(config.electricalFullLoadHours, 2520, 'Elektro-Vollaststunden werden korrekt abgeleitet.');
check(!normalizeSiaVelocityConfig({}).complete, 'Fehlende Konfiguration bleibt unvollständig.');

// Tabelle 49 – runde Luftleitungen
close(calculateRoundVelocityLimit(40, 1000), 2.5, 1e-12, 'Bis 40 m³/h.');
close(calculateRoundVelocityLimit(41, 8000), 3, 1e-12, 'Über 40 bis 1 000 m³/h.');
close(calculateRoundVelocityLimit(1500, 8000), 3.5, 1e-12, '1 000 bis 2 000 m³/h bei 8 000 h/a.');
close(calculateRoundVelocityLimit(3000, 8000), 4, 1e-12, '2 000 bis 4 000 m³/h bei 8 000 h/a.');
close(calculateRoundVelocityLimit(5800, 2000), 6, 1e-12, '4 000 bis 10 000 m³/h bei 2 000 h/a.');
close(calculateRoundVelocityLimit(5800, 4000), 5.5, 1e-12, '4 000 bis 10 000 m³/h bei 4 000 h/a.');
close(calculateRoundVelocityLimit(5800, 8000), 4.5, 1e-12, '4 000 bis 10 000 m³/h bei 8 000 h/a.');
close(calculateRoundVelocityLimit(11000, 8000), 5, 1e-12, 'Über 10 000 m³/h.');
close(calculateRoundVelocityLimit(5800, 2740), 5.815, 1e-12, 'Normbeispiel wird zwischen 2 000 und 4 000 h/a interpoliert.');
close(calculateRoundVelocityLimit(5800, 6000), 5, 1e-12, 'Interpolation zwischen 4 000 und 8 000 h/a.');
close(calculateRoundVelocityLimit(5800, 9000), 4.5, 1e-12, 'Über 8 000 h/a wird der 8 000-h-Wert verwendet.');
equal(calculateRoundVelocityLimit(5800, 0), null, '0 Vollaststunden ergeben keinen automatischen Grenzwert.');

// Tabelle 50 – Rechteckkanäle
const ratio1 = calculateRectangularReductionFactor(0.5, 0.5);
close(ratio1.factor, 0.941, 1e-12, 'Seitenverhältnis 1:1.');
const ratio5 = calculateRectangularReductionFactor(1, 0.2);
close(ratio5.factor, 0.813, 1e-12, 'Seitenverhältnis 1:5.');
equal(ratio5.ratioLabel, '1:5', 'Seitenverhältnis wird lesbar ausgegeben.');
check(!ratio5.notRecommended, '1:5 liegt noch nicht im grau markierten Bereich.');
const ratio6 = calculateRectangularReductionFactor(1.2, 0.2);
close(ratio6.factor, 0.788, 1e-12, 'Seitenverhältnis 1:6.');
check(ratio6.notRecommended, '1:6 wird als nicht empfohlen markiert.');
const ratio25 = calculateRectangularReductionFactor(1, 0.4);
close(ratio25.factor, 0.895, 1e-12, 'Zwischenwert 1:2,5 wird linear interpoliert.');
const ratio12 = calculateRectangularReductionFactor(1.2, 0.1);
close(ratio12.factor, 0.714, 1e-12, 'Ausserhalb Tabelle 50 wird mit 1:10 begrenzt.');
check(ratio12.outsideTable, 'Seitenverhältnis über 1:10 wird markiert.');
equal(calculateRectangularReductionFactor(0, 0.4).factor, null, 'Fehlende Geometrie wird kontrolliert behandelt.');

// Teilstreckenprüfung
const system = {
  id: 'sia-system',
  name: 'Schulzimmer Zuluft',
  siaVelocity: { roomUsageCode: '4.01', operationMode: 'two-stage' },
  sections: [
    { id: 'pipe-ok', name: 'Rohr OK', type: 'pipe', q: 1500, d: 0.4, l: 5, roughnessMm: 0.15 },
    { id: 'duct-exceeded', name: 'Kanal zu schnell', type: 'duct', q: 5800, b: 1, h: 0.2, l: 5, roughnessMm: 0.15 },
    { id: 'duct-warning', name: 'Kanal 1:6', type: 'duct', q: 1000, b: 1.2, h: 0.2, l: 5, roughnessMm: 0.15 },
  ],
  formParts: [],
  specialComponents: [],
};

const pipeCheck = evaluateSectionVelocityCompliance(system.sections[0], { q: 1500, velocity: 3.2, diameter: 0.4 }, system);
equal(pipeCheck.status, 'ok', 'Rundrohr unter dem Richtwert ist OK.');
close(pipeCheck.maximumVelocityMs, 4, 1e-12, 'Rundrohr verwendet den Tabellenwert direkt.');

const ductCheck = evaluateSectionVelocityCompliance(system.sections[1], { q: 5800, velocity: 5, width: 1, height: 0.2 }, system);
equal(ductCheck.status, 'exceeded', 'Rechteckkanal über dem reduzierten Richtwert wird erkannt.');
close(ductCheck.roundReferenceVelocityMs, 5.87, 1e-12, 'Rund-Richtwert wird aus 2 520 h/a interpoliert.');
close(ductCheck.maximumVelocityMs, 4.772, 1e-12, 'Rechteck-Richtwert enthält Faktor 1:5.');
check(ductCheck.exceedanceMs > 0, 'Überschreitung wird numerisch ausgewiesen.');
check(ductCheck.utilizationPercent > 100, 'Auslastung über 100 % wird ausgewiesen.');

const warningCheck = evaluateSectionVelocityCompliance(system.sections[2], { q: 1000, velocity: 2, width: 1.2, height: 0.2 }, system);
equal(warningCheck.status, 'warning', 'Nicht empfohlenes Seitenverhältnis wird als Prüffall markiert.');
check(warningCheck.warnings.some(message => message.includes('1:6')), 'Warntext nennt das Seitenverhältnis.');

const missingCheck = evaluateSectionVelocityCompliance(system.sections[0], { q: 1500, velocity: 3.2 }, { sections: [] });
equal(missingCheck.status, 'not-configured', 'Fehlende Anlagenvorgaben werden erkannt.');

const zeroHoursSystem = { ...system, siaVelocity: { roomUsageCode: '12.11', operationMode: 'variable' } };
const zeroHoursCheck = evaluateSectionVelocityCompliance(system.sections[0], { q: 1500, velocity: 3.2 }, zeroHoursSystem);
equal(zeroHoursCheck.status, 'not-applicable', '0 Elektro-Vollaststunden ergeben keine Scheinprüfung.');

const calculation = ProjectCalculationService.calculate({
  id: 'project-sia',
  name: 'SIA-Test',
  settings: { rho: 1.21, defaultRoughnessMm: 0.15, kinematicViscosity: 0.0000151, sectionRoundingStep: 0.5 },
  systems: [system],
}, system.id);
check(calculation.velocityCompliance, 'Berechnungsergebnis enthält die SIA-Geschwindigkeitsprüfung.');
equal(calculation.velocityCompliance.summary.total, 3, 'Alle Teilstrecken werden geprüft.');
check(calculation.velocityCompliance.summary.exceeded >= 1, 'Mindestens eine Überschreitung wird zusammengefasst.');
check(calculation.quality.warnings.some(message => message.includes('SIA-Richtwert')), 'Überschreitung erscheint in der QS.');

const directAnalysis = analyzeSystemVelocityCompliance(system, calculation.calculation);
equal(directAnalysis.summary.status, 'critical', 'Anlagenstatus wird bei Überschreitung kritisch.');
check(directAnalysis.disclaimer.includes('kritische Strang'), 'Normhinweis zum kritischen Strang ist vorhanden.');

// Speicherung und Bericht
const project = {
  id: 'project-sia',
  name: 'SIA-Test',
  object: 'Schule',
  author: 'Test',
  settings: { rho: 1.21, defaultRoughnessMm: 0.15, kinematicViscosity: 0.0000151, sectionRoundingStep: 0.5 },
  systems: [system],
};
project.calculationResult = ProjectCalculationService.calculate(project, system.id);
const serialized = StorageEngine.serialize(project);
const restored = StorageEngine.parse(serialized);
equal(restored.systems[0].siaVelocity.roomUsageCode, '4.01', 'Raumnutzung bleibt im .dvp-Roundtrip erhalten.');
equal(restored.systems[0].siaVelocity.operationMode, 'two-stage', 'Betriebsart bleibt im .dvp-Roundtrip erhalten.');

restored.calculationResult = ProjectCalculationService.calculate(restored, restored.systems[0].id);
const report = ReportEngine.createReportModel(restored, { system: restored.systems[0] });
equal(report.system.roomUsage, '4.01 Schulzimmer', 'Bericht übernimmt die Raumnutzung.');
equal(report.system.operationMode, '2-stufig', 'Bericht übernimmt die Betriebsart.');
equal(report.system.electricalFullLoadHours, 2520, 'Bericht übernimmt die Elektro-Vollaststunden.');
check(report.velocityCompliance?.summary?.total === 3, 'Berichtmodell enthält alle Geschwindigkeitsprüfungen.');
check(report.sections.every(row => row.siaVelocity), 'Berichtsteilstrecken enthalten ihren SIA-Prüfwert.');

// UI- und Release-Integration
const workspace = fs.readFileSync(new URL('../src/ui/components/WorkspaceComponent.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/ui/phase51_20.css', import.meta.url), 'utf8');
const appHtml = fs.readFileSync(new URL('../app.html', import.meta.url), 'utf8');
const storage = fs.readFileSync(new URL('../src/storage/StorageEngine.js', import.meta.url), 'utf8');
const reportSource = fs.readFileSync(new URL('../src/report/ReportEngine.js', import.meta.url), 'utf8');
check(workspace.includes('renderSiaVelocityCompliancePanel'), 'Anlagenübersicht enthält das SIA-Prüfpanel.');
check(workspace.includes('renderSectionSiaVelocityCard'), 'Teilstrecke enthält die SIA-Prüfkarte.');
check(workspace.includes('data-sia-velocity-field="roomUsageCode"'), 'Raumnutzung ist auswählbar.');
check(workspace.includes('data-sia-velocity-field="operationMode"'), 'Betriebsart ist auswählbar.');
check(workspace.includes('data-system-sia-field="roomUsageCode"'), 'Anlagenmanager enthält die Raumnutzung.');
check(css.includes('.dp-sia-velocity-panel'), 'SIA-Anlagenpanel ist gestaltet.');
check(css.includes('.dp-section-sia-card'), 'SIA-Teilstreckenkarten sind gestaltet.');
check(appHtml.includes('phase51_20.css?v=51.20'), 'Phase-51.20-Stylesheet wird geladen.');
check(storage.includes('system.siaVelocity = {'), 'Speichermigration normalisiert die SIA-Vorgaben.');
check(reportSource.includes('SIA-Geschwindigkeitsstatus'), 'Bericht weist den SIA-Prüfstatus aus.');
check(reportSource.includes('report-sia-inline'), 'Teilstreckentabelle zeigt den SIA-Grenzwert direkt bei der Geschwindigkeit.');
check(reportSource.includes('SIA max v m/s') && reportSource.includes('SIA Faktor'), 'CSV-Export enthält SIA-Grenzwert und Reduktionsfaktor.');
check(reportSource.includes('<strong>SIA ≤</strong>'), 'Berichtslegende erklärt den SIA-Grenzwert.');

console.log(`Phase 51.20 SIA-Geschwindigkeitsprüfung: ${checks} Prüfungen bestanden.`);
