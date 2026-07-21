#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createMediumOfficePracticeProject } from '../src/project/officePracticeProjects.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import ReportEngine from '../src/report/ReportEngine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = process.env.PHASE57_BROWSER_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'druckverlust-phase57-'));
fs.mkdirSync(outputDir, { recursive: true });

function findExisting(candidates = []) {
  return candidates.filter(Boolean).find(candidate => {
    if (!candidate.includes('/') && !candidate.includes('\\')) return true;
    return fs.existsSync(candidate);
  }) || null;
}

function findBrowser() {
  return findExisting([
    process.env.BROWSER_EXECUTABLE,
    process.env.CHROME_BIN,
    process.env.EDGE_BIN,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ]);
}

function findWeasyPrint() {
  return findExisting([
    process.env.WEASYPRINT_BIN,
    '/opt/pyvenv/bin/weasyprint',
    '/usr/bin/weasyprint',
    'weasyprint',
  ]);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: options.timeout ?? 30000,
    killSignal: 'SIGKILL',
    ...options,
  });

  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error || null,
    timedOut: result.error?.code === 'ETIMEDOUT',
  };
}

function absoluteAssetPaths(html) {
  const rootUrl = pathToFileURL(`${ROOT}${path.sep}`).href;
  return String(html)
    .replace(/(src=["'])\.\/assets\//gi, `$1${rootUrl}assets/`)
    .replace(/(src=["'])assets\//gi, `$1${rootUrl}assets/`);
}

function check(condition, label, actual, expected) {
  return { passed: Boolean(condition), label, actual, expected };
}

function readPdfPages(pdfPath) {
  if (!fs.existsSync(pdfPath)) return null;
  const info = run('/usr/bin/pdfinfo', [pdfPath], { timeout: 15000 });
  if (info.status !== 0) return null;
  const match = info.stdout.match(/^Pages:\s+(\d+)/m);
  return match ? Number(match[1]) : null;
}

const project = createMediumOfficePracticeProject();
const system = project.systems.find(item => item.id === project.phase56Practice.primarySystemId) || project.systems[0];
project.calculationResult = ProjectCalculationService.calculate(project, system.id);
const model = ReportEngine.createReportModel(project, {
  system,
  registry: ProjectCalculationService.getFormPartRegistry(),
});
const pagePlan = ReportEngine.createPagePlan(model);
const html = absoluteAssetPaths(ReportEngine.createStandaloneHtml(model));
const htmlPath = path.join(outputDir, 'Phase57_RC_Browserbericht.html');
const pdfPath = path.join(outputDir, 'Phase57_RC_Browserbericht.pdf');
const resultPath = path.join(outputDir, 'Phase57_RC_Browserpruefung.json');
fs.writeFileSync(htmlPath, html, 'utf8');

const checks = [];
const staticPageCount = (html.match(/class="report-page(?:\s|\")/g) || []).length;
checks.push(check(staticPageCount === pagePlan.totalPages, 'HTML enthält alle geplanten Berichtseiten', staticPageCount, pagePlan.totalPages));
checks.push(check(html.includes('window.__druckverlustLayoutAudit'), 'HTML enthält die automatische Layoutprüfung', html.includes('window.__druckverlustLayoutAudit') ? 'vorhanden' : 'fehlt', 'vorhanden'));
checks.push(check(!/\bNaN\b|>undefined<|\bInfinity\b/.test(html), 'HTML enthält keine sichtbaren NaN-/undefined-Ausgaben', 'sauber', 'sauber'));

const browser = findBrowser();
let browserOperational = false;
let browserLabel = 'nicht ausgeführt';
let browserNote = '';
let profileResults = [];

if (browser) {
  const probe = run(browser, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--dump-dom',
    'about:blank',
  ], { timeout: 12000 });
  browserOperational = probe.status === 0 && probe.stdout.includes('<html');
  const browserName = path.basename(browser).toLowerCase();
  browserLabel = browserName.includes('edge') ? 'Microsoft Edge' : browserName.includes('chrome') ? 'Google Chrome' : 'Chromium';

  if (browserOperational) {
    const fileUrl = pathToFileURL(htmlPath).href;
    const commonArgs = [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--allow-file-access-from-files',
      '--virtual-time-budget=8000',
      '--window-size=1600,1200',
    ];
    const profiles = [
      { id: 'native', label: browserLabel },
      {
        id: 'edge-compatible',
        label: browserName.includes('edge') ? 'Microsoft Edge (zweiter Lauf)' : 'Edge-kompatibles Chromium-Profil',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
      },
    ];

    profileResults = profiles.map(profile => {
      const args = [...commonArgs];
      if (profile.userAgent) args.push(`--user-agent=${profile.userAgent}`);
      args.push('--dump-dom', fileUrl);
      const domResult = run(browser, args, { timeout: 45000 });
      const dom = domResult.stdout;
      const layoutOk = /data-report-layout=["']ok["']/.test(dom);
      const statusTextOk = dom.includes('Layout geprüft: alle');
      const pageCount = (dom.match(/class="report-page(?:\s|\")/g) || []).length;

      checks.push(check(domResult.status === 0, `${profile.label}: Browserlauf beendet sich ohne Fehler`, domResult.status, 0));
      checks.push(check(layoutOk, `${profile.label}: DOM-Layoutaudit meldet druckbereit`, layoutOk ? 'ok' : 'warning/fehlt', 'ok'));
      checks.push(check(statusTextOk, `${profile.label}: sichtbarer Layoutstatus wurde aktualisiert`, statusTextOk ? 'vorhanden' : 'fehlt', 'vorhanden'));
      checks.push(check(pageCount === pagePlan.totalPages, `${profile.label}: DOM enthält alle geplanten Berichtseiten`, pageCount, pagePlan.totalPages));

      return {
        id: profile.id,
        label: profile.label,
        exitCode: domResult.status,
        pageCount,
        layoutOk,
        statusTextOk,
        timedOut: domResult.timedOut,
        stderr: domResult.stderr.slice(-2000),
      };
    });

    const pdfResult = run(browser, [
      ...commonArgs,
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`,
      fileUrl,
    ], { timeout: 60000 });
    checks.push(check(pdfResult.status === 0, 'Browser-PDF wird ohne Prozessfehler erzeugt', pdfResult.status, 0));
    browserNote = browserName.includes('edge')
      ? 'Automatischer Lauf mit installiertem Microsoft Edge.'
      : 'Automatischer Lauf mit installiertem Chromium/Chrome; ein zweiter Lauf verwendet ein Edge-kompatibles Benutzeragentenprofil.';
  } else {
    browserNote = `Browserdatei gefunden (${browserLabel}), konnte in dieser Laufzeitumgebung aber nicht headless gestartet werden.`;
  }
} else {
  browserNote = 'Kein Chrome-, Chromium- oder Edge-Browser gefunden.';
}

let pdfEngine = browserOperational && fs.existsSync(pdfPath) ? browserLabel : '';
if (!fs.existsSync(pdfPath)) {
  const weasyPrint = findWeasyPrint();
  if (weasyPrint) {
    const weasyResult = run(weasyPrint, [htmlPath, pdfPath], { timeout: 90000 });
    checks.push(check(weasyResult.status === 0, 'Druck-PDF wird mit dem verfügbaren A4-Renderer erzeugt', weasyResult.status, 0));
    pdfEngine = 'WeasyPrint-A4-Fallback';
  } else {
    checks.push(check(false, 'Druck-PDF kann erzeugt werden', 'kein Renderer', 'Browser oder WeasyPrint'));
  }
}

const pdfExists = fs.existsSync(pdfPath);
const pdfSize = pdfExists ? fs.statSync(pdfPath).size : 0;
const pdfPages = readPdfPages(pdfPath);
checks.push(check(pdfExists, 'PDF-Datei wurde erzeugt', pdfExists ? 'vorhanden' : 'fehlt', 'vorhanden'));
checks.push(check(pdfSize > 50_000, 'PDF besitzt einen plausiblen Dateiumfang', `${Math.round(pdfSize / 1024)} KiB`, '> 49 KiB'));
checks.push(check(pdfPages === pagePlan.totalPages, 'PDF-Seitenzahl entspricht dem Berichtseitenplan', pdfPages, pagePlan.totalPages));

const browserRequired = process.env.BROWSER_REQUIRED === '1';
if (browserRequired) {
  checks.push(check(browserOperational, 'Explizit verlangter Browserlauf wurde ausgeführt', browserOperational ? browserLabel : 'nicht verfügbar', 'verfügbar'));
}

const failed = checks.filter(item => !item.passed);
const report = {
  phase: '57.00',
  browser,
  browserLabel,
  browserOperational,
  browserNote,
  pdfEngine,
  project: project.name,
  system: system.name,
  expectedPages: pagePlan.totalPages,
  pdfPages,
  pdfBytes: pdfSize,
  htmlPath,
  pdfPath,
  profiles: profileResults,
  checks,
  totals: { checks: checks.length, passed: checks.length - failed.length, failed: failed.length },
};
fs.writeFileSync(resultPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`Phase 57 RC-Browser-/PDF-Prüfung: ${report.totals.passed}/${report.totals.checks} Prüfungen bestanden.`);
console.log(`Browserlauf: ${browserOperational ? browserLabel : 'nicht verfügbar'} · PDF-Renderer: ${pdfEngine || '-'}`);
console.log(`Bericht: ${pagePlan.totalPages} geplante Seiten · PDF ${pdfPages ?? '-'} Seiten · ${Math.round(pdfSize / 1024)} KiB`);
console.log(`Ausgabe: ${outputDir}`);
console.log(browserNote);

if (failed.length) {
  failed.forEach(item => console.error(`- ${item.label}: ${item.actual} (Soll ${item.expected})`));
  process.exitCode = 1;
}
