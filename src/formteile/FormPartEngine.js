// Druckverlust Pro – FormPartEngine
// Verwaltung und Zuordnung von Formteilen zu Teilstrecken.

export class FormPartEngine {
  constructor(formParts = []) {
    this.formParts = Array.isArray(formParts) ? formParts : [];
  }

  addFormPart(part = {}) {
    const formPart = {
      id: part.id || crypto.randomUUID(),
      name: part.name || 'Formteil',
      category: part.category || 'Allgemein',
      sectionId: part.sectionId || part.targetSectionId || '',
      zeta: Number(part.zeta ?? 0),
      parameters: part.parameters || {},
      image: part.image || '',
      note: part.note || '',
      createdAt: new Date().toISOString(),
    };

    this.formParts.push(formPart);
    return formPart;
  }

  removeFormPart(id) {
    this.formParts = this.formParts.filter(part => part.id !== id);
    return this.formParts;
  }

  getBySection(sectionId) {
    return this.formParts.filter(part => part.sectionId === sectionId);
  }

  sumZetaBySection(sectionId) {
    return this.getBySection(sectionId)
      .reduce((sum, part) => sum + Number(part.zeta || 0), 0);
  }

  getAll() {
    return this.formParts;
  }

  clear() {
    this.formParts = [];
  }
}

export default FormPartEngine;