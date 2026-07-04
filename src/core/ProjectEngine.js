/* Druckverlust Pro – ProjectEngine v0.4.1 */
(function (global) {
  'use strict';

  function recalc(project) {
    const DP = global.DruckverlustPro || {};
    if (!DP.CalculationEngine) throw new Error('CalculationEngine fehlt.');
    return DP.CalculationEngine.calculateProject(project, project.settings || {});
  }

  function addSection(project, data) {
    const schema = global.DruckverlustPro.ProjectSchema;
    const item = schema.createSection(data);
    schema.addItem(project, item);
    return item;
  }

  function addSpecial(project, data) {
    const schema = global.DruckverlustPro.ProjectSchema;
    const item = schema.createSpecial(data);
    schema.addItem(project, item);
    return item;
  }

  function findSection(project, sectionId) {
    return (project.items || []).find((item) => item.id === sectionId && item.kind === 'section') || null;
  }

  function assignFormPart(project, sectionId, formPartId, params = {}) {
    const DP = global.DruckverlustPro || {};
    const section = findSection(project, sectionId);
    const formPart = DP.FormPartRegistry.byId(formPartId);
    if (!section) throw new Error(`Teilstrecke nicht gefunden: ${sectionId}`);
    if (!formPart) throw new Error(`Formteil nicht gefunden: ${formPartId}`);
    const result = DP.FormPartEngine.calculate(formPartId, params);
    DP.FormPartEngine.assignToSection(section, formPart, params, result);
    project.updatedAt = new Date().toISOString();
    return { section, formPart, result };
  }

  const ProjectEngine = { recalc, addSection, addSpecial, findSection, assignFormPart };
  global.DruckverlustPro = global.DruckverlustPro || {};
  global.DruckverlustPro.ProjectEngine = ProjectEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = ProjectEngine;
})(typeof window !== 'undefined' ? window : globalThis);
