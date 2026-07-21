// Druckverlust Pro – Formteil-Grössen-/Anschluss-Synchronisation Phase 21.03
// DOM-unabhängiger Test-Runner für automatische Grössenübernahme, Anschluss-Sync und manuelle Overrides.

import WorkspaceComponent from '../ui/components/WorkspaceComponent.js';
import { createDefaultFormPartRegistry } from '../formteile/FormPartRegistry.js?v=51.20&release=53.00';

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function createSections() {
  return [
    { id: 'duct-main', name: 'Kanal Haupt', type: 'duct', q: 1800, l: 5, b: 0.6, h: 0.3 },
    { id: 'duct-other', name: 'Kanal Anschluss', type: 'duct', q: 900, l: 3, b: 0.4, h: 0.2 },
    { id: 'duct-through', name: 'Kanal Durchgang', type: 'duct', q: 1260, l: 3, b: 0.6, h: 0.3 },
    { id: 'duct-branch', name: 'Kanal Krümmeranschluss', type: 'duct', q: 540, l: 2, b: 0.6, h: 0.15 },
    { id: 'duct-end-main', name: 'Endstück Haupt', type: 'duct', q: 1800, l: 2, b: 0.5, h: 0.5 },
    { id: 'duct-end-other', name: 'Endstück Anschluss', type: 'duct', q: 1260, l: 2, b: 0.5, h: 0.5 },
    { id: 'pipe-main', name: 'Rohr Haupt', type: 'pipe', q: 1200, l: 5, d: 0.4 },
    { id: 'pipe-through', name: 'Rohr Durchgang', type: 'pipe', q: 800, l: 3, d: 0.315 },
    { id: 'pipe-branch', name: 'Rohr Abzweig', type: 'pipe', q: 600, l: 2, d: 0.25 },
  ];
}

function createHarness() {
  const sections = createSections();
  const system = { id: 'sync-system', name: 'Sync-Test', sections, formParts: [], specialComponents: [] };
  const workspace = Object.create(WorkspaceComponent.prototype);
  workspace.state = {
    project: { id: 'sync-project', systems: [system] },
    selectedSystem: system,
  };
  workspace.registry = createDefaultFormPartRegistry();
  return { workspace, system, sections, sectionById: Object.fromEntries(sections.map(item => [item.id, item])) };
}

function normalize(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toPrecision(12)) : value;
  return value;
}

function createCheck(label, actual, expected, detail = '') {
  const passed = Object.is(normalize(actual), normalize(expected));
  return {
    label,
    actual,
    expected,
    actualText: String(normalize(actual)),
    expectedText: String(normalize(expected)),
    detail,
    passed,
  };
}

function createTruthyCheck(label, actual, detail = '') {
  return {
    label,
    actual,
    expected: true,
    actualText: actual ? 'true' : 'false',
    expectedText: 'true',
    detail,
    passed: Boolean(actual),
  };
}

