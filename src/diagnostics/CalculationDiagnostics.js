// Druckverlust Pro – CalculationDiagnostics
// Fachlicher Rechen-QS für Summen, Einheiten, Plausibilität und Nachvollziehbarkeit.

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function createItem(status, area, label, message, detail = '') {
  return { status, area, label, message, detail };
}

function severity(status) {
  if (status === 'error') return 3;
  if (status === 'warning') return 2;
  return 1;
}

function isPipeSection(section = {}) {
  const type = String(section?.type || section?.kind || '').toLowerCase();
  if (['pipe', 'rohr', 'round', 'rund', 'rundrohr'].includes(type)) return true;

  const d = toNumber(section?.d ?? section?.diameter);
  const b = toNumber(section?.b ?? section?.width);
  const h = toNumber(section?.h ?? section?.height);
  return d > 0 && !(b > 0 && h > 0);
}

function sectionLabel(section = {}, fallback = 'Teilstrecke') {
  return section?.name || section?.ts || section?.sectionNo || section?.id || fallback;
}

function getGeometry(section = {}) {
  const pipe = isPipeSection(section);
  const b = toNumber(section?.b ?? section?.width);
  const h = toNumber(section?.h ?? section?.height);
  const d = toNumber(section?.d ?? section?.diameter);
  const area = pipe ? (d > 0 ? Math.PI * d * d / 4 : 0) : (b > 0 && h > 0 ? b * h : 0);
  const dh = pipe ? d : (b > 0 && h > 0 ? (2 * b * h) / (b + h) : 0);

  return { pipe, b, h, d, area, hydraulicDiameter: dh };
}

function getCalculation(project = {}) {
  return project?.calculationResult?.calculation || project?.calculation || null;
}

function getActiveSystem(project = {}, system = null) {
  return system || project?.calculationResult?.system || project?.systems?.[0] || null;
}

function nearlyEqual(a, b, tolerance = 0.05) {
  return Math.abs(toNumber(a) - toNumber(b)) <= tolerance;
}

function formatNumber(value, digits = 2) {
  const number = toNumber(value, 0);
  return new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(number);
}

export default class CalculationDiagnostics {
  static create(project = null, options = {}) {
    if (!project) {
      return this.createResult([
        createItem('error', 'Berechnung', 'Projekt vorhanden', 'Es ist kein Projekt geladen.'),
      ]);
    }

    const system = getActiveSystem(project, options.system);
    const calculation = getCalculation(project);
    const items = [];

    if (!calculation) {
      return this.createResult([
        createItem('error', 'Berechnung', 'Berechnung vorhanden', 'Es ist noch kein Berechnungsergebnis vorhanden. Bitte zuerst neu berechnen.'),
      ]);
    }

    items.push(...this.checkTotals(calculation));
    items.push(...this.checkSections(system, calculation));
    items.push(...this.checkSpecialComponents(system, calculation));
    items.push(...this.checkFormParts(system, calculation));
    items.push(...this.checkSettings(calculation));

    return this.createResult(items, { project, system, calculation });
  }

  static createResult(items = [], context = {}) {
    const normalized = safeArray(items).sort((a, b) => severity(b.status) - severity(a.status));
    const errors = normalized.filter(item => item.status === 'error');
    const warnings = normalized.filter(item => item.status === 'warning');
    const ok = normalized.filter(item => item.status === 'ok');
    const status = errors.length ? 'error' : warnings.length ? 'warning' : 'ok';
    const label = status === 'error' ? 'Fehler' : status === 'warning' ? 'Prüfen' : 'OK';
    const totals = context?.calculation?.totals || {};

    return {
      status,
      label,
      summary: this.createSummary(status, errors.length, warnings.length),
      items: normalized,
      errors,
      warnings,
      ok,
      counts: {
        error: errors.length,
        warning: warnings.length,
        ok: ok.length,
        total: normalized.length,
      },
      totals: {
        friction: toNumber(totals.friction),
        zetaLoss: toNumber(totals.zetaLoss),
        directFormPartLoss: toNumber(totals.directFormPartLoss),
        special: toNumber(totals.special),
        total: toNumber(totals.total),
        totalRounded: toNumber(totals.totalRounded),
      },
      timestamp: new Date().toISOString(),
    };
  }

  static createSummary(status, errorCount = 0, warningCount = 0) {
    if (status === 'error') return `${errorCount} Rechenfehler und ${warningCount} Hinweis${warningCount === 1 ? '' : 'e'} gefunden.`;
    if (status === 'warning') return `${warningCount} Rechenhinweis${warningCount === 1 ? '' : 'e'} gefunden – Werte fachlich kurz prüfen.`;
    return 'Rechen-QS ohne Fehler oder Hinweise abgeschlossen.';
  }

