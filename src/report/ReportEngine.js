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

function compactFileToken(value = '') {
  return safeFileName(value)
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}


const MAIN_NETWORK_ROWS_PER_PAGE = 30;
const SPECIAL_ROWS_PER_PAGE = 24;
const FORMPART_BOXES_PER_PAGE = 4;
const FORMPART_ROWS_PER_BOX = 5;
const FORMPART_CATALOG_ROWS_PER_PAGE = 8;
const QUALITY_ROWS_PER_PAGE = 16;

const DEFAULT_REPORT_OPTIONS = Object.freeze({
  includeToc: true,
  includeMainNetwork: true,
  includeAssignedFormParts: true,
  includeSpecialComponents: true,
  includeSummary: true,
  includeQualityProtocol: true,
  includeFormPartCatalog: true,
  includeApproval: true,
  includeInfo: true,
});

function normalizeReportOptions(options = {}) {
  const source = options && typeof options === 'object' ? options : {};

  return Object.entries(DEFAULT_REPORT_OPTIONS).reduce((normalized, [key, defaultValue]) => {
    normalized[key] = source[key] === undefined ? defaultValue : Boolean(source[key]);
    return normalized;
  }, {});
}

function chunkArray(items = [], size = 1) {
  const chunks = [];
  const safeSize = Math.max(1, Number(size) || 1);

  for (let index = 0; index < items.length; index += safeSize) {
    chunks.push(items.slice(index, index + safeSize));
  }

  return chunks.length ? chunks : [[]];
}

function rangeLabel(startIndex, count, total) {
  if (!total) return 'keine Einträge';
  const start = startIndex + 1;
  const end = Math.min(startIndex + count, total);
  return `${start}–${end} von ${total}`;
}

function normalizeQualityIssue(item, type = 'Hinweis', severity = 'warning', index = 0) {
  if (typeof item === 'object' && item !== null) {
    return {
      position: index + 1,
      type: item.type || type,
      severity: item.severity || severity,
      source: item.source || item.scope || item.target || item.id || '-',
      message: item.message || item.text || item.label || JSON.stringify(item),
    };
  }

  return {
    position: index + 1,
    type,
    severity,
    source: '-',
    message: String(item ?? ''),
  };
}

function normalizeQualityIssues(model = {}) {
  const errors = (model.quality?.errors || []).map((item, index) => normalizeQualityIssue(item, 'Fehler', 'error', index));
  const warnings = (model.quality?.warnings || []).map((item, index) => normalizeQualityIssue(item, 'Hinweis', 'warning', errors.length + index));

  return [...errors, ...warnings];
}

function qualityStatusLabel(status = 'ok') {
  if (status === 'error') return 'Fehler';
  if (status === 'warning') return 'Prüfen';
  return 'OK';
}

function qualityStatusClass(status = 'ok') {
  if (status === 'error') return 'error';
  if (status === 'warning') return 'warn';
  return 'ok';
}

function createPrintWaitScript() {
  return `
    <script>
      (function(){
        function protectImages(){
          var selector = 'img, svg, picture, canvas, .report-logo-wrap, .report-illustration-card, .report-catalog-image, .report-formpart-box';
          var images = Array.prototype.slice.call(document.images || []);

          images.forEach(function(img){
            img.setAttribute('draggable', 'false');
            img.classList.add('dp-protected-image');
          });

          ['contextmenu', 'dragstart', 'selectstart'].forEach(function(type){
            document.addEventListener(type, function(event){
              var target = event.target;
              if (target && target.closest && target.closest(selector)) {
                event.preventDefault();
              }
            }, true);
          });
        }

        function waitForImages(){
          protectImages();
          var images = Array.prototype.slice.call(document.images || []);
          if (!images.length) return Promise.resolve();

          return Promise.all(images.map(function(img){
            if (img.complete) return Promise.resolve();
            return new Promise(function(resolve){
              img.addEventListener('load', resolve, { once:true });
              img.addEventListener('error', resolve, { once:true });
              setTimeout(resolve, 2500);
            });
          }));
        }

        window.__druckverlustPrintReady = function(){
          return waitForImages().then(function(){
            return new Promise(function(resolve){ setTimeout(resolve, 250); });
          });
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', protectImages, { once:true });
        } else {
          protectImages();
        }
      })();
    <\/script>
  `;
}

