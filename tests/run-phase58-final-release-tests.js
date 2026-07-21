#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_ASSET_VERSION, APP_RELEASE, APP_VERSION } from '../src/core/appVersion.js';
import ReleaseCandidateDiagnostics, { FINAL_BROWSER_ACCEPTANCE_KEY } from '../src/diagnostics/ReleaseCandidateDiagnostics.js';
import { createSmallOfficePracticeProject } from '../src/project/officePracticeProjects.js';
import ProjectCalculationService from '../src/project/ProjectCalculationService.js';
import { buildFinalRelease, writeIntegrityManifest } from '../tools/build-final-release.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let checks=0;
const pass=(v,l)=>{assert.ok(v,l);checks++};
const equal=(a,b,l)=>{assert.equal(a,b,l);checks++};
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');

const pkg=JSON.parse(read('package.json'));
const release=JSON.parse(read('release.json'));
equal(APP_VERSION,'3.0.0','Finalversion');
equal(APP_RELEASE,'58.00','Finalphase');
equal(APP_ASSET_VERSION,'58.00','Cachephase');
equal(pkg.version,APP_VERSION,'package version');
equal(release.version,APP_VERSION,'release version');
equal(release.phase,APP_RELEASE,'release phase');
pass(pkg.scripts.test.startsWith('node tests/run-phase58-final-release-tests.js'),'Gesamttest startet Phase 58');
pass(pkg.scripts['build:final'].includes('build-final-release.mjs'),'Finalbuilder erreichbar');

const app=read('app.html');
const assets=[...app.matchAll(/(?:href|src)="(src\/[^"]+)"/g)].map(m=>m[1]);
pass(assets.length>=40,'vollständiger Assetsatz');
pass(assets.every(a=>/\?v=58\.00$/.test(a)),'App assets Cache 58');
const sourceFiles=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);e.isDirectory()?walk(f):e.name.endsWith('.js')&&sourceFiles.push(f)}}
walk(path.join(ROOT,'src'));
const stale=[];
for(const f of sourceFiles){for(const m of fs.readFileSync(f,'utf8').matchAll(/(?:from\s+|import\s+)["']([^"']+\.js\?v=([^"']+))["']/g)){if(m[2]!=='58.00')stale.push(`${f}:${m[2]}`)}}
equal(stale.length,0,'keine alten Cacheimporte');

const ribbon=read('src/ui/components/RibbonComponent.js');
const workspace=read('src/ui/components/WorkspaceComponent.js');
pass(ribbon.includes("label: 'Finalprüfung'"),'Finalprüfung im Ribbon');
pass(workspace.includes('Manuelle Windows-Druckabnahme'),'Browserabnahme sichtbar');
pass(workspace.includes('confirm-browser'),'Browserbestätigung angebunden');
pass(read('src/diagnostics/ReleaseIntegrityDiagnostics.js').includes('SHA-256'),'Integritätsdiagnose vorhanden');

const memory=new Map();
const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
let acceptance=ReleaseCandidateDiagnostics.confirmCurrentBrowser({storageRef:storage,userAgent:'Mozilla/5.0 Chrome/142.0.0.0 Safari/537.36',acceptedAt:'2026-07-21T20:00:00.000Z'});
pass(!!acceptance.chrome?.acceptedAt,'Chrome bestätigt');
acceptance=ReleaseCandidateDiagnostics.confirmCurrentBrowser({storageRef:storage,userAgent:'Mozilla/5.0 Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',acceptedAt:'2026-07-21T20:05:00.000Z'});
pass(!!acceptance.edge?.acceptedAt,'Edge bestätigt');
pass(memory.has(FINAL_BROWSER_ACCEPTANCE_KEY),'Abnahme gespeichert');
ReleaseCandidateDiagnostics.clearBrowserAcceptance(storage);
pass(!memory.has(FINAL_BROWSER_ACCEPTANCE_KEY),'Abnahme rücksetzbar');

const project=createSmallOfficePracticeProject();
const system=project.systems[0];
project.calculationResult=ProjectCalculationService.calculate(project,system.id);
const result=await ReleaseCandidateDiagnostics.run({project,system,registry:ProjectCalculationService.getFormPartRegistry(),includeDeployment:false,includeIntegrity:false,browserAcceptance:{chrome:{acceptedAt:'2026-07-21T20:00:00Z'},edge:{acceptedAt:'2026-07-21T20:05:00Z'}}});
pass(result.status!=='error','Finaldiagnose nicht blockiert');
pass(result.items.some(i=>i.label==='Windows-Browserdruck'&&i.status==='ok'),'Browsergate bestanden bei bestätigten Läufen');
pass(ReleaseCandidateDiagnostics.toText(result).includes('Finalprüfung Phase 58.00'),'Finalprotokoll korrekt');

const manifest=writeIntegrityManifest(ROOT);
equal(manifest.version,APP_VERSION,'Manifest Version');
equal(manifest.phase,APP_RELEASE,'Manifest Phase');
pass(manifest.fileCount>100,'Manifest umfasst Laufzeitdateien');
pass(manifest.criticalFileCount>=15,'kritische Dateien markiert');
for(const entry of manifest.files){equal(hash(entry.path),entry.sha256,`Hash ${entry.path}`);equal(fs.statSync(path.join(ROOT,entry.path)).size,entry.bytes,`Grösse ${entry.path}`)}

const target=fs.mkdtempSync(path.join(os.tmpdir(),'dp-final-'));
const built=buildFinalRelease({root:ROOT,target:path.join(target,'Druckverlust_Pro_3_0_0_Final')});
pass(fs.existsSync(path.join(built.target,'app.html')),'Finalpaket enthält App');
pass(fs.existsSync(path.join(built.target,'release-integrity.json')),'Finalpaket enthält Manifest');
pass(fs.existsSync(path.join(built.target,'FINAL_RELEASE_DATEIEN.txt')),'Finalpaket enthält Inventar');
pass(!fs.existsSync(path.join(built.target,'tests')),'Finalpaket ohne Tests');
pass(!fs.existsSync(path.join(built.target,'docs')),'Finalpaket ohne interne Doku');
pass(!fs.existsSync(path.join(built.target,'.github')),'Finalpaket ohne GitHub-Vorlagen');
pass(!fs.existsSync(path.join(built.target,'package.json')),'Finalpaket ohne Entwicklungs-Paketdatei');

pass(read('RELEASE_NOTES.md').includes('Version 3.0.0 · Phase 58.00'),'Release Notes final');
pass(read('ROADMAP.md').includes('Phase 58.00 – Druckverlust Pro 3.0 Final – abgeschlossen'),'Roadmap final');
pass(read('CHANGELOG.md').includes('3.0.0 – Phase 58.00'),'Changelog final');
pass(read('FINAL_ABNAHME_WINDOWS.md').includes('Google Chrome'),'Windows-Abnahme dokumentiert');
console.log(`Phase 58 Final-Release-QS: ${checks}/${checks} Prüfungen bestanden.`);
