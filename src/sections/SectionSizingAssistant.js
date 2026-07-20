// Druckverlust Pro – Phase 49.00
// Herstellerneutraler Assistent für eine schnelle, sichere Kanal-/Rohrdimensionierung.

export const DEFAULT_TARGET_VELOCITY_MS = 3;
export const MIN_TARGET_VELOCITY_MS = 0.5;
export const MAX_TARGET_VELOCITY_MS = 12;
export const MAX_RECTANGULAR_ASPECT_RATIO = 4;

export const ROUND_STANDARD_DIAMETERS_MM = Object.freeze([
  80, 100, 125, 140, 150, 160, 180, 200, 224, 250, 280, 300, 315, 355,
  400, 450, 500, 560, 600, 630, 710, 800, 900, 1000, 1120, 1250, 1400,
  1600, 1800, 2000,
]);

export const RECTANGULAR_STANDARD_DIMENSIONS_MM = Object.freeze([
  100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
  800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800, 2000, 2250, 2500,
]);

function finiteNumber(value, fallback = 0) {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeTargetVelocity(value, fallback = DEFAULT_TARGET_VELOCITY_MS) {
  const normalizedFallback = Math.min(
    MAX_TARGET_VELOCITY_MS,
    Math.max(MIN_TARGET_VELOCITY_MS, finiteNumber(fallback, DEFAULT_TARGET_VELOCITY_MS)),
  );
  const candidate = finiteNumber(value, normalizedFallback);
  return Math.min(MAX_TARGET_VELOCITY_MS, Math.max(MIN_TARGET_VELOCITY_MS, candidate));
}

export function getSectionAirflowM3h(section = {}) {
  return Math.max(0, finiteNumber(
    section?.q ?? section?.volumeFlow ?? section?.airVolume ?? section?.volumeFlowM3h,
    0,
  ));
}

export function dimensionToMetres(value) {
  const dimension = Math.max(0, finiteNumber(value, 0));
  // Historische Dateien konnten Kanalmasse in mm speichern. Im aktuellen Modell sind es Meter.
  return dimension >= 10 ? dimension / 1000 : dimension;
}

export function dimensionToMillimetres(value) {
  const dimension = Math.max(0, finiteNumber(value, 0));
  return dimension >= 10 ? dimension : dimension * 1000;
}

export function isPipeSection(section = {}) {
  const type = String(section?.type || section?.kind || '').toLowerCase();
  return ['pipe', 'rohr', 'round', 'rund', 'rundrohr'].includes(type);
}

export function getSectionAreaM2(section = {}) {
  if (isPipeSection(section)) {
    const diameter = dimensionToMetres(section?.d ?? section?.diameter);
    return diameter > 0 ? (Math.PI * diameter ** 2) / 4 : 0;
  }

  const width = dimensionToMetres(section?.b ?? section?.width);
  const height = dimensionToMetres(section?.h ?? section?.height);
  return width > 0 && height > 0 ? width * height : 0;
}

export function calculateSectionVelocityMs(section = {}) {
  const airflowM3s = getSectionAirflowM3h(section) / 3600;
  const areaM2 = getSectionAreaM2(section);
  return airflowM3s > 0 && areaM2 > 0 ? airflowM3s / areaM2 : 0;
}

function createRoundCandidates(requiredAreaM2, airflowM3s, targetVelocityMs) {
  const candidates = ROUND_STANDARD_DIAMETERS_MM.map(diameterMm => {
    const diameterM = diameterMm / 1000;
    const areaM2 = (Math.PI * diameterM ** 2) / 4;
    const velocityMs = airflowM3s / areaM2;
    return {
      kind: 'pipe',
      type: 'pipe',
      diameterMm,
      d: diameterM,
      b: 0,
      h: 0,
      areaM2,
      velocityMs,
      targetVelocityMs,
      label: `Ø ${diameterMm} mm`,
      deviationMs: Math.abs(velocityMs - targetVelocityMs),
      exceedsTarget: areaM2 < requiredAreaM2,
    };
  });

  return candidates;
}

function createRectangularCandidates(requiredAreaM2, airflowM3s, targetVelocityMs) {
  const candidates = [];

  RECTANGULAR_STANDARD_DIMENSIONS_MM.forEach(widthMm => {
    RECTANGULAR_STANDARD_DIMENSIONS_MM.forEach(heightMm => {
      if (heightMm > widthMm) return;
      const aspectRatio = widthMm / heightMm;
      if (aspectRatio > MAX_RECTANGULAR_ASPECT_RATIO) return;

      const widthM = widthMm / 1000;
      const heightM = heightMm / 1000;
      const areaM2 = widthM * heightM;
      const velocityMs = airflowM3s / areaM2;
      const squarenessPenalty = (aspectRatio - 1) * 0.03;

      candidates.push({
        kind: 'duct',
        type: 'duct',
        widthMm,
        heightMm,
        b: widthM,
        h: heightM,
        d: 0,
        areaM2,
        velocityMs,
        targetVelocityMs,
        aspectRatio,
        label: `${widthMm} × ${heightMm} mm`,
        deviationMs: Math.abs(velocityMs - targetVelocityMs),
        exceedsTarget: areaM2 < requiredAreaM2,
        score: Math.abs(velocityMs - targetVelocityMs) + squarenessPenalty,
      });
    });
  });

  return candidates;
}

function rankCandidates(candidates = [], targetVelocityMs = DEFAULT_TARGET_VELOCITY_MS) {
  if (!candidates.length) return [];

  // Erst Varianten auswählen, welche die Zielgeschwindigkeit nicht überschreiten.
  // Falls der Standardbereich dafür nicht reicht, werden die grössten verfügbaren Varianten angeboten.
  const atOrBelowTarget = candidates.filter(candidate => candidate.velocityMs <= targetVelocityMs + 1e-9);
  const pool = atOrBelowTarget.length ? atOrBelowTarget : candidates;

  return [...pool].sort((a, b) => {
    const aScore = Number.isFinite(a.score) ? a.score : a.deviationMs;
    const bScore = Number.isFinite(b.score) ? b.score : b.deviationMs;
    if (Math.abs(aScore - bScore) > 1e-9) return aScore - bScore;
    if (Math.abs(a.areaM2 - b.areaM2) > 1e-12) return a.areaM2 - b.areaM2;
    return String(a.label).localeCompare(String(b.label), 'de');
  });
}

function uniqueAlternatives(ranked = [], limit = 4) {
  const selected = [];
  const seen = new Set();

  for (const candidate of ranked) {
    const key = candidate.label;
    if (seen.has(key)) continue;

    // Nahezu identische Alternativen bringen dem Anwender keinen Mehrwert.
    const tooSimilar = selected.some(existing =>
      Math.abs(existing.velocityMs - candidate.velocityMs) < 0.08
      && Math.abs(existing.areaM2 - candidate.areaM2) < 0.005,
    );
    if (tooSimilar) continue;

    seen.add(key);
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected;
}

export function createSectionSizingResult(section = {}, options = {}) {
  const targetVelocityMs = normalizeTargetVelocity(options.targetVelocityMs);
  const airflowM3h = getSectionAirflowM3h(section);
  const airflowM3s = airflowM3h / 3600;
  const currentAreaM2 = getSectionAreaM2(section);
  const currentVelocityMs = calculateSectionVelocityMs(section);

  if (airflowM3h <= 0) {
    return {
      status: 'missing-airflow',
      targetVelocityMs,
      airflowM3h,
      currentAreaM2,
      currentVelocityMs,
      suggestions: [],
      message: 'Bitte zuerst eine Luftmenge grösser als 0 m³/h eingeben.',
    };
  }

  const requiredAreaM2 = airflowM3s / targetVelocityMs;
  const candidates = isPipeSection(section)
    ? createRoundCandidates(requiredAreaM2, airflowM3s, targetVelocityMs)
    : createRectangularCandidates(requiredAreaM2, airflowM3s, targetVelocityMs);
  const ranked = rankCandidates(candidates, targetVelocityMs);
  const suggestions = uniqueAlternatives(ranked, Math.max(1, Math.min(6, Number(options.limit) || 4)));

  if (!suggestions.length) {
    return {
      status: 'limit-exceeded',
      targetVelocityMs,
      airflowM3h,
      requiredAreaM2,
      currentAreaM2,
      currentVelocityMs,
      suggestions: [],
      message: 'Für diese Luftmenge liegt keine Abmessung im hinterlegten neutralen Standardbereich. Bitte Dimension manuell festlegen.',
    };
  }

  const primary = suggestions[0];
  const standardLimitExceeded = primary.velocityMs > targetVelocityMs + 1e-9;

  return {
    status: standardLimitExceeded ? 'limit-exceeded' : 'ready',
    targetVelocityMs,
    airflowM3h,
    requiredAreaM2,
    currentAreaM2,
    currentVelocityMs,
    suggestions,
    primary,
    message: standardLimitExceeded
      ? 'Der hinterlegte Standardbereich reicht für die Zielgeschwindigkeit nicht aus. Die grösste verfügbare Variante wird nur als Hinweis gezeigt.'
      : 'Passende herstellerneutrale Standardabmessungen wurden ermittelt.',
  };
}

export function applySectionSizingSuggestion(section = {}, suggestion = null) {
  if (!section || !suggestion) return section;

  if (suggestion.kind === 'pipe' || suggestion.type === 'pipe') {
    section.type = 'pipe';
    section.d = dimensionToMetres(suggestion.d ?? suggestion.diameterMm);
    section.b = 0;
    section.h = 0;
  } else {
    section.type = 'duct';
    section.b = dimensionToMetres(suggestion.b ?? suggestion.widthMm);
    section.h = dimensionToMetres(suggestion.h ?? suggestion.heightMm);
    section.d = 0;
  }

  return section;
}

export function createFollowingSectionTemplate(section = {}) {
  const template = {
    type: isPipeSection(section) ? 'pipe' : 'duct',
    q: getSectionAirflowM3h(section),
    l: 0,
    b: dimensionToMetres(section?.b ?? section?.width),
    h: dimensionToMetres(section?.h ?? section?.height),
    d: dimensionToMetres(section?.d ?? section?.diameter),
    roughnessMm: Math.max(0, finiteNumber(section?.roughnessMm ?? section?.roughness, 0.15)),
    zetaSum: 0,
    description: '',
    note: '',
  };

  if (template.type === 'pipe') {
    template.b = 0;
    template.h = 0;
  } else {
    template.d = 0;
  }

  return template;
}
