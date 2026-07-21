// Druckverlust Pro – SIA-Geschwindigkeitsprüfung
// Grundlage: vom Anwender bereitgestellte Auszüge aus
// - SIA 2024:2021, Tabelle 13 (Vollaststunden Lüftung)
// - SIA 382/1:2025, Tabellen 49 und 50 (Richtwerte Luftgeschwindigkeit)
//
// Die Prüfung ist eine planerische Vorprüfung. Bei verzweigten Netzen gelten die
// Richtwerte gemäss Normauszug im kritischen Strang; untergeordnete Stränge sind
// zusätzlich hinsichtlich Druckniveau und Schallanforderungen zu beurteilen.

export const SIA_VELOCITY_SOURCE = Object.freeze({
  roomUsage: 'SIA 2024:2021 · Tabelle 13',
  roundVelocity: 'SIA 382/1:2025 · Tabelle 49',
  rectangularReduction: 'SIA 382/1:2025 · Tabelle 50',
});

export const SIA_VELOCITY_DISCLAIMER = 'Vorprüfung aller Teilstrecken. Bei verzweigten Netzen ist der kritische Strang massgebend; untergeordnete Stränge sind zusätzlich bezüglich Druckniveau und Schall zu beurteilen.';

export const SIA_OPERATION_MODES = Object.freeze([
  Object.freeze({ id: 'one-stage', label: '1-stufig' }),
  Object.freeze({ id: 'two-stage', label: '2-stufig' }),
  Object.freeze({ id: 'variable', label: 'stufenlos' }),
]);