function collectImageSources(html = '') {
  const sources = new Set();
  const pattern = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const source = match[1];
    if (source && !/^(data:|blob:)/i.test(source)) sources.add(source);
  }

  return [...sources];
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(source) {
  if (typeof fetch !== 'function' || typeof FileReader === 'undefined') return null;

  try {
    const response = await fetch(source, { cache: 'force-cache' });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob || !blob.size) return null;

    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

async function inlineHtmlImages(html = '') {
  const sources = collectImageSources(html);
  if (!sources.length) return html;

  const replacements = await Promise.all(sources.map(async source => [source, await fetchAsDataUrl(source)]));
  let output = html;

  replacements.forEach(([source, dataUrl]) => {
    if (!dataUrl) return;
    output = output.split(source).join(dataUrl);
  });

  return output;
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

function hasNonZero(value, tolerance = 0.000001) {
  return Math.abs(toNumber(value)) > tolerance;
}

function isEmptyLabel(value = '') {
  const text = String(value ?? '').trim().toLowerCase();
  return !text || text === '-' || /^ts\d+$/.test(text) || text === 'teilstrecke';
}

function isReportRelevantSection(row = {}) {
  const hasFormParts = Array.isArray(row.formParts) && row.formParts.length > 0;
  const hasLoss = hasNonZero(row.frictionLoss) || hasNonZero(row.zetaLoss) || hasNonZero(row.directLoss) || hasNonZero(row.totalLoss);
  const hasAirAndGeometry = hasNonZero(row.airflow)
    && (hasNonZero(row.area) || hasNonZero(row.width) || hasNonZero(row.height) || hasNonZero(row.diameter) || hasNonZero(row.length));
  const hasMeaningfulDescription = !isEmptyLabel(row.description) && row.description !== row.name;

  return hasFormParts || hasLoss || hasAirAndGeometry || hasMeaningfulDescription;
}

function isReportRelevantFormPart(row = {}) {
  return hasNonZero(row.zeta)
    || hasNonZero(row.pressureLoss)
    || !isEmptyLabel(row.name)
    || !isEmptyLabel(row.type);
}

function isReportRelevantSpecial(component = {}) {
  const name = String(component.name ?? '').trim();
  const type = String(component.type ?? '').trim();
  const manufacturer = String(component.manufacturer ?? '').trim();

  return hasNonZero(component.pressureLoss)
    || hasNonZero(component.airflow)
    || (!!name && name !== 'Sonderbauteil')
    || (!!type && type !== '-')
    || (!!manufacturer && manufacturer !== '-');
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

  if (typeof document !== 'undefined' && document.baseURI) {
    return new URL(cleanPath, document.baseURI).href;
  }

  if (typeof window !== 'undefined' && window.location?.href) {
    return new URL(cleanPath, window.location.href).href;
  }

  return cleanPath;
}

function getProjectMeta(project = {}) {
  const report = project.report || {};
  const meta = project.meta || {};
  const today = new Date().toLocaleDateString('de-CH');

  return {
    name: report.project ?? meta.name ?? project.name ?? project.title ?? project.projectName ?? 'Unbenanntes Projekt',
    object: report.object ?? report.objekt ?? meta.object ?? project.object ?? project.objekt ?? '-',
    plant: report.plant ?? report.anlage ?? meta.anlage ?? project.plant ?? project.anlage ?? null,
    plantNumber: report.anlageNumber ?? meta.anlageNumber ?? project.anlageNumber ?? project.systemNumber ?? '',
    author: report.author ?? report.bearbeiter ?? meta.bearbeiter ?? project.author ?? project.bearbeiter ?? '-',
    company: report.company ?? meta.company ?? project.company ?? project.firma ?? '',
    address: report.address ?? meta.address ?? project.address ?? project.adresse ?? '',
    date: report.date ?? report.datum ?? project.date ?? project.datum ?? today,
    note: report.note ?? report.hinweis ?? meta.note ?? project.note ?? '',
    reportNumber: report.reportNumber ?? report.berichtNr ?? report.berichtNummer ?? project.reportNumber ?? project.berichtNr ?? '-',
    revision: report.revision ?? report.rev ?? project.revision ?? project.rev ?? '0',
    checkedBy: report.checkedBy ?? report.geprueftVon ?? project.checkedBy ?? project.geprueftVon ?? '-',
    approvedBy: report.approvedBy ?? report.freigegebenVon ?? project.approvedBy ?? project.freigegebenVon ?? '-',
    approvalDate: report.approvalDate ?? report.freigabeDatum ?? project.approvalDate ?? project.freigabeDatum ?? '',
    software: report.software ?? 'Druckverlust Pro',
    version: report.version ?? project.version ?? '1.0.0',
  };
}


function normalizeRevisionHistory(project = {}, meta = {}) {
  const report = project.report || project.meta || {};
  const rawRows = Array.isArray(report.revisionHistory)
    ? report.revisionHistory
    : Array.isArray(report.revisions)
      ? report.revisions
      : Array.isArray(project.revisionHistory)
        ? project.revisionHistory
        : [];

  const rows = rawRows.map((row = {}) => ({
    revision: row.revision ?? row.rev ?? row.version ?? '',
    date: row.date ?? row.datum ?? '',
    author: row.author ?? row.bearbeiter ?? row.createdBy ?? '',
    change: row.change ?? row.description ?? row.text ?? row.comment ?? row.aenderung ?? '',
  })).filter(row => [row.revision, row.date, row.author, row.change].some(value => String(value ?? '').trim()));

  if (rows.length) return rows;

  return [{
    revision: meta.revision ?? '0',
    date: meta.date ?? new Date().toLocaleDateString('de-CH'),
    author: meta.author ?? '-',
    change: 'Erstausgabe',
  }];
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
    const reportOptions = normalizeReportOptions(project?.reportOptions || project?.report?.options || {});

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

    const allSectionRows = sections.map((section, index) => {
      const calculationItem = resultBySectionId.get(section.id) || null;
      const result = calculationItem?.result || {};
      const assignedFormParts = formParts
        .filter(part => part.sectionId === section.id || part.rowId === section.id || part.targetSectionId === section.id)
        .map(part => this.createFormPartRow(part, result, registry))
        .filter(part => isReportRelevantFormPart(part));

      return {
        position: index + 1,
        originalPosition: index + 1,
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

    const sectionRows = allSectionRows
      .filter(row => isReportRelevantSection(row))
      .map((row, index) => ({ ...row, position: index + 1 }));

    const formPartRows = formParts
      .map(part => this.createFormPartRow(part, null, registry))
      .filter(part => isReportRelevantFormPart(part));
    const allSpecialRows = specialComponents.map((component, index) => {
      const result = specialResultById.get(component.id) || {};
      return {
        position: index + 1,
        originalPosition: index + 1,
        id: component.id,
        name: componentName(component),
        type: component.type ?? component.description ?? '-',
        manufacturer: component.manufacturer ?? component.fabrikat ?? '-',
        airflow: component.q ?? component.airflow ?? component.volumeFlow ?? component.airVolume ?? '-',
        pressureLoss: result.pressureLoss ?? component.pressureLoss ?? component.pa ?? 0,
      };
    });

    const specialRows = allSpecialRows
      .filter(row => isReportRelevantSpecial(row))
      .map((row, index) => ({ ...row, position: index + 1 }));

    const formPartsBySection = sectionRows.map(section => ({
      section,
      formParts: section.formParts || [],
      sum: (section.formParts || []).reduce((total, part) => total + toNumber(part.pressureLoss), 0),
    }));

    const formPartCatalog = this.createFormPartCatalogRows(formPartsBySection);

    return {
      title: 'Druckverlustbericht',
      reportOptions,
      generatedAt: new Date().toISOString(),
      project: {
        id: project?.id ?? '-'
        , name: meta.name
        , object: meta.object
        , author: meta.author
        , company: meta.company
        , address: meta.address
        , plantNumber: meta.plantNumber
        , date: meta.date
        , software: meta.software
        , version: meta.version
        , note: meta.note
        , reportNumber: meta.reportNumber
        , revision: meta.revision
        , checkedBy: meta.checkedBy
        , approvedBy: meta.approvedBy
        , approvalDate: meta.approvalDate
        , revisionHistory: normalizeRevisionHistory(project, meta)
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
        sections: sectionRows.length,
        formParts: formPartRows.length,
        specialComponents: specialRows.length,
      },
      reportScope: {
        totalSections: sections.length,
        hiddenSections: Math.max(0, sections.length - sectionRows.length),
        totalFormParts: formParts.length,
        hiddenFormParts: Math.max(0, formParts.length - formPartRows.length),
        totalSpecialComponents: specialComponents.length,
        hiddenSpecialComponents: Math.max(0, specialComponents.length - specialRows.length),
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
      formPartCatalog,
      specialComponents: specialRows,
      assets: {
        logo: toAbsoluteAssetUrl('assets/logo/eo-logo.png'),
        reportHero: toAbsoluteAssetUrl('assets/report/duct-network-hero.png'),
      },
    };
  }

  static createFormPartCatalogRows(groups = []) {
    const catalog = new Map();

    (groups || []).forEach(group => {
      const sectionNameValue = group.section?.name || group.section?.description || '-';

      (group.formParts || []).forEach(part => {
        const key = part.type || part.name || part.id || 'formteil';
        const existing = catalog.get(key) || {
          key,
          name: part.type || part.name || 'Formteil',
          category: part.category || '-',
          image: part.image || '',
          reference: part.reference || '-',
          count: 0,
          zetaValues: [],
          pressureLoss: 0,
          sections: new Set(),
        };

        existing.count += 1;
        existing.pressureLoss += toNumber(part.pressureLoss);
        if (Number.isFinite(Number(part.zeta))) existing.zetaValues.push(toNumber(part.zeta));
        if (sectionNameValue && sectionNameValue !== '-') existing.sections.add(sectionNameValue);
        if (!existing.image && part.image) existing.image = part.image;
        catalog.set(key, existing);
      });
    });

    return [...catalog.values()]
      .map(item => ({
        ...item,
        zetaMin: item.zetaValues.length ? Math.min(...item.zetaValues) : null,
        zetaMax: item.zetaValues.length ? Math.max(...item.zetaValues) : null,
        sections: [...item.sections],
      }))
      .sort((a, b) => String(a.category).localeCompare(String(b.category), 'de') || String(a.name).localeCompare(String(b.name), 'de'));
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

  static createExportBaseName(model = {}) {
    const project = model.project || {};
    const system = model.system || {};
    const dateToken = compactFileToken(project.date || new Date().toISOString().slice(0, 10));
    const reportToken = compactFileToken(project.reportNumber || 'DP');
    const revisionToken = compactFileToken(project.revision ? `Rev${project.revision}` : 'Rev0');
    const projectToken = compactFileToken(project.name || 'Projekt');
    const plantToken = compactFileToken(system.name || project.plant || 'Anlage');

    return [reportToken, revisionToken, projectToken, plantToken, dateToken]
      .filter(Boolean)
      .join('_') || 'Druckverlustbericht';
  }

  static createDocumentTitle(model = {}) {
    const project = model.project || {};
    const system = model.system || {};
    const reportNumber = project.reportNumber && project.reportNumber !== '-' ? project.reportNumber : 'Druckverlust Pro';
    const revision = project.revision ? `Rev. ${project.revision}` : 'Rev. 0';
    const plant = system.name || project.plant || 'Anlage';

    return `${reportNumber} – ${plant} – ${revision}`;
  }

  static createExportChecklist(model = {}) {
    const project = model.project || {};
    const reportOptions = normalizeReportOptions(model.reportOptions || {});
    const contentOptions = [
      reportOptions.includeMainNetwork,
      reportOptions.includeAssignedFormParts,
      reportOptions.includeSpecialComponents,
      reportOptions.includeSummary,
      reportOptions.includeQualityProtocol,
      reportOptions.includeFormPartCatalog,
      reportOptions.includeApproval,
      reportOptions.includeInfo,
    ];

    const requiredProjectFields = [project.name, project.object, project.plantNumber, project.plant || model.system?.name, project.author, project.date];
    const requiredReleaseFields = [project.reportNumber, project.revision];
    const approvalFields = [project.checkedBy, project.approvedBy, project.approvalDate];
    const qualityOk = model.quality?.status === 'ok';
    const hasContent = contentOptions.some(Boolean);
    const hasCalculatedTotal = Number.isFinite(Number(model.totals?.total));

    const items = [
      {
        id: 'project-data',
        label: 'Projekt- und Anlagenangaben',
        status: requiredProjectFields.every(value => String(value ?? '').trim() && String(value ?? '').trim() !== '-') ? 'ok' : 'warning',
        message: 'Projektnummer, Projektname, BKP-Nummer, Anlage, Bearbeiter und Datum sind gepflegt.',
        warning: 'Projektnummer, Projektname, BKP-Nummer, Anlage, Bearbeiter oder Datum fehlen noch.',
      },
      {
        id: 'release-data',
        label: 'Bericht-Nr. und Revision',
        status: requiredReleaseFields.every(value => String(value ?? '').trim() && String(value ?? '').trim() !== '-') ? 'ok' : 'warning',
        message: 'Bericht-Nr. und Revision sind gesetzt.',
        warning: 'Bericht-Nr. oder Revision fehlen noch.',
      },
      {
        id: 'approval-data',
        label: 'Prüf- und Freigabeangaben',
        status: approvalFields.some(value => String(value ?? '').trim() && String(value ?? '').trim() !== '-') ? 'ok' : 'warning',
        message: 'Prüf-/Freigabeangaben sind teilweise oder vollständig gepflegt.',
        warning: 'Geprüft von, freigegeben von oder Freigabedatum sind noch leer.',
      },
      {
        id: 'quality-status',
        label: 'QS-Status',
        status: qualityOk ? 'ok' : 'warning',
        message: 'QS-Status ist OK.',
        warning: 'QS-Status ist nicht OK. Hinweise im Prüfprotokoll kontrollieren.',
      },
      {
        id: 'calculation-total',
        label: 'Berechnung',
        status: hasCalculatedTotal ? 'ok' : 'error',
        message: 'Berechnungsergebnis ist vorhanden.',
        warning: 'Berechnungsergebnis fehlt oder ist ungültig.',
      },
      {
        id: 'report-scope',
        label: 'Berichtsumfang',
        status: hasContent ? 'ok' : 'error',
        message: 'Mindestens eine Inhaltsseite ist aktiviert.',
        warning: 'Es ist keine Inhaltsseite aktiviert. Deckblatt alleine ist für die Abgabe zu wenig.',
      },
    ];

    const errorCount = items.filter(item => item.status === 'error').length;
    const warningCount = items.filter(item => item.status === 'warning').length;

    return {
      status: errorCount ? 'error' : warningCount ? 'warning' : 'ok',
      errorCount,
      warningCount,
      items,
      fileBaseName: this.createExportBaseName(model),
      documentTitle: this.createDocumentTitle(model),
    };
  }


  static createReportCompletionSummary(model = {}) {
    const plan = this.createPagePlan(model);
    const checklist = this.createExportChecklist(model);
    const visibleEntries = (plan.entries || []).filter(entry => entry.key !== 'cover');
    const hidden = model.reportScope || {};

    return {
      status: checklist.status,
      statusLabel: checklist.status === 'ok'
        ? 'Abschlussbereit'
        : checklist.status === 'error'
          ? 'Nicht abgabebereit'
          : 'Mit Hinweisen abgabebereit',
      totalPages: plan.totalPages,
      contentPages: Math.max(0, plan.totalPages - 1),
      activeSections: visibleEntries.length,
      activeSectionNames: visibleEntries.map(entry => entry.title),
      hiddenSections: Number(hidden.hiddenSections || 0),
      hiddenFormParts: Number(hidden.hiddenFormParts || 0),
      hiddenSpecialComponents: Number(hidden.hiddenSpecialComponents || 0),
      fileBaseName: checklist.fileBaseName,
      errorCount: checklist.errorCount,
      warningCount: checklist.warningCount,
    };
  }

  static createReportCompletionRows(model = {}) {
    const completion = this.createReportCompletionSummary(model);

    return [
      ['Berichtsstatus', completion.statusLabel],
      ['PDF-Seiten gesamt', completion.totalPages],
      ['Aktive Inhaltsbereiche', completion.activeSections],
      ['Ausgeblendete leere Teilstrecken', completion.hiddenSections],
      ['Ausgeblendete leere Formteile', completion.hiddenFormParts],
      ['Ausgeblendete leere Sonderbauteile', completion.hiddenSpecialComponents],
      ['Export-Dateiname', completion.fileBaseName],
    ];
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
  <title>${escapeHtml(this.createDocumentTitle(model))}</title>
  <meta name="generator" content="Druckverlust Pro – Phase 18.12c">
  <style>${this.getReportCss()}</style>
</head>
<body class="report-print-body">
  ${this.renderReportBody(model, { standalone: true, generatedLabel, includeStyle: false })}
  ${createPrintWaitScript()}
</body>
</html>`;
  }


  static async createStandaloneHtmlWithEmbeddedAssets(model) {
    const html = this.createStandaloneHtml(model);
    return inlineHtmlImages(html);
  }

  static createPagePlan(model) {
    const reportOptions = normalizeReportOptions(model.reportOptions || {});
    const mainPageCount = reportOptions.includeMainNetwork
      ? chunkArray(model.sections || [], MAIN_NETWORK_ROWS_PER_PAGE).length
      : 0;
    const formPartGroupCount = this.splitFormPartGroupsForReport(model.formPartsBySection || []).length;
    const formPartPageCount = reportOptions.includeAssignedFormParts
      ? chunkArray(new Array(formPartGroupCount).fill(null), FORMPART_BOXES_PER_PAGE).length
      : 0;
    const specialPageCount = reportOptions.includeSpecialComponents
      ? chunkArray(model.specialComponents || [], SPECIAL_ROWS_PER_PAGE).length
      : 0;
    const catalogPageCount = reportOptions.includeFormPartCatalog
      ? chunkArray(model.formPartCatalog || [], FORMPART_CATALOG_ROWS_PER_PAGE).length
      : 0;
    const qualityIssues = normalizeQualityIssues(model);
    const qualityPageCount = reportOptions.includeQualityProtocol
      ? chunkArray(qualityIssues, QUALITY_ROWS_PER_PAGE).length
      : 0;

    const entries = [
      {
        key: 'cover',
        title: 'Deckblatt / Zusammenfassung',
        description: 'Projektangaben und Druckverlust-Kennwerte',
        page: 1,
      },
    ];

    let currentPage = 1;
    let tocPage = null;

    if (reportOptions.includeToc) {
      currentPage += 1;
      tocPage = currentPage;
    }

    const addEntry = (key, title, description, pageCount = 1) => {
      const safePageCount = Math.max(0, Number(pageCount) || 0);
      if (!safePageCount) return null;

      const page = currentPage + 1;
      currentPage += safePageCount;
      const entry = { key, title, description, page, pageCount: safePageCount };
      entries.push(entry);
      return entry;
    };

    addEntry('mainNetwork', 'Hauptberechnung – Luftnetz', `${model.counts.sections} berechnungsrelevante Teilstrecken`, mainPageCount);
    addEntry('assignedFormParts', 'Zugeordnete Formteile', `${model.counts.formParts} Formteile nach Teilstrecke gruppiert`, formPartPageCount);
    addEntry('specialComponents', 'Sonderbauteile', `${model.counts.specialComponents} Komponenten`, specialPageCount);

    if (reportOptions.includeSummary) {
      addEntry('summary', 'Gesamtzusammenfassung', 'Summen, Berechnungsgrundlagen und QS-Status', 1);
    }

    addEntry('qualityProtocol', 'QS-Prüfprotokoll', `${qualityIssues.length} Hinweise / Fehler`, qualityPageCount);
    addEntry('formPartCatalog', 'Anhang – Formteilübersicht', `${model.formPartCatalog?.length || 0} verwendete Formteiltypen`, catalogPageCount);

    if (reportOptions.includeApproval) {
      addEntry('approval', 'Prüfung / Freigabe', 'Revisionsstand, Prüffelder und Unterschriften', 1);
    }

    if (reportOptions.includeInfo) {
      addEntry('info', 'Anlageninformationen / Hinweise', 'Projekt- und Berichtsdaten', 1);
    }

    return {
      totalPages: currentPage,
      tocPage,
      reportOptions,
      entries,
    };
  }

  static renderTocPage(model, page = 2, totalPages = 7, pagePlan = null) {
    const plan = pagePlan || this.createPagePlan(model);
    const content = `
      <div class="report-toc-layout">
        <div class="report-toc-card">
          <h3>Inhaltsverzeichnis</h3>
          <p>Der Bericht wird automatisch aus der aktuellen Projektberechnung erzeugt. Leere oder nicht berechnungsrelevante Einträge werden im Bericht ausgeblendet.</p>
          <table class="report-toc-table">
            <tbody>
              ${plan.entries.filter(entry => entry.page !== 1).map(entry => `
                <tr>
                  <td>
                    <strong>${escapeHtml(entry.title)}</strong>
                    <span>${escapeHtml(entry.description || '')}</span>
                  </td>
                  <td>${entry.pageCount && entry.pageCount > 1 ? `${entry.page}–${entry.page + entry.pageCount - 1}` : entry.page}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="report-toc-side">
          <div class="report-info-box compact">
            <h3>Berichtsumfang</h3>
            ${this.renderDefinitionList([
              ['Teilstrecken', model.counts.sections],
              ['Formteile', model.counts.formParts],
              ['Sonderbauteile', model.counts.specialComponents],
              ['QS-Status', model.quality.status === 'ok' ? 'OK' : 'Prüfen'],
              ['Gesamtdruckverlust', `${formatNumber(model.totals.total, 1)} Pa`],
            ])}
          </div>
          <div class="report-info-box compact muted">
            <h3>Hinweis</h3>
            <p>Für die PDF-Erstellung bitte im Browserdialog „Hintergrundgrafiken“ aktivieren, damit Farben und Tabellenköpfe korrekt gedruckt werden.</p>
          </div>
        </div>
      </div>
    `;

    return this.renderPage(model, page, 'Inhaltsverzeichnis', 'Struktur des Druckverlustberichts', content, totalPages);
  }

  static renderReportBody(model, options = {}) {
    const generatedLabel = options.generatedLabel || new Date(model.generatedAt).toLocaleString('de-CH');
    const includeStyle = options.includeStyle !== false;
    const totalPlaceholder = '__REPORT_TOTAL_PAGES__';
    const pagePlan = this.createPagePlan(model);
    const pages = [];
    let pageNumber = 1;
    const nextPage = () => pageNumber++;

    const reportOptions = pagePlan.reportOptions || normalizeReportOptions(model.reportOptions || {});

    pages.push(this.renderCoverPage(model, generatedLabel, nextPage(), totalPlaceholder));
    if (reportOptions.includeToc) pages.push(this.renderTocPage(model, nextPage(), totalPlaceholder, pagePlan));
    if (reportOptions.includeMainNetwork) pages.push(...this.renderMainNetworkPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeAssignedFormParts) pages.push(...this.renderAssignedFormPartsPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeSpecialComponents) pages.push(...this.renderSpecialComponentsPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeSummary) pages.push(this.renderSummaryPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeQualityProtocol) pages.push(...this.renderQualityProtocolPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeFormPartCatalog) pages.push(...this.renderFormPartCatalogPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeApproval) pages.push(this.renderApprovalPage(model, nextPage(), totalPlaceholder, generatedLabel));
    if (reportOptions.includeInfo) pages.push(this.renderInfoPage(model, nextPage(), totalPlaceholder));

    const body = `
      ${includeStyle ? `<style>${this.getReportCss()}</style>` : ''}
      <div class="dp-professional-report">
        ${pages.join('')}
      </div>
    `;

    return body.replaceAll(totalPlaceholder, String(pages.length));
  }

  static renderPage(model, page, title, subtitle, content, totalPages = 6) {
    return `
      <section class="report-page">
        <header class="report-page-head">
          <div class="report-logo-wrap">
            ${model.assets.logo ? `<img class="report-logo" src="${escapeHtml(model.assets.logo)}" alt="EO Logo" draggable="false" loading="lazy" decoding="async">` : '<div class="report-logo-placeholder">EO</div>'}
          </div>
          <div>
            <h2>${escapeHtml(title)}</h2>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
          </div>
        </header>
        <div class="report-page-content">${content}</div>
        ${this.renderFooter(page, totalPages)}
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

  static renderCoverPage(model, generatedLabel, page = 1, totalPages = 6) {
    return `
      <section class="report-page report-cover-page">
        <header class="report-cover-topbar">
          <div class="report-logo-wrap large">
            ${model.assets.logo ? `<img class="report-logo" src="${escapeHtml(model.assets.logo)}" alt="EO Logo" draggable="false" loading="lazy" decoding="async">` : '<div class="report-logo-placeholder">EO</div>'}
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
              ['Projektnummer', model.project.name],
              ['Projektname', model.project.object],
              ['BKP-Nummer', model.project.plantNumber || '-'],
              ['Anlage', model.system.name],
              ['Bearbeiter', model.project.author],
              ['Firma', model.project.company || '-'],
              ['Standort', model.project.address || '-'],
              ['Datum', model.project.date],
              ['Bericht-Nr.', model.project.reportNumber],
              ['Revision', model.project.revision],
            ])}
          </div>
          <div class="report-illustration-card">${model.assets.reportHero ? `<img class="report-hero-image" src="${escapeHtml(model.assets.reportHero)}" alt="Technische Lüftungskanal-Grafik" draggable="false" loading="lazy" decoding="async">` : makeDuctIllustration()}</div>
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
        ${this.renderFooter(page, totalPages)}
      </section>
    `;
  }

  static renderMainNetworkPages(model, nextPage, totalPages) {
    const sections = model.sections || [];
    const chunks = chunkArray(sections, MAIN_NETWORK_ROWS_PER_PAGE);
    const totalCount = sections.length;

    return chunks.map((chunk, chunkIndex) => {
      const startIndex = chunkIndex * MAIN_NETWORK_ROWS_PER_PAGE;
      const rows = chunk.map(section => this.renderMainNetworkRow(section)).join('');
      const isLastChunk = chunkIndex === chunks.length - 1;
      const subtitle = totalCount > MAIN_NETWORK_ROWS_PER_PAGE
        ? `Übersicht aller Teilstrecken (${rangeLabel(startIndex, chunk.length, totalCount)})`
        : 'Übersicht aller Teilstrecken';

      const content = `
        <table class="report-table compact report-table-network">
          <thead>
            <tr>
              <th>Pos.</th><th>Typ</th><th>Beschreibung</th><th>TS</th><th>Luft-<br>menge<br>m³/h</th><th>Breite<br>mm</th><th>Höhe<br>mm</th><th>Ø<br>mm</th><th>Länge<br>m</th><th>Fläche<br>m²</th><th>v<br>m/s</th><th>Δp<br>Pa</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="12">Keine Teilstrecken vorhanden.</td></tr>'}</tbody>
          ${isLastChunk ? `<tfoot><tr><td colspan="11" class="left"><strong>Summe Kanäle / Teilstrecken</strong></td><td><strong>${formatNumber(model.totals.friction, 1)} Pa</strong></td></tr></tfoot>` : ''}
        </table>

        ${isLastChunk ? `${this.renderMainNetworkLegend()}${this.renderHiddenEntriesNote(model.reportScope?.hiddenSections, 'leere Teilstrecken')}` : '<p class="report-continuation-note">Fortsetzung der Teilstrecken auf der nächsten Seite.</p>'}
      `;

      return this.renderPage(model, nextPage(), chunkIndex ? 'Hauptberechnung – Luftnetz Fortsetzung' : 'Hauptberechnung – Luftnetz', subtitle, content, totalPages);
    });
  }

  static renderMainNetworkRow(section) {
    return `
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
    `;
  }

  static renderMainNetworkLegend() {
    return `
      <div class="report-legend">
        <span><strong>TS</strong> = Teilstrecke</span>
        <span><strong>v</strong> = Luftgeschwindigkeit</span>
        <span><strong>Δp</strong> = Druckverlust</span>
        <span><strong>ζ</strong> = Formbeiwert</span>
        <span><strong>λ</strong> = Reibungszahl</span>
        <span><strong>ρ</strong> = Luftdichte</span>
      </div>
    `;
  }

  static renderAssignedFormPartsPages(model, nextPage, totalPages) {
    const allGroups = this.splitFormPartGroupsForReport(model.formPartsBySection || []);
    const pageGroups = chunkArray(allGroups, FORMPART_BOXES_PER_PAGE);
    const totalBoxes = allGroups.length;

    return pageGroups.map((groups, chunkIndex) => {
      const startIndex = chunkIndex * FORMPART_BOXES_PER_PAGE;
      const isLastChunk = chunkIndex === pageGroups.length - 1;
      const subtitle = totalBoxes > FORMPART_BOXES_PER_PAGE
        ? `Übersicht aller Formteile pro Teilstrecke (${rangeLabel(startIndex, groups.length, totalBoxes)})`
        : 'Übersicht aller Formteile pro Teilstrecke';

      const content = `
        <div class="report-formpart-grid">
          ${groups.length ? groups.map(group => this.renderFormPartSectionBox(group)).join('') : '<div class="report-empty">Keine Formteile vorhanden.</div>'}
        </div>
        ${isLastChunk ? `<div class="report-total-line"><span>Summe Formteile (alle Teilstrecken)</span><strong>${formatNumber(model.totals.formParts, 1)} Pa</strong></div>${this.renderHiddenEntriesNote(model.reportScope?.hiddenFormParts, 'leere Formteile')}` : '<p class="report-continuation-note">Fortsetzung der Formteile auf der nächsten Seite.</p>'}
      `;

      return this.renderPage(model, nextPage(), chunkIndex ? 'Zugeordnete Formteile Fortsetzung' : 'Zugeordnete Formteile', subtitle, content, totalPages);
    });
  }

  static splitFormPartGroupsForReport(groups = []) {
    const reportGroups = [];

    groups
      .filter(group => group.formParts?.length)
      .forEach(group => {
        const chunks = chunkArray(group.formParts, FORMPART_ROWS_PER_BOX);

        chunks.forEach((formParts, index) => {
          reportGroups.push({
            ...group,
            formParts,
            continuation: index > 0,
            sum: formParts.reduce((total, part) => total + toNumber(part.pressureLoss), 0),
            totalSectionSum: group.sum,
          });
        });
      });

    return reportGroups;
  }

  static renderFormPartSectionBox(group) {
    const section = group.section;
    const title = `${section.name} – ${this.describeSection(section)}${group.continuation ? ' (Fortsetzung)' : ''}`;

    return `
      <div class="report-formpart-box">
        <h3>${escapeHtml(title)}</h3>
        <table class="report-table small">
          <thead><tr><th>Formteil</th><th>Skizze</th><th>ζ</th><th>Δp</th></tr></thead>
          <tbody>
            ${group.formParts.map(part => `
              <tr>
                <td class="left">${escapeHtml(part.type || part.name)}</td>
                <td>${part.image ? `<img class="report-part-img" src="${escapeHtml(part.image)}" alt="${escapeHtml(part.name)}" draggable="false" loading="lazy" decoding="async">` : '-'}</td>
                <td>${formatNumber(part.zeta, 3)}</td>
                <td>${formatNumber(part.pressureLoss, 2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot><tr><td colspan="3" class="left"><strong>${group.continuation ? 'Zwischensumme' : `Summe ${escapeHtml(section.name)}`}</strong></td><td><strong>${formatNumber(group.sum, 2)}</strong></td></tr></tfoot>
        </table>
      </div>
    `;
  }

  static renderFormPartCatalogPages(model, nextPage, totalPages) {
    const rows = model.formPartCatalog || [];
    const chunks = chunkArray(rows, FORMPART_CATALOG_ROWS_PER_PAGE);
    const totalCount = rows.length;

    return chunks.map((chunk, chunkIndex) => {
      const startIndex = chunkIndex * FORMPART_CATALOG_ROWS_PER_PAGE;
      const subtitle = totalCount > FORMPART_CATALOG_ROWS_PER_PAGE
        ? `Verwendete Formteiltypen im Projekt (${rangeLabel(startIndex, chunk.length, totalCount)})`
        : 'Verwendete Formteiltypen im Projekt';

      const content = `
        <div class="report-catalog-list">
          ${chunk.length ? chunk.map(row => this.renderFormPartCatalogCard(row)).join('') : '<div class="report-empty">Keine Formteile vorhanden.</div>'}
        </div>
        ${chunkIndex < chunks.length - 1 ? '<p class="report-continuation-note">Fortsetzung der Formteilübersicht auf der nächsten Seite.</p>' : ''}
      `;

      return this.renderPage(model, nextPage(), chunkIndex ? 'Anhang – Formteilübersicht Fortsetzung' : 'Anhang – Formteilübersicht', subtitle, content, totalPages);
    });
  }

  static renderFormPartCatalogCard(row = {}) {
    const zetaLabel = row.zetaValues?.length
      ? (row.zetaMin === row.zetaMax ? formatNumber(row.zetaMin, 3) : `${formatNumber(row.zetaMin, 3)} – ${formatNumber(row.zetaMax, 3)}`)
      : '-';
    const sections = (row.sections || []).slice(0, 5).join(', ');
    const moreSections = (row.sections || []).length > 5 ? ` +${row.sections.length - 5}` : '';

    return `
      <article class="report-catalog-card">
        <div class="report-catalog-image">
          ${row.image ? `<img src="${escapeHtml(row.image)}" alt="${escapeHtml(row.name)}" draggable="false" loading="lazy" decoding="async">` : '<span>Keine Skizze</span>'}
        </div>
        <div class="report-catalog-body">
          <div class="report-catalog-head">
            <strong>${escapeHtml(row.name)}</strong>
            <span>${escapeHtml(row.category)}</span>
          </div>
          <dl>
            <dt>Anzahl</dt><dd>${row.count}</dd>
            <dt>ζ-Bereich</dt><dd>${zetaLabel}</dd>
            <dt>Summe Δp</dt><dd>${formatNumber(row.pressureLoss, 2)} Pa</dd>
            <dt>Bezug</dt><dd>${escapeHtml(row.reference || '-')}</dd>
          </dl>
          <p><strong>Verwendet in:</strong> ${escapeHtml(sections || '-')}${escapeHtml(moreSections)}</p>
        </div>
      </article>
    `;
  }

  static renderSpecialComponentsPages(model, nextPage, totalPages) {
    const components = model.specialComponents || [];
    const chunks = chunkArray(components, SPECIAL_ROWS_PER_PAGE);
    const totalCount = components.length;

    return chunks.map((chunk, chunkIndex) => {
      const startIndex = chunkIndex * SPECIAL_ROWS_PER_PAGE;
      const isLastChunk = chunkIndex === chunks.length - 1;
      const rows = chunk.map(component => this.renderSpecialComponentRow(component)).join('');
      const subtitle = totalCount > SPECIAL_ROWS_PER_PAGE
        ? `Übersicht aller Sonderbauteile (${rangeLabel(startIndex, chunk.length, totalCount)})`
        : 'Übersicht aller Sonderbauteile';

      const content = `
        <table class="report-table">
          <thead><tr><th>Pos.</th><th>Bezeichnung</th><th>Typ / Beschreibung</th><th>Luftmenge<br>m³/h</th><th>Druckverlust<br>Pa</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">Keine Sonderbauteile vorhanden.</td></tr>'}</tbody>
          ${isLastChunk ? `<tfoot><tr><td colspan="4" class="left"><strong>Summe Sonderbauteile</strong></td><td><strong>${formatNumber(model.totals.special, 1)} Pa</strong></td></tr></tfoot>` : ''}
        </table>
        ${!isLastChunk ? '<p class="report-continuation-note">Fortsetzung der Sonderbauteile auf der nächsten Seite.</p>' : this.renderHiddenEntriesNote(model.reportScope?.hiddenSpecialComponents, 'leere Sonderbauteile')}
      `;

      return this.renderPage(model, nextPage(), chunkIndex ? 'Sonderbauteile Fortsetzung' : 'Sonderbauteile', subtitle, content, totalPages);
    });
  }

  static renderSpecialComponentRow(component) {
    return `
      <tr>
        <td>${component.position}</td>
        <td class="left">${escapeHtml(component.name)}</td>
        <td class="left">${escapeHtml(component.type)}</td>
        <td>${component.airflow === '-' ? '-' : `${formatAirflow(component.airflow)}`}</td>
        <td>${formatNumber(component.pressureLoss, 1)}</td>
      </tr>
    `;
  }

  static renderHiddenEntriesNote(count = 0, label = 'leere Einträge') {
    const hiddenCount = Number(count || 0);
    if (!hiddenCount) return '';

    return `<p class="report-filter-note">${hiddenCount} ${escapeHtml(label)} im Bericht ausgeblendet.</p>`;
  }

  static renderReportScopeBlock(model) {
    const scope = model.reportScope || {};
    const hiddenTotal = Number(scope.hiddenSections || 0)
      + Number(scope.hiddenFormParts || 0)
      + Number(scope.hiddenSpecialComponents || 0);

    if (!hiddenTotal) return '';

    return `
      <div class="report-info-box">
        <h3>Berichtsumfang</h3>
        <p>Leere oder nicht berechnungsrelevante Einträge werden im PDF-Bericht automatisch ausgeblendet.</p>
        <ul>
          ${Number(scope.hiddenSections || 0) ? `<li>${scope.hiddenSections} leere Teilstrecken ausgeblendet.</li>` : ''}
          ${Number(scope.hiddenFormParts || 0) ? `<li>${scope.hiddenFormParts} leere Formteile ausgeblendet.</li>` : ''}
          ${Number(scope.hiddenSpecialComponents || 0) ? `<li>${scope.hiddenSpecialComponents} leere Sonderbauteile ausgeblendet.</li>` : ''}
        </ul>
      </div>
    `;
  }

  static renderQualityProtocolPages(model, nextPage, totalPages) {
    const issues = normalizeQualityIssues(model);
    const chunks = chunkArray(issues, QUALITY_ROWS_PER_PAGE);
    const totalCount = issues.length;

    return chunks.map((chunk, chunkIndex) => {
      const startIndex = chunkIndex * QUALITY_ROWS_PER_PAGE;
      const subtitle = totalCount > QUALITY_ROWS_PER_PAGE
        ? `Plausibilitätsprüfung und Berechnungsabgleich (${rangeLabel(startIndex, chunk.length, totalCount)})`
        : 'Plausibilitätsprüfung und Berechnungsabgleich';

      const content = `
        ${chunkIndex === 0 ? this.renderQualityOverview(model) : ''}
        ${chunkIndex === 0 ? this.renderCalculationAuditBlock(model) : ''}
        ${this.renderQualityIssueTable(chunk)}
        ${chunkIndex < chunks.length - 1 ? '<p class="report-continuation-note">Fortsetzung des QS-Prüfprotokolls auf der nächsten Seite.</p>' : ''}
      `;

      return this.renderPage(model, nextPage(), chunkIndex ? 'QS-Prüfprotokoll Fortsetzung' : 'QS-Prüfprotokoll', subtitle, content, totalPages);
    });
  }

  static renderQualityOverview(model) {
    const statusClass = qualityStatusClass(model.quality.status);
    const statusLabel = qualityStatusLabel(model.quality.status);

    return `
      <div class="report-quality-grid">
        <div class="report-quality-status ${statusClass}">
          <span>Status</span>
          <strong>${escapeHtml(statusLabel)}</strong>
          <small>${model.quality.errorCount || 0} Fehler · ${model.quality.warningCount || 0} Hinweise</small>
        </div>
        <div class="report-quality-status neutral">
          <span>Teilstrecken</span>
          <strong>${model.counts.sections}</strong>
          <small>berechnungsrelevant</small>
        </div>
        <div class="report-quality-status neutral">
          <span>Formteile</span>
          <strong>${model.counts.formParts}</strong>
          <small>im Bericht berücksichtigt</small>
        </div>
        <div class="report-quality-status neutral">
          <span>Sonderbauteile</span>
          <strong>${model.counts.specialComponents}</strong>
          <small>im Bericht berücksichtigt</small>
        </div>
      </div>
    `;
  }

  static renderCalculationAuditBlock(model) {
    const splitTotal = toNumber(model.totals.friction) + toNumber(model.totals.formParts) + toNumber(model.totals.special);
    const rawTotal = Number.isFinite(Number(model.totals.rawTotal)) ? toNumber(model.totals.rawTotal) : splitTotal;
    const difference = splitTotal - rawTotal;

    return `
      <div class="report-info-box report-audit-box">
        <h3>Berechnungsabgleich</h3>
        <div class="report-audit-grid">
          <div><span>Reibungsverlust</span><strong>${formatNumber(model.totals.friction, 2)} Pa</strong></div>
          <div><span>Formteile</span><strong>${formatNumber(model.totals.formParts, 2)} Pa</strong></div>
          <div><span>Sonderbauteile</span><strong>${formatNumber(model.totals.special, 2)} Pa</strong></div>
          <div><span>Summe Einzelwerte</span><strong>${formatNumber(splitTotal, 2)} Pa</strong></div>
          <div><span>Systemtotal ungerundet</span><strong>${formatNumber(rawTotal, 2)} Pa</strong></div>
          <div><span>Differenz</span><strong>${formatNumber(difference, 4)} Pa</strong></div>
        </div>
      </div>
    `;
  }

  static renderQualityIssueTable(issues = []) {
    if (!issues.length) {
      return `
        <div class="report-info-box ok">
          <h3>Prüfergebnis</h3>
          <p>Keine Fehler oder Hinweise vorhanden. Die Projektberechnung ist aus Berichtssicht plausibel.</p>
        </div>
      `;
    }

    return `
      <table class="report-table report-issue-table">
        <thead><tr><th>Nr.</th><th>Art</th><th>Bereich</th><th>Beschreibung</th></tr></thead>
        <tbody>
          ${issues.map(issue => `
            <tr class="issue-${escapeHtml(issue.severity)}">
              <td>${issue.position}</td>
              <td>${escapeHtml(issue.type)}</td>
              <td>${escapeHtml(issue.source || '-')}</td>
              <td class="left">${escapeHtml(issue.message)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  static renderSummaryPage(model, page, totalPages = 6) {
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

    return this.renderPage(model, page, 'Gesamtzusammenfassung', 'Ergebnis der Hauptberechnung', content, totalPages);
  }



  static renderRevisionHistoryTable(model) {
    const rows = Array.isArray(model.project?.revisionHistory) ? model.project.revisionHistory : [];

    if (!rows.length) return '';

    return `
      <div class="report-info-box report-revision-history">
        <h3>Revisionsverlauf</h3>
        <table class="report-table small report-revision-table">
          <thead>
            <tr><th>Revision</th><th>Datum</th><th>Bearbeiter</th><th>Änderung / Bemerkung</th></tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td>${escapeHtml(row.revision || '-')}</td>
                <td>${escapeHtml(row.date || '-')}</td>
                <td class="left">${escapeHtml(row.author || '-')}</td>
                <td class="left">${escapeHtml(row.change || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  static renderApprovalPage(model, page, totalPages = 6, generatedLabel = '') {
    const statusLabel = qualityStatusLabel(model.quality.status);
    const statusClass = qualityStatusClass(model.quality.status);
    const revisionRows = [
      ['Bericht-Nr.', model.project.reportNumber],
      ['Revision', model.project.revision],
      ['Erstellt am', model.project.date],
      ['Generiert am', generatedLabel || '-'],
      ['QS-Status', statusLabel],
    ];

    const content = `
      <div class="report-approval-layout">
        <div class="report-approval-card">
          <h3>Berichtsstand</h3>
          ${this.renderDefinitionList(revisionRows)}
        </div>
        <div class="report-approval-card status ${statusClass}">
          <h3>Prüfstatus</h3>
          <strong>${escapeHtml(statusLabel)}</strong>
          <p>${model.quality.errorCount || 0} Fehler · ${model.quality.warningCount || 0} Hinweise</p>
          <small>Details siehe QS-Prüfprotokoll.</small>
        </div>
      </div>

      ${this.renderRevisionHistoryTable(model)}

      <table class="report-table report-approval-table">
        <thead><tr><th>Schritt</th><th>Name</th><th>Datum</th><th>Unterschrift</th></tr></thead>
        <tbody>
          <tr>
            <td class="left"><strong>Erstellt</strong></td>
            <td class="left">${escapeHtml(model.project.author || '-')}</td>
            <td>${escapeHtml(model.project.date || '-')}</td>
            <td class="signature-cell"></td>
          </tr>
          <tr>
            <td class="left"><strong>Geprüft</strong></td>
            <td class="left">${escapeHtml(model.project.checkedBy || '-')}</td>
            <td></td>
            <td class="signature-cell"></td>
          </tr>
          <tr>
            <td class="left"><strong>Freigegeben</strong></td>
            <td class="left">${escapeHtml(model.project.approvedBy || '-')}</td>
            <td>${escapeHtml(model.project.approvalDate || '')}</td>
            <td class="signature-cell"></td>
          </tr>
        </tbody>
      </table>

      <div class="report-info-box">
        <h3>Vermerk</h3>
        <p>Dieses Blatt dient als internes Prüf- und Freigabefeld für den Druckverlustbericht. Die fachliche Verantwortung für Eingabedaten, Zuordnung der Formteile und projektspezifische Annahmen liegt beim Bearbeiter beziehungsweise bei der prüfenden Stelle.</p>
      </div>
    `;

    return this.renderPage(model, page, 'Prüfung / Freigabe', 'Revisionsstand und Unterschriftenfeld', content, totalPages);
  }

  static renderInfoPage(model, page, totalPages = 6) {
    const content = `
      <div class="report-two-col">
        <div>
          <h3>Anlageninformationen</h3>
          ${this.renderDefinitionList([
            ['Projektnummer', model.project.name],
            ['Projektname', model.project.object],
            ['BKP-Nummer', model.project.plantNumber || '-'],
            ['Anlage', model.system.name],
            ['Bearbeiter', model.project.author],
            ['Datum', model.project.date],
            ['Bericht-Nr.', model.project.reportNumber],
            ['Revision', model.project.revision],
            ['Geprüft von', model.project.checkedBy],
            ['Freigegeben von', model.project.approvedBy],
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
      ${this.renderReportScopeBlock(model)}
      <p class="report-copyright">© ${new Date().getFullYear()} Emre Özgöller – Druckverlust Pro</p>
    `;

    return this.renderPage(model, page, 'Anlageninformationen', 'Projektabschluss und Hinweise', content, totalPages);
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
      .report-print-body{margin:0;background:#eef3f9;font-family:Segoe UI,Arial,sans-serif;color:var(--report-text);-webkit-print-color-adjust:exact;print-color-adjust:exact}
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
      .report-formpart-box,.report-summary-card,.report-result-box,.report-info-box,.report-table tr{break-inside:avoid;page-break-inside:avoid}

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

      .report-quality-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
      .report-quality-status{border:1px solid var(--report-line);border-radius:7px;background:#fbfdff;padding:9px 10px;min-height:24mm;display:flex;flex-direction:column;justify-content:space-between}
      .report-quality-status span{font-size:8.5px;color:var(--report-muted);font-weight:900;text-transform:uppercase;letter-spacing:.04em}
      .report-quality-status strong{font-size:16px;color:var(--report-blue);line-height:1.1;margin-top:4px}
      .report-quality-status small{font-size:8.2px;color:#536a83;line-height:1.2;margin-top:4px}
      .report-quality-status.ok{border-color:#b8dfc4;background:#f3fbf5}
      .report-quality-status.warn{border-color:#f2c282;background:#fff8ed}
      .report-quality-status.error{border-color:#e8a0a0;background:#fff2f2}
      .report-quality-status.warn strong{color:#9a5a00}.report-quality-status.error strong{color:#a52828}
      .report-audit-box{margin-bottom:12px}
      .report-audit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
      .report-audit-grid div{border:1px solid var(--report-line);border-radius:5px;background:white;padding:7px 8px}
      .report-audit-grid span{display:block;color:var(--report-muted);font-size:8.2px;text-transform:uppercase;font-weight:900;margin-bottom:3px}
      .report-audit-grid strong{display:block;color:var(--report-blue);font-size:11px}
      .report-issue-table th:nth-child(1){width:13mm}.report-issue-table th:nth-child(2){width:22mm}.report-issue-table th:nth-child(3){width:34mm}
      .report-issue-table td{font-size:8.4px;line-height:1.25}
      .report-issue-table .issue-error td:nth-child(2){color:#a52828;font-weight:900}.report-issue-table .issue-warning td:nth-child(2){color:#9a5a00;font-weight:900}
      .report-approval-layout{display:grid;grid-template-columns:1.25fr .75fr;gap:16px;margin-bottom:16px}
      .report-approval-card{border:1px solid var(--report-line);border-radius:8px;background:#f8fbff;padding:12px 14px;min-height:34mm}
      .report-approval-card h3{margin:0 0 10px;color:var(--report-blue);font-size:11px;text-transform:uppercase;letter-spacing:.05em}
      .report-approval-card.status{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;background:#f6f9fd}
      .report-approval-card.status strong{font-size:28px;line-height:1;color:#123b64;text-transform:uppercase;margin:2px 0 8px}
      .report-approval-card.status.ok{border-color:#bde5ce;background:#f2fbf5}.report-approval-card.status.warn{border-color:#f2c282;background:#fff8ed}.report-approval-card.status.error{border-color:#efb7b7;background:#fff4f4}
      .report-approval-card.status p{margin:0;color:#223950;font-size:10px}.report-approval-card.status small{margin-top:8px;color:#536a83;font-size:8.8px}
      .report-approval-table{margin-top:10px}
      .report-approval-table th{font-size:8px}.report-approval-table td{height:20mm;font-size:10px}
      .report-approval-table .signature-cell{background:linear-gradient(to bottom, transparent 70%, #d9e2ee 70%, #d9e2ee 72%, transparent 72%)}
      .report-revision-history{margin:8mm 0 6mm}
      .report-revision-table th,.report-revision-table td{font-size:8px}
      .report-revision-table td.left{font-size:8.5px}
      .report-toc-layout{display:grid;grid-template-columns:1.45fr .9fr;gap:20px;align-items:start}
      .report-toc-card{border:1px solid var(--report-line);border-radius:10px;background:white;overflow:hidden}
      .report-toc-card h3{margin:0;background:linear-gradient(135deg,#05316a,#0b5eb0);color:white;padding:12px 16px;font-size:14px;letter-spacing:.04em;text-transform:uppercase}
      .report-toc-card p{margin:12px 16px 8px;color:#43566d;font-size:10px;line-height:1.45}
      .report-toc-table{width:100%;border-collapse:collapse;font-size:10px}
      .report-toc-table td{border-top:1px solid var(--report-line);padding:10px 16px;vertical-align:top}
      .report-toc-table td:first-child strong{display:block;color:#123b64;font-size:11px;margin-bottom:3px}
      .report-toc-table td:first-child span{display:block;color:#5b7088;font-size:9px;line-height:1.3}
      .report-toc-table td:last-child{width:48px;text-align:right;font-weight:900;color:#0b5eb0;font-size:12px}
      .report-toc-side{display:grid;gap:12px}
      .report-info-box.compact{margin-top:0;padding:11px 12px}
      .report-info-box.compact h3{margin-top:0;margin-bottom:8px;color:#123b64;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
      .report-info-box.muted{background:#f7f9fc}

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
      .report-table-network td{padding:3.6px 2.6px;font-size:7.4px;line-height:1.18}
      .report-continuation-note{margin:10px 0 0;color:var(--report-muted);font-size:9px;font-style:italic}
      .report-filter-note{margin:9px 0 0;color:#536a83;font-size:8.8px;font-style:italic;text-align:right}
      .report-table.small{font-size:8.2px}
      .report-table.small th{font-size:7.4px}
      .report-legend{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 18px;margin-top:13px;font-size:9px;color:#23364c}
      .report-legend span{display:block}
      .report-formpart-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .report-formpart-box{border:1px solid var(--report-line);border-radius:6px;overflow:hidden;background:white}
      .report-formpart-box h3{margin:0;background:var(--report-blue);color:white;padding:7px 9px;font-size:10px}
      .report-part-img{max-width:82px;max-height:50px;object-fit:contain}
      .report-catalog-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .report-catalog-card{display:grid;grid-template-columns:30mm 1fr;gap:9px;border:1px solid var(--report-line);border-radius:7px;background:#fff;overflow:hidden;min-height:31mm;break-inside:avoid;page-break-inside:avoid}
      .report-catalog-image{display:grid;place-items:center;background:#f4f8fd;border-right:1px solid var(--report-line);padding:5px}
      .report-catalog-image img{max-width:100%;max-height:25mm;object-fit:contain}
      .report-catalog-image span{font-size:8px;color:var(--report-muted);text-align:center}
      .report-catalog-body{padding:7px 8px;font-size:8.5px;line-height:1.25}
      .report-catalog-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:5px}
      .report-catalog-head strong{color:var(--report-blue);font-size:9.5px;line-height:1.15}
      .report-catalog-head span{background:#eaf2fb;color:#123b64;border-radius:999px;padding:2px 6px;font-size:7.4px;font-weight:900;white-space:nowrap}
      .report-catalog-card dl{display:grid;grid-template-columns:19mm 1fr;gap:2px 5px;margin:0}
      .report-catalog-card dt{font-weight:900;color:#24364c}.report-catalog-card dd{margin:0;color:#06172b}
      .report-catalog-card p{margin:5px 0 0;color:#4f637c;font-size:7.8px;line-height:1.25}
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
      .dp-professional-report img,.report-print-body img{user-select:none;-webkit-user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none;pointer-events:none}
      .report-copyright{text-align:center;margin-top:32px;color:#43566d;font-size:10.4px}
      .report-empty{border:1px dashed var(--report-line);border-radius:8px;padding:20px;color:var(--report-muted);background:#fafcff}
      .report-footer{position:absolute;left:13mm;right:13mm;bottom:7mm;border-top:1px solid #d6deea;padding-top:5px;display:flex;justify-content:space-between;font-size:8.8px;color:#223950}
      @media screen and (max-width:960px){.dp-professional-report{overflow:auto}.report-page{width:100%;height:auto;min-height:auto}.report-formpart-grid,.report-catalog-list,.report-cover-main,.report-summary-cards.cover,.report-two-col,.report-quality-grid,.report-audit-grid,.report-approval-layout{grid-template-columns:1fr}.report-cover-summary{margin-top:18px}}
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


  static csvCell(value = '') {
    const text = String(value ?? '').replace(/\r?\n/g, ' ').trim();
    const escaped = text.replaceAll('"', '""');
    return `"${escaped}"`;
  }

  static csvRow(values = []) {
    return values.map(value => this.csvCell(value)).join(';');
  }

  static createCsv(model) {
    const rows = [];
    const addEmpty = () => rows.push('');
    const addSection = title => {
      if (rows.length) addEmpty();
      rows.push(this.csvRow([title]));
    };

    rows.push(this.csvRow(['Druckverlust Pro – Datenexport']));
    rows.push(this.csvRow(['Projektnummer', model.project.name]));
    rows.push(this.csvRow(['Projektname', model.project.object]));
    rows.push(this.csvRow(['BKP-Nummer', model.project.plantNumber || '-']));
    rows.push(this.csvRow(['Anlage', model.system.name]));
    rows.push(this.csvRow(['Bearbeiter', model.project.author]));
    rows.push(this.csvRow(['Datum', model.project.date]));
    rows.push(this.csvRow(['Bericht-Nr.', model.project.reportNumber]));
    rows.push(this.csvRow(['Revision', model.project.revision]));
    rows.push(this.csvRow(['Geprueft von', model.project.checkedBy]));
    rows.push(this.csvRow(['Freigegeben von', model.project.approvedBy]));
    rows.push(this.csvRow(['Gesamtdruckverlust Pa', formatNumber(model.totals.total, 2)]));

    addSection('Teilstrecken');
    rows.push(this.csvRow(['Pos.', 'Typ', 'Beschreibung', 'TS', 'Luftmenge m3/h', 'Breite mm', 'Hoehe mm', 'Durchmesser mm', 'Laenge m', 'Flaeche m2', 'v m/s', 'Reibung Pa', 'Formteile Pa', 'Direkt Pa', 'Gesamt Pa']));
    (model.sections || []).forEach(section => {
      rows.push(this.csvRow([
        section.position,
        section.type,
        section.description || section.typeLabel,
        section.name,
        formatAirflow(section.airflow),
        section.type === 'Rohr' ? '-' : formatSmart(toNumber(section.width) * 1000, 0),
        section.type === 'Rohr' ? '-' : formatSmart(toNumber(section.height) * 1000, 0),
        section.type === 'Rohr' ? formatSmart(toNumber(section.diameter) * 1000, 0) : '-',
        formatSmart(section.length, 2),
        formatNumber(section.area, 3),
        formatNumber(section.velocity, 2),
        formatNumber(section.frictionLoss, 3),
        formatNumber(section.zetaLoss, 3),
        formatNumber(section.directLoss, 3),
        formatNumber(section.totalLoss, 3),
      ]));
    });

    addSection('Formteile');
    rows.push(this.csvRow(['Teilstrecke', 'Formteil', 'Kategorie', 'Bezug', 'Zeta', 'Dynamischer Druck Pa', 'Druckverlust Pa']));
    (model.formPartsBySection || []).forEach(group => {
      (group.formParts || []).forEach(part => {
        rows.push(this.csvRow([
          group.section?.name || part.sectionId || '-',
          part.type || part.name,
          part.category,
          part.reference,
          formatNumber(part.zeta, 3),
          formatNumber(part.dynamicPressure, 3),
          formatNumber(part.pressureLoss, 3),
        ]));
      });
    });

    addSection('Sonderbauteile');
    rows.push(this.csvRow(['Pos.', 'Bezeichnung', 'Typ / Beschreibung', 'Hersteller', 'Luftmenge m3/h', 'Druckverlust Pa']));
    (model.specialComponents || []).forEach(component => {
      rows.push(this.csvRow([
        component.position,
        component.name,
        component.type,
        component.manufacturer,
        formatAirflow(component.airflow),
        formatNumber(component.pressureLoss, 2),
      ]));
    });

    addSection('Zusammenfassung');
    rows.push(this.csvRow(['Kanal / Rohr Pa', formatNumber(model.totals.friction, 2)]));
    rows.push(this.csvRow(['Formteile Pa', formatNumber(model.totals.formParts, 2)]));
    rows.push(this.csvRow(['Sonderbauteile Pa', formatNumber(model.totals.special, 2)]));
    rows.push(this.csvRow(['Gesamtdruckverlust Pa', formatNumber(model.totals.total, 2)]));

    addSection('QS-Pruefprotokoll');
    rows.push(this.csvRow(['Status', qualityStatusLabel(model.quality.status)]));
    rows.push(this.csvRow(['Fehler', model.quality.errorCount || 0]));
    rows.push(this.csvRow(['Hinweise', model.quality.warningCount || 0]));
    rows.push(this.csvRow(['Art', 'Bereich', 'Beschreibung']));
    normalizeQualityIssues(model).forEach(issue => {
      rows.push(this.csvRow([issue.type, issue.source, issue.message]));
    });

    addSection('Revisionsverlauf');
    rows.push(this.csvRow(['Revision', 'Datum', 'Bearbeiter', 'Aenderung / Bemerkung']));
    (model.project.revisionHistory || []).forEach(row => {
      rows.push(this.csvRow([row.revision, row.date, row.author, row.change]));
    });

    addSection('Pruefung / Freigabe');
    rows.push(this.csvRow(['Erstellt', model.project.author, model.project.date]));
    rows.push(this.csvRow(['Geprueft', model.project.checkedBy, '']));
    rows.push(this.csvRow(['Freigegeben', model.project.approvedBy, model.project.approvalDate || '']));

    addSection('Berichtsabschluss');
    this.createReportCompletionRows(model).forEach(row => rows.push(this.csvRow(row)));

    return `\ufeff${rows.join('\r\n')}`;
  }

  static downloadCsv(model) {
    const csv = this.createCsv(model);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.createExportBaseName(model)}_Datenexport.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  static async downloadHtml(model) {
    const html = await this.createStandaloneHtmlWithEmbeddedAssets(model);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.createExportBaseName(model)}_Bericht.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  static openPrintWindow(model) {
    const html = this.createStandaloneHtml(model);
    const reportWindow = window.open('', '_blank');

    if (!reportWindow) {
      throw new Error('Druckfenster konnte nicht geöffnet werden. Bitte Pop-up-Blocker prüfen.');
    }

    const printWhenReady = () => {
      const ready = typeof reportWindow.__druckverlustPrintReady === 'function'
        ? reportWindow.__druckverlustPrintReady()
        : Promise.resolve();

      ready
        .catch(() => null)
        .then(() => {
          reportWindow.focus();
          reportWindow.print();
        });
    };

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();

    reportWindow.addEventListener('load', printWhenReady, { once: true });
    reportWindow.setTimeout(printWhenReady, 1000);
  }

  static helpers = {
    formatNumber,
    formatAirflow,
    escapeHtml,
  };
}

export default ReportEngine;
