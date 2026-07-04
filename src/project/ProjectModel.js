// Druckverlust Pro – ProjectModel
// Zentrales Datenmodell für Projekte, Anlagen, Teilstrecken, Formteile und Sonderbauteile.

export function createProject(data = {}) {
  return {
    meta: {
      version: data.meta?.version || '0.5.0',
      createdAt: data.meta?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    project: {
      name: data.project?.name || '',
      object: data.project?.object || '',
      system: data.project?.system || '',
      customer: data.project?.customer || '',
      editor: data.project?.editor || 'Emre Özgöller',
      date: data.project?.date || new Date().toISOString().slice(0, 10),
      notes: data.project?.notes || '',
    },

    settings: {
      rho: Number(data.settings?.rho ?? 1.21),
      lambda: Number(data.settings?.lambda ?? 0.025),
      sectionRoundingStep: Number(data.settings?.sectionRoundingStep ?? 0.5),
    },

    systems: data.systems || [
      {
        id: 'anlage-1',
        name: 'Lüftungsanlage',
        type: 'Zuluft',
        sections: [],
        formParts: [],
        specialComponents: [],
      },
    ],
  };
}

export function createSection(data = {}) {
  return {
    id: data.id || crypto.randomUUID(),
    type: data.type || 'duct', // duct | pipe | special
    ts: data.ts || '',
    description: data.description || '',
    q: Number(data.q ?? 0),
    b: Number(data.b ?? data.width ?? 0),
    h: Number(data.h ?? data.height ?? 0),
    d: Number(data.d ?? data.diameter ?? 0),
    l: Number(data.l ?? data.length ?? 0),
    zeta: Number(data.zeta ?? data.zetaSum ?? 0),
    pressureLoss: Number(data.pressureLoss ?? 0),
  };
}

export function createFormPart(data = {}) {
  return {
    id: data.id || crypto.randomUUID(),
    sectionId: data.sectionId || '',
    name: data.name || 'Formteil',
    category: data.category || 'Allgemein',
    zeta: Number(data.zeta ?? 0),
    parameters: data.parameters || {},
    image: data.image || '',
    note: data.note || '',
  };
}

export function createSpecialComponent(data = {}) {
  return {
    id: data.id || crypto.randomUUID(),
    name: data.name || 'Sonderbauteil',
    type: data.type || '',
    manufacturer: data.manufacturer || '',
    q: Number(data.q ?? 0),
    pressureLoss: Number(data.pressureLoss ?? data.dp ?? 0),
    note: data.note || '',
  };
}

export function getDefaultSystem(project) {
  return project.systems?.[0] || null;
}

export default {
  createProject,
  createSection,
  createFormPart,
  createSpecialComponent,
  getDefaultSystem,
};