// Es werden bewusst nur die für Tabelle 49 benötigten Elektro-Vollaststunden
// hinterlegt. Die übrigen Betriebsstunden aus Tabelle 13 sind für diese Prüfung
// nicht erforderlich.
export const SIA_ROOM_USAGES = Object.freeze([
  { code: '1.01', label: 'Wohnen MFH', hours: { 'one-stage': 8760, 'two-stage': 6440, variable: 5100 } },
  { code: '1.02', label: 'Wohnen EFH', hours: { 'one-stage': 8760, 'two-stage': 6440, variable: 5100 } },
  { code: '2.01', label: 'Hotelzimmer', hours: { 'one-stage': 7300, 'two-stage': 5440, variable: 4330 } },
  { code: '2.02', label: 'Empfang, Lobby', hours: { 'one-stage': 8760, 'two-stage': 4340, variable: 3690 } },
  { code: '3.01', label: 'Einzel-, Gruppenbüro', hours: { 'one-stage': 3900, 'two-stage': 2740, variable: 1780 } },
  { code: '3.02', label: 'Grossraumbüro', hours: { 'one-stage': 3900, 'two-stage': 2740, variable: 1780 } },
  { code: '3.03', label: 'Sitzungszimmer', hours: { 'one-stage': 3120, 'two-stage': 1800, variable: 1090 } },
  { code: '3.04', label: 'Schalterhalle, Empfang', hours: { 'one-stage': 3900, 'two-stage': 2740, variable: 1780 } },
  { code: '4.01', label: 'Schulzimmer', hours: { 'one-stage': 3585, 'two-stage': 2520, variable: 1720 } },
  { code: '4.02', label: 'Lehrerzimmer', hours: { 'one-stage': 3585, 'two-stage': 1450, variable: 1200 } },
  { code: '4.03', label: 'Bibliothek', hours: { 'one-stage': 3585, 'two-stage': 1450, variable: 1200 } },
  { code: '4.04', label: 'Hörsaal', hours: { 'one-stage': 3585, 'two-stage': 2520, variable: 1720 } },
  { code: '4.05', label: 'Schulfachraum (Spezialraum)', hours: { 'one-stage': 3585, 'two-stage': 2520, variable: 1720 } },
  { code: '5.01', label: 'Lebensmittelverkauf', hours: { 'one-stage': 6260, 'two-stage': 3670, variable: 2440 } },
  { code: '5.02', label: 'Fachgeschäft', hours: { 'one-stage': 6260, 'two-stage': 3670, variable: 2440 } },
  { code: '5.03', label: 'Verkauf Möbel, Bau, Garten', hours: { 'one-stage': 6260, 'two-stage': 3670, variable: 2440 } },
  { code: '6.01', label: 'Restaurant', hours: { 'one-stage': 6260, 'two-stage': 3270, variable: 1650 } },
  { code: '6.02', label: 'Selbstbedienungsrestaurant', hours: { 'one-stage': 3443, 'two-stage': 1450, variable: 860 } },
  { code: '6.03', label: 'Küche zu Restaurant', hours: { 'one-stage': 5947, 'two-stage': 3750, variable: 2580 } },
  { code: '6.04', label: 'Küche zu Selbstbedienungsrest.', hours: { 'one-stage': 4069, 'two-stage': 2280, variable: 1470 } },
  { code: '7.01', label: 'Vorstellungsraum', hours: { 'one-stage': 5008, 'two-stage': 3810, variable: 2190 } },
  { code: '7.02', label: 'Mehrzweckhalle', hours: { 'one-stage': 6260, 'two-stage': 4670, variable: 3060 } },
  { code: '7.03', label: 'Ausstellungshalle', hours: { 'one-stage': 6260, 'two-stage': 4670, variable: 3060 } },
  { code: '8.01', label: 'Bettenzimmer', hours: { 'one-stage': 8760, 'two-stage': 8760, variable: 8760 } },
  { code: '8.02', label: 'Stationszimmer', hours: { 'one-stage': 8760, 'two-stage': 5740, variable: 3140 } },
  { code: '8.03', label: 'Behandlungsraum', hours: { 'one-stage': 4695, 'two-stage': 3300, variable: 2140 } },
  { code: '9.01', label: 'Produktion (grobe Arbeit)', hours: { 'one-stage': 6240, 'two-stage': 4090, variable: 3200 } },
  { code: '9.02', label: 'Produktion (feine Arbeit)', hours: { 'one-stage': 3900, 'two-stage': 2740, variable: 1780 } },
  { code: '9.03', label: 'Laborraum', hours: { 'one-stage': 3900, 'two-stage': 2740, variable: 1780 } },
  { code: '10.01', label: 'Lagerhalle', hours: { 'one-stage': 6240, 'two-stage': 4090, variable: 3200 } },
  { code: '11.01', label: 'Turnhalle', hours: { 'one-stage': 4780, 'two-stage': 3410, variable: 2640 } },
  { code: '11.02', label: 'Fitnessraum', hours: { 'one-stage': 6260, 'two-stage': 4470, variable: 3460 } },
  { code: '11.03', label: 'Schwimmhalle', hours: { 'one-stage': 6260, 'two-stage': 4470, variable: 3460 } },
  { code: '12.01', label: 'Verkehrsfläche', hours: { 'one-stage': 4420, 'two-stage': 1610, variable: 920 } },
  { code: '12.02', label: 'Verkehrsfläche 24 h', hours: { 'one-stage': 6240, 'two-stage': 2270, variable: 1150 } },
  { code: '12.03', label: 'Treppenhaus', hours: { 'one-stage': 4420, 'two-stage': 1610, variable: 920 } },
  { code: '12.04', label: 'Nebenraum', hours: { 'one-stage': 4420, 'two-stage': 1610, variable: 920 } },
  { code: '12.05', label: 'Küche, Teeküche', hours: { 'one-stage': 3900, 'two-stage': 1910, variable: 1090 } },
  { code: '12.06', label: 'WC, Bad, Dusche', hours: { 'one-stage': 3900, 'two-stage': 2410, variable: 1380 } },
  { code: '12.07', label: 'WC', hours: { 'one-stage': 3900, 'two-stage': 2410, variable: 1380 } },
  { code: '12.08', label: 'Garderobe, Dusche', hours: { 'one-stage': 3900, 'two-stage': 2410, variable: 1380 } },
  { code: '12.09', label: 'Parkhaus', hours: { 'one-stage': 5475, 'two-stage': 3380, variable: 1930 } },
  { code: '12.10', label: 'Wasch- und Trockenraum', hours: { 'one-stage': 3900, 'two-stage': 2410, variable: 1380 } },
  { code: '12.11', label: 'Kühlraum', hours: { 'one-stage': 0, 'two-stage': 0, variable: 0 } },
  { code: '12.12', label: 'Serverraum', hours: { 'one-stage': 5475, 'two-stage': 3380, variable: 1930 } },
].map(item => Object.freeze({ ...item, hours: Object.freeze({ ...item.hours }) })));

