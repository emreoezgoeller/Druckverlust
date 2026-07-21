// Druckverlust Pro – Phase 52.00
// Erstellt eine kompakte, fachlich eindeutige Ergebnisdarstellung für Anlage und Teilstrecke.

export const RESULT_VIEW_MODES = Object.freeze([
  Object.freeze({ id: 'standard', label: 'Standard', description: 'Nur die wichtigsten Ergebnisse und Prüfpunkte.' }),
  Object.freeze({ id: 'professional', label: 'Profi', description: 'Zusätzliche technische Kennwerte und Tabellen.' }),
]);

export const RESULT_GLOSSARY = Object.freeze([
  Object.freeze({ symbol: 'Δp', term: 'Druckverlust', explanation: 'Druckabfall einer Teilstrecke oder Anlage in Pascal (Pa).' }),
  Object.freeze({ symbol: 'λ', term: 'Reibungszahl', explanation: 'Dimensionslose Darcy-Reibungszahl für den geraden Kanal- oder Rohrabschnitt.' }),
  Object.freeze({ symbol: 'ζ', term: 'Widerstandsbeiwert', explanation: 'Dimensionsloser Kennwert eines Formteils; zusammen mit dem dynamischen Druck ergibt er den Formteilverlust.' }),
  Object.freeze({ symbol: 'k', term: 'Rauigkeit', explanation: 'Innere Oberflächenrauigkeit des Kanals oder Rohrs in Millimeter.' }),
  Object.freeze({ symbol: 'p_dyn', term: 'Dynamischer Druck', explanation: 'Geschwindigkeitsdruck der Luft und Bezugsgrösse für ζ-Verluste.' }),
]);

const asNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const firstDefined = (...values) => values.find(value => value !== undefined && value !== null);

export function normalizeResultViewMode(value, fallback = 'standard') {
  const normalized = String(value || '').trim().toLowerCase();
  return RESULT_VIEW_MODES.some(mode => mode.id === normalized) ? normalized : fallback;
}

function resolveSectionResult(calculation = {}, section = {}) {
  const results = calculation?.results || [];
  const sectionId = section?.id;
  return results.find(item => item?.id === sectionId || item?.input?.id === sectionId) || null;
}

function countAssignedFormParts(system = {}, sectionId = '') {
  return (system?.formParts || []).filter(part => String(part?.sectionId || '') === String(sectionId || '')).length;
}

export function createSectionPresentationRow(section = {}, item = null, systemTotal = 0, formPartCount = 0) {
  const result = item?.result || {};
  const frictionLoss = asNumber(result.frictionLoss);
  const zetaLoss = asNumber(result.zetaLoss);
  const directLoss = asNumber(firstDefined(result.directFormPartLoss, item?.directFormPartLoss));
  const formPartLoss = zetaLoss + directLoss;
  const totalLoss = asNumber(firstDefined(result.roundedTotalLoss, result.totalLoss, frictionLoss + formPartLoss));
  const divisor = Math.abs(asNumber(systemTotal));

  return {
    id: section?.id || item?.id || item?.input?.id || '',
    name: String(firstDefined(section?.name, section?.ts, section?.sectionNo, item?.input?.name, item?.id, 'Teilstrecke')),
    airflowM3h: asNumber(firstDefined(result.q, section?.q, section?.volumeFlow, section?.airVolume, item?.input?.q)),
    velocityMs: asNumber(result.velocity),
    dynamicPressurePa: asNumber(result.dynamicPressure),
    roughnessMm: asNumber(firstDefined(result.roughnessMm, section?.roughnessMm), 0.15),
    frictionFactor: asNumber(firstDefined(result.frictionFactor, result.lambda)),
    reynoldsNumber: asNumber(result.reynoldsNumber),
    frictionRatePaM: asNumber(result.frictionRate),
    frictionLossPa: frictionLoss,
    zetaLossPa: zetaLoss,
    directLossPa: directLoss,
    formPartLossPa: formPartLoss,
    totalLossPa: totalLoss,
    systemSharePercent: divisor > 0 ? Math.abs(totalLoss) / divisor * 100 : 0,
    formPartCount: Math.max(0, Math.trunc(asNumber(formPartCount))),
    warnings: [...new Set((result?.warnings || []).map(message => String(message || '').trim()).filter(Boolean))],
  };
}

