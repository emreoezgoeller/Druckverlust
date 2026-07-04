export class StorageEngine {
  static extension = '.dp';

  static serialize(project) {
    return JSON.stringify(project, null, 2);
  }

  static parse(text) {
    const data = JSON.parse(text);
    if (!data.project && !data.rows) throw new Error('Keine gültige Druckverlust-Projektdatei.');
    return data;
  }

  static download(project, filename = 'Druckverlust-Projekt.dp') {
    const safeName = filename.endsWith(this.extension) ? filename : filename + this.extension;
    const blob = new Blob([this.serialize(project)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = safeName;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

export default StorageEngine;
