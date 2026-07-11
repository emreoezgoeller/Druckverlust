#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultFormParts } from '../src/formteile/FormPartRegistry.js';
import { formatFormPartValidationReport, runFormPartValidation } from '../src/testing/FormPartValidationRunner.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const report = runFormPartValidation();
const fileChecks = [];

for (const definition of defaultFormParts) {
  for (const [kind, relativePath] of [['Bild', definition.image], ['Excel', definition.referenceFile]]) {
    const absolutePath = path.resolve(root, String(relativePath || ''));
    fileChecks.push({
      id: definition.id,
      kind,
      relativePath,
      passed: Boolean(relativePath) && fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile(),
    });
  }
}

const manifestPath = path.resolve(root, 'src/formteile/formteile.manifest.json');
let manifestChecks = [];
let manifestError = null;
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const manifestById = new Map(manifest.map(item => [item.id, item]));
  manifestChecks = defaultFormParts.map(definition => {
    const item = manifestById.get(definition.id);
    return {
      id: definition.id,
      passed: Boolean(item) && item.image === definition.image && item.referenceFile === definition.referenceFile && item.status === 'Excel-Referenztest bestanden',
    };
  });
} catch (error) {
  manifestError = error?.message || String(error);
}

console.log(formatFormPartValidationReport(report));
console.log('\nDatei-/Manifestprüfung:');
fileChecks.forEach(check => console.log(`  ${check.passed ? '✓' : '✗'} ${check.id} · ${check.kind}: ${check.relativePath || '-'}`));
manifestChecks.forEach(check => console.log(`  ${check.passed ? '✓' : '✗'} ${check.id} · Manifest`));
if (manifestError) console.log(`  ✗ Manifest konnte nicht gelesen werden: ${manifestError}`);

const fileFailure = fileChecks.some(check => !check.passed);
const manifestFailure = manifestError || manifestChecks.length !== defaultFormParts.length || manifestChecks.some(check => !check.passed);
if (report.status !== 'ok' || fileFailure || manifestFailure) process.exitCode = 1;
