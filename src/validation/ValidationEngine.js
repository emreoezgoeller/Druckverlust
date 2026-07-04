// Druckverlust Pro – ValidationEngine
// Prüft Eingaben, Berechnungsergebnisse und Projektstruktur.

export class ValidationEngine {
  static validateSection(section = {}) {
    const warnings = [];
    const errors = [];

    const type = section.type || 'duct';
    const q = Number(section.q ?? 0);
    const l = Number(section.l ?? section.length ?? 0);
    const b = Number(section.b ?? section.width ?? 0);
    const h = Number(section.h ?? section.height ?? 0);
    const d = Number(section.d ?? section.diameter ?? 0);

    if (q <= 0) errors.push('Luftmenge fehlt oder ist 0.');
    if (l <= 0 && type !== 'special') warnings.push('Länge fehlt oder ist 0.');

    if (type === 'duct') {
      if (b <= 0) errors.push('Kanalbreite fehlt.');
      if (h <= 0) errors.push('Kanalhöhe fehlt.');
    }

    if (type === 'pipe') {
      if (d <= 0) errors.push('Rohrdurchmesser fehlt.');
    }

    return { warnings, errors };
  }

  static validateResult(result = {}) {
    const warnings = [];
    const errors = [];

    const v = Number(result.velocity ?? 0);
    const totalLoss = Number(result.totalLoss ?? 0);

    if (v > 6) warnings.push('Luftgeschwindigkeit über 6 m/s prüfen.');
    if (v > 10) errors.push('Luftgeschwindigkeit sehr hoch.');
    if (totalLoss < 0) errors.push('Druckverlust ist negativ.');

    return { warnings, errors };
  }

  static validateProject(project = {}) {
    const warnings = [];
    const errors = [];

    const systems = project.systems || [];

    if (!systems.length) {
      errors.push('Keine Anlage im Projekt vorhanden.');
    }

    systems.forEach(system => {
      if (!system.sections?.length) {
        warnings.push(`Anlage "${system.name || system.id}" enthält keine Teilstrecken.`);
      }

      (system.formParts || []).forEach(part => {
        if (!part.sectionId) {
          warnings.push(`Formteil "${part.name}" ist keiner Teilstrecke zugeordnet.`);
        }
      });

      (system.specialComponents || []).forEach(item => {
        if (Number(item.pressureLoss ?? 0) <= 0) {
          warnings.push(`Sonderbauteil "${item.name}" hat keinen Druckverlust.`);
        }
      });
    });

    return { warnings, errors };
  }
}

export default ValidationEngine;