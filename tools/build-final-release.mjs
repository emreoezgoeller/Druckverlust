#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_RELEASE, APP_VERSION } from '../src/core/appVersion.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const FINAL_RELEASE_FILES = [
  '404.html',
  'Druckverlust_starten.bat',
  'LOKAL_STARTEN.txt',
  'LICENSE',
  'README.md',
  'RELEASE_NOTES.md',
  'RELEASE_VERIFICATION.txt',
  'FINAL_ABNAHME_WINDOWS.md',
  'app.html',
  'beta.html',
  'datenschutz.html',
  'feedback.html',
  'favicon.ico',
  'impressum.html',
  'index.html',
  'lizenz.html',
  'produkt.html',
  'release.json',
  'release-integrity.json',
  'robots.txt',
  'site.webmanifest',
  'sitemap.xml',
];

export const FINAL_RELEASE_DIRECTORIES = [
  'assets',
  'src',
  'tools',
];

export const CRITICAL_RELEASE_FILES = new Set([
  'index.html',
  'app.html',
  'release.json',
  'src/main.js',
  'src/core/appVersion.js',
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
  'assets/logo/eo-logo.png',
  'assets/report/duct-network-hero.png',
]);

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function walkFiles(directory, baseDirectory = directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath, baseDirectory);
    return [normalizePath(path.relative(baseDirectory, fullPath))];
  });
}

export function getFinalReleasePaths(root = ROOT) {
  const files = FINAL_RELEASE_FILES.filter(relativePath => fs.existsSync(path.join(root, relativePath)));
  FINAL_RELEASE_DIRECTORIES.forEach(directory => {
    const absolute = path.join(root, directory);
    walkFiles(absolute, root).forEach(relativePath => files.push(relativePath));
  });
  return [...new Set(files)].sort((a, b) => a.localeCompare(b, 'de'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function createIntegrityManifest(root = ROOT) {
  const paths = getFinalReleasePaths(root)
    .filter(relativePath => relativePath !== 'release-integrity.json');
  const files = paths.map(relativePath => {
    const absolutePath = path.join(root, relativePath);
    return {
      path: normalizePath(relativePath),
      bytes: fs.statSync(absolutePath).size,
      sha256: sha256File(absolutePath),
      critical: CRITICAL_RELEASE_FILES.has(normalizePath(relativePath)),
    };
  });

  return {
    name: 'Druckverlust Pro',
    edition: 'Professional',
    version: APP_VERSION,
    phase: APP_RELEASE,
    generatedAt: new Date().toISOString(),
    algorithm: 'SHA-256',
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    criticalFileCount: files.filter(file => file.critical).length,
    exclusions: ['tests', '.github', 'docs', 'package.json', 'Entwicklungsprotokolle'],
    files,
  };
}

export function writeIntegrityManifest(root = ROOT) {
  const manifest = createIntegrityManifest(root);
  fs.writeFileSync(path.join(root, 'release-integrity.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

function copyFile(root, target, relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(target, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

export function buildFinalRelease({ root = ROOT, target } = {}) {
  if (!target) {
    target = path.join(root, 'dist', `Druckverlust_Pro_${APP_VERSION.replaceAll('.', '_')}_Final`);
  }
  const manifest = writeIntegrityManifest(root);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  const files = getFinalReleasePaths(root);
  files.forEach(relativePath => copyFile(root, target, relativePath));

  const inventory = [
    `DRUCKVERLUST PRO ${APP_VERSION} – FINAL RELEASE PHASE ${APP_RELEASE}`,
    '='.repeat(64),
    `Erstellt: ${manifest.generatedAt}`,
    `Dateien: ${files.length}`,
    `SHA-256-Manifest: release-integrity.json`,
    '',
    'Nicht im sauberen Laufzeitpaket enthalten:',
    '- automatisierte Tests',
    '- interne Entwicklungsdokumentation',
    '- GitHub-Issue-Vorlagen',
    '- temporäre Prüf- und Renderdateien',
    '',
    'Start unter Windows: Druckverlust_starten.bat',
  ].join('\n');
  fs.writeFileSync(path.join(target, 'FINAL_RELEASE_DATEIEN.txt'), `${inventory}\n`, 'utf8');

  return { target, manifest, files: [...files, 'FINAL_RELEASE_DATEIEN.txt'] };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const targetArg = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const result = buildFinalRelease({ target: targetArg });
  console.log(`Final-Release erstellt: ${result.target}`);
  console.log(`${result.files.length} Dateien · ${Math.round(result.manifest.totalBytes / 1024)} KiB · ${result.manifest.criticalFileCount} kritische Dateien`);
}
