#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_RELEASE, APP_VERSION } from '../src/core/appVersion.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PUBLIC_ROOT_FILES = [
  '.nojekyll',
  '404.html',
  'app.html',
  'bedienungsanleitung.html',
  'beta.html',
  'datenschutz.html',
  'deployment.html',
  'deployment-config.json',
  'DEPLOYMENT_GITHUB_PAGES.md',
  'feedback.html',
  'favicon.ico',
  'impressum.html',
  'index.html',
  'LICENSE',
  'lizenz.html',
  'produkt.html',
  'release.json',
  'robots.txt',
  'site.webmanifest',
  'sitemap.xml',
];

const PUBLIC_DIRECTORIES = ['assets', 'src'];

const CRITICAL_FILES = new Set([
  'index.html',
  'app.html',
  'bedienungsanleitung.html',
  'deployment.html',
  'deployment-config.json',
  'release.json',
  'src/main.js',
  'src/core/appVersion.js',
  'src/core/deploymentConfig.js',
  'src/core/CalculationEngine.js',
  'src/core/FrictionFactorEngine.js',
  'src/project/ProjectCalculationService.js',
  'src/formteile/FormPartRegistry.js',
  'src/storage/StorageEngine.js',
  'src/report/ReportEngine.js',
  'src/ui/components/WorkspaceComponent.js',
  'src/ui/components/RibbonComponent.js',
  'src/ui/core/RibbonActions.js',
  'src/ui/ApplicationShell.css',
  'src/landing/deployment-page.js',
  'src/landing/deployment.css',
  'assets/logo/eo-logo.png',
  'assets/report/duct-network-hero.png',
]);

function normalize(value) {
  return value.split(path.sep).join('/');
}

function walk(directory, base = directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute, base);
    return [normalize(path.relative(base, absolute))];
  });
}

function copy(root, target, relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) throw new Error(`Pflichtdatei fehlt: ${relativePath}`);
  const destination = path.join(target, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function getPublicFiles(root = ROOT) {
  const files = PUBLIC_ROOT_FILES.filter(file => fs.existsSync(path.join(root, file)));
  PUBLIC_DIRECTORIES.forEach(directory => {
    walk(path.join(root, directory), root).forEach(file => files.push(file));
  });
  return [...new Set(files)].sort((a, b) => a.localeCompare(b, 'de'));
}

function writeManifest(target, files) {
  const manifestFiles = files
    .filter(file => file !== 'release-integrity.json')
    .map(relativePath => {
      const absolute = path.join(target, relativePath);
      return {
        path: relativePath,
        bytes: fs.statSync(absolute).size,
        sha256: sha256(absolute),
        critical: CRITICAL_FILES.has(relativePath),
      };
    });

  const manifest = {
    name: 'Druckverlust Pro',
    edition: 'Professional',
    packageType: 'GitHub Pages',
    version: APP_VERSION,
    phase: APP_RELEASE,
    generatedAt: new Date().toISOString(),
    algorithm: 'SHA-256',
    fileCount: manifestFiles.length,
    totalBytes: manifestFiles.reduce((sum, file) => sum + file.bytes, 0),
    criticalFileCount: manifestFiles.filter(file => file.critical).length,
    exclusions: ['Windows-Starter', 'lokale Startanleitung', 'Build-Werkzeuge', 'interne Entwicklungsunterlagen'],
    files: manifestFiles,
  };
  fs.writeFileSync(path.join(target, 'release-integrity.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export function buildGithubPages({ root = ROOT, target } = {}) {
  const destination = target || path.join(root, 'dist', `Druckverlust_Pro_${APP_VERSION.replaceAll('.', '_')}_GitHub_Pages`);
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });

  const sourceFiles = getPublicFiles(root);
  sourceFiles.forEach(file => copy(root, destination, file));
  const manifest = writeManifest(destination, sourceFiles);

  const inventory = [
    `DRUCKVERLUST PRO ${APP_VERSION} – GITHUB PAGES PHASE ${APP_RELEASE}`,
    '='.repeat(64),
    `Erstellt: ${manifest.generatedAt}`,
    `Laufzeitdateien: ${manifest.fileCount}`,
    `Kritische Dateien: ${manifest.criticalFileCount}`,
    'Startseite: index.html',
    'Online-Prüfung: deployment.html',
    'Zielpfad: /Druckverlust/',
    '',
    'Den INHALT dieses Ordners direkt in den Repository-Stamm kopieren.',
  ].join('\n');
  fs.writeFileSync(path.join(destination, 'GITHUB_PAGES_DATEIEN.txt'), `${inventory}\n`, 'utf8');

  return {
    target: destination,
    files: [...sourceFiles, 'release-integrity.json', 'GITHUB_PAGES_DATEIEN.txt'],
    manifest,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const result = buildGithubPages({ target });
  console.log(`GitHub-Pages-Paket erstellt: ${result.target}`);
  console.log(`${result.manifest.fileCount} Laufzeitdateien · ${result.manifest.criticalFileCount} kritisch`);
}
