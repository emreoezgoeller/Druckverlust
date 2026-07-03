/* Druckverlust Pro – ProjectSchema 0.3.2 */
'use strict';

export const PROJECT_SCHEMA_VERSION = '0.3.2';

export function createEmptyProject() {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    meta: {
      name: 'Neues Projekt',
      object: '',
      system: 'Lüftungsanlage',
      editor: 'Emre Özgöller',
      date: new Date().toISOString().slice(0, 10)
    },
    settings: {
      rho: 1.21,
      lambda: 0.025
    },
    sections: [],
    formParts: []
  };
}

export function migrateProject(rawProject) {
  if (!rawProject || typeof rawProject !== 'object') return createEmptyProject();
  return {
    ...createEmptyProject(),
    ...rawProject,
    meta: { ...createEmptyProject().meta, ...(rawProject.meta || rawProject.project || {}) },
    settings: { ...createEmptyProject().settings, ...(rawProject.settings || {}) },
    sections: Array.isArray(rawProject.sections) ? rawProject.sections : (rawProject.rows || []),
    formParts: Array.isArray(rawProject.formParts) ? rawProject.formParts : (rawProject.parts || [])
  };
}