  static checkTotals(calculation = {}) {
    const items = [];
    const totals = calculation?.totals || {};
    const results = safeArray(calculation?.results);
    const specialResults = safeArray(calculation?.specialComponentResults);
    const friction = toNumber(totals.friction);
    const zetaLoss = toNumber(totals.zetaLoss);
    const directLoss = toNumber(totals.directFormPartLoss);
    const special = toNumber(totals.special);
    const total = toNumber(totals.total);
    const totalRounded = toNumber(totals.totalRounded);
    const componentTotal = friction + zetaLoss + directLoss + special;
    const difference = total - componentTotal;

    items.push(nearlyEqual(total, componentTotal, 0.05)
      ? createItem('ok', 'Summen', 'Gesamtsumme', 'Reibung + Formteile + Sonderbauteile stimmt mit dem Systemtotal überein.', `${formatNumber(componentTotal)} Pa`)
      : createItem('error', 'Summen', 'Gesamtsumme', 'Die Teilwert-Summe stimmt nicht mit dem Systemtotal überein.', `Differenz ${formatNumber(difference, 3)} Pa`));

    items.push(totalRounded + 0.05 >= total
      ? createItem('ok', 'Rundung', 'Gesamt gerundet', 'Gerundetes Systemtotal ist plausibel.', `${formatNumber(totalRounded, 1)} Pa`)
      : createItem('warning', 'Rundung', 'Gesamt gerundet', 'Gerundetes Systemtotal ist kleiner als das ungerundete Total.', `${formatNumber(totalRounded, 1)} Pa < ${formatNumber(total, 1)} Pa`));

    const resultTotal = results.reduce((sum, item) => sum + toNumber(item?.result?.totalLoss), 0)
      + specialResults.reduce((sum, item) => sum + toNumber(item?.pressureLoss), 0);

    items.push(nearlyEqual(resultTotal, total, 0.1)
      ? createItem('ok', 'Summen', 'Einzelresultate', 'Summe der Einzelresultate passt zum Total.', `${formatNumber(resultTotal)} Pa`)
      : createItem('warning', 'Summen', 'Einzelresultate', 'Summe der Einzelresultate weicht vom Total ab.', `Einzel ${formatNumber(resultTotal)} Pa / Total ${formatNumber(total)} Pa`));

    if (directLoss < 0) {
      items.push(createItem('warning', 'Formteile', 'Negative Direktverluste', 'Negative Formteil-Direktverluste sind vorhanden. Das kann bei Rückgewinnung korrekt sein, sollte aber bewusst geprüft werden.', `${formatNumber(directLoss)} Pa`));
    } else {
      items.push(createItem('ok', 'Formteile', 'Direktverluste', 'Keine negativen Direktverluste vorhanden.'));
    }

    if (!results.length) {
      items.push(createItem('error', 'Teilstrecken', 'Berechnungsergebnisse', 'Keine Teilstreckenergebnisse vorhanden.'));
    }

    return items;
  }

