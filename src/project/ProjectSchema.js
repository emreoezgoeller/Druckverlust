export const PROJECT_SCHEMA_VERSION = '0.3.4';

export function createProject(overrides = {}) {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    meta: {
      app: 'Druckverlust Pro',
      author: 'Emre Özgöller',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    project: {
      name: 'Musterprojekt',
      object: '',
      system: 'Lüftungsanlage',
      editor: 'Emre Özgöller',
      date: new Date().toISOString().slice(0, 10),
      rho: 1.21,
      lambda: 0.025
    },
    sections: [],
    formParts: [],
    notes: [],
    ...overrides
  };
}

export function createSection(overrides = {}) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    type: 'duct',
    ts: '',
    description: '',
    q: 0,
    b: 0,
    h: 0,
    d: 0,
    l: 0,
    pa: 0,
    ...overrides
  };
}

export function createFormPart(overrides = {}) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    sectionId: '',
    formPartId: '',
    name: '',
    category: '',
    zeta: 0,
    values: {},
    ...overrides
  };
}