const ROUND_VELOCITY_BANDS = Object.freeze([
  Object.freeze({ maxAirflow: 40, values: Object.freeze([2.5, 2.5, 2.5]) }),
  Object.freeze({ maxAirflow: 1000, values: Object.freeze([3, 3, 3]) }),
  Object.freeze({ maxAirflow: 2000, values: Object.freeze([4, 4, 3.5]) }),
  Object.freeze({ maxAirflow: 4000, values: Object.freeze([5, 5, 4]) }),
  Object.freeze({ maxAirflow: 10000, values: Object.freeze([6, 5.5, 4.5]) }),
  Object.freeze({ maxAirflow: Number.POSITIVE_INFINITY, values: Object.freeze([7, 6, 5]) }),
]);

const RECTANGULAR_REDUCTION_FACTORS = Object.freeze([
  0,
  0.941,
  0.914,
  0.876,
  0.842,
  0.813,
  0.788,
  0.766,
  0.746,
  0.729,
  0.714,
]);

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
}

function normalizeSectionType(section = {}) {
  const type = String(section.type || section.kind || '').toLowerCase();
  if (['pipe', 'rohr', 'round', 'rund', 'rundrohr'].includes(type)) return 'pipe';
  return 'duct';
}

function linearInterpolate(x, x1, y1, x2, y2) {
  if (x2 === x1) return y1;
  const share = (x - x1) / (x2 - x1);
  return y1 + (y2 - y1) * share;
}

export function getSiaRoomUsage(code = '') {
  return SIA_ROOM_USAGES.find(item => item.code === String(code || '').trim()) || null;
}

export function getSiaOperationMode(modeId = '') {
  return SIA_OPERATION_MODES.find(item => item.id === String(modeId || '').trim()) || null;
}

export function normalizeSiaVelocityConfig(system = {}) {
  const source = system?.siaVelocity && typeof system.siaVelocity === 'object'
    ? system.siaVelocity
    : {};
  const roomUsageCode = String(source.roomUsageCode ?? system.siaRoomUsageCode ?? '').trim();
  const operationMode = String(source.operationMode ?? system.siaOperationMode ?? '').trim();
  const roomUsage = getSiaRoomUsage(roomUsageCode);
  const mode = getSiaOperationMode(operationMode);
  const electricalFullLoadHours = roomUsage && mode
    ? toNumber(roomUsage.hours[mode.id], 0)
    : null;

  return {
    roomUsageCode,
    operationMode,
    roomUsage,
    mode,
    electricalFullLoadHours,
    complete: Boolean(roomUsage && mode),
  };
}

export function createSiaVelocityConfig(system = {}) {
  const normalized = normalizeSiaVelocityConfig(system);
  return {
    roomUsageCode: normalized.roomUsageCode,
    operationMode: normalized.operationMode,
  };
}

export function calculateRoundVelocityLimit(airflowM3h, electricalFullLoadHours) {
  const airflow = toNumber(airflowM3h, 0);
  const hours = toNumber(electricalFullLoadHours, 0);
  if (airflow <= 0 || hours <= 0) return null;

  const band = ROUND_VELOCITY_BANDS.find(item => airflow <= item.maxAirflow) || ROUND_VELOCITY_BANDS.at(-1);
  const [at2000, at4000, at8000] = band.values;

  if (hours <= 2000) return round(at2000, 3);
  if (hours <= 4000) return round(linearInterpolate(hours, 2000, at2000, 4000, at4000), 3);
  if (hours <= 8000) return round(linearInterpolate(hours, 4000, at4000, 8000, at8000), 3);
  return round(at8000, 3);
}