  static checkSections(system = {}, calculation = {}) {
    const items = [];
    const sections = safeArray(system?.sections);
    const results = safeArray(calculation?.results);
    const resultById = new Map(results.map(result => [result?.id || result?.input?.id, result]));
    const rho = toNumber(calculation?.settings?.rho, 1.21);

    if (!sections.length) {
      return [createItem('error', 'Teilstrecken', 'Teilstrecken vorhanden', 'Es sind keine Teilstrecken vorhanden.')];
    }

    items.push(results.length === sections.length
      ? createItem('ok', 'Teilstrecken', 'Resultatanzahl', 'Für jede Teilstrecke liegt ein Berechnungsergebnis vor.', `${results.length}/${sections.length}`)
      : createItem('warning', 'Teilstrecken', 'Resultatanzahl', 'Anzahl Berechnungsergebnisse passt nicht exakt zur Teilstreckenanzahl.', `${results.length}/${sections.length}`));

    sections.forEach((section, index) => {
      const id = section?.id;
      const label = sectionLabel(section, `TS ${index + 1}`);
      const item = resultById.get(id) || results[index] || null;
      const result = item?.result || null;

      if (!result) {
        items.push(createItem('error', 'Teilstrecken', label, 'Für diese Teilstrecke fehlt das Berechnungsergebnis.'));
        return;
      }

      const q = toNumber(section?.q ?? section?.volumeFlow ?? section?.airVolume);
      const geometry = getGeometry(section);
      const expectedVelocity = q > 0 && geometry.area > 0 ? q / (3600 * geometry.area) : 0;
      const expectedPdyn = 0.5 * rho * Math.pow(toNumber(result?.velocity), 2);
      const expectedFrictionLoss = toNumber(result?.frictionRate) * toNumber(result?.length ?? section?.l ?? section?.length);

      if (expectedVelocity > 0) {
        items.push(nearlyEqual(result.velocity, expectedVelocity, Math.max(0.02, expectedVelocity * 0.01))
          ? createItem('ok', 'Einheiten', label, 'Geschwindigkeit passt zu Luftmenge und Querschnitt.', `${formatNumber(result.velocity, 2)} m/s`)
          : createItem('warning', 'Einheiten', label, 'Geschwindigkeit weicht von q / A ab.', `berechnet ${formatNumber(result.velocity, 2)} / erwartet ${formatNumber(expectedVelocity, 2)} m/s`));
      }

      if (toNumber(result.velocity) > 0) {
        items.push(nearlyEqual(result.dynamicPressure, expectedPdyn, Math.max(0.05, expectedPdyn * 0.01))
          ? createItem('ok', 'p_dyn', label, 'Dynamischer Druck passt zu ρ/2 × v².', `${formatNumber(result.dynamicPressure)} Pa`)
          : createItem('warning', 'p_dyn', label, 'Dynamischer Druck weicht von ρ/2 × v² ab.', `berechnet ${formatNumber(result.dynamicPressure)} / erwartet ${formatNumber(expectedPdyn)} Pa`));
      }

      if (toNumber(result.frictionRate) > 0 && toNumber(result.length) >= 0) {
        items.push(nearlyEqual(result.frictionLoss, expectedFrictionLoss, Math.max(0.05, Math.abs(expectedFrictionLoss) * 0.01))
          ? createItem('ok', 'Reibung', label, 'Reibungsverlust passt zu R × Länge.', `${formatNumber(result.frictionLoss)} Pa`)
          : createItem('warning', 'Reibung', label, 'Reibungsverlust weicht von R × Länge ab.', `berechnet ${formatNumber(result.frictionLoss)} / erwartet ${formatNumber(expectedFrictionLoss)} Pa`));
      }

      if (toNumber(result.frictionLoss) < -0.01) {
        items.push(createItem('error', 'Reibung', label, 'Reibungsverlust darf nicht negativ sein.', `${formatNumber(result.frictionLoss)} Pa`));
      }

      if (q > 0 && geometry.area > 0 && toNumber(result.totalLoss) === 0 && toNumber(section?.l ?? section?.length) > 0) {
        items.push(createItem('warning', 'Druckverlust', label, 'Teilstrecke hat Luftmenge und Länge, aber 0 Pa Druckverlust. Eingaben prüfen.'));
      }
    });

    return items;
  }

  static checkFormParts(system = {}, calculation = {}) {
    const items = [];
    const formParts = safeArray(system?.formParts);
    const sections = safeArray(system?.sections);
    const sectionIds = new Set(sections.map(section => section?.id).filter(Boolean));

    if (!formParts.length) {
      items.push(createItem('warning', 'Formteile', 'Formteile vorhanden', 'Keine Formteile vorhanden. Prüfen, ob die Anlage wirklich ohne Formteile gerechnet werden soll.'));
      return items;
    }

    const invalidAssignments = formParts.filter(part => !part?.sectionId || !sectionIds.has(part.sectionId));
    items.push(invalidAssignments.length
      ? createItem('warning', 'Formteile', 'Zuordnung', `${invalidAssignments.length} Formteil${invalidAssignments.length === 1 ? '' : 'e'} ohne gültige Teilstrecke.`)
      : createItem('ok', 'Formteile', 'Zuordnung', 'Alle Formteile sind gültigen Teilstrecken zugeordnet.'));

    const missingResults = formParts.filter(part => !part?.calculationResult && !Number.isFinite(Number(part?.zeta)));
    items.push(missingResults.length
      ? createItem('warning', 'Formteile', 'Zeta-Ergebnisse', `${missingResults.length} Formteil${missingResults.length === 1 ? '' : 'e'} ohne berechnetes ζ-Ergebnis.`)
      : createItem('ok', 'Formteile', 'Zeta-Ergebnisse', 'Formteil-Zeta-Ergebnisse sind vorhanden.'));

    const totals = calculation?.totals || {};
    const formPartTotal = toNumber(totals.zetaLoss) + toNumber(totals.directFormPartLoss);
    items.push(createItem('ok', 'Formteile', 'Formteilverlust total', `Formteilverluste werden separat ausgewiesen: ${formatNumber(formPartTotal)} Pa.`, `${formatNumber(totals.zetaLoss)} Pa ζ / ${formatNumber(totals.directFormPartLoss)} Pa direkt`));

    return items;
  }

