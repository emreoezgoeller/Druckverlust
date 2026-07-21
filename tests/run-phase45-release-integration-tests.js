import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0;
const failures = [];

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function walk(dir = root) {
  const output = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '.git') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}

function cleanLocalRef(value = '') {
  const ref = String(value).trim();
  if (!ref || ref.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(ref)) return null;
  return ref.split(/[?#]/, 1)[0];
}

function verifyLocalReference(sourceFile, reference, label) {
  const clean = cleanLocalRef(reference);
  if (!clean) return;
  const target = normalize(join(dirname(sourceFile), clean));
  const inside = relative(root, target);
  check(!inside.startsWith(`..${sep}`) && inside !== '..', `${label}: Pfad verlässt das Projekt (${reference}).`);
  check(existsSync(target), `${label}: Datei fehlt (${relative(root, sourceFile)} → ${reference}).`);
}

const packageJson = JSON.parse(read('package.json'));
const release = JSON.parse(read('release.json'));
const appVersion = read('src/core/appVersion.js');
const appHtml = read('app.html');
const indexHtml = read('index.html');
const feedbackHtml = read('feedback.html');
const qualityHtml = read('beta.html');
const manifest = JSON.parse(read('site.webmanifest'));
const readme = read('README.md');
const roadmap = read('ROADMAP.md');
const changelog = read('CHANGELOG.md');

check(packageJson.version === '2.8.0', 'package.json verwendet nicht Version 2.8.0.');
check(release.version === '2.8.0' && release.phase === '53.00', 'release.json ist nicht auf 2.8.0 / 53.00.');
check(appVersion.includes("APP_VERSION = '2.8.0'"), 'appVersion.js enthält nicht Version 2.8.0.');
check(appVersion.includes("APP_RELEASE = '53.00'"), 'appVersion.js enthält nicht Phase 53.00.');
check(appVersion.includes("APP_ASSET_VERSION = '53.00'"), 'Asset-Version ist nicht 53.00.');
check(indexHtml.includes('Release 2.8.0 · Phase 53.00'), 'Produktseite zeigt nicht den aktuellen Release.');
check(indexHtml.includes('product.css?v=53.00') && indexHtml.includes('product.js?v=53.00'), 'Produktseite lädt nicht die stabilen Release-Assets.');
check(appHtml.includes('src/main.js?v=53.00&release=53.00'), 'App lädt main.js nicht mit Release-Kennung 53.00.');
check((appHtml.match(/release=53\.00/g) || []).length >= 36, 'App-Stylesheets besitzen nicht durchgängig die finale Cache-Kennung.');
check(feedbackHtml.includes('feedback.css?v=53.00') && feedbackHtml.includes('feedback-page.js?v=53.00'), 'Feedbackseite verwendet nicht die stabilen Assets.');
check(qualityHtml.includes('Version 2.8.0') && !qualityHtml.includes('Phase 21.12'), 'Qualitätsseite ist veraltet.');
check(manifest.shortcuts.some(item => item.short_name === 'Qualität'), 'Webmanifest enthält keinen Qualitätszugang.');
check(readme.includes('Version 2.8.0') && readme.includes('npm run test:release'), 'README ist nicht auf dem aktuellen Release-Stand.');
check(roadmap.includes('Version 2.8.0 · Phase 53.00'), 'Roadmap beschreibt den aktuellen Entwicklungsstand nicht.');
check(changelog.includes('## 2.8.0 – Phase 53.00'), 'Changelog enthält keinen Release-2.8.0-Eintrag.');
check(existsSync(join(root, 'Druckverlust_starten.bat')) && existsSync(join(root, 'tools/start-local-server.ps1')), 'Windows-Lokalstarter ist unvollständig.');
check(existsSync(join(root, 'docs/MIGRATION.md')) && existsSync(join(root, 'docs/RELEASE_CHECKLIST.md')), 'Release-Dokumentation ist unvollständig.');
check(existsSync(join(root, 'src/sections/SectionSizingAssistant.js')), 'Dimensionierungsassistent fehlt.');
check(existsSync(join(root, 'src/ui/phase49_00.css')), 'Phase-49-Stylesheet fehlt.');
check(existsSync(join(root, 'tests/run-phase49-section-entry-tests.js')), 'Phase-49-Testpaket fehlt.');
check(release.quality?.sectionEntryChecks === 54, 'Release-Manifest dokumentiert die 54 Phase-49-Prüfungen nicht.');
check(existsSync(join(root, 'src/formteile/FormPartWorkflowEngine.js')), 'FormPartWorkflowEngine fehlt.');
check(existsSync(join(root, 'src/ui/phase50_00.css')), 'Phase-50-Stylesheet fehlt.');
check(existsSync(join(root, 'src/ui/phase51_00.css')), 'Phase-51-Stylesheet fehlt.');
check(existsSync(join(root, 'src/ui/core/UiTooltipController.js')), 'UiTooltipController fehlt.');
check(existsSync(join(root, 'tests/run-phase51-interface-completion-tests.js')), 'Phase-51-Testpaket fehlt.');
check(release.quality?.interfaceCompletionChecks === 48, 'Release-Manifest dokumentiert die 48 Phase-51-Prüfungen nicht.');
check(existsSync(join(root, 'tests/run-phase51-10-six-formparts-tests.js')), 'Phase-51.10-Testpaket fehlt.');
check(release.quality?.sixNewFormPartChecks === 65, 'Release-Manifest dokumentiert die 65 Phase-51.10-Prüfungen nicht.');
check(existsSync(join(root, 'src/standards/SiaVelocityCompliance.js')), 'SIA-Geschwindigkeitsmodul fehlt.');
check(existsSync(join(root, 'src/ui/phase51_20.css')), 'Phase-51.20-Stylesheet fehlt.');
check(existsSync(join(root, 'tests/run-phase51-20-sia-velocity-tests.js')), 'Phase-51.20-Testpaket fehlt.');
check(release.quality?.siaVelocityChecks === 252, 'Release-Manifest dokumentiert die 252 Phase-51.20-Prüfungen nicht.');
check(existsSync(join(root, 'src/results/ResultPresentationEngine.js')), 'Phase-52-Ergebnisengine fehlt.');
check(existsSync(join(root, 'src/ui/phase52_00.css')), 'Phase-52-Stylesheet fehlt.');
check(existsSync(join(root, 'tests/run-phase52-result-presentation-tests.js')), 'Phase-52-Testpaket fehlt.');
check(release.quality?.resultPresentationChecks === 83, 'Release-Manifest dokumentiert die 83 Phase-52-Prüfungen nicht.');
check(existsSync(join(root, 'tests/run-phase53-report-completion-tests.js')), 'Phase-53-Testpaket fehlt.');
check(release.quality?.reportCompletionChecks === 74, 'Release-Manifest dokumentiert die 74 Phase-53-Prüfungen nicht.');
check(read('src/report/ReportEngine.js').includes('window.__druckverlustLayoutAudit'), 'Automatische Bericht-Layoutprüfung fehlt.');
check(release.quality?.formPartTypes === 21 && release.quality?.excelReferenceChecks === 81, 'Release-Manifest enthält nicht die erweiterte Formteil-QS.');
check(existsSync(join(root, 'tests/run-phase50-formpart-workflow-tests.js')), 'Phase-50-Testpaket fehlt.');
check(release.quality?.formPartWorkflowChecks === 37, 'Release-Manifest dokumentiert die 37 Phase-50-Prüfungen nicht.');
check(!existsSync(join(root, 'src/landing/landing-phase40.css')) && !existsSync(join(root, 'src/landing/beta-feedback-page.js')), 'Veraltete Landing-Assetnamen wurden nicht bereinigt.');

const obsoleteWrappers = [
  'phase21-beta-feedback-inbox.html','phase21-beta-feedback.html','phase21-beta-release.html','phase21-comparison-matrix.html',
  'phase21-expert-test-protocol.html','phase21-feedback-round.html','phase21-formpart-sync.html','phase21-formpart-validation.html',
  'phase21-practice-project.html','phase21-reference-tests.html','phase21-release-decision.html',
];
for (const file of obsoleteWrappers) check(!existsSync(join(root, 'tests', file)), `Obsoleter Browserwrapper noch vorhanden: ${file}.`);

const allFiles = walk();
for (const full of allFiles.filter(file => file.endsWith('.html'))) {
  const text = readFileSync(full, 'utf8');
  for (const match of text.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    verifyLocalReference(full, match[1], 'HTML-Verweis');
  }
}
for (const full of allFiles.filter(file => file.endsWith('.js'))) {
  const text = readFileSync(full, 'utf8');
  const regex = /(?:import\s+(?:[^'";]+?\s+from\s+)?|export\s+[^'";]*?from\s+|import\s*\()\s*["']([^"']+)["']/g;
  for (const match of text.matchAll(regex)) {
    if (match[1].startsWith('.')) verifyLocalReference(full, match[1], 'JavaScript-Import');
  }
}
for (const full of allFiles.filter(file => file.endsWith('.css'))) {
  const text = readFileSync(full, 'utf8');
  for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    verifyLocalReference(full, match[1], 'CSS-Asset');
  }
}

const duplicateGroups = new Map();
for (const full of allFiles) {
  const hash = createHash('sha256').update(readFileSync(full)).digest('hex');
  const group = duplicateGroups.get(hash) || [];
  group.push(relative(root, full));
  duplicateGroups.set(hash, group);
}
for (const group of duplicateGroups.values()) {
  check(group.length === 1, `Doppelte Dateiinhalte gefunden: ${group.join(', ')}.`);
}

const publicPages = ['index.html','beta.html','feedback.html','404.html','impressum.html','datenschutz.html','lizenz.html'];
for (const page of publicPages) {
  const text = read(page);
  check(!text.includes('Phase 21.12'), `${page} enthält noch Phase 21.12.`);
  check(!text.includes('file:///'), `${page} enthält einen lokalen file:///-Pfad.`);
}
check(!indexHtml.includes('>Beta<'), 'Hauptseite verwendet noch die alte Beta-Bezeichnung.');
check(!read('src/diagnostics/DeploymentDiagnostics.js').includes('phase21-formpart-sync.html'), 'Deployment-QS verlangt noch entfernte Browserwrapper.');
check(release.excludedModules.includes('Ventilatorauslegung') && release.excludedModules.includes('Hersteller-Bauteildatenbank'), 'Bewusst ausgeschlossene Module sind im Release-Manifest nicht dokumentiert.');

if (failures.length) {
  console.error(`Phase 53.00 Release-Integration fehlgeschlagen: ${failures.length} von ${checks} Prüfungen.`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log(`Phase 53.00 Release-Integration: ${checks} Prüfungen bestanden.`);