export function calculateRectangularReductionFactor(widthM, heightM) {
  const width = toNumber(widthM, 0);
  const height = toNumber(heightM, 0);
  if (width <= 0 || height <= 0) {
    return {
      factor: null,
      aspectRatio: null,
      ratioLabel: '-',
      notRecommended: false,
      outsideTable: false,
    };
  }

  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  const outsideTable = aspectRatio > 10;
  const evaluationRatio = Math.min(10, Math.max(1, aspectRatio));
  const lower = Math.floor(evaluationRatio);
  const upper = Math.ceil(evaluationRatio);
  const lowerFactor = RECTANGULAR_REDUCTION_FACTORS[lower];
  const upperFactor = RECTANGULAR_REDUCTION_FACTORS[upper];
  const factor = lower === upper
    ? lowerFactor
    : linearInterpolate(evaluationRatio, lower, lowerFactor, upper, upperFactor);

  return {
    factor: round(factor, 4),
    aspectRatio: round(aspectRatio, 3),
    ratioLabel: `1:${round(aspectRatio, aspectRatio < 10 ? 2 : 1)}`,
    notRecommended: aspectRatio >= 6 - 1e-9,
    outsideTable,
  };
}

function findCalculationResult(calculation = {}, sectionId = '') {
  const item = (calculation?.results || []).find(row => (row?.id || row?.input?.id) === sectionId);
  return item?.result || null;
}

export function evaluateSectionVelocityCompliance(section = {}, result = {}, system = {}) {
  const config = normalizeSiaVelocityConfig(system);
  const name = String(section.name || section.id || 'Teilstrecke');
  const type = normalizeSectionType(section);
  const airflow = toNumber(result.q ?? section.q ?? section.volumeFlow ?? section.airVolume, 0);
  const actualVelocity = toNumber(result.velocity, 0);
  const warnings = [];

  const base = {
    sectionId: section.id || null,
    name,
    type,
    typeLabel: type === 'pipe' ? 'Rundrohr' : 'Rechteckkanal',
    airflowM3h: airflow,
    actualVelocityMs: actualVelocity,
    electricalFullLoadHours: config.electricalFullLoadHours,
    roundReferenceVelocityMs: null,
    reductionFactor: type === 'pipe' ? 1 : null,
    aspectRatio: type === 'pipe' ? null : 0,
    aspectRatioLabel: type === 'pipe' ? '-' : '-',
    maximumVelocityMs: null,
    utilizationPercent: null,
    exceedanceMs: null,
    status: 'not-applicable',
    isCompliant: null,
    warnings,
  };

  if (!config.complete) {
    return {
      ...base,
      status: 'not-configured',
      warnings: ['Raumnutzung und Betriebsart der Anlage auswählen.'],
    };
  }

  if (config.electricalFullLoadHours <= 0) {
    return {
      ...base,
      status: 'not-applicable',
      warnings: ['Für diese Raumnutzung sind 0 Elektro-Vollaststunden hinterlegt; keine automatische Geschwindigkeitsgrenze verfügbar.'],
    };
  }

  if (airflow <= 0 || actualVelocity <= 0) {
    return {
      ...base,
      status: 'not-applicable',
      warnings: ['Luftmenge oder gültige Geometrie fehlt.'],
    };
  }

  const roundReferenceVelocityMs = calculateRoundVelocityLimit(airflow, config.electricalFullLoadHours);
  if (!roundReferenceVelocityMs) return base;

  let reductionFactor = 1;
  let aspectRatio = null;
  let aspectRatioLabel = '-';
  let notRecommended = false;
  let outsideTable = false;

  if (type === 'duct') {
    const reduction = calculateRectangularReductionFactor(
      result.width ?? section.b ?? section.width,
      result.height ?? section.h ?? section.height
    );
    reductionFactor = reduction.factor;
    aspectRatio = reduction.aspectRatio;
    aspectRatioLabel = reduction.ratioLabel;
    notRecommended = reduction.notRecommended;
    outsideTable = reduction.outsideTable;

    if (!reductionFactor) {
      return {
        ...base,
        roundReferenceVelocityMs,
        warnings: ['Breite/Höhe fehlen; Reduktionsfaktor kann nicht bestimmt werden.'],
      };
    }

    if (notRecommended) warnings.push(`Seitenverhältnis ${aspectRatioLabel} liegt im nicht empfohlenen Bereich ab 1:6.`);
    if (outsideTable) warnings.push(`Seitenverhältnis ${aspectRatioLabel} liegt ausserhalb Tabelle 50; Grenzwert wurde vorsichtig mit 1:10 begrenzt.`);
  }

  const maximumVelocityMs = round(roundReferenceVelocityMs * reductionFactor, 3);
  const exceedanceMs = round(actualVelocity - maximumVelocityMs, 3);
  const utilizationPercent = maximumVelocityMs > 0 ? round((actualVelocity / maximumVelocityMs) * 100, 1) : null;
  const exceeded = exceedanceMs > 0.001;

  if (exceeded) warnings.unshift(`Geschwindigkeit ${round(actualVelocity, 2)} m/s überschreitet den Richtwert ${round(maximumVelocityMs, 2)} m/s.`);

  return {
    ...base,
    roundReferenceVelocityMs,
    reductionFactor: round(reductionFactor, 4),
    aspectRatio,
    aspectRatioLabel,
    maximumVelocityMs,
    utilizationPercent,
    exceedanceMs: exceeded ? exceedanceMs : 0,
    status: exceeded ? 'exceeded' : warnings.length ? 'warning' : 'ok',
    isCompliant: !exceeded,
    warnings,
  };
}

