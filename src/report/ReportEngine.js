// Druckverlust Pro – ReportEngine
// Erstellt ein professionelles Berichtmodell und eine A4-Druckansicht.

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : fallback;
}

function formatNumber(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  return number.toFixed(digits);
}

function formatSmart(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  return number.toFixed(digits).replace(/\.00$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function formatAirflow(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  return String(Math.round(number));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeFileName(value = 'Druckverlustbericht') {
  return String(value || 'Druckverlustbericht')
    .replace(/[^\wäöüÄÖÜß-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Druckverlustbericht';
}

function sectionName(section = {}) {
  return section.name ?? section.ts ?? section.sectionNo ?? section.id ?? '-';
}

function formPartName(formPart = {}, registryEntry = null) {
  return formPart.name ?? registryEntry?.name ?? formPart.calculationResult?.name ?? formPart.type ?? formPart.id ?? '-';
}

function componentName(component = {}) {
  return component.name ?? component.type ?? component.description ?? 'Sonderbauteil';
}

function getFormPartResult(formPart = {}) {
  return formPart.calculationResult || {};
}

function normalizeAssetPath(path = '') {
  return String(path || '')
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .replace(/^\//, '');
}

function toAbsoluteAssetUrl(path = '') {
  const cleanPath = normalizeAssetPath(path);
  if (!cleanPath) return '';
  if (/^(data:|https?:|blob:)/i.test(cleanPath)) return cleanPath;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/${cleanPath}`;
  }

  return `/${cleanPath}`;
}

function getProjectMeta(project = {}) {
  const report = project.report || project.meta || {};
  const today = new Date().toLocaleDateString('de-CH');

  return {
    name: report.project ?? project.name ?? project.title ?? project.projectName ?? 'Unbenanntes Projekt',
    object: report.object ?? report.objekt ?? project.object ?? project.objekt ?? '-',
    plant: report.plant ?? report.anlage ?? project.plant ?? project.anlage ?? null,
    author: report.author ?? report.bearbeiter ?? project.author ?? project.bearbeiter ?? '-',
    date: report.date ?? report.datum ?? project.date ?? project.datum ?? today,
    note: report.note ?? report.hinweis ?? project.note ?? '',
    software: report.software ?? 'Druckverlust Pro',
    version: report.version ?? project.version ?? '1.0.0',
  };
}

function makeDuctIllustration() {
  return `
    <svg viewBox="0 0 760 420" role="img" aria-label="Technische Lüftungskanal-Grafik" class="report-duct-illustration">
      <defs>
        <linearGradient id="ductTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="1" stop-color="#dfe9f5" />
        </linearGradient>
        <linearGradient id="ductSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f8fbff" />
          <stop offset="1" stop-color="#c8d8ea" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#123b64" flood-opacity="0.12"/>
        </filter>
      </defs>

      <g filter="url(#softShadow)" stroke="#7f9dbc" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
        <!-- Hauptkanal links -->
        <polygon points="40,185 180,130 180,198 40,253" fill="url(#ductTop)" opacity=".92"/>
        <polygon points="40,253 180,198 180,262 40,318" fill="url(#ductSide)" opacity=".78"/>
        <line x1="75" y1="171" x2="75" y2="304" opacity=".55"/>
        <line x1="115" y1="155" x2="115" y2="288" opacity=".55"/>
        <line x1="155" y1="140" x2="155" y2="273" opacity=".55"/>

        <!-- Bogen / Versatz mitte -->
        <polygon points="180,130 305,165 305,232 180,198" fill="url(#ductTop)" opacity=".95"/>
        <polygon points="180,198 305,232 305,296 180,262" fill="url(#ductSide)" opacity=".76"/>
        <line x1="225" y1="143" x2="225" y2="275" opacity=".55"/>
        <line x1="265" y1="154" x2="265" y2="287" opacity=".55"/>

        <!-- Hauptkanal rechts unten -->
        <polygon points="305,165 465,118 465,185 305,232" fill="url(#ductTop)" opacity=".95"/>
        <polygon points="305,232 465,185 465,250 305,296" fill="url(#ductSide)" opacity=".75"/>
        <line x1="350" y1="152" x2="350" y2="282" opacity=".52"/>
        <line x1="395" y1="139" x2="395" y2="268" opacity=".52"/>
        <line x1="435" y1="127" x2="435" y2="256" opacity=".52"/>

        <!-- Bogen / Anschluss rechts -->
        <polygon points="465,118 590,165 590,232 465,185" fill="url(#ductTop)" opacity=".94"/>
        <polygon points="465,185 590,232 590,297 465,250" fill="url(#ductSide)" opacity=".75"/>
        <line x1="508" y1="134" x2="508" y2="266" opacity=".5"/>
        <line x1="550" y1="150" x2="550" y2="282" opacity=".5"/>

        <!-- Auslauf rechts -->
        <polygon points="590,165 710,110 710,176 590,232" fill="url(#ductTop)" opacity=".95"/>
        <polygon points="590,232 710,176 710,242 590,297" fill="url(#ductSide)" opacity=".74"/>
        <line x1="630" y1="147" x2="630" y2="279" opacity=".48"/>
        <line x1="670" y1="128" x2="670" y2="260" opacity=".48"/>

        <!-- Abzweig nach unten -->
        <polygon points="300,296 390,270 505,340 420,374" fill="#f6faff" opacity=".9"/>
        <polygon points="390,270 390,205 505,275 505,340" fill="#d5e3f3" opacity=".68"/>
        <polygon points="420,374 505,340 505,275 420,310" fill="#c5d8ec" opacity=".62"/>
        <line x1="338" y1="285" x2="452" y2="354" opacity=".45"/>
        <line x1="372" y1="275" x2="486" y2="345" opacity=".45"/>
      </g>
    </svg>`;
}

export class ReportEngine {
  static createReportModel(project, options = {}) {
    const system = options.system || project?.systems?.[0] || null;
    const registry = options.registry || null;
    const calculation = project?.calculationResult?.calculation || null;
    const quality = project?.calculationResult?.quality || null;
    const totals = calculation?.totals || {};
    const settings = calculation?.settings || project?.settings || {};
    const sections = system?.sections || [];
    const formParts = system?.formParts || [];
    const specialComponents = system?.specialComponents || [];
    const results = calculation?.results || [];
    const specialResults = calculation?.specialComponentResults || [];
    const meta = getProjectMeta(project);

    const resultBySectionId = new Map();
    results.forEach(item => {
      const id = item?.id || item?.input?.id;
      if (id) resultBySectionId.set(id, item);
    });

    const specialResultById = new Map();
    specialResults.forEach(item => {
      const id = item?.id || item?.input?.id;
      if (id) specialResultById.set(id, item);
    });

    const sectionRows = sections.map((section, index) => {
      const calculationItem = resultBySectionId.get(section.id) || null;
      const result = calculationItem?.result || {};
      const assignedFormParts = formParts
        .filter(part => part.sectionId === section.id || part.rowId === section.id || part.targetSectionId === section.id)
        .map(part => this.createFormPartRow(part, result, registry));

      return {
        position: index + 1,
        id: section.id,
        name: sectionName(section),
        description: section.description ?? section.desc ?? sectionName(section),
        type: String(result.type || section.type || '').toLowerCase() === 'pipe' ? 'Rohr' : 'Kanal',
        typeLabel: String(result.type || section.type || '').toLowerCase() === 'pipe' ? 'Rundrohr' : 'Rechteckkanal',
        width: result.width ?? section.b ?? section.width,
        height: result.height ?? section.h ?? section.height,
        diameter: result.diameter ?? section.d ?? section.diameter,
        length: result.length ?? section.l ?? section.length,
        area: result.area,
        airflow: result.q ?? section.q ?? section.volumeFlow ?? section.airVolume,
        velocity: result.velocity,
        dynamicPressure: result.dynamicPressure,
        frictionLoss: result.frictionLoss,
        zetaLoss: result.zetaLoss,
        directLoss: result.directFormPartLoss,
        totalLoss: result.roundedTotalLoss ?? result.totalLoss ?? result.totalPressureLoss,
        zetaSum: result.zetaSum ?? calculationItem?.zetaFromParts ?? 0,
        formParts: assignedFormParts,
      };
    });

    const formPartRows = formParts.map(part => this.createFormPartRow(part, null, registry));
    const specialRows = specialComponents.map((component, index) => {
      const result = specialResultById.get(component.id) || {};
      return {
        position: index + 1,
        id: component.id,
        name: componentName(component),
        type: component.type ?? component.description ?? '-',
        manufacturer: component.manufacturer ?? component.fabrikat ?? '-',
        airflow: component.q ?? component.airflow ?? component.volumeFlow ?? component.airVolume ?? '-',
        pressureLoss: result.pressureLoss ?? component.pressureLoss ?? component.pa ?? 0,
      };
    });

    const formPartsBySection = sectionRows.map(section => ({
      section,
      formParts: section.formParts || [],
      sum: (section.formParts || []).reduce((total, part) => total + toNumber(part.pressureLoss), 0),
    }));

    return {
      title: 'Druckverlustbericht',
      generatedAt: new Date().toISOString(),
      project: {
        id: project?.id ?? '-'
        , name: meta.name
        , object: meta.object
        , author: meta.author
        , date: meta.date
        , software: meta.software
        , version: meta.version
        , note: meta.note
      },
      system: {
        id: system?.id ?? '-',
        name: meta.plant || system?.name || 'Anlage',
      },
      settings: {
        rho: toNumber(settings.rho, 1.21),
        lambda: toNumber(settings.lambda, 0.025),
        sectionRoundingStep: toNumber(settings.sectionRoundingStep, 0.5),
      },
      counts: {
        sections: sections.length,
        formParts: formParts.length,
        specialComponents: specialComponents.length,
      },
      totals: {
        friction: toNumber(totals.friction),
        zetaLoss: toNumber(totals.zetaLoss),
        directFormPartLoss: toNumber(totals.directFormPartLoss),
        formParts: toNumber(totals.formParts, toNumber(totals.zetaLoss) + toNumber(totals.directFormPartLoss)),
        special: toNumber(totals.special),
        total: toNumber(totals.totalRounded ?? totals.total),
        rawTotal: toNumber(totals.total),
      },
      audit: totals.audit || null,
      quality: {
        status: quality?.status || (Number(quality?.errorCount ?? 0) ? 'error' : Number(quality?.warningCount ?? 0) ? 'warning' : 'ok'),
        errorCount: Number(quality?.errorCount ?? 0),
        warningCount: Number(quality?.warningCount ?? 0),
        errors: quality?.errors || [],
        warnings: quality?.warnings || [],
      },
      sections: sectionRows,
      formParts: formPartRows,
      formPartsBySection,
      specialComponents: specialRows,
      assets: {
        logo: toAbsoluteAssetUrl('assets/logo/eo-logo.png'),
        reportHero: toAbsoluteAssetUrl('assets/report/duct-network-hero.png'),
      },
    };
  }

  static createFormPartRow(formPart = {}, sectionResult = null, registry = null) {
    const result = getFormPartResult(formPart);
    const calculation = result.calculation || {};
    const registryEntry = this.getRegistryEntry(formPart, registry);
    const isDirectLoss = formPart.lossMode === 'direct' || calculation.lossMode === 'direct';
    const zeta = toNumber(formPart.zeta ?? result.zeta);
    const dynamicPressure = isDirectLoss
      ? toNumber(calculation.dynamicPressurePa)
      : toNumber(sectionResult?.dynamicPressure);
    const pressureLoss = isDirectLoss
      ? toNumber(formPart.pressureLossPa ?? calculation.pressureLossPa)
      : zeta * dynamicPressure;

    return {
      id: formPart.id,
      name: formPartName(formPart, registryEntry),
      type: registryEntry?.name ?? result.name ?? formPart.type ?? '-',
      category: registryEntry?.category ?? result.category ?? '-',
      sectionId: formPart.sectionId ?? '-',
      zeta,
      dynamicPressure,
      pressureLoss,
      reference: isDirectLoss && calculation.pressureReference
        ? `bezogen auf ${calculation.pressureReference}`
        : 'bezogen auf Teilstrecke',
      image: this.getFormPartImageUrl(formPart, registryEntry),
    };
  }

  static getRegistryEntry(formPart = {}, registry = null) {
    if (!registry || !formPart) return null;

    if (typeof registry.normalizeFormPart === 'function') {
      try {
        return registry.normalizeFormPart(formPart);
      } catch {
        return null;
      }
    }

    if (typeof registry.get === 'function' && formPart.type) {
      return registry.get(formPart.type);
    }

    return null;
  }

  static getFormPartImageUrl(formPart = {}, registryEntry = null) {
    const candidates = [];
    const add = value => {
      const clean = normalizeAssetPath(value);
      if (clean && !candidates.includes(clean)) candidates.push(clean);
    };

    add(registryEntry?.image);
    (registryEntry?.imageFallbacks || []).forEach(add);
    if (registryEntry?.id) {
      add(`assets/formteile/${registryEntry.id}/${registryEntry.id}.png`);
      add(`assets/formteile/${registryEntry.id}.png`);
    }
    if (formPart?.type) {
      add(`assets/formteile/${formPart.type}/${formPart.type}.png`);
      add(`assets/formteile/${formPart.type}.png`);
    }

    return toAbsoluteAssetUrl(candidates[0] || '');
  }

  static createStandaloneHtml(model) {
    const generatedDate = new Date(model.generatedAt);
    const generatedLabel = Number.isNaN(generatedDate.getTime())
      ? '-'
      : generatedDate.toLocaleString('de-CH');

    return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(model.project.name)} – Druckverlustbericht</title>
  <style>${this.getReportCss()}</style>
</head>
<body class="report-print-body">
  ${this.renderReportBody(model, { standalone: true, generatedLabel, includeStyle: false })}
</body>
</html>`;
  }

  static renderReportBody(model, options = {}) {
    const generatedLabel = options.generatedLabel || new Date(model.generatedAt).toLocaleString('de-CH');
    const includeStyle = options.includeStyle !== false;

    return `
      ${includeStyle ? `<style>${this.getReportCss()}</style>` : ''}
      <div class="dp-professional-report">
        ${this.renderCoverPage(model, generatedLabel)}
        ${this.renderMainNetworkPage(model)}
        ${this.renderAssignedFormPartsPage(model)}
        ${this.renderSpecialComponentsPage(model)}
        ${this.renderSummaryPage(model)}
        ${this.renderInfoPage(model)}
      </div>
    `;
  }

  static renderPage(model, page, title, subtitle, content) {
    return `
      <section class="report-page">
        <header class="report-page-head">
          <div class="report-logo-wrap">
            ${model.assets.logo ? `<img class="report-logo" src="${escapeHtml(model.assets.logo)}" alt="EO Logo">` : '<div class="report-logo-placeholder">EO</div>'}
          </div>
          <div>
            <h2>${escapeHtml(title)}</h2>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
          </div>
        </header>
        <div class="report-page-content">${content}</div>
        ${this.renderFooter(page, 6)}
      </section>
    `;
  }

  static renderFooter(page, totalPages) {
    return `
      <footer class="report-footer">
        <span>Druckverlust Pro – Lüftungstechnik</span>
        <span>${page} / ${totalPages}</span>
      </footer>
    `;
  }

  static renderCoverPage(model, generatedLabel) {
    return `
      <section class="report-page report-cover-page">
        <header class="report-cover-topbar">
          <div class="report-logo-wrap large">
            ${model.assets.logo ? `<img class="report-logo" src="${escapeHtml(model.assets.logo)}" alt="EO Logo">` : '<div class="report-logo-placeholder">EO</div>'}
          </div>
          <div class="report-generated">Erstellt: ${escapeHtml(generatedLabel)}</div>
        </header>

        <div class="report-cover-title-block">
          <h1>DRUCKVERLUST PRO</h1>
          <h2>Druckverlustberechnung</h2>
          <p class="report-lead">Teilstrecken, Sonderbauteile und Formteile in einer Hauptberechnung.</p>
        </div>

        <div class="report-cover-divider"></div>

        <div class="report-cover-main">
          <div class="report-project-card">
            <h3>Projektangaben</h3>
            ${this.renderDefinitionList([
              ['Projekt', model.project.name],
              ['Objekt', model.project.object],
              ['Anlage', model.system.name],
              ['Bearbeiter', model.project.author],
              ['Datum', model.project.date],
            ])}
          </div>
          <div class="report-illustration-card">${model.assets.reportHero ? `<img class="report-hero-image" src="${escapeHtml(model.assets.reportHero)}" alt="Technische Lüftungskanal-Grafik">` : makeDuctIllustration()}</div>
        </div>

        <div class="report-cover-divider slim"></div>

        <section class="report-cover-summary">
          <h3 class="report-section-title">Zusammenfassung</h3>
          <div class="report-summary-cards cover">
            ${this.renderSummaryCard('Kanal / Rohr', 'Teilstrecken', model.totals.friction, 'Pa')}
            ${this.renderSummaryCard('Formteile', 'ζ- und Einzelverluste', model.totals.formParts, 'Pa')}
            ${this.renderSummaryCard('Sonderbauteile', 'Komponenten', model.totals.special, 'Pa')}
            ${this.renderSummaryCard('Gesamtdruckverlust', 'Σ Druckverlust', model.totals.total, 'Pa', true)}
          </div>
        </section>
        ${this.renderFooter(1, 6)}
      </section>
    `;
  }

  static renderMainNetworkPage(model) {
    const rows = model.sections.map(section => `
      <tr>
        <td>${section.position}</td>
        <td>${escapeHtml(section.type)}</td>
        <td class="left">${escapeHtml(section.description || section.typeLabel)}</td>
        <td>${escapeHtml(section.name)}</td>
        <td>${formatAirflow(section.airflow)}</td>
        <td>${section.type === 'Rohr' ? '-' : formatSmart(toNumber(section.width) * 1000, 0)}</td>
        <td>${section.type === 'Rohr' ? '-' : formatSmart(toNumber(section.height) * 1000, 0)}</td>
        <td>${section.type === 'Rohr' ? formatSmart(toNumber(section.diameter) * 1000, 0) : '-'}</td>
        <td>${formatSmart(section.length, 2)}</td>
        <td>${formatNumber(section.area, 3)}</td>
        <td>${formatNumber(section.velocity, 2)}</td>
        <td>${formatNumber(section.frictionLoss + section.zetaLoss + section.directLoss, 3)}</td>
      </tr>
    `).join('');

    const content = `
      <table class="report-table compact">
        <thead>
          <tr>
            <th>Pos.</th><th>Typ</th><th>Beschreibung</th><th>TS</th><th>Luft-<br>menge<br>m³/h</th><th>Breite<br>mm</th><th>Höhe<br>mm</th><th>Ø<br>mm</th><th>Länge<br>m</th><th>Fläche<br>m²</th><th>v<br>m/s</th><th>Δp<br>Pa</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="12">Keine Teilstrecken vorhanden.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="11" class="left"><strong>Summe Kanäle / Teilstrecken</strong></td><td><strong>${formatNumber(model.totals.friction, 1)} Pa</strong></td></tr></tfoot>
      </table>

      <div class="report-legend">
        <span><strong>TS</strong> = Teilstrecke</span>
        <span><strong>v</strong> = Luftgeschwindigkeit</span>
        <span><strong>Δp</strong> = Druckverlust</span>
        <span><strong>ζ</strong> = Formbeiwert</span>
        <span><strong>λ</strong> = Reibungszahl</span>
        <span><strong>ρ</strong> = Luftdichte</span>
      </div>
    `;

    return this.renderPage(model, 2, 'Hauptberechnung – Luftnetz', 'Übersicht aller Teilstrecken', content);
  }

  static renderAssignedFormPartsPage(model) {
    const groups = model.formPartsBySection
      .filter(group => group.formParts.length)
      .map(group => this.renderFormPartSectionBox(group))
      .join('');

    const content = `
      <div class="report-formpart-grid">
        ${groups || '<div class="report-empty">Keine Formteile vorhanden.</div>'}
      </div>
      <div class="report-total-line">
        <span>Summe Formteile (alle Teilstrecken)</span>
        <strong>${formatNumber(model.totals.formParts, 1)} Pa</strong>
      </div>
    `;

    return this.renderPage(model, 3, 'Zugeordnete Formteile', 'Übersicht aller Formteile pro Teilstrecke', content);
  }

  static renderFormPartSectionBox(group) {
    const section = group.section;
    return `
      <div class="report-formpart-box">
        <h3>${escapeHtml(section.name)} – ${escapeHtml(this.describeSection(section))}</h3>
        <table class="report-table small">
          <thead><tr><th>Formteil</th><th>Skizze</th><th>ζ</th><th>Δp</th></tr></thead>
          <tbody>
            ${group.formParts.map(part => `
              <tr>
                <td class="left">${escapeHtml(part.type || part.name)}</td>
                <td>${part.image ? `<img class="report-part-img" src="${escapeHtml(part.image)}" alt="${escapeHtml(part.name)}">` : '-'}</td>
                <td>${formatNumber(part.zeta, 3)}</td>
                <td>${formatNumber(part.pressureLoss, 2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot><tr><td colspan="3" class="left"><strong>Summe ${escapeHtml(section.name)}</strong></td><td><strong>${formatNumber(group.sum, 2)}</strong></td></tr></tfoot>
        </table>
      </div>
    `;
  }

  static renderSpecialComponentsPage(model) {
    const rows = model.specialComponents.map(component => `
      <tr>
        <td>${component.position}</td>
        <td class="left">${escapeHtml(component.name)}</td>
        <td class="left">${escapeHtml(component.type)}</td>
        <td>${component.airflow === '-' ? '-' : `${formatAirflow(component.airflow)}`}</td>
        <td>${formatNumber(component.pressureLoss, 1)}</td>
      </tr>
    `).join('');

    const content = `
      <table class="report-table">
        <thead><tr><th>Pos.</th><th>Bezeichnung</th><th>Typ / Beschreibung</th><th>Luftmenge<br>m³/h</th><th>Druckverlust<br>Pa</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Keine Sonderbauteile vorhanden.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="4" class="left"><strong>Summe Sonderbauteile</strong></td><td><strong>${formatNumber(model.totals.special, 1)} Pa</strong></td></tr></tfoot>
      </table>
    `;

    return this.renderPage(model, 4, 'Sonderbauteile', 'Übersicht aller Sonderbauteile', content);
  }

  static renderSummaryPage(model) {
    const content = `
      <div class="report-result-box">
        <div><span>Kanal / Rohr (Teilstrecken)</span><strong>${formatNumber(model.totals.friction, 1)} Pa</strong></div>
        <div><span>Formteile (alle Teilstrecken)</span><strong>${formatNumber(model.totals.formParts, 1)} Pa</strong></div>
        <div><span>Sonderbauteile</span><strong>${formatNumber(model.totals.special, 1)} Pa</strong></div>
        <div class="total"><span>Gesamtdruckverlust</span><strong>${formatNumber(model.totals.total, 1)} Pa</strong></div>
      </div>

      <div class="report-info-box">
        <h3>Berechnungsgrundlagen</h3>
        <p>Luftdichte ρ = ${formatNumber(model.settings.rho, 2)} kg/m³</p>
        <p>Reibungszahl λ = ${formatNumber(model.settings.lambda, 3)}</p>
        <p>Die Berechnung erfolgt nach den in der Software hinterlegten Formeln für Luftleitteile und Druckverlustkomponenten.</p>
      </div>

      ${this.renderQualityBlock(model)}
    `;

    return this.renderPage(model, 5, 'Gesamtzusammenfassung', 'Ergebnis der Hauptberechnung', content);
  }

  static renderInfoPage(model) {
    const content = `
      <div class="report-two-col">
        <div>
          <h3>Anlageninformationen</h3>
          ${this.renderDefinitionList([
            ['Projekt', model.project.name],
            ['Objekt', model.project.object],
            ['Anlage', model.system.name],
            ['Bearbeiter', model.project.author],
            ['Datum', model.project.date],
            ['Software', model.project.software],
            ['Version', model.project.version],
          ])}
        </div>
        <div>
          <h3>Hinweise</h3>
          <ul class="report-note-list">
            <li>Alle Angaben ohne Gewähr.</li>
            <li>Für die Richtigkeit der Eingabedaten ist der Planer verantwortlich.</li>
            <li>Diese Berechnung ersetzt keine Detailplanung.</li>
          </ul>
          ${model.project.note ? `<div class="report-user-note"><strong>Bemerkung:</strong><br>${escapeHtml(model.project.note)}</div>` : ''}
        </div>
      </div>

      <div class="report-info-box">
        <h3>Verwendete Berechnungsgrundlagen</h3>
        <ul>
          <li>Berechnung nach den in der Software hinterlegten Formeln.</li>
          <li>Luftdichte ρ = ${formatNumber(model.settings.rho, 2)} kg/m³ · Reibungszahl λ = ${formatNumber(model.settings.lambda, 3)}</li>
          <li>Formbeiwerte nach hinterlegten Tabellen aus der Formteilbibliothek.</li>
          <li>Druckverlustberechnung nach Darcy-Weisbach.</li>
        </ul>
      </div>
      <p class="report-copyright">© ${new Date().getFullYear()} Emre Özgöller – Druckverlust Pro</p>
    `;

    return this.renderPage(model, 6, 'Anlageninformationen', 'Projektabschluss und Hinweise', content);
  }

  static renderDefinitionList(items = []) {
    return `
      <dl class="report-definition-list">
        ${items.map(([label, value]) => `
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value ?? '-')}</dd>
        `).join('')}
      </dl>
    `;
  }

  static renderSummaryCard(title, subtitle, value, unit = 'Pa', highlight = false) {
    return `
      <div class="report-summary-card ${highlight ? 'highlight' : ''}">
        <span>${escapeHtml(title)}</span>
        <small>${escapeHtml(subtitle || '')}</small>
        <strong>${formatNumber(value, 1)} ${escapeHtml(unit)}</strong>
      </div>
    `;
  }

  static renderQualityBlock(model) {
    const errors = model.quality.errors || [];
    const warnings = model.quality.warnings || [];

    if (!errors.length && !warnings.length) {
      return `
        <div class="report-info-box ok">
          <h3>Plausibilitätsstatus</h3>
          <p>Keine Fehler oder Hinweise vorhanden.</p>
        </div>
      `;
    }

    return `
      <div class="report-info-box warn">
        <h3>Plausibilitätsstatus</h3>
        ${errors.length ? `<p><strong>${errors.length} Fehler:</strong> ${errors.map(escapeHtml).join('; ')}</p>` : ''}
        ${warnings.length ? `<p><strong>${warnings.length} Hinweise:</strong> ${warnings.map(escapeHtml).join('; ')}</p>` : ''}
      </div>
    `;
  }

  static describeSection(section = {}) {
    if (section.type === 'Rohr') {
      return `Rundrohr Ø ${formatSmart(toNumber(section.diameter) * 1000, 0)} mm`;
    }

    return `Rechteckkanal ${formatSmart(toNumber(section.width) * 1000, 0)} × ${formatSmart(toNumber(section.height) * 1000, 0)} mm`;
  }

  static getReportCss() {
    return `
      :root{
        --report-blue:#073f7a;
        --report-blue-2:#0b559c;
        --report-line:#cfdbea;
        --report-soft:#f4f8fd;
        --report-text:#06172b;
        --report-muted:#5c6f87;
      }
      *{box-sizing:border-box}
      .report-print-body{margin:0;background:#eef3f9;font-family:Segoe UI,Arial,sans-serif;color:var(--report-text)}
      .dp-professional-report{display:grid;gap:16px;padding:14px 0;background:#eef3f9;color:var(--report-text);font-family:Segoe UI,Arial,sans-serif}
      .report-page{
        position:relative;
        width:210mm;
        height:297mm;
        min-height:297mm;
        margin:0 auto;
        padding:12mm 13mm 15mm;
        background:white;
        border:1px solid #d5dfec;
        box-shadow:0 10px 32px rgba(20,45,75,.12);
        overflow:hidden;
        page-break-after:always;
      }
      .report-page:last-child{page-break-after:auto}
      .report-page-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
      .report-logo-wrap{width:22mm;height:22mm;display:grid;place-items:center;flex:0 0 auto}
      .report-logo-wrap.large{width:27mm;height:27mm}
      .report-logo{max-width:100%;max-height:100%;object-fit:contain}
      .report-logo-placeholder{font-weight:900;color:var(--report-blue);font-size:20px;border:2px solid var(--report-blue);padding:8px}
      .report-page-head h2{margin:3px 0 3px;color:var(--report-blue);text-transform:uppercase;font-size:20px;line-height:1.1}
      .report-page-head p{margin:0;color:#24364c;font-size:11px}
      .report-page-content{height:calc(297mm - 12mm - 15mm - 36mm);overflow:hidden}

      .report-cover-page{display:flex;flex-direction:column;gap:0;padding:12mm 13mm 15mm}
      .report-cover-topbar{display:flex;justify-content:space-between;align-items:flex-start;min-height:30mm}
      .report-generated{font-size:9px;color:var(--report-muted);white-space:nowrap;margin-top:4mm}
      .report-cover-title-block{margin-top:0}
      .report-cover-title-block h1{margin:0 0 5px;color:var(--report-blue);font-size:24px;line-height:1;font-weight:900;letter-spacing:.2px}
      .report-cover-title-block h2{margin:0 0 6px;color:var(--report-blue);font-size:12.5px;text-transform:uppercase;font-weight:900;letter-spacing:.15px}
      .report-lead{margin:0;color:#20354f;font-size:10.5px;line-height:1.45;max-width:105mm}
      .report-cover-divider{height:1.5px;background:var(--report-blue);opacity:.75;margin:11mm 0 9mm}
      .report-cover-divider.slim{margin:8mm 0 6mm;opacity:.5}
      .report-cover-main{display:grid;grid-template-columns:68mm 1fr;gap:8mm;align-items:start;min-height:74mm}
      .report-project-card h3,.report-section-title,.report-info-box h3,.report-two-col h3{color:var(--report-blue);font-size:11px;text-transform:uppercase;margin:0 0 8px;font-weight:900;letter-spacing:.1px}
      .report-definition-list{display:grid;grid-template-columns:27mm 1fr;gap:5px 8px;margin:0;font-size:9.2px;line-height:1.35}
      .report-definition-list dt{font-weight:900;color:#06172b}.report-definition-list dd{margin:0;color:#06172b}
      .report-illustration-card{min-height:62mm;display:flex;align-items:flex-start;justify-content:flex-end;padding:0;margin-top:-7mm}
      .report-hero-image{width:100%;max-width:98mm;max-height:64mm;object-fit:contain;object-position:right top;display:block;margin-left:auto}
      .report-duct-illustration{width:100%;max-width:115mm;height:auto;display:block}
      .report-cover-summary{margin-top:3mm;padding-bottom:2mm}
      .report-summary-cards{display:grid;gap:7px}
      .report-summary-cards.cover{grid-template-columns:repeat(4,1fr)}
      .report-summary-card{border:1px solid var(--report-line);border-radius:6px;padding:6px 8px;min-height:20mm;background:#fbfdff;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;text-align:left}
      .report-summary-card span{display:block;color:var(--report-blue);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.15px;line-height:1.15}
      .report-summary-card small{display:block;color:var(--report-muted);font-size:8.6px;line-height:1.2;margin-top:2px;min-height:18px}
      .report-summary-card strong{display:block;color:var(--report-blue);font-size:15px;line-height:1.1;margin-top:4px;font-weight:900}
      .report-summary-card.highlight{background:linear-gradient(135deg,#05316a,#0b5eb0);border-color:#05316a;box-shadow:0 4px 12px rgba(7,63,122,.18)}
      .report-summary-card.highlight span,.report-summary-card.highlight small,.report-summary-card.highlight strong{color:white}

      .report-table{width:100%;border-collapse:collapse;font-size:8.8px;table-layout:fixed}
      .report-table th{
        background:var(--report-blue);
        color:white;
        border:1px solid #2f6196;
        padding:4.2px 3px;
        text-align:center;
        font-weight:900;
        font-size:7.8px;
        line-height:1.18;
        letter-spacing:.02em;
        white-space:normal;
        overflow-wrap:normal;
        word-break:normal;
      }
      .report-table td{border:1px solid var(--report-line);padding:5px 4px;text-align:center;vertical-align:middle;line-height:1.25}
      .report-table .left{text-align:left}
      .report-table tfoot td{background:#f4f7fb;font-weight:900}
      .report-table.compact{font-size:7.8px}
      .report-table.compact th{font-size:7.1px;padding:4px 2px;line-height:1.12}
      .report-table.compact td{padding:4.5px 3px}
      .report-table.small{font-size:8.2px}
      .report-table.small th{font-size:7.4px}
      .report-legend{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 18px;margin-top:13px;font-size:9px;color:#23364c}
      .report-legend span{display:block}
      .report-formpart-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .report-formpart-box{border:1px solid var(--report-line);border-radius:6px;overflow:hidden;background:white}
      .report-formpart-box h3{margin:0;background:var(--report-blue);color:white;padding:7px 9px;font-size:10px}
      .report-part-img{max-width:82px;max-height:50px;object-fit:contain}
      .report-total-line{margin-top:12px;border:1px solid var(--report-line);border-radius:6px;background:#f4f7fb;padding:10px 13px;display:flex;justify-content:space-between;font-weight:900}
      .report-result-box{border:1px solid var(--report-line);border-radius:6px;overflow:hidden;margin-top:14px}
      .report-result-box div{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--report-line);font-size:12px}
      .report-result-box div:last-child{border-bottom:0}
      .report-result-box strong{font-size:14px}
      .report-result-box .total{background:linear-gradient(135deg,#05316a,#0b5eb0);color:white;font-size:16px;font-weight:900}
      .report-result-box .total strong{font-size:22px}
      .report-info-box{border:1px solid var(--report-line);border-radius:7px;background:#f8fbff;padding:12px 15px;margin-top:14px;font-size:10.4px;line-height:1.45}
      .report-info-box.ok{border-color:#bde5ce;background:#f2fbf5}.report-info-box.warn{border-color:#f2c282;background:#fff8ed}
      .report-two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:4px}
      .report-note-list,.report-info-box ul{margin:0;padding-left:17px;font-size:10.4px;line-height:1.62}
      .report-user-note{margin-top:12px;border-left:3px solid var(--report-blue);background:#f4f8fd;padding:9px 10px;font-size:10px;line-height:1.45;color:#20354f}
      .report-copyright{text-align:center;margin-top:32px;color:#43566d;font-size:10.4px}
      .report-empty{border:1px dashed var(--report-line);border-radius:8px;padding:20px;color:var(--report-muted);background:#fafcff}
      .report-footer{position:absolute;left:13mm;right:13mm;bottom:7mm;border-top:1px solid #d6deea;padding-top:5px;display:flex;justify-content:space-between;font-size:8.8px;color:#223950}
      @media screen and (max-width:960px){.dp-professional-report{overflow:auto}.report-page{width:100%;height:auto;min-height:auto}.report-formpart-grid,.report-cover-main,.report-summary-cards.cover,.report-two-col{grid-template-columns:1fr}.report-cover-summary{margin-top:18px}}
      @media print{
        html,body,.report-print-body{background:white!important;margin:0!important;padding:0!important}
        .dp-professional-report{display:block;padding:0;background:white;gap:0}
        .report-page{box-shadow:none;border:0;margin:0!important;width:210mm;height:297mm;min-height:297mm;page-break-after:always;break-after:page}
        .report-page:last-child{page-break-after:auto;break-after:auto}
        .no-print{display:none!important}
      }
      @page{size:A4 portrait;margin:0}
    `;
  }

  static downloadHtml(model) {
    const html = this.createStandaloneHtml(model);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${safeFileName(model.project.name)}_Druckverlustbericht.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  static openPrintWindow(model) {
    const html = this.createStandaloneHtml(model);
    const reportWindow = window.open('', '_blank');

    if (!reportWindow) {
      throw new Error('Druckfenster konnte nicht geöffnet werden. Bitte Pop-up-Blocker prüfen.');
    }

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.setTimeout(() => reportWindow.print(), 350);
  }

  static helpers = {
    formatNumber,
    formatAirflow,
    escapeHtml,
  };
}

export default ReportEngine;
