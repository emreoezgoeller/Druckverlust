// Druckverlust Pro – ProjectDiagnostics
// Erstellt einen kompakten Projekt- und Abgabecheck ohne DOM-Abhängigkeit.

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getMetaValue(project = {}, keys = []) {
  for (const key of keys) {
    if (hasText(project?.meta?.[key])) return project.meta[key];
    if (hasText(project?.report?.[key])) return project.report[key];
    if (hasText(project?.[key])) return project[key];
  }

  return '';
}

function isPipeSection(section = {}) {
  const type = String(section?.type || section?.kind || '').toLowerCase();
  return ['pipe', 'rohr', 'round', 'rund', 'rundrohr'].includes(type);
}

function createItem(status, area, label, message, detail = '') {
  return { status, area, label, message, detail };
}

function severity(status) {
  if (status === 'error') return 3;
  if (status === 'warning') return 2;
  return 1;
}

export default class ProjectDiagnostics {
  static create(project = null, options = {}) {
    const system = options.system || project?.systems?.[0] || null;
    const items = [];

    if (!project) {
      return this.createResult([
        createItem('error', 'Projekt', 'Projekt vorhanden', 'Es ist kein Projekt geladen.'),
      ]);
    }

    items.push(...this.checkProjectMeta(project, system));
    items.push(...this.checkSections(system));
    items.push(...this.checkFormParts(system));
    items.push(...this.checkSpecialComponents(system));
    items.push(...this.checkCalculation(project));
    items.push(...this.checkReport(project));
    items.push(...this.checkStorage(project));

    return this.createResult(items);
  }

  static createResult(items = []) {
    const normalized = safeArray(items);
    const errors = normalized.filter(item => item.status === 'error');
    const warnings = normalized.filter(item => item.status === 'warning');
    const ok = normalized.filter(item => item.status === 'ok');
    const status = errors.length ? 'error' : warnings.length ? 'warning' : 'ok';
    const label = status === 'error' ? 'Fehler' : status === 'warning' ? 'Prüfen' : 'OK';

    return {
      status,
      label,
      items: normalized.sort((a, b) => severity(b.status) - severity(a.status)),
      errors,
      warnings,
      ok,
      counts: {
        error: errors.length,
        warning: warnings.length,
        ok: ok.length,
        total: normalized.length,
      },
      summary: this.createSummary(status, errors.length, warnings.length),
    };
  }

  static createSummary(status, errorCount = 0, warningCount = 0) {
    if (status === 'error') {
      return `${errorCount} Fehler und ${warningCount} Hinweis${warningCount === 1 ? '' : 'e'} gefunden.`;
    }

    if (status === 'warning') {
      return `${warningCount} Hinweis${warningCount === 1 ? '' : 'e'} gefunden – Export möglich, aber vorher prüfen.`;
    }

    return 'Projektcheck ohne Fehler oder Hinweise abgeschlossen.';
  }

  static checkProjectMeta(project = {}, system = null) {
    const items = [];
    const projectNumber = getMetaValue(project, ['name', 'project', 'projectNumber', 'projectName']);
    const projectName = getMetaValue(project, ['object', 'objekt']);
    const bkpNumber = getMetaValue(project, ['anlageNumber', 'systemNumber']);
    const plantName = getMetaValue(project, ['anlage', 'plant']) || system?.name;
    const author = getMetaValue(project, ['bearbeiter', 'author']);
    const company = getMetaValue(project, ['company', 'firma']);

    items.push(hasText(projectNumber)
      ? createItem('ok', 'Projektangaben', 'Projektnummer', 'Projektnummer ist erfasst.')
      : createItem('warning', 'Projektangaben', 'Projektnummer', 'Projektnummer fehlt.'));

    items.push(hasText(projectName)
      ? createItem('ok', 'Projektangaben', 'Projektname', 'Projektname ist erfasst.')
      : createItem('warning', 'Projektangaben', 'Projektname', 'Projektname/Objekt fehlt.'));

    items.push(hasText(bkpNumber)
      ? createItem('ok', 'Projektangaben', 'BKP-Nummer', 'BKP-Nummer ist erfasst.')
      : createItem('warning', 'Projektangaben', 'BKP-Nummer', 'BKP-Nummer fehlt.'));

    items.push(hasText(plantName)
      ? createItem('ok', 'Projektangaben', 'Anlage', 'Anlagenname ist erfasst.')
      : createItem('warning', 'Projektangaben', 'Anlage', 'Anlagenname fehlt.'));

    items.push(hasText(author)
      ? createItem('ok', 'Projektangaben', 'Bearbeiter', 'Bearbeiter ist erfasst.')
      : createItem('warning', 'Projektangaben', 'Bearbeiter', 'Bearbeiter fehlt.'));

    if (!hasText(company)) {
      items.push(createItem('warning', 'Projektangaben', 'Firma', 'Firma ist leer.'));
    }

    return items;
  }

