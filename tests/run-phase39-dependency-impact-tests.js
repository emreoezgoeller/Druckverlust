import assert from 'node:assert/strict';
import createDemoProject from '../src/project/demoProject.js';
import ProjectDependencyEngine from '../src/project/ProjectDependencyEngine.js?v=39.00';

let checks = 0;
const project = createDemoProject();
project.name = 'Phase 39 Strukturprojekt';
const system = project.systems[0];
const section = system.sections[0];
const formPart = system.formParts[0];
const special = system.specialComponents[0];

const graph = ProjectDependencyEngine.buildGraph(project);
assert.ok(graph.nodes.length >= 1 + project.systems.length + system.sections.length + system.formParts.length + system.specialComponents.length); checks += 1;
assert.ok(graph.edges.some(edge => edge.relation === 'contains')); checks += 1;
assert.ok(graph.edges.some(edge => edge.relation === 'sequence')); checks += 1;
assert.ok(graph.edges.some(edge => edge.relation === 'assigned')); checks += 1;
assert.ok(graph.nodes.some(node => node.category === 'project')); checks += 1;
assert.ok(graph.nodes.some(node => node.category === 'system')); checks += 1;
assert.ok(graph.nodes.some(node => node.category === 'section')); checks += 1;
assert.ok(graph.nodes.some(node => node.category === 'formPart')); checks += 1;
assert.ok(graph.nodes.some(node => node.category === 'specialComponent')); checks += 1;

const sectionTarget = ProjectDependencyEngine.resolveTargetId(project, { type: 'section', id: section.id, systemId: system.id });
assert.match(sectionTarget, /^section:/); checks += 1;
const sectionImpact = ProjectDependencyEngine.analyzeImpact(project, sectionTarget);
assert.equal(sectionImpact.target.targetId, section.id); checks += 1;
assert.equal(sectionImpact.target.category, 'section'); checks += 1;
assert.ok(sectionImpact.outgoing.some(item => item.node.category === 'formPart' || item.node.category === 'specialComponent')); checks += 1;
assert.ok(sectionImpact.outputs.some(item => item.id === 'calculation' && item.level === 'direct')); checks += 1;
assert.ok(sectionImpact.outputs.some(item => item.id === 'report')); checks += 1;
assert.ok(sectionImpact.outputs.some(item => item.id === 'revision')); checks += 1;

const formPartTarget = ProjectDependencyEngine.resolveTargetId(project, { type: 'formPart', id: formPart.id, systemId: system.id });
const formPartImpact = ProjectDependencyEngine.analyzeImpact(project, formPartTarget);
assert.equal(formPartImpact.target.targetId, formPart.id); checks += 1;
assert.ok(formPartImpact.incoming.some(item => item.node.category === 'section')); checks += 1;
assert.ok(formPartImpact.outputs.some(item => item.id === 'calculation')); checks += 1;

const specialTarget = ProjectDependencyEngine.resolveTargetId(project, { type: 'specialComponent', id: special.id, systemId: system.id });
const specialImpact = ProjectDependencyEngine.analyzeImpact(project, specialTarget);
assert.equal(specialImpact.target.targetId, special.id); checks += 1;
assert.ok(specialImpact.outputs.some(item => item.id === 'schematic')); checks += 1;

const clean = ProjectDependencyEngine.analyzeConflicts(project);
assert.equal(clean.counts.critical, 0); checks += 1;
assert.ok(clean.score >= 90); checks += 1;

const malformed = structuredClone(project);
const malformedSystem = malformed.systems[0];
malformedSystem.sections[1].id = malformedSystem.sections[0].id;
malformedSystem.sections[1].name = malformedSystem.sections[0].name;
malformedSystem.formParts[0].sectionId = 'missing-section';
malformedSystem.specialComponents[0].sectionId = '';
malformedSystem.formParts.push({ ...malformedSystem.formParts[1], name: 'Duplikat', id: malformedSystem.formParts[1].id });
malformed.workflow = { taskCenter: { manualTasks: [{ id: 'task-orphan', title: 'Verwaiste Aufgabe', systemId: malformedSystem.id, sectionId: 'missing-section' }] } };
malformed.revisionSnapshots = [{ id: 'rev-invalid', revision: 'X', systemId: 'missing-system' }];
malformed.simulationVariants = [{ id: 'var-invalid', name: 'Altvariante', systemId: 'missing-system' }];
const conflicts = ProjectDependencyEngine.analyzeConflicts(malformed);
assert.ok(conflicts.counts.critical >= 3); checks += 1;
assert.ok(conflicts.counts.warning >= 3); checks += 1;
assert.ok(conflicts.counts.info >= 2); checks += 1;
assert.ok(conflicts.score < clean.score); checks += 1;
assert.ok(conflicts.findings.some(item => item.code === 'DUPLICATE_SECTION_ID')); checks += 1;
assert.ok(conflicts.findings.some(item => item.code === 'DUPLICATE_SECTION_NAME')); checks += 1;
assert.ok(conflicts.findings.some(item => item.code === 'FORMPART_INVALID_REFERENCE')); checks += 1;
assert.ok(conflicts.findings.some(item => item.code === 'SPECIAL_UNASSIGNED')); checks += 1;
assert.ok(conflicts.findings.some(item => item.code === 'DUPLICATE_FORMPART_ID')); checks += 1;
assert.ok(conflicts.findings.some(item => item.code === 'TASK_INVALID_SECTION')); checks += 1;
assert.ok(conflicts.findings.some(item => item.code === 'REVISION_INVALID_SYSTEM')); checks += 1;
assert.ok(conflicts.findings.some(item => item.code === 'VARIANT_INVALID_SYSTEM')); checks += 1;

const options = ProjectDependencyEngine.getTargetOptions(project);
assert.ok(options.some(item => item.category === 'project')); checks += 1;
assert.ok(options.some(item => item.category === 'section' && item.value === sectionTarget)); checks += 1;
assert.ok(options.some(item => item.category === 'formPart')); checks += 1;
assert.ok(options.some(item => item.category === 'specialComponent')); checks += 1;

const model = ProjectDependencyEngine.analyze(project, { targetNodeId: sectionTarget });
assert.equal(model.targetNodeId, sectionTarget); checks += 1;
assert.ok(model.summary.nodes > 0); checks += 1;
assert.ok(model.summary.links > 0); checks += 1;
assert.equal(model.impact.target.targetId, section.id); checks += 1;
assert.match(model.disclaimer, /ersetzt keine fachliche/); checks += 1;

const csv = ProjectDependencyEngine.createCsv(malformed, ProjectDependencyEngine.analyze(malformed, { targetNodeId: sectionTarget }));
assert.match(csv, /Abhängigkeiten und Konfliktprüfung/); checks += 1;
assert.match(csv, /Strukturkonflikte/); checks += 1;
assert.match(csv, /DUPLICATE_SECTION_ID/); checks += 1;
assert.match(csv, /Änderungsfolgen/); checks += 1;
assert.match(ProjectDependencyEngine.createFileName(project), /Abhaengigkeiten_Konflikte\.csv$/); checks += 1;
assert.equal(ProjectDependencyEngine.categoryLabel('special'), 'Sonderbauteil'); checks += 1;

console.log(`Phase 39.00 Abhängigkeiten/Änderungsfolgen: ${checks} Prüfungen bestanden.`);