function evaluateCase(testCase, harness) {
  const { workspace, system } = harness;
  const startedAt = Date.now();
  const formPart = {
    id: `sync-${testCase.id}`,
    name: testCase.title,
    type: testCase.type,
    sectionId: testCase.sectionId,
  };
  system.formParts.push(formPart);

  try {
    workspace.applyFormPartDefaults(formPart);
    const mainResult = workspace.applySectionDimensionsToFormPart(formPart, { force: true, clearManualOverride: true });

    Object.assign(formPart, testCase.connections || {});
    const connectionResult = Object.keys(testCase.connections || {}).length
      ? workspace.applyConnectionSectionsToFormPart(formPart, { force: true, clearManualOverride: true })
      : { applied: false, status: 'empty', fields: [] };

    const checks = [
      createTruthyCheck('Hauptgrössen wurden übernommen', mainResult.applied, mainResult.message || mainResult.summary || ''),
      ...(testCase.expectMain || []).map(item => createCheck(item.label, formPart[item.field], item.expected, item.field)),
      ...(testCase.expectConnections || []).map(item => createCheck(item.label, formPart[item.field], item.expected, item.field)),
    ];

    if (Object.keys(testCase.connections || {}).length) {
      checks.push(createTruthyCheck('Anschlussgrössen wurden übernommen', connectionResult.applied, connectionResult.summary || ''));
    }

    if (Array.isArray(testCase.expectedConnectionTargets)) {
      const targets = workspace.getFormPartConnectionDefinitions(formPart).map(item => item.target).sort();
      checks.push(createCheck('Verfügbare Anschlussziele', targets.join(','), [...testCase.expectedConnectionTargets].sort().join(',')));
    }

    const failed = checks.filter(item => !item.passed);
    return {
      id: testCase.id,
      partId: testCase.type,
      title: testCase.title,
      passed: failed.length === 0,
      checks,
      checkCount: checks.length,
      passedCheckCount: checks.length - failed.length,
      failedCheckCount: failed.length,
      durationMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    return {
      id: testCase.id,
      partId: testCase.type,
      title: testCase.title,
      passed: false,
      checks: [],
      checkCount: 0,
      passedCheckCount: 0,
      failedCheckCount: 1,
      durationMs: Date.now() - startedAt,
      error: error?.stack || error?.message || String(error),
    };
  }
}

const FORM_PART_SYNC_CASES = Object.freeze([
  {
    id: 'SYNC-001', type: 'kreis_bogen', title: 'Kreisbogengrösse aus Rundrohr', sectionId: 'pipe-main',
    expectMain: [{ label: 'Durchmesser d', field: 'd', expected: 400 }],
    expectedConnectionTargets: [],
  },
  {
    id: 'SYNC-002', type: 'eckiger_bogen', title: 'Eckiger Bogen aus Rechteckkanal', sectionId: 'duct-main',
    expectMain: [
      { label: 'Breite a', field: 'a', expected: 600 },
      { label: 'Höhe b', field: 'b', expected: 300 },
    ],
    expectedConnectionTargets: [],
  },
  {
    id: 'SYNC-003', type: 'kanal_bogen_winkel', title: 'Kanalbogen mit Winkel aus Rechteckkanal', sectionId: 'duct-main',
    expectMain: [
      { label: 'Breite a', field: 'a', expected: 600 },
      { label: 'Höhe b', field: 'b', expected: 300 },
    ],
    expectedConnectionTargets: [],
  },
  {
    id: 'SYNC-004', type: 'uebergang_gross_klein', title: 'Übergang gross → klein mit zweitem Anschluss', sectionId: 'duct-main',
    connections: { transitionOtherSectionId: 'pipe-branch' },
    expectMain: [
      { label: 'Hauptseite A2 Bauform', field: 'A2_bauform', expected: 'Kanal' },
      { label: 'Hauptseite A2 Breite', field: 'A2_breite', expected: 600 },
      { label: 'Hauptseite A2 Höhe', field: 'A2_hoehe', expected: 300 },
    ],
    expectConnections: [
      { label: 'Zweite Seite A1 Bauform', field: 'A1_bauform', expected: 'Rohr' },
      { label: 'Zweite Seite A1 Durchmesser', field: 'A1_d', expected: 250 },
    ],
    expectedConnectionTargets: ['A1'],
  },
  {
    id: 'SYNC-005', type: 'uebergang_klein_gross', title: 'Übergang klein → gross mit zweitem Anschluss', sectionId: 'pipe-main',
    connections: { transitionOtherSectionId: 'duct-other' },
    expectMain: [
      { label: 'Hauptseite A1 Bauform', field: 'A1_bauform', expected: 'Rohr' },
      { label: 'Hauptseite A1 Durchmesser', field: 'A1_d', expected: 400 },
    ],
    expectConnections: [
      { label: 'Zweite Seite A2 Bauform', field: 'A2_bauform', expected: 'Kanal' },
      { label: 'Zweite Seite A2 Breite', field: 'A2_breite', expected: 400 },
      { label: 'Zweite Seite A2 Höhe', field: 'A2_hoehe', expected: 200 },
    ],
    expectedConnectionTargets: ['A2'],
  },
  {
    id: 'SYNC-006', type: 'etage_45', title: 'Etage 45° mit Rundrohr', sectionId: 'pipe-main',
    expectMain: [
      { label: 'Bauform', field: 'bauform', expected: 'Rohr' },
      { label: 'Durchmesser d', field: 'd', expected: 400 },
    ],
    expectedConnectionTargets: [],
  },
  {
    id: 'SYNC-007', type: 'hosenstueck', title: 'Hosenstück Haupt- und Abzweiganschluss', sectionId: 'duct-main',
    connections: { branchSectionId: 'pipe-branch' },
    expectMain: [
      { label: 'Hauptanschluss Bauform', field: 'bauform', expected: 'Kanal' },
      { label: 'Hauptanschluss Breite', field: 'A_breite', expected: 600 },
      { label: 'Hauptanschluss Höhe', field: 'A_hoehe', expected: 300 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Abzweig-Durchmesser', field: 'AA_d', expected: 250 },
      { label: 'Abzweig-Luftmenge WA', field: 'WA', expected: 600 },
    ],
    expectedConnectionTargets: ['AA'],
  },
  {
    id: 'SYNC-008', type: 't_abzweig_durchgang_rund1', title: 'T-Abzweig Durchgang rund 1 ohne ungenutzten Abzweigselector', sectionId: 'pipe-main',
    connections: { throughSectionId: 'pipe-through' },
    expectMain: [
      { label: 'Hauptdurchmesser A', field: 'A_d', expected: 400 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1200 },
    ],
    expectConnections: [
      { label: 'Durchgang AD', field: 'AD_d', expected: 315 },
      { label: 'Durchgang WD', field: 'WD', expected: 800 },
    ],
    expectedConnectionTargets: ['AD'],
  },
  {
    id: 'SYNC-009', type: 't_abzweig_durchgang_rund2', title: 'T-Abzweig Durchgang rund 2 mit Durchgang und Abzweig', sectionId: 'pipe-main',
    connections: { throughSectionId: 'pipe-through', branchSectionId: 'pipe-branch' },
    expectMain: [
      { label: 'Hauptdurchmesser A', field: 'A_d', expected: 400 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1200 },
    ],
    expectConnections: [
      { label: 'Durchgang AD', field: 'AD_d', expected: 315 },
      { label: 'Durchgang WD', field: 'WD', expected: 800 },
      { label: 'Abzweig AA', field: 'AA_d', expected: 250 },
      { label: 'Abzweig WA', field: 'WA', expected: 600 },
    ],
    expectedConnectionTargets: ['AD', 'AA'],
  },
  {
    id: 'SYNC-010', type: 't_abzweig_rund1', title: 'T-Abzweig rund 1 mit Durchgang und Abzweig', sectionId: 'pipe-main',
    connections: { throughSectionId: 'pipe-through', branchSectionId: 'pipe-branch' },
    expectMain: [
      { label: 'Hauptdurchmesser A', field: 'A_d', expected: 400 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1200 },
    ],
    expectConnections: [
      { label: 'Durchgang AD', field: 'AD_d', expected: 315 },
      { label: 'Durchgang WD', field: 'WD', expected: 800 },
      { label: 'Abzweig AA', field: 'AA_d', expected: 250 },
      { label: 'Abzweig WA', field: 'WA', expected: 600 },
    ],
    expectedConnectionTargets: ['AD', 'AA'],
  },
  {
    id: 'SYNC-011', type: 't_abzweig_rund2', title: 'T-Abzweig rund 2 mit Durchgang und Abzweig', sectionId: 'pipe-main',
    connections: { throughSectionId: 'pipe-through', branchSectionId: 'pipe-branch' },
    expectMain: [
      { label: 'Hauptdurchmesser A', field: 'A_d', expected: 400 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1200 },
    ],
    expectConnections: [
      { label: 'Durchgang AD', field: 'AD_d', expected: 315 },
      { label: 'Durchgang WD', field: 'WD', expected: 800 },
      { label: 'Abzweig AA', field: 'AA_d', expected: 250 },
      { label: 'Abzweig WA', field: 'WA', expected: 600 },
    ],
    expectedConnectionTargets: ['AD', 'AA'],
  },
  {
    id: 'SYNC-012', type: 't_stueck_90', title: '90° T-Stück Haupt- und Abzweiganschluss', sectionId: 'duct-main',
    connections: { branchSectionId: 'duct-other' },
    expectMain: [
      { label: 'Hauptbreite A', field: 'A_breite', expected: 600 },
      { label: 'Haupthöhe A', field: 'A_hoehe', expected: 300 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Abzweigbreite AA', field: 'AA_breite', expected: 400 },
      { label: 'Abzweighöhe AA', field: 'AA_hoehe', expected: 200 },
      { label: 'Abzweigluftmenge WA', field: 'WA', expected: 900 },
    ],
    expectedConnectionTargets: ['AA'],
  },
  {
    id: 'SYNC-013', type: 't_stueck_90_2', title: '90° T-Stück Variante 2 Haupt- und Abzweiganschluss', sectionId: 'duct-main',
    connections: { branchSectionId: 'duct-other' },
    expectMain: [
      { label: 'Hauptbreite A', field: 'A_breite', expected: 600 },
      { label: 'Haupthöhe A', field: 'A_hoehe', expected: 300 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Abzweigbreite AA', field: 'AA_breite', expected: 400 },
      { label: 'Abzweighöhe AA', field: 'AA_hoehe', expected: 200 },
      { label: 'Abzweigluftmenge WA', field: 'WA', expected: 900 },
    ],
    expectedConnectionTargets: ['AA'],
  },
  {
    id: 'SYNC-014', type: 'sattelstueck_mit_einstroemkonus', title: 'Sattelstück Haupt- und Abzweiganschluss', sectionId: 'pipe-main',
    connections: { branchSectionId: 'pipe-branch' },
    expectMain: [
      { label: 'Hauptdurchmesser A', field: 'A_d', expected: 400 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1200 },
    ],
    expectConnections: [
      { label: 'Abzweigdurchmesser AA', field: 'AA_d', expected: 250 },
      { label: 'Abzweigluftmenge WA', field: 'WA', expected: 600 },
    ],
    expectedConnectionTargets: ['AA'],
  },
  {
    id: 'SYNC-015', type: 'kruemmerabzweig_1_abzweig', title: 'Krümmerabzweig 1 – Abzweig mit drei Rechteckanschlüssen', sectionId: 'duct-main',
    connections: { throughSectionId: 'duct-through', branchSectionId: 'duct-branch' },
    expectMain: [
      { label: 'Hauptbreite A', field: 'A_breite', expected: 600 },
      { label: 'Haupthöhe A', field: 'A_hoehe', expected: 300 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Durchgangsbreite AD', field: 'AD_breite', expected: 600 },
      { label: 'Durchgangshöhe AD', field: 'AD_hoehe', expected: 300 },
      { label: 'Durchgangsluftmenge WD', field: 'WD', expected: 1260 },
      { label: 'Krümmerbreite AA', field: 'AA_breite', expected: 600 },
      { label: 'Krümmerhöhe AA', field: 'AA_hoehe', expected: 150 },
      { label: 'Krümmerluftmenge WA', field: 'WA', expected: 540 },
    ],
    expectedConnectionTargets: ['AD', 'AA'],
  },
  {
    id: 'SYNC-016', type: 'kruemmerabzweig_1_durchgang', title: 'Krümmerabzweig 1 – Durchgang mit drei Rechteckanschlüssen', sectionId: 'duct-main',
    connections: { throughSectionId: 'duct-through', branchSectionId: 'duct-branch' },
    expectMain: [
      { label: 'Hauptbreite A', field: 'A_breite', expected: 600 },
      { label: 'Haupthöhe A', field: 'A_hoehe', expected: 300 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Durchgangsbreite AD', field: 'AD_breite', expected: 600 },
      { label: 'Durchgangshöhe AD', field: 'AD_hoehe', expected: 300 },
      { label: 'Durchgangsluftmenge WD', field: 'WD', expected: 1260 },
      { label: 'Krümmerbreite AA', field: 'AA_breite', expected: 600 },
      { label: 'Krümmerhöhe AA', field: 'AA_hoehe', expected: 150 },
      { label: 'Krümmerluftmenge WA', field: 'WA', expected: 540 },
    ],
    expectedConnectionTargets: ['AD', 'AA'],
  },
  {
    id: 'SYNC-017', type: 'kruemmerabzweig_2_abzweig', title: 'Krümmerabzweig 2 – Abzweig mit drei Rechteckanschlüssen', sectionId: 'duct-main',
    connections: { throughSectionId: 'duct-through', branchSectionId: 'duct-branch' },
    expectMain: [
      { label: 'Hauptbreite A', field: 'A_breite', expected: 600 },
      { label: 'Haupthöhe A', field: 'A_hoehe', expected: 300 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Durchgangsbreite AD', field: 'AD_breite', expected: 600 },
      { label: 'Durchgangshöhe AD', field: 'AD_hoehe', expected: 300 },
      { label: 'Durchgangsluftmenge WD', field: 'WD', expected: 1260 },
      { label: 'Krümmerbreite AA', field: 'AA_breite', expected: 600 },
      { label: 'Krümmerhöhe AA', field: 'AA_hoehe', expected: 150 },
      { label: 'Krümmerluftmenge WA', field: 'WA', expected: 540 },
    ],
    expectedConnectionTargets: ['AD', 'AA'],
  },
  {
    id: 'SYNC-018', type: 'kruemmerabzweig_2_durchgang', title: 'Krümmerabzweig 2 – Durchgang mit drei Rechteckanschlüssen', sectionId: 'duct-main',
    connections: { throughSectionId: 'duct-through', branchSectionId: 'duct-branch' },
    expectMain: [
      { label: 'Hauptbreite A', field: 'A_breite', expected: 600 },
      { label: 'Haupthöhe A', field: 'A_hoehe', expected: 300 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Durchgangsbreite AD', field: 'AD_breite', expected: 600 },
      { label: 'Durchgangshöhe AD', field: 'AD_hoehe', expected: 300 },
      { label: 'Durchgangsluftmenge WD', field: 'WD', expected: 1260 },
      { label: 'Krümmerbreite AA', field: 'AA_breite', expected: 600 },
      { label: 'Krümmerhöhe AA', field: 'AA_hoehe', expected: 150 },
      { label: 'Krümmerluftmenge WA', field: 'WA', expected: 540 },
    ],
    expectedConnectionTargets: ['AD', 'AA'],
  },
  {
    id: 'SYNC-019', type: 'kruemmerendstueck_1', title: 'Krümmerendstück 1 mit Haupt- und Ausgangsanschluss', sectionId: 'duct-end-main',
    connections: { branchSectionId: 'duct-end-other' },
    expectMain: [
      { label: 'Hauptbreite A', field: 'A_breite', expected: 500 },
      { label: 'Haupthöhe A', field: 'A_hoehe', expected: 500 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Ausgangsbreite AA', field: 'AA_breite', expected: 500 },
      { label: 'Ausgangshöhe AA', field: 'AA_hoehe', expected: 500 },
      { label: 'Ausgangsluftmenge WA', field: 'WA', expected: 1260 },
    ],
    expectedConnectionTargets: ['AA'],
  },
  {
    id: 'SYNC-020', type: 'kruemmerendstueck_2', title: 'Krümmerendstück 2 mit Haupt- und Zulaufanschluss', sectionId: 'duct-end-main',
    connections: { branchSectionId: 'duct-end-other' },
    expectMain: [
      { label: 'Hauptbreite A', field: 'A_breite', expected: 500 },
      { label: 'Haupthöhe A', field: 'A_hoehe', expected: 500 },
      { label: 'Hauptluftmenge W', field: 'W', expected: 1800 },
    ],
    expectConnections: [
      { label: 'Zulaufbreite AA', field: 'AA_breite', expected: 500 },
      { label: 'Zulaufhöhe AA', field: 'AA_hoehe', expected: 500 },
      { label: 'Zulaufluftmenge WA', field: 'WA', expected: 1260 },
    ],
    expectedConnectionTargets: ['AA'],
  },
]);

function runBehaviourChecks() {
  const harness = createHarness();
  const { workspace, system, sectionById } = harness;
  const checks = [];

  const circle = { id: 'manual-circle', name: 'Manuell', type: 'kreis_bogen', sectionId: 'pipe-main' };
  system.formParts.push(circle);
  workspace.applyFormPartDefaults(circle);
  workspace.applySectionDimensionsToFormPart(circle, { force: true });
  circle.autoSizeManualOverride = true;
  sectionById['pipe-main'].d = 0.5;
  const manualResult = workspace.applySectionDimensionsToFormPart(circle);
  checks.push(createCheck('Manuelles Override pausiert Auto-Sync', manualResult.status, 'manual'));
  checks.push(createCheck('Manuell geschützter Wert bleibt erhalten', circle.d, 400));
  const forcedResult = workspace.applySectionDimensionsToFormPart(circle, { force: true, clearManualOverride: true });
  checks.push(createTruthyCheck('Erzwungene Übernahme funktioniert', forcedResult.applied));
  checks.push(createCheck('Erzwungene Übernahme aktualisiert d', circle.d, 500));
  checks.push(createCheck('Erzwungene Übernahme entfernt Override', Boolean(circle.autoSizeManualOverride), false));

  const hosen = { id: 'connected-hosen', name: 'Hosen', type: 'hosenstueck', sectionId: 'pipe-main', branchSectionId: 'pipe-branch' };
  system.formParts.push(hosen);
  workspace.applyFormPartDefaults(hosen);
  workspace.applySectionDimensionsToFormPart(hosen, { force: true });
  workspace.applyConnectionSectionsToFormPart(hosen, { force: true });
  sectionById['pipe-branch'].d = 0.28;
  sectionById['pipe-branch'].q = 700;
  const branchSync = workspace.syncAssignedFormPartsForSection(sectionById['pipe-branch']);
  checks.push(createCheck('Änderung einer Anschluss-Teilstrecke wird erkannt', branchSync.connectionApplied, 1));
  checks.push(createCheck('Anschluss-Sync aktualisiert AA_d', hosen.AA_d, 280));
  checks.push(createCheck('Anschluss-Sync aktualisiert WA', hosen.WA, 700));

  const tPart = {
    id: 'main-connection-preserve', name: 'T-Abzweig', type: 't_abzweig_durchgang_rund2',
    sectionId: 'pipe-main', throughSectionId: 'pipe-through', branchSectionId: 'pipe-branch',
  };
  system.formParts.push(tPart);
  workspace.applyFormPartDefaults(tPart);
  workspace.applySectionDimensionsToFormPart(tPart, { force: true });
  workspace.applyConnectionSectionsToFormPart(tPart, { force: true });
  sectionById['pipe-main'].d = 0.45;
  sectionById['pipe-main'].q = 1300;
  workspace.syncAssignedFormPartsForSection(sectionById['pipe-main']);
  checks.push(createCheck('Haupt-Sync aktualisiert A_d', tPart.A_d, 450));
  checks.push(createCheck('Haupt-Sync aktualisiert W', tPart.W, 1300));
  checks.push(createCheck('Haupt-Sync erhält separaten Durchgang AD', tPart.AD_d, 315));
  checks.push(createCheck('Haupt-Sync erhält separaten Durchgang WD', tPart.WD, 800));
  checks.push(createCheck('Haupt-Sync erhält separaten Abzweig AA', tPart.AA_d, 280));
  checks.push(createCheck('Haupt-Sync erhält separaten Abzweig WA', tPart.WA, 700));

  return {
    id: 'SYNC-BEHAVIOUR',
    partId: 'System',
    title: 'Manuelle Overrides und automatische Nachführung',
    passed: checks.every(item => item.passed),
    checks,
    checkCount: checks.length,
    passedCheckCount: checks.filter(item => item.passed).length,
    failedCheckCount: checks.filter(item => !item.passed).length,
    durationMs: 0,
    error: null,
  };
}

export function runFormPartSyncValidation() {
  const startedAt = new Date();
  const harness = createHarness();
  const caseResults = FORM_PART_SYNC_CASES.map(testCase => evaluateCase(clone(testCase), harness));
  const behaviourResult = runBehaviourChecks();
  const results = [...caseResults, behaviourResult];
  const checks = results.flatMap(item => item.checks || []);
  const failedCases = results.filter(item => !item.passed);
  const failedChecks = checks.filter(item => !item.passed);
  const covered = new Set(caseResults.map(item => item.partId));
  const definitions = harness.workspace.registry.getAll();
  const registryIds = definitions.map(item => item.id);
  const syncExempt = new Set(
    definitions
      .filter(item => item.editorMode === 'zeta-only' || item.syncMode === 'none')
      .map(item => item.id),
  );
  const uncovered = registryIds.filter(id => !covered.has(id) && !syncExempt.has(id));
  const coveredOrExempt = registryIds.filter(id => covered.has(id) || syncExempt.has(id));
  const status = failedCases.length || failedChecks.length || uncovered.length ? 'error' : 'ok';

  return {
    status,
    label: status === 'ok' ? 'Formteil-Synchronisation bestanden' : 'Formteil-Synchronisation mit Fehlern',
    summary: status === 'ok'
      ? `${registryIds.length} Formteile sowie manuelle Overrides und Anschluss-Nachführung wurden erfolgreich geprüft.`
      : `${failedCases.length} Testfälle, ${failedChecks.length} Einzelprüfungen oder ${uncovered.length} nicht abgedeckte Formteile benötigen Aufmerksamkeit.`,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    counts: {
      formParts: registryIds.length,
      coveredFormParts: coveredOrExempt.length,
      cases: results.length,
      passedCases: results.length - failedCases.length,
      failedCases: failedCases.length,
      checks: checks.length,
      passedChecks: checks.length - failedChecks.length,
      failedChecks: failedChecks.length,
      syncExemptFormParts: syncExempt.size,
    },
    syncExempt: [...syncExempt],
    uncovered,
    results,
  };
}

export function formatFormPartSyncReport(report = {}) {
  const lines = [
    'Druckverlust Pro – Formteil-Sync-QS Phase 21.03',
    report.label || '-',
    report.summary || '',
    '',
    `Formteile: ${report.counts?.coveredFormParts ?? 0}/${report.counts?.formParts ?? 0} abgedeckt`,
    `Testfälle: ${report.counts?.passedCases ?? 0}/${report.counts?.cases ?? 0} bestanden`,
    `Einzelprüfungen: ${report.counts?.passedChecks ?? 0}/${report.counts?.checks ?? 0} bestanden`,
    '',
  ];

  (report.results || []).forEach(result => {
    lines.push(`${result.passed ? 'OK' : 'FEHLER'} ${result.id} – ${result.title}`);
    if (result.error) lines.push(`  Fehler: ${result.error}`);
    (result.checks || []).forEach(check => {
      lines.push(`  ${check.passed ? '✓' : '✗'} ${check.label}: Ist ${check.actualText} / Soll ${check.expectedText}${check.detail ? ` · ${check.detail}` : ''}`);
    });
    lines.push('');
  });

  if (report.uncovered?.length) {
    lines.push(`Nicht abgedeckt: ${report.uncovered.join(', ')}`);
  }

  return lines.join('\n').trim();
}

export { FORM_PART_SYNC_CASES };
export default runFormPartSyncValidation;