  static checkSections(system = {}) {
    const items = [];
    const sections = safeArray(system?.sections);

    if (!system) {
      return [createItem('error', 'Anlage', 'Anlage vorhanden', 'Es ist keine Anlage vorhanden.')];
    }

    if (!sections.length) {
      return [createItem('error', 'Teilstrecken', 'Teilstrecken vorhanden', 'Es ist keine Teilstrecke vorhanden.')];
    }

    const relevant = sections.filter(section => this.isSectionRelevant(section));

    items.push(relevant.length
      ? createItem('ok', 'Teilstrecken', 'Berechnungsrelevante Teilstrecken', `${relevant.length} von ${sections.length} Teilstrecken sind vollständig.`)
      : createItem('error', 'Teilstrecken', 'Berechnungsrelevante Teilstrecken', 'Keine Teilstrecke ist vollständig berechenbar.'));

    sections.forEach((section, index) => {
      const name = section?.name || section?.id || `TS ${index + 1}`;
      const warnings = this.getSectionWarnings(section);

      warnings.forEach(warning => {
        items.push(createItem(warning.status, 'Teilstrecken', name, warning.message));
      });
    });

    return items;
  }

  static isSectionRelevant(section = {}) {
    const q = toNumber(section.q ?? section.volumeFlow ?? section.airVolume);
    const length = toNumber(section.l ?? section.length);
    const d = toNumber(section.d ?? section.diameter);
    const b = toNumber(section.b ?? section.width);
    const h = toNumber(section.h ?? section.height);

    return q > 0 && length >= 0 && (isPipeSection(section) ? d > 0 : b > 0 && h > 0);
  }

  static getSectionWarnings(section = {}) {
    const warnings = [];
    const q = toNumber(section.q ?? section.volumeFlow ?? section.airVolume);
    const length = toNumber(section.l ?? section.length);
    const d = toNumber(section.d ?? section.diameter);
    const b = toNumber(section.b ?? section.width);
    const h = toNumber(section.h ?? section.height);

    if (q <= 0) warnings.push({ status: 'error', message: 'Luftmenge fehlt oder ist 0 m³/h.' });
    if (length < 0) warnings.push({ status: 'error', message: 'Länge darf nicht negativ sein.' });

    if (isPipeSection(section)) {
      if (d <= 0) warnings.push({ status: 'error', message: 'Rundrohr-Durchmesser fehlt oder ist 0 m.' });
    } else {
      if (b <= 0) warnings.push({ status: 'error', message: 'Kanalbreite fehlt oder ist 0 m.' });
      if (h <= 0) warnings.push({ status: 'error', message: 'Kanalhöhe fehlt oder ist 0 m.' });
    }

    const area = isPipeSection(section)
      ? Math.PI * Math.pow(d, 2) / 4
      : b * h;

    if (q > 0 && area > 0) {
      const velocity = (q / 3600) / area;
      if (velocity > 10) {
        warnings.push({ status: 'warning', message: `Hohe Luftgeschwindigkeit: ca. ${velocity.toFixed(1)} m/s.` });
      }
    }

    return warnings;
  }

