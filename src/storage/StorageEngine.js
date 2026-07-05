export class StorageEngine {
  static extension = '.dvp';

  static serialize(project) {
    return JSON.stringify({
      fileType: 'DruckverlustPro',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      project
    }, null, 2);
  }

  static parse(text) {
    const data = JSON.parse(text);

    if (data.fileType !== 'DruckverlustPro') {
      throw new Error('Keine gültige Druckverlust-Projektdatei.');
    }

    return data.project;
  }

  static createFileName(project, fallback = 'Druckverlust-Projekt') {
    const name =
      project?.name ||
      project?.object ||
      fallback;

    const safeName = String(name)
      .replace(/[^\wäöüÄÖÜß-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return `${safeName || fallback}${this.extension}`;
  }

  static download(project) {
    if (!project) {
      throw new Error('Kein Projekt zum Speichern vorhanden.');
    }

    const json = this.serialize(project);
    const blob = new Blob([json], {
      type: 'application/json'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = this.createFileName(project);
    link.click();

    URL.revokeObjectURL(link.href);
  }

  static openFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Keine Datei ausgewählt.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try {
          resolve(this.parse(reader.result));
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, 'utf-8');
    });
  }

  static readFile(file) {
    return this.openFile(file);
  }
}

export default StorageEngine;