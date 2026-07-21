import { APP_BUILD_LABEL, APP_RELEASE } from '../core/appVersion.js?v=40.00&release=46.00';
import LicenseGate from '../licensing/LicenseGate.js';
import EngineeringQualityEngine from '../quality/EngineeringQualityEngine.js?v=37.00&release=46.00';
import NetworkSchematicEngine from '../schematic/NetworkSchematicEngine.js?v=37.00&release=46.00';
import ReportSchematicRenderer from './ReportSchematicRenderer.js?v=37.00&release=46.00';
import ProjectCompletionEngine from '../closing/ProjectCompletionEngine.js?v=37.00&release=46.00';
import ProjectHandoverEngine from '../handover/ProjectHandoverEngine.js?v=37.00&release=46.00';
import SystemPortfolioEngine from '../project/SystemPortfolioEngine.js?v=37.00&release=46.00';
import ProjectPortfolioQualityEngine from '../project/ProjectPortfolioQualityEngine.js?v=37.00&release=46.00';
import ProjectStandardizationEngine from '../project/ProjectStandardizationEngine.js?v=37.00&release=46.00';
import ProjectTaskCenterEngine from '../project/ProjectTaskCenterEngine.js?v=37.00&release=46.00';
import ProjectDependencyEngine from '../project/ProjectDependencyEngine.js?v=39.00&release=46.00';
import { analyzeSystemVelocityCompliance } from '../standards/SiaVelocityCompliance.js?v=51.20';

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

function createPdfFileName(fileBaseName = 'Druckverlustbericht') {
  return `${safeFileName(fileBaseName || 'Druckverlustbericht')}_Bericht.pdf`;
}

function createHtmlFileName(fileBaseName = 'Druckverlustbericht') {
  return `${safeFileName(fileBaseName || 'Druckverlustbericht')}_Bericht.html`;
}

function createCsvFileName(fileBaseName = 'Druckverlustbericht') {
  return `${safeFileName(fileBaseName || 'Druckverlustbericht')}_Datenexport.csv`;
}


const MAIN_NETWORK_ROWS_PER_PAGE = 30;
const SPECIAL_ROWS_PER_PAGE = 24;
const FORMPART_BOXES_PER_PAGE = 4;
const FORMPART_ROWS_PER_BOX = 5;
const FORMPART_CATALOG_ROWS_PER_PAGE = 8;
const QUALITY_ROWS_PER_PAGE = 16;

