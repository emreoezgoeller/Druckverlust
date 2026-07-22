#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_RELEASE, APP_VERSION } from '../src/core/appVersion.js';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;

const errors = [];
const warnings = [];
let checks = 0;

function check(condition, message, warning = false) {
  checks += 1;
  if (condition) return;
  (warning ? warnings : errors).push(message);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const required = [
  '.nojekyll',
  'index.html',
  'app.html',
  'bedienungsanleitung.html',
  'deployment.html',
  'deployment-config.json',
  'release.json',
  'release-integrity.json',
  'site.webmanifest',
  'src/main.js',
  'src/core/appVersion.js',
  'src/core/deploymentConfig.js',
  'src/landing/deployment-page.js',
  'src/landing/deployment.css',
  'assets/logo/eo-logo.png',
];
required.forEach(file => check(exists(file), `Pflichtdatei fehlt: ${file}`));

const release = JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8'));
check(release.version === APP_VERSION, `release.json Version ${release.version} statt ${APP_VERSION}`);
check(release.phase === APP_RELEASE, `release.json Phase ${release.phase} statt ${APP_RELEASE}`);

const config = JSON.parse(fs.readFileSync(path.join(root, 'deployment-config.json'), 'utf8'));
check(config.version === APP_VERSION, `deployment-config.json Version ${config.version} statt ${APP_VERSION}`);
check(config.phase === APP_RELEASE, `deployment-config.json Phase ${config.phase} statt ${APP_RELEASE}`);
check(config.repositoryPath === '/Druckverlust/', 'Repository-Pfad muss /Druckverlust/ sein.');
check(config.canonicalBaseUrl === 'https://emreoezgoeller.github.io/Druckverlust/', 'Canonical Base URL ist nicht korrekt.');

const textExtensions = new Set(['.html', '.js', '.mjs', '.css', '.json', '.xml', '.webmanifest']);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return [absolute];
  });
}

const allFiles = walk(root);
for (const absolute of allFiles) {
  if (!textExtensions.has(path.extname(absolute).toLowerCase()) && path.basename(absolute) !== 'site.webmanifest') continue;
  let text;
  try { text = fs.readFileSync(absolute, 'utf8'); } catch { continue; }
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  const stale = [...text.matchAll(/\?v=([0-9]+(?:\.[0-9]+)*)/g)].map(match => match[1]).filter(version => version !== APP_RELEASE);
  check(stale.length === 0, `${relative}: alte Cachekennung(en) ${[...new Set(stale)].join(', ')}`);
}

const htmlFiles = allFiles.filter(file => file.endsWith('.html'));
const linkPattern = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
for (const htmlPath of htmlFiles) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const pageDir = path.dirname(htmlPath);
  for (const match of html.matchAll(linkPattern)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
    if (raw.includes('${')) continue;
    const clean = raw.split('#')[0].split('?')[0];
    if (!clean || clean === './') continue;
    const target = clean.startsWith('/')
      ? path.join(root, clean.replace(/^\/Druckverlust\//, '').replace(/^\//, ''))
      : path.resolve(pageDir, clean);
    check(fs.existsSync(target), `${path.relative(root, htmlPath)} verweist auf fehlende Datei: ${raw}`);
  }
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  check(duplicates.length === 0, `${path.relative(root, htmlPath)} enthält doppelte IDs: ${[...new Set(duplicates)].join(', ')}`);
}

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
check(indexHtml.includes('https://emreoezgoeller.github.io/Druckverlust/'), 'Canonical URL auf index.html fehlt.');
check(indexHtml.includes(`Release ${APP_VERSION} · Phase ${APP_RELEASE}`), 'Startseite zeigt nicht den aktuellen Release.');

const appHtml = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
check(appHtml.includes(`src/main.js?v=${APP_RELEASE}`), 'app.html lädt main.js nicht mit aktueller Cachekennung.');

const notFound = fs.readFileSync(path.join(root, '404.html'), 'utf8');
check(notFound.includes("'/Druckverlust/'"), '404.html besitzt keine GitHub-Pages-Basis /Druckverlust/.');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release-integrity.json'), 'utf8'));
check(manifest.version === APP_VERSION, 'Integritätsmanifest hat eine abweichende Version.');
check(manifest.phase === APP_RELEASE, 'Integritätsmanifest hat eine abweichende Phase.');
check(Array.isArray(manifest.files) && manifest.files.length > 0, 'Integritätsmanifest enthält keine Dateien.');

const forbidden = ['tests', 'docs', '.github', 'node_modules'];
forbidden.forEach(directory => check(!exists(directory), `Nicht für das Webpaket vorgesehener Ordner vorhanden: ${directory}`, true));

console.log(`Deployment-Prüfung: ${checks} Prüfpunkte`);
console.log(`Fehler: ${errors.length} · Hinweise: ${warnings.length}`);
errors.forEach(message => console.error(`FEHLER: ${message}`));
warnings.forEach(message => console.warn(`HINWEIS: ${message}`));
if (errors.length) process.exitCode = 1;
