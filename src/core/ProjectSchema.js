/* Druckverlust Pro – ProjectSchema v0.4.1 */
(function (global) {
  'use strict';

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function createProject(meta = {}) {
    return {
      schemaVersion: '0.4.1',
      app: 'Druckverlust Pro',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      meta: {
        projectName: meta.projectName || meta.projekt || '',
        objectName: meta.objectName || meta.objekt || '',
        systemName: meta.systemName || meta.anlage || '',
        editor: meta.editor || meta.bearbeiter || '',
        date: meta.date || new Date().toLocaleDateString('de-CH')
      },
      settings: {
        rho: Number(meta.rho) || 1.2,
        lambda: Number(meta.lambda) || 0.025
      },
      items: []
    };
  }

  function createSection(data = {}) {
    return {
      id: data.id || uid('ts'),
      kind: 'section',
      type: data.type || 'rect',
      description: data.description || '',
      volume: Number(data.volume || 0),
      width: Number(data.width || 0),
      height: Number(data.height || 0),
      diameter: Number(data.diameter || 0),
      length: Number(data.length || 1.25),
      formParts: Array.isArray(data.formParts) ? data.formParts : [],
      zetaSum: Number(data.zetaSum || 0),
      note: data.note || ''
    };
  }

  function createSpecial(data = {}) {
    return {
      id: data.id || uid('sb'),
      kind: 'sonderbauteil',
      type: 'special',
      description: data.description || data.name || 'Sonderbauteil',
      pressure: Number(data.pressure || 0),
      amount: Number(data.amount || 1),
      note: data.note || ''
    };
  }

  function addItem(project, item) {
    project.items.push(item);
    project.updatedAt = new Date().toISOString();
    return project;
  }

  function updateSectionZeta(section) {
    section.zetaSum = (section.formParts || []).reduce((sum, part) => sum + (Number(part.zeta) || 0), 0);
    return section;
  }

  const ProjectSchema = { uid, createProject, createSection, createSpecial, addItem, updateSectionZeta };
  global.DruckverlustPro = global.DruckverlustPro || {};
  global.DruckverlustPro.ProjectSchema = ProjectSchema;
  if (typeof module !== 'undefined' && module.exports) module.exports = ProjectSchema;
})(typeof window !== 'undefined' ? window : globalThis);