const DEFAULT_REPORT_OPTIONS = Object.freeze({
  includeToc: true,
  includeExecutiveSummary: true,
  includeSystemsOverview: true,
  includeNetworkSchematic: true,
  includeLossAnalysis: true,
  includeRevisionComparison: true,
  includeVariantComparison: true,
  includeEngineeringQuality: true,
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

        function bindPrintHelper(){
          document.addEventListener('click', function(event){
            var button = event.target && event.target.closest ? event.target.closest('[data-print-action]') : null;
            if (!button) return;
            var action = button.getAttribute('data-print-action');
            if (action === 'print') window.print();
            if (action === 'close') window.close();
          });
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function(){ protectImages(); bindPrintHelper(); }, { once:true });
        } else {
          protectImages();
          bindPrintHelper();
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

function normalizeVariantComparison(project = {}, systemId = null) {
  const variant = ProjectCompletionEngine.getReportVariant(project, systemId);
  if (!variant) return null;

  const rows = [...(variant.rows || [])]
    .sort((a, b) => Math.abs(toNumber(b?.delta?.pressureLoss)) - Math.abs(toNumber(a?.delta?.pressureLoss)))
    .slice(0, 10);

  const currentFingerprint = ProjectCompletionEngine.createCalculationFingerprint(project, systemId);
  const sourceFingerprint = variant.calculationFingerprint || variant.projectFingerprint || '';

  return {
    id: variant.id || '',
    name: variant.name || 'Variante',
    note: variant.note || '',
    author: variant.author || '',
    createdAt: variant.createdAt || '',
    options: variant.options || {},
    affectedCount: toNumber(variant.affectedCount),
    baseline: variant.baseline || {},
    scenario: variant.scenario || {},
    delta: variant.delta || {},
    rows,
    isCurrentBase: !sourceFingerprint || sourceFingerprint === currentFingerprint,
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
    const reportOptions = normalizeReportOptions(project?.reportOptions || project?.report?.options || {});
    const engineeringQuality = EngineeringQualityEngine.analyze(project, system, calculation);
    const networkSchematic = NetworkSchematicEngine.create(system || {}, calculation);
    const revisionComparison = ProjectCompletionEngine.getRevisionComparison(project, system?.id);
    const reviewProtocol = ProjectCompletionEngine.getReviewProtocol(project, system?.id);
    const variantComparison = normalizeVariantComparison(project, system?.id);
    const variantArchiveCount = ProjectCompletionEngine.getVariants(project, system?.id).length;
    const revisionSnapshots = ProjectCompletionEngine.getRevisionSnapshots(project, system?.id);
    const handoverApproval = ProjectHandoverEngine.getApproval(project, system?.id);
    const systemsOverview = SystemPortfolioEngine.analyze(project, { selectedSystemId: system?.id });
    const projectCockpit = ProjectPortfolioQualityEngine.analyze(project, { selectedSystemId: system?.id });
    const projectWorkflow = {
      profile: ProjectStandardizationEngine.resolveProfile(project),
      changeHistory: ProjectStandardizationEngine.getHistory(project),
    };
    const projectTasks = ProjectTaskCenterEngine.analyze(project, { selectedSystemId: system?.id || null, cockpit: projectCockpit });
    const projectDependencies = ProjectDependencyEngine.analyze(project, { target: { type: 'project' } });
    const velocityCompliance = analyzeSystemVelocityCompliance(system || {}, calculation || {});
    const velocityComplianceBySectionId = new Map((velocityCompliance.rows || []).map(row => [row.sectionId, row]));

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
        roughnessMm: toNumber(result.roughnessMm, toNumber(section.roughnessMm, 0.15)),
        reynoldsNumber: toNumber(result.reynoldsNumber),
        frictionFactor: toNumber(result.frictionFactor ?? result.lambda),
        frictionRate: toNumber(result.frictionRate),
        frictionLoss: toNumber(result.frictionLoss),
        zetaLoss: toNumber(result.zetaLoss),
        directLoss: toNumber(result.directFormPartLoss),
        totalLoss: toNumber(result.roundedTotalLoss ?? result.totalLoss ?? result.totalPressureLoss),
        rawTotalLoss: toNumber(result.totalLoss),
        zetaSum: result.zetaSum ?? calculationItem?.zetaFromParts ?? 0,
        siaVelocity: velocityComplianceBySectionId.get(section.id) || null,
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
    const lossAnalytics = this.createLossAnalytics(sectionRows, {
      friction: toNumber(totals.friction),
      formParts: toNumber(totals.formParts, toNumber(totals.zetaLoss) + toNumber(totals.directFormPartLoss)),
      special: toNumber(totals.special),
      total: toNumber(totals.totalRounded ?? totals.total),
    });

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
        roomUsage: velocityCompliance.config?.roomUsage ? `${velocityCompliance.config.roomUsage.code} ${velocityCompliance.config.roomUsage.label}` : '-',
        operationMode: velocityCompliance.config?.mode?.label || '-',
        electricalFullLoadHours: velocityCompliance.config?.electricalFullLoadHours,
      },
      settings: {
        rho: toNumber(settings.rho, 1.21),
        defaultRoughnessMm: toNumber(settings.defaultRoughnessMm, 0.15),
        kinematicViscosity: toNumber(settings.kinematicViscosity, 0.0000151),
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
      engineeringQuality,
      networkSchematic,
      revisionComparison,
      reviewProtocol,
      variantComparison,
      variantArchiveCount,
      revisionSnapshots,
      handoverApproval,
      systemsOverview,
      projectCockpit,
      projectWorkflow,
      projectTasks,
      projectDependencies,
      velocityCompliance,
      lossAnalytics,
      license: LicenseGate.getStatus(),
      exportNotice: LicenseGate.createExportNotice(),
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

  static createLossAnalytics(sections = [], totals = {}) {
    const components = [
      { key: 'friction', label: 'Kanal / Rohr', value: toNumber(totals.friction) },
      { key: 'formParts', label: 'Formteile', value: toNumber(totals.formParts) },
      { key: 'special', label: 'Sonderbauteile', value: toNumber(totals.special) },
    ];
    const componentSum = components.reduce((sum, item) => sum + item.value, 0);
    const denominator = componentSum > 0 ? componentSum : Math.max(0, toNumber(totals.total));
    const breakdown = components.map(item => ({
      ...item,
      percent: denominator > 0 ? item.value / denominator * 100 : 0,
    }));
    const dominant = [...breakdown].sort((a, b) => b.value - a.value)[0] || null;
    const rankedSections = [...(sections || [])]
      .map(section => ({
        id: section.id,
        position: section.position,
        name: section.name || section.description || '-',
        frictionLoss: toNumber(section.frictionLoss),
        formPartLoss: toNumber(section.zetaLoss) + toNumber(section.directLoss),
        totalLoss: toNumber(section.totalLoss),
        velocity: toNumber(section.velocity),
        airflow: toNumber(section.airflow),
      }))
      .sort((a, b) => b.totalLoss - a.totalLoss);
    const maximumSectionLoss = Math.max(0, ...rankedSections.map(item => item.totalLoss));

    return {
      breakdown,
      dominant,
      rankedSections,
      maximumSectionLoss,
      total: toNumber(totals.total),
      topSection: rankedSections[0] || null,
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
      roughnessMm: toNumber(sectionResult?.roughnessMm, toNumber(formPart.sectionRoughnessMm, 0.15)),
      frictionFactor: toNumber(sectionResult?.frictionFactor ?? sectionResult?.lambda, toNumber(formPart.sectionFrictionFactor)),
      reynoldsNumber: toNumber(sectionResult?.reynoldsNumber, toNumber(formPart.sectionReynoldsNumber)),
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
    if (registryEntry?.id) add(`assets/formteile/${registryEntry.id}.png`);
    if (formPart?.type) add(`assets/formteile/${formPart.type}.png`);

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
      reportOptions.includeExecutiveSummary,
      reportOptions.includeNetworkSchematic,
      reportOptions.includeLossAnalysis,
      reportOptions.includeEngineeringQuality,
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
    const pagePlan = this.createPagePlan(model);
    const visibleSections = Number(model.counts?.sections || 0);
    const visibleFormParts = Number(model.counts?.formParts || 0);
    const visibleSpecialComponents = Number(model.counts?.specialComponents || 0);
    const hiddenSections = Number(model.reportScope?.hiddenSections || 0);
    const hiddenFormParts = Number(model.reportScope?.hiddenFormParts || 0);
    const hiddenSpecialComponents = Number(model.reportScope?.hiddenSpecialComponents || 0);
    const hiddenTotal = hiddenSections + hiddenFormParts + hiddenSpecialComponents;
    const hasVisibleCalculationContent = visibleSections > 0 || visibleFormParts > 0 || visibleSpecialComponents > 0;
    const zeroLossSections = (model.sections || []).filter(section => !hasNonZero(section?.totalLoss) && !hasNonZero(section?.frictionLoss)).length;
    const orphanFormParts = (model.formParts || []).filter(part => !part?.sectionId || part.sectionId === '-').length;
    const zeroLossFormParts = (model.formParts || []).filter(part => !hasNonZero(part?.pressureLoss)).length;
    const zeroLossSpecials = (model.specialComponents || []).filter(component => !hasNonZero(component?.pressureLoss)).length;
    const pageStatus = pagePlan.totalPages > 70 ? 'warning' : pagePlan.totalPages > 0 ? 'ok' : 'error';
    const fileBaseName = this.createExportBaseName(model);
    const pdfFileName = createPdfFileName(fileBaseName);
    const htmlFileName = createHtmlFileName(fileBaseName);
    const csvFileName = createCsvFileName(fileBaseName);
    const printGuidance = this.createPrintGuidance(model, pdfFileName);
    const splitTotal = toNumber(model.totals?.friction) + toNumber(model.totals?.formParts) + toNumber(model.totals?.special);
    const comparisonTotal = Number.isFinite(Number(model.totals?.rawTotal))
      ? toNumber(model.totals.rawTotal)
      : toNumber(model.totals?.total);
    const totalDifference = Math.abs(splitTotal - comparisonTotal);
    const hasLossBreakdown = hasCalculatedTotal && Number.isFinite(splitTotal) && totalDifference <= 0.1;
    const exportNotice = model.exportNotice || LicenseGate.createExportNotice();

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
        id: 'engineering-quality',
        label: 'Engineering-QS',
        status: model.engineeringQuality?.status === 'critical' ? 'warning' : 'ok',
        message: `Engineering-Score ${Math.round(toNumber(model.engineeringQuality?.score, 100))}/100 · ${model.engineeringQuality?.findings?.length || 0} Feststellung(en).`,
        warning: 'Engineering-QS enthält kritische Feststellungen. Vor Abgabe fachlich prüfen.',
      },
      {
        id: 'project-tasks',
        label: 'Projektaufgaben',
        status: (model.projectTasks?.counts?.critical || 0) > 0 || (model.projectTasks?.counts?.overdue || 0) > 0 ? 'warning' : 'ok',
        message: `${model.projectTasks?.openTasks?.length || 0} offene Aufgabe(n), ${model.projectTasks?.counts?.done || 0} erledigt.`,
        warning: `${model.projectTasks?.counts?.critical || 0} kritische und ${model.projectTasks?.counts?.overdue || 0} überfällige Aufgabe(n) vor Abgabe prüfen.`,
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
        message: `Berechnungsergebnis ist vorhanden: ${formatNumber(model.totals?.total, 1)} Pa.`,
        warning: 'Berechnungsergebnis fehlt oder ist ungültig.',
      },
      {
        id: 'loss-breakdown',
        label: 'Druckverlust-Aufteilung',
        status: hasLossBreakdown ? 'ok' : 'warning',
        message: `Aufteilung ist konsistent: Kanal/Rohr ${formatNumber(model.totals?.friction, 1)} Pa + Formteile ${formatNumber(model.totals?.formParts, 1)} Pa + Sonderbauteile ${formatNumber(model.totals?.special, 1)} Pa.`,
        warning: `Aufteilung prüfen. Summe Einzelwerte weicht um ${formatNumber(totalDifference, 2)} Pa vom Gesamtdruckverlust ab.`,
      },
      {
        id: 'variant-comparison',
        label: 'Variantenvergleich',
        status: !model.reportOptions?.includeVariantComparison
          || !model.variantArchiveCount
          || (model.variantComparison && model.variantComparison.isCurrentBase)
          ? 'ok'
          : 'warning',
        message: model.variantComparison
          ? `Variante „${model.variantComparison.name}“ wird im Bericht dokumentiert.`
          : model.variantArchiveCount
            ? 'Gespeicherte Varianten sind vorhanden; der Variantenvergleich ist für diesen Bericht nicht ausgewählt.'
            : 'Keine gespeicherte Variante vorhanden; der Variantenvergleich ist optional.',
        warning: model.variantComparison
          ? 'Die ausgewählte Berichtsvariante basiert auf einem älteren Berechnungsstand.'
          : 'Variantenvergleich ist aktiviert und Varianten sind vorhanden, aber es wurde keine Variante für den Bericht ausgewählt.',
      },
      {
        id: 'license-export-status',
        label: 'Lizenz-/Exportstatus',
        status: exportNotice.restricted ? 'warning' : 'ok',
        message: `${exportNotice.label} · ${exportNotice.exportLabel}`,
        warning: 'Export ist lizenzseitig eingeschränkt oder muss geprüft werden.',
      },
      {
        id: 'calculation-content',
        label: 'Berechnungsinhalt',
        status: hasVisibleCalculationContent ? 'ok' : 'error',
        message: `${visibleSections} Teilstrecken, ${visibleFormParts} Formteile und ${visibleSpecialComponents} Sonderbauteile werden ausgegeben.`,
        warning: 'Der Bericht enthält keine berechnungsrelevanten Teilstrecken/Formteile/Sonderbauteile.',
      },
      {
        id: 'zero-loss-check',
        label: '0-Pa-Einträge',
        status: zeroLossSections || zeroLossFormParts || zeroLossSpecials ? 'warning' : 'ok',
        message: 'Keine auffälligen 0-Pa-Einträge im sichtbaren Bericht.',
        warning: `${zeroLossSections} Teilstrecke(n), ${zeroLossFormParts} Formteil(e) und ${zeroLossSpecials} Sonderbauteil(e) haben 0 Pa. Bitte prüfen, ob die Eingabe vollständig ist.`,
      },
      {
        id: 'orphan-formparts',
        label: 'Formteil-Zuordnung',
        status: orphanFormParts ? 'warning' : 'ok',
        message: 'Alle sichtbaren Formteile sind einer Teilstrecke zugeordnet.',
        warning: `${orphanFormParts} sichtbare Formteil(e) haben keine eindeutige Teilstrecken-Zuordnung.`,
      },
      {
        id: 'hidden-entries',
        label: 'Ausgeblendete leere Einträge',
        status: hiddenTotal ? 'warning' : 'ok',
        message: 'Keine leeren Einträge wurden im Bericht ausgeblendet.',
        warning: `${hiddenTotal} leere Einträge werden ausgeblendet (${hiddenSections} Teilstrecken, ${hiddenFormParts} Formteile, ${hiddenSpecialComponents} Sonderbauteile).`,
      },
      {
        id: 'page-plan',
        label: 'PDF-Seitenplan',
        status: pageStatus,
        message: `${pagePlan.totalPages} PDF-Seite(n) geplant, ${pagePlan.entries?.length || 0} Inhaltsbereich(e) aktiv.`,
        warning: pagePlan.totalPages > 70
          ? `Der Bericht ist mit ${pagePlan.totalPages} Seiten sehr lang. Seitenumbrüche vor Abgabe prüfen.`
          : 'Kein gültiger Seitenplan vorhanden.',
      },
      {
        id: 'pdf-print-settings',
        label: 'PDF-Druckeinstellungen',
        status: 'ok',
        message: `PDF vorbereitet: A4 Hochformat, Skalierung 100 %, Hintergrundgrafiken aktivieren, vorgeschlagener Name ${pdfFileName}.`,
        warning: 'PDF-Druckeinstellungen konnten nicht geprüft werden.',
      },
      {
        id: 'image-export',
        label: 'HTML-Bilder',
        status: 'ok',
        message: 'HTML-Export versucht Logo und Formteilbilder einzubetten, damit der Bericht unabhängig vom Projektordner geöffnet werden kann.',
        warning: 'Bildprüfung nicht verfügbar.',
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
      fileBaseName,
      documentTitle: this.createDocumentTitle(model),
      htmlFileName,
      pdfFileName,
      csvFileName,
      printGuidance,
      pagePlan,
    };
  }

  static createPrintGuidance(model = {}, pdfFileName = '') {
    const pagePlan = this.createPagePlan(model);
    const guidance = [
      ['Ziel', 'Als PDF speichern oder firmeneigenen PDF-Drucker wählen.'],
      ['Format', 'A4, Hochformat.'],
      ['Skalierung', '100 % bzw. Standard. Nicht manuell verkleinern.'],
      ['Ränder', 'Standard oder keine zusätzlichen Browser-Ränder. Der Bericht hat eigene Seitenränder.'],
      ['Hintergrundgrafiken', 'Aktivieren, damit Kopfzeilen, Tabellenköpfe und Summenkarten korrekt erscheinen.'],
      ['Dateiname', pdfFileName || createPdfFileName(this.createExportBaseName(model))],
    ];

    return {
      totalPages: pagePlan.totalPages,
      fileName: pdfFileName || createPdfFileName(this.createExportBaseName(model)),
      rows: guidance,
    };
  }

  static createExportChecklistText(model = {}) {
    const checklist = this.createExportChecklist(model);
    const lines = [
      `Druckverlust Pro – Export-QS`,
      `Dokument: ${checklist.documentTitle}`,
      `Dateibasis: ${checklist.fileBaseName}`,
      `Status: ${checklist.status.toUpperCase()} · Fehler: ${checklist.errorCount} · Hinweise: ${checklist.warningCount}`,
      `PDF-Seiten: ${checklist.pagePlan?.totalPages ?? '-'}`,
      `PDF-Dateiname: ${checklist.pdfFileName || '-'}`,
      `Lizenz-/Exportstatus: ${(model.exportNotice || LicenseGate.createExportNotice()).text}`,
      '',
      'PDF-Druckeinstellungen:',
      ...(checklist.printGuidance?.rows || []).map(row => `- ${row[0]}: ${row[1]}`),
      '',
      'Prüfpunkte:',
      ...checklist.items.map(item => `- [${String(item.status || '').toUpperCase()}] ${item.label}: ${item.status === 'ok' ? item.message : item.warning}`),
    ];

    return lines.join('\n');
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
      ['Export-Dateibasis', completion.fileBaseName],
      ['PDF-Dateiname', createPdfFileName(completion.fileBaseName)],
      ['HTML-Dateiname', createHtmlFileName(completion.fileBaseName)],
      ['CSV-Dateiname', createCsvFileName(completion.fileBaseName)],
      ['Lizenz-/Exportstatus', (model.exportNotice || LicenseGate.createExportNotice()).text],
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
  <meta name="generator" content="Druckverlust Pro – Phase ${APP_RELEASE}">
  <style>${this.getReportCss()}</style>
</head>
<body class="report-print-body">
  ${this.renderPrintHelperBar(model)}
  ${this.renderReportBody(model, { standalone: true, generatedLabel, includeStyle: false })}
  ${createPrintWaitScript()}
</body>
</html>`;
  }


  static async createStandaloneHtmlWithEmbeddedAssets(model) {
    const html = this.createStandaloneHtml(model);
    return inlineHtmlImages(html);
  }

  static renderPrintHelperBar(model = {}) {
    const fileBaseName = this.createExportBaseName(model);
    const pdfFileName = createPdfFileName(fileBaseName);
    const guidance = this.createPrintGuidance(model, pdfFileName);

    return `
      <div class="report-print-helper no-print">
        <div>
          <strong>PDF-Ausgabe vorbereitet</strong>
          <span>${escapeHtml(guidance.totalPages)} Seite(n) · Dateiname: ${escapeHtml(guidance.fileName)}</span>
        </div>
        <div class="report-print-helper-actions">
          <button type="button" data-print-action="print">Drucken / PDF</button>
          <button type="button" data-print-action="close">Fenster schliessen</button>
        </div>
      </div>
    `;
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
    const schematicNodeCount = model.networkSchematic?.nodes?.length || 0;
    const schematicPageCount = reportOptions.includeNetworkSchematic ? Math.max(1, Math.ceil(schematicNodeCount / ReportSchematicRenderer.nodesPerPage)) : 0;
    const engineeringFindingCount = model.engineeringQuality?.findings?.length || 0;
    const revisionPageCount = reportOptions.includeRevisionComparison && model.revisionComparison && !model.revisionComparison.legacy ? 1 : 0;
    const variantPageCount = reportOptions.includeVariantComparison && model.variantComparison ? 1 : 0;
    const engineeringPageCount = reportOptions.includeEngineeringQuality ? Math.max(1, Math.ceil(engineeringFindingCount / 12)) : 0;
    const systemsOverviewPageCount = reportOptions.includeSystemsOverview && (model.systemsOverview?.rows?.length || 0) > 1 ? 1 : 0;
    const projectCockpitPageCount = reportOptions.includeSystemsOverview && (model.projectCockpit?.rows?.length || 0) > 1 ? 1 : 0;
    const projectTaskPageCount = reportOptions.includeQualityProtocol && (model.projectTasks?.openTasks?.length || 0) > 0 ? 1 : 0;
    const projectDependencyPageCount = reportOptions.includeQualityProtocol ? 1 : 0;

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

    if (reportOptions.includeExecutiveSummary) {
      addEntry('executiveSummary', 'Management-Zusammenfassung', 'Kennwerte, Schwerpunkte und Engineering-Status', 1);
    }
    addEntry('systemsOverview', 'Projektweite Anlagenübersicht', `${model.systemsOverview?.rows?.length || 0} Anlagen im Vergleich`, systemsOverviewPageCount);
    addEntry('projectCockpit', 'Projektweite QS-Matrix', `${model.projectCockpit?.findings?.length || 0} Feststellungen und Dokumentationsstatus`, projectCockpitPageCount);
    addEntry('projectTasks', 'Projektaufgaben', `${model.projectTasks?.openTasks?.length || 0} offene Aufgaben und Schnellzugriffe`, projectTaskPageCount);
    addEntry('projectDependencies', 'Struktur- und Abhängigkeitsprüfung', `${model.projectDependencies?.conflicts?.findings?.length || 0} Strukturpunkte und ${model.projectDependencies?.summary?.links || 0} Verknüpfungen`, projectDependencyPageCount);
    addEntry('networkSchematic', 'Anlagenschema', `${schematicNodeCount} Teilstrecken als Funktionsschema`, schematicPageCount);
    if (reportOptions.includeLossAnalysis) {
      addEntry('lossAnalysis', 'Druckverlustanalyse', 'Verlustanteile und kritische Teilstrecken', 1);
    }
    addEntry('revisionComparison', 'Revisionsvergleich', model.revisionComparison?.base?.label ? `${model.revisionComparison.base.label} gegenüber aktuellem Stand` : 'Technische Änderungen', revisionPageCount);
    addEntry('variantComparison', 'Variantenvergleich', model.variantComparison ? `Bestand und ${model.variantComparison.name}` : 'Gespeicherte Simulation', variantPageCount);
    addEntry('mainNetwork', 'Hauptberechnung – Luftnetz', `${model.counts.sections} berechnungsrelevante Teilstrecken`, mainPageCount);
    addEntry('assignedFormParts', 'Zugeordnete Formteile', `${model.counts.formParts} Formteile nach Teilstrecke gruppiert`, formPartPageCount);
    addEntry('specialComponents', 'Sonderbauteile', `${model.counts.specialComponents} Komponenten`, specialPageCount);

    if (reportOptions.includeSummary) {
      addEntry('summary', 'Gesamtzusammenfassung', 'Summen, Berechnungsgrundlagen und QS-Status', 1);
    }

    addEntry('engineeringQuality', 'Engineering-QS', `${engineeringFindingCount} priorisierte Feststellungen`, engineeringPageCount);
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
    if (reportOptions.includeExecutiveSummary) pages.push(this.renderExecutiveSummaryPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeSystemsOverview && (model.systemsOverview?.rows?.length || 0) > 1) pages.push(this.renderSystemsOverviewPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeSystemsOverview && (model.projectCockpit?.rows?.length || 0) > 1) pages.push(this.renderProjectCockpitPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeQualityProtocol && (model.projectTasks?.openTasks?.length || 0) > 0) pages.push(this.renderProjectTasksPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeQualityProtocol) pages.push(this.renderProjectDependenciesPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeNetworkSchematic) pages.push(...this.renderNetworkSchematicPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeLossAnalysis) pages.push(this.renderLossAnalysisPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeRevisionComparison && model.revisionComparison && !model.revisionComparison.legacy) pages.push(this.renderRevisionComparisonPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeVariantComparison && model.variantComparison) pages.push(this.renderVariantComparisonPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeMainNetwork) pages.push(...this.renderMainNetworkPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeAssignedFormParts) pages.push(...this.renderAssignedFormPartsPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeSpecialComponents) pages.push(...this.renderSpecialComponentsPages(model, nextPage, totalPlaceholder));
    if (reportOptions.includeSummary) pages.push(this.renderSummaryPage(model, nextPage(), totalPlaceholder));
    if (reportOptions.includeEngineeringQuality) pages.push(...this.renderEngineeringQualityPages(model, nextPage, totalPlaceholder));
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
        ${this.renderFooter(model, page, totalPages)}
      </section>
    `;
  }

  static renderFooter(modelOrPage, pageOrTotalPages, maybeTotalPages) {
    const hasModel = typeof modelOrPage === 'object' && modelOrPage !== null;
    const model = hasModel ? modelOrPage : null;
    const page = hasModel ? pageOrTotalPages : modelOrPage;
    const totalPages = hasModel ? maybeTotalPages : pageOrTotalPages;
    const reportNumber = model?.project?.reportNumber && model.project.reportNumber !== '-'
      ? model.project.reportNumber
      : 'Druckverlust Pro';
    const revision = model?.project?.revision ? `Rev. ${model.project.revision}` : 'Rev. 0';
    const plant = model?.system?.name ? ` · ${model.system.name}` : '';

    return `
      <footer class="report-footer">
        <span>${escapeHtml(reportNumber)} · ${escapeHtml(revision)}${escapeHtml(plant)}</span>
        <span>Seite ${page} / ${totalPages}</span>
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
        ${this.renderFooter(model, page, totalPages)}
      </section>
    `;
  }

  static renderExecutiveSummaryPage(model, page, totalPages = 6) {
    const engineering = model.engineeringQuality || {};
    const analytics = model.lossAnalytics || {};
    const dominant = analytics.dominant || {};
    const topSections = (analytics.rankedSections || []).slice(0, 5);
    const statusLabel = engineering.status === 'critical' ? 'Kritisch' : engineering.status === 'warning' ? 'Prüfen' : engineering.status === 'info' ? 'Hinweise' : 'Plausibel';
    const statusClass = engineering.status === 'critical' ? 'error' : engineering.status === 'warning' ? 'warn' : 'ok';
    const maxVelocity = Math.max(0, ...(model.sections || []).map(section => toNumber(section.velocity)));

    const content = `
      <div class="report-executive-kpis">
        <div class="report-executive-score ${statusClass}"><span>Engineering-Score</span><strong>${Math.round(toNumber(engineering.score, 100))}</strong><small>${escapeHtml(statusLabel)} · ${engineering.counts?.critical || 0} kritisch · ${engineering.counts?.warning || 0} prüfen</small></div>
        <div><span>Gesamtdruckverlust</span><strong>${formatNumber(model.totals.total, 1)} Pa</strong><small>${model.counts.sections} Teilstrecken</small></div>
        <div><span>Max. Geschwindigkeit</span><strong>${formatNumber(maxVelocity, 2)} m/s</strong><small>höchster berechneter Wert</small></div>
        <div><span>Dominanter Verlust</span><strong>${escapeHtml(dominant.label || '-')}</strong><small>${formatNumber(dominant.percent || 0, 1)} % der Einzelwertsumme</small></div>
      </div>

      <div class="report-executive-grid">
        <section class="report-info-box report-executive-priority">
          <h3>Planerische Schwerpunkte</h3>
          ${engineering.findings?.length ? `<ol>${engineering.findings.slice(0, 5).map(finding => `<li><strong>${escapeHtml(finding.title)}</strong><span>${escapeHtml(finding.recommendation || finding.message)}</span></li>`).join('')}</ol>` : '<p>Die herstellerneutrale Engineering-Prüfung enthält keine priorisierten Feststellungen.</p>'}
        </section>

        <section class="report-info-box">
          <h3>Verluststärkste Teilstrecken</h3>
          ${topSections.length ? `<table class="report-table small report-top-loss-table"><thead><tr><th>Pos.</th><th>Teilstrecke</th><th>v</th><th>Δp</th></tr></thead><tbody>${topSections.map(row => `<tr><td>${escapeHtml(row.position)}</td><td class="left">${escapeHtml(row.name)}</td><td>${formatNumber(row.velocity, 2)} m/s</td><td><strong>${formatNumber(row.totalLoss, 1)} Pa</strong></td></tr>`).join('')}</tbody></table>` : '<p>Keine berechnungsrelevanten Teilstrecken vorhanden.</p>'}
        </section>
      </div>

      <div class="report-info-box muted report-executive-note">
        <h3>Einordnung</h3>
        <p>Diese Seite fasst die aktuelle Druckverlustberechnung zusammen. Die Engineering-QS arbeitet mit neutralen Projekt-Prüfwerten und ersetzt keine objektspezifische Norm-, Akustik- oder Fachplanung.</p>
      </div>
    `;

    return this.renderPage(model, page, 'Management-Zusammenfassung', 'Kennwerte, Schwerpunkte und Engineering-Status', content, totalPages);
  }


  static renderProjectCockpitPage(model, page, totalPages = 6) {
    const cockpit = model.projectCockpit || { rows: [], findings: [], counts: {}, summary: {}, metadata: {} };
    const findings = (cockpit.findings || []).slice(0, 8);
    const metadata = cockpit.metadata || {};
    const content = `
      <div class="report-project-cockpit-kpis">
        ${this.renderSummaryCard('Projekt-Score', cockpit.label || 'Status', cockpit.score || 0, '')}
        ${this.renderSummaryCard('Engineering-Mittelwert', 'über alle Anlagen', cockpit.engineeringAverage || 0, '')}
        ${this.renderSummaryCard('Dokumentation', 'Projekt- und Berichtangaben', cockpit.documentationScore || 0, '')}
        ${this.renderSummaryCard('Offene Prüfpunkte', `${cockpit.counts?.critical || 0} kritisch · ${cockpit.counts?.warning || 0} prüfen`, (cockpit.findings || []).length, '')}
      </div>
      <div class="report-project-cockpit-grid">
        <section class="report-info-box compact">
          <h3>Dokumentationsstatus</h3>
          <table class="report-table small report-project-meta-table"><tbody>
            ${[
              ['Projektnummer', metadata.projectNumber],
              ['Projektname', metadata.projectName],
              ['Objekt', metadata.object],
              ['Bearbeiter', metadata.author],
              ['Firma', metadata.company],
              ['Berichtnummer', metadata.reportNumber],
              ['Revision', metadata.revision],
            ].map(([label, value]) => `<tr><td class="left">${escapeHtml(label)}</td><td><span class="report-status-pill ${value ? 'ok' : 'warn'}">${value ? escapeHtml(value) : 'Fehlt'}</span></td></tr>`).join('')}
          </tbody></table>
        </section>
        <section class="report-info-box compact">
          <h3>Projektstruktur</h3>
          <table class="report-table small"><thead><tr><th>Luftart</th><th>Anlagen</th><th>Teilstrecken</th><th>Luftmenge</th></tr></thead><tbody>
            ${(cockpit.typeSummary || []).map(row => `<tr><td class="left">${escapeHtml(row.type)}</td><td>${row.systems}</td><td>${row.sections}</td><td>${formatAirflow(row.airflow)} m³/h</td></tr>`).join('') || '<tr><td colspan="4">Keine Anlagen vorhanden.</td></tr>'}
          </tbody></table>
          <p class="report-small-note">Luftmengen werden informativ je Luftart summiert. Es wird keine automatische Luftbilanz oder gemeinsame Druckverlustkette abgeleitet.</p>
        </section>
      </div>
      <section class="report-info-box compact report-project-cockpit-findings">
        <h3>Priorisierte projektweite Feststellungen</h3>
        ${findings.length ? `<table class="report-table small"><thead><tr><th>Priorität</th><th>Anlage / Bereich</th><th>Feststellung</th><th>Empfehlung</th></tr></thead><tbody>${findings.map(item => `<tr><td><span class="report-status-pill ${qualityStatusClass(item.severity === 'critical' ? 'error' : item.severity === 'warning' ? 'warning' : 'ok')}">${escapeHtml(item.severity)}</span></td><td class="left">${escapeHtml(item.systemName || 'Projekt')}</td><td class="left">${escapeHtml(item.title)}</td><td class="left">${escapeHtml(item.recommendation || item.message || '')}</td></tr>`).join('')}</tbody></table>` : '<p>Keine projektweiten Feststellungen vorhanden.</p>'}
      </section>
      <div class="report-info-box compact muted"><h3>Einordnung</h3><p>${escapeHtml(cockpit.disclaimer || '')}</p></div>
    `;
    return this.renderPage(model, page, 'Projektweite QS-Matrix', 'Projektcockpit, Dokumentation und priorisierte Prüfpunkte', content, totalPages);
  }


  static renderProjectTasksPage(model, page, totalPages = 6) {
    const taskModel = model.projectTasks || { counts: {}, openTasks: [], favorites: [] };
    const tasks = (taskModel.openTasks || []).slice(0, 12);
    const priorityLabel = value => ({ critical: 'Kritisch', high: 'Hoch', normal: 'Normal', low: 'Niedrig' })[value] || value;
    const statusLabel = value => ({ open: 'Offen', inProgress: 'In Bearbeitung', done: 'Erledigt' })[value] || value;
    const content = `
      <div class="report-project-cockpit-kpis">
        ${this.renderSummaryCard('Aufgaben-Score', taskModel.status || 'Status', taskModel.score || 0, '')}
        ${this.renderSummaryCard('Offen', 'noch nicht begonnen', taskModel.counts?.open || 0, '')}
        ${this.renderSummaryCard('In Bearbeitung', 'aktuell in Arbeit', taskModel.counts?.inProgress || 0, '')}
        ${this.renderSummaryCard('Kritisch / überfällig', `${taskModel.counts?.overdue || 0} überfällig`, taskModel.counts?.critical || 0, '')}
      </div>
      <section class="report-info-box compact">
        <h3>Priorisierte offene Projektaufgaben</h3>
        ${tasks.length ? `<table class="report-table small"><thead><tr><th>Priorität</th><th>Status</th><th>Anlage / Bezug</th><th>Aufgabe</th><th>Fälligkeit</th></tr></thead><tbody>${tasks.map(task => `<tr><td><span class="report-status-pill ${task.priority === 'critical' ? 'error' : task.priority === 'high' ? 'warn' : 'ok'}">${escapeHtml(priorityLabel(task.priority))}</span></td><td>${escapeHtml(statusLabel(task.status))}</td><td class="left">${escapeHtml([task.systemName, task.sectionName].filter(Boolean).join(' · ') || 'Projekt')}</td><td class="left"><strong>${escapeHtml(task.title)}</strong>${task.recommendation || task.description ? `<br><span>${escapeHtml(task.recommendation || task.description)}</span>` : ''}</td><td>${escapeHtml(task.dueDate || '-')}</td></tr>`).join('')}</tbody></table>` : '<p>Keine offenen Projektaufgaben vorhanden.</p>'}
        ${(taskModel.openTasks || []).length > tasks.length ? `<p class="report-small-note">Im Bericht werden die ersten ${tasks.length} priorisierten Aufgaben gezeigt. Vollständige Liste im Projekt-Navigator oder CSV-Export.</p>` : ''}
      </section>
      <div class="report-info-box compact muted"><h3>Einordnung</h3><p>${escapeHtml(taskModel.disclaimer || '')}</p></div>
    `;
    return this.renderPage(model, page, 'Projektaufgaben', 'Automatische QS-Punkte und manuelle Aufgaben', content, totalPages);
  }


  static renderProjectDependenciesPage(model, page, totalPages = 6) {
    const dependency = model.projectDependencies || { summary: {}, conflicts: { findings: [], counts: {} }, graph: { nodes: [], edges: [] }, disclaimer: '' };
    const findings = (dependency.conflicts?.findings || []).slice(0, 10);
    const counts = dependency.conflicts?.counts || {};
    const summary = dependency.summary || {};
    const categoryCounts = dependency.countsByCategory || {};
    const content = `
      <div class="report-project-cockpit-kpis">
        ${this.renderSummaryCard('Struktur-Score', dependency.conflicts?.label || 'Status', summary.score || 0, '')}
        ${this.renderSummaryCard('Elemente', 'im Projektmodell', summary.nodes || 0, '')}
        ${this.renderSummaryCard('Verknüpfungen', `${summary.directLinks || 0} direkt`, summary.links || 0, '')}
        ${this.renderSummaryCard('Offene Strukturpunkte', `${counts.critical || 0} kritisch · ${counts.warning || 0} prüfen`, (dependency.conflicts?.findings || []).length, '')}
      </div>
      <div class="report-project-cockpit-grid">
        <section class="report-info-box compact">
          <h3>Projektstruktur</h3>
          <table class="report-table small"><tbody>
            ${[
              ['Anlagen', categoryCounts.system || 0],
              ['Teilstrecken', categoryCounts.section || 0],
              ['Formteile', categoryCounts.formPart || 0],
              ['Sonderbauteile', categoryCounts.specialComponent || 0],
              ['Aufgaben', categoryCounts.task || 0],
              ['Revisionen / Varianten', (categoryCounts.revision || 0) + (categoryCounts.variant || 0)],
            ].map(([label, value]) => `<tr><td class="left">${escapeHtml(label)}</td><td>${value}</td></tr>`).join('')}
          </tbody></table>
        </section>
        <section class="report-info-box compact">
          <h3>Beziehungsstatus</h3>
          ${this.renderDefinitionList([
            ['Direkte Beziehungen', summary.directLinks || 0],
            ['Kontextbeziehungen', summary.contextLinks || 0],
            ['Kritische Konflikte', counts.critical || 0],
            ['Zu prüfen', counts.warning || 0],
            ['Hinweise', counts.info || 0],
          ])}
          <p class="report-small-note">Geprüft werden eindeutige IDs, gültige Teilstreckenzuordnungen, verwaiste Verweise und dokumentarische Bezüge.</p>
        </section>
      </div>
      <section class="report-info-box compact">
        <h3>Priorisierte Strukturpunkte</h3>
        ${findings.length ? `<table class="report-table small"><thead><tr><th>Priorität</th><th>Code</th><th>Feststellung</th><th>Empfehlung</th></tr></thead><tbody>${findings.map(item => `<tr><td><span class="report-status-pill ${item.severity === 'critical' ? 'error' : item.severity === 'warning' ? 'warn' : 'ok'}">${escapeHtml(item.severityLabel || item.severity)}</span></td><td>${escapeHtml(item.code)}</td><td class="left"><strong>${escapeHtml(item.title)}</strong><br><span>${escapeHtml(item.message || '')}</span></td><td class="left">${escapeHtml(item.recommendation || '')}</td></tr>`).join('')}</tbody></table>` : '<p>Keine offenen Strukturkonflikte vorhanden.</p>'}
        ${(dependency.conflicts?.findings || []).length > findings.length ? `<p class="report-small-note">Im Bericht werden die ersten ${findings.length} priorisierten Punkte gezeigt. Die vollständige Liste steht im Bereich „Abhängigkeiten“ und im CSV-Export zur Verfügung.</p>` : ''}
      </section>
      <div class="report-info-box compact muted"><h3>Einordnung</h3><p>${escapeHtml(dependency.disclaimer || '')}</p></div>
    `;
    return this.renderPage(model, page, 'Struktur- und Abhängigkeitsprüfung', 'Projektverknüpfungen, Änderungsfolgen und Konfliktkontrolle', content, totalPages);
  }


  static renderSystemsOverviewPage(model, page, totalPages = 6) {
    const overview = model.systemsOverview || { rows: [], summary: {} };
    const rows = overview.rows || [];
    const summary = overview.summary || {};
    const content = `
      <div class="report-system-overview-kpis">
        ${this.renderSummaryCard('Anlagen', `${summary.totalSections || 0} Teilstrecken`, summary.systems || rows.length, '')}
        ${this.renderSummaryCard('Ø Engineering-Score', 'projektweiter Mittelwert', summary.averageQualityScore || 0, '')}
        ${this.renderSummaryCard('Höchster Druckverlust', summary.highestLoss?.name || 'Keine Berechnung', summary.highestLoss?.totalPressureLoss || 0, 'Pa')}
        ${this.renderSummaryCard('Höchste Geschwindigkeit', summary.highestVelocity?.name || 'Keine Berechnung', summary.highestVelocity?.maxVelocity || 0, 'm/s')}
      </div>
      <table class="report-table report-system-overview-table">
        <thead>
          <tr>
            <th>Nr.</th><th>BKP / Anlage</th><th>Typ</th><th>TS</th><th>Luftmenge</th><th>v max.</th><th>Δp gesamt</th><th>QS</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr class="${row.id === model.system?.id ? 'is-current-system' : ''}">
              <td>${row.position}</td>
              <td><strong>${escapeHtml(row.bkp || '-')}</strong><span>${escapeHtml(row.name)}</span></td>
              <td>${escapeHtml(row.type)}</td>
              <td>${row.sections}</td>
              <td>${formatAirflow(row.airflow)} m³/h</td>
              <td>${formatNumber(row.maxVelocity, 2)} m/s</td>
              <td><strong>${formatNumber(row.totalPressureLoss, 1)} Pa</strong></td>
              <td><span class="report-status-pill ${qualityStatusClass(row.qualityStatus === 'critical' ? 'error' : row.qualityStatus === 'warning' ? 'warning' : 'ok')}">${formatNumber(row.qualityScore, 0)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-info-box compact muted report-system-overview-note">
        <h3>Auswertungsgrenze</h3>
        <p>${escapeHtml(overview.disclaimer || '')}</p>
      </div>
    `;
    return this.renderPage(model, page, 'Projektweite Anlagenübersicht', 'Kennwerte und Engineering-Status aller Anlagen', content, totalPages);
  }

  static renderNetworkSchematicPages(model, nextPage, totalPages) {
    const nodes = model.networkSchematic?.nodes || [];
    const chunks = ReportSchematicRenderer.chunk(nodes);

    return chunks.map((chunk, chunkIndex) => {
      const startPosition = chunkIndex * ReportSchematicRenderer.nodesPerPage;
      const summary = model.networkSchematic?.summary || {};
      const content = `
        ${ReportSchematicRenderer.render(model.networkSchematic, chunk, {
          chunkIndex,
          chunkCount: chunks.length,
          startPosition,
        })}
        <div class="report-schematic-summary is-five-columns">
          <div><span>Gesamtdruckverlust</span><strong>${formatNumber(model.totals.total, 1)} Pa</strong></div>
          <div><span>Einlassluftmenge</span><strong>${formatAirflow(summary.inletAirflow)} m³/h</strong></div>
          <div><span>Max. Geschwindigkeit</span><strong>${formatNumber(summary.maxVelocity, 2)} m/s</strong></div>
          <div><span>Formteile</span><strong>${model.counts.formParts}</strong></div>
          <div><span>Sonderbauteile</span><strong>${model.counts.specialComponents}</strong></div>
        </div>
        <p class="report-schematic-disclaimer">Automatisch erzeugtes, herstellerneutrales Funktionsschema auf Basis der Teilstreckenreihenfolge. Kanalhöhen und Übergänge werden schematisch dargestellt; die Ausgabe ist keine massstäbliche CAD- oder Montagezeichnung.</p>
      `;
      const title = chunkIndex ? 'Anlagenschema - Fortsetzung' : 'Anlagenschema';
      const rangeStart = startPosition + 1;
      const rangeEnd = startPosition + chunk.length;
      const subtitle = chunks.length > 1
        ? `Anlagenabschnitt ${chunkIndex + 1} von ${chunks.length} · Teilstrecken ${rangeStart}-${rangeEnd} von ${nodes.length}`
        : 'Herstellerneutrale Funktionsdarstellung mit Kanalzügen, Übergängen und Bauteilzuordnung';
      return this.renderPage(model, nextPage(), title, subtitle, content, totalPages);
    });
  }

  static renderReportSchematicSvg(model, nodes = [], chunkIndex = 0, chunkCount = 1) {
    return ReportSchematicRenderer.render(model.networkSchematic || {}, nodes, {
      chunkIndex,
      chunkCount,
      startPosition: chunkIndex * ReportSchematicRenderer.nodesPerPage,
    });
  }

  static renderLossAnalysisPage(model, page, totalPages = 6) {
    const analytics = model.lossAnalytics || {};
    const breakdown = analytics.breakdown || [];
    const topSections = (analytics.rankedSections || []).slice(0, 10);
    const maxComponent = Math.max(.001, ...breakdown.map(item => toNumber(item.value)));
    const maxSection = Math.max(.001, ...topSections.map(item => toNumber(item.totalLoss)));

    const content = `
      <div class="report-loss-analysis-grid">
        <section class="report-info-box report-loss-chart">
          <h3>Verlustanteile</h3>
          ${breakdown.map(item => `<div class="report-chart-row"><div><strong>${escapeHtml(item.label)}</strong><span>${formatNumber(item.value, 1)} Pa · ${formatNumber(item.percent, 1)} %</span></div><i><b style="width:${Math.max(1, item.value / maxComponent * 100)}%"></b></i></div>`).join('')}
        </section>
        <section class="report-info-box report-loss-facts">
          <h3>Kernaussagen</h3>
          ${this.renderDefinitionList([
            ['Dominanter Verlust', analytics.dominant?.label || '-'],
            ['Anteil', `${formatNumber(analytics.dominant?.percent || 0, 1)} %`],
            ['Kritische Teilstrecke', analytics.topSection?.name || '-'],
            ['Druckverlust kritische TS', `${formatNumber(analytics.topSection?.totalLoss || 0, 1)} Pa`],
            ['Gesamtdruckverlust', `${formatNumber(model.totals.total, 1)} Pa`],
          ])}
        </section>
      </div>

      <section class="report-info-box report-section-ranking">
        <h3>Rangfolge der Teilstrecken</h3>
        ${topSections.length ? topSections.map((item, index) => `<div class="report-ranking-row"><span>${index + 1}</span><strong>${escapeHtml(item.name)}</strong><i><b style="width:${Math.max(1, item.totalLoss / maxSection * 100)}%"></b></i><em>${formatNumber(item.totalLoss, 1)} Pa</em></div>`).join('') : '<p>Keine berechnungsrelevanten Teilstrecken vorhanden.</p>'}
      </section>

      <div class="report-info-box muted"><h3>Bewertungshinweis</h3><p>Die Rangfolge dient der gezielten Kontrolle. Ein hoher Einzelverlust kann projektspezifisch erforderlich sein und ist nicht automatisch ein Planungsfehler.</p></div>
    `;

    return this.renderPage(model, page, 'Druckverlustanalyse', 'Verlustanteile und kritische Teilstrecken', content, totalPages);
  }

  static renderRevisionComparisonPage(model, page, totalPages = 6) {
    const comparison = model.revisionComparison || {};
    const changes = (comparison.changes || []).slice(0, 18);
    const categoryLabels = { sections: 'Teilstrecken', formParts: 'Formteile', specialComponents: 'Sonderbauteile' };
    const typeLabels = { added: 'Neu', removed: 'Entfernt', modified: 'Geändert' };
    const totalDelta = toNumber(comparison.totals?.delta?.totalLoss);
    const deltaText = `${totalDelta > 0 ? '+' : ''}${formatNumber(totalDelta, 1)} Pa`;
    const content = `
      <div class="report-revision-compare-head">
        <div class="report-revision-compare-card">
          <span>Basisstand</span>
          <strong>${escapeHtml(comparison.base?.label || '-')}</strong>
          <small>${formatNumber(comparison.totals?.before?.totalLoss, 1)} Pa Gesamtdruckverlust</small>
        </div>
        <div class="report-revision-compare-arrow">→</div>
        <div class="report-revision-compare-card">
          <span>Zielstand</span>
          <strong>${escapeHtml(comparison.target?.label || 'Aktueller Projektstand')}</strong>
          <small>${formatNumber(comparison.totals?.after?.totalLoss, 1)} Pa Gesamtdruckverlust</small>
        </div>
        <div class="report-revision-compare-card accent">
          <span>Differenz</span>
          <strong>${escapeHtml(deltaText)}</strong>
          <small>${comparison.summary?.total || 0} technische Änderung(en)</small>
        </div>
      </div>

      <div class="report-revision-summary-grid">
        <div><span>Neu</span><strong>${comparison.summary?.added || 0}</strong></div>
        <div><span>Entfernt</span><strong>${comparison.summary?.removed || 0}</strong></div>
        <div><span>Feldänderungen</span><strong>${comparison.summary?.modified || 0}</strong></div>
        <div><span>Wesentliche Änderungen</span><strong>${comparison.summary?.important || 0}</strong></div>
        <div><span>Δ v max.</span><strong>${formatNumber(comparison.totals?.delta?.maxVelocity, 2)} m/s</strong></div>
      </div>

      ${changes.length ? `<table class="report-table report-revision-comparison-table">
        <thead><tr><th>Bereich</th><th>Element</th><th>Änderung</th><th>Feld</th><th>Vorher</th><th>Nachher</th><th>Δ</th></tr></thead>
        <tbody>${changes.map(change => `<tr>
          <td>${escapeHtml(categoryLabels[change.category] || change.category)}</td>
          <td class="left"><strong>${escapeHtml(change.elementName || '-')}</strong></td>
          <td>${escapeHtml(typeLabels[change.changeType] || change.changeType)}</td>
          <td class="left">${escapeHtml(change.fieldLabel || '-')}</td>
          <td>${escapeHtml(change.beforeLabel || '-')}</td>
          <td>${escapeHtml(change.afterLabel || '-')}</td>
          <td>${escapeHtml(change.deltaLabel || '-')}</td>
        </tr>`).join('')}</tbody>
      </table>` : '<div class="report-info-box ok"><h3>Keine technischen Änderungen</h3><p>Der aktuelle Projektstand entspricht der gewählten Basisrevision.</p></div>'}
      ${(comparison.changes || []).length > changes.length ? `<p class="report-continuation-note">Im Bericht werden die ersten ${changes.length} von ${comparison.changes.length} Änderungen dargestellt. Der CSV-Datenexport enthält den vollständigen Vergleich.</p>` : ''}
      <p class="report-engineering-disclaimer">Der Revisionsvergleich basiert auf gespeicherten technischen Detaildaten und dient der nachvollziehbaren Projektkontrolle. Er ersetzt keine objektspezifische fachliche Freigabe.</p>
    `;

    return this.renderPage(model, page, 'Revisionsvergleich', `${comparison.base?.label || 'Basis'} gegenüber aktuellem Projektstand`, content, totalPages);
  }

  static renderVariantComparisonPage(model, page, totalPages = 6) {
    const variant = model.variantComparison;
    if (!variant) return '';

    const before = variant.baseline || {};
    const after = variant.scenario || {};
    const delta = variant.delta || {};
    const deltaText = (value, unit = '', digits = 1) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return '-';
      return `${numeric > 0 ? '+' : ''}${formatNumber(numeric, digits)} ${unit}`.trim();
    };
    const createdAt = new Date(variant.createdAt || '');
    const createdLabel = Number.isNaN(createdAt.getTime()) ? '-' : createdAt.toLocaleString('de-CH');

    const content = `
      <div class="report-variant-intro">
        <div>
          <span class="report-chip ${variant.isCurrentBase ? '' : 'warn'}">${variant.isCurrentBase ? 'Nicht-destruktive Simulation' : 'Älterer Berechnungsstand'}</span>
          <h3>${escapeHtml(variant.name)}</h3>
          <p>${escapeHtml(variant.note || 'Keine zusätzliche Bemerkung hinterlegt.')}</p>
        </div>
        <dl>
          <div><dt>Erstellt</dt><dd>${escapeHtml(createdLabel)}</dd></div>
          <div><dt>Bearbeiter</dt><dd>${escapeHtml(variant.author || model.project.author || '-')}</dd></div>
          <div><dt>Umfang</dt><dd>${variant.affectedCount || 0} Teilstrecken</dd></div>
        </dl>
      </div>

      <div class="report-variant-kpis">
        ${[
          ['Gesamtdruckverlust', before.totalLoss, after.totalLoss, delta.totalLoss, 'Pa', 1],
          ['Max. Geschwindigkeit', before.maxVelocity, after.maxVelocity, delta.maxVelocity, 'm/s', 2],
          ['Reibungsverlust', before.frictionLoss, after.frictionLoss, delta.frictionLoss, 'Pa', 1],
          ['Formteilverluste', before.formPartLoss, after.formPartLoss, delta.formPartLoss, 'Pa', 1],
        ].map(([label, base, scenario, difference, unit, digits]) => `<article>
          <span>${escapeHtml(label)}</span>
          <strong>${formatNumber(scenario, digits)} ${unit}</strong>
          <small>Bestand ${formatNumber(base, digits)} ${unit} · ${deltaText(difference, unit, digits)}</small>
        </article>`).join('')}
      </div>

      <div class="report-info-box compact">
        <h3>Simulationsparameter</h3>
        <div class="report-variant-parameters">
          <span>Geltungsbereich <strong>${variant.options?.scope === 'selected' ? 'Eine Teilstrecke' : 'Gesamte Anlage'}</strong></span>
          <span>Luftmenge <strong>${formatNumber(variant.options?.airflowPercent, 0)} %</strong></span>
          <span>Abmessungen <strong>${formatNumber(variant.options?.dimensionPercent, 0)} %</strong></span>
        </div>
      </div>

      <h3 class="report-section-title">Grösste Änderungen nach Teilstrecke</h3>
      <table class="report-table report-variant-table">
        <thead><tr><th>TS</th><th>v Bestand</th><th>v Variante</th><th>Δp Bestand</th><th>Δp Variante</th><th>Änderung</th></tr></thead>
        <tbody>
          ${(variant.rows || []).map(row => `<tr>
            <td class="left"><strong>${escapeHtml(row.name || '-')}</strong></td>
            <td>${formatNumber(row.baseline?.velocity, 2)} m/s</td>
            <td>${formatNumber(row.scenario?.velocity, 2)} m/s</td>
            <td>${formatNumber(row.baseline?.pressureLoss, 1)} Pa</td>
            <td>${formatNumber(row.scenario?.pressureLoss, 1)} Pa</td>
            <td>${deltaText(row.delta?.pressureLoss, 'Pa', 1)}</td>
          </tr>`).join('') || '<tr><td colspan="6">Keine Teilstreckenänderungen vorhanden.</td></tr>'}
        </tbody>
      </table>
      <p class="report-continuation-note">${variant.isCurrentBase ? 'Die Variante dient dem neutralen Vergleich. Werte werden nur nach ausdrücklicher Übernahme Bestandteil der Projektberechnung.' : 'Achtung: Diese Variante wurde auf Basis eines älteren Berechnungsstands gespeichert. Vor einer Abgabe sollte der Vergleich mit dem aktuellen Projektstand neu erzeugt werden.'}</p>
    `;

    return this.renderPage(model, page, 'Variantenvergleich', `Bestand gegenüber ${variant.name}`, content, totalPages);
  }

  static renderEngineeringQualityPages(model, nextPage, totalPages) {
    const engineering = model.engineeringQuality || {};
    const findings = engineering.findings || [];
    const chunks = findings.length ? chunkArray(findings, 12) : [[]];
    const statusLabel = engineering.status === 'critical' ? 'Kritisch' : engineering.status === 'warning' ? 'Prüfen' : engineering.status === 'info' ? 'Hinweise' : 'Plausibel';

    return chunks.map((chunk, chunkIndex) => {
      const content = `
        ${chunkIndex === 0 ? `<div class="report-engineering-overview"><div class="report-engineering-score"><span>Engineering-Score</span><strong>${Math.round(toNumber(engineering.score, 100))}</strong><small>${escapeHtml(statusLabel)}</small></div><div>${this.renderDefinitionList([['Prüfprofil', engineering.profile?.name || model.projectWorkflow?.profile?.name || 'Allgemeine Planung'], ['Kritisch', engineering.counts?.critical || 0], ['Prüfen', engineering.counts?.warning || 0], ['Hinweise', engineering.counts?.info || 0], ['Analysierte Teilstrecken', engineering.analyzedSectionCount || 0]])}</div></div>` : ''}
        ${chunk.length ? `<table class="report-table report-engineering-table"><thead><tr><th>Stufe</th><th>Code</th><th>Feststellung</th><th>Empfehlung</th></tr></thead><tbody>${chunk.map(finding => `<tr class="engineering-${escapeHtml(finding.severity)}"><td>${escapeHtml(finding.severity === 'critical' ? 'Kritisch' : finding.severity === 'warning' ? 'Prüfen' : 'Hinweis')}</td><td>${escapeHtml(finding.code)}</td><td class="left"><strong>${escapeHtml(finding.title)}</strong><br><span>${escapeHtml(finding.message)}</span></td><td class="left">${escapeHtml(finding.recommendation || '-')}</td></tr>`).join('')}</tbody></table>` : '<div class="report-info-box ok"><h3>Prüfergebnis</h3><p>Keine priorisierten Engineering-Feststellungen vorhanden.</p></div>'}
        ${chunkIndex === chunks.length - 1 ? `<p class="report-engineering-disclaimer">${escapeHtml(engineering.disclaimer || '')}</p>` : '<p class="report-continuation-note">Fortsetzung der Engineering-QS auf der nächsten Seite.</p>'}
      `;
      return this.renderPage(model, nextPage(), chunkIndex ? 'Engineering-QS Fortsetzung' : 'Engineering-QS', `Priorisierte herstellerneutrale Plausibilitätsprüfung${findings.length ? ` · ${findings.length} Feststellungen` : ''}`, content, totalPages);
    });
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
              <th>Pos.</th><th>Typ</th><th>Beschreibung</th><th>TS</th><th>Luft-<br>menge<br>m³/h</th><th>Breite<br>mm</th><th>Höhe<br>mm</th><th>Ø<br>mm</th><th>Länge<br>m</th><th>k<br>mm</th><th>λ<br>-</th><th>v<br>m/s</th><th>R<br>Pa/m</th><th>Δp<br>Kanal/Rohr<br>Pa</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="14">Keine Teilstrecken vorhanden.</td></tr>'}</tbody>
          ${isLastChunk ? `<tfoot><tr><td colspan="13" class="left"><strong>Summe Kanäle / Teilstrecken</strong></td><td><strong>${formatNumber(model.totals.friction, 1)} Pa</strong></td></tr></tfoot>` : ''}
        </table>

        ${isLastChunk ? `${this.renderMainNetworkLegend()}${this.renderHiddenEntriesNote(model.reportScope?.hiddenSections, 'leere Teilstrecken')}` : '<p class="report-continuation-note">Fortsetzung der Teilstrecken auf der nächsten Seite.</p>'}
      `;

      return this.renderPage(model, nextPage(), chunkIndex ? 'Hauptberechnung – Luftnetz Fortsetzung' : 'Hauptberechnung – Luftnetz', subtitle, content, totalPages);
    });
  }

  static renderMainNetworkRow(section) {
    const sia = section.siaVelocity || {};
    const siaLabel = sia.status === 'exceeded'
      ? 'überschritten'
      : sia.status === 'warning'
        ? 'prüfen'
        : sia.status === 'ok'
          ? 'eingehalten'
          : '';
    const siaClass = sia.status === 'exceeded' ? 'error' : sia.status === 'warning' ? 'warn' : 'ok';
    const siaInline = toNumber(sia.maximumVelocityMs) > 0
      ? `<small class="report-sia-inline ${siaClass}">SIA ≤ ${formatNumber(sia.maximumVelocityMs, 2)} · ${escapeHtml(siaLabel)}</small>`
      : '';

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
        <td>${formatNumber(section.roughnessMm, 2)}</td>
        <td>${formatNumber(section.frictionFactor, 4)}</td>
        <td>${formatNumber(section.velocity, 2)}${siaInline}</td>
        <td>${formatNumber(section.frictionRate, 3)}</td>
        <td>${formatNumber(section.frictionLoss, 3)}</td>
      </tr>
    `;
  }

  static renderMainNetworkLegend() {
    return `
      <div class="report-legend">
        <span><strong>TS</strong> = Teilstrecke</span>
        <span><strong>v</strong> = Luftgeschwindigkeit</span>
        <span><strong>SIA ≤</strong> = maximaler Richtwert aus SIA-Geschwindigkeitsprüfung</span>
        <span><strong>Δp Kanal/Rohr</strong> = Reibungsdruckverlust der Teilstrecke ohne Formteile</span>
        <span><strong>ζ</strong> = Formbeiwert</span>
        <span><strong>k</strong> = absolute Rauigkeit je Teilstrecke</span>
        <span><strong>λ</strong> = automatisch berechnete Darcy-Reibungszahl</span>
        <span><strong>R</strong> = Reibungsgefälle</span>
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
        <div class="report-formpart-friction">
          <span>Von Teilstrecke übernommen</span>
          <strong>k ${formatNumber(section.roughnessMm, 2)} mm · λ ${formatNumber(section.frictionFactor, 4)} · Re ${formatNumber(section.reynoldsNumber, 0)}</strong>
        </div>
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
    const handover = model.handoverApproval || {};
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

      ${this.renderLossExplanationBox(model)}
      ${this.renderLossBreakdownTable(model)}

      <div class="report-info-box">
        <h3>Berechnungsgrundlagen</h3>
        <p>Luftdichte ρ = ${formatNumber(model.settings.rho, 2)} kg/m³</p>
        <p>Rauigkeit wird je Teilstrecke geführt; Standard k = ${formatNumber(model.settings.defaultRoughnessMm, 2)} mm. λ wird automatisch berechnet.</p>
        <p>Die Berechnung erfolgt nach den in der Software hinterlegten Formeln für Luftleitteile und Druckverlustkomponenten.</p>
      </div>

      ${this.renderQualityBlock(model)}
    `;

    return this.renderPage(model, page, 'Gesamtzusammenfassung', 'Ergebnis der Hauptberechnung', content, totalPages);
  }

  static renderLossExplanationBox(model) {
    const friction = toNumber(model.totals?.friction);
    const formParts = toNumber(model.totals?.formParts);
    const special = toNumber(model.totals?.special);
    const total = toNumber(model.totals?.total);
    const calculatedTotal = friction + formParts + special;
    const difference = calculatedTotal - total;

    return `
      <div class="report-info-box report-loss-explanation">
        <h3>Druckverlust-Aufteilung</h3>
        <p><strong>Wichtig:</strong> Die Spalte <em>Δp Kanal/Rohr</em> in der Haupttabelle zeigt nur den Reibungsdruckverlust der Teilstrecke. Formteile und Sonderbauteile werden bewusst separat ausgewiesen.</p>
        <div class="report-formula-line">
          <span>Gesamt</span>
          <strong>${formatNumber(friction, 1)} Pa</strong>
          <span>+</span>
          <strong>${formatNumber(formParts, 1)} Pa</strong>
          <span>+</span>
          <strong>${formatNumber(special, 1)} Pa</strong>
          <span>=</span>
          <strong>${formatNumber(total, 1)} Pa</strong>
        </div>
        ${Math.abs(difference) > 0.05 ? `<small>Hinweis: Rundungsdifferenz gegenüber Einzelwertsumme ${formatNumber(difference, 2)} Pa.</small>` : '<small>Die Summen sind innerhalb der Rundung konsistent.</small>'}
      </div>
    `;
  }

  static renderLossBreakdownTable(model) {
    const groups = model.formPartsBySection || [];
    const rows = groups
      .filter(group => group?.section)
      .map(group => {
        const frictionLoss = toNumber(group.section?.frictionLoss);
        const formPartLoss = toNumber(group.sum);
        return {
          position: group.section?.position || '-',
          name: group.section?.name || group.section?.description || '-',
          frictionLoss,
          formPartLoss,
          total: frictionLoss + formPartLoss,
        };
      });

    if (!rows.length) return '';

    const maxRows = 8;
    const visibleRows = rows.slice(0, maxRows);
    const hidden = rows.length - visibleRows.length;
    const sectionPlusFormParts = rows.reduce((sum, row) => sum + row.total, 0);

    return `
      <div class="report-loss-breakdown">
        <h3>Teilstrecken-Aufteilung</h3>
        <table class="report-table small report-loss-breakdown-table">
          <thead>
            <tr><th>Pos.</th><th>TS</th><th>Δp Kanal/Rohr</th><th>Formteile</th><th>Summe TS</th></tr>
          </thead>
          <tbody>
            ${visibleRows.map(row => `
              <tr>
                <td>${escapeHtml(row.position)}</td>
                <td class="left">${escapeHtml(row.name)}</td>
                <td>${formatNumber(row.frictionLoss, 2)} Pa</td>
                <td>${formatNumber(row.formPartLoss, 2)} Pa</td>
                <td><strong>${formatNumber(row.total, 2)} Pa</strong></td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="4" class="left"><strong>Summe Teilstrecken + Formteile</strong></td><td><strong>${formatNumber(sectionPlusFormParts, 2)} Pa</strong></td></tr>
          </tfoot>
        </table>
        ${hidden > 0 ? `<p class="report-continuation-note">${hidden} weitere Teilstrecke${hidden === 1 ? '' : 'n'} werden in den Detailseiten dargestellt.</p>` : ''}
      </div>
    `;
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
    const handover = model.handoverApproval || {};
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

      ${model.reviewProtocol ? `<div class="report-info-box report-manual-review">
        <h3>Manuelles Prüfprotokoll</h3>
        <div class="report-review-summary"><strong>${model.reviewProtocol.completed || 0}/${model.reviewProtocol.total || 0}</strong><span>Prüfpunkte bestätigt</span><small>${escapeHtml(model.reviewProtocol.reviewer || 'Prüfperson nicht eingetragen')} · ${escapeHtml(model.reviewProtocol.date || 'Datum offen')}</small></div>
        <div class="report-review-checks">${(model.reviewProtocol.checks || []).map(item => `<span class="${item.checked ? 'is-checked' : 'is-open'}">${item.checked ? '✓' : '○'} ${escapeHtml(item.label)}</span>`).join('')}</div>
        ${model.reviewProtocol.note ? `<p><strong>Prüfvermerk:</strong> ${escapeHtml(model.reviewProtocol.note)}</p>` : ''}
      </div>` : ''}

      ${handover && (handover.preparedBy || handover.checkedBy || handover.releasedBy) ? `<div class="report-info-box report-handover-approval">
        <h3>Dokumentierte Projektübergabe</h3>
        <div class="report-review-summary"><strong>${escapeHtml(({ draft: 'Entwurf', prepared: 'Vorbereitet', checked: 'Geprüft', released: 'Freigegeben' })[handover.status] || 'Entwurf')}</strong><span>Übergabestatus</span><small>${escapeHtml(handover.packageId || 'Noch kein Freigabepaket erzeugt')}</small></div>
        ${handover.note ? `<p><strong>Übergabevermerk:</strong> ${escapeHtml(handover.note)}</p>` : ''}
      </div>` : ''}

      <table class="report-table report-approval-table">
        <thead><tr><th>Schritt</th><th>Name</th><th>Datum</th><th>Unterschrift</th></tr></thead>
        <tbody>
          <tr>
            <td class="left"><strong>Erstellt</strong></td>
            <td class="left">${escapeHtml(handover.preparedBy || model.project.author || '-')}</td>
            <td>${escapeHtml((handover.preparedAt || model.project.date || '-').slice ? (handover.preparedAt || model.project.date || '-').slice(0,10) : (handover.preparedAt || model.project.date || '-'))}</td>
            <td class="signature-cell"></td>
          </tr>
          <tr>
            <td class="left"><strong>Geprüft</strong></td>
            <td class="left">${escapeHtml(handover.checkedBy || model.project.checkedBy || '-')}</td>
            <td>${escapeHtml(handover.checkedAt ? handover.checkedAt.slice(0,10) : '')}</td>
            <td class="signature-cell"></td>
          </tr>
          <tr>
            <td class="left"><strong>Freigegeben</strong></td>
            <td class="left">${escapeHtml(handover.releasedBy || model.project.approvedBy || '-')}</td>
            <td>${escapeHtml(handover.releasedAt ? handover.releasedAt.slice(0,10) : (model.project.approvalDate || ''))}</td>
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
            ['SIA-Raumnutzung', model.system.roomUsage || '-'],
            ['Betriebsart', model.system.operationMode || '-'],
            ['Elektro-Vollaststunden', Number.isFinite(Number(model.system.electricalFullLoadHours)) ? `${formatSmart(model.system.electricalFullLoadHours, 0)} h/a` : '-'],
            ['SIA-Geschwindigkeitsstatus', model.velocityCompliance?.summary?.status === 'critical' ? 'Überschritten' : model.velocityCompliance?.summary?.status === 'warning' ? 'Prüfen' : model.velocityCompliance?.summary?.status === 'ok' ? 'Eingehalten' : 'Auswahl / Prüfung offen'],
            ['Bearbeiter', model.project.author],
            ['Datum', model.project.date],
            ['Bericht-Nr.', model.project.reportNumber],
            ['Revision', model.project.revision],
            ['Geprüft von', model.project.checkedBy],
            ['Freigegeben von', model.project.approvedBy],
            ['Software', model.project.software],
            ['Projektversion', model.project.version],
            ['Softwarestand', APP_BUILD_LABEL],
            ['Lizenzstatus', model.license?.modeLabel || '-'],
            ['Exportstatus', model.license?.exportLabel || model.exportNotice?.exportLabel || '-'],
          ])}
        </div>
        <div>
          <h3>Hinweise</h3>
          <ul class="report-note-list">
            <li>Alle Angaben ohne Gewähr.</li>
            <li>Für die Richtigkeit der Eingabedaten ist der Planer verantwortlich.</li>
            <li>Diese Berechnung ersetzt keine Detailplanung.</li>
            <li>Lizenz-/Exportstatus: ${escapeHtml(model.exportNotice?.text || model.license?.modeLabel || '-')}</li>
          </ul>
          ${model.project.note ? `<div class="report-user-note"><strong>Bemerkung:</strong><br>${escapeHtml(model.project.note)}</div>` : ''}
        </div>
      </div>

      <div class="report-info-box">
        <h3>Verwendete Berechnungsgrundlagen</h3>
        <ul>
          <li>Berechnung nach den in der Software hinterlegten Formeln.</li>
          <li>Luftdichte ρ = ${formatNumber(model.settings.rho, 2)} kg/m³ · Standard-Rauigkeit k = ${formatNumber(model.settings.defaultRoughnessMm, 2)} mm</li>
          <li>Die Darcy-Reibungszahl λ wird für jede Teilstrecke aus Rauigkeit, Reynolds-Zahl und hydraulischem Durchmesser berechnet.</li>
          <li>Formbeiwerte nach hinterlegten Tabellen aus der Formteilbibliothek.</li>
          <li>Druckverlustberechnung nach Darcy-Weisbach.</li>
          <li>Geschwindigkeits-Vorprüfung nach SIA 382/1:2025, Tabellen 49 und 50, mit Elektro-Vollaststunden aus SIA 2024:2021, Tabelle 13.</li>
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
      .report-system-overview-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}
      .report-system-overview-table th:nth-child(1){width:8mm}.report-system-overview-table th:nth-child(2){width:39mm}.report-system-overview-table th:nth-child(3){width:19mm}.report-system-overview-table th:nth-child(4){width:9mm}.report-system-overview-table th:nth-child(5){width:22mm}.report-system-overview-table th:nth-child(6){width:18mm}.report-system-overview-table th:nth-child(7){width:22mm}.report-system-overview-table th:nth-child(8){width:13mm}
      .report-system-overview-table td{font-size:8.1px}.report-system-overview-table td:nth-child(2) strong,.report-system-overview-table td:nth-child(2) span{display:block}.report-system-overview-table td:nth-child(2) span{margin-top:2px;color:var(--report-muted)}
      .report-system-overview-table tr.is-current-system td{background:#eef6ff}.report-system-overview-note{margin-top:12px}
      .report-project-cockpit-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:10px}
      .report-project-cockpit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
      .report-project-meta-table td:first-child{width:42%}
      .report-project-cockpit-findings .report-table{font-size:7.4px}
      .report-project-cockpit-findings .report-table th:nth-child(1){width:16mm}
      .report-project-cockpit-findings .report-table th:nth-child(2){width:30mm}
      .report-project-cockpit-findings .report-table th:nth-child(3){width:50mm}
      .report-project-cockpit-findings .report-table th:nth-child(4){width:auto}
      .report-small-note{margin:5px 0 0;color:var(--report-muted);font-size:7.6px;line-height:1.35}
      .report-status-pill{display:inline-flex;align-items:center;justify-content:center;min-width:12mm;padding:1mm 2mm;border-radius:99px;font-size:7px;font-weight:900;text-transform:uppercase}.report-status-pill.ok{color:#176c46;background:#eaf8f0}.report-status-pill.warn{color:#8a5a0a;background:#fff1d4}.report-status-pill.error{color:#a52828;background:#ffe6e6}
      .report-sia-inline{display:block;margin-top:.7mm;font-size:6.3px;font-weight:800;line-height:1.15;white-space:nowrap}.report-sia-inline.ok{color:#176c46}.report-sia-inline.warn{color:#8a5a0a}.report-sia-inline.error{color:#a52828}

      .report-approval-table th{font-size:8px}.report-approval-table td{height:20mm;font-size:10px}
      .report-approval-table .signature-cell{background:linear-gradient(to bottom, transparent 70%, #d9e2ee 70%, #d9e2ee 72%, transparent 72%)}
      .report-revision-compare-head{display:grid;grid-template-columns:1fr 10mm 1fr 1fr;gap:3mm;align-items:stretch;margin-bottom:5mm}
      .report-revision-compare-card{display:flex;flex-direction:column;justify-content:center;border:1px solid #c9d8e8;border-radius:3mm;background:#f8fbff;padding:4mm}.report-revision-compare-card.accent{border-color:#83b7da;background:#edf7ff}.report-revision-compare-card span{font-size:7px;text-transform:uppercase;font-weight:900;color:var(--report-muted)}.report-revision-compare-card strong{font-size:13px;color:var(--report-blue);margin:1.5mm 0}.report-revision-compare-card small{font-size:7.5px;color:var(--report-muted)}
      .report-revision-compare-arrow{display:grid;place-items:center;font-size:18px;color:#4d7597;font-weight:900}
      .report-revision-summary-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:2.5mm;margin-bottom:5mm}.report-revision-summary-grid div{border:1px solid #d3dfeb;border-radius:2.5mm;background:#fff;padding:3mm}.report-revision-summary-grid span{display:block;font-size:6.8px;text-transform:uppercase;font-weight:900;color:var(--report-muted)}.report-revision-summary-grid strong{display:block;font-size:12px;color:var(--report-blue);margin-top:1mm}
      .report-revision-comparison-table th,.report-revision-comparison-table td{font-size:7px}.report-revision-comparison-table th:nth-child(1){width:20mm}.report-revision-comparison-table th:nth-child(2){width:25mm}.report-revision-comparison-table th:nth-child(3){width:15mm}.report-revision-comparison-table th:nth-child(4){width:24mm}
      .report-manual-review{margin:5mm 0}.report-review-summary{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:3mm;margin-bottom:3mm}.report-review-summary strong{font-size:20px;color:var(--report-blue)}.report-review-summary span{font-weight:800}.report-review-summary small{color:var(--report-muted)}.report-review-checks{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5mm 4mm}.report-review-checks span{font-size:8px;padding:1.5mm 2mm;border-radius:2mm;background:#f5f8fb}.report-review-checks span.is-checked{color:#176c46;background:#eefaf3}.report-review-checks span.is-open{color:#8a5a0a;background:#fff8e9}.report-manual-review p{font-size:8px;margin:3mm 0 0}
      .report-variant-intro{display:grid;grid-template-columns:1.4fr .8fr;gap:8mm;padding:6mm;border:1px solid #c9d8e8;border-radius:4mm;background:#f7faff;margin-bottom:6mm}
      .report-chip.warn{background:#fff0c8;color:#7a5200;border-color:#e1bf6b}
      .report-variant-intro h3{font-size:18px;margin:2mm 0}.report-variant-intro p{margin:0;color:var(--report-muted);line-height:1.5}
      .report-variant-intro dl{margin:0;display:grid;gap:2mm}.report-variant-intro dl div{display:flex;justify-content:space-between;gap:4mm;border-bottom:1px solid #dce6f0;padding-bottom:1.5mm}.report-variant-intro dt{color:var(--report-muted)}.report-variant-intro dd{margin:0;font-weight:700;text-align:right}
      .report-variant-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:5mm}.report-variant-kpis article{border:1px solid #c9d8e8;border-radius:3mm;padding:4mm;background:#fff}.report-variant-kpis span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.04em;color:var(--report-muted)}.report-variant-kpis strong{display:block;font-size:15px;color:var(--report-blue);margin:1.5mm 0}.report-variant-kpis small{font-size:8px;color:var(--report-muted)}
      .report-variant-parameters{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.report-variant-parameters span{display:flex;justify-content:space-between;gap:3mm}.report-variant-table th,.report-variant-table td{font-size:8px}
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
      .report-formpart-friction{display:flex;justify-content:space-between;gap:8px;padding:5px 8px;background:#eef5fc;border-bottom:1px solid var(--report-line);font-size:7.5px;color:#40566f}
      .report-formpart-friction strong{color:#123b64;text-align:right}
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
      .report-loss-explanation{background:linear-gradient(135deg,#f8fbff,#eef6ff)}
      .report-loss-explanation p{margin:0 0 8px;color:#20354f}
      .report-loss-explanation em{font-style:normal;color:var(--report-blue);font-weight:900}
      .report-formula-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px solid #d8e5f4;border-radius:6px;background:white;padding:7px 9px;margin:7px 0 6px;font-size:9.6px}
      .report-formula-line span{color:#536a83;font-weight:800}
      .report-formula-line strong{color:var(--report-blue);font-size:10.6px}
      .report-loss-breakdown{margin-top:10px}
      .report-loss-breakdown h3{margin:0 0 6px;color:var(--report-blue);font-size:10.5px;text-transform:uppercase;letter-spacing:.04em}
      .report-loss-breakdown-table th:nth-child(1){width:13mm}.report-loss-breakdown-table th:nth-child(2){width:45mm}
      .report-loss-breakdown-table td{font-size:8.1px;padding:4px 3px}
      .report-info-box{border:1px solid var(--report-line);border-radius:7px;background:#f8fbff;padding:12px 15px;margin-top:14px;font-size:10.4px;line-height:1.45}
      .report-info-box.ok{border-color:#bde5ce;background:#f2fbf5}.report-info-box.warn{border-color:#f2c282;background:#fff8ed}
      .report-two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:4px}
      .report-note-list,.report-info-box ul{margin:0;padding-left:17px;font-size:10.4px;line-height:1.62}
      .report-user-note{margin-top:12px;border-left:3px solid var(--report-blue);background:#f4f8fd;padding:9px 10px;font-size:10px;line-height:1.45;color:#20354f}
      .dp-professional-report img,.report-print-body img{user-select:none;-webkit-user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none;pointer-events:none}
      .report-copyright{text-align:center;margin-top:32px;color:#43566d;font-size:10.4px}
      .report-empty{border:1px dashed var(--report-line);border-radius:8px;padding:20px;color:var(--report-muted);background:#fafcff}
      .report-footer{position:absolute;left:13mm;right:13mm;bottom:7mm;border-top:1px solid #d6deea;padding-top:5px;display:flex;justify-content:space-between;font-size:8.8px;color:#223950;gap:10px}
      .report-footer span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:145mm}
      .report-print-helper{position:sticky;top:0;z-index:50;display:flex;justify-content:space-between;align-items:center;gap:16px;max-width:210mm;margin:0 auto 12px;padding:10px 14px;border:1px solid #cfdbea;border-radius:10px;background:#ffffff;box-shadow:0 8px 28px rgba(20,45,75,.12);font-family:Segoe UI,Arial,sans-serif;color:#06172b}
      .report-print-helper strong{display:block;color:#073f7a;font-size:13px}.report-print-helper span{display:block;color:#5c6f87;font-size:10px;margin-top:2px}.report-print-helper-actions{display:flex;gap:8px}.report-print-helper button{border:1px solid #0b559c;background:#073f7a;color:white;border-radius:7px;padding:7px 10px;font-weight:800;cursor:pointer}.report-print-helper button:last-child{background:white;color:#073f7a}
      .report-executive-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
      .report-executive-kpis>div{border:1px solid var(--report-line);border-radius:8px;background:#fbfdff;padding:10px;min-height:27mm;display:flex;flex-direction:column;justify-content:space-between}
      .report-executive-kpis span{font-size:8px;color:var(--report-muted);font-weight:900;text-transform:uppercase}.report-executive-kpis strong{font-size:17px;color:var(--report-blue);line-height:1.08}.report-executive-kpis small{font-size:8px;color:#536a83;line-height:1.25}
      .report-executive-score.ok{background:#f2fbf5;border-color:#bde5ce}.report-executive-score.warn{background:#fff8ed;border-color:#f2c282}.report-executive-score.error{background:#fff4f4;border-color:#efb7b7}
      .report-executive-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.report-executive-grid .report-info-box{margin-top:0;min-height:82mm}.report-executive-priority ol{margin:0;padding-left:18px}.report-executive-priority li{margin:0 0 9px}.report-executive-priority li strong,.report-executive-priority li span{display:block}.report-executive-priority li strong{color:#123b64;font-size:9.2px}.report-executive-priority li span{color:#52677e;font-size:8.4px;line-height:1.35;margin-top:2px}.report-top-loss-table td{font-size:8px}.report-executive-note{margin-top:10px;padding:9px 12px}
      .report-schematic-wrap{border:1px solid var(--report-line);border-radius:10px;background:#fbfdff;padding:4px;overflow:hidden}.report-schematic-svg{width:100%;height:auto;display:block}.report-schematic-grid{fill:#fff;stroke:#d7e2ef;stroke-width:1}.report-schematic-duct{stroke:#718ba3;stroke-width:1.25}.report-schematic-arrow,.report-schematic-terminal-arrow{stroke:#315b7d;stroke-width:2;fill:none}.report-schematic-terminal-arrow{stroke:#0b6cae;stroke-width:2.5}.report-schematic-node rect{fill:#fff;stroke:#0b6cae;stroke-width:1.7}.report-schematic-node .report-schematic-node-accent{fill:#0b6cae;stroke:none}.report-schematic-node-title{font-size:8.6px;font-weight:900;fill:#073f7a}.report-schematic-node-line{font-size:6.7px;fill:#425b74}.report-schematic-node-line.strong{font-weight:900;fill:#0b355d}.report-schematic-terminal{font-size:7px;font-weight:900;fill:#425b74;letter-spacing:.03em}.report-schematic-terminal-value{font-size:6.8px;font-weight:800;fill:#073f7a}.report-schematic-terminal.is-end circle{fill:#123f66;stroke:#fff;stroke-width:2}.report-schematic-section-label{font-size:7px;font-weight:900;fill:#0b6cae;letter-spacing:.04em}.report-schematic-section-range{font-size:6.8px;font-weight:800;fill:#536a83}.report-schematic-attachment-line{stroke:#8ca2b8;stroke-width:1;stroke-dasharray:3 2}.report-schematic-formpart{fill:#e28a0c}.report-schematic-special{fill:#6e55ad}.report-schematic-count{font-size:6.3px;font-weight:900;fill:#fff}.report-schematic-legend text{font-size:6.2px;fill:#536a83}.report-schematic-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.report-schematic-summary.is-five-columns{grid-template-columns:repeat(5,1fr)}.report-schematic-summary div{border:1px solid var(--report-line);border-radius:6px;background:#f7faff;padding:7px 9px}.report-schematic-summary span{display:block;font-size:7px;color:var(--report-muted);text-transform:uppercase;font-weight:900;line-height:1.2}.report-schematic-summary strong{display:block;font-size:11px;color:var(--report-blue);margin-top:3px;white-space:nowrap}.report-schematic-disclaimer{font-size:7.7px;color:#5c6f87;margin:8px 0 0;line-height:1.35}.report-schematic-empty{min-height:100mm;display:grid;place-items:center}
      .report-loss-analysis-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.report-loss-analysis-grid .report-info-box{margin-top:0;min-height:56mm}.report-chart-row{margin:0 0 10px}.report-chart-row>div{display:flex;justify-content:space-between;gap:10px;font-size:8.5px}.report-chart-row>div span{color:#536a83}.report-chart-row i{display:block;height:8px;background:#e8eff7;border-radius:999px;overflow:hidden;margin-top:4px}.report-chart-row i b{display:block;height:100%;background:linear-gradient(90deg,#0b559c,#45a2d8);border-radius:999px}.report-section-ranking{margin-top:12px}.report-ranking-row{display:grid;grid-template-columns:18px 38mm 1fr 20mm;align-items:center;gap:7px;margin:7px 0;font-size:8.6px}.report-ranking-row>span{display:grid;place-items:center;width:17px;height:17px;border-radius:50%;background:#eaf2fb;color:#073f7a;font-weight:900}.report-ranking-row>strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.report-ranking-row i{height:7px;background:#e8eff7;border-radius:999px;overflow:hidden}.report-ranking-row i b{display:block;height:100%;background:#0b6cae;border-radius:999px}.report-ranking-row em{font-style:normal;text-align:right;font-weight:900;color:#073f7a}
      .report-engineering-overview{display:grid;grid-template-columns:38mm 1fr;gap:14px;margin-bottom:12px}.report-engineering-score{border:1px solid #b9d8ee;border-radius:9px;background:linear-gradient(135deg,#edf7ff,#f8fbff);padding:10px;display:flex;flex-direction:column;justify-content:center}.report-engineering-score span{font-size:7.8px;text-transform:uppercase;color:#536a83;font-weight:900}.report-engineering-score strong{font-size:34px;line-height:1;color:#073f7a}.report-engineering-score small{font-size:8px;color:#536a83;margin-top:3px}.report-engineering-overview>div:last-child{border:1px solid var(--report-line);border-radius:9px;padding:10px;background:#fbfdff}.report-engineering-table th:nth-child(1){width:18mm}.report-engineering-table th:nth-child(2){width:25mm}.report-engineering-table th:nth-child(3){width:66mm}.report-engineering-table td{font-size:7.6px;line-height:1.25}.report-engineering-table td span{color:#536a83}.report-engineering-table .engineering-critical td:first-child{color:#a52828;font-weight:900}.report-engineering-table .engineering-warning td:first-child{color:#9a5a00;font-weight:900}.report-engineering-disclaimer{font-size:8px;color:#5c6f87;margin:10px 0 0;font-style:italic}
      @media screen and (max-width:960px){.dp-professional-report{overflow:auto}.report-page{width:100%;height:auto;min-height:auto}.report-formpart-grid,.report-catalog-list,.report-cover-main,.report-summary-cards.cover,.report-two-col,.report-quality-grid,.report-audit-grid,.report-approval-layout,.report-executive-kpis,.report-executive-grid,.report-loss-analysis-grid,.report-schematic-summary,.report-revision-compare-head,.report-revision-summary-grid,.report-review-checks{grid-template-columns:1fr}.report-cover-summary{margin-top:18px}}
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
    rows.push(this.csvRow(['Engineering Score', Math.round(toNumber(model.engineeringQuality?.score, 100))]));
    rows.push(this.csvRow(['Engineering Status', model.engineeringQuality?.status || 'ok']));
    rows.push(this.csvRow(['Engineering Feststellungen', model.engineeringQuality?.findings?.length || 0]));
    rows.push(this.csvRow(['Engineering Pruefprofil', model.projectWorkflow?.profile?.name || model.engineeringQuality?.profile?.name || 'Allgemeine Planung']));
    rows.push(this.csvRow(['SIA Raumnutzung', model.system.roomUsage || '-']));
    rows.push(this.csvRow(['SIA Betriebsart', model.system.operationMode || '-']));
    rows.push(this.csvRow(['Elektro-Vollaststunden h/a', model.system.electricalFullLoadHours ?? '-']));
    rows.push(this.csvRow(['SIA Geschwindigkeitsstatus', model.velocityCompliance?.summary?.status || 'not-configured']));

    addSection('Teilstrecken');
    rows.push(this.csvRow(['Pos.', 'Typ', 'Beschreibung', 'TS', 'Luftmenge m3/h', 'Breite mm', 'Hoehe mm', 'Durchmesser mm', 'Laenge m', 'Rauigkeit k mm', 'Reynolds Re', 'Reibungszahl Lambda', 'v m/s', 'SIA max v m/s', 'SIA Faktor', 'SIA Status', 'Reibungsgefaelle Pa/m', 'Reibung Pa', 'Formteile Pa', 'Direkt Pa', 'Gesamt Pa']));
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
        formatNumber(section.roughnessMm, 2),
        formatNumber(section.reynoldsNumber, 0),
        formatNumber(section.frictionFactor, 5),
        formatNumber(section.velocity, 2),
        section.siaVelocity?.maximumVelocityMs ? formatNumber(section.siaVelocity.maximumVelocityMs, 2) : '-',
        section.siaVelocity?.reductionFactor ? formatNumber(section.siaVelocity.reductionFactor, 4) : '-',
        section.siaVelocity?.status || 'not-configured',
        formatNumber(section.frictionRate, 4),
        formatNumber(section.frictionLoss, 3),
        formatNumber(section.zetaLoss, 3),
        formatNumber(section.directLoss, 3),
        formatNumber(section.totalLoss, 3),
      ]));
    });

    addSection('Formteile');
    rows.push(this.csvRow(['Teilstrecke', 'Formteil', 'Kategorie', 'Bezug', 'Rauigkeit k mm', 'Reynolds Re', 'Reibungszahl Lambda', 'Zeta', 'Dynamischer Druck Pa', 'Druckverlust Pa']));
    (model.formPartsBySection || []).forEach(group => {
      (group.formParts || []).forEach(part => {
        rows.push(this.csvRow([
          group.section?.name || part.sectionId || '-',
          part.type || part.name,
          part.category,
          part.reference,
          formatNumber(part.roughnessMm, 2),
          formatNumber(part.reynoldsNumber, 0),
          formatNumber(part.frictionFactor, 5),
          formatNumber(part.zeta, 3),
          formatNumber(part.dynamicPressure, 3),
          formatNumber(part.pressureLoss, 3),
        ]));
      });
    });

    addSection('Engineering-QS');
    rows.push(this.csvRow(['Stufe', 'Code', 'Teilstrecke', 'Feststellung', 'Empfehlung']));
    (model.engineeringQuality?.findings || []).forEach(finding => {
      rows.push(this.csvRow([
        finding.severity,
        finding.code,
        finding.sectionId || '-',
        finding.title || finding.message || '-',
        finding.recommendation || '-',
      ]));
    });

    if ((model.projectTasks?.tasks || []).length) {
      addSection('Projektaufgaben');
      rows.push(this.csvRow(['Quelle', 'Prioritaet', 'Status', 'Faelligkeit', 'Anlage', 'Teilstrecke', 'Aufgabe', 'Beschreibung / Empfehlung', 'Bearbeiter', 'Code']));
      (model.projectTasks.tasks || []).forEach(task => rows.push(this.csvRow([
        task.source === 'generated' ? 'Automatisch' : 'Manuell',
        task.priority || '',
        task.status || '',
        task.dueDate || '',
        task.systemName || '',
        task.sectionName || '',
        task.title || '',
        task.recommendation || task.description || '',
        task.actor || '',
        task.code || '',
      ])));
    }

    if ((model.projectWorkflow?.changeHistory || []).length) {
      addSection('Aenderungsprotokoll');
      rows.push(this.csvRow(['Zeitpunkt', 'Aktion', 'Titel', 'Anlage', 'Bearbeiter', 'Zusammenfassung']));
      (model.projectWorkflow.changeHistory || []).forEach(item => rows.push(this.csvRow([
        item.timestamp || '',
        item.action || '',
        item.title || '',
        item.systemName || '',
        item.actor || '',
        item.summary || '',
      ])));
    }

    if (model.revisionComparison && !model.revisionComparison.legacy) {
      addSection('Revisionsvergleich');
      rows.push(this.csvRow(['Basis', model.revisionComparison.base?.label || '-']));
      rows.push(this.csvRow(['Ziel', model.revisionComparison.target?.label || 'Aktueller Projektstand']));
      rows.push(this.csvRow(['Gesamtdruckverlust vorher Pa', formatNumber(model.revisionComparison.totals?.before?.totalLoss, 2)]));
      rows.push(this.csvRow(['Gesamtdruckverlust nachher Pa', formatNumber(model.revisionComparison.totals?.after?.totalLoss, 2)]));
      rows.push(this.csvRow(['Differenz Pa', formatNumber(model.revisionComparison.totals?.delta?.totalLoss, 2)]));
      rows.push(this.csvRow(['Kategorie', 'Element', 'Aenderungsart', 'Feld', 'Vorher', 'Nachher', 'Differenz']));
      (model.revisionComparison.changes || []).forEach(change => rows.push(this.csvRow([
        change.category,
        change.elementName,
        change.changeType,
        change.fieldLabel,
        change.beforeLabel,
        change.afterLabel,
        change.deltaLabel,
      ])));
    }

    if (model.variantComparison) {
      addSection('Variantenvergleich');
      rows.push(this.csvRow(['Variante', model.variantComparison.name]));
      rows.push(this.csvRow(['Bemerkung', model.variantComparison.note || '']));
      rows.push(this.csvRow(['Luftmenge %', formatNumber(model.variantComparison.options?.airflowPercent, 0)]));
      rows.push(this.csvRow(['Abmessungen %', formatNumber(model.variantComparison.options?.dimensionPercent, 0)]));
      rows.push(this.csvRow(['Kennwert', 'Bestand', 'Variante', 'Differenz']));
      rows.push(this.csvRow(['Gesamtdruckverlust Pa', formatNumber(model.variantComparison.baseline?.totalLoss, 2), formatNumber(model.variantComparison.scenario?.totalLoss, 2), formatNumber(model.variantComparison.delta?.totalLoss, 2)]));
      rows.push(this.csvRow(['Max. Geschwindigkeit m/s', formatNumber(model.variantComparison.baseline?.maxVelocity, 2), formatNumber(model.variantComparison.scenario?.maxVelocity, 2), formatNumber(model.variantComparison.delta?.maxVelocity, 2)]));
      rows.push(this.csvRow(['Teilstrecke', 'v Bestand', 'v Variante', 'Delta p Bestand', 'Delta p Variante', 'Aenderung Pa']));
      (model.variantComparison.rows || []).forEach(row => rows.push(this.csvRow([
        row.name,
        formatNumber(row.baseline?.velocity, 2),
        formatNumber(row.scenario?.velocity, 2),
        formatNumber(row.baseline?.pressureLoss, 2),
        formatNumber(row.scenario?.pressureLoss, 2),
        formatNumber(row.delta?.pressureLoss, 2),
      ])));
    }

    if (model.projectDependencies) {
      addSection('Struktur- und Abhaengigkeitspruefung');
      rows.push(this.csvRow(['Struktur-Score', formatNumber(model.projectDependencies.summary?.score, 0)]));
      rows.push(this.csvRow(['Elemente', model.projectDependencies.summary?.nodes || 0]));
      rows.push(this.csvRow(['Verknuepfungen', model.projectDependencies.summary?.links || 0]));
      rows.push(this.csvRow(['Prioritaet', 'Code', 'Feststellung', 'Details', 'Empfehlung', 'Anlage', 'Teilstrecke']));
      (model.projectDependencies.conflicts?.findings || []).forEach(item => rows.push(this.csvRow([
        item.severityLabel || item.severity,
        item.code,
        item.title,
        item.message || '',
        item.recommendation || '',
        item.systemId || '',
        item.sectionId || '',
      ])));
    }

    if ((model.projectCockpit?.rows || []).length > 1) {
      addSection('Projektweite QS-Matrix');
      rows.push(this.csvRow(['Projekt-Score', formatNumber(model.projectCockpit.score, 0)]));
      rows.push(this.csvRow(['Status', model.projectCockpit.label || '']));
      rows.push(this.csvRow(['Engineering-Mittelwert', formatNumber(model.projectCockpit.engineeringAverage, 0)]));
      rows.push(this.csvRow(['Dokumentations-Score', formatNumber(model.projectCockpit.documentationScore, 0)]));
      rows.push(this.csvRow(['Prioritaet', 'Anlage / Bereich', 'Code', 'Feststellung', 'Empfehlung']));
      (model.projectCockpit.findings || []).forEach(item => rows.push(this.csvRow([
        item.severity,
        item.systemName || 'Projekt',
        item.code,
        item.title,
        item.recommendation || item.message || '',
      ])));
    }

    if ((model.systemsOverview?.rows || []).length > 1) {
      addSection('Projektweite Anlagenuebersicht');
      rows.push(this.csvRow(['Nr.', 'BKP', 'Anlage', 'Typ', 'Teilstrecken', 'Formteile', 'Sonderbauteile', 'Luftmenge m3/h', 'Max. Geschwindigkeit m/s', 'Gesamtdruckverlust Pa', 'Engineering-Score']));
      model.systemsOverview.rows.forEach(row => rows.push(this.csvRow([
        row.position,
        row.bkp,
        row.name,
        row.type,
        row.sections,
        row.formParts,
        row.specialComponents,
        formatAirflow(row.airflow),
        formatNumber(row.maxVelocity, 2),
        formatNumber(row.totalPressureLoss, 2),
        formatNumber(row.qualityScore, 0),
      ])));
    }

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

    if (model.reviewProtocol) {
      addSection('Manuelles Pruefprotokoll');
      rows.push(this.csvRow(['Geprueft von', model.reviewProtocol.reviewer || '']));
      rows.push(this.csvRow(['Pruefdatum', model.reviewProtocol.date || '']));
      rows.push(this.csvRow(['Pruefvermerk', model.reviewProtocol.note || '']));
      rows.push(this.csvRow(['Pruefpunkt', 'Status']));
      (model.reviewProtocol.checks || []).forEach(item => rows.push(this.csvRow([item.label, item.checked ? 'bestaetigt' : 'offen'])));
    }

    addSection('Pruefung / Freigabe');
    rows.push(this.csvRow(['Erstellt', model.handoverApproval?.preparedBy || model.project.author, model.handoverApproval?.preparedAt || model.project.date]));
    rows.push(this.csvRow(['Geprueft', model.handoverApproval?.checkedBy || model.project.checkedBy, model.handoverApproval?.checkedAt || '']));
    rows.push(this.csvRow(['Freigegeben', model.handoverApproval?.releasedBy || model.project.approvedBy, model.handoverApproval?.releasedAt || model.project.approvalDate || '']));
    rows.push(this.csvRow(['Uebergabestatus', model.handoverApproval?.status || 'draft', model.handoverApproval?.packageId || '']));
    rows.push(this.csvRow(['Uebergabevermerk', model.handoverApproval?.note || '', '']));

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