  static checkFormParts(system = {}) {
    const items = [];
    const formParts = safeArray(system?.formParts);
    const sections = safeArray(system?.sections);
    const sectionIds = new Set(sections.map(section => section?.id).filter(Boolean));

    if (!formParts.length) {
      items.push(createItem('warning', 'Formteile', 'Formteile vorhanden', 'Es sind noch keine Formteile erfasst.'));
      return items;
    }

    items.push(createItem('ok', 'Formteile', 'Formteile vorhanden', `${formParts.length} Formteil${formParts.length === 1 ? '' : 'e'} erfasst.`));

    formParts.forEach((part, index) => {
      const name = part?.name || part?.type || `Formteil ${index + 1}`;

      if (!hasText(part?.type)) {
        items.push(createItem('error', 'Formteile', name, 'Formteiltyp fehlt.'));
      }

      if (!part?.sectionId || !sectionIds.has(part.sectionId)) {
        items.push(createItem('warning', 'Formteile', name, 'Keine gültige Teilstrecke zugewiesen.'));
      }
    });

    return items;
  }

  static checkSpecialComponents(system = {}) {
    const items = [];
    const components = safeArray(system?.specialComponents);

    if (!components.length) {
      items.push(createItem('warning', 'Sonderbauteile', 'Sonderbauteile vorhanden', 'Es sind keine Sonderbauteile erfasst. Prüfen, ob Filter, Schalldämpfer, BSK usw. fehlen.'));
      return items;
    }

    items.push(createItem('ok', 'Sonderbauteile', 'Sonderbauteile vorhanden', `${components.length} Sonderbauteil${components.length === 1 ? '' : 'e'} erfasst.`));

    components.forEach((component, index) => {
      const name = component?.name || component?.type || `Sonderbauteil ${index + 1}`;
      const loss = toNumber(component?.pressureLoss ?? component?.pressureLossPa ?? component?.unitPressureLoss, null);

      if (loss === null || !Number.isFinite(loss)) {
        items.push(createItem('error', 'Sonderbauteile', name, 'Druckverlust ist keine gültige Zahl.'));
      } else if (loss < 0) {
        items.push(createItem('warning', 'Sonderbauteile', name, 'Negativer Druckverlust – nur verwenden, wenn fachlich gewollt.'));
      }
    });

    return items;
  }

  static checkCalculation(project = {}) {
    const items = [];
    const result = project?.calculationResult;
    const calculation = result?.calculation;
    const quality = result?.quality || {};
    const totals = calculation?.totals || {};
    const total = toNumber(totals.totalRounded ?? totals.total, null);

    if (!result || !calculation) {
      items.push(createItem('error', 'Berechnung', 'Berechnung vorhanden', 'Noch keine gültige Projektberechnung vorhanden.'));
      return items;
    }

    items.push(Number.isFinite(total)
      ? createItem('ok', 'Berechnung', 'Gesamtdruckverlust', `Gesamtdruckverlust ist berechnet: ${total.toFixed(1)} Pa.`)
      : createItem('warning', 'Berechnung', 'Gesamtdruckverlust', 'Gesamtdruckverlust konnte nicht eindeutig gelesen werden.'));

    safeArray(quality.errors).forEach(error => {
      items.push(createItem('error', 'QS', 'Berechnungsfehler', String(error)));
    });

    safeArray(quality.warnings).forEach(warning => {
      items.push(createItem('warning', 'QS', 'Berechnungshinweis', String(warning)));
    });

    return items;
  }

  static checkReport(project = {}) {
    const items = [];
    const report = project?.report || {};

    if (!hasText(report.reportNumber ?? report.berichtNr)) {
      items.push(createItem('warning', 'Bericht', 'Bericht-Nr.', 'Bericht-Nr. ist leer.'));
    }

    if (!hasText(report.revision ?? report.rev)) {
      items.push(createItem('warning', 'Bericht', 'Revision', 'Revision ist leer.'));
    }

    return items;
  }

  static checkStorage(project = {}) {
    try {
      JSON.stringify(project);
      return [createItem('ok', 'Speichern', 'Projektdatei', 'Projekt ist als JSON speicherbar.')];
    } catch (error) {
      return [createItem('error', 'Speichern', 'Projektdatei', `Projekt kann nicht gespeichert werden: ${error.message}`)];
    }
  }

  static toText(check = {}) {
    const lines = [
      `Projektcheck: ${check.label || '-'}`,
      check.summary || '',
      '',
      ...safeArray(check.items)
        .filter(item => item.status !== 'ok')
        .slice(0, 12)
        .map(item => `${item.status === 'error' ? 'Fehler' : 'Hinweis'} – ${item.area}: ${item.label} – ${item.message}`),
    ].filter(line => line !== null && line !== undefined);

    return lines.join('\n');
  }
}