export function createSystemResultPresentation(system = {}, calculation = {}, options = {}) {
  const sections = system?.sections || [];
  const totals = calculation?.totals || {};
  const rawRows = sections.map(section => {
    const item = resolveSectionResult(calculation, section);
    if (!item?.result) return null;
    return createSectionPresentationRow(
      section,
      item,
      firstDefined(totals.totalRounded, totals.total, 0),
      countAssignedFormParts(system, section?.id),
    );
  }).filter(Boolean);

  const frictionLossPa = asNumber(totals.friction, rawRows.reduce((sum, row) => sum + row.frictionLossPa, 0));
  const zetaLossPa = asNumber(totals.zetaLoss, rawRows.reduce((sum, row) => sum + row.zetaLossPa, 0));
  const directLossPa = asNumber(totals.directFormPartLoss, rawRows.reduce((sum, row) => sum + row.directLossPa, 0));
  const formPartLossPa = zetaLossPa + directLossPa;
  const specialLossPa = asNumber(totals.special);
  const totalRawPa = asNumber(firstDefined(totals.total, frictionLossPa + formPartLossPa + specialLossPa));
  const totalRoundedPa = asNumber(firstDefined(totals.totalRounded, totalRawPa));
  const denominator = Math.abs(totalRoundedPa) || Math.abs(totalRawPa) || 0;
  const shareOf = value => denominator > 0 ? Math.abs(asNumber(value)) / denominator * 100 : 0;

  const rows = rawRows.map(row => ({
    ...row,
    systemSharePercent: denominator > 0 ? Math.abs(row.totalLossPa) / denominator * 100 : 0,
  }));

  const criticalSection = rows.length
    ? rows.reduce((current, row) => row.totalLossPa > current.totalLossPa ? row : current, rows[0])
    : null;

  const sortedSections = [...rows].sort((left, right) => right.totalLossPa - left.totalLossPa);
  const velocitySummary = options?.velocityCompliance?.summary || {};
  const quality = options?.quality || {};

  return {
    hasCalculation: rows.length > 0 || Boolean(totalRawPa || totalRoundedPa || specialLossPa),
    totals: {
      frictionLossPa,
      zetaLossPa,
      directLossPa,
      formPartLossPa,
      specialLossPa,
      totalRawPa,
      totalRoundedPa,
      shares: {
        friction: shareOf(frictionLossPa),
        formParts: shareOf(formPartLossPa),
        special: shareOf(specialLossPa),
      },
    },
    counts: {
      sections: sections.length,
      calculatedSections: rows.length,
      formParts: (system?.formParts || []).length,
      specialComponents: (system?.specialComponents || []).length,
    },
    rows,
    topSections: sortedSections.slice(0, 5),
    criticalSection,
    velocity: {
      status: String(velocitySummary.status || 'not-configured'),
      checked: asNumber(velocitySummary.checked),
      total: asNumber(velocitySummary.total, sections.length),
      exceeded: asNumber(velocitySummary.exceeded),
      warnings: asNumber(velocitySummary.warnings),
    },
    quality: {
      errors: Array.isArray(quality?.errors) ? quality.errors.length : asNumber(quality?.errors),
      warnings: Array.isArray(quality?.warnings) ? quality.warnings.length : asNumber(quality?.warnings),
    },
    glossary: RESULT_GLOSSARY,
  };
}

export function createSectionResultPresentation(section = {}, item = null, options = {}) {
  const row = createSectionPresentationRow(
    section,
    item,
    options?.systemTotalPa || 0,
    options?.formPartCount || 0,
  );

  const velocityCheck = options?.velocityCheck || {};
  return {
    ...row,
    velocityStatus: String(velocityCheck?.status || 'not-configured'),
    maximumVelocityMs: velocityCheck?.maximumVelocityMs === null || velocityCheck?.maximumVelocityMs === undefined
      ? null
      : asNumber(velocityCheck.maximumVelocityMs),
    velocityUtilizationPercent: velocityCheck?.utilizationPercent === null || velocityCheck?.utilizationPercent === undefined
      ? null
      : asNumber(velocityCheck.utilizationPercent),
    glossary: RESULT_GLOSSARY,
  };
}
