// Druckverlust Pro – Phase 50.00
// Reine Hilfsfunktionen für Formteil-Kontext, Reihenfolge und Anschlussvorschläge.

function normalizeId(value) {
  return value === null || value === undefined ? '' : String(value);
}

export function getSystemSections(system = {}) {
  return Array.isArray(system?.sections) ? system.sections : [];
}

export function getSystemFormParts(system = {}) {
  return Array.isArray(system?.formParts) ? system.formParts : [];
}

export function findSectionById(system = {}, sectionId = '') {
  const targetId = normalizeId(sectionId);
  if (!targetId) return null;
  return getSystemSections(system).find(section => normalizeId(section?.id) === targetId) || null;
}

export function resolveFormPartContextSection(system = {}, options = {}) {
  const sections = getSystemSections(system);
  if (!sections.length) return null;

  const candidateIds = [
    options.requestedSectionId,
    options.selectedSectionId,
    options.rememberedSectionId,
  ].map(normalizeId).filter(Boolean);

  for (const candidateId of candidateIds) {
    const match = sections.find(section => normalizeId(section?.id) === candidateId);
    if (match) return match;
  }

  return sections[sections.length - 1] || null;
}

export function getFormPartsForSection(formParts = [], sectionId = null) {
  const targetId = normalizeId(sectionId);
  return (Array.isArray(formParts) ? formParts : []).filter(part => normalizeId(part?.sectionId) === targetId);
}

export function getFormPartPosition(formParts = [], formPart = null) {
  if (!formPart) return { index: -1, total: 0, group: [] };

  const group = getFormPartsForSection(formParts, formPart.sectionId);
  return {
    index: group.findIndex(part => normalizeId(part?.id) === normalizeId(formPart?.id)),
    total: group.length,
    group,
  };
}

export function moveFormPartWithinSection(formParts = [], formPartId = '', direction = 0) {
  if (!Array.isArray(formParts)) return null;

  const currentIndex = formParts.findIndex(part => normalizeId(part?.id) === normalizeId(formPartId));
  if (currentIndex < 0) return null;

  const current = formParts[currentIndex];
  const group = getFormPartsForSection(formParts, current?.sectionId);
  const groupIndex = group.findIndex(part => normalizeId(part?.id) === normalizeId(formPartId));
  const targetGroupIndex = groupIndex + Math.sign(Number(direction) || 0);

  if (groupIndex < 0 || targetGroupIndex < 0 || targetGroupIndex >= group.length) return null;

  const target = group[targetGroupIndex];
  const targetIndex = formParts.findIndex(part => normalizeId(part?.id) === normalizeId(target?.id));
  if (targetIndex < 0) return null;

  [formParts[currentIndex], formParts[targetIndex]] = [formParts[targetIndex], formParts[currentIndex]];
  return current;
}

export function getAdjacentSection(sections = [], currentSectionId = '', direction = 1) {
  const items = Array.isArray(sections) ? sections : [];
  const index = items.findIndex(section => normalizeId(section?.id) === normalizeId(currentSectionId));
  if (index < 0) return null;

  return items[index + Math.sign(Number(direction) || 0)] || null;
}

export function getSuggestedConnectionSectionId(formPart = {}, connection = {}, sections = []) {
  const items = Array.isArray(sections) ? sections : [];
  if (!items.length) return '';

  const primaryIndex = items.findIndex(section => normalizeId(section?.id) === normalizeId(formPart?.sectionId));
  const primaryId = normalizeId(formPart?.sectionId);
  const usedIds = new Set([
    primaryId,
    normalizeId(formPart?.transitionOtherSectionId),
    normalizeId(formPart?.throughSectionId),
    normalizeId(formPart?.branchSectionId),
  ].filter(Boolean));

  usedIds.delete(normalizeId(formPart?.[connection.field]));

  const ordered = primaryIndex >= 0
    ? [...items.slice(primaryIndex + 1), ...items.slice(0, primaryIndex)]
    : [...items];

  const freeCandidates = ordered.filter(section => !usedIds.has(normalizeId(section?.id)));
  if (!freeCandidates.length) return '';

  // Bei Abzweigen ist die erste folgende Teilstrecke typischerweise der Durchgang,
  // die zweite der Abzweig. Es bleibt ausdrücklich nur ein bestätigbarer Vorschlag.
  if (connection.field === 'branchSectionId' && !formPart?.throughSectionId && freeCandidates.length > 1) {
    return normalizeId(freeCandidates[1]?.id);
  }

  return normalizeId(freeCandidates[0]?.id);
}

export function getConnectionAssignmentIssues(formPart = {}, connectionDefinitions = [], sections = []) {
  const validIds = new Set((Array.isArray(sections) ? sections : []).map(section => normalizeId(section?.id)).filter(Boolean));
  const issues = [];

  (Array.isArray(connectionDefinitions) ? connectionDefinitions : []).forEach(connection => {
    const value = normalizeId(formPart?.[connection.field]);
    if (!value) return;

    if (!validIds.has(value)) {
      issues.push(`${connection.label}: Die gewählte Teilstrecke ist nicht mehr vorhanden.`);
    }

    if (value && value === normalizeId(formPart?.sectionId)) {
      issues.push(`${connection.label}: Haupt- und Zusatzanschluss verwenden dieselbe Teilstrecke.`);
    }
  });

  return issues;
}