  static checkSpecialComponents(system = {}, calculation = {}) {
    const items = [];
    const components = safeArray(system?.specialComponents);
    const results = safeArray(calculation?.specialComponentResults);

    if (!components.length) {
      items.push(createItem('warning', 'Sonderbauteile', 'Sonderbauteile vorhanden', 'Keine Sonderbauteile erfasst. Filter, Schalldämpfer, BSK usw. bewusst prüfen.'));
      return items;
    }

    items.push(results.length === components.length
      ? createItem('ok', 'Sonderbauteile', 'Resultatanzahl', 'Für jedes Sonderbauteil liegt ein Ergebnis vor.', `${results.length}/${components.length}`)
      : createItem('warning', 'Sonderbauteile', 'Resultatanzahl', 'Anzahl Sonderbauteil-Ergebnisse passt nicht exakt.', `${results.length}/${components.length}`));

    results.forEach((result, index) => {
      const name = result?.name || components[index]?.name || `Sonderbauteil ${index + 1}`;
      const loss = toNumber(result?.pressureLoss);
      if (loss <= 0) {
        items.push(createItem('warning', 'Sonderbauteile', name, 'Sonderbauteil hat keinen positiven Druckverlust.', `${formatNumber(loss)} Pa`));
      }
    });

    return items;
  }

  static checkSettings(calculation = {}) {
    const items = [];
    const settings = calculation?.settings || {};
    const rho = toNumber(settings.rho, 1.21);
    const defaultRoughnessMm = toNumber(settings.defaultRoughnessMm, 0.15);
    const kinematicViscosity = toNumber(settings.kinematicViscosity, 0.0000151);
    const roundingStep = toNumber(settings.sectionRoundingStep, 0.5);

    items.push(rho > 0.9 && rho < 1.35
      ? createItem('ok', 'Einstellungen', 'Luftdichte ρ', 'Luftdichte liegt im üblichen Bereich.', `${rho} kg/m³`)
      : createItem('warning', 'Einstellungen', 'Luftdichte ρ', 'Luftdichte liegt ausserhalb des üblichen Bereichs. Einstellung prüfen.', `${rho} kg/m³`));

    items.push(defaultRoughnessMm >= 0 && defaultRoughnessMm <= 10
      ? createItem('ok', 'Einstellungen', 'Standard-Rauigkeit k', 'Neue Teilstrecken erhalten einen gültigen Standardwert.', `${defaultRoughnessMm} mm`)
      : createItem('warning', 'Einstellungen', 'Standard-Rauigkeit k', 'Standard-Rauigkeit liegt ausserhalb des erwarteten Bereichs.', `${defaultRoughnessMm} mm`));

    items.push(kinematicViscosity > 0
      ? createItem('ok', 'Einstellungen', 'Kinematische Viskosität', 'Viskosität für die Reynolds- und λ-Berechnung ist positiv.', `${kinematicViscosity} m²/s`)
      : createItem('warning', 'Einstellungen', 'Kinematische Viskosität', 'Viskosität fehlt oder ist 0.'));

    items.push(roundingStep > 0
      ? createItem('ok', 'Einstellungen', 'Rundungsschritt', 'Rundungsschritt ist positiv.', `${roundingStep} Pa`)
      : createItem('warning', 'Einstellungen', 'Rundungsschritt', 'Rundungsschritt fehlt oder ist 0.'));

    return items;
  }

  static toText(check = {}) {
    const lines = [
      `Rechen-QS: ${check.label || '-'}`,
      check.summary || '',
      '',
      `Fehler: ${check.counts?.error ?? 0}`,
      `Hinweise: ${check.counts?.warning ?? 0}`,
      `OK: ${check.counts?.ok ?? 0}`,
      '',
      'Druckverlust-Aufteilung:',
      `- Reibung: ${formatNumber(check.totals?.friction)} Pa`,
      `- ζ-Formteile: ${formatNumber(check.totals?.zetaLoss)} Pa`,
      `- Direkt-Formteile: ${formatNumber(check.totals?.directFormPartLoss)} Pa`,
      `- Sonderbauteile: ${formatNumber(check.totals?.special)} Pa`,
      `- Total: ${formatNumber(check.totals?.total)} Pa`,
      `- Total gerundet: ${formatNumber(check.totals?.totalRounded, 1)} Pa`,
      '',
      'Details:',
      ...safeArray(check.items).map(item => `[${item.status}] ${item.area} · ${item.label}: ${item.message}${item.detail ? ` (${item.detail})` : ''}`),
    ];

    return lines.filter(line => line !== null && line !== undefined).join('\n');
  }
}