export function analyzeSystemVelocityCompliance(system = {}, calculation = {}) {
  const config = normalizeSiaVelocityConfig(system);
  const rows = (system.sections || []).map(section => evaluateSectionVelocityCompliance(
    section,
    findCalculationResult(calculation, section.id) || {},
    system
  ));

  const checkedRows = rows.filter(row => ['ok', 'warning', 'exceeded'].includes(row.status));
  const exceededRows = rows.filter(row => row.status === 'exceeded');
  const warningRows = rows.filter(row => row.status === 'warning');
  const notApplicableRows = rows.filter(row => row.status === 'not-applicable');
  const maxUtilizationPercent = checkedRows.length
    ? Math.max(...checkedRows.map(row => toNumber(row.utilizationPercent, 0)))
    : 0;

  const status = !config.complete
    ? 'not-configured'
    : exceededRows.length
      ? 'critical'
      : warningRows.length
        ? 'warning'
        : checkedRows.length
          ? 'ok'
          : 'not-applicable';

  const messages = [];
  if (!config.roomUsage) messages.push('Raumnutzung nach SIA 2024 auswählen.');
  if (!config.mode) messages.push('Betriebsart 1-stufig, 2-stufig oder stufenlos auswählen.');
  exceededRows.forEach(row => messages.push(`${row.name}: ${round(row.actualVelocityMs, 2)} m/s > ${round(row.maximumVelocityMs, 2)} m/s SIA-Richtwert.`));
  warningRows.forEach(row => row.warnings.forEach(message => messages.push(`${row.name}: ${message}`)));

  return {
    source: SIA_VELOCITY_SOURCE,
    disclaimer: SIA_VELOCITY_DISCLAIMER,
    config,
    rows,
    summary: {
      status,
      total: rows.length,
      checked: checkedRows.length,
      compliant: checkedRows.filter(row => row.isCompliant).length,
      exceeded: exceededRows.length,
      warnings: warningRows.length,
      notApplicable: notApplicableRows.length,
      maxUtilizationPercent: round(maxUtilizationPercent, 1),
    },
    messages: [...new Set(messages)],
  };
}

export default {
  SIA_OPERATION_MODES,
  SIA_ROOM_USAGES,
  SIA_VELOCITY_SOURCE,
  SIA_VELOCITY_DISCLAIMER,
  getSiaRoomUsage,
  getSiaOperationMode,
  normalizeSiaVelocityConfig,
  createSiaVelocityConfig,
  calculateRoundVelocityLimit,
  calculateRectangularReductionFactor,
  evaluateSectionVelocityCompliance,
  analyzeSystemVelocityCompliance,
};
