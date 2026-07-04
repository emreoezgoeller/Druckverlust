/**
 * Druckverlust Pro – ProjectSchema
 * Version 0.3.3
 *
 * Einheitliches Projektformat für .dp-Dateien.
 */
export const PROJECT_SCHEMA_VERSION = '0.3.3';

export function createEmptyProject() {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      application: 'Druckverlust Pro'
    },
    project: {
      name: 'Neues Projekt',
      object: '',
      system: 'Lüftungsanlage',
      editor: 'Emre Özgöller',
      date: new Date().toISOString().slice(0, 10),
      rho: 1.21,
      lambda: 0.025
    },
    rows: [],
    parts: [],
    specials: []
  };
}

export function normalizeProject(raw = {}) {
  const base = createEmptyProject();
  return {
    ...base,
    ...raw,
    meta: { ...base.meta, ...(raw.meta || {}), updatedAt: new Date().toISOString() },
    project: { ...base.project, ...(raw.project || {}) },
    rows: Array.isArray(raw.rows) ? raw.rows : [],
    parts: Array.isArray(raw.parts) ? raw.parts : [],
    specials: Array.isArray(raw.specials) ? raw.specials : []
  };
}
