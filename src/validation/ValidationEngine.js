import { createDefaultFormPartRegistry } from '../formteile/FormPartRegistry.js?v=51.10&release=51.10';

// Druckverlust Pro – ValidationEngine
// Prüft Eingaben, Berechnungsergebnisse und Projektstruktur.


let cachedRegistry = null;

function getRegistry() {
  if (!cachedRegistry) cachedRegistry = createDefaultFormPartRegistry();
  return cachedRegistry;
}

function normalizeFormPartType(part = {}) {
  const registry = getRegistry();
  if (typeof registry.normalizeFormPart === 'function') {
    return registry.normalizeFormPart(part);
  }

  return part?.type ? registry.get(part.type) : null;
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function normalizeType(section = {}) {
  const type = String(section.type || section.kind || '').toLowerCase();
  if (['pipe', 'rohr', 'round', 'rund', 'rundrohr'].includes(type)) return 'pipe';
  if (['special', 'sonder', 'sonderbauteil'].includes(type)) return 'special';
  return 'duct';
}

function unique(items = []) {
  return [...new Set(items.map(item => String(item || '').trim()).filter(Boolean))];
}

export class ValidationEngine {
  static validateSection(section = {}) {
    const warnings = [];
    const errors = [];

    const type = normalizeType(section);
    const name = section.name || section.ts || section.id || 'Teilstrecke';
    const q = toNumber(section.q ?? section.volumeFlow ?? section.airVolume);
    const l = toNumber(section.l ?? section.length);
    const b = toNumber(section.b ?? section.width);
    const h = toNumber(section.h ?? section.height);
    const d = toNumber(section.d ?? section.diameter);

    if (type !== 'special' && q <= 0) errors.push(`${name}: Luftmenge fehlt oder ist 0 m³/h.`);
    if (type !== 'special' && l < 0) errors.push(`${name}: Länge darf nicht negativ sein.`);
    if (type !== 'special' && l === 0) warnings.push(`${name}: Länge ist 0 m. Reibungsverlust wird dadurch 0 Pa.`);

    if (type === 'duct') {
      if (b <= 0) errors.push(`${name}: Kanalbreite fehlt.`);
      if (h <= 0) errors.push(`${name}: Kanalhöhe fehlt.`);
    }

    if (type === 'pipe') {
      if (d <= 0) errors.push(`${name}: Rohrdurchmesser fehlt.`);
    }

    return { warnings: unique(warnings), errors: unique(errors) };
  }

  static validateFormPart(part = {}, sections = []) {
    const warnings = [];
    const errors = [];
    const name = part.name || part.type || part.id || 'Formteil';

    const entry = normalizeFormPartType(part);

    if (!entry) errors.push(`${name}: Formteiltyp fehlt oder ist nicht in der Bibliothek vorhanden.`);
    if (!part.sectionId) {
      warnings.push(`${name}: ist keiner Teilstrecke zugeordnet.`);
    } else if (sections.length && !sections.some(section => section.id === part.sectionId)) {
      warnings.push(`${name}: ist keiner gültigen Teilstrecke zugeordnet.`);
    }

    const W = toNumber(part.W);
    const WA = toNumber(part.WA);
    const WD = toNumber(part.WD);

    if (W > 0 && WA > W) {
      warnings.push(`${name}: Abzweigluftmenge WA ist grösser als Hauptluftmenge W.`);
    }

    if (String(part.type || '').startsWith('t_abzweig') && W > 0 && WA > 0 && WD > 0) {
      const balance = Math.abs(W - (WA + WD));
      if (balance > Math.max(1, W * 0.02)) {
        warnings.push(`${name}: W sollte ungefähr WA + WD entsprechen.`);
      }
    }

    if (part.calculationResult?.warnings?.length) {
      warnings.push(...part.calculationResult.warnings.map(warning => `${name}: ${warning}`));
    }

    return { warnings: unique(warnings), errors: unique(errors) };
  }

  static validateResult(result = {}) {
    const warnings = [];
    const errors = [];

    const v = toNumber(result.velocity);
    const totalLoss = toNumber(result.totalLoss);

    if (v > 6) warnings.push('Luftgeschwindigkeit über 6 m/s prüfen.');
    if (v > 10) errors.push('Luftgeschwindigkeit sehr hoch.');
    if (totalLoss < 0) warnings.push('Druckverlust ist negativ. Druckrückgewinnung/Formteilbezug prüfen.');

    return { warnings: unique(warnings), errors: unique(errors) };
  }

  static validateProject(project = {}) {
    const warnings = [];
    const errors = [];

    const systems = project.systems || [];

    if (!systems.length) {
      errors.push('Keine Anlage im Projekt vorhanden.');
    }

    systems.forEach(system => {
      const systemName = system.name || system.id || 'Anlage';
      const sections = system.sections || [];

      if (!sections.length) {
        warnings.push(`Anlage "${systemName}" enthält keine Teilstrecken.`);
      }

      sections.forEach(section => {
        const result = ValidationEngine.validateSection(section);
        warnings.push(...result.warnings);
        errors.push(...result.errors);
      });

      (system.formParts || []).forEach(part => {
        const result = ValidationEngine.validateFormPart(part, sections);
        warnings.push(...result.warnings);
        errors.push(...result.errors);
      });

      (system.specialComponents || []).forEach(item => {
        if (toNumber(item.pressureLoss ?? item.pa ?? item.dp) <= 0) {
          warnings.push(`Sonderbauteil "${item.name || item.id || '-'}" hat keinen Druckverlust.`);
        }
      });
    });

    return { warnings: unique(warnings), errors: unique(errors) };
  }
}

export default ValidationEngine;
